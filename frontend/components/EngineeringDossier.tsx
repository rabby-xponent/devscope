'use client';

/**
 * Engineering Dossier (Portfolio & Recruiter Architecture Window).
 *
 * Designed specifically for Engineering Managers and Technical Recruiters:
 * gives a complete architectural breakdown of how DevScope was engineered,
 * the core trade-offs, the two-tier agentic loop, dual fintech engine,
 * and test verifications without needing to click through 15 separate pages.
 */

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/icons';
import {
  DOSSIER_STATS,
  DOSSIER_SYSTEM_MAP,
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

type DossierTab = 'blueprint' | 'decisions' | 'verification' | 'stack';

function DossierDrawer({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<DossierTab>('blueprint');

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
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="presentation"
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Engineering dossier"
        onClick={(e) => e.stopPropagation()}
        className="fade-up h-full w-full max-w-3xl overflow-y-auto border-l border-edge bg-card text-content shadow-pop"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-edge bg-card/95 px-6 py-5 backdrop-blur-md sm:px-8">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#ea580c] dark:text-signal">
              <span className="h-2 w-2 rounded-full bg-[#ea580c] dark:bg-signal animate-pulse" />
              <span>Engineering Dossier</span>
            </div>
            <h3 className="mt-1 font-sans text-xl font-extrabold tracking-tight text-content">
              Architecture & System Blueprint
            </h3>
            <p className="mt-0.5 font-mono text-[11px] text-muted">
              Full-Stack Architecture · Autonomous ReAct Agent · Zero-Gimmick Design
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dossier"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-edge bg-well/50 text-muted transition-colors hover:border-signal/50 hover:bg-well hover:text-signal"
          >
            <Icon.X className="h-4 w-4" />
          </button>
        </div>

        {/* Recruiter Context Banner */}
        <div className="border-b border-edge bg-well/70 px-6 py-3.5 sm:px-8">
          <div className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded bg-[#ea580c]/15 text-[#ea580c] dark:text-signal font-mono text-xs font-bold mt-0.5">
              i
            </span>
            <p className="font-sans text-xs leading-relaxed text-muted">
              <strong className="text-content font-semibold">For Technical Interviewers & Recruiters:</strong> This dossier provides an instant, comprehensive view of DevScope's core systems engineering, multi-turn ReAct agent loop, circuit-breaker LLM gateway, and dual-currency monetization architecture.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="sticky top-[89px] z-10 flex border-b border-edge bg-card px-6 sm:px-8">
          {(
            [
              { id: 'blueprint', label: 'System Blueprint' },
              { id: 'decisions', label: 'Engineering Decisions' },
              { id: 'verification', label: 'Verification Tests' },
              { id: 'stack', label: 'Tech Stack' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-signal text-signal'
                  : 'border-transparent text-muted hover:text-content'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drawer Body Content */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Key Stats Bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {DOSSIER_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-edge bg-well/60 p-3 shadow-xs"
              >
                <div className="font-mono text-lg font-bold text-[#ea580c] dark:text-signal">
                  {stat.value}
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* TAB 1: System Blueprint */}
          {activeTab === 'blueprint' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-muted">
                  Subsystem Architecture
                </h4>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  How DevScope decouples ingestion, autonomous agentic auditing, resilient AI gateways, and multi-currency billing:
                </p>
              </div>

              {/* Subsystems Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DOSSIER_SYSTEM_MAP.map((sub) => (
                  <div
                    key={sub.title}
                    className="rounded-2xl border border-edge bg-card p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#ea580c] dark:text-signal bg-[#ea580c]/10 border border-[#ea580c]/25 px-2 py-0.5 rounded">
                          {sub.badge}
                        </span>
                      </div>
                      <h5 className="mt-2.5 font-sans text-sm font-bold text-content">
                        {sub.title}
                      </h5>
                      <p className="mt-2 text-xs leading-relaxed text-muted">
                        {sub.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-edge flex flex-wrap gap-1.5">
                      {sub.components.map((c) => (
                        <span
                          key={c}
                          className="rounded-md border border-edge bg-well px-2 py-0.5 font-mono text-[10px] text-content/90"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Audit Execution Flow Visual */}
              <div className="rounded-2xl border border-edge bg-well/80 p-5 space-y-3 shadow-xs">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-content flex items-center gap-2">
                  <span>Audit Execution Pipeline (End-to-End)</span>
                </div>
                <div className="font-mono text-xs space-y-2 text-muted">
                  <div className="flex items-center gap-2 text-content">
                    <span className="rounded bg-signal/15 text-signal px-2 py-0.5 text-[10px] font-bold">1</span>
                    <span><strong>Candidate Target:</strong> GitHub handle submitted via UI or recruiter pipeline.</span>
                  </div>
                  <div className="pl-6 border-l-2 border-edge space-y-2">
                    <div>↓ <strong>Tier 1 Scan (~30s):</strong> Deterministic analysis of languages, PR merge velocity, tenure weighting, private activity compensation.</div>
                    <div>↓ <strong>Tier 2 Autonomous ReAct:</strong> Bounded 5-turn agent loop executing <code>browse_repo_tree</code>, <code>read_source_file</code>, and <code>inspect_commit_diffs</code>.</div>
                    <div>↓ <strong>Adversarial Playbook:</strong> Generates 3 codebase-specific interview defense questions with Staff Engineer rubrics & red flag signals.</div>
                    <div>↓ <strong>SSE Stream:</strong> Real-time thinking traces and tool events streamed to client without polling.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Core Engineering Decisions */}
          {activeTab === 'decisions' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-muted">
                  Key Architectural Trade-Offs & Decisions
                </h4>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Every decision corresponds to production code. No theoretical claims.
                </p>
              </div>

              <div className="space-y-4">
                {DOSSIER_DECISIONS.map((d) => {
                  const DecisionIcon = DECISION_ICONS[d.icon];
                  return (
                    <div
                      key={d.id}
                      className="rounded-2xl border border-edge bg-card p-5 shadow-xs transition-colors"
                    >
                      <div className="flex items-start gap-3.5">
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-xl border border-signal/30 bg-signal/10 text-signal mt-0.5">
                          <DecisionIcon className="h-4 w-4" />
                        </span>
                        <div className="flex-1">
                          <h5 className="font-sans text-sm font-bold text-content">
                            {d.title}
                          </h5>
                          <p className="mt-2 text-xs leading-relaxed text-content/90 font-sans">
                            {d.decision}
                          </p>
                          <div className="mt-3 rounded-lg border border-edge bg-well p-3">
                            <div className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold mb-1">
                              Engineering Rationale (Why):
                            </div>
                            <p className="font-sans text-xs leading-relaxed text-muted">
                              {d.why}
                            </p>
                          </div>
                          <div className="mt-2.5 font-mono text-[10px] text-muted/80">
                            <strong>Verified:</strong> {d.verifiedBy}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Verification & Test Suite */}
          {activeTab === 'verification' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-muted">
                  How We Know It Works (Empirical Test Suite)
                </h4>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Verified assertions tested against live APIs, webhook signatures, and concurrency race conditions:
                </p>
              </div>

              <div className="space-y-3">
                {DOSSIER_VERIFICATION.map((v) => (
                  <div
                    key={v.title}
                    className="flex items-start gap-3 rounded-xl border border-edge bg-card p-4 shadow-xs"
                  >
                    <Icon.CheckCircle className="mt-0.5 h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="font-sans text-xs font-bold text-content">
                        {v.title}
                      </div>
                      <div className="mt-1 font-mono text-xs leading-relaxed text-muted">
                        {v.detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Technology Stack */}
          {activeTab === 'stack' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-muted">
                  Production Technology Stack
                </h4>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Clean modular breakdown of tools and libraries used across the platform:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(DOSSIER_STACK).map(([category, items]) => (
                  <div
                    key={category}
                    className="rounded-xl border border-edge bg-card p-4 shadow-xs"
                  >
                    <h5 className="font-mono text-xs font-bold text-signal uppercase tracking-wider mb-2.5">
                      {category}
                    </h5>
                    <ul className="space-y-1.5 font-mono text-xs text-content/90">
                      {items.map((it) => (
                        <li key={it} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Attribution */}
          <div className="border-t border-edge pt-4 font-sans text-xs leading-relaxed text-muted flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              Engineered with zero-gimmick discipline by{' '}
              <a
                href="https://www.linkedin.com/in/golamrabby-/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#ea580c] dark:text-signal hover:underline"
              >
                Golam Rabby
              </a>.
            </span>
            <span className="font-mono text-[10px] text-muted">
              DevScope Architecture v2.0
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function EngineeringDossier({ onOpen }: { onOpen: () => void }) {
  return (
    <section id="engineering" className="py-20 sm:py-28 border-b border-edge bg-canvas">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#ea580c] dark:text-signal font-semibold">
              <span className="h-2 w-2 rounded-full bg-[#ea580c] dark:bg-signal animate-pulse" />
              Systems Engineering & Architecture
            </div>

            <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight sm:text-4xl text-content">
              See exactly <span className="text-[#ea580c] dark:text-signal">how it was built.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              For technical recruiters and hiring managers: explore the Two-Tier Agentic Engine, resilient 6-provider LLM gateway, atomic usage metering, and bootstrapped MFS monetization.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-signal px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:brightness-105 active:scale-95"
          >
            <span>Open Build Dossier</span>
            <Icon.ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="group mt-8 grid w-full grid-cols-2 gap-3 rounded-2xl border border-edge bg-card p-6 text-left shadow-xs transition-all hover:border-signal/50 hover:shadow-card sm:grid-cols-3 lg:grid-cols-6 cursor-pointer"
          aria-haspopup="dialog"
          title="Click to open the architecture drawer"
        >
          {DOSSIER_STATS.map((stat) => (
            <div key={stat.label} className="px-1">
              <div className="font-mono text-xl font-bold text-[#ea580c] dark:text-signal group-hover:scale-105 transition-transform origin-left">
                {stat.value}
              </div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                {stat.label}
              </div>
            </div>
          ))}
          <div className="col-span-2 flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#ea580c] dark:text-signal sm:col-span-3 lg:col-span-6 pt-3 border-t border-edge">
            <span>Click to explore System Blueprint, ReAct loop decisions, and verified test benchmarks</span>
            <Icon.ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
          </div>
        </button>
      </div>
    </section>
  );
}

export function EngineeringDossierDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <DossierDrawer onClose={onClose} />;
}
