# DevScope Agent Architecture

The agent uses a **two-phase architecture** to stay within LLM token limits (especially on free-tier providers like Groq).

## Problem

A single ReAct loop that keeps full tool results in the message history grows quickly:

- 10–14 tool calls × 400–2000 chars each ≈ 6,000+ input tokens
- The final synthesis call must read all of that context
- Groq free tier caps at ~6,000 TPM — the last call fails

## Solution: Pre-fetch → Compress → Synthesize

```
Phase 1 — GATHER (parallel pre-fetch, no LLM)
  ├── All 11 tools run via Promise.all (~3s)
  ├── Full results stored in collectedData
  └── SSE trace events emitted for each tool

Phase 2 — COMPRESS (deterministic, no LLM)
  └── compressToolData() → ~2,000 char structured summary

Phase 3 — SYNTHESIZE (single LLM call, no tools)
  ├── SYNTHESIS_PROMPT + compressed summary (~1,500 input tokens)
  └── Returns DevProfile JSON
```

The old LLM gather loop called one tool per turn (30+ seconds on free models). Standard evidence is now fetched deterministically.

**Synthesis safeguards** (see also [`LLM.md`](./LLM.md)):

- 45s timeout per provider attempt — fails over instead of waiting 4+ minutes
- OpenRouter uses explicit fast models (`llama-4-maverick:free`), not `openrouter/free` (random reasoning models)
- Expertise languages enforced from aggregated language tool data (no LLM-invented languages)
- HN URL + mention count split into `hackerNews` and `hackerNewsMentions`

## Key files

| File | Role |
|---|---|
| `src/agent/agent.service.ts` | Loop, compression, synthesis orchestration |
| `src/agent/prompts.ts` | `SYNTHESIS_PROMPT` (profile JSON) |
| `src/agent/tools/definitions.ts` | Tool schemas + result summaries |
| `src/agent/tools/executor.ts` | Tool dispatch |
| `src/agent/tools/github.tool.ts` | GitHub API tools including language/activity aggregators |
| `src/llm/llm-gateway.ts` | Multi-provider routing, failover, caching |

## Tools (11 total)

### GitHub
- `get_github_profile` — name, bio, followers, join year
- `get_repos` — public repos sorted by stars (paginated)
- `get_repo_readme` — README content (truncated to 4000 chars)
- `get_contribution_stats` — commits/PRs/issues last year (GraphQL)
- `get_pinned_repos` — pinned showcase repos
- `get_aggregated_languages` — **mandatory** — byte-weighted language percentages
- `get_commit_activity` — **mandatory** — push events, streaks, commit messages
- `get_pr_activity` — **mandatory** — PRs opened/merged, reviews, external contributions

### External
- `search_hackernews` — HN Algolia search
- `search_devto` — DEV.to articles by username
- `web_search` — DuckDuckGo instant answers

## Mandatory tools

The gathering prompt requires these three for recruiter-grade profiles:

1. `get_aggregated_languages` — drives expertise bar percentages
2. `get_commit_activity` — activity, consistency, commit quality signals
3. `get_pr_activity` — collaboration level

## Profile output

The synthesis step produces a `DevProfile` including:

- Narrative fields (headline, summary, tech evolution, etc.)
- `expertise[]` with `percentage` from aggregated languages
- `recruiterPanel` — seniority, activity, standout facts, interview topics, red flags

See `src/types/profile.ts` for the full schema. `CACHE_VERSION` is bumped when the schema changes.

## Performance

| Optimization | Effect |
|---|---|
| Parallel pre-fetch | Profile, repos, languages, activity, contributions, readmes, and web searches run via `Promise.all` before the LLM loop |
| Parallel tool batch | Any extra tools in one LLM turn execute via `Promise.all` |
| Events cache | `get_commit_activity` and `get_pr_activity` share one GitHub events fetch |
| GitHub timeouts | 8s max per GitHub API call via shared `githubAxios` instance |
| README cap | Fetched at 1500 chars (compression uses 300) |
| Model cooldowns | 404/outage models skipped for 5 minutes (no wasted failover) |
| Provider priority | OpenRouter → Groq → DeepSeek → Gemini → Qwen → OpenAI |

Phase timing is logged with `[perf]` prefixes: `pre-fetch`, `gather phase`, `compress`, `synthesis`, `total`.

## Testing

```bash
cd backend
npm run agent:test sindresorhus
```

Expected log flow:

1. Tool gathering calls (truncated in context, full data stored)
2. `[synthesis] compressed context length: N chars` (should be < 3,000)
3. Synthesis thinking event
4. Full profile JSON with `recruiterPanel`

## Tuning

| Constant | Location | Default | Purpose |
|---|---|---|---|
| `CACHE_VERSION` | `agent.service.ts` | 2 | Invalidates stale cached profiles |
| `OPENROUTER_MODEL` | `.env` | — | Free models are slow (~45s synthesis); paid models are faster |
