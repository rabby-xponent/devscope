/**
 * Engineering dossier content (portfolio section on the public home page).
 *
 * Single source of truth for the recruiter-facing architectural dossier.
 * Explains how GitGrill works under the hood, the core engineering decisions,
 * verification benchmarks, and technical trade-offs.
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
  verifiedBy: string;
}

export interface DossierCheck {
  title: string;
  detail: string;
}

export interface SubsystemMap {
  title: string;
  badge: string;
  description: string;
  components: string[];
}

export const DOSSIER_STATS: DossierStat[] = [
  { value: '29', label: 'engineered milestones' },
  { value: '2-Tier', label: 'agentic audit engine' },
  { value: '15', label: 'evidence & repo tools' },
  { value: '6', label: 'LLM providers with failover' },
  { value: 'Dual', label: 'Stripe + bKash/Nagad MFS' },
  { value: '10', label: 'RLS-protected Postgres tables' },
];

export const DOSSIER_SYSTEM_MAP: SubsystemMap[] = [
  {
    title: 'Tier 1: Fast Deterministic Profiler',
    badge: '~30s Ingestion',
    description:
      'Pulls public GitHub commit, PR, and repo metrics via REST and GraphQL. Calculates deterministic language ratios, merge velocity, tenure weighting, and private-work compensations without relying solely on LLMs.',
    components: ['GitHub REST/GraphQL Ingestion', 'Language Delta Aggregator', 'Tenure Weighting Engine', 'Deterministic Cache Layer'],
  },
  {
    title: 'Tier 2: Autonomous ReAct Deep Code Auditor',
    badge: 'Multi-Turn Agent',
    description:
      'An agentic loop that dynamically explores repository file trees, reads raw source code with line-bounded buffers, and inspects commit diffs. Generates architecture ratings, code cleanliness scores, and 3 adversarial interview defense questions.',
    components: ['browse_repo_tree Tool', 'read_source_file (Line-clamped buffer)', 'inspect_commit_diffs Forensics', 'Adversarial Question Generator'],
  },
  {
    title: 'Resilient Multi-LLM Gateway',
    badge: '6 Providers + Cooldowns',
    description:
      'Priority-ranked router (Gemini 2.5 Flash, Groq LLaMA 3.3, OpenRouter, DeepSeek, Qwen, OpenAI) featuring active circuit-breakers, typed schema validation with repair passes, and an honest deterministic fallback floor.',
    components: ['Circuit-Breaker Failover', 'Per-Model Health & Cooldowns', 'Zod Schema Contract Validator', 'Deterministic Fallback Floor'],
  },
  {
    title: 'Dual Monetization & Identity Security',
    badge: 'Fintech & Zero-Leak RLS',
    description:
      'Global card subscriptions via Stripe Webhooks paired with a bootstrapped Bangladesh MFS protocol (bKash/Nagad/Rocket) offering 24-hr provisional access. Protected by Supabase Postgres Row-Level Security ensuring strict candidate/recruiter isolation.',
    components: ['Stripe Webhook Mirror (No direct billing reads)', 'MFS 24h Provisional Engine', 'Supabase JWT & Postgres RLS', 'Zero-Knowledge Candidate Boundary'],
  },
];

export const DOSSIER_DECISIONS: DossierDecision[] = [
  {
    id: 'two-tier-architecture',
    icon: 'target',
    title: 'Two-Tier Engine: Fast Scan vs Autonomous ReAct Deep Audit',
    decision:
      'GitGrill separates instant 30-second deterministic profiling (Tier 1) from multi-turn autonomous deep codebase due-diligence (Tier 2). The deep auditor runs a true ReAct loop (Reasoning + Acting) with dynamic tools rather than pre-fetching or one-shot summarization.',
    why:
      'Sending entire codebases in a single prompt exhausts context windows and causes hallucinations. Dynamic repo browsing mirrors human Staff Engineer due-diligence: inspecting entrypoints, checking error handling styles, and probing commit diffs only where suspicious.',
    verifiedBy: 'Implemented in backend/src/agent/deep-audit.service.ts with browse_repo_tree, read_source_file, and inspect_commit_diffs.',
  },
  {
    id: 'adversarial-defense',
    icon: 'check',
    title: 'Adversarial Code Defense Playbook over Star-Farming Metrics',
    decision:
      'Instead of grading candidates by GitHub stars or commit volume (which are trivially botted or tutorial-forked), Tier 2 generates 3 repo-specific adversarial interview questions citing exact files and lines, paired with Senior/Staff rubric expectations and red flags.',
    why:
      'Anyone can fork a popular repo or copy boilerplate. Only the authentic author can defend architecture trade-offs, race condition mitigations, and recovery strategies under senior technical scrutiny.',
    verifiedBy: 'Verified via defensePlaybook structure in DeepCodeAuditModal with interactive Practice Defense evaluation.',
  },
  {
    id: 'fintech-bootstrapping',
    icon: 'briefcase',
    title: 'Zero-Cost Bootstrapped Monetization: Bangladesh MFS Protocol',
    decision:
      'Implemented a local Bangladeshi Mobile Financial Services flow (bKash, Nagad, Rocket) alongside Stripe, granting immediate 24-hour provisional Pro access upon TrxID submission, backed by an async admin verification ledger.',
    why:
      'Commercial merchant payment gateways in Bangladesh require ~৳30k upfront setup fees and formal trade licenses. The 24-hour provisional protocol achieves zero upfront overhead, zero user friction, and full monetization readiness with async admin oversight via /admin/billing.',
    verifiedBy: 'Race-tested and verified with cache/mfs-payments.json, /api/billing/mfs/submit, and /admin/billing console.',
  },
  {
    id: 'cost-first',
    icon: 'zap',
    title: 'Atomic Check-and-Reserve Metering Before LLM Work',
    decision:
      'Anonymous runs are bounded to 1 per browser with IP backstops. Every signed-in audit passes an atomic check-and-reserve transaction at the API boundary BEFORE any LLM or agent tool execution starts.',
    why:
      'An unmetered /api/agent/stream is an open LLM bill vulnerability. Reserve-first metering prevents concurrent request races from exceeding tier limits.',
    verifiedBy: 'Race-tested: 6 parallel requests sent concurrently; exactly 3 granted on Free, 3 rejected with 402.',
  },
  {
    id: 'webhook-only',
    icon: 'lock',
    title: 'Webhooks as the Single Writer of Plan State',
    decision:
      'Frontend checkout redirects grant nothing. Tier flips occur strictly upon signature-verified webhook events; redelivery is idempotent via claimed event IDs, and the audit hot path reads a local mirrored DB — never Stripe APIs.',
    why:
      'Protects against client tampering and API outage coupling. Verified with SDK-signed events: forged timestamps, missing signatures, and tampered bodies are all rejected.',
    verifiedBy: 'Verified: 5 SSE audits completed with the Stripe SDK pointed at a dead host, proving zero hot-path dependency.',
  },
  {
    id: 'model-resilience',
    icon: 'zap',
    title: 'Health-Ranked Multi-Provider Gateway with Deterministic Fallback',
    decision:
      'Multi-model gateway across 6 providers (Gemini, Groq, OpenRouter, DeepSeek, Qwen, OpenAI) featuring per-model health tracking, error-classification retries, and an honest deterministic fallback generator.',
    why:
      'Upstream LLM rate limits and outages should never break user workflows. Recruiters always receive a structured report, and traces explicitly indicate the provider used.',
    verifiedBy: 'Simulated 100% upstream provider outage; returned typed deterministic dossier without crashing or 500 error.',
  },
  {
    id: 'private-work',
    icon: 'users',
    title: 'Proprietary Work Bias Compensation',
    decision:
      'Low public commit frequency is never interpreted as low technical capability. The engine weights tenure, company context, and private commit ratios before assigning seniority scores.',
    why:
      'Most senior and staff engineers write proprietary code behind corporate NDAs. Evaluating candidates purely on public GitHub activity introduces junior bias.',
    verifiedBy: 'Evaluated against private-heavy profiles; senior tenure appropriately credited.',
  },
  {
    id: 'privacy-redlines',
    icon: 'scale',
    title: 'Candidate vs Recruiter Privacy Red Lines at the Database Layer',
    decision:
      'Audits remain private until explicitly published by the developer. Candidate notes and job-seeking intentions are cryptographically unreadable from the recruiter context, enforced by Postgres Row-Level Security.',
    why:
      'Trust in talent platforms requires strict, non-negotiable architectural boundaries, not marketing assurances.',
    verifiedBy: 'Verified all 10 Supabase tables with RLS active and cross-role leakage tests passing.',
  },
];

export const DOSSIER_VERIFICATION: DossierCheck[] = [
  {
    title: 'Two-Tier ReAct Loop Benchmark',
    detail: 'Tier 1 fast scan completes in ~30s; Tier 2 autonomous agent completes deep repo tree traversal & code extraction within 5 bounded turns.',
  },
  {
    title: 'Quota Race Test',
    detail: '6 concurrent SSE starts → exactly 3 allowed on Free; ledger matched with zero overages.',
  },
  {
    title: 'MFS 24-Hour Provisional Activation',
    detail: 'bKash/Nagad TrxID submission instantly unlocks 24-hr Pro tier; admin approval locks in 30/365-day subscription.',
  },
  {
    title: 'Forged Webhook Rejection',
    detail: 'Tampered body, missing signature, stale timestamp → all rejected with 400 Bad Request.',
  },
  {
    title: 'Hot-Path Isolation',
    detail: '5 fresh audits completed with the billing SDK pointed at a dead host; zero latency penalty.',
  },
  {
    title: 'Live Postgres RLS Probe',
    detail: 'All 10 Supabase tables + full column schemas verified against live database (18/18 tests pass).',
  },
  {
    title: 'Adversarial Defense Evaluation',
    detail: 'Candidate answers tested against Senior/Staff rubric; superficial answers flagged, architectural trade-offs credited.',
  },
];

export const DOSSIER_STACK: Record<string, string[]> = {
  'Frontend Architecture': [
    'Next.js 14 App Router',
    'TypeScript (Strict)',
    'Tailwind CSS (Token-calibrated)',
    'Server-Sent Events (SSE) Client',
  ],
  'Backend & Agent Engine': [
    'Node.js & Express',
    'Autonomous ReAct Agent Loop',
    'Line-Bounded File Buffers',
    'Zod Schema Contracts',
  ],
  'AI & Provider Gateway': [
    'Google Gemini 2.5 Flash',
    'Groq (LLaMA 3.3 70B)',
    'OpenRouter Failover',
    'Deterministic Fallback Floor',
  ],
  'Database & Security': [
    'Supabase PostgreSQL',
    'Row-Level Security (RLS)',
    'JWT Authentication',
    'AES & Signature Verification',
  ],
  'Fintech & Monetization': [
    'Stripe Webhooks (Global)',
    'Bangladesh MFS Engine (bKash/Nagad)',
    '24h Provisional Access Ledger',
    'Admin Verification Console',
  ],
};
