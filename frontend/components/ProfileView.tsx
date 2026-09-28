'use client';

import { useState } from 'react';
import { DevProfile } from '@/types/profile';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="font-mono text-xl text-ece9f0">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </div>
    </div>
  );
}

function Section({
  index,
  title,
  children,
  className = '',
}: {
  index: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-t border-edge py-8 print:py-3.5 print-section ${className}`}>
      <div className="mb-4 flex items-baseline gap-3 print:mb-2 print-heading">
        <span className="font-mono text-xs text-signal print:text-amber-700 font-bold">{index}</span>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted print:text-zinc-800 font-semibold">
          {title}
        </h2>
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide ${className}`}
    >
      <span>{icon}</span>
      {label}
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
  junior: 'border-zinc-600 bg-zinc-800/60 text-zinc-300',
  mid: 'border-blue-600/50 bg-blue-900/30 text-blue-300',
  senior: 'border-purple-600/50 bg-purple-900/30 text-purple-300',
  staff: 'border-orange-600/50 bg-orange-900/30 text-orange-300',
  principal: 'border-amber-500/60 bg-amber-900/30 text-amber-300',
};

const COLLAB_STYLES: Record<string, string> = {
  high: 'border-emerald-600/50 bg-emerald-900/30 text-emerald-300',
  medium: 'border-blue-600/50 bg-blue-900/30 text-blue-300',
  low: 'border-zinc-600 bg-zinc-800/60 text-zinc-400',
  solo: 'border-orange-600/50 bg-orange-900/30 text-orange-300',
};

const QUALITY_STYLES: Record<string, string> = {
  excellent: 'border-emerald-600/50 bg-emerald-900/30 text-emerald-300',
  good: 'border-blue-600/50 bg-blue-900/30 text-blue-300',
  average: 'border-yellow-600/50 bg-yellow-900/30 text-yellow-300',
  poor: 'border-red-600/50 bg-red-900/30 text-red-300',
};

const CONSISTENCY_STYLES: Record<string, string> = {
  daily: 'border-emerald-600/50 bg-emerald-900/30 text-emerald-300',
  regular: 'border-blue-600/50 bg-blue-900/30 text-blue-300',
  sporadic: 'border-yellow-600/50 bg-yellow-900/30 text-yellow-300',
  burst: 'border-orange-600/50 bg-orange-900/30 text-orange-300',
};

const PERSONA_CONFIG: Record<string, { icon: string; label: string; style: string }> = {
  working_professional: {
    icon: '💼',
    label: 'Working Professional',
    style: 'border-blue-500/50 bg-blue-900/30 text-blue-300',
  },
  fresher_builder: {
    icon: '🌱',
    label: 'Active Builder',
    style: 'border-emerald-500/50 bg-emerald-900/30 text-emerald-300',
  },
  open_source_contributor: {
    icon: '🌐',
    label: 'OSS Contributor',
    style: 'border-purple-500/50 bg-purple-900/30 text-purple-300',
  },
  specialist: {
    icon: '⚡',
    label: 'Domain Specialist',
    style: 'border-amber-500/50 bg-amber-900/30 text-amber-300',
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
      className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface/60 px-4 py-2 font-mono text-xs text-ece9f0 transition-colors hover:border-signal/50 hover:text-signal"
    >
      <span>{icon}</span>
      <span>{label}</span>
      {sublabel && <span className="text-muted">· {sublabel}</span>}
    </a>
  );
}

function expertiseBarWidth(level: string, percentage?: number): string {
  if (typeof percentage === 'number' && percentage > 0) {
    return `${Math.min(percentage, 100)}%`;
  }
  return `${LEVEL_WIDTH[level] ?? 20}%`;
}

export function ProfileView({ profile }: { profile: DevProfile }) {
  const [copied, setCopied] = useState(false);
  const g = profile.github;
  const rp = profile.recruiterPanel;

  const copyRecruiterBrief = () => {
    const lines = [
      `Candidate: ${g.name || profile.username} (@${profile.username})`,
      `Estimated Seniority: ${rp?.seniorityEstimate?.toUpperCase() || 'ENGINEER'} (${rp?.seniorityReason || ''})`,
      `Headline: ${profile.headline}`,
      '',
      'Key Highlights:',
      ...(rp?.standoutFacts || []).map((f) => `• ${f}`),
      '',
      'Expertise: ' + profile.expertise.map((e) => `${e.language} (${e.percentage || 0}%)`).join(', '),
      '',
      'Strengths:',
      ...profile.strengths.map((s) => `+ ${s}`),
      '',
      ...(rp?.phoneScreenGuide && rp.phoneScreenGuide.length > 0
        ? [
            'Suggested 15-Minute Screen Questions:',
            ...rp.phoneScreenGuide.map(
              (q, i) =>
                `${i + 1}. ${q.question}\n   Listen for: ${q.whatToListenFor}\n   Red flag: ${q.redFlagSignal}`
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
        : 'border-red-600/50 bg-red-900/30 text-red-300';

  const activeLabel = rp
    ? rp.daysSinceLastCommit <= 30
      ? `Active ${rp.daysSinceLastCommit}d ago`
      : rp.daysSinceLastCommit <= 90
        ? `Active ${rp.daysSinceLastCommit}d ago`
        : `Inactive ${rp.daysSinceLastCommit}d`
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
          <div>Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>
      </div>

      <header className="flex flex-col gap-6 pb-8 sm:flex-row sm:items-start print:pb-3 print:gap-4 print-avoid-break">
        {g.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={g.avatarUrl}
            alt={g.name}
            className="h-20 w-20 flex-none rounded-lg border border-edge print:h-16 print:w-16"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
            <span>
              <span className="text-signal">@</span>
              {profile.username}
              {g.location && <span>· {g.location}</span>}
            </span>
            {g.company && (
              <span className="rounded-full border border-edge bg-surface/60 px-2.5 py-1 text-[11px] text-ece9f0/80">
                {g.company.replace('@', '')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="mt-1 text-2xl text-ece9f0">{g.name}</h1>
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={copyRecruiterBrief}
                className="rounded-md border border-edge bg-surface/80 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:border-signal/50 hover:text-signal"
              >
                {copied ? '✓ Copied Brief!' : '📋 Copy Recruiter Brief'}
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-md border border-edge bg-surface/80 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:border-signal/50 hover:text-signal"
              >
                🖨️ Print / PDF
              </button>
            </div>
          </div>
          <p className="mt-2 max-w-2xl text-lg leading-relaxed text-ece9f0/90 print:text-[13px] print:leading-normal">
            {profile.headline}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6 border-y border-edge py-6 sm:grid-cols-5 print:py-2.5 print:gap-3 print-avoid-break">
        <Stat label="followers" value={g.followers.toLocaleString()} />
        <Stat label="repos" value={g.publicRepos} />
        <Stat label="total stars" value={g.totalStars.toLocaleString()} />
        <Stat label="total forks" value={g.totalForks.toLocaleString()} />
        <Stat label="since" value={g.joinedYear || '—'} />
      </div>

      {rp && (
        <div className="mt-6 rounded-lg border border-edge bg-surface/50 p-4 print:mt-3 print:p-3 print-avoid-break">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted print:mb-1.5 print:text-zinc-600 font-semibold">
            Recruiter quick panel
          </div>
          <div className="flex flex-wrap gap-2 print:gap-1.5">
            {rp.developerPersona && PERSONA_CONFIG[rp.developerPersona] && (
              <Pill
                icon={PERSONA_CONFIG[rp.developerPersona].icon}
                label={PERSONA_CONFIG[rp.developerPersona].label}
                className={PERSONA_CONFIG[rp.developerPersona].style}
              />
            )}
            {activeLabel && (
              <Pill
                icon={rp.recentlyActive ? '🟢' : rp.daysSinceLastCommit <= 90 ? '🟡' : '🔴'}
                label={activeLabel}
                className={activeColor}
              />
            )}
            <Pill
              icon="⭐"
              label={`${rp.seniorityEstimate} engineer`}
              className={SENIORITY_STYLES[rp.seniorityEstimate] || SENIORITY_STYLES.mid}
            />
            <Pill
              icon="🤝"
              label={`collab: ${rp.collaborationLevel}`}
              className={COLLAB_STYLES[rp.collaborationLevel] || COLLAB_STYLES.medium}
            />
            <Pill
              icon="✓"
              label={`commits: ${rp.commitQuality}`}
              className={QUALITY_STYLES[rp.commitQuality] || QUALITY_STYLES.average}
            />
            <Pill
              icon="📅"
              label={rp.consistencyPattern}
              className={CONSISTENCY_STYLES[rp.consistencyPattern] || CONSISTENCY_STYLES.regular}
            />
          </div>
          {rp.seniorityReason && (
            <p className="mt-3 font-mono text-[11px] text-muted print:mt-2 print:text-[10px]">{rp.seniorityReason}</p>
          )}
          {rp.privateWorkContext && (
            <div className="mt-3 flex items-start gap-2.5 rounded-md border border-edge/80 bg-surface/70 px-3 py-2.5 print:mt-2 print:py-1.5 print:px-2.5">
              <span className="text-sm leading-none">💡</span>
              <p className="font-mono text-[11px] leading-relaxed text-muted print:text-[10px]">
                <span className="font-medium text-ece9f0">Hiring Context: </span>
                {rp.privateWorkContext}
              </p>
            </div>
          )}
        </div>
      )}

      {rp && rp.standoutFacts.length > 0 && (
        <section className="border-t border-edge py-8 print:py-3 print-avoid-break">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-signal print:text-amber-700 print:mb-2 font-semibold print-heading">
            Key facts for recruiters
          </h2>
          <ul className="max-w-3xl space-y-2 print:space-y-1">
            {rp.standoutFacts.map((fact, i) => (
              <li
                key={i}
                className="flex gap-3 text-[15px] font-medium leading-relaxed text-ece9f0/95 print:text-[12px] print:leading-snug"
              >
                <span className="flex-none text-signal print:text-amber-700">✦</span>
                {fact}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Section index="01" title="Expertise" className="print-avoid-break">
        <div className="max-w-2xl space-y-3 print:space-y-1.5">
          {profile.expertise.map((e, i) => (
            <div key={i} className="flex items-center gap-4 print:gap-3">
              <div className="w-32 flex-none font-mono text-sm text-ece9f0 print:text-[11px] print:w-28">
                {e.language}
                {typeof e.percentage === 'number' && (
                  <span className="ml-1 text-muted print:text-zinc-600 font-semibold">{e.percentage}%</span>
                )}
              </div>
              <div className="h-1.5 flex-1 rounded-full bg-edge">
                <div
                  className="h-full rounded-full bg-signal transition-all"
                  style={{ width: expertiseBarWidth(e.level, e.percentage) }}
                />
              </div>
              <div className="hidden w-48 flex-none font-mono text-[11px] text-muted sm:block print:block print:w-44 print:text-[10px]">
                {e.evidence}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {rp && (
        <Section index="02" title="Commit intelligence" className="print-avoid-break">
          <div className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4 print:gap-2">
            <div className="rounded-lg border border-edge bg-surface/40 p-3 print:p-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted print:text-zinc-600 font-semibold">
                Quality
              </div>
              <div
                className={`mt-1 inline-block rounded-full border px-2 py-0.5 font-mono text-[11px] capitalize ${QUALITY_STYLES[rp.commitQuality] || ''}`}
              >
                {rp.commitQuality}
              </div>
            </div>
            <div className="rounded-lg border border-edge bg-surface/40 p-3 print:p-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted print:text-zinc-600 font-semibold">
                Consistency
              </div>
              <div
                className={`mt-1 inline-block rounded-full border px-2 py-0.5 font-mono text-[11px] capitalize ${CONSISTENCY_STYLES[rp.consistencyPattern] || ''}`}
              >
                {rp.consistencyPattern}
              </div>
            </div>
            <div className="rounded-lg border border-edge bg-surface/40 p-3 print:p-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted print:text-zinc-600 font-semibold">
                Collaboration
              </div>
              <div
                className={`mt-1 inline-block rounded-full border px-2 py-0.5 font-mono text-[11px] capitalize ${COLLAB_STYLES[rp.collaborationLevel] || ''}`}
              >
                {rp.collaborationLevel}
              </div>
            </div>
            <div className="rounded-lg border border-edge bg-surface/40 p-3 print:p-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted print:text-zinc-600 font-semibold">
                Last active
              </div>
              <div className="mt-1 font-mono text-sm text-ece9f0 print:text-xs font-semibold">
                {rp.daysSinceLastCommit}d ago
              </div>
            </div>
          </div>
          {rp.commitStyleInsight && (
            <p className="mt-4 max-w-3xl text-[15px] italic leading-relaxed text-ece9f0/80 print:mt-2 print:text-[11px]">
              💬 {rp.commitStyleInsight}
            </p>
          )}
        </Section>
      )}

      <Section index="03" title="Summary" className="print-avoid-break">
        <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-ece9f0/90 print:space-y-1.5 print:text-[12px] print:leading-normal">
          {profile.summary.split('\n').filter(Boolean).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </Section>

      <Section index="04" title="Open source impact">
        <p className="mb-6 max-w-3xl text-[15px] leading-relaxed text-ece9f0/90 print:mb-2.5 print:text-[12px] print:leading-normal">
          {profile.openSourceImpact.narrative}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 print:gap-2">
          {profile.openSourceImpact.topRepos.map((r, i) => (
            <a
              key={i}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="group rounded-lg border border-edge bg-surface/40 p-4 transition-colors hover:border-signal/50 print:p-2.5 print-card"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-ece9f0 group-hover:text-signal print:text-xs font-semibold">
                  {r.name}
                </span>
                <span className="font-mono text-xs text-muted print:text-[10px]">★ {r.stars.toLocaleString()}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ece9f0/80 print:mt-1 print:text-[11px] print:leading-snug">{r.description}</p>
              <p className="mt-2 font-mono text-[11px] text-muted print:mt-1 print:text-[9.5px]">{r.why}</p>
            </a>
          ))}
        </div>
      </Section>

      <Section index="05" title="Tech evolution" className="print-avoid-break">
        <p className="max-w-3xl text-[15px] leading-relaxed text-ece9f0/90 print:text-[12px] print:leading-normal">
          {profile.techEvolution}
        </p>
      </Section>

      <Section index="06" title="Communication style" className="print-avoid-break">
        <p className="max-w-3xl text-[15px] leading-relaxed text-ece9f0/90 print:text-[12px] print:leading-normal">
          {profile.communicationStyle}
        </p>
      </Section>

      {(profile.webPresence.hackerNews ||
        profile.webPresence.hackerNewsMentions ||
        profile.webPresence.blog ||
        profile.webPresence.other) && (
        <Section index="07" title="Web presence" className="print-avoid-break">
          <div className="flex flex-wrap gap-3 print:gap-2">
            {(hnUrl || hnMentionCount) && (
              <WebChip
                icon="🟠"
                label="Hacker News"
                href={hnUrl || `https://hn.algolia.com/?q=${encodeURIComponent(g.name || profile.username)}`}
                sublabel={hnMentionCount ? `${hnMentionCount} mentions` : undefined}
              />
            )}
            {blogUrl && <WebChip icon="🌐" label="Blog" href={blogUrl} />}
            {otherUrl && isTwitter && (
              <WebChip icon="🐦" label="Twitter/X" href={otherUrl} />
            )}
            {otherUrl && !isTwitter && (
              <WebChip icon="🔗" label="Web" href={otherUrl} />
            )}
          </div>
          {!hnUrl && !blogUrl && !otherUrl && (
            <div className="max-w-3xl space-y-3 text-[15px] leading-relaxed text-ece9f0/90 print:space-y-1.5 print:text-[11px]">
              {profile.webPresence.hackerNews && (
                <p>
                  <span className="font-mono text-xs text-signal print:text-amber-700">HN </span>
                  {profile.webPresence.hackerNews}
                </p>
              )}
              {profile.webPresence.blog && (
                <p>
                  <span className="font-mono text-xs text-signal print:text-amber-700">BLOG </span>
                  {profile.webPresence.blog}
                </p>
              )}
              {profile.webPresence.other && (
                <p>
                  <span className="font-mono text-xs text-signal print:text-amber-700">WEB </span>
                  {profile.webPresence.other}
                </p>
              )}
            </div>
          )}
          {hnMentionCount && !hnUrl && (
            <p className="mt-3 font-mono text-xs text-muted print:mt-1.5 print:text-[10px]">
              {hnMentionCount} HN mentions
            </p>
          )}
        </Section>
      )}

      <Section index="08" title="Strengths & growth" className="print-avoid-break">
        <div className="grid max-w-3xl gap-8 sm:grid-cols-2 print:gap-4">
          <div>
            <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-signal print:text-amber-700 font-semibold print:mb-1.5">
              Strengths
            </h3>
            <ul className="space-y-2 print:space-y-1">
              {profile.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-ece9f0/90 print:text-[11.5px] print:leading-snug">
                  <span className="text-signal print:text-amber-700 font-bold">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted print:text-zinc-600 font-semibold print:mb-1.5">
              Growth areas
            </h3>
            <ul className="space-y-2 print:space-y-1">
              {profile.growthAreas.map((s, i) => (
                <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-ece9f0/90 print:text-[11.5px] print:leading-snug">
                  <span className="text-muted print:text-zinc-500 font-bold">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {rp && (
        <Section index="09" title="Interview prep" className="print-avoid-break">
          <div className="grid max-w-3xl gap-8 sm:grid-cols-2 print:gap-4">
            <div>
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-signal print:text-amber-700 font-semibold print:mb-1.5">
                Topics to explore
              </h3>
              <ul className="space-y-2 print:space-y-1">
                {rp.interviewTopics.map((topic, i) => (
                  <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-ece9f0/90 print:text-[11.5px] print:leading-snug">
                    <span>🔍</span>
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted print:text-zinc-600 font-semibold print:mb-1.5">
                Areas to validate
              </h3>
              {rp.redFlags.length === 0 ? (
                <p className="text-[15px] leading-relaxed text-ece9f0/90 print:text-[11.5px]">
                  ✅ No significant gaps identified
                </p>
              ) : (
                <ul className="space-y-2 print:space-y-1">
                  {rp.redFlags.map((flag, i) => (
                    <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-ece9f0/90 print:text-[11.5px] print:leading-snug">
                      <span>⚠️</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Section>
      )}

      {rp && rp.phoneScreenGuide && rp.phoneScreenGuide.length > 0 && (
        <Section index="10" title="15-Minute Technical Screen Guide">
          <p className="mb-6 max-w-2xl text-[13px] text-muted print:mb-2.5 print:text-[10.5px]">
            Calibrated technical screening questions for non-technical recruiters and hiring teams.
            Use these during initial candidate qualification to probe hands-on depth.
          </p>
          <div className="max-w-3xl space-y-4 print:space-y-2.5">
            {rp.phoneScreenGuide.map((item, i) => (
              <div
                key={i}
                className="rounded-lg border border-edge bg-surface/60 p-4 transition-colors hover:border-signal/30 print:p-2.5 print-card"
              >
                <div className="flex items-start gap-3 print:gap-2">
                  <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-signal/10 font-mono text-xs font-semibold text-signal print:text-amber-800 print:bg-amber-100">
                    Q{i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[15px] font-medium text-ece9f0 print:text-[12px] print:font-semibold">{item.question}</h4>
                    <div className="mt-3 grid gap-2.5 sm:grid-cols-2 print:mt-1.5 print:gap-2">
                      <div className="rounded border border-emerald-500/20 bg-emerald-950/20 p-3 print:p-2">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-400 print:text-[10px]">
                          <span>✓</span> What to listen for
                        </div>
                        <p className="mt-1 font-sans text-xs leading-relaxed text-zinc-300 print:text-[10px] print:leading-snug">
                          {item.whatToListenFor}
                        </p>
                      </div>
                      <div className="rounded border border-rose-500/20 bg-rose-950/20 p-3 print:p-2">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-rose-400 print:text-[10px]">
                          <span>⚠️</span> Red flag signal
                        </div>
                        <p className="mt-1 font-sans text-xs leading-relaxed text-zinc-300 print:text-[10px] print:leading-snug">
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

      {/* Executive Branded Print Footer (Visible ONLY when printed/saved as PDF) */}
      <div className="hidden border-t border-zinc-300 pt-3 mt-6 print:flex print:items-center print:justify-between font-mono text-[9px] text-zinc-500 print-avoid-break">
        <span>CONFIDENTIAL · Generated for Hiring Committee Evaluation</span>
        <span>DevScope Engineering Intelligence Dossier · @{profile.username}</span>
      </div>
    </article>
  );
}
