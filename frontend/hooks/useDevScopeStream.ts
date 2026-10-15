'use client';

import { useState, useCallback, useRef } from 'react';
import { API_URL } from '@/lib/config';
import { DevProfile, TraceEvent } from '@/types/profile';
import { getAccessToken } from '@/lib/auth';

type Status = 'idle' | 'connecting' | 'streaming' | 'complete' | 'error';

export interface StreamError {
  message: string;
  technicalDetails?: string;
  /** Machine-readable code from the backend (e.g. 'demo_exhausted', 'rate_limited') */
  code?: string;
}

/** Probe the backend out-of-band to distinguish CORS/network blocks from a sleeping server. */
async function probeBackend(apiUrl: string): Promise<'reachable' | 'unreachable'> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    // Same-origin of the API with credentials mirrors the EventSource CORS mode,
    // so a blocked allowlist fails here exactly like it fails on the stream.
    const res = await fetch(`${apiUrl}/api/health`, {
      credentials: 'include',
      mode: 'cors',
      signal: controller.signal,
    });
    // Any HTTP response (even 500) proves the server is up and the origin is allowed.
    return res.ok || res.status >= 400 ? 'reachable' : 'unreachable';
  } catch {
    return 'unreachable';
  } finally {
    clearTimeout(timer);
  }
}

export function useDevScopeStream() {
  const [status, setStatus] = useState<Status>('idle');
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [profile, setProfile] = useState<DevProfile | null>(null);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<StreamError | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearWatchdog = () => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  };

  const reset = useCallback(() => {
    clearWatchdog();
    sourceRef.current?.close();
    setStatus('idle');
    setTrace([]);
    setProfile(null);
    setCached(false);
    setError(null);
  }, []);

  const generate = useCallback(
    async (
      username: string,
      force = false,
      liveUrl?: string,
      jobDescription?: string,
      roleTitle?: string
    ) => {
      clearWatchdog();
      sourceRef.current?.close();
      setStatus('connecting');
      setTrace([]);
      setProfile(null);
      setCached(false);
      setError(null);

      const params = new URLSearchParams({ username });
      if (force) params.set('force', 'true');
      if (liveUrl && liveUrl.trim()) params.set('liveUrl', liveUrl.trim());
      if (jobDescription && jobDescription.trim()) params.set('jd', jobDescription.trim());
      if (roleTitle && roleTitle.trim()) params.set('roleTitle', roleTitle.trim());
      // Signed-in users pass their session token: EventSource cannot set
      // headers, so the backend also accepts it as a query param (M24B/C).
      const token = await getAccessToken();
      if (token) params.set('access_token', token);

      const url = `${API_URL}/api/generate?${params.toString()}`;
      // Backend is cross-origin (different port / domain): cookies (demo gate) only flow
      // when withCredentials is set, and the backend CORS allows credentials.
      const source = new EventSource(url, { withCredentials: true });
      sourceRef.current = source;

      // --- connection health bookkeeping (native `error` events carry no data) ---
      let settled = false; // true once complete/error terminal state is recorded
      let receivedEvents = false; // any named SSE event arrived (stream was genuinely open)
      let nativeErrorCount = 0;

      const settle = (err: StreamError) => {
        if (settled) return;
        settled = true;
        clearWatchdog();
        source.close();
        setError(err);
        setStatus('error');
      };

      const failWithDiagnostics = async () => {
        const reachability = await probeBackend(API_URL);
        if (reachability === 'unreachable') {
          settle({
            message:
              'Could not reach the analysis engine at all. This is almost always a CORS or network configuration issue: the backend is not allowing this website\'s origin, or the frontend was built pointing at the wrong API URL (http vs https).',
            technicalDetails:
              `EventSource to ${url} failed without any SSE data, and a credentialed fetch to ${API_URL}/api/health also failed. ` +
              `Checks: (1) backend ALLOWED_ORIGINS / FRONTEND_URL must include this site's exact origin; ` +
              `(2) NEXT_PUBLIC_API_URL must be set at frontend BUILD time to the https API URL; ` +
              `(3) backend may be offline.`,
            code: 'connection_blocked',
          });
        } else {
          settle({
            message:
              'The analysis engine is reachable but the live event stream was interrupted. Free-tier instances sometimes drop connections while waking up. Please retry.',
            technicalDetails: `SSE stream to ${url} failed after ${nativeErrorCount} native error(s), though ${API_URL}/api/health responded.`,
            code: 'stream_interrupted',
          });
        }
      };

      // Safety watchdog: if after 50s no complete/error is received, fail gracefully
      watchdogRef.current = setTimeout(() => {
        settle({
          message:
            'Analysis timed out while awaiting AI engine response. Free-tier cloud instances may be cold-starting. Please retry.',
          technicalDetails: `Request to ${url} exceeded 50s client watchdog without final resolution.`,
        });
      }, 50_000);

      const resetWatchdogOnActivity = () => {
        clearWatchdog();
        watchdogRef.current = setTimeout(() => {
          settle({
            message:
              'Analysis timed out during synthesis. Free-tier AI models may be experiencing congestion. Please retry.',
            technicalDetails: 'Stream activity stalled for more than 40s during active tool execution.',
          });
        }, 40_000);
      };

      const onNamedEvent = () => {
        receivedEvents = true;
        resetWatchdogOnActivity();
      };

      source.addEventListener('tool_call', (e) => {
        onNamedEvent();
        setStatus('streaming');
        setTrace((t) => [...t, JSON.parse((e as MessageEvent).data)]);
      });

      source.addEventListener('tool_result', (e) => {
        onNamedEvent();
        setTrace((t) => [...t, JSON.parse((e as MessageEvent).data)]);
      });

      source.addEventListener('thinking', (e) => {
        onNamedEvent();
        setTrace((t) => [...t, JSON.parse((e as MessageEvent).data)]);
      });

      source.addEventListener('complete', (e) => {
        const data = JSON.parse((e as MessageEvent).data);
        if (settled) return;
        settled = true;
        clearWatchdog();
        setProfile(data.profile);
        setCached(!!data.cached);
        setStatus('complete');
        source.close();
      });

      // Handles BOTH server-sent `error` events (data present) and native
      // EventSource connection errors (data absent, e.g. CORS / network / bad status).
      source.addEventListener('error', (e) => {
        const msgEvent = e as MessageEvent;

        // Server explicitly told us what went wrong (sanitized message, demo gate, etc.)
        if (msgEvent.data) {
          let userMsg = 'Connection to the analysis engine was interrupted. Please retry in a few moments.';
          let details: string | undefined;
          let code: string | undefined;
          try {
            const parsed = JSON.parse(msgEvent.data);
            userMsg = parsed.message || userMsg;
            details = parsed.technicalDetails;
            code = parsed.code;
          } catch {
            /* fallback */
          }
          settle({ message: userMsg, technicalDetails: details, code });
          return;
        }

        // Native connection error (no data). readyState tells us what to do:
        //  - CLOSED (2): the browser gave up permanently (non-SSE response / bad status).
        //  - CONNECTING (0): the browser is auto-retrying (CORS blocks retry too);
        //    don't kill it immediately — decide via counters + out-of-band probe.
        nativeErrorCount += 1;
        if (source.readyState === EventSource.CLOSED) {
          void failWithDiagnostics();
          return;
        }
        if (!receivedEvents && nativeErrorCount >= 2) {
          // Repeated immediate failures before anything streamed — diagnose now
          // instead of making the user wait out the full 50s watchdog.
          void failWithDiagnostics();
          return;
        }
        // Otherwise: let the browser retry; the watchdog remains our safety net.
      });
    },
    []
  );

  return { status, trace, profile, cached, error, generate, reset };
}

export const useGitGrillStream = useDevScopeStream;
