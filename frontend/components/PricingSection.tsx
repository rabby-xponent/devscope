'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { BkashNagadModal } from '@/components/BkashNagadModal';

export function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const [showBkashModal, setShowBkashModal] = useState(false);

  const handleFreeCta = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const input = document.querySelector('input');
    input?.focus();
  };

  const handleProCta = () => {
    setShowBkashModal(true);
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
            No token surprises or hidden API meters. Start free with 3 audits every month, go Pro for unlimited deep code audits & interview drills, or empower your hiring pipeline.
          </p>

          {/* Unified Billing Cycle Segmented Control */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center rounded-full border border-slate-200 dark:border-edge bg-white dark:bg-surface/80 p-1.5 shadow-sm backdrop-blur-md">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={`rounded-full px-5 py-2 font-mono text-xs font-semibold tracking-wider transition-all ${
                  !annual
                    ? 'bg-slate-900 dark:bg-[#ece9f0] text-white dark:text-ink shadow-xs'
                    : 'text-slate-600 dark:text-muted hover:text-slate-900 dark:hover:text-[#ece9f0]'
                }`}
              >
                মাসিক (Monthly)
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className={`rounded-full px-5 py-2 font-mono text-xs font-semibold tracking-wider transition-all flex items-center gap-2 ${
                  annual
                    ? 'bg-slate-900 dark:bg-[#ece9f0] text-white dark:text-ink shadow-xs'
                    : 'text-slate-600 dark:text-muted hover:text-slate-900 dark:hover:text-[#ece9f0]'
                }`}
              >
                <span>বাৎসরিক (Annual)</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight transition-colors ${
                    annual
                      ? 'bg-emerald-400 text-slate-950 font-extrabold'
                      : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                  }`}
                >
                  Save 27% (২ মাস ফ্রি)
                </span>
              </button>
            </div>
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
                  ৳০
                </span>
                <span className="font-mono text-xs text-slate-500 dark:text-muted">
                  / চিরতরে ফ্রি
                </span>
              </div>
              <div className="mt-2 text-[11px] font-mono text-slate-500 dark:text-muted">
                কোনো কার্ড বা পেমেন্ট মেথড ছাড়াই আজীবন
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-muted">
                ব্যক্তিগত গিটহাব প্রোফাইল প্রি-ফ্লাইট এবং নতুন ক্যান্ডিডেট ভেরিফিকেশনের জন্য ইনস্ট্যান্ট অডিট।
              </p>

              <div className="mt-6 border-t border-slate-100 dark:border-edge/50 pt-6">
                <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-[#ece9f0] mb-3">
                  Included in Free:
                </div>
                <ul className="space-y-2.5 font-mono text-xs text-slate-600 dark:text-muted">
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span><strong>৩টি ফ্রেশ অডিট</strong> / প্রতি ৩০ দিনে</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span><strong>১টি সক্রিয় Target Role</strong> ক্যাম্পেইন</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span><strong>১টি শেয়ারযোগ্য পাবলিক Proof Page</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>Deterministic Codebase Claim Matrix</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>Live production web bundle audit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>পূর্বের সব ক্যাশড প্রোফাইল রি-ওপেন সম্পূর্ণ ফ্রি</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={handleFreeCta}
                className="w-full rounded-xl border border-slate-200 dark:border-edge bg-slate-50 dark:bg-card px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-[#ece9f0] transition-colors hover:border-[#ea580c] hover:text-[#ea580c] dark:hover:border-signal dark:hover:text-signal shadow-xs"
              >
                ফ্রি অডিট শুরু করুন ↑
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
                  {annual ? '৳৩,৪৯০' : '৳৩৯৯'}
                </span>
                <span className="font-mono text-xs text-slate-500 dark:text-muted">
                  {annual ? '/ বছর' : '/ মাস'}
                </span>
              </div>

              {annual ? (
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  <Icon.Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>৳১,২৯৮ সাশ্রয় · ২ মাস ফ্রি (প্রতি মাসে মাত্র ৳২৯০)</span>
                </div>
              ) : (
                <div className="mt-2 text-[11px] font-mono text-slate-500 dark:text-muted">
                  বিকাশ, নগদ বা রকেটে সহজ পেমেন্ট · ইনস্ট্যান্ট অ্যাক্টিভেশন
                </div>
              )}

              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-muted">
                সক্রিয় জব সিকার, সিনিয়র ইঞ্জিনিয়ার ও কনসালট্যান্টদের জন্য লিমিটলেস ইন্টেলিজেন্স ও কোড ডিফেন্স।
              </p>

              <div className="mt-6 border-t border-slate-100 dark:border-edge/50 pt-6">
                <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-[#ece9f0] mb-3">
                  Everything in Free, plus:
                </div>
                <ul className="space-y-2.5 font-mono text-xs text-slate-600 dark:text-muted">
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-[#ea580c] dark:text-signal mt-0.5" />
                    <span><strong className="text-slate-900 dark:text-[#ece9f0]">Tier 2 Deep Code Audit</strong> (বাস্তব সোর্স কোড ও কমিট ডিফ অডিট)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-[#ea580c] dark:text-signal mt-0.5" />
                    <span><strong className="text-slate-900 dark:text-[#ece9f0]">Interactive Code Defense</strong> (লাইন-লেভেল অ্যাডভারসারিয়াল ইন্টারভিউ ড্রিল)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-[#ea580c] dark:text-signal mt-0.5" />
                    <span><strong className="text-slate-900 dark:text-[#ece9f0]">Unlimited</strong> ক্যান্ডিডেট ও সেলফ অডিট</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-[#ea580c] dark:text-signal mt-0.5" />
                    <span><strong className="text-slate-900 dark:text-[#ece9f0]">Unlimited</strong> Target Roles ও ক্যারিয়ার ক্যাম্পেইন</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-[#ea580c] dark:text-signal mt-0.5" />
                    <span><strong>Priority Multi-Model LLM Gateway</strong> (জিরো কিউ ওয়েটিং)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-[#ea580c] dark:text-signal mt-0.5" />
                    <span>হায়ারিং কমিটির জন্য হাই-কনট্রাস্ট Executive PDF ডসিয়ার এক্সপোর্ট</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={handleProCta}
                className="w-full rounded-xl bg-[#ea580c] hover:bg-[#c2410c] dark:bg-signal dark:hover:bg-signal/90 px-4 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-white dark:text-ink shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>বিকাশ বা নগদে প্রো নিন →</span>
              </button>
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
                  {annual ? '৳১৮,৯৯০' : '৳১,৯৯৯'}
                </span>
                <span className="font-mono text-xs text-slate-500 dark:text-muted">
                  {annual ? '/ বছর' : '/ মাস'}
                </span>
              </div>

              {annual ? (
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  <Icon.Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>বাৎসরিক বিলিংয়ে ৳৪,৯৯৮ সাশ্রয় (২১% অফ)</span>
                </div>
              ) : (
                <div className="mt-2 text-[11px] font-mono text-slate-500 dark:text-muted">
                  টিম অ্যাক্সেস ও আনলিমিটেড পাইপলাইন ট্র্যাকিং
                </div>
              )}

              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-muted">
                হায়ারিং টিম, এজেন্সি ও টেকনিক্যাল হেডহান্টারদের জন্য পাইপলাইন ট্র্যাকিং ও টিম কলাবরেশন।
              </p>

              <div className="mt-6 border-t border-slate-100 dark:border-edge/50 pt-6">
                <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-[#ece9f0] mb-3">
                  Everything in Pro, plus:
                </div>
                <ul className="space-y-2.5 font-mono text-xs text-slate-600 dark:text-muted">
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-blue-600 dark:text-blue-400 mt-0.5" />
                    <span><strong>ATS-Ready 1-Pager Briefs</strong> hiring committee-র জন্য</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-blue-600 dark:text-blue-400 mt-0.5" />
                    <span><strong>Batch Talent Pipeline</strong> ও স্ক্রিনিং বোর্ড</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-blue-600 dark:text-blue-400 mt-0.5" />
                    <span><strong>Custom Job Description</strong> ফিট স্কোরিং ও গ্যাপ প্রোবস</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-blue-600 dark:text-blue-400 mt-0.5" />
                    <span>শেয়ার্ড ক্যান্ডিডেট লিডারবোর্ড ও কোলাবোরেটিভ নোটস</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon.Check className="h-4 w-4 flex-none text-blue-600 dark:text-blue-400 mt-0.5" />
                    <span>মাল্টি-সিট ওয়ার্কস্পেস টিম ম্যানেজমেন্ট</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href="/recruiter"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-edge bg-slate-50 dark:bg-card px-4 py-3.5 font-mono text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-[#ece9f0] transition-colors hover:border-signal hover:text-signal shadow-xs"
              >
                Launch Recruiter Portal →
              </Link>
            </div>
          </div>
        </div>

        {/* Guarantees & MFS Trust Bar */}
        <div className="mt-12 rounded-2xl border border-slate-200 dark:border-edge/70 bg-white/70 dark:bg-surface/50 p-5 shadow-sm backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Accepted MFS Badges */}
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-semibold text-slate-700 dark:text-muted">পেমেন্ট মেথড:</span>
              <span className="inline-flex items-center rounded-lg border border-pink-200 dark:border-pink-900/40 bg-pink-50 dark:bg-pink-950/30 px-2.5 py-1 font-mono text-[11px] font-bold text-pink-700 dark:text-pink-300">
                bKash
              </span>
              <span className="inline-flex items-center rounded-lg border border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 font-mono text-[11px] font-bold text-orange-700 dark:text-orange-300">
                Nagad
              </span>
              <span className="inline-flex items-center rounded-lg border border-purple-200 dark:border-purple-900/40 bg-purple-50 dark:bg-purple-950/30 px-2.5 py-1 font-mono text-[11px] font-bold text-purple-700 dark:text-purple-300">
                Rocket
              </span>
            </div>

            {/* Instant Activation Guarantee */}
            <div className="flex items-center gap-2 font-mono text-xs text-slate-600 dark:text-muted">
              <Icon.Zap className="h-4 w-4 text-[#ea580c] dark:text-signal flex-none" />
              <span>
                <strong>২৪ ঘণ্টার ইনস্ট্যান্ট প্রভিশনাল অ্যাক্সেস:</strong> TrxID সাবমিট করলেই কোনো অপেক্ষা ছাড়া সাথে সাথে প্রো ফিচারস আনলক।
              </span>
            </div>
          </div>
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
