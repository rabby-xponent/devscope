'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { listPublishedProofs, ProofMeta } from '@/lib/proof-pages';
import type { TargetRole } from '@/lib/target-roles';

/**
 * Proof Pages summary card (CareerOS dashboard).
 *
 * Surfaces every published proof snapshot for the developer's handle —
 * including snapshots whose target role has since been deleted (they stay
 * live server-side, so shared links keep working). Rows merge server truth
 * with local role data for status context; view opens the public page,
 * copy grabs the shareable URL.
 */
export function ProofPagesCard({ username, roles }: { username: string; roles: TargetRole[] }) {
  const [proofs, setProofs] = useState<ProofMeta[] | null>(null);
  const [copiedId, setCopiedId] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!username) {
      setProofs([]);
      return;
    }
    listPublishedProofs(username)
      .then((list) => !cancelled && setProofs(list))
      .catch(() => !cancelled && setProofs([]));
    return () => {
      cancelled = true;
    };
  }, [username]);

  const copy = async (roleId: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/proof/${username}/${roleId}`);
      setCopiedId(roleId);
      setTimeout(() => setCopiedId(''), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="rounded-2xl border border-edge bg-card p-6 shadow-card">
      <div className="flex items-center justify-between border-b border-edge pb-3">
        <h2 className="font-mono text-base font-bold text-content">Proof Pages</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          public · shareable
        </span>
      </div>

      {!username ? (
        <p className="pt-4 text-[13px] leading-relaxed text-muted">
          Set your GitHub username above to publish and manage recruiter-legible proof pages.
        </p>
      ) : proofs === null ? (
        <div className="flex items-center gap-2 pt-4 font-mono text-[11px] uppercase tracking-wider text-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
          checking published pages…
        </div>
      ) : proofs.length === 0 ? (
        <p className="pt-4 text-[13px] leading-relaxed text-muted">
          Nothing published yet. Run a pre-flight, then click{' '}
          <span className="font-medium text-content">“publish proof page”</span> on the completed
          audit to create a recruiter-legible evidence link.
        </p>
      ) : (
        <ul className="divide-y divide-edge">
          {proofs.map((p) => {
            const role = roles.find((r) => r.id === p.roleId);
            return (
              <li key={p.roleId} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-content">
                    {p.roleTitle}
                    {role ? (
                      <span className="ml-2 rounded border border-signal/30 bg-signal/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-signal">
                        {role.status}
                      </span>
                    ) : (
                      <span
                        className="ml-2 rounded border border-edge bg-well px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted"
                        title="The target role was deleted, but the published page stays live"
                      >
                        role removed
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted">
                    /proof/{username}/{p.roleId.slice(0, 14)} · v{p.version} · updated{' '}
                    {new Date(p.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-1.5">
                  <a
                    href={`/proof/${username}/${p.roleId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-lg border border-edge bg-card text-muted transition-colors hover:border-signal/50 hover:text-signal"
                    title="View public proof page"
                  >
                    <Icon.ArrowUpRight className="h-3 w-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => copy(p.roleId)}
                    className="flex h-[26px] items-center gap-1 rounded-lg border border-edge bg-card px-2 font-mono text-[10px] uppercase tracking-wider text-muted transition-colors hover:border-signal/50 hover:text-signal"
                    title="Copy public link"
                  >
                    {copiedId === p.roleId ? (
                      <Icon.Check className="h-3 w-3 text-signal" />
                    ) : (
                      <Icon.Link className="h-3 w-3" />
                    )}
                    {copiedId === p.roleId ? 'copied' : 'copy'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
