'use client';

import { useState, useCallback, useRef } from 'react';
import { API_URL } from '@/lib/config';
import { TraceEvent } from '@/types/profile';

export interface DeepCodeAuditReport {
  repo: string;
  owner: string;
  analyzedAt: string;
  filesInspected: string[];
  commitsInspected: number;
  architecture: {
    grade: 'A' | 'B' | 'C' | 'D';
    patternsObserved: string[];
    structureVerdict: string;
    keyEntrypoints: string[];
  };
  codeQuality: {
    cleanlinessRating: 'exceptional' | 'good' | 'average' | 'poor';
    errorHandlingStyle: string;
    testingDiscipline: 'strong' | 'moderate' | 'minimal' | 'none';
    testingEvidence: string;
  };
  originality: {
    verdict: 'original_implementation' | 'fork_with_modifications' | 'boilerplate_or_tutorial';
    explanation: string;
  };
  defensePlaybook: Array<{
    id: string;
    question: string;
    codeContext: string;
    whatToDefend: string;
    trapOrRedFlag: string;
    difficulty: 'mid' | 'senior' | 'staff';
  }>;
}

type Status = 'idle' | 'auditing' | 'complete' | 'error';

export function useDeepAuditStream() {
  const [status, setStatus] = useState<Status>('idle');
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [report, setReport] = useState<DeepCodeAuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  const startAudit = useCallback((owner: string, repo: string, jd?: string) => {
    sourceRef.current?.close();
    setStatus('auditing');
    setTrace([]);
    setReport(null);
    setError(null);

    const query = new URLSearchParams({
      owner,
      repo,
      ...(jd ? { jd } : {}),
    });

    const es = new EventSource(`${API_URL}/api/deep-audit?${query.toString()}`);
    sourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'deep_audit_complete') {
          setReport(data.report);
          setStatus('complete');
          es.close();
          return;
        }

        if (data.type === 'error') {
          setError(data.message || 'Deep code audit failed.');
          setStatus('error');
          es.close();
          return;
        }

        setTrace((prev) => [...prev, data as TraceEvent]);
      } catch {
        // Heartbeat or comment
      }
    };

    es.onerror = () => {
      setError('Connection dropped or backend unavailable.');
      setStatus('error');
      es.close();
    };
  }, []);

  const reset = useCallback(() => {
    sourceRef.current?.close();
    setStatus('idle');
    setTrace([]);
    setReport(null);
    setError(null);
  }, []);

  return {
    status,
    trace,
    report,
    error,
    startAudit,
    reset,
  };
}
