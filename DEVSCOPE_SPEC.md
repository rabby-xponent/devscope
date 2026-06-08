# DevScope — Project Specification
> Version 1.0 · June 2026 · Author: Golam Rabby

---

## Table of Contents
1. [Problem & Vision](#1-problem--vision)
2. [Users](#2-users)
3. [Feature Scope (MVP)](#3-feature-scope-mvp)
4. [Non-Features](#4-non-features)
5. [Success Metrics](#5-success-metrics)
6. [System Architecture](#6-system-architecture)
7. [Data Models](#7-data-models)
8. [Agent Design](#8-agent-design)
9. [Streaming Protocol (SSE)](#9-streaming-protocol-sse)
10. [API Contract](#10-api-contract)
11. [Frontend Pages](#11-frontend-pages)
12. [Tech Decisions](#12-tech-decisions)
13. [Project Structure](#13-project-structure)
14. [Build Order](#14-build-order)
15. [External APIs & Rate Limits](#15-external-apis--rate-limits)

---

## 1. Problem & Vision

### The problem
A developer's GitHub profile is a flat list of repos. It tells you what they've built, but not who they are as an engineer — their depth, their growth trajectory, their communication style, their impact.

Hiring managers spend under 2 minutes reviewing a GitHub profile. Developers applying for jobs or freelance work have no good way to present their public technical footprint as a coherent narrative.

### The vision
DevScope is a GitHub developer intelligence agent. You give it a username. It investigates the developer's entire public presence — repos, commits, READMEs, Hacker News mentions, blog posts — and synthesizes a structured, shareable developer profile that reads like it was written by a senior engineer who spent a week studying the person.

The profile is a real URL you can share. The generation process is visible — a live trace shows the agent calling tools and reasoning in real-time. That trace is the product differentiator.

### One-sentence pitch
> *"Put in a GitHub username. Get back a developer intelligence report in under a minute."*

---

## 2. Users

### Primary — The developer being profiled
- Job seekers who want something shareable beyond a LinkedIn link
- Freelancers pitching to clients
- Developers who want objective feedback on how their public presence looks

**Core need:** "Tell me how I look to a senior engineer or recruiter who's never heard of me."

### Secondary — The evaluator
- Hiring managers doing initial candidate research
- Tech leads deciding who to reach out to for collaboration
- Developers wanting to understand a potential collaborator

**Core need:** "Give me a fast, structured read on this person's technical depth and style."

### Tertiary — The curious developer
- Anyone who discovers the tool and runs it on well-known engineers (Linus, DHH, etc.)
- This user drives organic growth and virality

---

## 3. Feature Scope (MVP)

### F1 — Profile generation
- User enters a GitHub username on the landing page
- Agent runs and produces a structured profile
- Generation takes 30–90 seconds (acceptable for this depth)

### F2 — Live agent trace (the differentiator)
- During generation, a sidebar streams every tool call in real-time
- Shows: which tool was called, what input, a summary of what was found
- Collapses after generation completes; expandable on demand
- This is what makes DevScope look like real AI engineering, not a ChatGPT wrapper

### F3 — Profile page
Sections (in order):
1. **Header** — avatar, name, headline (agent-written), GitHub stats
2. **Summary** — 2–3 paragraph narrative overview
3. **Expertise map** — primary languages and domains with confidence levels
4. **Tech evolution** — how their stack has changed over time
5. **Open source impact** — star counts, fork counts, top repos
6. **Communication style** — based on README quality, issue responses, docs
7. **Highlights** — 3–5 notable repos with agent-written descriptions
8. **Web presence** — HN mentions, blog posts, DEV.to
9. **Strengths & growth areas** — honest, specific observations

### F4 — Shareable URL
- Profile lives at `/profile/:username`
- First load triggers generation; subsequent loads serve cache
- Cache is per-username, TTL 24 hours
- No login required to view a cached profile

### F5 — Regenerate
- A "regenerate" button forces the agent to re-run (bypasses cache)
- Useful if the developer has updated their repos since last generation

---

## 4. Non-Features

These are explicitly out of scope for MVP. Document them to avoid scope creep.

| Feature | Why excluded |
|---|---|
| User accounts / authentication | Adds significant complexity; shareable URLs don't need auth |
| Private repo analysis | Requires OAuth, user consent flow — Phase 2 |
| Developer comparison (A vs B) | Interesting but doubles complexity |
| PDF export | Nice-to-have; added in Phase 2 |
| Email digest / alerts | Requires infra (email service, scheduler) |
| Paid tiers / rate limiting per user | Phase 2 monetization concern |
| Team/org analysis | Separate product surface |
| Comments or reactions on profiles | Social features, Phase 2 |

---

## 5. Success Metrics

| Metric | Target |
|---|---|
| Profile generation time (p50) | < 60 seconds |
| Agent tool call count per profile | 8–14 calls (enough depth, not excessive) |
| Cached profile load time | < 800ms |
| Profile completeness | All 9 sections populated for any profile with > 5 public repos |
| Error rate | < 5% on valid GitHub usernames |
| Token cost per generation | < $0.05 (Sonnet pricing) |

---

## 6. System Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
│         Next.js frontend (pages + components)            │
└────────────────────┬───────────────┬────────────────────┘
                     │ SSE stream    │ REST (cached)
                     ▼               ▼
┌─────────────────────────────────────────────────────────┐
│               Express API Server                         │
│  /api/generate  (SSE)   /api/profile/:username (JSON)   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  AgentService                            │
│   ReAct loop · Anthropic SDK · Tool orchestration        │
└───┬──────────────┬──────────────┬───────────────────────┘
    │              │              │
    ▼              ▼              ▼
GitHub API    HN Algolia     DEV.to API
(REST, token) (free, no key) (free, no key)
    │
    ▼
 File cache
./cache/profiles/
  username.json
```

### Request lifecycle — first visit

1. User enters `torvalds` → browser navigates to `/profile/torvalds`
2. Next.js page component opens an `EventSource` to `GET /api/generate?username=torvalds`
3. Express checks file cache → miss → starts AgentService
4. Agent begins ReAct loop; each tool call + result is streamed as an SSE event
5. Agent finishes → final `complete` event carries the full profile JSON
6. Express saves profile to `./cache/profiles/torvalds.json`
7. Frontend renders the profile from the streamed data; hides trace sidebar

### Request lifecycle — returning visit

1. User visits `/profile/torvalds`
2. Next.js page makes a `GET /api/profile/torvalds`
3. Express reads `./cache/profiles/torvalds.json` → responds immediately (< 50ms)
4. Page renders instantly with no SSE connection needed

### Cache invalidation

- Check `mtime` of the cache file
- If older than 24 hours → treat as miss → re-run agent
- "Regenerate" button → client sends `?force=true` → always re-runs

---

## 7. Data Models

### DevProfile (the canonical output)

```typescript
interface DevProfile {
  // Metadata
  username: string
  generatedAt: string          // ISO timestamp
  cacheVersion: number         // bump this to invalidate old caches

  // Raw GitHub data (stored for rendering, not AI-generated)
  github: {
    name: string
    avatarUrl: string
    bio: string | null
    company: string | null
    location: string | null
    websiteUrl: string | null
    followers: number
    following: number
    publicRepos: number
    joinedYear: number
    totalStars: number         // sum across all repos
    totalForks: number
  }

  // Agent-synthesized fields (all strings are prose, written by Claude)
  headline: string             // "Full-stack TypeScript engineer with a focus on dev tools"
  summary: string              // 2–3 paragraph narrative

  expertise: {
    language: string
    level: 'primary' | 'secondary' | 'occasional'
    evidence: string           // "14 repos, 3 major projects"
  }[]

  techEvolution: string        // Narrative: "Started with PHP in 2018, shifted to Go by 2021..."

  openSourceImpact: {
    narrative: string          // Agent-written summary
    topRepos: {
      name: string
      description: string      // Agent-written, not the repo description
      stars: number
      language: string
      why: string              // Why this repo is notable
    }[]
  }

  communicationStyle: string   // "Writes thorough READMEs, responds to issues quickly..."

  webPresence: {
    hackerNews: string | null  // Summary of HN activity/mentions
    blog: string | null        // Blog/DEV.to presence
    other: string | null
  }

  strengths: string[]          // 3–5 specific, evidence-backed strengths
  growthAreas: string[]        // 2–3 honest, constructive observations

  // Trace (stored but not shown on cached load by default)
  agentTrace: TraceEvent[]
}

interface TraceEvent {
  type: 'tool_call' | 'tool_result' | 'thinking'
  timestamp: string
  tool?: string
  input?: Record<string, unknown>
  summary?: string             // Human-readable 1-line summary of what was found
  thinking?: string            // Claude's reasoning text (if extended thinking enabled)
}
```

---

## 8. Agent Design

### System prompt

```
You are DevScope, a developer intelligence agent. Your job is to build a 
thorough, honest, and specific profile of a GitHub developer.

Use the available tools to gather evidence. Be specific — cite repo names, 
star counts, commit patterns, README quality. Avoid generic praise.

When you have gathered enough evidence (typically 8-12 tool calls), produce 
the final profile as a JSON object matching the DevProfile schema exactly.
Return ONLY the JSON — no markdown, no explanation.

Principles:
- Be specific, not generic ("writes clear READMEs with working examples" 
  not "good communicator")
- Be honest — if repos are mostly forks with no commits, say so
- Evidence-based — every claim must trace to something you observed
- Constructive — growth areas should be actionable, not harsh
```

### Tool definitions

```typescript
const tools = [
  {
    name: 'get_github_profile',
    description: 'Fetch basic GitHub user profile: name, bio, followers, join date, public repo count.',
    input_schema: {
      type: 'object',
      properties: { username: { type: 'string' } },
      required: ['username']
    }
  },
  {
    name: 'get_repos',
    description: 'List public repos for a user, sorted by stars. Returns name, description, language, stars, forks, pushed_at.',
    input_schema: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        page: { type: 'number', description: 'Page number, 30 repos per page. Start at 1.' }
      },
      required: ['username', 'page']
    }
  },
  {
    name: 'get_repo_readme',
    description: 'Fetch the README content of a specific repo. Use this on top repos to assess documentation quality.',
    input_schema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' }
      },
      required: ['owner', 'repo']
    }
  },
  {
    name: 'get_contribution_stats',
    description: 'Get commit activity stats for a user across their repos. Returns total commits, active days, longest streak.',
    input_schema: {
      type: 'object',
      properties: { username: { type: 'string' } },
      required: ['username']
    }
  },
  {
    name: 'get_pinned_repos',
    description: 'Get the repos a user has pinned on their profile. These are what the developer considers their best work.',
    input_schema: {
      type: 'object',
      properties: { username: { type: 'string' } },
      required: ['username']
    }
  },
  {
    name: 'search_hackernews',
    description: 'Search Hacker News for mentions of a developer (by username or real name). Reveals community reputation.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query']
    }
  },
  {
    name: 'search_devto',
    description: 'Search DEV.to for articles by this developer. Reveals writing and communication habits.',
    input_schema: {
      type: 'object',
      properties: { username: { type: 'string' } },
      required: ['username']
    }
  },
  {
    name: 'web_search',
    description: 'General web search. Use for finding blog posts, conference talks, or other public presence.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query']
    }
  }
]
```

### Typical agent run (expected flow)

```
Turn 1:  get_github_profile(username)
Turn 2:  get_repos(username, 1)
Turn 3:  get_pinned_repos(username)
Turn 4:  get_repo_readme(owner, top_repo_1)
Turn 5:  get_repo_readme(owner, top_repo_2)
Turn 6:  get_contribution_stats(username)
Turn 7:  search_hackernews(name_or_username)
Turn 8:  search_devto(username)
Turn 9:  web_search("username developer blog")
Turn 10: get_repos(username, 2)   [if repo count > 30]
→ end_turn: emit final JSON
```

Total: ~10 tool calls. At ~3,000 tokens per call, that's ~30k tokens per run.
Cost estimate: ~$0.03–$0.05 per profile at Sonnet pricing.

---

## 9. Streaming Protocol (SSE)

The Express endpoint `GET /api/generate?username=:username` streams Server-Sent Events.

### Event types

```
# Agent called a tool
event: tool_call
data: {"tool":"get_repos","input":{"username":"torvalds","page":1},"ts":"2026-06-08T10:00:01Z"}

# Tool returned a result
event: tool_result  
data: {"tool":"get_repos","summary":"Found 42 repos. Top: linux (★189k), subsurface (★2.1k)","ts":"2026-06-08T10:00:02Z"}

# Agent is thinking (extended thinking mode, optional)
event: thinking
data: {"text":"This developer clearly has deep systems programming expertise...","ts":"..."}

# Generation complete
event: complete
data: {"profile":{...full DevProfile JSON...},"ts":"..."}

# Something went wrong
event: error
data: {"message":"GitHub API rate limit exceeded. Try again in 60s.","ts":"..."}
```

### Frontend consumption

```typescript
// In Next.js page component
const source = new EventSource(`/api/generate?username=${username}`)

source.addEventListener('tool_call', (e) => {
  const data = JSON.parse(e.data)
  appendToTrace({ type: 'tool_call', ...data })
})

source.addEventListener('tool_result', (e) => {
  const data = JSON.parse(e.data)
  appendToTrace({ type: 'tool_result', ...data })
})

source.addEventListener('complete', (e) => {
  const { profile } = JSON.parse(e.data)
  setProfile(profile)
  source.close()
})

source.addEventListener('error', (e) => {
  setError(JSON.parse(e.data).message)
  source.close()
})
```

---

## 10. API Contract

### `GET /api/generate?username=:username&force=:bool`

Opens an SSE stream. Streams tool_call, tool_result, thinking, complete, or error events.

- `username` — required, GitHub username
- `force` — optional, default `false`. If `true`, bypasses cache and re-runs agent.

**Errors (sent as SSE `error` events, then connection closed):**
- Username not found on GitHub → `"GitHub user not found"`
- GitHub API rate limit → `"GitHub API rate limited. Retry after Xs"`
- Agent loop exceeded max iterations → `"Analysis timed out. Try again."`

### `GET /api/profile/:username`

Returns a cached DevProfile JSON or 404.

**Response 200:**
```json
{
  "cached": true,
  "cachedAt": "2026-06-08T09:00:00Z",
  "profile": { ...DevProfile }
}
```

**Response 404:**
```json
{ "error": "Profile not found. Generate it first." }
```

### `GET /api/health`

Returns `{ "status": "ok", "timestamp": "..." }`

---

## 11. Frontend Pages

### `/` — Landing page

- Clean, minimal. A text input for GitHub username, a "Generate" button.
- On submit → navigate to `/profile/:username`
- Show a few example profiles (pre-generated, clickable) to give immediate value
- No auth, no signup

### `/profile/:username` — Profile page

**State machine:**

```
[loading-check]
    │
    ├─ cache hit  → [render-cached] → done
    │
    └─ cache miss → [connecting]
                        │
                        ▼
                    [streaming]  ← SSE events coming in
                        │   ↑
                        │   └── trace sidebar updates live
                        │
                        ▼
                    [complete] → [render-profile]
                        │
                        └─ [error] → show error state + retry button
```

**Layout (two-column during streaming, single-column after):**

```
┌──────────────────────────────┬─────────────────┐
│                              │   Agent trace   │
│   Profile (building up...)   │   ─────────     │
│                              │  ✓ get_profile  │
│                              │  ✓ get_repos    │
│                              │  ⟳ get_readme.. │
│                              │                 │
└──────────────────────────────┴─────────────────┘

After complete:
┌────────────────────────────────────────────────┐
│              Full profile (single col)          │
│       [View agent trace ↓] (collapsible)        │
└────────────────────────────────────────────────┘
```

---

## 12. Tech Decisions

### Decision 1: Express + Next.js (separate processes)

**Why not Next.js API routes for everything?**
Next.js API routes have limitations with long-lived SSE connections, especially on Vercel (60s timeout). Express gives full control over response streaming, connection lifecycle, and memory-resident cache.

**Deployment:** Next.js → Vercel (free tier). Express → Railway or Render (free tier).

### Decision 2: SSE over WebSockets

| | SSE | WebSocket |
|---|---|---|
| Direction | Server → Client (unidirectional) | Bidirectional |
| Browser support | Native `EventSource` API | Needs library |
| Reconnect | Automatic | Manual |
| Complexity | Low | Medium |
| Fit for this use case | ✅ Perfect | Overkill |

This is unidirectional streaming only. SSE is the right tool.

### Decision 3: Raw Anthropic SDK (no framework)

LangChain and LangGraph add a layer of abstraction between you and the API. For a single-agent system this is cost without benefit — you end up debugging LangChain instead of your actual logic. Raw SDK means:
- You understand every token sent and received
- SSE forwarding is simple (you control the loop)
- Easier to add custom retry/error logic
- No surprise version-breaking changes in a framework

### Decision 4: `claude-sonnet-4-6` as the model

| Model | Speed | Cost | Quality |
|---|---|---|---|
| claude-haiku-4-5 | Fastest | ~$0.01/profile | Too shallow for synthesis |
| claude-sonnet-4-6 | Fast | ~$0.04/profile | ✅ Right balance |
| claude-opus-4-6 | Slow | ~$0.20/profile | Overkill for tool-calling |

Sonnet has strong tool-use performance. The synthesis step (turning raw data into prose) benefits from it over Haiku.

### Decision 5: File-based cache (JSON files)

No Redis. No database. Simple `./cache/profiles/` directory with one file per username. Reasons:
- Zero infrastructure dependency for MVP
- Files are inspectable and manually deletable
- Fast enough (filesystem read is < 5ms)
- Easy to move to Redis later by swapping one function

### Decision 6: GitHub token (server-side, no OAuth)

We do not ask users to authenticate with GitHub. A single server-side `GITHUB_TOKEN` in env gives 5,000 requests/hour, which is plenty for MVP traffic. Private repo analysis is a Phase 2 feature that would require OAuth.

### Decision 7: No database for MVP

All state is: file cache + in-flight SSE connections. No Postgres, no MongoDB. This keeps the deploy simple (no managed DB cost) and is correct for MVP scale.

---

## 13. Project Structure

```
devscope/
├── frontend/                      # Next.js app
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── profile/
│   │   │   └── [username]/
│   │   │       └── page.tsx       # Profile page
│   │   └── layout.tsx
│   ├── components/
│   │   ├── UsernameInput.tsx
│   │   ├── ProfileCard.tsx
│   │   ├── AgentTrace.tsx         # The live trace sidebar
│   │   ├── ExpertiseMap.tsx
│   │   ├── RepoHighlight.tsx
│   │   └── SkeletonProfile.tsx    # Loading state
│   ├── hooks/
│   │   └── useDevScopeStream.ts   # SSE connection hook
│   ├── types/
│   │   └── profile.ts             # DevProfile interface
│   └── package.json
│
├── backend/                       # Express API
│   ├── src/
│   │   ├── index.ts               # Express app setup
│   │   ├── routes/
│   │   │   ├── generate.ts        # GET /api/generate (SSE)
│   │   │   └── profile.ts         # GET /api/profile/:username
│   │   ├── agent/
│   │   │   ├── agent.service.ts   # ReAct loop
│   │   │   ├── tools/
│   │   │   │   ├── definitions.ts
│   │   │   │   ├── github.tool.ts
│   │   │   │   ├── hackernews.tool.ts
│   │   │   │   ├── devto.tool.ts
│   │   │   │   └── search.tool.ts
│   │   │   └── prompts.ts         # System prompt
│   │   ├── cache/
│   │   │   └── cache.service.ts   # Read/write JSON cache files
│   │   └── types/
│   │       └── profile.ts         # Shared types (same as frontend)
│   ├── cache/                     # Runtime cache dir (gitignored)
│   │   └── profiles/
│   └── package.json
│
├── shared/
│   └── types/
│       └── profile.ts             # Single source of truth for types
│
└── README.md
```

---

## 14. Build Order

Build in this sequence. Each phase is independently runnable and testable.

### Phase 1 — Backend skeleton (Day 1)
- [ ] Express app with `/api/health`
- [ ] File cache service (read/write)
- [ ] GitHub tool (get_profile, get_repos)
- [ ] Basic agent service: hardcoded 2-tool run, logs output
- Goal: `node index.js` → agent fetches a real profile → logs JSON

### Phase 2 — Full agent (Day 2)
- [ ] All 8 tools implemented
- [ ] Full ReAct loop with MAX_LOOPS guard
- [ ] System prompt finalized
- [ ] Profile JSON matches DevProfile schema
- Goal: running agent produces a complete DevProfile for any username

### Phase 3 — SSE streaming (Day 3)
- [ ] `/api/generate` route with SSE headers
- [ ] Agent emits events during loop (tool_call, tool_result, complete, error)
- [ ] Cache write on completion
- [ ] `/api/profile/:username` route reads cache
- Goal: `curl --no-buffer` shows events streaming in real-time

### Phase 4 — Next.js frontend (Days 4–6)
- [ ] Landing page with input
- [ ] `useDevScopeStream` hook (EventSource + state)
- [ ] Profile page skeleton → populates as events arrive
- [ ] AgentTrace sidebar (live-updating list)
- [ ] Cached profile fast-load path
- Goal: full end-to-end works in browser

### Phase 5 — Polish (Days 7–8)
- [ ] Error states + retry button
- [ ] Regenerate button
- [ ] Mobile responsive layout
- [ ] Loading skeleton while trace is running
- [ ] OG meta tags on profile pages (for sharing)
- [ ] README + live demo URL
- Goal: portfolio-ready, shareable

---

## 15. External APIs & Rate Limits

| API | Auth | Rate limit | Used for |
|---|---|---|---|
| GitHub REST API v3 | Server token (env) | 5,000 req/hr | Profile, repos, README, contributions |
| GitHub GraphQL API | Server token (env) | 5,000 points/hr | Pinned repos (requires GraphQL) |
| HN Algolia API | None | Very generous (unofficial: ~10k/hr) | HN mentions |
| DEV.to API | None for search | 1,000 req/hr | DEV.to articles |
| DuckDuckGo Instant | None | Unofficial, be gentle | Web search fallback |

### GitHub token setup
```bash
# .env (backend)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx        # Personal access token, read:public only
ANTHROPIC_API_KEY=sk-ant-xxxx
CACHE_DIR=./cache/profiles
CACHE_TTL_HOURS=24
PORT=4000
```

**Note on rate limits:** At 10 GitHub API calls per profile, you can generate 500 profiles per hour before hitting the limit. Well above MVP needs.

---

*End of DevScope v1.0 Specification*
