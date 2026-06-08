import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import OpenAI from 'openai';

// Dev-time guard against burning free-tier quota: caches a completion by a
// hash of its exact request (model + full message history + tool defs). Since
// the message history includes the real tool results, the key only collides
// for byte-identical conversations — e.g. re-running `agent:test <user>`
// while iterating on the system prompt, or hitting "regenerate" right after a
// fresh generation. Opt-in and OFF by default so production "regenerate"
// requests always get a live model response.
const ENABLED = process.env.LLM_CACHE_ENABLED === 'true';
const CACHE_DIR = process.env.LLM_CACHE_DIR || './cache/llm';
const TTL_MS = Number(process.env.LLM_CACHE_TTL_MINUTES || 60) * 60 * 1000;

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;
type ChatCompletion = OpenAI.Chat.Completions.ChatCompletion;

interface CacheKeyInput {
  messages: ChatMessage[];
  tools?: unknown;
}

function cacheKey(input: CacheKeyInput): string {
  return createHash('sha256')
    .update(JSON.stringify({ messages: input.messages, tools: input.tools }))
    .digest('hex');
}

function cachePath(key: string): string {
  return path.join(CACHE_DIR, `${key}.json`);
}

export function isLLMCacheEnabled(): boolean {
  return ENABLED;
}

export async function readLLMCache(input: CacheKeyInput): Promise<ChatCompletion | null> {
  if (!ENABLED) return null;
  const file = cachePath(cacheKey(input));

  try {
    const stats = await fs.stat(file);
    if (Date.now() - stats.mtimeMs > TTL_MS) return null;

    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw) as ChatCompletion;
  } catch (err: any) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function writeLLMCache(input: CacheKeyInput, response: ChatCompletion): Promise<void> {
  if (!ENABLED) return;
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(cachePath(cacheKey(input)), JSON.stringify(response), 'utf-8');
}
