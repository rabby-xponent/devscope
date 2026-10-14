'use client';

/**
 * Engineering Dossier (portfolio section).
 *
 * A recruiter-facing window into HOW the product was built: the decisions
 * behind it, the tests that prove them, and the stack. The section itself is
 * a compact invitation; clicking anywhere on it opens a right-side drawer —
 * a drawer rather than a centered modal because the content is long and
 * scroll-worthy, and a small modal would turn reading into scroll-jail.
 *
 * All content lives in `lib/dossier.ts` — adding a decision or stat never
 * touches this component.
 */

import React, { useEffect } from 'react';
import { Icon } from '@/components/icons';
import {
  DOSSIER_STATS,
  DOSSIER_DECISIONS,
  DOSSIER_VERIFICATION,
  DOSSIER_STACK,
  DossierDecision,
} from '@/lib/dossier';

const DECISION_ICONS: Record<DossierDecision['icon'], React.ComponentType<{ className?: string }>> = {
  zap: Icon.Zap,
  scale: Icon.Scale,
  lock: Icon.Lock,
  target: Icon.Target,
  briefcase: Icon.Briefcase,
  users: Icon.Users,
  check: Icon.Check,
  info: Icon.Info,
};

function DossierDrawer({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Engineering dossier"
        onClick={(e) => e.stopPropagation()}
        className="fade-up h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 dark:border-edge bg-[#faf9f5] dark:bg-[#0c0b0e]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200/80 dark:border-edge/80 bg-[#faf9f5]/95 dark:bg-[#0c0b0e]/95 px-6 py-5 backdrop-blur-md sm:px-8">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#ea580c] dark:text-signal">
              <span>●</span> Engineering Dossier
            </div>
            <h3 className="mt-1.5 font-sans text-xl font-extrabold tracking-tight text-slate-900 dark:text-[#ece9f0]">
              How this was built
            </h3>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-muted">
              Decisions · Verification · Stack
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dossier"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-slate-200 dark:border-edge text-slate-500 dark:text-muted transition-colors hover:border-[#ea580c]/50 hover:text-[#ea580c] dark:hover:text-signal"
          >
            <Icon.X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-6 sm:px-8">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {DOSSIER_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200 dark:border-edge bg-white dark:bg-surface/60 p-3.5"
              >
                <div className="font-mono text-lg font-bold text-[#ea580c] dark:text-signal">{stat.value}</div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Decisions */}
          <h4 className="mt-8 font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-muted">
            Key decisions
          </h4>
          <div className="mt-3 space-y-3">
            {DOSSIER_DECISIONS.map((d) => {
              const DecisionIcon = DECISION_ICONS[d.icon];
              return (
                <div
                  key={d.id}
                  className="rounded-2xl border border-slate-200 dark:border-edge bg-white dark:bg-surface/60 p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-signal/25 bg-signal/10 text-[#ea580c] dark:text-signal">
                      <DecisionIcon className="h-4 w-4" />
                    </span>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-[#ece9f0]">{d.title}</h5>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-content">{d.decision}</p>
                  <p className="mt-2.5 border-l-2 border-[#ea580c]/40 dark:border-signal/40 pl-3 font-sans text-xs leading-relaxed text-slate-500 dark:text-muted">
                    {d.why}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Verification */}
          <h4 className="mt-8 font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-muted">
            How we know it works
          </h4>
          <div className="mt-3 space-y-2.5">
            {DOSSIER_VERIFICATION.map((v) => (
              <div
                key={v.title}
                className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-edge bg-white dark:bg-surface/60 p-4"
              >
                <Icon.CheckCircle className="mt-0.5 h-4 w-4 flex-none text-[#ea580c] dark:text-signal" />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-[#ece9f0]">{v.title}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-muted">{v.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stack */}
          <h4 className="mt-8 font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-muted">
            Stack
          </h4>
          <div className="mt-3 flex flex-wrap gap-2 pb-2">
            {DOSSIER_STACK.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 dark:border-edge bg-white dark:bg-surface/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-600 dark:text-muted"
              >
                {item}
              </span>
            ))}
          </div>

          <p className="mt-8 border-t border-slate-200 dark:border-edge pt-4 font-sans text-[11px] leading-relaxed text-slate-500 dark:text-muted/80">
            Every claim above corresponds to shipped, tested behavior — this dossier doubles as the
            project&apos;s engineering changelog. Built by{' '}
            <a
              href="https://www.linkedin.com/in/golamrabby-/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#ea580c] dark:text-signal hover:underline transition-colors"
            >
              Golam Rabby
            </a>.
          </p>
        </div>
      </aside>
    </div>
  );
}

export function EngineeringDossier({ onOpen }: { onOpen: () => void }) {
  return (
    <section id="engineering" className="py-20 sm:py-28 border-b border-slate-200 dark:border-edge/60 bg-[#faf9f5] dark:bg-[#0c0b0e]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#ea580c] dark:text-signal font-semibold">
              <span className="h-2 w-2 rounded-full bg-[#ea580c] dark:bg-signal animate-pulse" /> Architecture & Engineering Decisions
            </div>

            <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-[#ece9f0]">
              See exactly <span className="text-[#ea580c] dark:text-signal">how it was built.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-muted">
              Not marketing fluff — explore the 6 architectural decisions (resilient LLM gateway, atomic usage metering, signature verification) and verified test benchmarks.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-signal px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:brightness-105 active:scale-95"
          >
            <Icon.Sparkle className="h-4 w-4" />
            Open Build Dossier Drawer
            <Icon.ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="group mt-8 grid w-full grid-cols-2 gap-3 rounded-2xl border border-slate-200 dark:border-edge bg-white dark:bg-surface/60 p-6 text-left shadow-sm transition-all hover:border-signal/50 hover:shadow-md sm:grid-cols-3 lg:grid-cols-6 cursor-pointer"
          aria-haspopup="dialog"
          title="Click to open the architecture drawer"
        >
          {DOSSIER_STATS.map((stat) => (
            <div key={stat.label} className="px-1">
              <div className="font-mono text-xl font-bold text-[#ea580c] dark:text-signal group-hover:scale-105 transition-transform origin-left">{stat.value}</div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-muted">
                {stat.label}
              </div>
            </div>
          ))}
          <div className="col-span-2 flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#ea580c] dark:text-signal sm:col-span-3 lg:col-span-6 pt-2 border-t border-slate-100 dark:border-edge/50">
            <span>Click anywhere to open full architecture decisions & verification tests</span>
            <Icon.ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
          </div>
        </button>
      </div>
    </section>
  );
}

/**
 * The drawer itself — controlled by the page (`open` state), rendered as a
 * fixed overlay so it never disturbs the section layout.
 */
export function EngineeringDossierDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <DossierDrawer onClose={onClose} />;
}
