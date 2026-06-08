'use client';

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
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-edge py-8">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="font-mono text-xs text-signal">{index}</span>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
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
  const g = profile.github;
  const rp = profile.recruiterPanel;

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
      <header className="flex flex-col gap-6 pb-8 sm:flex-row sm:items-start">
        {g.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={g.avatarUrl}
            alt={g.name}
            className="h-20 w-20 flex-none rounded-lg border border-edge"
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
          <h1 className="mt-1 text-2xl text-ece9f0">{g.name}</h1>
          <p className="mt-2 max-w-2xl text-lg leading-relaxed text-ece9f0/90">
            {profile.headline}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6 border-y border-edge py-6 sm:grid-cols-5">
        <Stat label="followers" value={g.followers.toLocaleString()} />
        <Stat label="repos" value={g.publicRepos} />
        <Stat label="total stars" value={g.totalStars.toLocaleString()} />
        <Stat label="total forks" value={g.totalForks.toLocaleString()} />
        <Stat label="since" value={g.joinedYear || '—'} />
      </div>

      {rp && (
        <div className="mt-6 rounded-lg border border-edge bg-surface/50 p-4">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted">
            Recruiter quick panel
          </div>
          <div className="flex flex-wrap gap-2">
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
            <p className="mt-3 font-mono text-[11px] text-muted">{rp.seniorityReason}</p>
          )}
        </div>
      )}

      {rp && rp.standoutFacts.length > 0 && (
        <section className="border-t border-edge py-8">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-signal">
            Key facts for recruiters
          </h2>
          <ul className="max-w-3xl space-y-2">
            {rp.standoutFacts.map((fact, i) => (
              <li
                key={i}
                className="flex gap-3 text-[15px] font-medium leading-relaxed text-ece9f0/95"
              >
                <span className="flex-none text-signal">✦</span>
                {fact}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Section index="01" title="Expertise">
        <div className="max-w-2xl space-y-3">
          {profile.expertise.map((e, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-32 flex-none font-mono text-sm text-ece9f0">
                {e.language}
                {typeof e.percentage === 'number' && (
                  <span className="ml-1 text-muted">{e.percentage}%</span>
                )}
              </div>
              <div className="h-1.5 flex-1 rounded-full bg-edge">
                <div
                  className="h-full rounded-full bg-signal transition-all"
                  style={{ width: expertiseBarWidth(e.level, e.percentage) }}
                />
              </div>
              <div className="hidden w-48 flex-none font-mono text-[11px] text-muted sm:block">
                {e.evidence}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {rp && (
        <Section index="02" title="Commit intelligence">
          <div className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-edge bg-surface/40 p-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Quality
              </div>
              <div
                className={`mt-1 inline-block rounded-full border px-2 py-0.5 font-mono text-[11px] capitalize ${QUALITY_STYLES[rp.commitQuality] || ''}`}
              >
                {rp.commitQuality}
              </div>
            </div>
            <div className="rounded-lg border border-edge bg-surface/40 p-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Consistency
              </div>
              <div
                className={`mt-1 inline-block rounded-full border px-2 py-0.5 font-mono text-[11px] capitalize ${CONSISTENCY_STYLES[rp.consistencyPattern] || ''}`}
              >
                {rp.consistencyPattern}
              </div>
            </div>
            <div className="rounded-lg border border-edge bg-surface/40 p-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Collaboration
              </div>
              <div
                className={`mt-1 inline-block rounded-full border px-2 py-0.5 font-mono text-[11px] capitalize ${COLLAB_STYLES[rp.collaborationLevel] || ''}`}
              >
                {rp.collaborationLevel}
              </div>
            </div>
            <div className="rounded-lg border border-edge bg-surface/40 p-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Last active
              </div>
              <div className="mt-1 font-mono text-sm text-ece9f0">
                {rp.daysSinceLastCommit}d ago
              </div>
            </div>
          </div>
          {rp.commitStyleInsight && (
            <p className="mt-4 max-w-3xl text-[15px] italic leading-relaxed text-ece9f0/80">
              💬 {rp.commitStyleInsight}
            </p>
          )}
        </Section>
      )}

      <Section index="03" title="Summary">
        <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-ece9f0/90">
          {profile.summary.split('\n').filter(Boolean).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </Section>

      <Section index="04" title="Open source impact">
        <p className="mb-6 max-w-3xl text-[15px] leading-relaxed text-ece9f0/90">
          {profile.openSourceImpact.narrative}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {profile.openSourceImpact.topRepos.map((r, i) => (
            <a
              key={i}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="group rounded-lg border border-edge bg-surface/40 p-4 transition-colors hover:border-signal/50"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-ece9f0 group-hover:text-signal">
                  {r.name}
                </span>
                <span className="font-mono text-xs text-muted">★ {r.stars.toLocaleString()}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ece9f0/80">{r.description}</p>
              <p className="mt-2 font-mono text-[11px] text-muted">{r.why}</p>
            </a>
          ))}
        </div>
      </Section>

      <Section index="05" title="Tech evolution">
        <p className="max-w-3xl text-[15px] leading-relaxed text-ece9f0/90">
          {profile.techEvolution}
        </p>
      </Section>

      <Section index="06" title="Communication style">
        <p className="max-w-3xl text-[15px] leading-relaxed text-ece9f0/90">
          {profile.communicationStyle}
        </p>
      </Section>

      {(profile.webPresence.hackerNews ||
        profile.webPresence.hackerNewsMentions ||
        profile.webPresence.blog ||
        profile.webPresence.other) && (
        <Section index="07" title="Web presence">
          <div className="flex flex-wrap gap-3">
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
            <div className="max-w-3xl space-y-3 text-[15px] leading-relaxed text-ece9f0/90">
              {profile.webPresence.hackerNews && (
                <p>
                  <span className="font-mono text-xs text-signal">HN </span>
                  {profile.webPresence.hackerNews}
                </p>
              )}
              {profile.webPresence.blog && (
                <p>
                  <span className="font-mono text-xs text-signal">BLOG </span>
                  {profile.webPresence.blog}
                </p>
              )}
              {profile.webPresence.other && (
                <p>
                  <span className="font-mono text-xs text-signal">WEB </span>
                  {profile.webPresence.other}
                </p>
              )}
            </div>
          )}
          {hnMentionCount && !hnUrl && (
            <p className="mt-3 font-mono text-xs text-muted">
              {hnMentionCount} HN mentions
            </p>
          )}
        </Section>
      )}

      <Section index="08" title="Strengths & growth">
        <div className="grid max-w-3xl gap-8 sm:grid-cols-2">
          <div>
            <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-signal">
              Strengths
            </h3>
            <ul className="space-y-2">
              {profile.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-ece9f0/90">
                  <span className="text-signal">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted">
              Growth areas
            </h3>
            <ul className="space-y-2">
              {profile.growthAreas.map((s, i) => (
                <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-ece9f0/90">
                  <span className="text-muted">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {rp && (
        <Section index="09" title="Interview prep">
          <div className="grid max-w-3xl gap-8 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-signal">
                Topics to explore
              </h3>
              <ul className="space-y-2">
                {rp.interviewTopics.map((topic, i) => (
                  <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-ece9f0/90">
                    <span>🔍</span>
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted">
                Areas to validate
              </h3>
              {rp.redFlags.length === 0 ? (
                <p className="text-[15px] leading-relaxed text-ece9f0/90">
                  ✅ No significant gaps identified
                </p>
              ) : (
                <ul className="space-y-2">
                  {rp.redFlags.map((flag, i) => (
                    <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-ece9f0/90">
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
    </article>
  );
}
