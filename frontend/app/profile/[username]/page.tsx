'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useDevScopeStream } from '@/hooks/useDevScopeStream';
import { AgentTrace } from '@/components/AgentTrace';
import { AgentProgress } from '@/components/AgentProgress';
import { ProfileView } from '@/components/ProfileView';

export default function ProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const username = String(params.username || '');
  const liveUrl = searchParams.get('liveUrl') || undefined;
  const { status, trace, profile, cached, error, generate, reset } = useDevScopeStream();

  useEffect(() => {
    if (username) generate(username, false, liveUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, liveUrl]);

  const isWorking = status === 'connecting' || status === 'streaming';

  return (
    <main className="min-h-screen">
      <nav className="sticky top-0 z-10 border-b border-edge bg-ink/80 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-muted transition-colors hover:text-signal"
          >
            <span className="h-2 w-2 rounded-full bg-signal" />
            devscope
          </Link>
          <div className="flex items-center gap-5">
            {status === 'complete' && (
              <button
                onClick={() => generate(username, true, liveUrl)}
                className="font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:text-signal"
              >
                ↻ regenerate
              </button>
            )}
            <Link
              href="/"
              className="rounded-md border border-edge px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:border-signal/50 hover:text-signal"
            >
              ＋ analyze another
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-10 print:max-w-none print:p-0">
        {error && (
          <div className="fade-up mx-auto max-w-xl rounded-xl border border-edge/80 bg-surface/90 p-8 text-center shadow-2xl print:hidden">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 text-xl text-signal">
              ⚠️
            </div>
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-signal">
              Analysis Temporarily Paused
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ece9f0/90">
              {error.message}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => generate(username, true, liveUrl)}
                className="rounded-lg bg-signal px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-ink shadow transition-all hover:bg-signal/90 active:scale-95"
              >
                ↻ Retry Analysis
              </button>
              <Link
                href="/"
                className="rounded-lg border border-edge bg-surface/60 px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-muted transition-all hover:border-signal/50 hover:text-ece9f0"
              >
                ← Analyze Another Candidate
              </Link>
            </div>
            {error.technicalDetails && (
              <details className="mt-6 text-left border-t border-edge/60 pt-4">
                <summary className="cursor-pointer font-mono text-[11px] text-muted hover:text-signal">
                  Technical Diagnostics (Admin / Developer)
                </summary>
                <div className="mt-2 max-h-36 overflow-y-auto rounded bg-ink/70 p-3 font-mono text-[11px] leading-relaxed text-zinc-400 border border-edge/40 break-all select-all">
                  {error.technicalDetails}
                </div>
              </details>
            )}
          </div>
        )}

        {!error && isWorking && <AgentProgress username={username} trace={trace} />}

        {!error && status === 'complete' && profile && (
          <>
            {cached && (
              <div className="fade-up mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-edge bg-surface/60 px-4 py-3 print:hidden">
                <p className="font-mono text-[11px] text-muted">
                  <span className="text-signal">⚡ instant result —</span> this profile was analyzed
                  before, so we served it from cache instead of running the agent again.
                </p>
                <button
                  onClick={() => generate(username, true)}
                  className="flex-none rounded-md border border-edge px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:border-signal/50 hover:text-signal"
                >
                  ↻ run a fresh analysis
                </button>
              </div>
            )}
            <ProfileView profile={profile} />
            {trace.length > 0 && (
              <details className="mt-10 border-t border-edge pt-6 print:hidden">
                <summary className="cursor-pointer font-mono text-xs uppercase tracking-widest text-muted hover:text-signal">
                  view agent trace ({trace.filter((t) => t.type === 'tool_call').length} tool calls)
                </summary>
                <div className="mt-4 max-w-md">
                  <AgentTrace trace={trace} active={false} />
                </div>
              </details>
            )}
          </>
        )}
      </div>

      <footer className="border-t border-edge py-6 text-center print:hidden">
        <p className="font-mono text-[11px] text-muted/60">
          developed by{' '}
          <a
            href="#"
            target="_blank"
            rel="noreferrer"
            className="text-muted transition-colors hover:text-signal"
          >
            Golam Rabby
          </a>
        </p>
      </footer>
    </main>
  );
}
