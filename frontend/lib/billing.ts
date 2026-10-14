/**
 * Billing client (M25B — MONETIZATION_ARCHITECTURE.md §8).
 *
 * The browser never talks to Stripe. It asks our API for a Checkout session URL
 * and follows it; the webhook — not this file — decides what plan the user ends
 * up on. That is why nothing here caches a plan: after checkout the user lands
 * back on `/developer?checkout=success`, the entitlements hook refetches, and the
 * meter reflects the new tier with no re-login.
 *
 * Plan copy (prices) comes from the shared catalogue, so the modal can never
 * advertise a price the checkout does not charge.
 */

import { API_URL } from './config';
import { authHeaders } from './auth';
import { PLANS, DEFAULT_PLAN, PlanId, PlanDefinition } from '@backend/config/plans';

export type { PlanId, PlanDefinition };
export { PLANS, DEFAULT_PLAN };

export interface CheckoutResult {
  id: string;
  url: string;
  plan: PlanId;
  seats: number;
}

export interface SubscriptionStatus {
  tier: string;
  plan: PlanId | null;
  status: string;
  seats: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  inGrace: boolean;
  billingConfigured: boolean;
  graceDays: number;
  plans: Array<Pick<PlanDefinition, 'id' | 'tier' | 'label' | 'display' | 'perSeat'>>;
}

/**
 * Error carrying the backend's own wording. `notConfigured` drives the honest
 * "opening soon" copy instead of a fake payment step.
 */
export class BillingError extends Error {
  code: string;
  notConfigured: boolean;
  constructor(code: string, message: string, notConfigured: boolean) {
    super(message);
    this.code = code;
    this.notConfigured = notConfigured;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON error body */
  }
  if (!res.ok) {
    const code = data?.error || 'billing_failed';
    throw new BillingError(
      code,
      data?.message || 'Checkout is unavailable right now.',
      res.status === 503 || code === 'billing_not_configured' || code === 'plan_not_configured'
    );
  }
  return data as T;
}

/** Start Checkout for a plan. Returns the hosted-page URL to navigate to. */
export async function startCheckout(
  plan: PlanId = DEFAULT_PLAN,
  seats = 1
): Promise<CheckoutResult> {
  return post<CheckoutResult>('/api/billing/checkout', { plan, seats });
}

/** Open the Stripe Customer Portal for an existing subscriber. */
export async function startPortal(): Promise<{ url: string }> {
  return post<{ url: string }>('/api/billing/portal', {});
}

/** Current plan state. Anonymous/unavailable billing is not an error here. */
export async function fetchSubscription(): Promise<SubscriptionStatus | null> {
  try {
    const res = await fetch(`${API_URL}/api/billing/subscription`, {
      headers: await authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as SubscriptionStatus;
  } catch {
    return null;
  }
}

/** True when this plan is an individual plan (no seat count to pick). */
export function isPerSeat(plan: PlanId): boolean {
  return PLANS[plan].perSeat;
}