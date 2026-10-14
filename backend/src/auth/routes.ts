/**
 * Auth routes (M24B — MONETIZATION_BUILD_TRACKER.md).
 *
 * With Supabase configured, identity issuance lives in Supabase Auth (GitHub
 * OAuth + magic link) and these routes only sync a signed-in session into our
 * `users` / `workspaces` rows (idempotent, one account per human).
 *
 * Without Supabase, `POST /api/dev-auth` mints a real signed session token so
 * the entire authenticated surface can be exercised locally before the project
 * exists (DEV_AUTH_MODE=on). It refuses to run when Supabase IS configured.
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getAdmin, isDbConfigured } from '../db/supabase';
import { requireAuth } from './middleware';

const router = Router();

interface SessionUser {
  id: string;
  email: string | null;
  handle: string | null;
  name: string | null;
}

interface DevAuthBody {
  userId?: string;
  email?: string;
  handle?: string;
}

/**
 * Ensure users + workspaces + memberships rows exist for a session identity.
 * Idempotent: upsert on id, workspace lookup by owner. Returns the session user.
 */
export async function provisionIdentity(
  id: string,
  email: string | null,
  handle: string | null,
  name: string | null
): Promise<SessionUser | null> {
  const admin = getAdmin();
  if (!admin) return null;

  const { data: user, error } = await admin
    .from('users')
    .upsert(
      { id, email, github_handle: handle, name },
      { onConflict: 'id', ignoreDuplicates: false }
    )
    .select()
    .single();
  if (error) throw new Error(`user upsert failed: ${error.message}`);

  let workspaceId: string;
  const { data: existingWs } = await admin
    .from('workspaces')
    .select('id')
    .eq('owner_user_id', id)
    .eq('type', 'individual')
    .maybeSingle();
  if (existingWs?.id) {
    workspaceId = existingWs.id as string;
  } else {
    const { data: createdWs, error: wsError } = await admin
      .from('workspaces')
      .insert({ owner_user_id: id, type: 'individual', name: 'My Workspace' })
      .select('id')
      .single();
    if (wsError) throw new Error(`workspace create failed: ${wsError.message}`);
    workspaceId = createdWs.id as string;
    await admin.from('memberships').insert({ workspace_id: workspaceId, user_id: id, role: 'owner' });
  }

  return {
    id: user.id,
    email: user.email ?? email,
    handle: user.github_handle ?? handle,
    name: user.name ?? name,
  };
}

/** GET /api/auth/me — resolve the current session (null when anonymous). */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const auth = req.auth!;
  if (!isDbConfigured()) {
    // Dev-auth mode: token claims are the whole identity.
    res.json({ user: { id: auth.userId, email: auth.email, handle: auth.handle, name: null } });
    return;
  }
  const { data } = await getAdmin()!
    .from('users')
    .select('*')
    .eq('id', auth.userId)
    .maybeSingle();
  res.json({
    user: {
      id: auth.userId,
      email: data?.email ?? auth.email,
      handle: data?.github_handle ?? auth.handle,
      name: data?.name ?? null,
    },
  });
});

/**
 * POST /api/auth/sync — called right after Supabase sign-in on the frontend.
 * Body carries the signed-in identity; the token proves the session.
 */
router.post('/sync', requireAuth, async (req: Request, res: Response) => {
  if (!isDbConfigured()) {
    res.status(503).json({ error: 'Not available until Supabase is configured.' });
    return;
  }
  try {
    const auth = req.auth!;
    const body = req.body || {};
    const email = typeof body.email === 'string' && body.email ? body.email : auth.email;
    const handle =
      typeof body.handle === 'string' && body.handle
        ? body.handle.replace(/^@/, '')
        : auth.handle;
    const name = typeof body.name === 'string' && body.name ? body.name : null;
    const user = await provisionIdentity(auth.userId, email ?? null, handle ?? null, name);
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Identity sync failed.' });
  }
});

/** POST /api/dev-auth — local-only session minting (see file header). */
router.post('/dev-auth', (req: Request, res: Response) => {
  if (isDbConfigured()) {
    res
      .status(403)
      .json({ error: 'dev-auth is only available when Supabase is not configured.' });
    return;
  }
  if (process.env.DEV_AUTH_MODE !== 'on') {
    res.status(403).json({ error: 'DEV_AUTH_MODE is not enabled.' });
    return;
  }
  const body: DevAuthBody = req.body || {};
  const userId = (body.userId || '').trim() || 'dev-user-00000000';
  const email = (body.email || '').trim() || 'dev@localhost';
  const handle = (body.handle || '').trim().replace(/^@/, '') || null;
  const secret = process.env.SUPABASE_JWT_SECRET || 'devscope-dev-auth-secret-do-not-use-in-prod';
  const token = jwt.sign({ sub: userId, email, handle, role: 'authenticated' }, secret, {
    expiresIn: '7d',
  });
  res.json({ session: { access_token: token, token_type: 'bearer', expires_in: 7 * 24 * 3600 } });
});

export default router;
