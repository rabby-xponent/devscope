import { Router, Request, Response } from 'express';
import { DevProfile } from '../types/profile';
import { readProof, writeProof, listProofs } from './proof-store';

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

/** Publish / re-publish a snapshot (called from the developer's profile view). */
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
    const snap = await writeProof({
      username,
      roleId,
      roleTitle: roleTitle || profile.requisitionFit?.roleTitle || 'Target Role',
      note,
      profile,
    });
    res.json({
      ok: true,
      version: snap.version,
      publishedAt: snap.publishedAt,
      updatedAt: snap.updatedAt,
      url: `/proof/${username}/${roleId}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to publish proof' });
  }
});

export default router;
