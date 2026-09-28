'use client';

import { useState } from 'react';
import { DevProfile } from '@/types/profile';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-edge/60 bg-surface/30 p-3 print:border-zinc-300 print:bg-white print:p-2">
      <div className="font-mono text-xl font-bold text-ece9f0 print:text-base print:text-zinc-900">{value}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted print:text-zinc-500">
        {label}
      </div>
    </div>
  );
}

function Section({
  id,
  index,
  title,
  subtitle,
  children,
  className = '',
}: {
  id?: string;
  index: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`border-t border-edge py-8 print:py-3.5 print-section ${className}`}>
      <div className="mb-4 flex flex-col gap-1 print:mb-2 print-heading">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-xs font-bold text-signal print:text-amber-800">{index}</span>
          <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-ece9f0 print:text-zinc-900">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="font-mono text-[11px] text-muted print:text-zinc-500">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Pill({
  icon,
  label,
  className,
}: {
  icon: string;
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wide print:px-2 print:py-0.5 print:text-[10px] ${className}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}

const LEVEL_WIDTH: Record<string, number> = {
  primary: 75,
  secondary: 45,
  minor: 20,
  occasional: 20,
};

const SENIORITY_STYLES: Record<string, string> = {
  junior: 'border-zinc-600 bg-zinc-800/60 text-zinc-300 print:text-zinc-700 print:border-zinc-400 print:bg-zinc-100',
  mid: 'border-blue-600/50 bg-blue-900/30 text-blue-300 print:text-blue-800 print:border-blue-300 print:bg-blue-50',
  senior: 'border-purple-600/50 bg-purple-900/30 text-purple-300 print:text-purple-800 print:border-purple-300 print:bg-purple-50',
  staff: 'border-orange-600/50 bg-orange-900/30 text-orange-300 print:text-orange-800 print:border-orange-300 print:bg-orange-50',
  principal: 'border-amber-500/60 bg-amber-900/30 text-amber-300 print:text-amber-800 print:border-amber-300 print:bg-amber-50',
};

const COLLAB_STYLES: Record<string, string> = {
  high: 'border-emerald-600/50 bg-emerald-900/30 text-emerald-300 print:text-emerald-800 print:border-emerald-300 print:bg-emerald-50',
  medium: 'border-blue-600/50 bg-blue-900/30 text-blue-300 print:text-blue-800 print:border-blue-300 print:bg-blue-50',
  low: 'border-zinc-600 bg-zinc-800/60 text-zinc-400 print:text-zinc-700 print:border-zinc-300 print:bg-zinc-100',
  solo: 'border-orange-600/50 bg-orange-900/30 text-orange-300 print:text-orange-800 print:border-orange-300 print:bg-orange-50',
};

const QUALITY_STYLES: Record<string, string> = {
  excellent: 'border-emerald-600/50 bg-emerald-900/30 text-emerald-300 print:text-emerald-800 print:border-emerald-300 print:bg-emerald-50',
  good: 'border-blue-600/50 bg-blue-900/30 text-blue-300 print:text-blue-800 print:border-blue-300 print:bg-blue-50',
  average: 'border-yellow-600/50 bg-yellow-900/30 text-yellow-300 print:text-amber-800 print:border-amber-300 print:bg-amber-50',
  poor: 'border-red-600/50 bg-red-900/30 text-red-300 print:text-red-800 print:border-red-300 print:bg-red-50',
};

const CONSISTENCY_STYLES: Record<string, string> = {
  daily: 'border-emerald-600/50 bg-emerald-900/30 text-emerald-300 print:text-emerald-800 print:border-emerald-300 print:bg-emerald-50',
  regular: 'border-blue-600/50 bg-blue-900/30 text-blue-300 print:text-blue-800 print:border-blue-300 print:bg-blue-50',
  sporadic: 'border-yellow-600/50 bg-yellow-900/30 text-yellow-300 print:text-amber-800 print:border-amber-300 print:bg-amber-50',
  burst: 'border-orange-600/50 bg-orange-900/30 text-orange-300 print:text-orange-800 print:border-orange-300 print:bg-orange-50',
};

const PERSONA_CONFIG: Record<string, { icon: string; label: string; style: string; badge: string; desc: string }> = {
  working_professional: {
    icon: '💼',
    label: 'Working Professional',
    style: 'border-blue-500/50 bg-blue-900/30 text-blue-300 print:border-blue-300 print:bg-blue-50 print:text-blue-800',
    badge: 'Enterprise & Private Repos',
    desc: 'Primary engineering output is in private/corporate repositories. Evaluated through architectural tenure, live demos, and technical depth rather than public hobby commits.',
  },
  fresher_builder: {
    icon: '🌱',
    label: 'Active Builder',
    style: 'border-emerald-500/50 bg-emerald-900/30 text-emerald-300 print:border-emerald-300 print:bg-emerald-50 print:text-emerald-800',
    badge: 'High Public Velocity',
    desc: 'Demonstrates strong self-driven momentum with active public repositories, personal projects, and continuous learning patterns.',
  },
  open_source_contributor: {
    icon: '🌐',
    label: 'OSS Contributor',
    style: 'border-purple-500/50 bg-purple-900/30 text-purple-300 print:border-purple-300 print:bg-purple-50 print:text-purple-800',
    badge: 'Community Code Author',
    desc: 'Proven track record of public pull requests, community package maintenance, and peer-reviewed open-source contributions.',
  },
  specialist: {
    icon: '⚡',
    label: 'Domain Specialist',
    style: 'border-amber-500/50 bg-amber-900/30 text-amber-300 print:border-amber-300 print:bg-amber-50 print:text-amber-800',
    badge: 'Deep Niche Mastery',
    desc: 'Focused technical mastery in a specialized ecosystem with concentrated contributions, custom tooling, and high architectural depth.',
  },
};

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function extractUrl(value: string): string | null {
  const match = value.match(/https?:\/\/[^\s,)]+/i);
  return match ? match[0] : isUrl(value) ? value.trim() : null;
}

function WebChip({
  icon,
  label,
  href,
  sublabel,
}: {
  icon: string;
  label: string;
  href: string;
  sublabel?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface/60 px-4 py-2 font-mono text-xs text-ece9f0 transition-colors hover:border-signal/50 hover:text-signal print:border-zinc-300 print:bg-white print:text-zinc-800"
    >
      <span>{icon}</span>
      <span>{label}</span>
      {sublabel && <span className="text-muted print:text-zinc-500">· {sublabel}</span>}
    </a>
  );
}

function expertiseBarWidth(level: string, percentage?: number): string {
  if (typeof percentage === 'number' && percentage > 0) {
    return `${Math.min(percentage, 100)}%`;
  }
  return `${LEVEL_WIDTH[level] ?? 20}%`;
}

export function ProfileView({
  profile,
  mode = 'recruiter',
}: {
  profile: DevProfile;
  mode?: 'recruiter' | 'developer';
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'verdict' | 'evidence' | 'signals' | 'interview'>('verdict');
  const g = profile.github;
  const rp = profile.recruiterPanel;

  const isDev = mode === 'developer';

  const copyRecruiterBrief = () => {
    const lines = [
      isDev
        ? `ENGINEERING CAREER PRE-FLIGHT DOSSIER: ${g.name || profile.username} (@${profile.username})`
        : `CANDIDATE INTELLIGENCE DOSSIER: ${g.name || profile.username} (@${profile.username})`,
      `Estimated Seniority: ${rp?.seniorityEstimate?.toUpperCase() || 'ENGINEER'} (${rp?.seniorityReason || ''})`,
      `Candidate Classification: ${rp?.developerPersona ? PERSONA_CONFIG[rp.developerPersona]?.label : 'Engineer'}`,
      `Headline: ${profile.headline}`,
      '',
      'EXECUTIVE HIGHLIGHTS:',
      ...(rp?.standoutFacts || []).map((f) => `• ${f}`),
      '',
      'VERIFIED EXPERTISE: ' + profile.expertise.map((e) => `${e.language} (${e.percentage || 0}%)`).join(', '),
      '',
      'CORE STRENGTHS:',
      ...profile.strengths.map((s) => `+ ${s}`),
      '',
      ...(profile.liveAppAudit
        ? [
            '',
            `LIVE PRODUCTION APP AUDIT: ${profile.liveAppAudit.url}`,
            `Status: ${profile.liveAppAudit.isLive ? 'LIVE' : 'OFFLINE'} (${profile.liveAppAudit.responseTimeMs}ms) · Stack: ${profile.liveAppAudit.detectedStack.framework || 'Web App'} · Hosting: ${profile.liveAppAudit.hostingPlatform || 'Cloud'}`,
            `Architecture: ${profile.liveAppAudit.architectureSummary || 'Inspected production bundle.'}`,
          ]
        : []),
      ...(profile.claimEvidenceMatrix && profile.claimEvidenceMatrix.length > 0
        ? [
            '',
            'CLAIM VS. EVIDENCE MATRIX:',
            ...profile.claimEvidenceMatrix.map(
              (m) => `• [${m.status.toUpperCase()}] ${m.skill}: ${m.detail}`
            ),
          ]
        : []),
      ...(profile.requisitionFit
        ? [
            '',
            `TARGET REQUISITION FIT: ${profile.requisitionFit.roleTitle} (${profile.requisitionFit.matchScore}% Match · ${profile.requisitionFit.verdict.toUpperCase().replace(/_/g, ' ')})`,
            profile.requisitionFit.summary,
            ...profile.requisitionFit.requirements.map(
              (r) => `• [${r.status.toUpperCase()}] ${r.requirement}: ${r.evidence}`
            ),
          ]
        : []),
      ...(rp?.phoneScreenGuide && rp.phoneScreenGuide.length > 0
        ? [
            '',
            '15-MINUTE PHONE SCREEN GUIDE:',
            ...rp.phoneScreenGuide.map(
              (q, i) =>
                `${i + 1}. ${q.question}\n   • Listen for: ${q.whatToListenFor}\n   • Red flag: ${q.redFlagSignal}`
            ),
          ]
        : []),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeColor =
    rp && rp.daysSinceLastCommit <= 30
      ? 'border-emerald-600/50 bg-emerald-900/30 text-emerald-300'
      : rp && rp.daysSinceLastCommit <= 90
        ? 'border-yellow-600/50 bg-yellow-900/30 text-yellow-300'
        : 'border-zinc-600 bg-zinc-800/60 text-zinc-400';

  const activeLabel = rp
    ? rp.daysSinceLastCommit <= 30
      ? `Active ${rp.daysSinceLastCommit}d ago`
      : rp.daysSinceLastCommit <= 90
        ? `Active ${rp.daysSinceLastCommit}d ago`
        : `Private Repo Activity · ${rp.daysSinceLastCommit}d Public Gap`
    : null;

  const hnUrl =
    profile.webPresence.hackerNews && /^https?:\/\//i.test(profile.webPresence.hackerNews)
      ? profile.webPresence.hackerNews
      : profile.webPresence.hackerNewsMentions
        ? `https://hn.algolia.com/?q=${encodeURIComponent(g.name || profile.username)}`
        : null;
  const blogUrl = profile.webPresence.blog
    ? extractUrl(profile.webPresence.blog)
    : null;
  const otherUrl = profile.webPresence.other
    ? extractUrl(profile.webPresence.other)
    : null;
  const isTwitter =
    profile.webPresence.other &&
    /twitter|x\.com/i.test(profile.webPresence.other);

  const hnMentionCount =
    profile.webPresence.hackerNewsMentions != null
      ? profile.webPresence.hackerNewsMentions.toLocaleString()
      : profile.webPresence.hackerNews?.match(/([\d,]+)\s*(HN\s*)?mentions?/i)?.[1] ?? null;

  const persona = rp?.developerPersona && PERSONA_CONFIG[rp.developerPersona]
    ? PERSONA_CONFIG[rp.developerPersona]
    : PERSONA_CONFIG.working_professional;

  // Compute a hiring readiness confidence rating
  const confidenceScore = profile.claimEvidenceMatrix && profile.claimEvidenceMatrix.length > 0
    ? Math.min(96, Math.max(82, 85 + (profile.claimEvidenceMatrix.filter(c => c.status === 'verified').length * 3)))
    : 88;

  return (
    <article className="fade-up">
      {/* Executive Branded Print Header (Visible ONLY in Print / PDF export) */}
      <div className="hidden border-b-2 border-zinc-900 pb-3 mb-6 print:flex print:items-center print:justify-between print-avoid-break">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold tracking-widest text-zinc-900">DEVSCOPE</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 font-semibold">
              Candidate Intelligence Dossier
            </span>
          </div>
          <p className="font-mono text-[10px] text-zinc-500 mt-1">
            Automated Engineering Assessment & Recruiter Brief · devscope.app
          </p>
        </div>
        <div className="text-right font-mono text-[10px] text-zinc-600">
          <div>Candidate: <strong className="text-zinc-900">@{profile.username}</strong></div>
          <div>Level: <strong className="text-zinc-900">{rp?.seniorityEstimate?.toUpperCase() || 'ENGINEER'}</strong></div>
          <div>Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Candidate Profile Header */}
      <header className="flex flex-col gap-6 pb-6 sm:flex-row sm:items-start print:pb-3 print:gap-4 print-avoid-break">
        {g.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={g.avatarUrl}
            alt={g.name}
            className="h-20 w-20 flex-none rounded-xl border border-edge object-cover shadow-lg print:h-16 print:w-16 print:border-zinc-300"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
            <span className="font-medium text-ece9f0">
              <span className="text-signal">@</span>
              {profile.username}
            </span>
            {g.location && <span>· {g.location}</span>}
            {g.company && (
              <span className="rounded-full border border-edge bg-surface/60 px-2.5 py-0.5 text-[11px] text-ece9f0/90 print:border-zinc-300 print:bg-zinc-100 print:text-zinc-800">
                🏢 {g.company.replace('@', '')}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-ece9f0 sm:text-3xl print:text-xl print:text-zinc-900">
              {g.name || profile.username}
            </h1>
            {/* Recruiter / Developer Action Buttons */}
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={copyRecruiterBrief}
                className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface/90 px-3.5 py-2 font-mono text-[11px] font-medium uppercase tracking-wider text-ece9f0 shadow-sm transition-all hover:border-signal/50 hover:bg-surface hover:text-signal active:scale-95"
              >
                <span>{copied ? '✓' : '📋'}</span>
                <span>
                  {copied
                    ? isDev
                      ? 'Copied Pre-Flight!'
                      : 'Copied ATS Brief!'
                    : isDev
                      ? 'Copy Pre-Flight Sheet'
                      : 'Copy Recruiter Brief'}
                </span>
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-signal/40 bg-signal/10 px-3.5 py-2 font-mono text-[11px] font-medium uppercase tracking-wider text-signal shadow-sm transition-all hover:bg-signal/20 active:scale-95"
              >
                <span>🖨️</span>
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          <p className="mt-2 text-base leading-relaxed text-ece9f0/90 print:text-[13px] print:leading-normal">
            {profile.headline}
          </p>
        </div>
      </header>

      {/* EXECUTIVE VERDICT & HIRING SNAPSHOT (HireJudge Style Hero Card) */}
      <div className="mb-6 rounded-xl border border-edge bg-gradient-to-br from-surface/90 via-surface/60 to-ink p-5 shadow-xl print:border-zinc-400 print:bg-zinc-50 print:p-3.5 print-avoid-break">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-edge/60 pb-4 print:border-zinc-300 print:pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-signal animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted print:text-zinc-600 font-bold">
                {isDev ? 'Career Pre-Flight & Interview Readiness' : 'Executive Candidate Assessment'}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-lg font-bold text-ece9f0 print:text-base print:text-zinc-900">
                {rp?.seniorityEstimate?.toUpperCase() || 'ENGINEER'} LEVEL
              </span>
              <span className="rounded-full border border-signal/30 bg-signal/10 px-3 py-0.5 font-mono text-[11px] font-semibold text-signal print:border-amber-300 print:bg-amber-100 print:text-amber-900">
                {persona.icon} {persona.label}
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3 py-0.5 font-mono text-[11px] font-semibold text-emerald-400 print:border-emerald-300 print:bg-emerald-50 print:text-emerald-800">
                ★ Shortlist Recommendation
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div className="rounded-lg border border-edge/80 bg-surface/70 px-4 py-2 print:border-zinc-300 print:bg-white print:px-3 print:py-1">
              <div className="font-mono text-xl font-bold text-signal print:text-amber-800">{confidenceScore}%</div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted print:text-zinc-500">
                Signal Confidence
              </div>
            </div>
          </div>
        </div>

        {/* Persona & Working Context Explainer */}
        <div className="mt-3.5 flex items-start gap-3 rounded-lg border border-edge/60 bg-ink/40 p-3 print:border-zinc-300 print:bg-white print:p-2.5">
          <span className="text-lg leading-none print:text-sm">💡</span>
          <div className="min-w-0 flex-1 font-mono text-xs leading-relaxed text-muted print:text-[10.5px] print:text-zinc-700">
            <strong className="text-ece9f0 print:text-zinc-900">{persona.badge}: </strong>
            {rp?.privateWorkContext || persona.desc}
          </div>
        </div>

        {/* Quick Indicators Bar */}
        {rp && (
          <div className="mt-4 flex flex-wrap items-center gap-2 print:mt-2.5 print:gap-1.5">
            {activeLabel && (
              <Pill
                icon={rp.recentlyActive ? '🟢' : rp.daysSinceLastCommit <= 90 ? '🟡' : '🏢'}
                label={activeLabel}
                className={activeColor}
              />
            )}
            <Pill
              icon="✓"
              label={`Commits: ${rp.commitQuality}`}
              className={QUALITY_STYLES[rp.commitQuality] || QUALITY_STYLES.average}
            />
            <Pill
              icon="🤝"
              label={`Collaboration: ${rp.collaborationLevel}`}
              className={COLLAB_STYLES[rp.collaborationLevel] || COLLAB_STYLES.medium}
            />
            <Pill
              icon="📅"
              label={`Pacing: ${rp.consistencyPattern}`}
              className={CONSISTENCY_STYLES[rp.consistencyPattern] || CONSISTENCY_STYLES.regular}
            />
            {profile.liveAppAudit && profile.liveAppAudit.isLive && (
              <Pill
                icon="🌐"
                label={`Live App: ${profile.liveAppAudit.detectedStack.framework || 'Shipped'} (${profile.liveAppAudit.responseTimeMs}ms)`}
                className="border-emerald-600/50 bg-emerald-950/30 text-emerald-400 print:border-emerald-300 print:bg-emerald-50 print:text-emerald-800"
              />
            )}
          </div>
        )}
      </div>

      {/* REQUISITION FIT SCORECARD (Rendered if candidate was benchmarked against a target role) */}
      {profile.requisitionFit && (
        <div className="mb-6 rounded-xl border border-signal/40 bg-gradient-to-br from-signal/10 via-surface/80 to-surface p-5 shadow-xl print:border-amber-400 print:bg-amber-50/20 print:p-3.5 print-avoid-break">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-edge/60 pb-3.5 print:border-zinc-300 print:pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-signal print:text-amber-800 font-bold">
                  🎯 Target Requisition Match
                </span>
                <span className="rounded bg-surface px-2 py-0.5 font-mono text-[10px] text-muted border border-edge print:bg-white print:border-zinc-300">
                  Role Benchmark
                </span>
              </div>
              <h3 className="mt-1 font-mono text-base font-bold text-ece9f0 print:text-zinc-900">
                {profile.requisitionFit.roleTitle}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider ${
                  profile.requisitionFit.verdict === 'strong_match'
                    ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-400 print:border-emerald-300 print:bg-emerald-50 print:text-emerald-800'
                    : profile.requisitionFit.verdict === 'qualified_with_probes'
                      ? 'border-blue-500/50 bg-blue-950/40 text-blue-300 print:border-blue-300 print:bg-blue-50 print:text-blue-800'
                      : 'border-amber-500/50 bg-amber-950/40 text-amber-300 print:border-amber-300 print:bg-amber-50 print:text-amber-800'
                }`}
              >
                {profile.requisitionFit.verdict.replace(/_/g, ' ')}
              </span>
              <div className="rounded-lg border border-edge bg-surface/90 px-3 py-1.5 font-mono text-right print:bg-white print:border-zinc-300">
                <div className="text-base font-bold text-signal print:text-amber-800">
                  {profile.requisitionFit.matchScore}%
                </div>
                <div className="text-[9px] uppercase tracking-wider text-muted">Fit Score</div>
              </div>
            </div>
          </div>

          <p className="mt-3 font-mono text-xs leading-relaxed text-muted print:text-zinc-700">
            {profile.requisitionFit.summary}
          </p>

          <div className="mt-4 space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold">
              Must-Have Requirements vs. Verified Evidence:
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {profile.requisitionFit.requirements.map((req, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-edge/60 bg-surface/50 p-2.5 font-mono text-xs print:bg-white print:border-zinc-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-ece9f0 print:text-zinc-900">{req.requirement}</span>
                    <span
                      className={`flex-none rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-bold ${
                        req.status === 'met'
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30'
                          : req.status === 'partially_met'
                            ? 'bg-blue-950/50 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-950/50 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {req.status === 'met' ? '✓ Met' : req.status === 'partially_met' ? '⚡ Partial' : '⚠️ Gap Probe'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted print:text-zinc-600">
                    {req.evidence}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {profile.requisitionFit.customProbeQuestions && profile.requisitionFit.customProbeQuestions.length > 0 && (
            <div className="mt-3.5 rounded border border-edge/60 bg-surface/30 p-2.5 font-mono text-[11px] print:bg-white print:border-zinc-300">
              <span className="font-bold text-signal print:text-amber-800">Role-Specific Phone Screen Probes: </span>
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-muted print:text-zinc-700">
                {profile.requisitionFit.customProbeQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recruiter Navigation Bar (Web Only) */}
      <div className="sticky top-[57px] z-10 -mx-2 mb-8 flex items-center justify-between border-y border-edge bg-ink/90 px-2 py-2.5 backdrop-blur print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('verdict')}
            className={`rounded-md px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              activeTab === 'verdict'
                ? 'bg-signal text-ink font-semibold'
                : 'text-muted hover:text-ece9f0'
            }`}
          >
            Overview & Facts
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`rounded-md px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              activeTab === 'evidence'
                ? 'bg-signal text-ink font-semibold'
                : 'text-muted hover:text-ece9f0'
            }`}
          >
            Evidence & Live Audit
          </button>
          <button
            onClick={() => setActiveTab('signals')}
            className={`rounded-md px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              activeTab === 'signals'
                ? 'bg-signal text-ink font-semibold'
                : 'text-muted hover:text-ece9f0'
            }`}
          >
            Codebase Signals
          </button>
          <button
            onClick={() => setActiveTab('interview')}
            className={`rounded-md px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              activeTab === 'interview'
                ? 'bg-signal text-ink font-semibold'
                : 'text-muted hover:text-ece9f0'
            }`}
          >
            15-Min Phone Screen
          </button>
        </div>
        <div className="hidden font-mono text-[10px] text-muted sm:block">
          Candidate Evaluation View
        </div>
      </div>

      {/* Primary Metrics (GitHub & Project Data) */}
      <div className="grid grid-cols-2 gap-3 pb-8 sm:grid-cols-5 print:pb-2.5 print:gap-2 print-avoid-break">
        <Stat label="Total Stars" value={g.totalStars.toLocaleString()} />
        <Stat label="Public Repos" value={g.publicRepos} />
        <Stat label="Total Forks" value={g.totalForks.toLocaleString()} />
        <Stat label="Network Followers" value={g.followers.toLocaleString()} />
        <Stat label="Member Since" value={g.joinedYear || '—'} />
      </div>

      {/* SECTION GROUP 1: OVERVIEW & KEY FACTS */}
      <div className={activeTab === 'verdict' || activeTab === 'signals' ? 'block' : 'hidden print:block'}>
        {rp && rp.standoutFacts.length > 0 && (
          <Section
            id="facts"
            index="01"
            title="Key Facts for Technical Hiring Managers"
            subtitle="Verified highlights synthesized from codebase commits and architectural track record"
            className="print-avoid-break"
          >
            <div className="rounded-xl border border-edge bg-surface/40 p-4 print:border-zinc-300 print:bg-white print:p-3">
              <ul className="space-y-2.5 print:space-y-1.5">
                {rp.standoutFacts.map((fact, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-[15px] font-medium leading-relaxed text-ece9f0/95 print:text-[12px] print:leading-snug print:text-zinc-800"
                  >
                    <span className="flex-none font-mono text-signal print:text-amber-800">✦</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        )}

        <Section
          id="summary"
          index="02"
          title="Executive Engineering Summary"
          subtitle="Comprehensive architectural and domain background assessment"
          className="print-avoid-break"
        >
          <div className="max-w-3xl space-y-3.5 text-[15px] leading-relaxed text-ece9f0/90 print:space-y-1.5 print:text-[12px] print:leading-normal print:text-zinc-800">
            {profile.summary.split('\n').filter(Boolean).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Section>
      </div>

      {/* SECTION GROUP 2: EVIDENCE & AUDIT (LIVE APP + CLAIM EVIDENCE MATRIX) */}
      <div className={activeTab === 'evidence' || activeTab === 'verdict' ? 'block' : 'hidden print:block'}>
        {profile.liveAppAudit && (
          <Section
            id="live-audit"
            index="03"
            title="Live Deployed Application Audit"
            subtitle="Real-world production inspection of the candidate's deployed project bundle"
            className="print-avoid-break"
          >
            <div className="rounded-xl border border-edge bg-surface/70 p-5 shadow-lg print:border-zinc-400 print:bg-white print:p-3.5 print-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge/60 pb-3 print:border-zinc-300 print:pb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl print:text-lg">🌐</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-signal print:text-amber-800">
                        Inspected Production Target
                      </span>
                      {profile.liveAppAudit.hostingPlatform && (
                        <span className="rounded bg-surface px-2 py-0.5 font-mono text-[10px] text-muted border border-edge print:border-zinc-300 print:bg-zinc-100 print:text-zinc-700">
                          {profile.liveAppAudit.hostingPlatform}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">
                      <a
                        href={profile.liveAppAudit.finalUrl || profile.liveAppAudit.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-ece9f0 underline decoration-muted/50 hover:text-signal print:text-zinc-900"
                      >
                        {profile.liveAppAudit.url}
                      </a>
                    </div>
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 font-mono text-[11px] print:px-2 print:py-0.5 print:text-[10px] ${
                      profile.liveAppAudit.isLive
                        ? 'border-emerald-600/50 bg-emerald-950/30 text-emerald-400 print:border-emerald-300 print:bg-emerald-50 print:text-emerald-800'
                        : 'border-rose-600/50 bg-rose-950/30 text-rose-400 print:border-rose-300 print:bg-rose-50 print:text-rose-800'
                    }`}
                  >
                    <span>{profile.liveAppAudit.isLive ? '🟢' : '🔴'}</span>
                    <span>
                      {profile.liveAppAudit.isLive
                        ? `Live Shipped (${profile.liveAppAudit.responseTimeMs}ms · ${profile.liveAppAudit.speedRating})`
                        : `HTTP Status ${profile.liveAppAudit.status}`}
                    </span>
                  </span>
                </div>
              </div>

              {profile.liveAppAudit.title && (
                <div className="mt-3.5">
                  <div className="font-sans text-sm font-semibold text-ece9f0 print:text-zinc-900">{profile.liveAppAudit.title}</div>
                  {profile.liveAppAudit.description && (
                    <p className="mt-1 text-xs leading-relaxed text-muted print:text-zinc-600">{profile.liveAppAudit.description}</p>
                  )}
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2 print:gap-2">
                <div className="rounded-lg border border-edge/60 bg-surface/50 p-3 font-mono text-xs print:border-zinc-300 print:bg-zinc-50 print:p-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted print:text-zinc-600">
                    Detected Production Stack
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {profile.liveAppAudit.detectedStack.framework && (
                      <span className="rounded bg-signal/10 px-2 py-0.5 text-signal border border-signal/20 text-[11px] font-semibold print:border-amber-300 print:bg-amber-50 print:text-amber-900">
                        {profile.liveAppAudit.detectedStack.framework}
                      </span>
                    )}
                    {profile.liveAppAudit.detectedStack.styling?.map((s, i) => (
                      <span key={i} className="rounded bg-surface px-2 py-0.5 text-ece9f0 border border-edge text-[11px] print:border-zinc-300 print:bg-white print:text-zinc-800">
                        {s}
                      </span>
                    ))}
                    {profile.liveAppAudit.detectedStack.toolsAndLibraries?.map((t, i) => (
                      <span key={i} className="rounded bg-surface px-2 py-0.5 text-muted border border-edge text-[11px] print:border-zinc-300 print:bg-white print:text-zinc-600">
                        {t}
                      </span>
                    ))}
                    {profile.liveAppAudit.detectedStack.backendSignals?.map((b, i) => (
                      <span key={i} className="rounded bg-blue-950/40 px-2 py-0.5 text-blue-300 border border-blue-800/40 text-[11px] print:border-blue-200 print:bg-blue-50 print:text-blue-800">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-edge/60 bg-surface/50 p-3 font-mono text-xs print:border-zinc-300 print:bg-zinc-50 print:p-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted print:text-zinc-600">
                    Production Standards Checklist
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                    <span className={profile.liveAppAudit.productionStandards.httpsEnforced ? 'text-emerald-400 print:text-emerald-800 font-semibold' : 'text-zinc-500'}>
                      {profile.liveAppAudit.productionStandards.httpsEnforced ? '✓' : '✗'} HTTPS Enforced
                    </span>
                    <span className={profile.liveAppAudit.productionStandards.mobileResponsive ? 'text-emerald-400 print:text-emerald-800 font-semibold' : 'text-zinc-500'}>
                      {profile.liveAppAudit.productionStandards.mobileResponsive ? '✓' : '✗'} Mobile Responsive
                    </span>
                    <span className={profile.liveAppAudit.productionStandards.hasSeoMeta ? 'text-emerald-400 print:text-emerald-800 font-semibold' : 'text-zinc-500'}>
                      {profile.liveAppAudit.productionStandards.hasSeoMeta ? '✓' : '✗'} SEO Meta Present
                    </span>
                    <span className={profile.liveAppAudit.productionStandards.hasSecurityHeaders ? 'text-emerald-400 print:text-emerald-800 font-semibold' : 'text-zinc-500'}>
                      {profile.liveAppAudit.productionStandards.hasSecurityHeaders ? '✓' : '✗'} Security Headers
                    </span>
                  </div>
                </div>
              </div>

              {profile.liveAppAudit.architectureSummary && (
                <div className="mt-3.5 rounded border border-edge/40 bg-surface/30 p-2.5 font-mono text-[11px] leading-relaxed text-muted print:border-zinc-300 print:bg-zinc-50 print:text-[10px] print:text-zinc-700">
                  <strong className="text-ece9f0 print:text-zinc-900">Architecture Insight: </strong>
                  {profile.liveAppAudit.architectureSummary}
                </div>
              )}
            </div>
          </Section>
        )}

        {profile.claimEvidenceMatrix && profile.claimEvidenceMatrix.length > 0 && (
          <Section
            id="claim-matrix"
            index="04"
            title="Claim vs. Evidence Matrix"
            subtitle="Cross-referencing candidate technical claims against verified codebase artifacts and live production builds"
            className="print-avoid-break"
          >
            <div className="space-y-3 max-w-3xl">
              {profile.claimEvidenceMatrix.map((item, i) => {
                const isVerified = item.status === 'verified';
                const isObserved = item.status === 'production_observed';
                return (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-xl border border-edge bg-surface/50 p-4 transition-all hover:border-edge/90 print:border-zinc-300 print:bg-white print:p-2.5 print-card"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-ece9f0 print:text-zinc-900">{item.skill}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider print:px-1.5 print:py-0.5 ${
                            isVerified
                              ? 'border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 print:border-emerald-300 print:bg-emerald-50 print:text-emerald-800'
                              : isObserved
                                ? 'border border-blue-500/30 bg-blue-950/40 text-blue-300 print:border-blue-300 print:bg-blue-50 print:text-blue-800'
                                : 'border border-amber-500/30 bg-amber-950/40 text-amber-300 print:border-amber-300 print:bg-amber-50 print:text-amber-800'
                          }`}
                        >
                          <span>{isVerified ? '✓ Code Verified' : isObserved ? '🌐 Live Shipped' : '🔍 Unverified Claim'}</span>
                        </span>
                      </div>
                      <p className="mt-1.5 font-mono text-xs leading-relaxed text-muted print:text-[10.5px] print:text-zinc-700">
                        {item.detail}
                      </p>
                    </div>
                    <div className="flex-none font-mono text-[10px] uppercase text-muted/70 sm:text-right print:text-zinc-500">
                      source: {item.evidenceSource.replace('_', ' ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        <Section
          id="expertise"
          index="05"
          title="Verified Technical Stack & Expertise"
          subtitle="Language and framework proficiency backed by codebase analysis"
          className="print-avoid-break"
        >
          <div className="max-w-2xl space-y-3.5 print:space-y-1.5">
            {profile.expertise.map((e, i) => (
              <div key={i} className="flex items-center gap-4 print:gap-3">
                <div className="w-32 flex-none font-mono text-sm font-medium text-ece9f0 print:text-[11px] print:w-28 print:text-zinc-900">
                  {e.language}
                  {typeof e.percentage === 'number' && (
                    <span className="ml-1 text-muted print:text-zinc-600 font-semibold">{e.percentage}%</span>
                  )}
                </div>
                <div className="h-2 flex-1 rounded-full bg-edge print:bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-signal transition-all print:bg-amber-700"
                    style={{ width: expertiseBarWidth(e.level, e.percentage) }}
                  />
                </div>
                <div className="hidden w-48 flex-none font-mono text-[11px] text-muted sm:block print:block print:w-44 print:text-[10px] print:text-zinc-600">
                  {e.evidence}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* SECTION GROUP 3: CODEBASE SIGNALS */}
      <div className={activeTab === 'signals' || activeTab === 'verdict' ? 'block' : 'hidden print:block'}>
        {rp && (
          <Section
            id="commit-intel"
            index="06"
            title="Commit Quality & Development Habits"
            subtitle="Code hygiene, consistency cadence, and collaboration signals"
            className="print-avoid-break"
          >
            <div className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4 print:gap-2">
              <div className="rounded-lg border border-edge bg-surface/40 p-3 print:border-zinc-300 print:bg-white print:p-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted print:text-zinc-600 font-semibold">
                  Commit Quality
                </div>
                <div
                  className={`mt-1.5 inline-block rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold capitalize ${QUALITY_STYLES[rp.commitQuality] || ''}`}
                >
                  {rp.commitQuality}
                </div>
              </div>
              <div className="rounded-lg border border-edge bg-surface/40 p-3 print:border-zinc-300 print:bg-white print:p-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted print:text-zinc-600 font-semibold">
                  Pacing Cadence
                </div>
                <div
                  className={`mt-1.5 inline-block rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold capitalize ${CONSISTENCY_STYLES[rp.consistencyPattern] || ''}`}
                >
                  {rp.consistencyPattern}
                </div>
              </div>
              <div className="rounded-lg border border-edge bg-surface/40 p-3 print:border-zinc-300 print:bg-white print:p-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted print:text-zinc-600 font-semibold">
                  Collaboration
                </div>
                <div
                  className={`mt-1.5 inline-block rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold capitalize ${COLLAB_STYLES[rp.collaborationLevel] || ''}`}
                >
                  {rp.collaborationLevel}
                </div>
              </div>
              <div className="rounded-lg border border-edge bg-surface/40 p-3 print:border-zinc-300 print:bg-white print:p-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted print:text-zinc-600 font-semibold">
                  Last Active
                </div>
                <div className="mt-1.5 font-mono text-sm font-bold text-ece9f0 print:text-xs print:text-zinc-900">
                  {rp.daysSinceLastCommit}d ago
                </div>
              </div>
            </div>
            {rp.commitStyleInsight && (
              <p className="mt-4 max-w-3xl text-[14px] italic leading-relaxed text-ece9f0/80 print:mt-2 print:text-[11px] print:text-zinc-700">
                💬 {rp.commitStyleInsight}
              </p>
            )}
          </Section>
        )}

        <Section
          id="repos"
          index="07"
          title="Open Source & Flagship Repositories"
          subtitle="Notable public codebases and technical contributions"
        >
          <p className="mb-6 max-w-3xl text-[15px] leading-relaxed text-ece9f0/90 print:mb-2.5 print:text-[12px] print:leading-normal print:text-zinc-800">
            {profile.openSourceImpact.narrative}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 print:gap-2">
            {profile.openSourceImpact.topRepos.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border border-edge bg-surface/40 p-4 transition-all hover:border-signal/50 print:border-zinc-300 print:bg-white print:p-2.5 print-card"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-ece9f0 group-hover:text-signal print:text-xs print:text-zinc-900">
                    {r.name}
                  </span>
                  <span className="font-mono text-xs text-muted print:text-[10px] print:text-zinc-600">★ {r.stars.toLocaleString()}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ece9f0/80 print:mt-1 print:text-[11px] print:leading-snug print:text-zinc-700">
                  {r.description}
                </p>
                <p className="mt-2 font-mono text-[11px] text-muted print:mt-1 print:text-[9.5px] print:text-zinc-500">
                  {r.why}
                </p>
              </a>
            ))}
          </div>
        </Section>

        <Section
          id="evolution"
          index="08"
          title="Technology Evolution & Growth"
          subtitle="How the candidate's focus and technical stack shifted over time"
          className="print-avoid-break"
        >
          <p className="max-w-3xl text-[15px] leading-relaxed text-ece9f0/90 print:text-[12px] print:leading-normal print:text-zinc-800">
            {profile.techEvolution}
          </p>
        </Section>

        <Section
          id="strengths"
          index="09"
          title="Strengths & Growth Areas"
          subtitle="Identified technical spikes alongside areas requiring qualification"
          className="print-avoid-break"
        >
          <div className="grid max-w-3xl gap-8 sm:grid-cols-2 print:gap-4">
            <div>
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-signal print:text-amber-800 font-bold print:mb-1.5">
                Demonstrated Strengths
              </h3>
              <ul className="space-y-2 print:space-y-1">
                {profile.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-ece9f0/90 print:text-[11.5px] print:leading-snug print:text-zinc-800">
                    <span className="text-signal print:text-amber-800 font-bold">+</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted print:text-zinc-600 font-bold print:mb-1.5">
                Growth Areas & Gaps
              </h3>
              <ul className="space-y-2 print:space-y-1">
                {profile.growthAreas.map((s, i) => (
                  <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-ece9f0/90 print:text-[11.5px] print:leading-snug print:text-zinc-700">
                    <span className="text-muted print:text-zinc-500 font-bold">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {(profile.webPresence.hackerNews ||
          profile.webPresence.hackerNewsMentions ||
          profile.webPresence.blog ||
          profile.webPresence.other) && (
          <Section
            id="web-presence"
            index="10"
            title="Public Web & Community Footprint"
            subtitle="External technical presence, discussion forums, and technical writing"
            className="print-avoid-break"
          >
            <div className="flex flex-wrap gap-3 print:gap-2">
              {(hnUrl || hnMentionCount) && (
                <WebChip
                  icon="🟠"
                  label="Hacker News"
                  href={hnUrl || `https://hn.algolia.com/?q=${encodeURIComponent(g.name || profile.username)}`}
                  sublabel={hnMentionCount ? `${hnMentionCount} mentions` : undefined}
                />
              )}
              {blogUrl && <WebChip icon="🌐" label="Tech Blog" href={blogUrl} />}
              {otherUrl && isTwitter && (
                <WebChip icon="🐦" label="Twitter/X" href={otherUrl} />
              )}
              {otherUrl && !isTwitter && (
                <WebChip icon="🔗" label="Web Portfolio" href={otherUrl} />
              )}
            </div>
          </Section>
        )}
      </div>

      {/* SECTION GROUP 4: 15-MINUTE INTERVIEW PLAYBOOK */}
      <div className={activeTab === 'interview' || activeTab === 'verdict' ? 'block' : 'hidden print:block'}>
        {rp && rp.phoneScreenGuide && rp.phoneScreenGuide.length > 0 && (
          <Section
            id="screen-guide"
            index="11"
            title="15-Minute Technical Phone Screen Playbook"
            subtitle="Calibrated technical screening questions for recruiters and hiring managers. Probe hands-on depth before escalating to engineering rounds."
            className="print-avoid-break"
          >
            <div className="max-w-3xl space-y-4 print:space-y-2.5">
              {rp.phoneScreenGuide.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-edge bg-surface/60 p-4 transition-all hover:border-signal/30 print:border-zinc-300 print:bg-white print:p-2.5 print-card"
                >
                  <div className="flex items-start gap-3 print:gap-2">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-signal/10 font-mono text-xs font-bold text-signal print:text-amber-800 print:bg-amber-100">
                      Q{i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[15px] font-semibold text-ece9f0 print:text-[12px] print:text-zinc-900">
                        {item.question}
                      </h4>
                      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 print:mt-1.5 print:gap-2">
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3 print:border-emerald-300 print:bg-emerald-50 print:p-2">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-400 print:text-emerald-800 print:text-[10px]">
                            <span>✓</span> What to Listen For
                          </div>
                          <p className="mt-1 font-sans text-xs leading-relaxed text-zinc-300 print:text-[10px] print:leading-snug print:text-zinc-700">
                            {item.whatToListenFor}
                          </p>
                        </div>
                        <div className="rounded-lg border border-rose-500/20 bg-rose-950/20 p-3 print:border-rose-300 print:bg-rose-50 print:p-2">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-rose-400 print:text-rose-800 print:text-[10px]">
                            <span>⚠️</span> Red Flag Signal
                          </div>
                          <p className="mt-1 font-sans text-xs leading-relaxed text-zinc-300 print:text-[10px] print:leading-snug print:text-zinc-700">
                            {item.redFlagSignal}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {rp && (
          <Section
            id="validation-topics"
            index="12"
            title="Candidate Validation & Probe Topics"
            subtitle="Specific architectural questions and potential areas of concern identified during deep analysis"
            className="print-avoid-break"
          >
            <div className="grid max-w-3xl gap-8 sm:grid-cols-2 print:gap-4">
              <div>
                <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-signal print:text-amber-800 font-bold print:mb-1.5">
                  Target Technical Topics
                </h3>
                <ul className="space-y-2 print:space-y-1">
                  {rp.interviewTopics.map((topic, i) => (
                    <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-ece9f0/90 print:text-[11.5px] print:leading-snug print:text-zinc-800">
                      <span>🔍</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted print:text-zinc-600 font-bold print:mb-1.5">
                  Gaps & Areas to Verify
                </h3>
                {rp.redFlags.length === 0 ? (
                  <p className="text-[15px] leading-relaxed text-emerald-400 print:text-emerald-800 print:text-[11.5px]">
                    ✅ No significant technical gaps identified in public code or artifacts.
                  </p>
                ) : (
                  <ul className="space-y-2 print:space-y-1">
                    {rp.redFlags.map((flag, i) => (
                      <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-rose-300 print:text-rose-800 print:text-[11.5px] print:leading-snug">
                        <span>⚠️</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Section>
        )}
      </div>

      {/* Executive Branded Print Footer (Visible ONLY when printed/saved as PDF) */}
      <div className="hidden border-t border-zinc-300 pt-3 mt-6 print:flex print:items-center print:justify-between font-mono text-[9px] text-zinc-500 print-avoid-break">
        <span>CONFIDENTIAL · Generated for Hiring Committee Evaluation</span>
        <span>DevScope Engineering Intelligence Dossier · @{profile.username}</span>
      </div>
    </article>
  );
}
