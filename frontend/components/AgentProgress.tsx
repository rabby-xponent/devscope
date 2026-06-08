'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TraceEvent } from '@/types/profile';

type Phase = 'identity' | 'code' | 'activity' | 'presence';

interface ToolMeta {
  label: string;
  description: string;
  phase: Phase;
}

const TOOL_META: Record<string, ToolMeta> = {
  get_github_profile: { label: 'Reading profile', description: 'Fetching identity and bio', phase: 'identity' },
  get_repos: { label: 'Scanning repositories', description: 'Mapping public codebase', phase: 'identity' },
  get_pinned_repos: { label: 'Checking pinned work', description: 'Finding featured projects', phase: 'code' },
  get_aggregated_languages: { label: 'Analyzing tech stack', description: 'Measuring language distribution', phase: 'code' },
  get_repo_readme: { label: 'Reading documentation', description: 'Understanding project context', phase: 'code' },
  get_commit_activity: { label: 'Studying commit patterns', description: 'Analyzing coding consistency', phase: 'activity' },
  get_pr_activity: { label: 'Reviewing collaborations', description: 'Measuring teamwork signals', phase: 'activity' },
  get_contribution_stats: { label: 'Counting contributions', description: 'Tallying yearly activity', phase: 'activity' },
  search_hackernews: { label: 'Searching Hacker News', description: 'Finding community mentions', phase: 'presence' },
  search_devto: { label: 'Checking DEV.to', description: 'Looking for articles', phase: 'presence' },
  web_search: { label: 'Searching the web', description: 'Finding public presence', phase: 'presence' },
};

const PHASES: Array<{ key: Phase; label: string }> = [
  { key: 'identity', label: 'Identity' },
  { key: 'code', label: 'Codebase' },
  { key: 'activity', label: 'Activity' },
  { key: 'presence', label: 'Presence' },
];

// Rough step count used only to drive the progress bar — the agent runs a
// variable number of get_repo_readme calls (one per pinned repo), so this is
// an estimate, not an exact total. Capped below 100 until synthesis starts.
const ESTIMATED_TOTAL_STEPS = 12;

const DISCOVERY_META: Record<string, { icon: string; label: string }> = {
  get_github_profile: { icon: '👤', label: 'Profile' },
  get_repos: { icon: '⭐', label: 'Repositories' },
  get_aggregated_languages: { icon: '💻', label: 'Languages' },
  get_commit_activity: { icon: '🔥', label: 'Activity' },
};
const DISCOVERY_TOOLS = Object.keys(DISCOVERY_META);

// Tool calls in this agent resolve in well under a second, so the raw SSE
// trace arrives in a burst — by first paint every step would already read as
// "done", which feels like a page dump rather than an agent at work. These
// constants pace the reveal so each step is visibly "in progress" for a beat
// before flipping to done, independent of how fast the data actually arrived.
const MIN_RUNNING_MS = 900;
const MIN_PAUSE_MS = 250;

interface Step {
  key: string;
  tool: string;
  label: string;
  description: string;
  phase: Phase;
  status: 'running' | 'done';
  summary?: string;
}

function buildSteps(trace: TraceEvent[]): Step[] {
  const steps: Step[] = [];
  const runningByTool = new Map<string, number[]>();

  for (const event of trace) {
    if (event.type === 'tool_call' && event.tool && TOOL_META[event.tool]) {
      const meta = TOOL_META[event.tool];
      const repo = event.tool === 'get_repo_readme' ? String(event.input?.repo ?? '') : '';
      const index = steps.length;
      steps.push({
        key: `${event.tool}-${index}`,
        tool: event.tool,
        label: repo ? `Reading ${repo} README` : meta.label,
        description: meta.description,
        phase: meta.phase,
        status: 'running',
      });
      const queue = runningByTool.get(event.tool) ?? [];
      queue.push(index);
      runningByTool.set(event.tool, queue);
    } else if (event.type === 'tool_result' && event.tool) {
      const queue = runningByTool.get(event.tool);
      const index = queue?.shift();
      if (index !== undefined) {
        steps[index] = { ...steps[index], status: 'done', summary: event.summary };
      }
    }
  }

  return steps;
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function AgentProgress({ username, trace }: { username: string; trace: TraceEvent[] }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startRef = useRef(Date.now());
  const activeStepRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const allSteps = useMemo(() => buildSteps(trace), [trace]);
  const stepByKey = useMemo(() => new Map(allSteps.map((s) => [s.key, s])), [allSteps]);

  // --- Paced reveal queue --------------------------------------------------
  // Decouples "when the data arrived" from "when it's shown": each newly seen
  // step is queued and revealed one at a time with an enforced minimum
  // on-screen duration. The displayed status is purely about pacing — the
  // label/description/summary are always looked up live from `stepByKey`, so
  // the data shown is never stale or fabricated, only its reveal is paced.
  const [revealedKeys, setRevealedKeys] = useState<string[]>([]);
  const [activeKey, setActiveKeyState] = useState<string | null>(null);
  const activeKeyRef = useRef<string | null>(null);
  const queueRef = useRef<string[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setActiveKey = (key: string | null) => {
    activeKeyRef.current = key;
    setActiveKeyState(key);
  };

  const pump = () => {
    if (timerRef.current || activeKeyRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    setActiveKey(next);
    setRevealedKeys((prev) => [...prev, next]);
    timerRef.current = setTimeout(() => {
      setActiveKey(null);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        pump();
      }, MIN_PAUSE_MS);
    }, MIN_RUNNING_MS);
  };

  const isFreshRun = trace.length === 0;
  useEffect(() => {
    if (!isFreshRun) return;
    queueRef.current = [];
    seenRef.current = new Set();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setActiveKey(null);
    setRevealedKeys([]);
    startRef.current = Date.now();
    setElapsedSeconds(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFreshRun]);

  useEffect(() => {
    let added = false;
    for (const step of allSteps) {
      if (!seenRef.current.has(step.key)) {
        seenRef.current.add(step.key);
        queueRef.current.push(step.key);
        added = true;
      }
    }
    if (added) pump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSteps]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  useEffect(() => {
    activeStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeKey]);

  const queueDrained = allSteps.length > 0 && activeKey === null && revealedKeys.length >= allSteps.length;
  // Once every prefetch step has been (paced-)revealed, the only thing left
  // before 'complete' is synthesis — the agent never does anything else here.
  const synthesizing = queueDrained;

  const activeStep = activeKey ? stepByKey.get(activeKey) : undefined;

  const progressPercent = synthesizing
    ? 95
    : Math.min(90, Math.round((revealedKeys.length / ESTIMATED_TOTAL_STEPS) * 100));

  const statusMessage = synthesizing
    ? 'Writing your analysis…'
    : activeStep
      ? `${activeStep.label}…`
      : 'Starting analysis…';

  const currentPhase = synthesizing
    ? 'Synthesis'
    : PHASES.find((p) => p.key === activeStep?.phase)?.label ?? 'Identity';

  const discoveries = useMemo(
    () =>
      revealedKeys
        .filter((key) => key !== activeKey)
        .map((key) => stepByKey.get(key))
        .filter((step): step is Step => !!step && !!step.summary && DISCOVERY_TOOLS.includes(step.tool)),
    [revealedKeys, activeKey, stepByKey]
  );

  const grouped = PHASES.map((phase) => ({
    ...phase,
    steps: revealedKeys
      .map((key) => stepByKey.get(key))
      .filter((s): s is Step => !!s && s.phase === phase.key),
  })).filter((g) => g.steps.length > 0);

  return (
    <div className="fade-up flex min-h-[65vh] flex-col justify-center gap-6">
      <div className="rounded-lg border border-edge bg-surface p-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-edge">
          <div
            className="h-full rounded-full bg-signal transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2 w-2 flex-none rounded-full bg-signal pulse-dot" />
            <span className="truncate font-mono text-xs text-muted">{statusMessage}</span>
          </div>
          <span className="flex-none font-mono text-[11px] text-muted">
            {formatElapsed(elapsedSeconds)} elapsed
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="flex flex-col lg:sticky lg:top-24">
          <div className="font-mono text-xs uppercase tracking-widest text-muted">analyzing</div>
          <h1 className="mt-2 text-3xl text-ece9f0">@{username}</h1>
          <p className="mt-3 max-w-md text-muted">
            The agent is investigating this developer&apos;s public footprint.
            Watch it work in real time →
          </p>

          <div className="mt-8 font-mono text-[11px] uppercase tracking-widest text-muted">
            current phase
          </div>
          <div className="mt-1 font-mono text-sm text-signal">{currentPhase}</div>

          {discoveries.length > 0 && (
            <div className="mt-6">
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted">
                discovered so far
              </div>
              <ul className="mt-2 space-y-2">
                {discoveries.map((step) => {
                  const meta = DISCOVERY_META[step.tool];
                  return (
                    <li
                      key={step.key}
                      className="fade-up flex items-start gap-3 rounded-md border border-edge bg-surface/60 px-3 py-2.5"
                    >
                      <span className="text-lg leading-none">{meta?.icon ?? '•'}</span>
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          {meta?.label ?? step.label}
                        </div>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-ece9f0">{step.summary}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="relative rounded-lg border border-edge bg-surface/60 p-1">
          <div className="flex items-center gap-2 border-b border-edge px-4 py-3">
            <span className="h-2 w-2 rounded-full bg-signal pulse-dot" />
            <span className="font-mono text-xs uppercase tracking-widest text-muted">agent working</span>
          </div>

          {/* Fixed height (not max-height) so this panel never resizes as steps
              reveal — keeping the sticky left column stable instead of shifting
              as the right column grows. Internal scroll handles overflow. */}
          <div className="thin-scroll relative h-[480px] overflow-y-auto p-3">
            {grouped.length === 0 && !synthesizing && (
              <p className="px-2 py-4 font-mono text-xs text-muted">Waiting for the agent to start…</p>
            )}

            {grouped.map((group) => (
              <div key={group.key} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {group.label}
                  </span>
                </div>
                <ol className="space-y-1">
                  {group.steps.map((step) => {
                    const isActive = step.key === activeKey;
                    return (
                      <li
                        key={step.key}
                        ref={isActive ? activeStepRef : undefined}
                        className={`fade-up flex items-start gap-3 rounded-lg px-3 py-2 transition-colors ${
                          isActive ? 'border border-signal/30 bg-signaldim' : 'border border-transparent'
                        }`}
                      >
                        <span className="mt-1 flex h-4 w-4 flex-none items-center justify-center">
                          {isActive ? (
                            <span className="block h-3 w-3 animate-spin rounded-full border-2 border-edge border-t-signal" />
                          ) : (
                            <span className="font-mono text-xs text-signal">✓</span>
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className={`text-sm ${isActive ? 'text-ece9f0' : 'text-muted'}`}>{step.label}</p>
                          <p className="truncate font-mono text-[11px] text-muted">
                            {isActive ? step.description : step.summary || step.description}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}

            {synthesizing && (
              <div className="fade-up rounded-lg border border-signal/30 bg-signaldim p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">✨</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-signal">Writing your analysis</div>
                    <div className="mt-0.5 font-mono text-[11px] text-muted">
                      Synthesizing {allSteps.filter((s) => s.status === 'done').length} data points into
                      recruiter intelligence…
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <span
                      key={i}
                      className="h-1 flex-1 rounded-full bg-signal/30 pulse-dot"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Visual cue that the feed continues below the fold — easy to miss
              that earlier steps have scrolled out of view once the list grows. */}
          <div className="pointer-events-none absolute inset-x-1 bottom-1 h-10 rounded-b-lg bg-gradient-to-t from-surface/90 to-transparent" />
        </div>
      </div>
    </div>
  );
}
