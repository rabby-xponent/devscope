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

const LEVEL_WIDTH: Record<string, string> = {
  primary: 'w-full',
  secondary: 'w-2/3',
  occasional: 'w-1/3',
};

export function ProfileView({ profile }: { profile: DevProfile }) {
  const g = profile.github;

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
          <div className="flex items-center gap-2 font-mono text-xs text-muted">
            <span className="text-signal">@</span>
            {profile.username}
            {g.location && <span>· {g.location}</span>}
          </div>
          <h1 className="mt-1 text-2xl text-ece9f0">{g.name}</h1>
          <p className="mt-2 max-w-2xl text-lg leading-relaxed text-ece9f0/90">
            {profile.headline}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6 border-y border-edge py-6 sm:grid-cols-6">
        <Stat label="followers" value={g.followers.toLocaleString()} />
        <Stat label="repos" value={g.publicRepos} />
        <Stat label="total stars" value={g.totalStars.toLocaleString()} />
        <Stat label="total forks" value={g.totalForks.toLocaleString()} />
        <Stat label="since" value={g.joinedYear || '—'} />
        {g.company && <Stat label="org" value={g.company.replace('@', '')} />}
      </div>

      <Section index="01" title="Summary">
        <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-ece9f0/90">
          {profile.summary.split('\n').filter(Boolean).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </Section>

      <Section index="02" title="Expertise">
        <div className="max-w-2xl space-y-3">
          {profile.expertise.map((e, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-28 flex-none font-mono text-sm text-ece9f0">
                {e.language}
              </div>
              <div className="h-1.5 flex-1 rounded-full bg-edge">
                <div
                  className={`h-full rounded-full bg-signal ${LEVEL_WIDTH[e.level] || 'w-1/3'}`}
                />
              </div>
              <div className="hidden w-48 flex-none font-mono text-[11px] text-muted sm:block">
                {e.evidence}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section index="03" title="Tech evolution">
        <p className="max-w-3xl text-[15px] leading-relaxed text-ece9f0/90">
          {profile.techEvolution}
        </p>
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

      <Section index="05" title="Communication style">
        <p className="max-w-3xl text-[15px] leading-relaxed text-ece9f0/90">
          {profile.communicationStyle}
        </p>
      </Section>

      {(profile.webPresence.hackerNews ||
        profile.webPresence.blog ||
        profile.webPresence.other) && (
        <Section index="06" title="Web presence">
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
        </Section>
      )}

      <Section index="07" title="Strengths & growth">
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
    </article>
  );
}
