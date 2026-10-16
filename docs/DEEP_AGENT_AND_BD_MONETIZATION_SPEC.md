# GitGrill — Deep Agentic Core & Bangladesh Monetization Architecture

> **Document Version:** v1.0 · October 2026  
> **Mission:** Transform GitGrill from a surface-level metadata scraper into a **Deep Autonomous Code-Auditing Agent & Technical Interview Defense Engine**, powered by a **Bangladesh-first, zero-overhead monetization system (bKash / Nagad TrxID verification)**.

---

## 1. Executive Strategy & Architectural Re-alignment

### 1.1 The Honest Pivot
GitGrill originally envisioned a ReAct agent, but optimized for speed and free-tier stability by hardcoding deterministic pre-fetches. While this produced a fast ~2s overview, it stripped the engine of autonomous reasoning and deep code intelligence.

We are now instituting a **Two-Tier Engine**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GITGRILL TWO-TIER ENGINE                        │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 1: INSTANT SIGNAL SCAN (Free & Fast · ~2s)                        │
│ • Deterministic pre-fetch (Profile, Repo list, Commit stats, Web info) │
│ • Free/Community LLM synthesis (Gemini Flash / Groq)                   │
│ • High-level candidate dossier, languages, 15-min screen sample        │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 2: DEEP AGENTIC CODE AUDIT & DEFENSE (Pro / Premium)               │
│ • True Autonomous Investigation (Hypothesis → Plan → Tool → Observe)   │
│ • Deep Source Code Traversal (`src/`, `lib/`, `tests/`, `routes`)      │
│ • Real Authored Git Diff & Commit Quality Inspection                   │
│ • Bought/Premium LLM Gateway (Claude 3.5 Sonnet / GPT-4o / Gemini Pro) │
│ • Interactive Staff-Level "Code Defense" (Adversarial Mock Interview)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Deep Code-Level Tools (Tier 2 Engine)

To move past surface-level READMEs, the agent requires direct eyes on production code:

| Tool Name | Parameters | Purpose |
|---|---|---|
| `browse_repo_tree` | `owner, repo, path?, branch?` | Inspects directory structure, discovers architecture (`src/`, `controllers/`, `models/`, `tests/`), identifies entrypoints. |
| `read_source_file` | `owner, repo, path, branch?` | Fetches raw file contents (bounded to 400 lines) for critical files like `schema.prisma`, `routes.ts`, `worker.go`, `package.json`. |
| `inspect_commit_diffs` | `owner, repo, author, maxCommits?` | Inspects real authored patch diffs by the candidate to evaluate coding conventions, error handling, and test discipline. |
| `audit_live_endpoints` | `url, endpoints?` | Active probe of API responses, headers, security posture, and client-side rendering bundle. |

---

## 3. Bangladesh-Friendly Monetization (BDT & MFS Flow)

### 3.1 The Reality of Payments in Bangladesh
Formal merchant gateways (SSLCommerz, Shurjopay, PortWallet) require:
- Upfront setup fees: ৳20,000 – ৳35,000
- Trade License (ট্রেড লাইসেন্স), e-TIN, VAT registration certificate
- Corporate merchant bank account and physical office verification
- High transaction processing deductions (2.5% – 3.8%)

**For an early-stage bootstrapping product, this is an unnecessary barrier.** Instead, DevScope implements the universally accepted, zero-setup **Manual Mobile Financial Services (MFS) Workflow** with bKash, Nagad, and Rocket.

---

### 3.2 Pricing Matrix (BDT Designed for Local Engineers)

| Plan Tier | Price (BDT) | Target Audience | Key Capabilities |
|---|---|---|---|
| **Free Starter** | **৳0** | Anyone exploring | 1 Instant Public Audit, Tier 1 overview, community LLM model, basic phone screen guide. |
| **Pro Dev / Interview Ready** | **৳399 / month** | Active Job Seekers & Junior/Mid Devs | **Deep Code Audit** (reads real files in `src/`), **Unlimited Interactive Code Defense Drills**, Requisition fit matching, Executive PDF export, access to Premium LLM tier. |
| **Job Hunt Season Pass** *(Best Value)* | **৳899 / 3 months** | Developers on 90-day job hunt | Everything in Pro Dev + Priority queue + 3 active target role roadmaps + resume claim audit. |
| **Recruiter / Team Pack** | **৳1,999 / month** | Tech Recruiters & Engineering Leads | 30 Deep Candidate Audits/mo, candidate comparison matrix, 1-click ATS dossier export. |

---

### 3.3 The bKash / Nagad Verification Flow

```
1. USER SELECTS PLAN (e.g. Pro Dev ৳399/mo)
   │
   ▼
2. CHECKOUT MODAL RENDERS INSTRUCTIONS:
   • "Send Money" / "Payment" to DevScope MFS Number:
     - bKash: 01XXXXXXXXX (Personal / Send Money)
     - Nagad: 01XXXXXXXXX (Personal / Send Money)
   • Reference: [User GitHub Username or 4-digit code]
   │
   ▼
3. USER SUBMITS PAYMENT DETAILS:
   • Sender Phone Number: (e.g., 01712345678)
   • Transaction ID (TrxID): (e.g., BJC7A98DF2)
   • Selected Plan: pro_monthly
   │
   ▼
4. PROVISIONAL INSTANT ACTIVATION (Zero Friction):
   • System creates record in `payments.json` with status `pending_verification`.
   • User gets 24-Hour Instant Grace Access immediately to start their deep audit!
   │
   ▼
5. ADMIN VERIFICATION (Dashboard or CLI):
   • Admin checks MFS app/SMS for matching TrxID.
   • Admin approves (1-click) → Status becomes `verified`, subscription expiry set to 30 days.
   • If fraudulent/invalid TrxID → Status set to `rejected`, grace access revoked.
```

---

## 4. API Provider Separation (Free vs. Bought Premium)

| Capability | Free Tier Provider | Paid / Premium Tier Provider |
|---|---|---|
| **Tier 1 Quick Synthesis** | `gemini-3.8-flash`, Groq `llama-3.3-70b` | `gemini-3.8-flash` (with higher rate limit PAT) |
| **Deep Code Traversal** | Disabled / Preview only | Multi-file AST inspection via GitHub API |
| **Interactive Code Defense** | 1 Sample Question | Full Multi-turn conversational ReAct agent powered by **Claude 3.5 Sonnet / GPT-4o / Gemini 1.5 Pro** |
| **Token & Request Quota** | 3 quick audits / day | 50 deep code analyses + unlimited interview drills |

---

## 5. Implementation Roadmap

1. **Backend Code Inspection Tools:** Add `browse_repo_tree`, `read_source_file`, `inspect_commit_diffs` in `backend/src/agent/tools/github.tool.ts`.
2. **Payment & Subscription Ledger:** Implement `backend/src/billing/mfs-payment.service.ts` and routes (`POST /api/billing/submit-mfs`, `GET /api/billing/status`, `GET /api/billing/admin-list`, `POST /api/billing/verify`).
3. **Frontend bKash/Nagad Checkout Modal:** Build modern dark-glass modal with copyable numbers, step-by-step Bengali/English instructions, and TrxID submission.
4. **Deep Code Audit UI & Interview Defense Tab:** Provide an interactive section in `ProfileView` for deep code exploration and mock interview questioning.
