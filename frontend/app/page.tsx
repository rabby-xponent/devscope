'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const EXAMPLES = ['torvalds', 'sindresorhus', 'gaearon', 'tj'];

export default function Home() {
  const [username, setUsername] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [showLiveUrl, setShowLiveUrl] = useState(false);
  const router = useRouter();

  const go = (u: string, live?: string) => {
    const clean = u.trim().replace(/^@/, '');
    if (clean) {
      const urlToPass = live !== undefined ? live : liveUrl;
      const query = urlToPass.trim() ? `?liveUrl=${encodeURIComponent(urlToPass.trim())}` : '';
      router.push(`/profile/${encodeURIComponent(clean)}${query}`);
    }
  };

  return (
    <main className="grid-bg relative min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/80 to-ink" />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6">
        <div className="fade-up flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-muted">
          <span className="h-2 w-2 rounded-full bg-signal" />
          devscope
        </div>

        <h1 className="fade-up mt-8 text-center text-4xl leading-tight text-ece9f0 sm:text-5xl">
          GitHub & live app
          <br />
          <span className="text-signal">intelligence</span>
        </h1>

        <p className="fade-up mt-5 max-w-md text-center text-[15px] leading-relaxed text-muted">
          Multi-signal technical evaluation for tech hiring. Audits public code,
          inspects live deployed applications, and builds recruiter screening briefs.
        </p>

        <div className="fade-up mt-10 w-full max-w-md space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-edge bg-surface p-2 focus-within:border-signal/60">
            <span className="pl-2 font-mono text-muted">@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && go(username)}
              placeholder="github-username"
              className="flex-1 bg-transparent font-mono text-ece9f0 outline-none placeholder:text-muted/50"
              autoFocus
            />
            <button
              onClick={() => go(username)}
              className="rounded-md bg-signal px-4 py-2 font-mono text-xs font-medium uppercase tracking-wider text-ink transition-opacity hover:opacity-90"
            >
              analyze
            </button>
          </div>

          {showLiveUrl ? (
            <div className="flex items-center gap-2 rounded-lg border border-edge bg-surface/80 p-2 focus-within:border-signal/60 fade-up">
              <span className="pl-2 text-sm">🌐</span>
              <input
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && go(username)}
                placeholder="https://live-app.vercel.app (optional demo/portfolio)"
                className="flex-1 bg-transparent font-mono text-xs text-ece9f0 outline-none placeholder:text-muted/50"
              />
              <button
                type="button"
                onClick={() => {
                  setLiveUrl('');
                  setShowLiveUrl(false);
                }}
                className="font-mono text-xs text-muted hover:text-signal pr-2"
                title="Remove URL"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLiveUrl(true)}
              className="flex items-center gap-1.5 font-mono text-[11px] text-muted transition-colors hover:text-signal"
            >
              <span>＋</span>
              <span>Audit live deployed project or portfolio demo</span>
            </button>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-muted">try:</span>
            {EXAMPLES.map((e) => (
              <button
                key={e}
                onClick={() => go(e, '')}
                className="rounded-full border border-edge px-3 py-1 font-mono text-[11px] text-muted transition-colors hover:border-signal/50 hover:text-signal"
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="fade-up absolute bottom-6 flex flex-col items-center gap-1.5 text-center">
          <span className="font-mono text-[11px] text-muted/60">
            powered by a multi-provider LLM gateway with automatic failover
          </span>
          <span className="font-mono text-[11px] text-muted/60">
            developed by{' '}
            <a
              href="https://www.linkedin.com/in/golamrabby-/"
              target="_blank"
              rel="noreferrer"
              className="text-muted transition-colors hover:text-signal"
            >
              Golam Rabby
            </a>
          </span>
        </div>
      </div>
    </main>
  );
}

