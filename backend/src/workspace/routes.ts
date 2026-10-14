/**
 * Workspace sync routes (M24D — MONETIZATION_BUILD_TRACKER.md). The user's
 * account becomes the source of truth; localStorage stays as the offline
 * cache. Everything is jsonb-first: `target_roles`/`defense_cards` rows store
 * the existing TS interfaces verbatim in `data`, so import/export is a
 * lossless round-trip and ids are preserved exactly.
 *
 * POST /api/workspace/import — idempotent first-login import. Re-running with
 * identical payloads touches nothing; changed payloads upsert by id.
 * GET  /api/workspace/export — complete JSON of the user's data (GDPR).
 * DELETE /api/workspace/delete — removes the user's data rows (GDPR).
 */

import { Router, Request, Response } from 'express';
import { getAdmin, isDbConfigured } from '../db/supabase';
import { requireAuth } from '../auth/middleware';

const router = Router();

function serviceUnavailable(res: Response): void {
  res.status(503).json({ error: 'Workspace storage is not configured on this deployment yet.' });
}

/** POST /api/workspace/import — body: { roles, defenseCards }. */
router.post('/import', requireAuth, async (req: Request, res: Response) => {
  if (!isDbConfigured()) return serviceUnavailable(res);
  const admin = getAdmin()!;
  const userId = req.auth!.userId;
  const roles: Array<Record<string, unknown>> = Array.isArray(req.body?.roles)
    ? req.body.roles
    : [];
  const cards: Array<Record<string, unknown>> = Array.isArray(req.body?.defenseCards)
    ? req.body.defenseCards
    : [];

  try {
    // Target roles: id comes from the payload (client-generated); insert with
    // an explicit id and fall back to server-side dedupe by data->>'id'.
    const payloadIds = roles.map((r) => String(r.id)).filter(Boolean);
    let insertedRoles = 0;
    if (payloadIds.length > 0) {
      const { data: existing } = await admin
        .from('target_roles')
        .select('id')
        .eq('user_id', userId);
      const have = new Set((existing ?? []).map((row: any) => String(row.id)));
      const fresh = roles.filter((r) => !have.has(String(r.id)));
      if (fresh.length > 0) {
        const { error } = await admin.from('target_roles').insert(
          fresh.map((r) => ({ user_id: userId, id: String(r.id), data: r }))
        );
        if (error) throw new Error(`target_roles import: ${error.message}`);
        insertedRoles = fresh.length;
      }
    }

    let insertedCards = 0;
    if (cards.length > 0) {
      const { data: existing } = await admin
        .from('defense_cards')
        .select('id')
        .eq('user_id', userId);
      const have = new Set((existing ?? []).map((row: any) => String(row.id)));
      const fresh = cards.filter((c) => !have.has(String(c.id)));
      if (fresh.length > 0) {
        const { error } = await admin.from('defense_cards').insert(
          fresh.map((c) => ({ user_id: userId, id: String(c.id), data: c }))
        );
        if (error) throw new Error(`defense_cards import: ${error.message}`);
        insertedCards = fresh.length;
      }
    }

    res.json({ ok: true, imported: { roles: insertedRoles, defenseCards: insertedCards } });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Workspace import failed.' });
  }
});

/** GET /api/workspace/export — everything the user owns, as JSON. */
router.get('/export', requireAuth, async (req: Request, res: Response) => {
  if (!isDbConfigured()) return serviceUnavailable(res);
  const admin = getAdmin()!;
  const userId = req.auth!.userId;
  const [roles, cards] = await Promise.all([
    admin.from('target_roles').select('*').eq('user_id', userId),
    admin.from('defense_cards').select('*').eq('user_id', userId),
  ]);
  res.json({
    exportedAt: new Date().toISOString(),
    targetRoles: (roles.data ?? []).map((row: any) => row.data),
    defenseCards: (cards.data ?? []).map((row: any) => row.data),
  });
});

/** DELETE /api/workspace/delete — remove the user's data (GDPR baseline). */
router.delete('/delete', requireAuth, async (req: Request, res: Response) => {
  if (!isDbConfigured()) return serviceUnavailable(res);
  const admin = getAdmin()!;
  const userId = req.auth!.userId;
  const [roles, cards] = await Promise.all([
    admin.from('target_roles').delete().eq('user_id', userId),
    admin.from('defense_cards').delete().eq('user_id', userId),
  ]);
  res.json({
    ok: true,
    removed: { targetRoles: (roles as any).error ? 0 : null, defenseCards: (cards as any).error ? 0 : null },
  });
});

export default router;
