'use client';

/**
 * Account control for both workspace navs (M24B). Signed out: a sign-in
 * button (opens the auth modal). Signed in: identity chip with a dropdown —
 * workspace context switcher (Developer / Recruiter routes) + sign out.
 * The two contexts share the account, never the data (red line, §4).
 */

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { useSession } from '@/components/SessionProvider';
import { useEntitlements } from '@/hooks/useEntitlements';
import { PLANS, startPortal, BillingError } from '@/lib/billing';
import { isAdmin } from '@/lib/admin';
import { updatePassword } from '@/lib/auth';
import { BkashNagadModal } from '@/components/BkashNagadModal';

export function AccountMenu({ workspace }: { workspace: 'developer' | 'recruiter' }) {
  const { user, loading, openSignIn, signOut } = useSession();
  const { entitlements } = useEntitlements();
  const [open, setOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingNote, setBillingNote] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const paid = entitlements.tier === 'pro' || entitlements.tier === 'team';
  const isSuperAdmin = isAdmin(user);

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }
    setPwBusy(true);
    setPwError(null);
    try {
      await updatePassword(newPassword);
      setPwSuccess(true);
    } catch (err: any) {
      setPwError(err?.message || 'Failed to update password.');
    } finally {
      setPwBusy(false);
    }
  }

  /** Self-serve billing: the portal handles cancel, plan change for existing paid users. */
  async function handleBilling() {
    if (!paid) {
      setShowPaymentModal(true);
      setOpen(false);
      return;
    }
    setBillingBusy(true);
    setBillingNote(null);
    try {
      const { url } = await startPortal();
      window.location.href = url;
    } catch (err) {
      setBillingNote(
        err instanceof BillingError && err.notConfigured
          ? 'Billing portal is not configured on this deployment.'
          : err instanceof Error
            ? err.message
            : 'Billing unavailable.'
      );
      setBillingBusy(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (loading) {
    return (
      <div className="h-[30px] w-20 animate-pulse rounded-lg border border-edge bg-well" />
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={openSignIn}
        className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-[#ea580c]/30 dark:border-signal/40 bg-[#ea580c]/5 dark:bg-signal/10 px-3 py-1.5 font-mono text-xs font-semibold text-[#ea580c] dark:text-signal shadow-xs transition-colors hover:bg-[#ea580c]/10 dark:hover:bg-signal/20 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
      >
        <Icon.Lock className="h-3.5 w-3.5 shrink-0" />
        <span>Sign in</span>
      </button>
    );
  }

  const label = user.handle || user.email?.split('@')[0] || user.id.slice(0, 8);
  const initials = label.slice(0, 2).toUpperCase();

  // Tier display label: if user is logged in, tier should never show 'anonymous'
  const tierDisplay = paid
    ? entitlements.tier === 'pro'
      ? 'Developer Pro'
      : 'Team'
    : 'Free Starter';

  return (
    <>
      <div className="relative" ref={rootRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex items-center gap-2 rounded-xl border border-edge bg-card px-2.5 py-1.5 shadow-xs transition-colors hover:border-signal/50 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-signal/30 bg-signal/10 font-mono text-xs font-bold text-signal">
            {initials}
          </span>
          <span className="hidden md:block font-mono text-xs font-bold text-content">
            @{label}
          </span>
          <Icon.ChevronDown className={`h-3 w-3 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div
            role="menu"
            className="fade-up absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-edge bg-card shadow-card"
          >
            {/* Signed-in identity chip */}
            <div className="border-b border-edge px-3.5 py-2.5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Signed in as
              </div>
              <div className="mt-0.5 truncate font-mono text-xs font-semibold text-content">
                {user.email || `@${label}`}
              </div>
            </div>

            {/* Dedicated Workspace Badge (No dual-switching) */}
            <div className="p-1.5">
              <div className="px-2 pb-1 pt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                Active Space
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-signal/10 px-2.5 py-1.5 font-mono text-xs text-signal font-semibold">
                {workspace === 'recruiter' ? (
                  <>
                    <Icon.Briefcase className="h-3.5 w-3.5 text-[#ea580c]" />
                    <span className="flex-1 text-[#ea580c]">RecruiterOS</span>
                    <span className="rounded bg-[#ea580c]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ea580c]">Recruiter</span>
                  </>
                ) : (
                  <>
                    <Icon.Github className="h-3.5 w-3.5" />
                    <span className="flex-1">Developer CareerOS</span>
                    <span className="rounded bg-signal/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">Developer</span>
                  </>
                )}
              </div>

              {/* MFS Payments Admin: Strictly Gated to Super-Admins */}
              {isSuperAdmin && (
                <Link
                  href="/admin/billing"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="mt-1 flex items-center gap-2 rounded-lg border border-[#ea580c]/20 bg-[#ea580c]/5 px-2 py-1.5 font-mono text-xs text-[#ea580c] hover:bg-[#ea580c]/10 transition-colors"
                >
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-[#ea580c]/20 font-bold text-[9px]">৳</span>
                  <span className="flex-1 font-semibold">MFS Payments Admin</span>
                  <span className="rounded bg-[#ea580c]/20 px-1 py-0.2 text-[8px] uppercase">Admin</span>
                </Link>
              )}
            </div>

            {/* Plan & Upgrade Section */}
            <div className="border-t border-edge p-1.5">
              <div className="flex items-center justify-between px-2 pb-1 pt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                <span>Plan</span>
                <span className={`font-semibold ${paid ? 'text-signal' : 'text-content'}`}>{tierDisplay}</span>
              </div>
              <button
                type="button"
                role="menuitem"
                disabled={billingBusy}
                onClick={() => void handleBilling()}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 font-mono text-xs text-content transition-colors hover:bg-well hover:text-signal disabled:opacity-60"
              >
                <Icon.Zap className="h-3.5 w-3.5 text-[#ea580c] dark:text-signal" />
                <span className="flex-1 text-left font-semibold">
                  {billingBusy
                    ? 'Opening…'
                    : paid
                      ? 'Manage billing'
                      : 'Upgrade to Pro — ৳399/mo'}
                </span>
              </button>
              {billingNote && (
                <p className="px-2 pb-1 font-mono text-[10px] leading-relaxed text-muted">
                  {billingNote}
                </p>
              )}
            </div>

            {/* Password & Security */}
            <div className="border-t border-edge p-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setNewPassword('');
                  setPwError(null);
                  setPwSuccess(false);
                  setShowPasswordModal(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 font-mono text-xs text-content transition-colors hover:bg-well hover:text-signal"
              >
                <Icon.Lock className="h-3.5 w-3.5" />
                <span>Password & Security</span>
              </button>
            </div>

            {/* Sign Out */}
            <div className="border-t border-edge p-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 font-mono text-xs text-muted transition-colors hover:bg-well hover:text-rose-500"
              >
                <Icon.LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Set / Change Password Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="fade-up w-full max-w-sm rounded-2xl border border-edge bg-card p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-edge mb-4">
              <div className="flex items-center gap-2 text-content font-mono text-xs font-bold uppercase tracking-wider">
                <Icon.Lock className="h-4 w-4 text-signal" />
                <span>Password & Security</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-muted hover:text-content"
              >
                <Icon.X className="h-4 w-4" />
              </button>
            </div>

            {pwSuccess ? (
              <div className="py-4 text-center">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                  <Icon.Check className="h-5 w-5" />
                </div>
                <div className="text-emerald-500 font-mono text-xs font-bold">
                  Password updated successfully!
                </div>
                <p className="mt-1 font-sans text-xs text-muted">
                  You can now sign in using your email and this password anytime.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="mt-4 w-full rounded-xl bg-signal py-2 font-mono text-xs font-bold text-white shadow-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <p className="font-sans text-xs text-muted leading-relaxed">
                  Set or change the password for your account (<strong>{user?.email}</strong>) so you can log in directly without waiting for email links.
                </p>

                {pwError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 font-mono text-xs text-rose-500">
                    {pwError}
                  </div>
                )}

                <div>
                  <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
                    New Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-edge bg-well px-3.5 py-2.5 font-mono text-xs text-content outline-none focus:border-signal focus:ring-2 focus:ring-signal/15"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pwBusy || newPassword.length < 6}
                  className="w-full rounded-xl bg-signal py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:brightness-105 disabled:opacity-50"
                >
                  {pwBusy ? 'Saving Password…' : 'Save Password →'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Unified Payment Modal for bKash/Nagad & Cards */}
      <BkashNagadModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        defaultPlan="pro_monthly"
      />
    </>
  );
}
