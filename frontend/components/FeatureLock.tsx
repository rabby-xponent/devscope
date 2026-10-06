'use client';

/**
 * Feature-lock chip (architecture §7 — "Practice is Pro" / proof-publish walls).
 *
 * Small, reusable, and honest: the chip carries the locked capability's own
 * reason as its tooltip and opens the upgrade modal when clicked. It never
 * conceals the surface behind it — a locked Practice button sits next to a
 * fully visible question bank; a locked publish button sits next to the list of
 * pages you already published (§6 dark-pattern rule).
 */

import React, { useState } from 'react';
import { Icon } from '@/components/icons';
import { Capability } from '@backend/config/tiers';
import { capabilityOf, Entitlements, EntitlementEntry } from '@/lib/entitlements';
import { UpgradeModal } from '@/components/UpgradeModal';

export function FeatureLock({
  label = 'Pro',
  verdict,
  onClick,
}: {
  label?: string;
  verdict: EntitlementEntry;
  onClick?: () => void;
}) {
  return (
    <span
      onClick={onClick}
      title={verdict.reason || undefined}
      className={`inline-flex items-center gap-1 rounded-md border border-edge bg-well px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted ${
        onClick ? 'cursor-pointer transition-colors hover:border-signal/50 hover:text-signal' : ''
      }`}
    >
      <Icon.Lock className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

/**
 * Lock state for one capability plus the modal it opens. Consumers render their
 * own surface and ask `locked` / `onRequest` — the chip and modal come for free,
 * so every wall in the app looks and behaves the same.
 */
export function useCapabilityLock(
  entitlements: Entitlements | null,
  capability: Capability,
  used = 0
): { locked: boolean; verdict: EntitlementEntry; lock: React.ReactNode; onRequest: () => void } {
  const [open, setOpen] = useState(false);
  const verdict = capabilityOf(entitlements, capability, used);
  const locked = !verdict.allowed;
  return {
    locked,
    verdict,
    onRequest: () => setOpen(true),
    lock: (
      <>
        <FeatureLock verdict={verdict} onClick={() => setOpen(true)} />
        {open && (
          <UpgradeModal
            verdict={verdict}
            capability={capability}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    ),
  };
}