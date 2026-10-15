'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { useSession } from '@/components/SessionProvider';
import { BkashNagadModal } from '@/components/BkashNagadModal';

export function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const [currency, setCurrency] = useState<'bdt' | 'usd'>('bdt');
  const [showBkashModal, setShowBkashModal] = useState(false);
  const { user, openSignIn } = useSession();

  const handleFreeCta = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const input = document.querySelector('input');
    input?.focus();
  };

  const handleProCta = () => {
    if (currency === 'bdt') {
      setShowBkashModal(true);
      return;
    }
    if (!user) {
      openSignIn();
    } else {
      window.location.href = '/developer';
    }
  };

  return (
    <section id="pricing" className="relative py-20 sm:py-28 border-b border-slate-200 dark:border-edge/60 bg-[#faf9f5] dark:bg-[#0c0b0e]">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#ea580c] dark:text-signal font-semibold">
            <span>●</span> Transparent Pricing & Plans
          </div>
          <h2 className="mt-4 font-sans text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-[#ece9f0]">
            Predictable plans for <span className="text-[#ea580c] dark:text-signal">builders & hiring teams.</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-muted">
            No token surprises or hidden API meters. Start free with 3 audits every month, go Pro for unlimited deep code audits & interview drills, or empower your team.
          </p>

          {/* Currency + Monthly/Annual Toggles */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {/* Currency Pill */}
            <div className="inline-flex items-center rounded-full border border-slate-200 dark:border-edge bg-white dark:bg-surface/80 p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setCurrency('bdt')}
                className={`rounded-full px-3.5 py-1.5 font-mono text-xs font-semibold tracking-wider transition-all flex items-center gap-1.5 ${
                  currency === 'bdt'
                    ? 'bg-[#ea580c] dark:bg-signal text-white dark:text-ink shadow-xs'
                    : 'text-slate-600 dark:text-muted hover:text-slate-900 dark:hover:text-[#ece9f0]'
                }`}
              >
                <span>৳ BDT (বিকাশ / নগদ)</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency('usd')}
                className={`rounded-full px-3.5 py-1.5 font-mono text-xs font-semibold tracking-wider transition-all ${
                  currency === 'usd'
                    ? 'bg-[#ea580c] dark:bg-signal text-white dark:text-ink shadow-xs'
                    : 'text-slate-600 dark:text-muted hover:text-slate-900 dark:hover:text-[#ece9f0]'
                }`}
              >
                <span>$ USD (Card)</span>
              </button>
            </div>

            {/* Monthly / Annual Toggle */}
            <div className="inline-flex items-center rounded-full border border-slate-200 dark:border-edge bg-white dark:bg-surface/80 p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={`rounded-full px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-all ${
                  !annual
                    ? 'bg-slate-900 dark:bg-[#ece9f0] text-white dark:text-ink shadow-xs'
                    : 'text-slate-600 dark:text-muted hover:text-slate-900 dark:hover:text-[#ece9f0]'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className={`rounded-full px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-all ${
                  annual
                    ? 'bg-slate-900 dark:bg-[#ece9f0] text-white dark:text-ink shadow-xs'
                    : 'text-slate-600 dark:text-muted hover:text-slate-900 dark:hover:text-[#ece9f0]'
                }`}
              >
                Annual
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAnnual((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95 ${
                annual
                  ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-edge bg-white dark:bg-surface/80 text-slate-700 dark:text-muted hover:border-[#ea580c] dark:hover:border-signal/50'
              }`}
            >
              <Icon.Sparkle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span>{annual ? (currency === 'bdt' ? '২৭% ছাড় সক্রিয়' : 'Annual discounts active') : (currency === 'bdt' ? 'বাৎসরিক প্রায় ২৭% সাশ্রয়' : 'Up to 29% off with Annual')}</span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="mt-14 grid gap-8 lg:grid-cols-3 items-stretch">
          {/* Plan 1: Free Starter */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-edge bg-white dark:bg-surface/60 p-7 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-muted">
                Free Starter
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-sans text-4xl font-extrabold tracking-tight text-slate-900 dark:text-[#ece9f0]">
                  $0
                </span>
                <span className="font-mono text-xs text-slate-500 dark:text-muted">
                  / forever
                </span>
              </div>
              <div className="mt-2 text-[11px] font-mono text-slate-500 dark:text-muted">
                Free forever, no credit card required
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-muted">
                Everything you need to verify individual candidates or pre-flight your own GitHub profile.
              </p>

              <div className="mt-6 border-t border-slate-100 dark:border-edge/50 pt-6">
                <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-[#ece9f0] mb-3">
                  Included:
                </div>
                <ul className="space-y-2.5 font-mono text-xs text-slate-600 dark:text-muted">
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span><strong>3 fresh audits</strong> / rolling 30 days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span><strong>1 active Target Role</strong> campaign</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span><strong>1 shareable public Proof Page</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>Deterministic Codebase Claim Matrix</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>Live production web bundle inspection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>All cached profile re-opens are free</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={handleFreeCta}
                className="w-full rounded-xl border border-slate-200 dark:border-edge bg-slate-50 dark:bg-card px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-[#ece9f0] transition-colors hover:border-[#ea580c] hover:text-[#ea580c] dark:hover:border-signal dark:hover:text-signal"
              >
                Start Free Audit ↑
              </button>
            </div>
          </div>

          {/* Plan 2: Developer Pro (Highlighted) */}
          <div className="relative flex flex-col justify-between rounded-2xl border-2 border-[#ea580c] dark:border-signal bg-white dark:bg-surface p-7 shadow-xl ring-4 ring-[#ea580c]/10 dark:ring-signal/15">
            {/* Pill Tag */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#ea580c] dark:bg-signal px-3.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white dark:text-ink shadow-sm">
              Most Popular
            </div>

            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-[#ea580c] dark:text-signal">
                Developer Pro
              </div>
              <div className="mt-4 flex flex-wrap items-baseline gap-2">
                <span className="font-sans text-4xl font-extrabold tracking-tight text-slate-900 dark:text-[#ece9f0]">
                  {currency === 'bdt'
                    ? (annual ? '৳৩,৪৯০' : '৳৩৯৯')
                    : (annual ? '$10' : '$14')}
                </span>
                <span className="font-mono text-xs text-slate-500 dark:text-muted">
                  {currency === 'bdt'
                    ? (annual ? '/ বছর' : '/ মাস')
                    : (annual ? '/ month (billed $120/yr)' : '/ month')}
                </span>
              </div>
              {annual ? (
                <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  <Icon.Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  {currency === 'bdt' ? '৳১,২৯৮ সাশ্রয় (প্রায় ২৭% অফ)' : 'Save $48/year (29% off)'}
                </div>
              ) : (
                <div className="mt-2 text-[11px] font-mono text-slate-500 dark:text-muted">
                  {currency === 'bdt' ? 'বিকাশ বা নগদে সহজ পেমেন্ট' : 'Billed monthly, cancel anytime'}
                </div>
              )}
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-muted">
                For active job seekers, engineering leads, and consultants who need limitless intelligence.
              </p>

              <div className="mt-6 border-t border-slate-100 dark:border-edge/50 pt-6">
                <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-[#ece9f0] mb-3">
                  Everything in Free, plus:
                </div>
                <ul className="space-y-2.5 font-mono text-xs text-slate-600 dark:text-muted">
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-[#ea580c] dark:text-signal mt-0.5" />
                    <span><strong className="text-slate-900 dark:text-[#ece9f0]">Tier 2 Deep Code Audit</strong> (real source & diff inspection)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-[#ea580c] dark:text-signal mt-0.5" />
                    <span><strong className="text-slate-900 dark:text-[#ece9f0]">Interactive Code Defense</strong> (adversarial mock interview)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-[#ea580c] dark:text-signal mt-0.5" />
                    <span><strong className="text-slate-900 dark:text-[#ece9f0]">Unlimited</strong> candidate & self audits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-[#ea580c] dark:text-signal mt-0.5" />
                    <span><strong className="text-slate-900 dark:text-[#ece9f0]">Unlimited</strong> Target Roles & Campaigns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-[#ea580c] dark:text-signal mt-0.5" />
                    <span><strong>Priority Multi-Model LLM Gateway</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-[#ea580c] dark:text-signal mt-0.5" />
                    <span>High-contrast Executive PDF Dossier export</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4 space-y-2">
              <button
                type="button"
                onClick={handleProCta}
                className="w-full rounded-xl bg-[#ea580c] hover:bg-[#c2410c] dark:bg-signal dark:hover:bg-signal/90 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white dark:text-ink shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{currency === 'bdt' ? 'বিকাশ বা নগদে প্রো নিন →' : (user ? 'Go to Developer Workspace →' : 'Upgrade to Pro →')}</span>
              </button>

              {currency !== 'bdt' && (
                <button
                  type="button"
                  onClick={() => setShowBkashModal(true)}
                  className="w-full text-center font-mono text-[11px] text-[#ea580c] dark:text-signal hover:underline py-1"
                >
                  বিকাশ বা নগদ দিয়ে ৳৩৯৯/মাস পেমেন্ট করুন
                </button>
              )}
            </div>
          </div>

          {/* Plan 3: Recruiter & Team */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-edge bg-white dark:bg-surface/60 p-7 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-muted">
                Recruiter & Team
              </div>
              <div className="mt-4 flex flex-wrap items-baseline gap-2">
                <span className="font-sans text-4xl font-extrabold tracking-tight text-slate-900 dark:text-[#ece9f0]">
                  {currency === 'bdt'
                    ? (annual ? '৳১৮,৯৯০' : '৳১,৯৯৯')
                    : (annual ? '$24' : '$29')}
                </span>
                <span className="font-mono text-xs text-slate-500 dark:text-muted">
                  {currency === 'bdt'
                    ? (annual ? '/ বছর' : '/ মাস')
                    : (annual ? '/ seat / mo (billed $290/yr)' : '/ seat / mo')}
                </span>
              </div>
              {annual ? (
                <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  <Icon.Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  {currency === 'bdt' ? 'বাৎসরিক প্রায় ২০% সাশ্রয়' : 'Save $58/seat/year (2 months free)'}
                </div>
              ) : (
                <div className="mt-2 text-[11px] font-mono text-slate-500 dark:text-muted">
                  {currency === 'bdt' ? 'টিম অ্যাক্সেস ও আনলিমিটেড পাইপলাইন' : 'Per seat, billed monthly'}
                </div>
              )}
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-muted">
                For technical recruiting teams, agency headhunters, and engineering managers hiring at scale.
              </p>

              <div className="mt-6 border-t border-slate-100 dark:border-edge/50 pt-6">
                <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-[#ece9f0] mb-3">
                  Everything in Pro, plus:
                </div>
                <ul className="space-y-2.5 font-mono text-xs text-slate-600 dark:text-muted">
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-blue-600 dark:text-blue-400 mt-0.5" />
                    <span><strong>ATS-Ready 1-Pager Briefs</strong> for hiring committees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-blue-600 dark:text-blue-400 mt-0.5" />
                    <span><strong>Batch Talent Pipeline</strong> & screening board</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-blue-600 dark:text-blue-400 mt-0.5" />
                    <span><strong>Custom Job Description</strong> fit scoring & gap probes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-blue-600 dark:text-blue-400 mt-0.5" />
                    <span>Shared candidate leaderboard notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-blue-600 dark:text-blue-400 mt-0.5" />
                    <span>Multi-seat workspace team management</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href="/recruiter"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-edge bg-slate-50 dark:bg-card px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-[#ece9f0] transition-colors hover:border-signal hover:text-signal"
              >
                Launch Recruiter Portal →
              </Link>
            </div>
          </div>
        </div>

        {/* Guarantees / Trust footer */}
        <div className="mt-12 rounded-xl border border-slate-200 dark:border-edge/60 bg-white/60 dark:bg-surface/30 p-4 text-center font-mono text-xs text-slate-600 dark:text-muted">
          <span>🔒 Cancel or modify anytime.</span>
          <span className="mx-2 hidden sm:inline">·</span>
          <span className="block sm:inline mt-1 sm:mt-0">Zero risk: All profiles previously generated remain readable forever.</span>
        </div>

        {/* bKash & Nagad Modal */}
        {showBkashModal && (
          <BkashNagadModal
            isOpen={showBkashModal}
            defaultPlan={annual ? 'pro_annual' : 'pro_monthly'}
            onClose={() => setShowBkashModal(false)}
          />
        )}
      </div>
    </section>
  );
}
