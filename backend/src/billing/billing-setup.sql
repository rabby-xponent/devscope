-- DevScope billing tables (M25B — MONETIZATION_ARCHITECTURE.md §8)
--
-- Run this in the Supabase SQL editor, after backend/src/auth/supabase-setup.sql.
--
-- `subscriptions` is a MIRROR of Stripe state, not a second source of truth:
-- only the verified webhook writes it (backend/src/billing/subscriptions.ts).
-- Nothing in this file is ever written from a checkout redirect, and nothing is
-- ever deleted here — a downgrade is a status change, never a data deletion.
--
-- `billing_events` records delivered event ids. The unique constraint on
-- event_id is what makes webhook redelivery a no-op (replay safety, §8).

create table if not exists public.subscriptions (
  user_id uuid primary key references public.users (id) on delete cascade,
  customer_id text unique,
  subscription_id text unique,
  plan text not null default 'none'
    check (plan in ('none', 'pro_monthly', 'pro_annual', 'team_monthly', 'team_annual')),
  -- Stripe statuses: none, incomplete, incomplete_expired, trialing, active,
  -- past_due, canceled, unpaid, paused.
  status text not null default 'none',
  seats integer not null default 1 check (seats >= 1),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  -- Dunning (§8): past_due keeps the paid tier until this instant, after which
  -- tier resolution falls back to Free on its own — no cron, no deletion.
  grace_until timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_events (
  event_id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

create index if not exists subscriptions_customer_id_idx
  on public.subscriptions (customer_id);

-- Red lines (§4): these tables hold money state, so RLS is enabled and NO
-- client policy is granted. The backend reads and writes them with the service
-- role key, which bypasses RLS by design; the browser never touches them.
alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;