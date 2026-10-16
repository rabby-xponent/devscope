'use client';

/**
 * Concise, Minimalist Auth Modal (GitGrill).
 * - Clean layout without visual congestion
 * - Standard Email + Password (Default) with Show/Hide toggle
 * - GitHub OAuth (1-Click)
 * - Sign In does NOT ask for role (existing accounts know their role)
 * - Sign Up has an intuitive Developer / Recruiter persona toggle
 * - Optional email code / magic link fallback
 */

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/icons';
import { GitGrillLogo } from '@/components/GitGrillLogo';
import {
  authBackend,
  signInWithGitHub,
  signInWithPassword,
  signUpWithPassword,
  resetPassword,
  sendOtp,
  verifyOtp,
  getSessionUser,
  onSessionChange,
} from '@/lib/auth';

type Mode = 'signin' | 'signup' | 'forgot';
type AuthMethod = 'password' | 'otp';
type Step = 'input' | 'otp';

export default function AuthModal({
  onClose,
  onSignedIn,
  initialMode = 'signin',
}: {
  onClose: () => void;
  onSignedIn: () => void;
  initialMode?: Mode;
}) {
  const backend = authBackend();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
  const [role, setRole] = useState<'developer' | 'recruiter'>('developer');
  const [step, setStep] = useState<Step>('input');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Auto-detect when session is confirmed via email link in another tab or callback
  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const u = await getSessionUser();
        if (!cancelled && u && u.id) {
          onSignedIn();
        }
      } catch {}
    };

    const off = onSessionChange(() => {
      void checkSession();
    });

    const onStorage = (e: StorageEvent) => {
      if (e.key && (e.key.includes('supabase') || e.key.includes('token') || e.key.includes('session'))) {
        void checkSession();
      }
    };
    window.addEventListener('storage', onStorage);

    const timer = setInterval(() => {
      if (step === 'otp') {
        void checkSession();
      }
    }, 1500);

    return () => {
      cancelled = true;
      off();
      window.removeEventListener('storage', onStorage);
      clearInterval(timer);
    };
  }, [onSignedIn, step]);

  const routeToWorkspace = (assignedRole: string) => {
    onSignedIn();
    if (assignedRole === 'recruiter') {
      window.location.href = '/recruiter';
    } else {
      window.location.href = '/developer';
    }
  };

  /* ------------------------------------------------------------- OAuth */
  const handleGitHub = async () => {
    setBusy(true);
    setError(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('gitgrill_user_role', role);
      }
      await signInWithGitHub(role);
    } catch (err: any) {
      const msg = err?.message || 'GitHub OAuth failed.';
      if (msg.toLowerCase().includes('not enabled') || msg.toLowerCase().includes('unsupported provider')) {
        setError('GitHub OAuth provider is not enabled in your Supabase dashboard. Please use Email + Password below.');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------- Email + Password */
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    setError(null);
    setSuccessNotice(null);

    try {
      if (mode === 'signin') {
        const loggedUser = await signInWithPassword(cleanEmail, password);
        const resolvedRole = loggedUser?.role || role;
        routeToWorkspace(resolvedRole);
      } else {
        const { confirmationRequired } = await signUpWithPassword(cleanEmail, password, role);
        if (confirmationRequired) {
          setSuccessNotice(`Account created! A confirmation link has been sent to ${cleanEmail}.`);
        } else {
          routeToWorkspace(role);
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed.';
      if (msg.toLowerCase().includes('invalid login credentials')) {
        setError('Invalid email or password. Please verify credentials or use "Forgot?".');
      } else if (msg.toLowerCase().includes('already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  /* --------------------------------------------------- Forgot Password */
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await resetPassword(cleanEmail);
      setSuccessNotice(`Password reset link sent to ${cleanEmail}. Check your inbox.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to send password reset email.');
    } finally {
      setBusy(false);
    }
  };

  /* --------------------------------------------------- Passwordless OTP */
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('gitgrill_user_role', role);
      }
      const res = await sendOtp(cleanEmail, role);
      if (res.simulated) {
        setSimulatedCode(res.code || '123456');
      } else {
        setSimulatedCode(null);
      }
      setStep('otp');
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanToken = otpCode.trim();
    if (!cleanToken) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await verifyOtp(email, cleanToken);
      routeToWorkspace(role);
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired code. Please try again or click the link in your email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Authentication modal"
    >
      <div
        className="fade-up w-full max-w-sm overflow-hidden rounded-2xl border border-edge bg-card shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Tabs */}
        <div className="flex items-center justify-between border-b border-edge px-5 py-3.5 bg-well/40">
          <div className="flex items-center">
            <GitGrillLogo size="sm" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:text-content"
            aria-label="Close"
          >
            <Icon.X className="h-4 w-4" />
          </button>
        </div>

        {/* Concise Tab Switcher */}
        {step !== 'otp' && mode !== 'forgot' && (
          <div className="flex border-b border-edge">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessNotice(null);
              }}
              className={`flex-1 py-2.5 text-center font-mono text-xs font-semibold transition-colors ${
                mode === 'signin'
                  ? 'border-b-2 border-signal text-signal font-bold bg-well/20'
                  : 'text-muted hover:text-content'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessNotice(null);
              }}
              className={`flex-1 py-2.5 text-center font-mono text-xs font-semibold transition-colors ${
                mode === 'signup'
                  ? 'border-b-2 border-signal text-signal font-bold bg-well/20'
                  : 'text-muted hover:text-content'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        <div className="p-5 sm:p-6">
          {/* Title */}
          <div className="mb-4">
            <h2 className="font-sans text-base font-bold text-content">
              {step === 'otp'
                ? 'Check your email'
                : mode === 'forgot'
                  ? 'Reset your password'
                  : mode === 'signin'
                    ? 'Welcome back'
                    : 'Create your account'}
            </h2>
          </div>

          {/* Role selector ONLY on Create Account tab (Sign In does not need it) */}
          {mode === 'signup' && step !== 'otp' && (
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-edge bg-well/50 p-1">
                <button
                  type="button"
                  onClick={() => setRole('developer')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-mono text-xs font-semibold transition-all ${
                    role === 'developer'
                      ? 'bg-signal/15 text-signal border border-signal/30 shadow-xs'
                      : 'text-muted hover:text-content'
                  }`}
                >
                  <Icon.Github className="h-3.5 w-3.5" />
                  <span>Developer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-mono text-xs font-semibold transition-all ${
                    role === 'recruiter'
                      ? 'bg-[#ea580c]/15 text-[#ea580c] border border-[#ea580c]/30 shadow-xs'
                      : 'text-muted hover:text-content'
                  }`}
                >
                  <Icon.Briefcase className="h-3.5 w-3.5" />
                  <span>Recruiter</span>
                </button>
              </div>
            </div>
          )}

          {/* Alerts */}
          {successNotice && (
            <div className="mb-3.5 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 font-mono text-xs text-emerald-600 dark:text-emerald-400">
              <Icon.Check className="h-4 w-4 flex-none mt-0.5" />
              <span>{successNotice}</span>
            </div>
          )}
          {error && (
            <div className="mb-3.5 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 font-mono text-xs text-rose-500">
              <Icon.Alert className="h-4 w-4 flex-none mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ------------------------------- STANDARD INPUT FLOW ------------------------------- */}
          {step === 'input' && mode !== 'forgot' && (
            <div className="space-y-3.5">
              {/* GitHub Button */}
              <button
                type="button"
                disabled={busy || backend !== 'supabase'}
                onClick={handleGitHub}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-content px-3.5 py-2 font-mono text-xs font-bold text-canvas shadow-xs transition-colors hover:bg-content/90 disabled:opacity-40"
              >
                <Icon.Github className="h-3.5 w-3.5" />
                <span>Continue with GitHub</span>
              </button>

              <div className="flex items-center gap-2 py-0.5">
                <span className="h-px flex-1 bg-edge" />
                <span className="font-mono text-[10px] uppercase text-muted">or</span>
                <span className="h-px flex-1 bg-edge" />
              </div>

              {/* Password Form (Default) */}
              {authMethod === 'password' ? (
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <div>
                    <label className="block font-mono text-[10px] font-semibold uppercase text-muted mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full rounded-xl border border-edge bg-well px-3 py-2 font-mono text-xs text-content outline-none focus:border-signal focus:ring-1 focus:ring-signal/30"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-mono text-[10px] font-semibold uppercase text-muted">
                        Password
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setError(null);
                            setSuccessNotice(null);
                          }}
                          className="font-mono text-[10px] text-signal hover:underline"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-edge bg-well px-3 py-2 focus-within:border-signal focus-within:ring-1 focus-within:ring-signal/30">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent font-mono text-xs text-content outline-none placeholder:text-muted/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="text-muted hover:text-content"
                      >
                        {showPassword ? <Icon.EyeOff className="h-3.5 w-3.5" /> : <Icon.Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy || !email.trim() || !password}
                    className="w-full rounded-xl bg-signal py-2.5 font-mono text-xs font-bold text-white shadow-xs hover:brightness-105 disabled:opacity-50"
                  >
                    {busy ? 'Connecting…' : mode === 'signup' ? 'Create Account' : 'Sign In'}
                  </button>

                  <div className="text-center pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('otp');
                        setError(null);
                      }}
                      className="font-mono text-[10px] text-muted hover:text-signal transition-colors underline"
                    >
                      Sign in with email OTP instead
                    </button>
                  </div>
                </form>
              ) : (
                /* OTP Fallback Form */
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div>
                    <label className="block font-mono text-[10px] font-semibold uppercase text-muted mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full rounded-xl border border-edge bg-well px-3 py-2 font-mono text-xs text-content outline-none focus:border-signal"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy || !email.trim()}
                    className="w-full rounded-xl bg-signal py-2.5 font-mono text-xs font-bold text-white shadow-xs hover:brightness-105 disabled:opacity-50"
                  >
                    {busy ? 'Sending…' : 'Send One-Time Code'}
                  </button>

                  <div className="text-center pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('password');
                        setError(null);
                      }}
                      className="font-mono text-[10px] text-muted hover:text-signal transition-colors underline"
                    >
                      Use password instead
                    </button>
                  </div>
                </form>
              )}

              {/* Bottom switch mode */}
              <div className="text-center font-mono text-[11px] text-muted pt-2 border-t border-edge">
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setError(null);
                    setSuccessNotice(null);
                  }}
                  className="font-bold text-signal underline hover:brightness-110 ml-0.5"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------- FORGOT PASSWORD ------------------------------- */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-3 mt-1">
              <div>
                <label className="block font-mono text-[10px] font-semibold uppercase text-muted mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full rounded-xl border border-edge bg-well px-3 py-2 font-mono text-xs text-content outline-none focus:border-signal"
                />
              </div>

              <button
                type="submit"
                disabled={busy || !email.trim()}
                className="w-full rounded-xl bg-signal py-2.5 font-mono text-xs font-bold text-white shadow-xs hover:brightness-105 disabled:opacity-50"
              >
                {busy ? 'Sending…' : 'Send Reset Link'}
              </button>

              <div className="text-center pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setSuccessNotice(null);
                  }}
                  className="font-mono text-xs text-signal hover:underline"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* ------------------------------- OTP VERIFICATION ------------------------------- */}
          {step === 'otp' && (
            <div className="space-y-3 mt-1">
              {simulatedCode && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-center font-mono text-xs text-emerald-600">
                  Demo code: <span className="font-bold">{simulatedCode}</span>
                </div>
              )}

              <p className="font-sans text-xs text-muted leading-relaxed">
                We sent a confirmation link & code to <strong>{email}</strong>. Click the link in your email or enter the code below:
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-2.5">
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                  placeholder="123456"
                  className="w-full rounded-xl border border-edge bg-well px-3 py-2 font-mono text-sm text-center font-bold tracking-[0.25em] text-content outline-none focus:border-signal"
                />

                <button
                  type="submit"
                  disabled={busy || otpCode.trim().length < 6}
                  className="w-full rounded-xl bg-signal py-2.5 font-mono text-xs font-bold text-white shadow-xs hover:brightness-105 disabled:opacity-50"
                >
                  {busy ? 'Verifying…' : 'Verify & Continue'}
                </button>
              </form>

              <div className="flex items-center justify-between font-mono text-[10px] text-muted pt-1">
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  className="hover:text-signal underline"
                >
                  Resend code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setOtpCode('');
                    setError(null);
                  }}
                  className="hover:text-signal underline"
                >
                  Use password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
