/**
 * Platform Admin Access Control (RBAC).
 *
 * Gating utility to ensure only authorized platform super-admins can view
 * or access internal consoles like `/admin/billing` and MFS payment verification.
 */

import { AuthUser } from './auth';

const HARDCODED_ADMIN_EMAILS = [
  'admin@gitgrill.com',
  'rabby.xponent@gmail.com',
  'alter_ego@gitgrill.com',
];

export function isAdmin(user: AuthUser | null | undefined): boolean {
  if (!user) return false;

  // 1. Check user email against whitelist
  const email = (user.email || '').trim().toLowerCase();
  if (email && HARDCODED_ADMIN_EMAILS.includes(email)) {
    return true;
  }

  // 2. Check dynamic env var if provided
  const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (email && envAdmins.includes(email)) {
    return true;
  }

  // 3. Check metadata role flags (Supabase app_metadata or user_metadata)
  const appRole = (user as any).app_metadata?.role;
  const userRole = (user as any).user_metadata?.role || (user as any).role;
  if (appRole === 'admin' || userRole === 'admin') {
    return true;
  }

  return false;
}
