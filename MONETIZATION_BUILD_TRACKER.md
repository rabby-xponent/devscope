# DevScope — Monetization Build Tracker (Milestones 24–25)

> **Companion to:** `BUILD_TRACKER.md` (overall build history) and
> `MONETIZATION_ARCHITECTURE.md` (the spec — source of truth for *why* and *what*).
> This file is the *executable* plan: sub-milestones, scopes, acceptance criteria, status.
>
> **Rules of engagement for this phase:**
> - One sub-milestone = one commit (authored as the user, no attribution).
> - Acceptance criteria are checked only after verification (typecheck + browser/API test).
> - Open decisions in `MONETIZATION_ARCHITECTURE.md` §11 must be signed off *before* the
>   milestone that depends on them starts.

---

## Phase Definition of Done

A stranger can complete this journey end-to-end, and an existing user loses nothing:

1. Land → run **1 free demo audit** (no signup) → hit the demo wall.
2. Create an account (GitHub OAuth / magic link, no card) → their demo work is still there.
3. Get **3 audits/month** free, with a live meter; hit the wall → clear upgrade path.
4. Pay (Stripe test mode) → limits lift immediately; cancel → graceful downgrade.
5. An existing localStorage user logs in → target roles, defense cards, proofs all present.
6. Candidate campaign data is provably unreadable from the recruiter context (API test).

---

## M24A — Anonymous demo gating

**Aim:** bound the demo — one fresh audit per profile per browser — without accounts.
Closes the only current cost hole (`GET /api/agent/stream` is currently unlimited).

**Scope:**
- `backend/src/routes/api.ts` — demo check before agent work on fresh runs.
- Cookie `devscope_demo_runs_v1` (handles already demo-audited); cache hits never consume.
- In-memory IP backstop limiter (~10 fresh runs/hour/IP).
- `frontend` — "create free workspace" banner after demo completes; wall modal on
  `demo_exhausted` error event (never a dead end).

**Out of scope:** accounts, real quotas, billing.

**Acceptance criteria:**
- [x] Fresh audit on a new handle → allowed once; second fresh run on same handle → blocked
      with a structured `demo_exhausted` SSE error.
- [x] Cached profile read → always served, never consumes demo budget.
- [x] Clearing cookies and retrying → IP limiter still blocks beyond the hourly cap.
- [x] Banner appears after demo completion with a signup CTA (handle pre-filled).
- [x] All existing flows (recruiter demo, proof pages) unaffected.

**Status:** `[x]` complete
**Build note:** Backend half (`backend/src/security/demo-gate.ts`): cookie
`devscope_demo_runs_v1` (HttpOnly, SameSite=Lax) tracks demo-audited handles; cache hits
never consume; IP backstop (`DEMO_IP_HOURLY_CAP`, default 10/hr, in-memory). `DEMO_LIMIT=off` escape hatch for dev. Route restructured
so cache read + gate run **before** `flushHeaders()` (Set-Cookie must precede flush — bug
caught and fixed in verification). Frontend half (`components/DemoUpsell.tsx`):
`DemoSignupBanner` renders after a fresh non-cached completion (sessionStorage dismissal);
`DemoWall` replaces the generic error card on `demo_exhausted`/`rate_limited`, with an
honest "accounts ship next milestone" CTA until M24B. **Cross-origin lesson:** the frontend
calls the backend on a different port, so EventSource needed `{ withCredentials: true }`
AND backend CORS `credentials: true` — without them the demo cookie never round-tripped
(silently; caught only by live browser verification). Verified in browser: fresh run →
banner; replay → wall with server message; cache hits free. **IP-cap load test (final criterion):** with
`DEMO_IP_HOURLY_CAP=2`, 8 sequential fresh runs from one spoofed IP — exactly 2 passed the
gate (nonexistent handles fail fast at the GitHub fetch, zero agent/LLM cost), the remaining
6 got structured `rate_limited` SSE errors with no agent runs. Test script was temporary and
removed; backend restored to default cap after.

---

## M24B — Accounts & auth

**Aim:** real identity — GitHub OAuth (developers) + email magic link (recruiters),
one account with two switchable contexts. Replaces the fake `recruiter-auth.ts` persona.

**Depends on:** architecture §11 open decision #1 (managed vs self-hosted) — **sign off first**.

**Scope:**
- Auth provider setup (Supabase recommended); `users`, `workspaces`, `memberships` tables + RLS.
- Frontend: session provider, login/signup surfaces, context switcher wired to real session.
- Backend: JWT verification middleware (signature only, no DB hit on hot path).
- `recruiter-auth.ts` replaced; its preferences schema migrates into `users.preferences`.

**Out of scope:** quota enforcement (M24C), import (M24D), billing (M25B).

**Acceptance criteria:**
- [ ] Sign in with GitHub → account created, handle captured; sign in with magic link →
      same human merges by verified email.
- [ ] Both contexts visible on one account; switching never merges candidate/recruiter data.
- [ ] Signed-out recruiter portal clearly labeled *local-only demo mode* (or gated per §7).
- [ ] Backend rejects forged/expired JWTs; all new tables have RLS enabled and tested.
- [ ] No regression: anonymous demo still works.

**Status:** `[ ]` not started
**Build note:** _(filled in on completion)_

---

## M24C — Usage ledger + stream chokepoint

**Aim:** the meter. Every fresh audit is recorded and attributable; quota checks are atomic
and happen *before* agent work starts.

**Scope:**
- `usage_events` table (kind, target, cache_hit, cost_est_cents, created_at).
- `backend/src/routes/api.ts` — transactional check-and-reserve inside `GET /generate`;
  `quota_exhausted` SSE event with remaining/reset info.
- Anonymous demo runs also recorded (cookie-keyed) — one meter, two identity modes.
- Best-effort cost capture from provider usage.

**Out of scope:** tier registry (M25A) — v1 hardcodes Free limits in one config constant
that M25A will promote into the registry.

**Acceptance criteria:**
- [ ] Concurrent SSE starts cannot exceed quota (race test: parallel requests, count ≤ limit).
- [ ] Cache hits never write usage rows; fresh runs always do.
- [ ] Exhausted user gets a structured event and keeps full read access to existing data.
- [ ] `cost_est_cents` populated for real runs (best-effort, documented margin view).
- [ ] Anonymous demo budget is also ledger-backed (survives cookie deletion via IP rows).

**Status:** `[ ]` not started
**Build note:** _(filled in on completion)_

---

## M24D — Workspace storage + localStorage import

**Aim:** account-based workspaces are the source of truth; existing localStorage users keep
everything they built (idempotent first-login import).

**Scope:**
- Tables: `target_roles`, `defense_cards`, `requisitions`, `job_projects` (jsonb-first).
- Proof store (`backend/cache/proofs/` files) → `proofs` table; owner claim by handle.
- `POST /api/workspace/import` (idempotent) + client trigger on first login + `devscope_migrated_v1`.
- Read/write paths move server-first with localStorage as offline cache.
- Export + delete endpoints (GDPR baseline).

**Out of scope:** team collaboration features beyond membership rows.

**Acceptance criteria:**
- [ ] Existing user logs in → target roles, defense cards, requisitions, job projects, and
      published proofs all present; localStorage still functions as cache offline.
- [ ] Import run twice → zero duplicates.
- [ ] Recruiter workspace data readable only by its members (RLS test).
- [ ] Candidate campaign data unreadable from a recruiter context (API-level test — red line).
- [ ] Export produces a complete JSON of the user's data; delete removes it and revokes proofs.

**Status:** `[ ]` not started
**Build note:** _(filled in on completion)_

---

## M25A — Tier registry + gating UX

**Aim:** limits as data. One registry + `can()` consumed by backend enforcement and frontend
meters — so rigor later is a config change.

**Depends on:** §11 open decisions #3, #4, #5 — **sign off first**.

**Scope:**
- `TIERS` registry + `can(user, capability, ctx)` shared by backend and frontend.
- Backend: replace M24C's hardcoded limits with registry lookups; per-capability responses.
- Frontend: quota meter on `/developer`, feature-lock chips (practice, proof publish),
  upgrade modal, "local-only demo" labeling for recruiter portal.
- Proof publish limit (Free = 1 active, branded) enforced server-side.

**Out of scope:** payments (M25B) — upgrade CTAs lead to a waitlist/contact until then.

**Acceptance criteria:**
- [ ] Every capability in the matrix (architecture §6) is enforced at its chokepoint.
- [ ] Meter shows accurate remaining count; resets correctly at 30d boundary.
- [ ] Paywalled surfaces never hide the user's own existing data (dark-pattern check).
- [ ] Changing a limit in the registry changes behavior with no code edits elsewhere.

**Status:** `[ ]` not started
**Build note:** _(filled in on completion)_

---

## M25B — Stripe billing

**Aim:** self-serve payment. Pro (individual) and Team (per seat) via Stripe Checkout;
webhooks are the only writer of plan state.

**Depends on:** §11 open decision #2 (price point) — **sign off first**.

**Scope:**
- Checkout (subscription mode), Customer Portal, webhook handler with signature verification.
- `subscriptions` table mirror; 60s-TTL plan cache on the hot path.
- Grace window for `past_due` (7d) → downgrade to Free; never deletes data.
- Upgrade CTAs wired from every M25A wall.

**Out of scope:** invoicing/enterprise contracting (manual for now).

**Acceptance criteria:**
- [ ] Test-mode purchase lifts limits immediately (meter updates without re-login).
- [ ] Cancel → access until period end → graceful downgrade to Free; data intact.
- [ ] Webhook replay/idempotency safe; forged webhook rejected.
- [ ] No Stripe call on the SSE hot path (verified in logs).
- [ ] Failed payment → `past_due` + grace, then downgrade.

**Status:** `[ ]` not started
**Build note:** _(filled in on completion)_

---

## M25C — Team seats (deferred detail)

**Aim:** per-seat Team plan for recruiter workspaces — shared pipelines, batch screening,
ATS export — informed by the 5-recruiter pilot (validation plan).

**Scope (to be detailed post-pilot):** seat invitations, per-seat billing quantity,
workspace-shared pipelines/notes, ATS export entitlements.

**Status:** `[ ]` not started — deliberately deferred until pilot data exists.

---

## Order & dependencies

```
M24A (cost hole)  →  M24B (identity)  →  M24C (meter)  →  M24D (workspaces)
                                                              ↓
                                        M25A (registry/UX) → M25B (Stripe) → M25C (seats)
```

Each step independently shippable. **Cost protection first, billing last** — there is
nothing to bill until identity and metering exist.

## Risks (watch during this phase)

| Risk | Mitigation |
|---|---|
| Quota race (concurrent SSE) | Transactional reserve; race test in M24C criteria |
| Cookie-clearing abuse of demo | IP backstop + ledger rows (M24A/M24C) |
| Migration data loss | Idempotent import + localStorage kept as cache; export endpoint |
| Auth vendor lock-in | Thin session interface; JWT verification is standard |
| Stripe webhook drift in dev | `stripe listen` documented; webhook is only plan writer |
| Scope creep into team features | M25C deferred until pilot data exists |
