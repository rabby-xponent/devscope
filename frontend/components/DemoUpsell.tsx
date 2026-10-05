'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { useSession } from '@/components/SessionProvider';
import { authBackend } from '@/lib/auth';

/**
 * Anonymous demo funnel surfaces (M24A — MONETIZATION_BUILD_TRACKER.md).
 *
 * The demo is the top of funnel: one free fresh audit per profile. These two
 * surfaces make the boundary legible instead of surprising:
 * - `DemoSignupBanner` — shown right after a fresh (non-cached) demo audit.
 * - `DemoWall` — replaces the generic error card when the backend emits
 *   `demo_exhausted` / `rate_limited`.
 *
 * Until accounts ship (M24B), the signup CTA honestly says "next milestone"
 * and explains the current local workspace. No dark patterns: everything
 * already generated stays viewable, and cached re-opens are always free.
 */

function SignupCta({ label = 'Create your free workspace' }: { label?: string }) {
  const { openSignIn } = useSession();
  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={openSignIn}
        className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#0c0b0e] shadow-xs transition-all hover:bg-signal/90 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
      >
        <Icon.Sparkle className="h-3 w-3" />
        {label}
      </button>
      <p className="max-w-sm text-[11px] leading-relaxed text-muted">
        {authBackend() === 'supabase'
          ? '3 free audits per rolling 30 days, saved roles, proof pages — no card. Your local work carries over.'
          : 'Local dev sign-in is live (Supabase project pending). Your local work carries over.'}
      </p>
    </div>
  );
}

export function DemoSignupBanner({ username }: { username: string }) {
  // sessionStorage reads must wait for mount to avoid an SSR hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(sessionStorage.getItem('devscope_demo_banner_dismissed_v1') === '1');
    } catch {
      /* ignore */
    }
  }, []);

  if (!mounted || dismissed) return null;

  return (
    <div className="fade-up mb-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-signal/30 bg-signal/[0.06] px-4 py-3 print:hidden">
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-wider text-signal">
          <span className="inline-flex items-center gap-1">
            <Icon.Zap className="h-3 w-3" />
            free demo used — @{username}
          </span>
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          That was your free demo audit for this profile. A free workspace gives you{' '}
          <span className="text-content">3 analyses a month</span>, saved target roles, and
          proof pages — no credit card. Re-opening this profile stays free either way.
        </p>
      </div>
      <div className="flex flex-none items-center gap-3">
        <SignupCta label="Create free workspace" />
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.setItem('devscope_demo_banner_dismissed_v1', '1');
            } catch {
              /* ignore */
            }
            setDismissed(true);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-edge bg-card text-muted transition-colors hover:border-signal/50 hover:text-signal"
          title="Dismiss"
          aria-label="Dismiss"
        >
          <Icon.X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function DemoWall({
  code,
  username,
  message,
}: {
  code: 'demo_exhausted' | 'rate_limited' | 'quota_exhausted';
  username: string;
  message: string;
}) {
  const isExhausted = code === 'demo_exhausted';
  const isQuota = code === 'quota_exhausted';
  return (
    <div className="fade-up mx-auto max-w-xl rounded-xl border border-edge bg-card p-8 text-center shadow-card">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-signal/30 bg-signal/10 text-signal">
        <Icon.Zap className="h-5 w-5" />
      </div>
      <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-content">
        {isExhausted ? 'Free demo used' : isQuota ? 'Free audits used' : 'Demo temporarily paused'}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>

      <div className="mt-6 flex flex-col items-center gap-4">
        <SignupCta label={isQuota ? 'Get unlimited audits' : 'Create your free workspace'} />
        <p className="max-w-sm text-[11px] leading-relaxed text-muted/80">
          {isExhausted
            ? 'Everything already generated stays viewable, and re-opening analyzed profiles is always free.'
            : isQuota
              ? 'Your quota resets on a rolling 30-day window — existing analyses never disappear.'
              : 'The limit resets on a rolling hourly window — nothing is lost in the meantime.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:text-signal"
        >
          <Icon.ArrowLeft className="h-3 w-3" />
          analyze another candidate
        </Link>
      </div>
    </div>
  );
}
