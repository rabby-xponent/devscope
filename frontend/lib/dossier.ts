/**
 * Engineering dossier content (portfolio section on the public home page).
 *
 * Single source of truth for what the drawer shows — kept as data so adding a
 * decision or stat never touches component code. Every claim here is something
 * that was actually built or actually tested; nothing is aspirational.
 */

export interface DossierStat {
  value: string;
  label: string;
}

export interface DossierDecision {
  id: string;
  icon: 'zap' | 'scale' | 'lock' | 'target' | 'briefcase' | 'users' | 'check' | 'info';
  title: string;
  decision: string;
  why: string;
}

export interface DossierCheck {
  title: string;
  detail: string;
}

export const DOSSIER_STATS: DossierStat[] = [
  { value: '27', label: 'engineered milestones' },
  { value: '12', label: 'deterministic evidence tools' },
  { value: '6', label: 'LLM providers with failover' },
  { value: '3×9', label: 'tier × capability registry' },
  { value: '10', label: 'RLS-protected Postgres tables' },
  { value: '~30s', label: 'end-to-end audit' },
];

export const DOSSIER_DECISIONS: DossierDecision[] = [
  {
    id: 'cost-first',
    icon: 'zap',
    title: 'Cost protection before monetization',
    decision:
      'The anonymous demo is bounded (one fresh audit per profile per browser, IP backstop behind it) and every signed-in run passes an atomic check-and-reserve BEFORE any agent or LLM work starts.',
    why:
      'An unbounded /api/agent/stream is an open LLM bill. Reserve-first metering means concurrent starts can never exceed quota — race-tested: 6 parallel requests, exactly 3 allowed.',
  },
  {
    id: 'webhook-only',
    icon: 'lock',
    title: 'Webhooks are the only writer of plan state',
    decision:
      'A Stripe Checkout redirect grants nothing. The tier flips only on a signature-verified webhook event; redelivery is idempotent via claimed event ids, and the audit hot path reads a local cached mirror — never Stripe.',
    why:
      'Verified with SDK-signed events: forged timestamp, missing signature and tampered body all rejected; five SSE audits completed with the Stripe SDK pointed at a dead host — proof the hot path never touches billing.',
  },
  {
    id: 'limits-as-data',
    icon: 'target',
    title: 'Limits as data, not scattered checks',
    decision:
      'One dependency-free tier registry (anonymous/free/pro/team × 9 capabilities) is imported by both backend enforcement and the frontend UI through a shared alias, so the browser and the chokepoint cannot drift.',
    why:
      'Proven as data: patching the free limit 3→2 in that single file moved the meter and the SSE gate with zero other edits.',
  },
  {
    id: 'model-resilience',
    icon: 'briefcase',
    title: 'Multi-model resilience with an honest floor',
    decision:
      'A health-ranked gateway (Gemini, Groq, OpenRouter, DeepSeek, Qwen, OpenAI) with per-model cooldowns, classified retries and automatic failover; if every provider is exhausted, a deterministic dossier is generated and labeled as such.',
    why:
      'Audits never dead-end and never silently lie — a recruiter always gets a report, and the trace always says which model produced it.',
  },
  {
    id: 'evidence-over-claims',
    icon: 'check',
    title: 'Evidence over assertion',
    decision:
      'Anti-hallucination rules are enforced in code: expertise must copy exact language percentages from collected data, and a claim/evidence matrix separates code-verified skills from unverified claims that need probing. Output now passes a typed schema contract with a bounded LLM repair pass, gated by an offline eval harness.',
    why:
      'A model that returns a malformed or drifting dossier gets one targeted repair, then falls back to deterministic output — a recruiter never sees a broken report.',
  },
  {
    id: 'private-work',
    icon: 'users',
    title: 'Working professionals are not juniors',
    decision:
      'Low public commit activity is never read as low ability. The engine recognizes tenure, company context and private-repo working patterns before assigning seniority, and frames evaluation around verified artifacts plus targeted screening questions.',
    why:
      'Most working engineers write proprietary code; rating them on public volume alone is the core bias this product exists to remove.',
  },
  {
    id: 'privacy-redlines',
    icon: 'scale',
    title: 'Privacy red lines enforced at the API',
    decision:
      'Audits are private until the developer explicitly publishes a versioned snapshot. Candidate campaign data is provably unreadable from the recruiter context, and workspace/meter/billing tables carry RLS with zero client policies where the browser must never read.',
    why:
      'Isolation is a test, not a promise — the recruiter/candidate red line is checked at the API layer.',
  },
  {
    id: 'migration-honest',
    icon: 'info',
    title: 'Migration-honest storage',
    decision:
      'Account workspaces are server-first (jsonb-first tables), with a complete GDPR export and delete endpoint, while localStorage keeps working as an offline cache — nothing a user built before accounts ever disappears.',
    why:
      'Idempotent import by construction: existing ids are read first, only fresh rows are inserted — running the import twice produces zero duplicates.',
  },
];

export const DOSSIER_VERIFICATION: DossierCheck[] = [
  {
    title: 'Quota race test',
    detail: '6 concurrent SSE starts → exactly 3 allowed on Free; ledger matched.',
  },
  {
    title: 'Forged webhook rejection',
    detail: 'Tampered body, missing signature, stale timestamp → all rejected with 400.',
  },
  {
    title: 'Hot-path isolation',
    detail: '5 fresh audits completed with the billing SDK pointed at a dead API host.',
  },
  {
    title: 'Dunning grace window',
    detail: 'past_due keeps paid tier inside grace, invoice.paid clears it, expired window downgrades to Free with data intact.',
  },
  {
    title: 'Live schema probe',
    detail: 'All 10 Supabase tables + full column shape verified against the real database (18/18).',
  },
  {
    title: 'Output contract eval',
    detail: 'Offline harness gates every cached profile against the typed schema; warnings never ship as errors.',
  },
  {
    title: 'Dark-pattern check',
    detail: 'Paywalls never hide data the user already owns — verified in-browser on every wall.',
  },
];

export const DOSSIER_STACK: string[] = [
  'Next.js 14 · App Router · TypeScript',
  'Express · SSE streaming agent',
  'Supabase Postgres · RLS · JWT',
  'Stripe Billing · webhook-only state',
  'Multi-provider LLM gateway (6 providers)',
  'GitHub REST · live URL inspection',
];
