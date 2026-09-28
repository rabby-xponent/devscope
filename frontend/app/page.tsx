'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getSavedRequisitions,
  saveRequisition,
  getActiveRequisitionId,
  setActiveRequisitionId,
  SavedRequisition,
} from '@/lib/requisitions';

const CANDIDATE_ARCHETYPES = [
  {
    label: 'Enterprise / React Core',
    username: 'gaearon',
    liveUrl: 'https://overreacted.io',
    note: 'Working Dev with Private Meta History',
  },
  {
    label: 'Prolific OSS Builder',
    username: 'tj',
    liveUrl: '',
    note: 'High-Volume Systems Architect',
  },
  {
    label: 'Ecosystem Maintainer',
    username: 'sindresorhus',
    liveUrl: '',
    note: '1,000+ Modular Micro-Packages',
  },
];

export default function Home() {
  const [username, setUsername] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [showLiveUrl, setShowLiveUrl] = useState(false);
  const [requisitions, setRequisitions] = useState<SavedRequisition[]>([]);
  const [activeRoleId, setActiveRoleId] = useState<string>('req_senior_fullstack');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newJdText, setNewJdText] = useState('');

  const router = useRouter();

  useEffect(() => {
    const list = getSavedRequisitions();
    setRequisitions(list);
    const active = getActiveRequisitionId();
    if (active) setActiveRoleId(active);
  }, []);

  const handleRoleChange = (id: string) => {
    setActiveRoleId(id);
    setActiveRequisitionId(id || null);
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newJdText.trim()) return;
    const created = saveRequisition({
      title: newTitle.trim(),
      company: newCompany.trim() || 'Internal Team',
      rawJdText: newJdText.trim(),
      coreStack: [],
      seniorityMinYears: 3,
      allowPrivateRepos: true,
    });
    setRequisitions(getSavedRequisitions());
    setActiveRoleId(created.id);
    setActiveRequisitionId(created.id);
    setShowRoleModal(false);
    setNewTitle('');
    setNewCompany('');
    setNewJdText('');
  };

  const handleAnalyze = (targetUser?: string, targetLive?: string, targetRole?: string) => {
    const u = (targetUser ?? username).trim().replace(/^@/, '');
    const l = (targetLive ?? liveUrl).trim();
    const r = targetRole !== undefined ? targetRole : activeRoleId;
    if (!u) return;

    const params = new URLSearchParams();
    if (l) params.set('liveUrl', l);
    if (r) params.set('roleId', r);

    const qs = params.toString() ? `?${params.toString()}` : '';
    router.push(`/profile/${encodeURIComponent(u)}${qs}`);
  };

  return (
    <main className="min-h-screen bg-[#0c0b0e] text-[#ece9f0] selection:bg-signal selection:text-ink">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-30 border-b border-edge/80 bg-[#0c0b0e]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-signal shadow-[0_0_10px_#f0a04b]" />
            <span className="font-mono text-sm font-bold tracking-[0.25em] text-ece9f0">
              DEVSCOPE
            </span>
          </Link>

          <div className="hidden items-center gap-8 font-mono text-xs uppercase tracking-wider text-muted sm:flex">
            <a href="#how-it-works" className="transition-colors hover:text-signal">
              How It Works
            </a>
            <a href="#the-problem" className="transition-colors hover:text-signal">
              The Reality
            </a>
            <a href="#features" className="transition-colors hover:text-signal">
              What You Get
            </a>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] text-muted/70 md:inline-block">
              Recruiter & EM Edition
            </span>
            <button
              onClick={() => handleAnalyze('gaearon', 'https://overreacted.io')}
              className="rounded border border-edge bg-surface/80 px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:border-signal/50 hover:text-signal"
            >
              Live Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="grid-bg relative overflow-hidden border-b border-edge/60 pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0c0b0e]/30 via-[#0c0b0e]/80 to-[#0c0b0e]" />

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Hero Left: Value Prop & Interactive Console */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface/70 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-signal">
                <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
                Technical Talent Intelligence
              </div>

              <h1 className="mt-6 font-sans text-4xl font-semibold leading-[1.12] tracking-tight text-ece9f0 sm:text-5xl lg:text-[56px]">
                Verify engineering depth{' '}
                <span className="text-signal">without the guesswork.</span>
              </h1>

              <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted">
                Resume keywords and vanity commit streaks lie. DevScope cross-examines
                real GitHub codebases, inspects live deployed applications, and builds calibrated
                recruiter dossiers with a 15-minute phone screen guide.
              </p>

              {/* Assessment Input Box */}
              <div id="console" className="mt-8 max-w-xl rounded-xl border border-edge bg-surface/90 p-3 shadow-2xl backdrop-blur focus-within:border-signal/70">
                {/* Active Requisition / Role Selector Bar */}
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-edge/40 pb-2.5">
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-muted">
                    <span className="text-signal">🎯</span>
                    <span className="font-semibold text-ece9f0">Evaluating for:</span>
                    <select
                      value={activeRoleId}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="max-w-[220px] truncate rounded border border-edge/60 bg-[#0c0b0e] px-2 py-1 font-mono text-xs text-ece9f0 outline-none focus:border-signal"
                    >
                      <option value="">General Profile Audit (No JD)</option>
                      {requisitions.map((req) => (
                        <option key={req.id} value={req.id}>
                          {req.title} ({req.company})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(true)}
                    className="flex items-center gap-1 rounded border border-edge/60 bg-surface px-2 py-1 font-mono text-[10px] text-signal transition-colors hover:border-signal/60 hover:bg-signal/10"
                    title="Save a new Job Description to score candidates against"
                  >
                    <span>+ New JD</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-2 rounded-lg bg-[#0c0b0e]/90 px-3 py-2.5 border border-edge/60 focus-within:border-signal/50">
                    <span className="font-mono text-xs text-signal font-bold">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                      placeholder="candidate-github-username"
                      className="w-full bg-transparent font-mono text-sm text-ece9f0 outline-none placeholder:text-muted/50"
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={() => handleAnalyze()}
                    className="flex-none rounded-lg bg-signal px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-ink transition-all hover:bg-signal/90 hover:shadow-[0_0_20px_#f0a04b40]"
                  >
                    Generate Dossier
                  </button>
                </div>

                {/* Optional Live App Input Toggle */}
                <div className="mt-2.5 border-t border-edge/40 pt-2.5">
                  {showLiveUrl ? (
                    <div className="flex items-center gap-2 rounded-lg bg-[#0c0b0e]/70 px-3 py-2 border border-edge/60">
                      <span className="text-sm">🌐</span>
                      <input
                        type="url"
                        value={liveUrl}
                        onChange={(e) => setLiveUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                        placeholder="https://candidate-app.vercel.app (optional demo / portfolio)"
                        className="flex-1 bg-transparent font-mono text-xs text-ece9f0 outline-none placeholder:text-muted/50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLiveUrl('');
                          setShowLiveUrl(false);
                        }}
                        className="font-mono text-xs text-muted hover:text-signal"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowLiveUrl(true)}
                      className="flex items-center gap-1.5 font-mono text-[11px] text-muted transition-colors hover:text-signal"
                    >
                      <span className="text-signal font-bold">＋</span>
                      <span>Include live deployed app or portfolio URL (audits production build)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sample Profiles */}
              <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted">
                <span className="text-muted/70">Test real scenarios:</span>
                {CANDIDATE_ARCHETYPES.map((arch) => (
                  <button
                    key={arch.username}
                    onClick={() => handleAnalyze(arch.username, arch.liveUrl)}
                    className="group rounded-full border border-edge bg-surface/40 px-3 py-1 text-muted transition-all hover:border-signal/50 hover:text-signal"
                    title={arch.note}
                  >
                    <span>@{arch.username}</span>
                    <span className="ml-1 text-[10px] text-muted/60 group-hover:text-signal/80">
                      ({arch.label.split('/')[0].trim()})
                    </span>
                  </button>
                ))}
              </div>

              {/* Micro-Trust Signals */}
              <div className="mt-6 flex flex-wrap items-center gap-6 font-mono text-[11px] text-muted/70">
                <span className="flex items-center gap-1.5">
                  <span className="text-signal font-bold">✓</span> No Candidate Login Needed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-signal font-bold">✓</span> Private Dev Bias Resistant
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-signal font-bold">✓</span> 1-Click Executive PDF Export
                </span>
              </div>
            </div>

            {/* Hero Right: Live Dossier Preview Card (HireJudge-inspired contrast) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-edge/80 bg-[#141217] p-6 shadow-2xl">
                {/* Dossier Header Badge */}
                <div className="flex items-center justify-between border-b border-edge/80 pb-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    Generated Dossier Preview
                  </div>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                    94% Confidence
                  </span>
                </div>

                {/* Candidate Overview */}
                <div className="mt-4 flex items-start gap-3">
                  <div className="h-12 w-12 flex-none rounded-lg border border-edge bg-surface flex items-center justify-center font-mono text-base font-bold text-signal">
                    GA
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ece9f0">Dan Abramov</span>
                      <span className="font-mono text-xs text-signal">@gaearon</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="rounded border border-blue-500/40 bg-blue-950/30 px-2 py-0.5 font-mono text-[10px] text-blue-300">
                        💼 Working Professional
                      </span>
                      <span className="rounded border border-purple-500/40 bg-purple-950/30 px-2 py-0.5 font-mono text-[10px] text-purple-300">
                        ⭐ Senior Engineer
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Shipped Verification */}
                <div className="mt-4 rounded-lg border border-edge bg-[#0c0b0e]/60 p-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-[10px] uppercase tracking-wider">
                      Live App Audit
                    </span>
                    <span className="text-emerald-400 text-[11px] font-medium">
                      🟢 Live (142ms · Fast)
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                    <span className="text-ece9f0">overreacted.io</span>
                    <span className="rounded bg-surface px-1.5 py-0.5 text-[9px] text-muted border border-edge">
                      Vercel
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="rounded bg-signal/10 px-1.5 py-0.5 text-[10px] text-signal border border-signal/20">
                      Next.js (React)
                    </span>
                    <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-ece9f0 border border-edge">
                      TypeScript
                    </span>
                    <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted border border-edge">
                      Responsive Viewport
                    </span>
                  </div>
                </div>

                {/* Claim vs Evidence Snippet */}
                <div className="mt-3 rounded-lg border border-edge bg-[#0c0b0e]/60 p-3 font-mono text-xs space-y-2">
                  <div className="text-muted text-[10px] uppercase tracking-wider">
                    Claim vs. Evidence Matrix
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ece9f0 font-medium">React / State Architecture</span>
                    <span className="text-emerald-400">✓ Code Verified</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ece9f0 font-medium">Production Next.js</span>
                    <span className="text-blue-300">🌐 Live Shipped</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ece9f0 font-medium">Kubernetes / Distributed</span>
                    <span className="text-amber-400">🔍 Probe Required</span>
                  </div>
                </div>

                {/* 15-Minute Screen Guide Snippet */}
                <div className="mt-3 rounded-lg border border-edge/70 bg-amber-950/10 p-3">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                    <span>⚡</span> 15-Min Phone Screen Guide
                  </div>
                  <p className="mt-1 text-xs text-ece9f0/90 leading-snug">
                    &quot;Describe a production debugging incident where rendering regressions impacted client performance.&quot;
                  </p>
                  <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted">
                    <span className="text-emerald-400">✓ Profiler / Flamegraphs</span>
                    <span className="text-rose-400">⚠️ Vague &quot;checked console&quot;</span>
                  </div>
                </div>

                <div className="mt-3 text-center font-mono text-[10px] text-muted/60">
                  Ready to share with hiring committees in PDF format.
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof Metric Bar */}
          <div className="mt-16 grid grid-cols-2 gap-6 border-t border-edge/60 pt-10 sm:grid-cols-4">
            <div>
              <div className="font-mono text-3xl font-bold text-ece9f0">11+</div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted mt-1">
                Deterministic Audit Tools
              </div>
            </div>
            <div>
              <div className="font-mono text-3xl font-bold text-signal">~14s</div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted mt-1">
                Average Dossier Latency
              </div>
            </div>
            <div>
              <div className="font-mono text-3xl font-bold text-ece9f0">100%</div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted mt-1">
                Zero Candidate Prep / Login
              </div>
            </div>
            <div>
              <div className="font-mono text-3xl font-bold text-signal">2–3pg</div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted mt-1">
                Calibrated Executive PDF
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Reality Section (High-Contrast Parchment Style inspired by HireJudge) */}
      <section id="the-problem" className="bg-[#f4f0e8] text-[#111014] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#c2410c] font-semibold">
            <span>●</span> The Technical Hiring Reality
          </div>

          <h2 className="mt-4 font-sans text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-[#111014]">
            Technical screening shouldn&apos;t be{' '}
            <span className="text-[#c2410c]">a guessing game.</span>
          </h2>

          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-[#57534e]">
            Resumes are now AI-generated with 20+ buzzwords. Meanwhile, the strongest engineers
            write proprietary code behind enterprise NDAs. Current tools fail both sides.
          </p>

          <div className="mt-14 grid gap-10 lg:grid-cols-2">
            {/* Left: The Recruiter & Hiring Manager Struggle */}
            <div className="rounded-xl border border-[#d6d3d1] bg-white p-7 shadow-sm">
              <div className="font-mono text-xs uppercase tracking-widest text-[#c2410c] font-bold">
                For The Technical Recruiter & EM
              </div>
              <ul className="mt-6 space-y-4 text-sm text-[#292524]">
                <li className="flex items-start gap-3">
                  <span className="text-[#c2410c] font-bold text-base leading-none">✕</span>
                  <span>
                    <strong>Buzzword inflation:</strong> Resumes claim Next.js, Kubernetes, and Kafka with zero proof of hands-on depth.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#c2410c] font-bold text-base leading-none">✕</span>
                  <span>
                    <strong>The private repo blindspot:</strong> Top enterprise engineers have almost zero public commits, getting mislabeled as &quot;inactive&quot;.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#c2410c] font-bold text-base leading-none">✕</span>
                  <span>
                    <strong>Non-technical phone screens:</strong> Initial interviewers lack calibrated questions to separate shallow buzzword answers from real architecture experience.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#c2410c] font-bold text-base leading-none">✕</span>
                  <span>
                    <strong>Engineering manager burnout:</strong> Senior staff waste 10+ hours a week interviewing candidates who fail basic tech screens.
                  </span>
                </li>
              </ul>
            </div>

            {/* Right: The Real Developer Struggle */}
            <div className="rounded-xl border border-[#d6d3d1] bg-white p-7 shadow-sm">
              <div className="font-mono text-xs uppercase tracking-widest text-[#292524] font-bold">
                For The Working Software Engineer
              </div>
              <ul className="mt-6 space-y-4 text-sm text-[#292524]">
                <li className="flex items-start gap-3">
                  <span className="text-[#57534e] font-bold text-base leading-none">•</span>
                  <span>
                    <strong>Unfairly penalized by naive ATS:</strong> Working engineers who ship private code to paying customers get ignored in favor of students copying public tutorial repos.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#57534e] font-bold text-base leading-none">•</span>
                  <span>
                    <strong>Production live builds ignored:</strong> Shipped apps, SaaS demos, and live client projects on Vercel or Render are never inspected by recruiters.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#57534e] font-bold text-base leading-none">•</span>
                  <span>
                    <strong>Irrelevant LeetCode marathons:</strong> Candidates are judged on inverted binary trees instead of architectural tradeoffs and production debugging.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#57534e] font-bold text-base leading-none">•</span>
                  <span>
                    <strong>Ghosted after technical submissions:</strong> No objective breakdown of how their practical code was evaluated.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Result Banner */}
          <div className="mt-10 rounded-lg bg-[#1c1917] p-4 text-white font-mono text-xs flex flex-wrap items-center justify-between gap-4">
            <span className="text-[#f97316] font-semibold">THE OUTCOME:</span>
            <div className="flex flex-wrap items-center gap-2 text-stone-300">
              <span>False Negatives</span>
              <span>→</span>
              <span>Engineering Time Lost</span>
              <span>→</span>
              <span>$40k+ Mismatched Hires</span>
              <span>→</span>
              <span className="text-white font-semibold">Start Over From Scratch ↺</span>
            </div>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                document.querySelector('input')?.focus();
              }}
              className="text-[#f97316] underline hover:text-white"
            >
              Solve It with DevScope ↑
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-28 border-b border-edge/60">
        <div className="mx-auto max-w-6xl px-6">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-signal">
            <span>●</span> Automated Ground-Truth Pipeline
          </div>

          <h2 className="mt-4 font-sans text-3xl font-semibold tracking-tight sm:text-4xl text-ece9f0">
            From candidate handle to hiring dossier{' '}
            <span className="text-signal">in three steps.</span>
          </h2>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-xl border border-edge bg-surface/40 p-6">
              <div className="font-mono text-4xl font-bold text-signal">01</div>
              <h3 className="mt-4 text-lg font-semibold text-ece9f0">Input Candidate Signals</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Enter their GitHub username plus an optional live application or portfolio URL (Vercel, Render, or custom domain). Zero candidate registration needed.
              </p>
              <div className="mt-4 rounded bg-[#0c0b0e] p-2.5 font-mono text-[11px] text-muted border border-edge">
                @username + https://my-saas.com
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-edge bg-surface/40 p-6">
              <div className="font-mono text-4xl font-bold text-signal">02</div>
              <h3 className="mt-4 text-lg font-semibold text-ece9f0">Multi-Signal Deep Audit</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Our agent executes 11 deterministic tools in parallel: language byte counts, commit message depth, PR reviews, ecosystem mentions, and live production DOM/stack audits.
              </p>
              <div className="mt-4 rounded bg-[#0c0b0e] p-2.5 font-mono text-[11px] text-emerald-400 border border-edge">
                ✓ 11 Parallel Inspection Tools
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-edge bg-surface/40 p-6">
              <div className="font-mono text-4xl font-bold text-signal">03</div>
              <h3 className="mt-4 text-lg font-semibold text-ece9f0">Executive Recruiter Brief</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Receive calibrated seniority classifications, the Claim vs. Evidence Matrix, and 3 sharp phone screen questions with exact &quot;What to listen for&quot; signals.
              </p>
              <div className="mt-4 rounded bg-[#0c0b0e] p-2.5 font-mono text-[11px] text-signal border border-edge">
                📋 1-Click Copy & PDF Export
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get / Core Features */}
      <section id="features" className="py-20 sm:py-28 bg-[#100e13] border-b border-edge/60">
        <div className="mx-auto max-w-6xl px-6">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-signal">
            <span>●</span> Executive Intelligence Suite
          </div>

          <h2 className="mt-4 font-sans text-3xl font-semibold tracking-tight sm:text-4xl text-ece9f0">
            Engineered for hiring teams who value{' '}
            <span className="text-signal">accuracy.</span>
          </h2>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-edge bg-surface/60 p-6">
              <div className="text-2xl">💼</div>
              <h4 className="mt-3 text-base font-semibold text-ece9f0">Working Professional Recognition</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Identifies enterprise engineers who write proprietary code. Replaces false &quot;junior/inactive&quot; ratings with verified tenure and private work context.
              </p>
            </div>

            <div className="rounded-xl border border-edge bg-surface/60 p-6">
              <div className="text-2xl">🌐</div>
              <h4 className="mt-3 text-base font-semibold text-ece9f0">Live Application Inspection</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Inspects production builds in real time. Detects Next.js, React, Tailwind, Supabase, response latency, and mobile responsiveness directly from deployed URLs.
              </p>
            </div>

            <div className="rounded-xl border border-edge bg-surface/60 p-6">
              <div className="text-2xl">⚖️</div>
              <h4 className="mt-3 text-base font-semibold text-ece9f0">Claim vs. Evidence Matrix</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Cross-references resume buzzwords against verified artifacts. Separates code-verified skills from unverified claims that require phone screen probing.
              </p>
            </div>

            <div className="rounded-xl border border-edge bg-surface/60 p-6">
              <div className="text-2xl">🎯</div>
              <h4 className="mt-3 text-base font-semibold text-ece9f0">15-Min Phone Screen Guide</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Calibrated questions designed for non-technical recruiters. Gives exact &quot;What to listen for&quot; and red flag buzzword signals for fast candidate qualification.
              </p>
            </div>

            <div className="rounded-xl border border-edge bg-surface/60 p-6">
              <div className="text-2xl">🖨️</div>
              <h4 className="mt-3 text-base font-semibold text-ece9f0">Executive PDF Print Engine</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                High-contrast multi-page export without broken cards or orphan headers. Ready to share directly in hiring committee meetings or attach to ATS records.
              </p>
            </div>

            <div className="rounded-xl border border-edge bg-surface/60 p-6">
              <div className="text-2xl">⚡</div>
              <h4 className="mt-3 text-base font-semibold text-ece9f0">Multi-Model Resilient Gateway</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Autonomous synthesis backed by Gemini 3.8 Flash, Groq, and OpenRouter with automatic failover, guaranteeing 99.9% report delivery uptime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-20 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-sans text-3xl font-semibold tracking-tight sm:text-4xl text-ece9f0">
            Stop guessing. Start evaluating with{' '}
            <span className="text-signal">ground truth.</span>
          </h2>
          <p className="mt-4 text-sm text-muted">
            Enter any candidate&apos;s GitHub handle or live portfolio project to generate an executive brief in 14 seconds.
          </p>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                const input = document.querySelector('input');
                input?.focus();
              }}
              className="rounded-lg bg-signal px-8 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-ink transition-all hover:bg-signal/90 hover:shadow-[0_0_25px_#f0a04b50]"
            >
              Analyze Candidate Now ↑
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-edge/60 py-8 text-center font-mono text-xs text-muted/60">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>DevScope · Technical Ground-Truth Intelligence for Engineering Hiring</span>
          <span>
            developed by{' '}
            <a
              href="https://www.linkedin.com/in/golamrabby-/"
              target="_blank"
              rel="noreferrer"
              className="text-muted transition-colors hover:text-signal"
            >
              Golam Rabby
            </a>
          </span>
        </div>
      </footer>

      {/* Save New Job Description Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-edge bg-[#0c0b0e] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-edge/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg text-signal">📋</span>
                <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-ece9f0">
                  Save Job Requisition
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="font-mono text-xs text-muted hover:text-signal"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs text-muted">
              Save your open role once. DevScope will automatically score every candidate against these requirements and generate targeted phone-screen interview questions.
            </p>

            <form onSubmit={handleCreateRole} className="mt-4 space-y-3.5">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted">
                  Role Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staff Distributed Systems Engineer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-edge/60 bg-surface px-3 py-2 font-mono text-xs text-ece9f0 outline-none focus:border-signal"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted">
                  Company / Team (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Core Infrastructure or Stealth AI"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-edge/60 bg-surface px-3 py-2 font-mono text-xs text-ece9f0 outline-none focus:border-signal"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted">
                  Job Description / Requirements Text *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Paste the requirements, tech stack (e.g. Go, Rust, Kafka, Kubernetes), and qualifications from your job posting..."
                  value={newJdText}
                  onChange={(e) => setNewJdText(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-edge/60 bg-surface px-3 py-2 font-mono text-xs text-ece9f0 outline-none focus:border-signal placeholder:text-muted/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="rounded-lg border border-edge/60 px-4 py-2 font-mono text-xs text-muted hover:text-ece9f0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-signal px-5 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink hover:bg-signal/90"
                >
                  Save & Select Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
