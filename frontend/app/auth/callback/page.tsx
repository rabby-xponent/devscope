'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { handleAuthCallback, updatePassword, onAuthRecovery } from '@/lib/auth';
import { useSession } from '@/components/SessionProvider';
import { GitGrillLogo } from '@/components/GitGrillLogo';
import { Icon } from '@/components/icons';
import { ThemeToggle } from '@/lib/theme';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh, openSignIn } = useSession();

  const [status, setStatus] = useState<'processing' | 'recovery' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Immediately capture Supabase PASSWORD_RECOVERY event
    const offRecovery = onAuthRecovery(() => {
      if (!cancelled) {
        setStatus('recovery');
      }
    });

    async function processAuth() {
      try {
        const res = await handleAuthCallback();
        if (cancelled) return;

        if (res.success) {
          if (res.isRecovery) {
            setStatus('recovery');
            return;
          }

          setStatus('success');
          await refresh();

          // Check if there's a next destination or route to role workspace
          const savedRole = typeof window !== 'undefined' ? localStorage.getItem('gitgrill_user_role') : null;
          const defaultDest = savedRole === 'recruiter' ? '/recruiter' : '/developer';
          const nextUrl = searchParams.get('next') || defaultDest;
          setTimeout(() => {
            if (!cancelled) {
              router.push(nextUrl);
            }
          }, 1200);
        } else {
          setStatus('error');
          setErrorMessage(res.error || 'Authentication link is invalid or has expired.');
        }
      } catch (err: any) {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(err?.message || 'Failed to process authentication.');
      }
    }

    processAuth();

    return () => {
      cancelled = true;
      offRecovery();
    };
  }, [refresh, router, searchParams]);

  async function handleRecoverySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setRecoveryError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setRecoveryError('Passwords do not match.');
      return;
    }

    setRecoveryBusy(true);
    setRecoveryError(null);
    try {
      await updatePassword(newPassword);
      setStatus('success');
      await refresh();
      const savedRole = typeof window !== 'undefined' ? localStorage.getItem('gitgrill_user_role') : null;
      const defaultDest = savedRole === 'recruiter' ? '/recruiter' : '/developer';
      setTimeout(() => {
        router.push(defaultDest);
      }, 1500);
    } catch (err: any) {
      setRecoveryError(err?.message || 'Failed to update password.');
    } finally {
      setRecoveryBusy(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="fade-up relative w-full max-w-md rounded-2xl border border-edge bg-card p-8 sm:p-10 text-center shadow-card overflow-hidden">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full bg-signal/15 blur-3xl" />

        {status === 'processing' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-signal/40 bg-signal/10 text-signal shadow-xs">
              <Icon.Refresh className="h-6 w-6 animate-spin text-signal" />
            </div>
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-content">
              Authenticating With GitGrill…
            </h2>
            <p className="font-sans text-xs leading-relaxed text-muted">
              Verifying your security credentials and initializing your engineering workspace.
            </p>
          </div>
        )}

        {status === 'recovery' && (
          <div className="space-y-4 text-left">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-signal/40 bg-signal/10 text-signal shadow-xs">
              <Icon.Lock className="h-7 w-7 text-signal" />
            </div>
            <div className="text-center">
              <h2 className="font-mono text-base font-bold uppercase tracking-wider text-content">
                Set New Password
              </h2>
              <p className="font-sans text-xs text-muted mt-1">
                Your reset link is verified. Choose a secure new password for your account.
              </p>
            </div>

            {recoveryError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 font-mono text-xs text-rose-500">
                {recoveryError}
              </div>
            )}

            <form onSubmit={handleRecoverySubmit} className="space-y-3 pt-2">
              <div>
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                  New Password (min 6 characters)
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-edge bg-well px-3.5 py-2.5 focus-within:border-signal">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent font-mono text-xs text-content outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="text-muted hover:text-content"
                  >
                    {showPw ? <Icon.EyeOff className="h-4 w-4" /> : <Icon.Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                  Confirm New Password
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-edge bg-well px-3.5 py-2.5 focus-within:border-signal">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent font-mono text-xs text-content outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    className="text-muted hover:text-content"
                  >
                    {showConfirmPw ? <Icon.EyeOff className="h-4 w-4" /> : <Icon.Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={recoveryBusy || newPassword.length < 6 || newPassword !== confirmPassword}
                className="w-full rounded-xl bg-signal py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:brightness-105 disabled:opacity-50"
              >
                {recoveryBusy ? 'Saving Password…' : 'Save Password & Access Workspace →'}
              </button>
            </form>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-500 shadow-xs">
              <Icon.Check className="h-7 w-7 text-emerald-500" />
            </div>
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-content">
              Authentication Verified!
            </h2>
            <p className="font-sans text-xs leading-relaxed text-muted">
              Identity confirmed. Redirecting you to your GitGrill workspace…
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStatus('recovery')}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-signal hover:underline"
              >
                <Icon.Lock className="h-3.5 w-3.5" />
                <span>Want to set or change your account password? Click here →</span>
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-500 shadow-xs">
              <Icon.Alert className="h-7 w-7 text-rose-500" />
            </div>

            <div>
              <h2 className="font-mono text-base font-bold uppercase tracking-wider text-content">
                Authentication Link Expired
              </h2>
              <p className="mt-2 font-sans text-xs leading-relaxed text-rose-400/90 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                {errorMessage}
              </p>
            </div>

            <p className="font-sans text-[11px] leading-relaxed text-muted">
              Security links expire quickly for account safety. You can easily request a fresh sign-in code or use email OTP.
            </p>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  router.push('/');
                  setTimeout(() => openSignIn(), 150);
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-signal px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:brightness-105 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
              >
                <Icon.Mail className="h-3.5 w-3.5" />
                <span>Request New Sign-In Code</span>
              </button>

              <Link
                href="/"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-edge bg-well px-4 py-2 font-mono text-xs font-semibold text-content transition-colors hover:border-signal/50 hover:text-signal shadow-xs"
              >
                <Icon.Home className="h-3.5 w-3.5 text-muted" />
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <main className="page-texture min-h-screen bg-canvas text-content flex flex-col justify-between selection:bg-orange-500 selection:text-white dark:selection:bg-signal dark:selection:text-ink transition-colors duration-200">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-30 border-b border-edge bg-card/90 backdrop-blur-md px-6 py-3.5 flex-none">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center">
            <GitGrillLogo size="sm" />
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-well px-3 py-1.5 font-mono text-xs font-semibold text-content transition-colors hover:border-signal/50 hover:text-signal shadow-xs"
            >
              <Icon.Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="font-mono text-xs text-muted flex items-center gap-2">
              <Icon.Refresh className="h-4 w-4 animate-spin text-signal" />
              <span>Processing authentication…</span>
            </div>
          </div>
        }
      >
        <AuthCallbackContent />
      </Suspense>

      {/* Footer */}
      <footer className="border-t border-edge/80 py-6 text-center print:hidden flex-none mt-auto bg-card/40">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-muted">
          <span>GitGrill · Technical Ground-Truth Intelligence & Code Defense</span>
          <span>
            developed by{' '}
            <a
              href="https://www.linkedin.com/in/golamrabby-/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#ea580c] dark:text-signal hover:underline transition-colors"
            >
              Golam Rabby
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
