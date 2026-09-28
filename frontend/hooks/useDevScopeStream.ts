'use client';

import { useState, useCallback, useRef } from 'react';
import { API_URL } from '@/lib/config';
import { DevProfile, TraceEvent } from '@/types/profile';

type Status = 'idle' | 'connecting' | 'streaming' | 'complete' | 'error';

export interface StreamError {
  message: string;
  technicalDetails?: string;
}

export function useDevScopeStream() {
  const [status, setStatus] = useState<Status>('idle');
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [profile, setProfile] = useState<DevProfile | null>(null);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<StreamError | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);

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

  const generate = useCallback((username: string, force = false, liveUrl?: string) => {
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

    const url = `${API_URL}/api/generate?${params.toString()}`;
    const source = new EventSource(url);
    sourceRef.current = source;

    // Safety watchdog: if after 50s no complete/error is received, fail gracefully
    watchdogRef.current = setTimeout(() => {
      source.close();
      setStatus('error');
      setError({
        message:
          'Analysis timed out while awaiting AI engine response. Free-tier cloud instances may be cold-starting. Please retry.',
        technicalDetails: `Request to ${url} exceeded 50s client watchdog without final resolution.`,
      });
    }, 50_000);

    const resetWatchdogOnActivity = () => {
      clearWatchdog();
      watchdogRef.current = setTimeout(() => {
        source.close();
        setStatus('error');
        setError({
          message:
            'Analysis timed out during synthesis. Free-tier AI models may be experiencing congestion. Please retry.',
          technicalDetails: 'Stream activity stalled for more than 40s during active tool execution.',
        });
      }, 40_000);
    };

    source.addEventListener('tool_call', (e) => {
      resetWatchdogOnActivity();
      setStatus('streaming');
      setTrace((t) => [...t, JSON.parse((e as MessageEvent).data)]);
    });

    source.addEventListener('tool_result', (e) => {
      resetWatchdogOnActivity();
      setTrace((t) => [...t, JSON.parse((e as MessageEvent).data)]);
    });

    source.addEventListener('thinking', (e) => {
      resetWatchdogOnActivity();
      setTrace((t) => [...t, JSON.parse((e as MessageEvent).data)]);
    });

    source.addEventListener('complete', (e) => {
      clearWatchdog();
      const data = JSON.parse((e as MessageEvent).data);
      setProfile(data.profile);
      setCached(!!data.cached);
      setStatus('complete');
      source.close();
    });

    // Custom error event emitted by backend with sanitized user message
    source.addEventListener('error', (e) => {
      clearWatchdog();
      const msgEvent = e as MessageEvent;
      let userMsg = 'Connection to the analysis engine was interrupted. Please retry in a few moments.';
      let details: string | undefined;

      if (msgEvent.data) {
        try {
          const parsed = JSON.parse(msgEvent.data);
          userMsg = parsed.message || userMsg;
          details = parsed.technicalDetails;
        } catch {
          /* fallback */
        }
      }

      setError({
        message: userMsg,
        technicalDetails: details,
      });
      setStatus('error');
      source.close();
    });
  }, []);

  return { status, trace, profile, cached, error, generate, reset };
}
