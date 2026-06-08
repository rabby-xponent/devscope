export type ErrorClass =
  | 'transient'
  | 'rate_limited'
  | 'quota_exceeded'
  | 'timeout'
  | 'outage'
  | 'non_retryable';

// Different OpenAI-compatible providers shape their errors differently —
// Gemini returns bare 429s with no body, Groq/OpenRouter tend to include
// `error.code`/`error.type`/`error.message` with more detail. This inspects
// status, message, and body across that variance and buckets the result into
// one of a few categories that drive both in-provider retry and failover.
export function classifyError(err: any): ErrorClass {
  const status = err?.status ?? err?.response?.status;
  const message: string = String(err?.message || err?.error?.message || '').toLowerCase();
  const code: string = String(err?.code || err?.error?.code || '').toLowerCase();
  const type: string = String(err?.type || err?.error?.type || '').toLowerCase();

  if (status === 429 || code === 'rate_limit_exceeded' || type === 'rate_limit_error') {
    if (/quota|exhaust|billing|insufficient/.test(message) || code === 'insufficient_quota') {
      return 'quota_exceeded';
    }
    return 'rate_limited';
  }

  if (/quota|exhaust|insufficient_quota/.test(message) || code === 'insufficient_quota') {
    return 'quota_exceeded';
  }

  if (
    err?.name === 'APIConnectionTimeoutError' ||
    err?.name === 'AbortError' ||
    code === 'etimedout' ||
    code === 'econnaborted' ||
    /timed out|timeout|aborted|abort/.test(message)
  ) {
    return 'timeout';
  }

  if (
    code === 'econnreset' ||
    code === 'eai_again' ||
    code === 'enotfound' ||
    code === 'ehostunreach' ||
    code === 'econnrefused' ||
    code === 'socket_hang_up' ||
    /network error|fetch failed|socket hang up|connection reset|connection refused|temporary failure|dns|eai_again/.test(message)
  ) {
    return 'transient';
  }

  if (status === 503 || status === 502 || status === 500 || /overloaded|unavailable|outage/.test(message)) {
    return 'outage';
  }

  return 'non_retryable';
}

// Errors worth abandoning the current provider for and trying the next one.
export function isFailoverWorthy(errClass: ErrorClass): boolean {
  return errClass !== 'non_retryable';
}

// Cooldown length per error class — short for blips, long for hard quota walls.
export function cooldownMsFor(errClass: ErrorClass): number {
  switch (errClass) {
    case 'transient':
      return 15 * 1000;
    case 'quota_exceeded':
      return 10 * 60 * 1000;
    case 'rate_limited':
      return 60 * 1000;
    case 'outage':
      return 2 * 60 * 1000;
    case 'timeout':
      return 30 * 1000;
    default:
      return 0;
  }
}
