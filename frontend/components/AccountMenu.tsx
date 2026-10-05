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

export function AccountMenu({ workspace }: { workspace: 'developer' | 'recruiter' }) {
  const { user, loading, openSignIn, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
        className="flex items-center gap-1.5 rounded-lg border border-signal/40 bg-signal/10 px-3 py-1.5 font-mono text-xs font-bold text-signal shadow-xs transition-colors hover:bg-signal/20 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
      >
        <Icon.LogOut className="h-3.5 w-3.5" />
        <span>Sign in</span>
      </button>
    );
  }

  const label = user.handle || user.email?.split('@')[0] || user.id.slice(0, 8);
  const initials = label.slice(0, 2).toUpperCase();

  const contexts: Array<{ href: string; label: string; current: boolean; icon: JSX.Element }> = [
    {
      href: '/developer',
      label: 'Developer workspace',
      current: workspace === 'developer',
      icon: <Icon.Github className="h-3.5 w-3.5" />,
    },
    {
      href: '/recruiter',
      label: 'Recruiter workspace',
      current: workspace === 'recruiter',
      icon: <Icon.Briefcase className="h-3.5 w-3.5" />,
    },
  ];

  return (
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
          className="fade-up absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-xl border border-edge bg-card shadow-card"
        >
          <div className="border-b border-edge px-3.5 py-2.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Signed in as
            </div>
            <div className="mt-0.5 truncate font-mono text-xs font-semibold text-content">
              {user.email || `@${label}`}
            </div>
          </div>
          <div className="p-1.5">
            <div className="px-2 pb-1 pt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
              Switch workspace
            </div>
            {contexts.map((ctx) => (
              <Link
                key={ctx.href}
                href={ctx.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 font-mono text-xs transition-colors ${
                  ctx.current
                    ? 'bg-signal/10 text-signal'
                    : 'text-content hover:bg-well hover:text-signal'
                }`}
              >
                {ctx.icon}
                <span className="flex-1">{ctx.label}</span>
                {ctx.current && <Icon.Check className="h-3 w-3" />}
              </Link>
            ))}
          </div>
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
  );
}
