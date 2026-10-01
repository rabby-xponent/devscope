/**
 * Anonymous demo gate (M24A backend half — MONETIZATION_BUILD_TRACKER.md).
 *
 * The demo is the funnel: an anonymous visitor gets ONE fresh audit per GitHub
 * profile, cookie-bound. Cache hits are always free (they cost ~nothing and
 * showcase the product). This is the *only* current cost chokepoint —
 * `/api/agent/stream` fresh runs are LLM calls.
 *
 * Rules (MONETIZATION_ARCHITECTURE.md §10):
 * - Cookie `devscope_demo_runs_v1` lists handles already demo-audited.
 * - Cache hits never consume budget.
 * - IP backstop caps fresh runs per hour (in-memory; shared NATs collide —
 *   acceptable for v1, revisited with accounts in M24B).
 * - Gate only applies to anonymous requests; authenticated users (M24B+) skip it.
 */

const COOKIE_NAME = 'devscope_demo_runs_v1';
const COOKIE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60; // 180d
const IP_WINDOW_MS = 60 * 60 * 1000;
const IP_HOURLY_CAP = Number(process.env.DEMO_IP_HOURLY_CAP || 10);

const ipBuckets = new Map<string, { count: number; windowStart: number }>();

export function isDemoGateEnabled(): boolean {
  return process.env.DEMO_LIMIT !== 'off';
}

export function parseDemoCookie(header: string | undefined): string[] {
  if (!header) return [];
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE_NAME) {
      try {
        const parsed = JSON.parse(decodeURIComponent(rest.join('=')));
        return Array.isArray(parsed) ? parsed.filter((h) => typeof h === 'string') : [];
      } catch {
        return [];
      }
    }
  }
  return [];
}

export function buildDemoCookie(handles: string[]): string {
  const value = encodeURIComponent(JSON.stringify(handles));
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax`;
}

/**
 * Fixed-window IP backstop. Returns false when the hourly cap is exhausted.
 * Intentionally in-memory: resetting on deploy is fine for a v1 limiter.
 */
export function checkIpBudget(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || now - bucket.windowStart > IP_WINDOW_MS) {
    ipBuckets.set(ip, { count: 1, windowStart: now });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= IP_HOURLY_CAP;
}

export type DemoGateVerdict =
  | { allowed: true; handles: string[]; setCookie: string }
  | { allowed: false; reason: 'demo_exhausted' | 'rate_limited' };

/**
 * Decide a fresh anonymous run. Caller is responsible for only invoking this
 * on runs that will actually do agent work (cache misses / forced runs).
 */
export function evaluateDemoRun(
  cookieHeader: string | undefined,
  ip: string,
  handle: string
): DemoGateVerdict {
  const handles = parseDemoCookie(cookieHeader);
  const key = handle.toLowerCase();

  if (handles.includes(key)) {
    return { allowed: false, reason: 'demo_exhausted' };
  }
  if (!checkIpBudget(ip)) {
    return { allowed: false, reason: 'rate_limited' };
  }

  const next = [...handles, key];
  return { allowed: true, handles: next, setCookie: buildDemoCookie(next) };
}
