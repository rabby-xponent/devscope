/**
 * Plan catalogue (M25B — MONETIZATION_ARCHITECTURE.md §8/§11).
 *
 * Companion to `config/tiers.ts`: the registry says what each tier can do, this
 * says what each plan costs and which Stripe price env var backs it. Prices are
 * therefore as much "data" as limits — the marketing copy the upgrade modal
 * shows and the price Checkout charges both read these display strings, so they
 * cannot disagree.
 *
 * Dependency-free on purpose: the browser imports this through
 * `@backend/config/plans` for upgrade copy, exactly like the tier registry.
 * Never put node builtins or SDK imports in here.
 *
 * Price points: §11 decision 13 ($14/mo, $120/yr) and 14 ($29/seat/mo).
 */

import { Tier } from './tiers';

export type PlanId = 'pro_monthly' | 'pro_annual' | 'team_monthly' | 'team_annual';

export interface PlanDefinition {
  id: PlanId;
  tier: Tier;
  label: string;
  /** Shown to the user in the upgrade modal. Never a computed string. */
  display: string;
  /** Longer marketing line, e.g. "billed monthly, cancel anytime". */
  cadence: string;
  /** Per-seat plans bill `quantity = seats`; individual plans ignore quantity. */
  perSeat: boolean;
  /** Env var holding the Stripe price ID, so a misconfigured deploy fails loudly. */
  priceEnv: string;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  pro_monthly: {
    id: 'pro_monthly',
    tier: 'pro',
    label: 'Pro — monthly',
    display: '$14/mo',
    cadence: 'Billed monthly, cancel anytime.',
    perSeat: false,
    priceEnv: 'STRIPE_PRICE_PRO_MONTHLY',
  },
  pro_annual: {
    id: 'pro_annual',
    tier: 'pro',
    label: 'Pro — annual',
    display: '$120/yr',
    cadence: 'Two months free versus monthly.',
    perSeat: false,
    priceEnv: 'STRIPE_PRICE_PRO_ANNUAL',
  },
  team_monthly: {
    id: 'team_monthly',
    tier: 'team',
    label: 'Team — monthly',
    display: '$29/seat/mo',
    cadence: 'Per seat, billed monthly.',
    perSeat: true,
    priceEnv: 'STRIPE_PRICE_TEAM_SEAT_MONTHLY',
  },
  team_annual: {
    id: 'team_annual',
    tier: 'team',
    label: 'Team — annual',
    display: '$290/seat/yr',
    cadence: 'Per seat, two months free.',
    perSeat: true,
    priceEnv: 'STRIPE_PRICE_TEAM_SEAT_ANNUAL',
  },
};

/** Default plan shown by a generic upgrade CTA. */
export const DEFAULT_PLAN: PlanId = 'pro_monthly';

export const ALL_PLANS: PlanId[] = Object.keys(PLANS) as PlanId[];