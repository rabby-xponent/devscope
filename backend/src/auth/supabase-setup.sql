-- DevScope Supabase setup (M24B — MONETIZATION_BUILD_TRACKER.md)
-- Run once in the Supabase SQL editor after creating the project.
-- jsonb-first by design (MONETIZATION_ARCHITECTURE.md §4); normalization can wait.

-- === Tables ===

create table if not exists public.users (
  id uuid primary key,                       -- == auth.users.id
  email text,
  github_handle text,
  name text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('individual', 'team')),
  name text not null default 'My Workspace',
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  primary key (workspace_id, user_id)
);

create table if not exists public.target_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists target_roles_user_idx on public.target_roles (user_id);

create table if not exists public.defense_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists defense_cards_user_idx on public.defense_cards (user_id);

-- Recruiter-side items share one shape (M24D fills the rows).
create table if not exists public.workspace_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists workspace_items_ws_idx on public.workspace_items (workspace_id);

-- The meter (M24C). user_counters is the atomic per-user reserve row;
-- usage_events records every fresh audit (anonymous demo runs included,
-- keyed by anon_identifier so they survive cookie deletion).
create table if not exists public.user_counters (
  user_id uuid primary key references public.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  audit_count integer not null default 0
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  anon_identifier text,
  kind text not null check (kind in ('audit')),
  target text not null,
  cache_hit boolean not null default false,
  cost_est_cents integer,
  created_at timestamptz not null default now()
);
create index if not exists usage_events_user_idx on public.usage_events (user_id, created_at);
create index if not exists usage_events_anon_idx on public.usage_events (anon_identifier, created_at);

-- === Row Level Security ===
-- The Express API uses the service role (bypasses RLS; every request there is
-- JWT-verified). RLS below is the second wall for any direct PostgREST use.

alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;
alter table public.target_roles enable row level security;
alter table public.defense_cards enable row level security;
alter table public.workspace_items enable row level security;

-- users: read/update only yourself
create policy "users self read" on public.users
  for select using (auth.uid() = id);
create policy "users self update" on public.users
  for update using (auth.uid() = id);

-- workspaces: owners and members see their workspaces
create policy "workspaces owner all" on public.workspaces
  for all using (auth.uid() = owner_user_id);
create policy "workspaces member read" on public.workspaces
  for select using (
    exists (
      select 1 from public.memberships m
      where m.workspace_id = id and m.user_id = auth.uid()
    )
  );

-- memberships: visible for your own rows and rows of workspaces you belong to
create policy "memberships self read" on public.memberships
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.memberships m
      where m.workspace_id = workspace_id and m.user_id = auth.uid()
    )
  );

-- candidate data: strictly per-user (user<->user red line)
create policy "target_roles owner all" on public.target_roles
  for all using (auth.uid() = user_id);
create policy "defense_cards owner all" on public.defense_cards
  for all using (auth.uid() = user_id);

-- recruiter data: members of the owning workspace only
-- (candidate<->recruiter red line: no cross-context reads anywhere)
create policy "workspace_items member all" on public.workspace_items
  for all using (
    exists (
      select 1 from public.memberships m
      where m.workspace_id = workspace_id and m.user_id = auth.uid()
    )
  );

-- usage_events / user_counters: service-write only — enable RLS with no
-- policies so API clients can never read or write the meter directly.
alter table public.usage_events enable row level security;
alter table public.user_counters enable row level security;

-- NOTE: `proofs` table is introduced in M24D with its own policy — public
-- reads by design for published snapshots only.
