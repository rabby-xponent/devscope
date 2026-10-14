/**
 * Stripe client + price resolution (M25B — MONETIZATION_ARCHITECTURE.md §8).
 *
 * One lazy client, one place that maps a Stripe price ID to a DevScope plan
 * (the catalogue itself lives in `config/plans.ts`, shared with the browser).
 * The hot path never touches this module's client — plan state is read from the
 * local `subscriptions` mirror, so an SSE audit never waits on Stripe and never
 * fails because Stripe is slow or down.
 *
 * Price IDs come from env, never from code: the dashboard-side swap is a redeploy
 * of env, not a rebuild.
 */

import Stripe from 'stripe';
import { ALL_PLANS, PlanId, PLANS, PlanDefinition } from '../config/plans';

let client: Stripe | null = null;
let clientKey: string | null = null;

/** True when a Stripe secret key is configured (test or live). */
export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Lazily constructed SDK client, or null when billing is not configured. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client || clientKey !== key) {
    // STRIPE_API_BASE lets a deployment (or a test) point the SDK at a local
    // mock/proxy. It also proves the negative: point it at a dead port and the
    // hot path still works, because the hot path never calls Stripe at all.
    const base = process.env.STRIPE_API_BASE;
    client = new Stripe(key, {
      apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
      ...(base ? { host: base.replace(/^https?:\/\//, '').replace(/\/$/, '') } : {}),
    });
    clientKey = key;
  }
  return client;
}

/** Webhook signing secret, or null when unset. */
export function getWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET || null;
}

export { PLANS };
export type { PlanId, PlanDefinition };

/** Stripe price ID for a plan, or null when that plan is not configured. */
export function priceIdFor(plan: PlanId): string | null {
  const value = process.env[PLANS[plan].priceEnv];
  return value && value.trim() ? value.trim() : null;
}

/** Every plan with a configured price — what checkout will actually offer. */
export function configuredPlans(): PlanDefinition[] {
  return ALL_PLANS.filter((id) => priceIdFor(id)).map((id) => PLANS[id]);
}

/** Plan for a Stripe price ID, or null when the price is not one of ours. */
export function planForPrice(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  for (const id of ALL_PLANS) {
    if (priceIdFor(id) === priceId) return id;
  }
  return null;
}

/**
 * Webhook-side plan resolution. Webhooks can fire before env prices are set
 * locally (e.g. replaying an old event), so this also matches any price ID that
 * carries the plan name — `price_pro_monthly…` in the dashboard, `pro_monthly` in
 * local env. Unknown prices resolve to null, which downgrades rather than
 * guessing: a payment we cannot classify must not silently grant a tier.
 */
export function planForPriceLoose(priceId: string | null | undefined): PlanId | null {
  const exact = planForPrice(priceId);
  if (exact) return exact;
  if (!priceId) return null;
  for (const id of ALL_PLANS) {
    if (priceId.includes(id) || priceId.includes(id.replace('_', ''))) return id;
  }
  return null;
}

/** Where Stripe sends the customer back after a successful checkout. */
export function successUrl(): string {
  const base = (process.env.APP_URL || 'http://localhost:3100').replace(/\/$/, '');
  return `${base}/developer?checkout=success`;
}

/** Where Stripe sends the customer back after abandoning checkout. */
export function cancelUrl(): string {
  const base = (process.env.APP_URL || 'http://localhost:3100').replace(/\/$/, '');
  return `${base}/developer?checkout=canceled`;
}