'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { publishProofPage, listPublishedProofs } from '@/lib/proof-pages';
import { getTargetRoleById, saveTargetRole } from '@/lib/target-roles';
import { useCapabilityLock } from '@/components/FeatureLock';
import { useEntitlements } from '@/hooks/useEntitlements';
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

  // `proof.publish` (1 active page on Free, unlimited on Pro — M25A). The count
  // is the server's published-page list for this handle; re-publishing a page
  // you already own is always allowed, so only a *new* page is gated.
  const { entitlements } = useEntitlements();
  const [proofCount, setProofCount] = useState(0);
  const proofLock = useCapabilityLock(entitlements, 'proof.publish', proofCount);
  const publishLocked = proofLock.locked && !published;

  useEffect(() => {
    setMounted(true);
    if (targetRoleId) {
      const role = getTargetRoleById(targetRoleId);
      if (role?.proofUrl) setPublished({ version: role.proofVersion || 1 });
    }
  }, [targetRoleId]);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    listPublishedProofs(username)
      .then((list) => !cancelled && setProofCount(list.length))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [username, published?.version]);

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
      // The server is the enforcement point; if it says quota, show the same
      // modal the chip would have opened.
      if (err?.code === 'proof_limit') proofLock.onRequest();
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
    <div className="fade-up mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-signal/30 bg-card bg-gradient-to-r from-signal/[0.08] to-signal/[0.02] p-4 sm:px-5 shadow-card print:hidden">
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs leading-relaxed text-muted">
        <span className="inline-flex items-center gap-1.5 font-bold text-signal">
          <Icon.Link className="h-3.5 w-3.5" />
          <span>{published ? `Proof page live · v${published.version}` : 'Audit complete'}</span>
        </span>
        <span className="text-edge font-normal">|</span>
        <span className="text-content/85 font-sans text-xs">
          {published
            ? 'Share a recruiter-legible evidence page with your application. Re-publish after shipping new evidence to bump the version.'
            : 'Publish a public, recruiter-legible evidence page from this audit. Nothing is shared until you do.'}
        </span>
      </div>

      <div className="flex flex-none items-center gap-2">
        {error && <span className="font-mono text-[11px] text-red-500">{error}</span>}
        {published && (
          <>
            <a
              href={`/proof/${username}/${targetRoleId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-card px-3 py-2 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:border-signal/50 hover:text-signal shadow-xs"
            >
              <Icon.ArrowUpRight className="h-3 w-3" />
              <span>view</span>
            </a>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-card px-3 py-2 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:border-signal/50 hover:text-signal shadow-xs"
            >
              {copied ? <Icon.Check className="h-3 w-3 text-emerald-500" /> : <Icon.Link className="h-3 w-3" />}
              <span>{copied ? 'copied' : 'copy link'}</span>
            </button>
          </>
        )}
        <button
          onClick={() => (publishLocked ? proofLock.onRequest() : void publish())}
          disabled={publishing}
          title={publishLocked ? proofLock.verdict.reason || undefined : undefined}
          className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-signal/90 active:scale-95 disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
        >
          {publishLocked ? <Icon.Lock className="h-3.5 w-3.5" /> : <Icon.ArrowUpRight className="h-3.5 w-3.5" />}
          <span>{publishing ? 'Publishing…' : published ? 'Re-publish' : 'Publish Proof Page'}</span>
        </button>
        {publishLocked && proofLock.lock}
      </div>
    </div>
  );
}
