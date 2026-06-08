# DevScope

> GitHub developer intelligence agent. Point it at a username — an AI agent investigates their repos, commits, READMEs, and web presence, then writes a structured developer profile. Watch the agent work in real time.

DevScope is an agentic AI system built on a provider-agnostic ReAct loop (using the OpenAI SDK pointed at any compatible endpoint — Gemini by default, free). The agent calls tools to gather evidence about a developer, then synthesizes everything into a readable profile. The generation process streams live to the browser over Server-Sent Events, so you can watch each tool call as it happens.

![stack](https://img.shields.io/badge/stack-Next.js%20%2B%20Express-f0a04b) ![agent](https://img.shields.io/badge/agent-Gemini%202.5%20Flash-f0a04b) ![cost](https://img.shields.io/badge/cost-free%20tier-3b6d11)

---

## How it works

```
Browser (Next.js)                Express                    Agent loop
─────────────────                ───────                    ──────────
/profile/[username]  ──SSE──▶   /api/generate   ──▶   AgentService (ReAct)
       │                                                      │
       │  live trace                                   ┌──────┴──────┐
       ◀──events───────────────────────────────        │  Gemini /   │ ◀── tool decisions
                                                        │  any LLM    │
                                                        └──────┬──────┘
                                                               │ tool calls
                                          ┌────────────────────┼────────────────────┐
                                       GitHub API          HN Algolia            DEV.to / web
```

The agent has eight tools: GitHub profile, repos, README reader, contribution stats, pinned repos, Hacker News search, DEV.to search, and a general web search. It typically makes 8–14 tool calls per profile, then emits a final JSON document that the frontend renders.

See [`DEVSCOPE_SPEC.md`](./DEVSCOPE_SPEC.md) for the full product and architecture spec.

---

## Project structure

```
devscope/
├── backend/         Express API + agent (TypeScript)
│   └── src/
│       ├── agent/   ReAct loop, tools, system prompt
│       ├── routes/  SSE generate route + cached profile route
│       └── cache/   File-based profile cache
└── frontend/        Next.js app (App Router)
    ├── app/         Landing page + profile page
    ├── components/  AgentTrace, ProfileView
    └── hooks/       useDevScopeStream (EventSource)
```

---

## Local setup

### Prerequisites
- Node.js 18+
- A free Gemini API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)) — no credit card
- A GitHub personal access token with `public_repo` read scope

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in LLM_API_KEY (Gemini) and GITHUB_TOKEN in .env
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

### Backend → Railway or Render

The backend needs a long-lived process for SSE (it can't run on serverless functions with short timeouts).

**Railway:** Connect the repo, set root directory to `backend/`, add env vars `LLM_API_KEY`, `GITHUB_TOKEN`, `FRONTEND_URL`. The included `railway.toml` handles build and start.

**Render:** The included `render.yaml` defines the service. Point it at `backend/` and add the same env vars.

### Frontend → Vercel

1. Import the repo on Vercel, set root directory to `frontend/`.
2. Add env var `NEXT_PUBLIC_API_URL` = your deployed backend URL.
3. Deploy.

Then update the backend's `FRONTEND_URL` env var to your Vercel domain so CORS allows it.

---

## Environment variables

### Backend (`.env`)
| Variable | Description |
|---|---|
| `LLM_API_KEY` | Gemini API key (free tier) |
| `LLM_BASE_URL` | LLM endpoint, defaults to Gemini |
| `LLM_MODEL` | Model name, defaults to `gemini-2.5-flash` |
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

- **Provider-agnostic, no LangChain.** The agent loop is ~120 lines in `agent.service.ts` using the OpenAI SDK. Swap between Gemini, Groq, or OpenAI by changing three env vars (`LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`). Every token in and out is visible and debuggable.
- **SSE, not WebSockets.** Generation is one-directional server→client streaming, which is exactly what Server-Sent Events are for.
- **File cache, no database.** One JSON file per username with a 24-hour TTL. Swap in Redis later by changing `cache.service.ts`.
- **Two processes, not one.** Express handles the long-running SSE stream; Next.js handles the UI. They deploy separately.

---

## License

MIT
