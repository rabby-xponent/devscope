'use client';

/**
 * Sign-in modal (M24B). GitHub OAuth for developers, email magic link for
 * recruiters — Supabase when configured, dev-auth fallback locally. Honest
 * about what the account gives you; never a dark pattern.
 */

import React, { useState } from 'react';
import { Icon } from '@/components/icons';
import {
  authBackend,
  devSignIn,
  signInWithGitHub,
  signInWithMagicLink,
} from '@/lib/auth';

type Step = 'choose' | 'email-sent' | 'error' | 'success';

export default function AuthModal({
  onClose,
  onSignedIn,
}: {
  onClose: () => void;
  onSignedIn: () => void;
}) {
  const backend = authBackend();
  const [step, setStep] = useState<Step>('choose');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed.');
      setStep('error');
    } finally {
      setBusy(false);
    }
  };

  const handleGitHub = () =>
    run(async () => {
      await signInWithGitHub();
      // OAuth redirects away; success path resumes at /auth/callback.
    });

  const handleEmail = () =>
    run(async () => {
      if (!email.trim()) throw new Error('Enter your email first.');
      if (backend === 'supabase') {
        await signInWithMagicLink(email.trim());
        setStep('email-sent');
      } else {
        await devSignIn(email.trim(), handle.trim().replace(/^@/, ''));
        onSignedIn();
      }
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to DevScope"
    >
      <div
        className="fade-up w-full max-w-md rounded-2xl border border-edge bg-card p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-mono text-base font-bold text-content">Create your workspace</h2>
            <p className="mt-1 font-sans text-xs leading-relaxed text-muted">
              3 free audits per rolling 30 days, saved target roles, and publishable Proof
              Pages. No credit card. Your current local work carries over.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 flex-none items-center justify-center rounded-md border border-edge bg-well text-muted transition-colors hover:border-signal/50 hover:text-signal"
            aria-label="Close"
          >
            <Icon.X className="h-3.5 w-3.5" />
          </button>
        </div>

        {step === 'error' && (
          <p className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 font-mono text-[11px] text-rose-500">
            {error}
          </p>
        )}

        {step === 'email-sent' ? (
          <div className="mt-5 rounded-xl border border-signal/30 bg-signal/[0.06] p-4 text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-signal/30 bg-signal/10 text-signal">
              <Icon.Mail className="h-4 w-4" />
            </span>
            <p className="mt-3 font-mono text-xs font-semibold text-content">Check your inbox</p>
            <p className="mt-1 font-sans text-[11px] leading-relaxed text-muted">
              We sent a sign-in link to <span className="text-content">{email}</span>. Open it
              on this device to finish — the link expires shortly.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <button
              type="button"
              disabled={busy || backend !== 'supabase'}
              onClick={handleGitHub}
              title={backend !== 'supabase' ? 'Needs Supabase configuration (see .env.example)' : undefined}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-content px-4 py-2.5 font-mono text-xs font-bold text-canvas shadow-xs transition-colors hover:bg-content/90 disabled:cursor-not-allowed disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
            >
              <Icon.Github className="h-4 w-4" />
              Continue with GitHub
            </button>
            {backend !== 'supabase' && (
              <p className="text-center font-mono text-[10px] text-muted/70">
                GitHub sign-in activates once the Supabase project is connected. Use the local
                developer sign-in below meanwhile.
              </p>
            )}

            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-edge" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">or</span>
              <span className="h-px flex-1 bg-edge" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-xl border border-edge bg-well px-3 py-2 focus-within:border-signal focus-within:ring-2 focus-within:ring-signal/15">
                <Icon.Mail className="h-3.5 w-3.5 flex-none text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-transparent font-mono text-xs text-content outline-none placeholder:text-muted/60"
                />
              </div>
              {backend === 'dev' && (
                <div className="flex items-center gap-2 rounded-xl border border-edge bg-well px-3 py-2 focus-within:border-signal focus-within:ring-2 focus-within:ring-signal/15">
                  <Icon.Github className="h-3.5 w-3.5 flex-none text-muted" />
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="github-handle (local dev sign-in)"
                    className="w-full bg-transparent font-mono text-xs text-content outline-none placeholder:text-muted/60"
                  />
                </div>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={handleEmail}
                className="w-full rounded-xl bg-signal px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[#0c0b0e] shadow-xs transition-colors hover:bg-signal/90 disabled:cursor-not-allowed disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
              >
                {busy
                  ? 'Working…'
                  : backend === 'supabase'
                    ? 'Send magic link'
                    : 'Sign in (local dev)'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
