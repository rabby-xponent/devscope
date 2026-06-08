import OpenAI from 'openai';
import { getActiveProviders, ActiveProvider } from './providers.config';
import { classifyError, cooldownMsFor, ErrorClass } from './error-classifier';
import {
  recordSuccess,
  recordFailure,
  rankByHealth,
  snapshot,
  isModelInCooldown,
  setModelCooldown,
  getModelCooldown,
} from './provider-health';
import { readLLMCache, writeLLMCache, isLLMCacheEnabled } from './llm-cache';
import type { TraceEvent } from '../types/profile';

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;
type ChatCompletion = OpenAI.Chat.Completions.ChatCompletion;
type CompletionParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;
type EventEmitter = (event: TraceEvent) => void;

const PER_PROVIDER_RETRIES = 2;
const RETRY_BACKOFFS_MS = [2000, 5000];
const FAILOVER_IMMEDIATELY: ErrorClass[] = ['rate_limited', 'quota_exceeded', 'outage'];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ProviderCandidate {
  name: string;
  config: ActiveProvider;
  client: OpenAI;
}

type ProviderAttemptResult =
  | { ok: true; response: ChatCompletion }
  | { ok: false; errorClass: ErrorClass; reason: string };

export interface CompletionRequest {
  messages: ChatMessage[];
  tools?: CompletionParams['tools'];
  max_tokens?: number;
  timeoutMs?: number;
  provider?: {
    allow_fallbacks?: boolean;
    require_parameters?: boolean;
  };
}

export interface CompletionMeta {
  provider: string;
  model: string;
}

/**
 * Unified entrypoint for model invocation. Business logic (AgentService) only
 * ever calls `gateway.complete(...)` with provider-agnostic params — it never
 * knows which provider served the request, what its base URL/key/model is, or
 * how retries and failover were handled.
 */
export class LLMGateway {
  private candidates: ProviderCandidate[];
  lastCompletionMeta: CompletionMeta | null = null;

  constructor() {
    this.candidates = getActiveProviders().map((config) => ({
      name: config.name,
      config,
      client: new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        defaultHeaders: config.defaultHeaders,
      }),
    }));

    if (this.candidates.length === 0) {
      throw new Error(
        'No LLM provider configured. Set at least one of: OPENROUTER_API_KEY, GROQ_API_KEY, ' +
          'DEEPSEEK_API_KEY, GEMINI_API_KEY, QWEN_API_KEY, OPENAI_API_KEY ' +
          '(or LLM_PROVIDER_OVERRIDE to pin one for testing).'
      );
    }
  }

  async complete(request: CompletionRequest, emit: EventEmitter): Promise<ChatCompletion> {
    const ranked = rankByHealth(this.candidates);
    const failures: string[] = [];
    const cacheKey = { messages: request.messages, tools: request.tools };

    if (isLLMCacheEnabled()) {
      const cached = await readLLMCache(cacheKey);
      if (cached) {
        this.log('cache_hit', { provider: 'any', model: 'request-level' });
        emit(this.thinking('Serving cached LLM response.'));
        return cached;
      }
    }

    for (let i = 0; i < ranked.length; i++) {
      const candidate = ranked[i];
      const modelQueue = [candidate.config.model, ...candidate.config.fallbackModels];

      for (let modelIndex = 0; modelIndex < modelQueue.length; modelIndex++) {
        const model = modelQueue[modelIndex];
        const isPrimaryModel = modelIndex === 0;
        const isFallbackModel = modelIndex > 0;

        if (isModelInCooldown(candidate.name, model)) {
          const remainingMs = Math.max(0, getModelCooldown(candidate.name, model) - Date.now());
          this.log('model_cooldown_skip', {
            provider: candidate.name,
            model,
            cooldownRemainingMs: remainingMs,
          });
          continue;
        }

        if (i === 0 && isPrimaryModel) {
          this.log('select', { provider: candidate.name, model, health: snapshot(candidate.name) });
          emit(this.thinking(`Routing to ${candidate.name} (${model})...`));
        } else if (isFallbackModel) {
          this.log('model_fallback', {
            provider: candidate.name,
            from: modelQueue[modelIndex - 1],
            to: model,
          });
          emit(this.thinking(`${candidate.name} hit rate limits on ${modelQueue[modelIndex - 1]}, trying ${model}...`));
        } else {
          const reason = failures[failures.length - 1];
          this.log('failover', { from: ranked[i - 1].name, to: candidate.name, reason });
          emit(this.thinking(`${ranked[i - 1].name} unavailable (${reason}) - failing over to ${candidate.name}...`));
        }

        const result = await this.tryProvider(candidate, model, request, emit);

        if (result.ok) {
          this.lastCompletionMeta = { provider: candidate.name, model };
          if (isLLMCacheEnabled()) {
            await writeLLMCache(cacheKey, result.response);
          }
          return result.response;
        }

        failures.push(`${candidate.name}:${model}:${result.errorClass}`);

        const tryNextModel =
          (result.errorClass === 'rate_limited' ||
            result.errorClass === 'outage' ||
            result.errorClass === 'timeout') &&
          modelIndex < modelQueue.length - 1;
        if (tryNextModel) {
          continue;
        }

        break;
      }
    }

    throw new Error(
      `All LLM providers exhausted: ${failures.join(' | ')}. ` +
        `Wait for cooldowns to clear, configure another provider's API key, or try again later.`
    );
  }

  private async tryProvider(
    candidate: ProviderCandidate,
    model: string,
    request: CompletionRequest,
    emit: EventEmitter
  ): Promise<ProviderAttemptResult> {
    const { name, client } = candidate;
    const requestParams = {
      model,
      messages: request.messages,
      tools: request.tools,
      max_tokens: request.max_tokens,
      ...(name === 'openrouter' && request.provider ? { provider: request.provider } : {}),
      ...(name === 'openrouter' ? { transforms: [] } : {}),
    };

    for (let attempt = 0; attempt <= PER_PROVIDER_RETRIES; attempt++) {
      const start = Date.now();
      const controller = request.timeoutMs ? new AbortController() : null;
      const timer = controller
        ? setTimeout(() => controller.abort(), request.timeoutMs)
        : null;

      try {
        const response = await client.chat.completions.create(requestParams, {
          signal: controller?.signal,
        });
        if (timer) clearTimeout(timer);
        const latencyMs = Date.now() - start;
        recordSuccess(name, latencyMs);
        this.log('result', { provider: name, model, latencyMs, usage: response.usage });
        return { ok: true, response };
      } catch (err: any) {
        if (timer) clearTimeout(timer);
        const latencyMs = Date.now() - start;
        const errorClass = classifyError(err);
        this.log('failure', {
          provider: name,
          model,
          attempt: attempt + 1,
          errorClass,
          status: err?.status,
          message: err?.message,
          latencyMs,
        });

        if (errorClass === 'non_retryable') {
          recordFailure(name, errorClass, 0);
          if (err?.status === 404) {
            setModelCooldown(name, model);
          }
          return { ok: false, errorClass, reason: `${name}:${model}:${errorClass}` };
        }

        if (FAILOVER_IMMEDIATELY.includes(errorClass)) {
          recordFailure(name, errorClass, cooldownMsFor(errorClass));
          if (errorClass === 'outage') {
            setModelCooldown(name, model);
          }
          return { ok: false, errorClass, reason: `${name}:${model}:${errorClass}` };
        }

        if (errorClass === 'timeout' && request.timeoutMs) {
          recordFailure(name, errorClass, cooldownMsFor(errorClass));
          emit(this.thinking(`${name} (${model}) timed out after ${request.timeoutMs}ms — failing over...`));
          return { ok: false, errorClass, reason: `${name}:${model}:${errorClass}` };
        }

        const shouldRetry = errorClass === 'timeout' || errorClass === 'transient';
        if (!shouldRetry) {
          recordFailure(name, errorClass, 0);
          return { ok: false, errorClass, reason: `${name}:${model}:${errorClass}` };
        }

        const isLastAttempt = attempt === PER_PROVIDER_RETRIES;
        recordFailure(name, errorClass, isLastAttempt ? cooldownMsFor(errorClass) : 0);
        if (isLastAttempt) {
          return { ok: false, errorClass, reason: `${name}:${model}:${errorClass}` };
        }

        const waitMs = RETRY_BACKOFFS_MS[attempt];
        emit(this.thinking(`${name} timed out, retrying in ${Math.round(waitMs / 1000)}s...`));
        await sleep(waitMs);
      }
    }

    return { ok: false, errorClass: 'non_retryable', reason: `${name}:${model}:non_retryable` };
  }

  private thinking(message: string): TraceEvent {
    return { type: 'thinking', timestamp: new Date().toISOString(), thinking: message };
  }

  private log(event: string, details: Record<string, unknown>) {
    console.log(`[llm-gateway:${event}]`, JSON.stringify(details));
  }
}
