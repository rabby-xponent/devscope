export interface ProviderConfig {
  name: string;
  envVar: string;
  baseURL: string;
  model: string;
  fallbackModels: string[];
  defaultHeaders?: Record<string, string>;
}

export interface ActiveProvider extends ProviderConfig {
  apiKey: string;
}

function openRouterHeaders(): Record<string, string> {
  const referer = process.env.OPENROUTER_HTTP_REFERER || process.env.FRONTEND_URL || 'http://localhost:3000';
  const title = process.env.OPENROUTER_APP_TITLE || 'DevScope';

  return {
    'HTTP-Referer': referer,
    'X-OpenRouter-Title': title,
  };
}

// Priority order: openrouter -> groq -> deepseek -> gemini -> qwen -> openai.
// Every provider below speaks the OpenAI-compatible chat completions API, so
// no per-provider response translation is needed.
export const PROVIDER_CATALOG: ProviderConfig[] = [
  {
    name: 'groq',
    envVar: 'GROQ_API_KEY',
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    fallbackModels: [
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'llama-3.1-8b-instant',
    ],
  },
  {
    name: 'openrouter',
    envVar: 'OPENROUTER_API_KEY',
    baseURL: 'https://openrouter.ai/api/v1',
    model: 'openrouter/free',
    fallbackModels: [
      'qwen/qwen3-235b-a22b:free',
      'deepseek/deepseek-r1-distill-llama-70b:free',
      'mistralai/mistral-small-3.1-24b-instruct:free',
    ],
    defaultHeaders: openRouterHeaders(),
  },
  {
    name: 'deepseek',
    envVar: 'DEEPSEEK_API_KEY',
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-v4-flash',
    fallbackModels: [],
  },
  {
    name: 'gemini',
    envVar: 'GEMINI_API_KEY',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model: 'gemini-2.5-flash',
    fallbackModels: ['gemini-2.5-flash-lite'],
  },
  {
    name: 'qwen',
    envVar: 'QWEN_API_KEY',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    fallbackModels: [],
  },
  {
    name: 'openai',
    envVar: 'OPENAI_API_KEY',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    fallbackModels: [],
  },
];

export function isConfigured(provider: ProviderConfig): boolean {
  const apiKey = process.env[provider.envVar]?.trim();
  return Boolean(apiKey);
}

// Optional per-provider model override, e.g. GROQ_MODEL=llama-3.1-8b-instant
function modelOverride(providerName: string): string | undefined {
  return process.env[`${providerName.toUpperCase()}_MODEL`];
}

export function getActiveProviders(): ActiveProvider[] {
  const override = process.env.LLM_PROVIDER_OVERRIDE?.trim().toLowerCase();

  return PROVIDER_CATALOG.filter((provider) => {
    if (!isConfigured(provider)) return false;
    if (override) return provider.name === override;
    return true;
  }).map((provider) => ({
    ...provider,
    apiKey: process.env[provider.envVar]!.trim(),
    model: modelOverride(provider.name) || provider.model,
  }));
}
