'use client';

import Link from 'next/link';
import { GitGrillLogo } from '@/components/GitGrillLogo';
import { Icon } from '@/components/icons';
import { ThemeToggle } from '@/lib/theme';

export default function NotFound() {
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
              <Icon.ArrowLeft className="h-3.5 w-3.5" />
              <span>Return Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main 404 Hero Container */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="fade-up relative w-full max-w-lg rounded-2xl border border-edge bg-card p-8 sm:p-10 text-center shadow-card overflow-hidden">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-signal/15 blur-3xl" />

          {/* Icon Badge */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-signal/30 bg-signal/10 text-signal shadow-xs">
            <Icon.Alert className="h-7 w-7" />
          </div>

          {/* 404 Header */}
          <div className="font-mono text-5xl font-black tracking-tight text-signal sm:text-6xl">
            404
          </div>
          <div className="mt-2 font-mono text-xs font-bold uppercase tracking-widest text-content">
            Ground-Truth Signal Not Found
          </div>

          <p className="mt-3 text-sm leading-relaxed text-muted font-sans max-w-sm mx-auto">
            The candidate dossier, auth callback, or resource you requested could not be located or has expired.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-signal px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:brightness-105 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
            >
              <Icon.Home className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>

            <Link
              href="/recruiter"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-edge bg-well px-5 py-2.5 font-mono text-xs font-semibold text-content transition-colors hover:border-signal/50 hover:text-signal shadow-xs"
            >
              <Icon.Briefcase className="h-4 w-4 text-muted" />
              <span>RecruiterOS</span>
            </Link>
          </div>

          <div className="mt-6 pt-5 border-t border-edge/60 text-center">
            <p className="font-mono text-[11px] text-muted">
              Looking to audit an engineer?{' '}
              <Link href="/" className="font-bold text-signal underline hover:brightness-110">
                Launch a candidate grill →
              </Link>
            </p>
          </div>
        </div>
      </div>

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
