'use client';

/**
 * Entitlement loader hook (M25A). One fetch, shared shape, refreshed on sign-in
 * change, on window focus, and on a slow interval so a meter never goes stale
 * after a run in another tab. While the request is in flight — or if it fails —
 * consumers get local registry verdicts, so the UI always shows the real policy.
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchEntitlements, localEntitlements, Entitlements } from '@/lib/entitlements';
import { useSession } from '@/components/SessionProvider';

const REFRESH_MS = 60_000;

export function useEntitlements(): {
  entitlements: Entitlements;
  refresh: () => Promise<void>;
} {
  const { user, loading } = useSession();
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);

  const refresh = useCallback(async () => {
    setEntitlements(await fetchEntitlements());
  }, []);

  useEffect(() => {
    if (loading) return;
    void refresh();
    const id = setInterval(() => void refresh(), REFRESH_MS);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [loading, user?.id, refresh]);

  return {
    entitlements: entitlements ?? localEntitlements(Boolean(user)),
    refresh,
  };
}