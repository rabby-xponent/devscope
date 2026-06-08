const RECENT_WINDOW = 20;
const MIN_SAMPLES_FOR_PENALTY = 3;
const MODEL_COOLDOWN_MS = 5 * 60 * 1000;

interface Outcome {
  success: boolean;
  latencyMs: number;
  timestamp: number;
  errorClass?: string;
}

interface ProviderStats {
  recent: Outcome[];
  lastSuccessAt: number;
  cooldownUntil: number;
  lastFailureReason: string | null;
}

const stats = new Map<string, ProviderStats>();
const modelCooldowns = new Map<string, number>();

function getStats(provider: string): ProviderStats {
  let s = stats.get(provider);
  if (!s) {
    s = { recent: [], lastSuccessAt: Date.now(), cooldownUntil: 0, lastFailureReason: null };
    stats.set(provider, s);
  }
  return s;
}

export function recordSuccess(provider: string, latencyMs: number) {
  const s = getStats(provider);
  s.recent.push({ success: true, latencyMs, timestamp: Date.now() });
  if (s.recent.length > RECENT_WINDOW) s.recent.shift();
  s.lastSuccessAt = Date.now();
  s.cooldownUntil = 0;
  s.lastFailureReason = null;
}

export function recordFailure(provider: string, errorClass: string, cooldownMs: number) {
  const s = getStats(provider);
  s.recent.push({ success: false, latencyMs: 0, timestamp: Date.now(), errorClass });
  if (s.recent.length > RECENT_WINDOW) s.recent.shift();
  s.lastFailureReason = errorClass;
  if (cooldownMs > 0) {
    s.cooldownUntil = Math.max(s.cooldownUntil, Date.now() + cooldownMs);
  }
}

export function setModelCooldown(provider: string, model: string, cooldownMs = MODEL_COOLDOWN_MS) {
  modelCooldowns.set(`${provider}:${model}`, Date.now() + cooldownMs);
}

export function getModelCooldown(provider: string, model: string): number {
  const key = `${provider}:${model}`;
  const until = modelCooldowns.get(key);
  if (!until || until <= Date.now()) {
    modelCooldowns.delete(key);
    return 0;
  }
  return until;
}

export function isModelInCooldown(provider: string, model: string): boolean {
  return getModelCooldown(provider, model) > Date.now();
}

export function isInCooldown(provider: string): boolean {
  return getStats(provider).cooldownUntil > Date.now();
}

export function successRate(provider: string): number {
  const s = getStats(provider);
  if (s.recent.length === 0) return 1;
  const successes = s.recent.filter((o) => o.success).length;
  return successes / s.recent.length;
}

export function averageLatencyMs(provider: string): number {
  const s = getStats(provider);
  const successes = s.recent.filter((o) => o.success);
  if (successes.length === 0) return 0;
  return successes.reduce((sum, o) => sum + o.latencyMs, 0) / successes.length;
}

export function isHealthy(provider: string): boolean {
  const s = getStats(provider);
  if (isInCooldown(provider)) return false;
  if (s.recent.length < MIN_SAMPLES_FOR_PENALTY) return true;
  return successRate(provider) > 0.5;
}

export function snapshot(provider: string) {
  const s = getStats(provider);
  return {
    provider,
    successRate: Number(successRate(provider).toFixed(2)),
    avgLatencyMs: Math.round(averageLatencyMs(provider)),
    recentFailures: s.recent.filter((o) => !o.success).length,
    lastSuccessAt: s.lastSuccessAt ? new Date(s.lastSuccessAt).toISOString() : null,
    inCooldown: isInCooldown(provider),
    cooldownRemainingMs: Math.max(0, s.cooldownUntil - Date.now()),
    lastFailureReason: s.lastFailureReason,
  };
}

// Healthy providers keep catalog priority order; unhealthy ones sink to the end.
export function rankByHealth<T extends { name: string }>(providers: T[]): T[] {
  const priority = new Map(providers.map((p, i) => [p.name, i]));

  return [...providers].sort((a, b) => {
    const aHealthy = isHealthy(a.name);
    const bHealthy = isHealthy(b.name);
    if (aHealthy !== bHealthy) return aHealthy ? -1 : 1;

    if (aHealthy && bHealthy) {
      return (priority.get(a.name) ?? 0) - (priority.get(b.name) ?? 0);
    }

    const rateDiff = successRate(b.name) - successRate(a.name);
    if (Math.abs(rateDiff) > 0.001) return rateDiff;

    return averageLatencyMs(a.name) - averageLatencyMs(b.name);
  });
}
