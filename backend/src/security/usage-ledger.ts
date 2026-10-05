/**
 * Usage ledger (M24C — MONETIZATION_BUILD_TRACKER.md). The meter: every fresh
 * audit is recorded and attributable; enforcement is an atomic
 * check-and-reserve that happens BEFORE agent work starts.
 *
 * Two modes:
 * - Supabased (`user_counters` + `usage_events`): the reserve is a
 *   compare-and-set update — `update ... where audit_count = <read> and
 *   window_started_at = <read>` — retried on conflict. A row lock is held for
 *   the duration of the UPDATE, so two concurrent SSE starts can never both
 *   spend the last free slot (the race called out in architecture §5).
 * - Ledger-only fallback (no Supabase): events live in memory with the same
 *   reserve API (single-threaded event loop => atomic between awaits), so the
 *   meter is verifiable locally and M24D swaps storage without touching the
 *   chokepoint.
 *
 * Free tier (architecture §11, decisions 9-12): 3 audits / rolling 30 days.
 * Anonymous demo runs are metered separately by the demo gate (M24A).
 */

import { Router, Request, Response } from 'express';
import { getAdmin, isDbConfigured } from '../db/supabase';
import { requireAuth } from '../auth/middleware';

export const FREE_AUDIT_LIMIT = 3;
const ROLLING_WINDOW_MS = 30 * 24 * 3600 * 1000;

export interface ReserveVerdict {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  /** ISO time when the oldest counted audit leaves the rolling window. */
  resetAt: string | null;
}

interface CounterRow {
  user_id: string;
  window_started_at: string;
  audit_count: number;
}

// --- In-memory fallback store ---------------------------------------------

interface MemEvent {
  userId: string;
  target: string;
  createdAt: number;
}

const memEvents: MemEvent[] = [];

function memInWindow(userId: string, now: number): MemEvent[] {
  return memEvents.filter(
    (e) => e.userId === userId && now - e.createdAt < ROLLING_WINDOW_MS
  );
}

function memReserve(userId: string, target: string): ReserveVerdict {
  const now = Date.now();
  const inWindow = memInWindow(userId, now);
  if (inWindow.length >= FREE_AUDIT_LIMIT) {
    const oldest = Math.min(...inWindow.map((e) => e.createdAt));
    return {
      allowed: false,
      used: inWindow.length,
      limit: FREE_AUDIT_LIMIT,
      remaining: 0,
      resetAt: new Date(oldest + ROLLING_WINDOW_MS).toISOString(),
    };
  }
  memEvents.push({ userId, target, createdAt: now });
  return {
    allowed: true,
    used: inWindow.length + 1,
    limit: FREE_AUDIT_LIMIT,
    remaining: FREE_AUDIT_LIMIT - (inWindow.length + 1),
    resetAt: null,
  };
}

function memUsage(userId: string): ReserveVerdict {
  const inWindow = memInWindow(userId, Date.now());
  return {
    allowed: inWindow.length < FREE_AUDIT_LIMIT,
    used: inWindow.length,
    limit: FREE_AUDIT_LIMIT,
    remaining: Math.max(0, FREE_AUDIT_LIMIT - inWindow.length),
    resetAt: null,
  };
}

// --- Supabase mode ----------------------------------------------------------

/**
 * Compare-and-set reserve. Reads the counter row, then conditionally updates
 * it only if nothing changed underneath; retries a few times on contention.
 * The conditional UPDATE takes the row lock, making the reserve atomic.
 */
async function dbReserve(userId: string, target: string): Promise<ReserveVerdict> {
  const admin = getAdmin()!;
  const nowIso = new Date().toISOString();
  const windowCutoffIso = new Date(Date.now() - ROLLING_WINDOW_MS).toISOString();

  for (let attempt = 0; attempt < 4; attempt++) {
    const { data } = await admin
      .from('user_counters')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    const row = (data as CounterRow | null) ?? null;

    if (row) {
      const started = new Date(row.window_started_at).getTime();
      const windowActive = Date.now() - started < ROLLING_WINDOW_MS;
      const used = windowActive ? row.audit_count : 0;
      const resetAt = windowActive
        ? new Date(started + ROLLING_WINDOW_MS).toISOString()
        : null;

      if (used >= FREE_AUDIT_LIMIT) {
        return { allowed: false, used, limit: FREE_AUDIT_LIMIT, remaining: 0, resetAt };
      }

      // CAS: only writes if the row is exactly what we read (and the window
      // state matches what we based our decision on).
      const { data: updated, error } = await admin
        .from('user_counters')
        .update({
          audit_count: used + 1,
          window_started_at: windowActive ? row.window_started_at : nowIso,
        })
        .eq('user_id', userId)
        .eq('audit_count', row.audit_count)
        .eq('window_started_at', row.window_started_at)
        .select();
      if (error) throw new Error(`counter reserve failed: ${error.message}`);
      if (updated && updated.length === 1) {
        return {
          allowed: true,
          used: used + 1,
          limit: FREE_AUDIT_LIMIT,
          remaining: FREE_AUDIT_LIMIT - (used + 1),
          resetAt,
        };
      }
      continue; // raced — re-read and retry
    }

    // No row yet: claim the first slot with an insert; a conflict means a
    // concurrent request created it, so loop and take the CAS path.
    const { data: inserted, error } = await admin
      .from('user_counters')
      .insert({ user_id: userId, audit_count: 1, window_started_at: nowIso })
      .select();
    if (error && error.code !== '23505') {
      throw new Error(`counter reserve failed: ${error.message}`);
    }
    if (inserted && inserted.length === 1) {
      return {
        allowed: true,
        used: 1,
        limit: FREE_AUDIT_LIMIT,
        remaining: FREE_AUDIT_LIMIT - 1,
        resetAt: null,
      };
    }
  }
  throw new Error('usage reserve: contention unresolved after retries');
}

async function dbRecordEvent(userId: string, target: string): Promise<void> {
  const admin = getAdmin()!;
  const { error } = await admin.from('usage_events').insert({
    user_id: userId,
    kind: 'audit',
    target,
    cache_hit: false,
    cost_est_cents: null,
  });
  // The event row is bookkeeping; a failure must not roll back the reserve.
  if (error) console.error('[usage-ledger] event write failed:', error.message);
}

async function dbUsage(userId: string): Promise<ReserveVerdict> {
  const admin = getAdmin()!;
  const { data } = await admin
    .from('user_counters')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  const row = (data as CounterRow | null) ?? null;
  if (!row) {
    return { allowed: true, used: 0, limit: FREE_AUDIT_LIMIT, remaining: FREE_AUDIT_LIMIT, resetAt: null };
  }
  const started = new Date(row.window_started_at).getTime();
  const windowActive = Date.now() - started < ROLLING_WINDOW_MS;
  const used = windowActive ? row.audit_count : 0;
  return {
    allowed: used < FREE_AUDIT_LIMIT,
    used,
    limit: FREE_AUDIT_LIMIT,
    remaining: Math.max(0, FREE_AUDIT_LIMIT - used),
    resetAt: windowActive ? new Date(started + ROLLING_WINDOW_MS).toISOString() : null,
  };
}

// --- Public API --------------------------------------------------------------

export function ledgerConfigured(): boolean {
  return isDbConfigured();
}

/** Atomic check-and-reserve for one fresh audit. Call BEFORE agent work. */
export async function reserveAudit(userId: string, target: string): Promise<ReserveVerdict> {
  if (isDbConfigured()) {
    const verdict = await dbReserve(userId, target);
    if (verdict.allowed) await dbRecordEvent(userId, target);
    return verdict;
  }
  return memReserve(userId, target);
}

/** Read-only view of remaining quota (never reserves). */
export async function getUsage(userId: string): Promise<ReserveVerdict> {
  if (isDbConfigured()) return dbUsage(userId);
  return memUsage(userId);
}

/**
 * Anonymous demo runs are also ledger-backed (M24C criterion: survives cookie
 * deletion via IP rows). Keyed by `anon:<ip>` in the fallback store and by a
 * NULL user_id + anon_identifier row in Supabase. Best-effort: a ledger
 * failure must never break the anonymous demo.
 */
export async function recordAnonymousRun(identifier: string, target: string): Promise<void> {
  const key = `anon:${identifier.toLowerCase()}`;
  try {
    if (isDbConfigured()) {
      const admin = getAdmin()!;
      const { error } = await admin.from('usage_events').insert({
        user_id: null,
        anon_identifier: key,
        kind: 'audit',
        target,
        cache_hit: false,
        cost_est_cents: null,
      });
      if (error) throw new Error(error.message);
    } else {
      memEvents.push({ userId: key, target, createdAt: Date.now() });
    }
  } catch (err: any) {
    console.error('[usage-ledger] anonymous event write failed:', err?.message);
  }
}

// --- Routes -------------------------------------------------------------------

/** GET /api/usage — the frontend meter reads this. */
export const usageRouter = Router();

usageRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const verdict = await getUsage(req.auth!.userId);
    res.json({
      used: verdict.used,
      limit: verdict.limit,
      remaining: verdict.remaining,
      resetAt: verdict.resetAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Usage lookup failed.' });
  }
});
