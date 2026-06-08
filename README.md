# DevScope

> GitHub developer intelligence agent. Point it at a username â€” an AI agent investigates their repos, commits, READMEs, and web presence, then writes a structured developer profile. Watch the agent work in real time.

DevScope is an agentic AI system built on a provider-agnostic ReAct loop (using the OpenAI SDK pointed at any compatible endpoint â€” Multi-provider LLM gateway with automatic failover (Groq -> OpenRouter -> DeepSeek -> Gemini)). The agent calls tools to gather evidence about a developer, then synthesizes everything into a readable profile. The generation process streams live to the browser over Server-Sent Events, so you can watch each tool call as it happens.

![stack](https://img.shields.io/badge/stack-Next.js%20%2B%20Express-f0a04b) ![agent](https://img.shields.io/badge/agent-Gemini%202.5%20Flash-f0a04b) ![cost](https://img.shields.io/badge/cost-free%20tier-3b6d11)

---

## How it works

```
Browser (Next.js)                Express                    Agent loop
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€                â”€â”€â”€â”€â”€â”€â”€                    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
/profile/[username]  â”€â”€SSEâ”€â”€â–¶   /api/generate   â”€â”€â–¶   AgentService (ReAct)
       â”‚                                                      â”‚
       â”‚  live trace                                   â”Œâ”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”
       â—€â”€â”€eventsâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€        â”‚  Gemini /   â”‚ â—€â”€â”€ tool decisions
                                                        â”‚  any LLM    â”‚
                                                        â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜
                                                               â”‚ tool calls
                                          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                                       GitHub API          HN Algolia            DEV.to / web
```

The agent has eleven tools: GitHub profile, repos, README reader, contribution stats, pinned repos, aggregated languages, commit activity, PR activity, Hacker News search, DEV.to search, and web search. It typically makes 10–14 tool calls to gather evidence, then runs a separate synthesis step to write the profile JSON.

The agent uses a **two-phase architecture** (gather → compress → synthesize) so each LLM call stays under token limits on free-tier providers. See [`backend/docs/AGENT.md`](./backend/docs/AGENT.md) for details.

See [`DEVSCOPE_SPEC.md`](./DEVSCOPE_SPEC.md) for the full product and architecture spec.

---

## Project structure

```
devscope/
â”œâ”€â”€ backend/         Express API + agent (TypeScript)
â”‚   â””â”€â”€ src/
â”‚       â”œâ”€â”€ agent/   ReAct loop, tools, system prompt
â”‚       â”œâ”€â”€ routes/  SSE generate route + cached profile route
â”‚       â””â”€â”€ cache/   File-based profile cache
â””â”€â”€ frontend/        Next.js app (App Router)
    â”œâ”€â”€ app/         Landing page + profile page
    â”œâ”€â”€ components/  AgentTrace, ProfileView
    â””â”€â”€ hooks/       useDevScopeStream (EventSource)
```

---

## Local setup

### Prerequisites
- Node.js 18+
- A free Gemini API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)) â€” no credit card
- A GitHub personal access token with `public_repo` read scope

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in GEMINI_API_KEY (or another provider key) and GITHUB_TOKEN in .env
npm run dev          # starts on http://localhost:4000
```

Verify the agent works without the frontend:

```bash
npm run agent:test torvalds
```

This runs the full agent loop in your terminal and prints the generated profile JSON.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev          # starts on http://localhost:3000
```

Open [localhost:3000](http://localhost:3000), enter a GitHub username, and watch the agent work.

---

## Deployment

The two halves deploy independently.

### Backend â†’ Railway or Render

The backend needs a long-lived process for SSE (it can't run on serverless functions with short timeouts).

**Railway:** Connect the repo, set root directory to `backend/`, add env vars for at least one provider key (`GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `DEEPSEEK_API_KEY`, `QWEN_API_KEY`, or `OPENAI_API_KEY`), plus `GITHUB_TOKEN` and `FRONTEND_URL`. The included `railway.toml` handles build and start.

**Render:** The included `render.yaml` defines the service. Point it at `backend/` and add the same env vars.

### Frontend â†’ Vercel

1. Import the repo on Vercel, set root directory to `frontend/`.
2. Add env var `NEXT_PUBLIC_API_URL` = your deployed backend URL.
3. Deploy.

Then update the backend's `FRONTEND_URL` env var to your Vercel domain so CORS allows it.

---

## Environment variables

### Backend (`.env`)
| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Gemini API key |
| `GROQ_API_KEY` | Groq API key |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `DEEPSEEK_API_KEY` | DeepSeek API key |
| `QWEN_API_KEY` | Qwen API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `LLM_PROVIDER_OVERRIDE` | Optional provider pin for testing |
| `LLM_CACHE_ENABLED` | Optional request-level cache toggle |
| `LLM_CACHE_DIR` | Optional cache directory for cached completions |
| `LLM_CACHE_TTL_MINUTES` | Cache lifetime, default 60 |
| `OPENROUTER_HTTP_REFERER` | Optional app URL sent to OpenRouter |
| `OPENROUTER_APP_TITLE` | Optional app title sent to OpenRouter |
| `GITHUB_TOKEN` | GitHub PAT, `public_repo` read scope |
| `PORT` | Default 4000 |
| `FRONTEND_URL` | Allowed CORS origin |
| `CACHE_DIR` | Profile cache directory |
| `CACHE_TTL_HOURS` | Cache lifetime, default 24 |

### Frontend (`.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL of the deployed backend |

---

## Design notes

- **Two-phase agent, no token blow-up.** Tool gathering and profile synthesis are separate. Full tool results are stored in memory; only truncated summaries stay in the LLM message history. A dedicated synthesis call receives a compressed evidence summary (~2K chars).
- **Parallel tool execution.** Independent tools within the same LLM turn run concurrently; GitHub API calls have 8s timeouts.
- **Provider-agnostic, no LangChain.** The LLM gateway in `src/llm/` tries OpenRouter first, then Groq, then others — with per-model cooldowns on 404/outage, failover, and request-level caching.
- **SSE, not WebSockets.** Generation is one-directional serverâ†’client streaming, which is exactly what Server-Sent Events are for.
- **File cache, no database.** One JSON file per username with a 24-hour TTL. Swap in Redis later by changing `cache.service.ts`.
- **Two processes, not one.** Express handles the long-running SSE stream; Next.js handles the UI. They deploy separately.

---

## License

MIT


