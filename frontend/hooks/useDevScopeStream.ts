'use client';

import { useState, useCallback, useRef } from 'react';
import { API_URL } from '@/lib/config';
import { DevProfile, TraceEvent } from '@/types/profile';

type Status = 'idle' | 'connecting' | 'streaming' | 'complete' | 'error';

export function useDevScopeStream() {
  const [status, setStatus] = useState<Status>('idle');
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [profile, setProfile] = useState<DevProfile | null>(null);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  const reset = useCallback(() => {
    sourceRef.current?.close();
    setStatus('idle');
    setTrace([]);
    setProfile(null);
    setCached(false);
    setError(null);
  }, []);

  const generate = useCallback((username: string, force = false) => {
    sourceRef.current?.close();
    setStatus('connecting');
    setTrace([]);
    setProfile(null);
    setCached(false);
    setError(null);

    const url = `${API_URL}/api/generate?username=${encodeURIComponent(username)}${
      force ? '&force=true' : ''
    }`;
    const source = new EventSource(url);
    sourceRef.current = source;

    source.addEventListener('tool_call', (e) => {
      setStatus('streaming');
      setTrace((t) => [...t, JSON.parse((e as MessageEvent).data)]);
    });

    source.addEventListener('tool_result', (e) => {
      setTrace((t) => [...t, JSON.parse((e as MessageEvent).data)]);
    });

    source.addEventListener('complete', (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      setProfile(data.profile);
      setCached(!!data.cached);
      setStatus('complete');
      source.close();
    });

    source.addEventListener('error', (e) => {
      const msgEvent = e as MessageEvent;
      let message = 'Connection lost. Is the backend running?';
      if (msgEvent.data) {
        try {
          message = JSON.parse(msgEvent.data).message || message;
        } catch {
          /* keep default */
        }
      }
      setError(message);
      setStatus('error');
      source.close();
    });
  }, []);

  return { status, trace, profile, cached, error, generate, reset };
}
