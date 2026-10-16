# Developer CareerOS — Architecture & Product Specification
**AI-Native Career Command Center for Working Professionals**

---

## 1. Executive Summary & Problem Statement

Most developer portfolio tools assume a developer’s worth is measured by public GitHub green squares. In reality:
- **Senior, Lead, and Staff Engineers** write their best code in private corporate repositories under NDAs.
- Many professionals juggle **multiple identities** (personal GitHub for OSS, corporate GitHub Enterprise, agency/client accounts).
- Sending a single generic resume results in low ATS pass rates and weak technical interview positioning.
- Developers need a system that helps them **capture authentic evidence** (even from private work), **tailor resumes for specific Job Descriptions (JDs)**, and **measure interview conversions**.

**GitGrill Developer CareerOS** transforms from a public-only scanner into a complete **Proof-Grounded Career Command Center** that bridges private work, multi-resume management, JD matching, and interview defense.

---

## 2. The 8 Core Architectural Pillars

```
+-------------------------------------------------------------------------------+
|                           DEVELOPER CAREER OS                                 |
+-------------------------------------------------------------------------------+
|  1. Multi-Resume Vault       |  2. Target JD Tracker    |  3. Resume Tailor  |
|     - Multiple variants      |     - JD Pipeline        |     - Match Scorer |
|     - Impact Density Audit   |     - Must-haves vs gaps |     - Bullet Tuner |
|     - ATS Health Check       |     - Salary & notes     |     - Docx/PDF Out |
+------------------------------+--------------------------+---------------------+
|  4. Live App Crawler         |  5. Deep Tech Survey     |  6. A/B Analytics   |
|     - Inspect deployed URLs  |     - NDA War Stories    |     - Response Rate|
|     - Performance & stack    |     - Incident logs      |     - Interview win|
|     - Verified live claims   |     - Defense cheat-sheet|     - Variant score|
+------------------------------+--------------------------+---------------------+
|  7. Private Repo Intel       |  8. Multi-Identity Graph                       |
|     - Zero Code Storage      |     - Cross-Account Linking (Personal + Work)  |
|     - AST & Commit Metrics   |     - Unified Contribution Graph               |
+------------------------------+------------------------------------------------+
```

### Pillar 1: Multi-Resume Vault, File Ingestion & AI Diagnostic Review
- Store and manage multiple specialized resume profiles (e.g. *Lead Backend*, *Fullstack Architect*, *DevOps/SRE*).
- **Zero-Manual-Entry Document Ingestion**:
  - Drag-and-drop upload for existing CVs (`.pdf`, `.md`, `.txt`, `.docx`).
  - Intelligent document parser decomposes raw resume text into structured contact info, technical skills, and experience bullets.
  - Retains original document source while enabling real-time editing and tuning.
- **In-Browser Document Preview & Export Suite**:
  - Live formatted print/ATS preview with instant toggle between diagnostic view, formatted resume view, and raw Markdown.
  - Direct 1-click downloads: Formatted Print/PDF (`.pdf`), Clean ATS Markdown (`.md`), and Text.
- **AI Impact Diagnostic**:
  - Calculates **Impact Density Score** (quantifiable metrics, active power verbs).
  - Flags passive/vague phrases (*"assisted with microservices"* -> *"Engineered event-driven ingestion pipeline handling 14k req/sec"*).
  - Highlights missing technical competencies based on current market standards.

### Pillar 2: Target JD Tracker & Skill Heatmap
- Save and organize JDs from target companies.
- Automatic extraction of:
  - **Hard Technical Requirements** (languages, frameworks, cloud primitives).
  - **Architectural & Scale Requirements** (latency budgets, concurrency, team size).
  - **Implicit Interview Topics** (the actual questions interviewers will grill on).
- Visual gap analysis showing which claims are backed by code/live evidence versus unverified assertions.

### Pillar 3: AI Resume Positioning, ATS Shield & Direct Pitch Generator
- Automatically rank all saved resumes against any target JD to identify the best starting candidate.
- Evidence-grounded tailoring:
  - Rewrites bullet points to highlight skills matching the target JD.
  - **Zero Hallucination Guarantee**: The agent only refines and amplifies skills verified in the developer’s evidence vault.
- **Nuanced Journey Enhancements**:
  - **ATS Acronym & Synonym Shield**: Automatically aligns abbreviations (e.g. *K8s* <-> *Kubernetes*, *GCP* <-> *Google Cloud Platform*, *Postgres* <-> *PostgreSQL*) so automated screening systems don't reject on literal string mismatches.
  - **Hiring Manager InMail / Cover Pitch**: Generates high-signal, engineer-to-engineer pitch notes directly referencing the company's tech stack and scale pain points.
  - **Bullet Interview Defense Drills**: Auto-generates the top 3 probing technical questions a Staff/Principal engineer or hiring manager will ask for each tailored bullet point.
- Side-by-side diff review of recommended bullet improvements.
- 1-click ATS-friendly export (Clean Markdown, Formatted Word, and Print PDF).

### Pillar 4: Portfolio & Live App Web Crawler
- Crawl public portfolios, deployed SaaS apps, and personal engineering blogs.
- Automatically extracts technology stack headers, Core Web Vitals, SSR/SPA architecture, and SSL/DNS health.
- Converts live application metrics into verified proof cards.

### Pillar 5: Deep Technical Survey (NDA-Safe War Stories)
- Guided engineering questionnaire designed for enterprise engineers whose code cannot be shown:
  - *Production incident post-mortems and root-cause analyses.*
  - *Database schema migrations, indexing breakthroughs, and sharding trade-offs.*
  - *Distributed systems consensus, message queue backpressure, and caching layers.*
- Generates a 15-minute phone-screen cheat sheet and technical interview defense card.

### Pillar 6: Resume Performance & A/B Callback Analytics
- Developers log applications sent with each resume variant.
- Tracks:
  - Recruiter screening rate (ATS pass rate).
  - Technical phone screen pass rate.
  - Final offer conversion rate.
- Highlights which resume format and bullet formulations generate the highest callback yield.

### Pillar 7: Private Repo Intelligence (Zero-Code-Retention Architecture)
- **Security & Privacy First**:
  - Uses GitHub fine-grained personal access tokens or GitHub App installations.
  - **Ephemeral In-Memory Scanning Only**: Proprietary source code is never cloned to disk, never stored in databases, and never used to train LLMs.
  - Only anonymous metadata is retained:
    - Language breakdown & library dependencies (AST parse).
    - Commit volume, PR velocity, review participation.
    - Architectural indicators (e.g., presence of Dockerfiles, Terraform scripts, K8s manifests, SQL migrations).
- Translates raw private commits into humanized, professional resume bullet points.

### Pillar 8: Multi-Identity Graph
- Connects multiple accounts under one unified GitGrill profile:
  - Personal GitHub (Open Source & Pet Projects).
  - Corporate GitHub #1 (Past Employer).
  - Corporate GitHub #2 (Current Employer / Consulting).
  - GitLab / Bitbucket / Personal Blog.
- Aggregates an aggregate timeline and contribution footprint while keeping employer identities strictly separated.

---

## 3. Data Models (TypeScript Interfaces)

```typescript
export interface ResumeProfile {
  id: string;
  userId: string;
  title: string;              // e.g. "Senior Backend Engineer (Go/Distributed)"
  targetRoleType: string;      // e.g. "backend", "fullstack", "devops", "leadership"
  summary: string;
  skills: {
    category: string;         // "Languages", "Databases", "Cloud & Infra"
    items: string[];
  }[];
  experience: {
    id: string;
    company: string;
    title: string;
    location?: string;
    startDate: string;
    endDate?: string;          // null if current
    bullets: string[];
    verifiedProofIds?: string[]; // linked proof cards
  }[];
  education: {
    institution: string;
    degree: string;
    year?: string;
  }[];
  diagnosticScore: {
    overall: number;          // 0-100
    impactDensity: number;
    clarityScore: number;
    atsReadiness: number;
    critique: string[];
    suggestedImprovements: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface TargetJD {
  id: string;
  userId: string;
  company: string;
  roleTitle: string;
  rawText: string;
  sourceUrl?: string;
  salaryRange?: string;
  status: 'researching' | 'applied' | 'screening' | 'interviewing' | 'offer' | 'rejected';
  bestMatchingResumeId?: string;
  fitScores: Record<string, number>; // resumeId -> fit score (0-100)
  keyRequirements: string[];
  missingSkills: string[];
  notes: string;
  appliedResumeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TailoredResumeResult {
  targetJdId: string;
  baseResumeId: string;
  revisedBullets: {
    experienceId: string;
    original: string;
    recommended: string;
    reasoning: string;
  }[];
  tailoredSkills: string[];
  projectedFitIncrease: number; // e.g. +18%
}
```

---

## 4. Deterministic Domain Separation & Combined Capabilities

To guarantee clarity, determinism, and immutability for working engineers, CareerOS operates across three cleanly decoupled domains:

```
+---------------------------------------------------------------------------------------------------------+
|                                    DEVELOPER CAREER OS COMMAND CENTER                                   |
+---------------------------------------------------+-----------------------------------------------------+
| 1. TARGET JD DOMAIN                               | 2. RESUME VAULT DOMAIN                              |
| - Target job tracker & application status         | - Master CV (100% immutable master copy)            |
| - Raw JD text ingestion                           | - Authentic PDF/Docx structured document preview    |
| - Extracted technical & scale requirements        | - In-place section & bullet editor                  |
| - Application campaign ledger                     | - Native PDF viewer & verbatim source viewer        |
| - 1-click trigger: "⚡ Match Resumes"             | - Resume interview drills & recruiter InMail pitch  |
+---------------------------------------------------+-----------------------------------------------------+
                                                    |
                                                    v
+---------------------------------------------------------------------------------------------------------+
| 3. COMBINED MATCHMAKER DOMAIN (JD <-> RESUME INTERSECTION ENGINE)                                       |
| - Dual Selector: Pair any Target JD against any Resume Profile                                          |
| - Deterministic Fit Score (0-100%) with 4-Dimension Metric Breakdown                                    |
| - Verified Hard Skills (green badges) vs Missing Skill Gaps (amber alerts)                              |
| - Multi-Resume Leaderboard: Benchmarks all vault variants against the selected JD                        |
| - 1-Click AI Tailoring Studio: Side-by-side diff proposing targeted metrics & keywords                   |
| - Non-destructive Variant Branching: Creates v2.0 without altering original CV                          |
| - JD-Targeted Technical Interview Defense Simulator: Probes gap-specific architecture questions        |
+---------------------------------------------------------------------------------------------------------+
```

### Domain 1: Target JD Domain (Clean & Deterministic)
- **Entity**: `TargetRole`
- **Capabilities**:
  - Add & edit target roles with title, company, salary/level, and raw JD text.
  - Track application lifecycle: `researching` → `applied` → `screening` → `interviewing` → `offer` → `rejected`.
  - Extract hard requirements (Languages, Microservices, Datastores, Cloud primitives).
  - Quick launch directly into the Matchmaker with that JD pre-selected.

### Domain 2: Resume Domain (Clean & Deterministic)
- **Entity**: `ResumeProfile`
- **Capabilities**:
  - **Authentic Document Layout**: Rendered with exact structure matching the engineer's master CV (boxed section headers, pipe-separated contact row, bold company + right-aligned dates, bullet discs, 2-column skills grid, and degree coursework).
  - **In-Place Section Editor**: Deterministic modal to edit full name, title, contact info, summary, experience positions, bullets, projects, skills, and education directly in DevScope.
  - **Multi-Format Document Viewing**: Seamless toggle between Authentic Render, Verbatim Raw Source / Markdown, and Original Native PDF.
  - **Interview Drills & InMail Outreach**: Probing technical questions on resume claims, and engineer-to-engineer hiring manager cold pitches.
  - **Clean Print / PDF Export**: Dedicated `@media print` styling yielding professional PDF output without any web UI clutter.

### Domain 3: Combined Capabilities (JD ↔ Resume Intersection Engine)
- **Component**: `JDResumeMatchmaker` (`frontend/components/JDResumeMatchmaker.tsx`)
- **Capabilities**:
  1. **Deterministic Fit Analysis**:
     - Computes fit score (0-100%) based on verified skills, diagnostic health, and required JD primitives.
     - Dimension breakdown: Core Languages & Runtimes, Distributed Systems & Messaging, DevOps & Cloud, Architecture & DB Scale.
     - Green checkmark badges for verified matched skills; amber warning badges for missing skill gaps.
  2. **Multi-Resume Leaderboard**:
     - Automatically audits all resumes in the user's vault against the selected JD.
     - Displays ranked leaderboard (#1 Best Fit, #2, #3...) with fit scores, verified counts, and gap counts.
  3. **1-Click AI Tailoring Studio**:
     - Side-by-side proposal showing summary adjustments and quantifiable bullet upgrades incorporating missing JD primitives.
     - User can toggle individual bullet points on or off.
     - Creates versioned variants (e.g. `v2.0 (Tailored for Cefalo)`), keeping the master copy completely untouched.
  4. **JD-Targeted Technical Interview Defense**:
     - Pointed technical interview questions derived specifically from where the candidate's resume intersects with the target company's stack.
     - Breaks down *"What the Hiring Team Listens For"* and *"Recommended Engineering Defense"*.

---

## 5. Phased Implementation Roadmap

### Phase 1: Multi-Resume Vault & JD Tailoring Engine (Completed)
1. **Resume Vault UI & Authentic Rendering**:
   - Master CV format preservation with boxed section headers, pipe contact line, and right-aligned dates.
   - Built-in in-place section editor and AI Impact Diagnostics.
2. **JD ↔ Resume Matchmaker**:
   - Clean 3-workspace tab navigation (`Target Roles & Campaigns`, `Resume Vault`, `JD ↔ Resume Matchmaker`).
   - Deterministic fit score, verified skills, missing gaps, and multi-resume leaderboard.
3. **Tailoring Studio**:
   - 1-click bullet tuning for target JDs with before/after diffs.
   - Non-destructive variant branching (`v2.0`).

### Phase 2: Live App Crawler & Deep Technical Survey
1. **Live App Crawler**: URL input to audit frontend/backend live deployments and add verified claims.
2. **Technical Incident & Architecture Survey**: Structured wizard extracting NDA-compliant enterprise war stories.
3. **Application & Callback Performance Tracker**: Log resume version sent per job application and visualize response rates.

### Phase 3: Multi-Identity Graph & Private Repo Metadata Scanner
1. **Multi-GitHub Linking**: Connect multiple handles under one profile.
2. **Ephemeral Private Repo Scanner**: AST analysis of selected private repos with zero code retention.

---
*Maintained by the GitGrill Core Architecture Team. Last updated: October 2026.*
