import { Router, Request, Response } from 'express';
import { DevProfile } from '../types/profile';
import { readProof, writeProof, listProofs, deleteProof } from './proof-store';
import { can, tierForSession } from '../config/tiers';

/**
 * Proof Page routes.
 *
 * Public reads are unauthenticated by design (the page is meant to be shared
 * with recruiters); publishing is a deliberate, explicit act from the
 * developer's own profile view. Publishing stores the full audit — the same
 * content the developer already vetted — because the evidence is the product
 * (ideation §2.3, §4.1).
 */
const router = Router();

const VALID = /^[a-zA-Z0-9_-]+$/;

/**
 * Unpublish — removes public access to a snapshot.
 * NOTE: PUT/DELETE share the same trust model today (demo, no auth); both become
 * owner-authenticated in M24B. Until then this matches PUT's exposure exactly.
 */
router.delete('/:username/:roleId', async (req: Request, res: Response) => {
  const username = String(req.params.username || '');
  const roleId = String(req.params.roleId || '');
  if (!VALID.test(username) || !VALID.test(roleId)) {
    res.status(400).json({ error: 'Invalid proof id' });
    return;
  }
  try {
    const removed = await deleteProof(username, roleId);
    if (!removed) {
      res.status(404).json({ error: 'Proof page not found' });
      return;
    }
    res.json({ ok: true, unpublished: `${username}/${roleId}` });
  } catch {
    res.status(500).json({ error: 'Failed to unpublish proof page' });
  }
});

/** List published proofs for a username (CareerOS uses this to flag live links). */
router.get('/by/:username', async (req: Request, res: Response) => {
  const username = String(req.params.username || '');
  if (!VALID.test(username)) {
    res.status(400).json({ error: 'Invalid username' });
    return;
  }
  try {
    res.json({ proofs: await listProofs(username) });
  } catch {
    res.json({ proofs: [] });
  }
});

/** Public: the recruiter-facing artifact. */
router.get('/:username/:roleId', async (req: Request, res: Response) => {
  const username = String(req.params.username || '');
  const roleId = String(req.params.roleId || '');
  if (!VALID.test(username) || !VALID.test(roleId)) {
    res.status(400).json({ error: 'Invalid proof id' });
    return;
  }
  const snap = await readProof(username, roleId);
  if (!snap) {
    res.status(404).json({ error: 'Proof page not found' });
    return;
  }
  res.json({ proof: snap });
});

/**
 * Publish / re-publish a snapshot (called from the developer's profile view).
 *
 * Enforces `proof.publish` from the tier registry (M25A): Free keeps 1 active
 * page and every page it creates is branded; Pro is unlimited and unbranded.
 * Re-publishing an existing page is always allowed — it edits a page you already
 * own rather than creating a new one — and pages already published are never
 * hidden or revoked by hitting the limit (§6 dark-pattern rule).
 *
 * Known v1 gap: pages are keyed by GitHub handle, so the count is enforced per
 * handle rather than per account. Handle ownership verification is §10 follow-up
 * work (free-tier OAuth handle claim).
 */
router.put('/:username/:roleId', async (req: Request, res: Response) => {
  const username = String(req.params.username || '');
  const roleId = String(req.params.roleId || '');
  if (!VALID.test(username) || !VALID.test(roleId)) {
    res.status(400).json({ error: 'Invalid username or roleId' });
    return;
  }

  const body = req.body || {};
  const profile = body.profile as DevProfile | undefined;
  const roleTitle = String(body.roleTitle || '').trim();
  const note = body.note ? String(body.note).slice(0, 600) : undefined;

  if (!profile || profile.username?.toLowerCase() !== username.toLowerCase()) {
    res.status(400).json({ error: 'Profile payload missing or username mismatch' });
    return;
  }

  try {
    const tier = tierForSession(Boolean(req.auth));
    const entitlement = can(tier, 'proof.publish');
    const existing = await readProof(username, roleId);

    if (!existing) {
      const activeCount = (await listProofs(username)).length;
      const verdict = can(tier, 'proof.publish', { used: activeCount });
      if (!verdict.allowed) {
        res.status(402).json({
          error: 'proof_limit',
          capability: 'proof.publish',
          limit: verdict.limit,
          remaining: verdict.remaining ?? 0,
          reason: verdict.reason,
          upgradeTo: verdict.upgradeTo,
        });
        return;
      }
    }

    const snap = await writeProof({
      username,
      roleId,
      roleTitle: roleTitle || profile.requisitionFit?.roleTitle || 'Target Role',
      note,
      profile,
      branded: entitlement.branded,
    });
    res.json({
      ok: true,
      version: snap.version,
      publishedAt: snap.publishedAt,
      updatedAt: snap.updatedAt,
      branded: entitlement.branded,
      url: `/proof/${username}/${roleId}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to publish proof' });
  }
});

export default router;
