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
  /** Display string for Bangladeshi Taka (BDT) */
  displayBdt: string;
  /** Amount in BDT for manual bKash/Nagad transactions */
  bdtAmount: number;
  /** Longer marketing line, e.g. "billed monthly, cancel anytime". */
  cadence: string;
  /** Bengali cadence string */
  cadenceBn: string;
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
    displayBdt: '৳399/মাস',
    bdtAmount: 399,
    cadence: 'Billed monthly, cancel anytime.',
    cadenceBn: 'মাসিক বিলিং, যেকোনো সময় বাতিলযোগ্য।',
    perSeat: false,
    priceEnv: 'STRIPE_PRICE_PRO_MONTHLY',
  },
  pro_annual: {
    id: 'pro_annual',
    tier: 'pro',
    label: 'Pro — annual',
    display: '$120/yr',
    displayBdt: '৳3,490/বছর',
    bdtAmount: 3490,
    cadence: 'Two months free versus monthly.',
    cadenceBn: 'বাৎসরিক বিলিং — প্রায় ২৭% সাশ্রয়ী।',
    perSeat: false,
    priceEnv: 'STRIPE_PRICE_PRO_ANNUAL',
  },
  team_monthly: {
    id: 'team_monthly',
    tier: 'team',
    label: 'Team — monthly',
    display: '$29/seat/mo',
    displayBdt: '৳1,999/মাস',
    bdtAmount: 1999,
    cadence: 'Per seat, billed monthly.',
    cadenceBn: 'টিম অ্যাক্সেস ও আনলিমিটেড স্ক্রিনিং।',
    perSeat: true,
    priceEnv: 'STRIPE_PRICE_TEAM_SEAT_MONTHLY',
  },
  team_annual: {
    id: 'team_annual',
    tier: 'team',
    label: 'Team — annual',
    display: '$290/seat/yr',
    displayBdt: '৳18,990/বছর',
    bdtAmount: 18990,
    cadence: 'Per seat, two months free.',
    cadenceBn: 'সম্পূর্ণ টিম ও রিক্রুটিং স্যুট (বাৎসরিক)।',
    perSeat: true,
    priceEnv: 'STRIPE_PRICE_TEAM_SEAT_ANNUAL',
  },
};

/** Default plan shown by a generic upgrade CTA. */
export const DEFAULT_PLAN: PlanId = 'pro_monthly';

export const ALL_PLANS: PlanId[] = Object.keys(PLANS) as PlanId[];