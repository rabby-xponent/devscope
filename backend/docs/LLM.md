# LLM Gateway — Model Selection & Quotas

## Provider priority

Configured in `src/llm/providers.config.ts` (`PROVIDER_CATALOG` array order):

1. Groq
2. OpenRouter
3. DeepSeek → Gemini → Qwen → OpenAI

Healthy providers are tried in catalog order. Unhealthy providers (cooldown, low success rate) sink to the end.

## Source of truth vs `.env`

| Setting | Default location | Override |
|---|---|---|
| Provider order | `PROVIDER_CATALOG` array | `LLM_PROVIDER_OVERRIDE=groq` pins one provider |
| API keys | — | `GROQ_API_KEY`, `OPENROUTER_API_KEY`, etc. |
| Primary model | `model` field in catalog | `GROQ_MODEL`, `OPENROUTER_MODEL`, etc. |
| Fallback models | `fallbackModels` in catalog | Not env-configurable |

```ts
// Resolved at runtime:
model: process.env.OPENROUTER_MODEL || catalog.model
```

**Important:** If your `backend/.env` still has `OPENROUTER_MODEL=openrouter/free`, that overrides the catalog and re-enables random (slow) model selection. Update it to match the catalog default or remove the line.

## OpenRouter: avoid `openrouter/free`

The `openrouter/free` router **randomly picks** a free model. It sometimes selects **reasoning models** (DeepSeek R1, Nemotron, etc.) that spend hundreds of `reasoning_tokens` before output — synthesis took **4+ minutes** in production.

**Use explicit non-reasoning slugs instead:**

```ts
model: 'meta-llama/llama-4-scout:free',
fallbackModels: [
  'qwen/qwen3-coder:free',
  'meta-llama/llama-3.3-70b:free',
],
```

(`llama-4-maverick:free` may 404 on OpenRouter — scout is the reliable free default.)

Do **not** use:

- `openrouter/free` — random, may pick reasoning models
- `nvidia/llama-3.1-nemotron-ultra-253b:free` — slow reasoning model
- `deepseek/deepseek-r1*` — chain-of-thought, overkill for JSON synthesis

## Synthesis timeout

Profile synthesis passes `timeoutMs: 45_000` to the gateway. If a provider/model exceeds 45s, the request aborts and failover tries the next provider/model.

Logs:

```
[synthesis] Starting synthesis call at ...
[synthesis] Completed in 8234ms via groq/llama-3.3-70b-versatile
[synthesis] timeout after 45s — provider too slow, failing over
```

## Groq free-tier quota

Groq free tier: **100,000 tokens per day (TPD)**. Resets at **midnight UTC**.

When exhausted, you'll see `quota_exceeded` and automatic failover to OpenRouter. The test script prints a reminder:

```
NOTE  groq free tier: 100K tokens/day. Resets at midnight UTC.
```

For production, consider Groq Developer tier (higher limits) or ensure OpenRouter uses fast non-reasoning models.

## Model-level cooldowns

When a model returns 404 or outage, it is skipped for **5 minutes** (`provider-health.ts`). Prevents wasting 2–3s on every cold start retrying a dead slug.

## Anti-hallucination (synthesis)

Even with prompt rules, the agent **enforces** data in code after synthesis:

- **Expertise** — rebuilt only from `get_aggregated_languages` output (no invented Rust/Python)
- **Hacker News** — `hackerNews` forced to Algolia URL; count in `hackerNewsMentions` from tool data

See `finalizeSynthesizedProfile()` in `agent.service.ts`.
