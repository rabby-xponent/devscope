'use client';

import { TraceEvent } from '@/types/profile';

const TOOL_LABELS: Record<string, string> = {
  get_github_profile: 'Reading profile',
  get_repos: 'Scanning repositories',
  get_repo_readme: 'Reading README',
  get_contribution_stats: 'Analyzing contributions',
  get_pinned_repos: 'Checking pinned work',
  search_hackernews: 'Searching Hacker News',
  search_devto: 'Searching DEV.to',
  web_search: 'Searching the web',
};

export function AgentTrace({
  trace,
  active,
}: {
  trace: TraceEvent[];
  active: boolean;
}) {
  return (
    <div className="rounded-lg border border-edge bg-surface/60 p-1">
      <div className="flex items-center gap-2 border-b border-edge px-4 py-3">
        <span
          className={`h-2 w-2 rounded-full ${
            active ? 'bg-signal pulse-dot' : 'bg-muted'
          }`}
        />
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          {active ? 'agent working' : 'agent trace'}
        </span>
      </div>

      <div className="thin-scroll max-h-[460px] overflow-y-auto p-3">
        {trace.length === 0 && (
          <p className="px-2 py-4 font-mono text-xs text-muted">
            Waiting for the agent to start…
          </p>
        )}

        <ol className="space-y-1">
          {trace.map((e, i) => {
            if (e.type === 'tool_call') {
              return (
                <li key={i} className="fade-up flex items-start gap-3 px-2 py-1.5">
                  <span className="mt-0.5 font-mono text-[10px] text-signal">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-ece9f0">
                      {TOOL_LABELS[e.tool || ''] || e.tool}
                    </p>
                    {e.input && (
                      <p className="truncate font-mono text-[11px] text-muted">
                        {Object.values(e.input).join(' · ')}
                      </p>
                    )}
                  </div>
                </li>
              );
            }
            if (e.type === 'tool_result') {
              return (
                <li
                  key={i}
                  className="fade-up flex items-start gap-3 px-2 pb-2 pl-9"
                >
                  <span className="mt-1 h-px w-3 flex-none bg-edge" />
                  <p className="font-mono text-[11px] leading-relaxed text-muted">
                    {e.summary}
                  </p>
                </li>
              );
            }
            return null;
          })}
        </ol>
      </div>
    </div>
  );
}
