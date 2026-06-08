'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDevScopeStream } from '@/hooks/useDevScopeStream';
import { AgentTrace } from '@/components/AgentTrace';
import { ProfileView } from '@/components/ProfileView';

export default function ProfilePage() {
  const params = useParams();
  const username = String(params.username || '');
  const { status, trace, profile, error, generate, reset } = useDevScopeStream();

  useEffect(() => {
    if (username) generate(username);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const isWorking = status === 'connecting' || status === 'streaming';

  return (
    <main className="min-h-screen">
      <nav className="sticky top-0 z-10 border-b border-edge bg-ink/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-muted transition-colors hover:text-signal"
          >
            <span className="h-2 w-2 rounded-full bg-signal" />
            devscope
          </Link>
          {status === 'complete' && (
            <button
              onClick={() => generate(username, true)}
              className="font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:text-signal"
            >
              ↻ regenerate
            </button>
          )}
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {error && (
          <div className="fade-up rounded-lg border border-edge bg-surface p-8 text-center">
            <p className="font-mono text-sm text-signal">analysis failed</p>
            <p className="mt-2 text-muted">{error}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => generate(username, true)}
                className="rounded-md bg-signal px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink"
              >
                retry
              </button>
              <Link
                href="/"
                className="rounded-md border border-edge px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted"
              >
                home
              </Link>
            </div>
          </div>
        )}

        {!error && isWorking && (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col items-start justify-center">
              <div className="font-mono text-xs uppercase tracking-widest text-muted">
                analyzing
              </div>
              <h1 className="mt-2 text-3xl text-ece9f0">@{username}</h1>
              <p className="mt-3 max-w-md text-muted">
                The agent is investigating this developer&apos;s public footprint.
                Watch it work in real time →
              </p>
            </div>
            <AgentTrace trace={trace} active />
          </div>
        )}

        {!error && status === 'complete' && profile && (
          <>
            <ProfileView profile={profile} />
            {trace.length > 0 && (
              <details className="mt-10 border-t border-edge pt-6">
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
    </main>
  );
}
