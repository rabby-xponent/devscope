/**
 * Session & identity client (M24B — MONETIZATION_BUILD_TRACKER.md).
 *
 * Two backends, one interface:
 * - Supabase mode: when NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   are set, identity is real Supabase Auth (GitHub OAuth for developers, email
 *   magic link for recruiters). The access token is forwarded to OUR API
 *   (Authorization header; query param for EventSource) where the backend
 *   verifies the signature.
 * - Dev mode: when Supabase is not configured, sign-in falls through to
 *   POST /api/dev-auth (backend mints a real signed session token locally).
 *
 * `local` mode means signed-out: the local workspace keeps working exactly as
 * before — nothing gated by identity touches localStorage.
 */

import { API_URL } from './config';

export interface AuthUser {
  id: string;
  email: string | null;
  handle: string | null;
  name: string | null;
}

export type AuthBackend = 'supabase' | 'dev';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const DEV_TOKEN_KEY = 'devscope_dev_session_token_v1';

export function authBackend(): AuthBackend {
  return SUPABASE_URL && SUPABASE_ANON_KEY ? 'supabase' : 'dev';
}

// --- Supabase client (lazy, browser-only) -----------------------------------

let sbClient: import('@supabase/supabase-js').SupabaseClient | null = null;

async function supabase(): Promise<import('@supabase/supabase-js').SupabaseClient | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (typeof window === 'undefined') return null;
  if (!sbClient) {
    const { createClient } = await import('@supabase/supabase-js');
    sbClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { detectSessionInUrl: true, persistSession: true },
    });
  }
  return sbClient;
}

// --- Token plumbing -----------------------------------------------------------

export async function getAccessToken(): Promise<string | null> {
  const sb = await supabase();
  if (sb) {
    const { data } = await sb.auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  }
  if (typeof window !== 'undefined') {
    return localStorage.getItem(DEV_TOKEN_KEY);
  }
  return null;
}

function extractHandle(sbUser: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): { email: string | null; handle: string | null; name: string | null } {
  const meta = sbUser.user_metadata || {};
  const handle =
    (typeof meta.user_name === 'string' && meta.user_name) ||
    (typeof meta.preferred_username === 'string' && meta.preferred_username) ||
    null;
  return {
    email: sbUser.email ?? null,
    handle: handle ? handle.replace(/^@/, '') : null,
    name: (typeof meta.full_name === 'string' && meta.full_name) || null,
  };
}

// --- Session resolution -------------------------------------------------------

export async function getSessionUser(): Promise<AuthUser | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.user?.id) return null;
    return data.user as AuthUser;
  } catch {
    return null;
  }
}

// --- Sign-in / sign-out ---------------------------------------------------------

export async function signInWithGitHub(): Promise<void> {
  const sb = await supabase();
  if (!sb) throw new Error('Supabase is not configured on this deployment.');
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw new Error(error.message);
}

export async function signInWithMagicLink(email: string): Promise<void> {
  const sb = await supabase();
  if (!sb) throw new Error('Supabase is not configured on this deployment.');
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw new Error(error.message);
}

/** Dev-mode sign-in: backend mints a signed session token (local only). */
export async function devSignIn(email: string, handle: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/dev-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: `dev-${email.toLowerCase().trim()}`,
      email,
      handle,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Dev sign-in failed.');
  }
  const { session } = await res.json();
  localStorage.setItem(DEV_TOKEN_KEY, session.access_token);
  const user = await getSessionUser();
  if (!user) throw new Error('Dev session was minted but could not be resolved.');
  return user;
}

export async function signOutSession(): Promise<void> {
  const sb = await supabase();
  if (sb) {
    await sb.auth.signOut();
  } else if (typeof window !== 'undefined') {
    localStorage.removeItem(DEV_TOKEN_KEY);
  }
  notifyListeners();
}

// --- Change notification ----------------------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();

export function onSessionChange(listener: Listener): () => void {
  listeners.add(listener);
  // Supabase emits real auth events; dev mode is manual (devSignIn notifies).
  supabase().then((sb) => {
    if (sb) {
      const { data } = sb.auth.onAuthStateChange(() => notifyListeners());
      const off = () => data.subscription.unsubscribe();
      wrapped.add(off);
    }
  });
  return () => {
    listeners.delete(listener);
  };
}

const wrapped = new Set<() => void>();

function notifyListeners(): void {
  listeners.forEach((l) => l());
}

/** Auth header helper for fetch calls to our API. */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
