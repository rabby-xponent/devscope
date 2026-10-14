'use client';

/**
 * Modern Authentication Modal (DevScope).
 * - GitHub OAuth
 * - Email + 6-digit OTP (One-Time Password) for Sign In & Sign Up
 * - Supabase when configured, seamless instant fallback locally
 */

import React, { useState } from 'react';
import { Icon } from '@/components/icons';
import {
  authBackend,
  signInWithGitHub,
  sendOtp,
  verifyOtp,
} from '@/lib/auth';

type Mode = 'signin' | 'signup';
type Step = 'input' | 'otp' | 'error';

export default function AuthModal({
  onClose,
  onSignedIn,
}: {
  onClose: () => void;
  onSignedIn: () => void;
}) {
  const backend = authBackend();
  const [mode, setMode] = useState<Mode>('signin');
  const [step, setStep] = useState<Step>('input');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGitHub = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGitHub();
      // OAuth redirects away; resumes at /auth/callback
    } catch (err: any) {
      setError(err?.message || 'GitHub OAuth failed.');
      setStep('error');
    } finally {
      setBusy(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid work or personal email address.');
      setStep('error');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await sendOtp(cleanEmail);
      if (res.simulated) {
        setSimulatedCode(res.code || '123456');
      } else {
        setSimulatedCode(null);
      }
      setStep('otp');
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code.');
      setStep('error');
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
      onSignedIn();
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired OTP code. Please try again.');
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
        className="fade-up w-full max-w-md overflow-hidden rounded-2xl border border-edge bg-card shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Close Button */}
        <div className="flex items-center justify-between border-b border-edge px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-signal shadow-[0_0_8px_#ea580c]" />
            <span className="font-mono text-xs font-bold tracking-widest text-content uppercase">
              DEVSCOPE ACCESS
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-edge bg-well text-muted transition-colors hover:border-signal/50 hover:text-signal"
            aria-label="Close"
          >
            <Icon.X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Sign In / Sign Up Mode Switcher Tabs */}
        {step !== 'otp' && (
          <div className="flex border-b border-edge bg-well/50">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setStep('input');
              }}
              className={`flex-1 py-3 text-center font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                mode === 'signin'
                  ? 'border-b-2 border-signal text-signal bg-card'
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
                setStep('input');
              }}
              className={`flex-1 py-3 text-center font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                mode === 'signup'
                  ? 'border-b-2 border-signal text-signal bg-card'
                  : 'text-muted hover:text-content'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        <div className="p-6">
          {/* Context Title */}
          <div>
            <h2 className="font-sans text-lg font-bold text-content">
              {step === 'otp'
                ? 'Check your email for code'
                : mode === 'signin'
                  ? 'Welcome back to DevScope'
                  : 'Create your workspace'}
            </h2>
            <p className="mt-1 font-sans text-xs leading-relaxed text-muted">
              {step === 'otp'
                ? `Enter the 6-digit code sent to ${email} to sign in instantly.`
                : mode === 'signin'
                  ? 'Access your saved technical audits, candidate pipelines, and roles.'
                  : '3 free audits per rolling 30 days, saved roles, and ATS-ready dossiers. No credit card required.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 font-mono text-xs text-rose-500">
              <Icon.Alert className="h-4 w-4 flex-none mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Input (GitHub OAuth + Email OTP) */}
          {step !== 'otp' ? (
            <div className="mt-6 space-y-4">
              {/* GitHub OAuth Button */}
              <button
                type="button"
                disabled={busy || backend !== 'supabase'}
                onClick={handleGitHub}
                title={backend !== 'supabase' ? 'Direct GitHub OAuth requires NEXT_PUBLIC_SUPABASE_URL. Use Email OTP below.' : undefined}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-content px-4 py-2.5 font-mono text-xs font-bold text-canvas shadow-xs transition-colors hover:bg-content/90 disabled:cursor-not-allowed disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
              >
                <Icon.Github className="h-4 w-4" />
                <span>Continue with GitHub</span>
              </button>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-edge" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  or sign in with Email OTP
                </span>
                <span className="h-px flex-1 bg-edge" />
              </div>

              {/* Email Input Form */}
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="block font-mono text-[11px] font-semibold text-content uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-edge bg-well px-3.5 py-2.5 focus-within:border-signal focus-within:ring-2 focus-within:ring-signal/15">
                    <Icon.Mail className="h-4 w-4 flex-none text-muted" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full bg-transparent font-mono text-xs text-content outline-none placeholder:text-muted/60"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy || !email.trim()}
                  className="w-full rounded-xl bg-signal px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
                >
                  {busy ? 'Sending Code…' : 'Send 6-Digit OTP Code →'}
                </button>
              </form>

              <p className="text-center font-mono text-[10px] text-muted">
                {mode === 'signin' ? "Don't have an account yet? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setError(null);
                  }}
                  className="font-bold text-signal underline hover:brightness-110"
                >
                  {mode === 'signin' ? 'Create one for free' : 'Sign in here'}
                </button>
              </p>
            </div>
          ) : (
            /* Step 2: 6-Digit OTP Verification */
            <div className="mt-6 space-y-4">
              {simulatedCode && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center font-mono text-xs text-emerald-600 dark:text-emerald-400">
                  <div className="font-bold">🧪 Demo / Local Mode Active</div>
                  <div className="mt-1">
                    Your OTP code is: <span className="font-bold tracking-widest text-sm bg-emerald-500/20 px-2 py-0.5 rounded">{simulatedCode}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] font-semibold text-content uppercase tracking-wider mb-1.5">
                    Enter 6-Digit Verification Code
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-edge bg-well px-3.5 py-2.5 focus-within:border-signal focus-within:ring-2 focus-within:ring-signal/15">
                    <Icon.Lock className="h-4 w-4 flex-none text-muted" />
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                      placeholder="123456"
                      className="w-full bg-transparent font-mono text-base font-bold tracking-[0.4em] text-center text-content outline-none placeholder:text-muted/40"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy || otpCode.trim().length < 6}
                  className="w-full rounded-xl bg-signal px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
                >
                  {busy ? 'Verifying…' : 'Verify & Access Workspace →'}
                </button>
              </form>

              <div className="flex items-center justify-between font-mono text-[11px] text-muted pt-2 border-t border-edge">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleSendOtp()}
                  className="hover:text-signal transition-colors underline"
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
                  className="hover:text-signal transition-colors underline"
                >
                  Use a different email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
