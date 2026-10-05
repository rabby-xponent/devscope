/**
 * Supabase data layer (M24B — MONETIZATION_BUILD_TRACKER.md).
 *
 * Single admin client (service role) for the Express backend. All user-facing
 * reads/writes go through OUR API with verified JWTs — the browser never talks
 * to Supabase directly with the service key, and RLS stays as the second wall
 * (red lines, MONETIZATION_ARCHITECTURE.md §4).
 *
 * Config is env-driven (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). When unset
 * the backend still boots — routes degrade to 503 and dev auth mode — so local
 * development and CI never require a provisioned project.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let adminClient: SupabaseClient | null = null;

/** Admin (service-role) client. Returns null when Supabase is not configured. */
export function getAdmin(): SupabaseClient | null {
  if (!supabaseUrl || !serviceRoleKey) return null;
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

/** True when the backend has the env it needs to touch Supabase. */
export function isDbConfigured(): boolean {
  return Boolean(supabaseUrl && serviceRoleKey);
}

// --- Row shapes (jsonb-first; mirrors the TS interfaces on the frontend) ---

export interface UserRow {
  id: string;
  email: string | null;
  github_handle: string | null;
  name: string | null;
  preferences: Record<string, unknown>;
  created_at?: string;
}

export interface WorkspaceRow {
  id: string;
  owner_user_id: string;
  type: 'individual' | 'team';
  name: string;
}

export interface MembershipRow {
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'member';
}

export interface TargetRoleRow {
  id: string;
  user_id: string;
  data: Record<string, unknown>;
  updated_at?: string;
}

export interface DefenseCardRow {
  id: string;
  user_id: string;
  data: Record<string, unknown>;
  updated_at?: string;
}

export interface WorkspaceItemRow {
  id: string;
  workspace_id: string;
  data: Record<string, unknown>;
  updated_at?: string;
}
