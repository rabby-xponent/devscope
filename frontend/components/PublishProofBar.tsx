'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { publishProofPage } from '@/lib/proof-pages';
import { getTargetRoleById, saveTargetRole } from '@/lib/target-roles';
import type { DevProfile } from '@/types/profile';

/**
 * Publish seam for the Proof Page (CareerOS — ideation §2.3).
 *
 * Sits between a completed audit and the world: one explicit click snapshots
 * the vetted profile server-side and returns the public, recruiter-legible
 * URL. Publishing is always opt-in — an audit is private until the developer
 * chooses to share it.
 */
export function PublishProofBar({
  username,
  targetRoleId,
  profile,
}: {
  username: string;
  targetRoleId?: string;
  profile: DevProfile;
}) {
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  // localStorage reads must wait for mount to avoid an SSR hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [published, setPublished] = useState<{ version: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    if (targetRoleId) {
      const role = getTargetRoleById(targetRoleId);
      if (role?.proofUrl) setPublished({ version: role.proofVersion || 1 });
    }
  }, [targetRoleId]);

  if (!mounted || !targetRoleId) return null; // Proof Pages are a CareerOS (target-role) feature

  const publish = async () => {
    const role = getTargetRoleById(targetRoleId);
    if (!role) return;
    setPublishing(true);
    setError('');
    try {
      const result = await publishProofPage({
        username,
        roleId: targetRoleId,
        roleTitle: role.title,
        profile,
      });
      const updated = saveTargetRole({
        ...role,
        proofUrl: result.url,
        proofVersion: result.version,
      });
      setPublished({ version: updated.proofVersion || result.version });
    } catch (err: any) {
      setError(err?.message || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const copyLink = async () => {
    const role = getTargetRoleById(targetRoleId);
    const path = role?.proofUrl || `/proof/${username}/${targetRoleId}`;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="fade-up mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-signal/30 bg-signal/[0.06] px-4 py-3 print:hidden">
      <p className="font-mono text-[11px] leading-relaxed text-muted">
        <span className="inline-flex items-center gap-1 text-signal">
          <Icon.Link className="h-3 w-3" />
          {published ? `proof page live · v${published.version}` : 'audit complete —'}{' '}
        </span>
        {published ? (
          <span>
            share a recruiter-legible evidence page with your application. Re-publish after
            shipping new evidence to bump the version.
          </span>
        ) : (
          <span>
            publish a public, recruiter-legible evidence page from this audit. Nothing is shared
            until you do.
          </span>
        )}
      </p>
      <div className="flex flex-none items-center gap-2">
        {error && <span className="font-mono text-[11px] text-red-500">{error}</span>}
        {published && (
          <>
            <a
              href={`/proof/${username}/${targetRoleId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-card px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:border-signal/50 hover:text-signal"
            >
              <Icon.ArrowUpRight className="h-3 w-3" />
              view
            </a>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-card px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:border-signal/50 hover:text-signal"
            >
              {copied ? <Icon.Check className="h-3 w-3" /> : <Icon.Link className="h-3 w-3" />}
              {copied ? 'copied' : 'copy link'}
            </button>
          </>
        )}
        <button
          onClick={publish}
          disabled={publishing}
          className="inline-flex items-center gap-1.5 rounded-md bg-signal px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0c0b0e] shadow-xs transition-all hover:bg-signal/90 active:scale-95 disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
        >
          <Icon.ArrowUpRight className="h-3 w-3" />
          {publishing ? 'publishing…' : published ? 're-publish' : 'publish proof page'}
        </button>
      </div>
    </div>
  );
}
