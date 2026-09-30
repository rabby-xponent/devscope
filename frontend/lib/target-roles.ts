/**
 * Target Roles & Campaign Store (Developer CareerOS)
 *
 * Developer-side counterpart of the recruiter requisitions store. A "target
 * role" is a job the developer is chasing: it holds the raw JD text (fed to
 * the same agent pipeline recruiters use), a campaign status, and a persistent
 * ledger of every pre-flight audit run against it — so the developer can watch
 * fit move as they ship evidence (e.g. 62% → 81% after adding a live demo).
 *
 * Local-first persistence, mirroring `job-projects.ts` conventions.
 */

export type ApplicationStatus =
  | 'researching'
  | 'applied'
  | 'screening'
  | 'interviewing'
  | 'offer'
  | 'rejected';

export interface TargetRoleAuditEntry {
  /** Unix ms of the audit run */
  at: number;
  /** Fit score the agent produced for this JD (0-100) */
  fitScore: number;
  /** Verdict from the agent (e.g. strong_match) */
  verdict: string;
  /** met / partially_met / gap_probe counts from the scorecard */
  metCount: number;
  partialCount: number;
  missingCount: number;
  /** Skill names that landed as gap_probe (drives the radar) */
  gaps: string[];
  /** Unverified claim skills (drives the defense hub) */
  unverified: string[];
  /** Phone-screen questions produced by the agent */
  screenQuestions: string[];
}

export interface TargetRole {
  id: string;
  title: string;
  company: string;
  createdAt: string;
  updatedAt: string;
  /** Full job description text — the same input recruiters audit against */
  rawJdText: string;
  /** JD link if the role was imported rather than pasted */
  sourceUrl?: string;
  status: ApplicationStatus;
  /** Freeform campaign notes (recruiter contact, referral, context) */
  notes: string;
  /** Newest-last chronological ledger of audits run against this role */
  auditHistory: TargetRoleAuditEntry[];
}

const STORAGE_KEY = 'devscope_target_roles_v1';
const ACTIVE_ROLE_KEY = 'devscope_active_target_role_v1';

export const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { label: string; order: number }
> = {
  researching: { label: 'Researching', order: 0 },
  applied: { label: 'Applied', order: 1 },
  screening: { label: 'Screening', order: 2 },
  interviewing: { label: 'Interviewing', order: 3 },
  offer: { label: 'Offer', order: 4 },
  rejected: { label: 'Closed', order: 5 },
};

export function getTargetRoles(): TargetRole[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTargetRole(role: TargetRole): TargetRole {
  const roles = getTargetRoles();
  const stamped: TargetRole = { ...role, updatedAt: new Date().toISOString() };
  const idx = roles.findIndex((r) => r.id === stamped.id);
  if (idx >= 0) roles[idx] = stamped;
  else roles.unshift(stamped);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  } catch {
    /* ignore */
  }
  return stamped;
}

export function deleteTargetRole(id: string): void {
  const roles = getTargetRoles().filter((r) => r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  } catch {
    /* ignore */
  }
  if (getActiveTargetRoleId() === id) setActiveTargetRoleId('');
}

export function getTargetRoleById(id: string): TargetRole | undefined {
  return getTargetRoles().find((r) => r.id === id);
}

export function setActiveTargetRoleId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_ROLE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function getActiveTargetRoleId(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(ACTIVE_ROLE_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Record a completed audit against a target role. Extracts everything the
 * campaign loop needs from the finished profile and appends it to the ledger.
 */
export function recordAuditForRole(
  roleId: string,
  profile: {
    username: string;
    requisitionFit?: {
      matchScore?: number;
      verdict?: string;
      requirements?: { requirement: string; status: string }[];
    };
    claimEvidenceMatrix?: { skill: string; status: string }[];
    recruiterPanel?: {
      phoneScreenGuide?: { question: string }[];
    };
  } | null
): TargetRole | undefined {
  const role = getTargetRoleById(roleId);
  if (!role || !profile) return undefined;

  const fit = profile.requisitionFit;
  const requirements = fit?.requirements || [];
  const matrix = profile.claimEvidenceMatrix || [];

  const entry: TargetRoleAuditEntry = {
    at: Date.now(),
    fitScore: fit?.matchScore ?? 0,
    verdict: fit?.verdict || 'not_assessed',
    metCount: requirements.filter((r) => r.status === 'met').length,
    partialCount: requirements.filter((r) => r.status === 'partially_met').length,
    missingCount: requirements.filter((r) => r.status === 'gap_probe').length,
    gaps: requirements
      .filter((r) => r.status === 'gap_probe')
      .map((r) => r.requirement),
    unverified: matrix
      .filter((m) => m.status === 'unverified_probe')
      .map((m) => m.skill),
    screenQuestions: (profile.recruiterPanel?.phoneScreenGuide || []).map(
      (q) => q.question
    ),
  };

  const updated: TargetRole = {
    ...role,
    auditHistory: [...role.auditHistory, entry],
  };
  return saveTargetRole(updated);
}

/* -------------------------------------------------------------------------- */
/*  Campaign analytics (derived selectors)                                     */
/* -------------------------------------------------------------------------- */

export function latestAudit(role: TargetRole): TargetRoleAuditEntry | undefined {
  return role.auditHistory.length > 0
    ? role.auditHistory[role.auditHistory.length - 1]
    : undefined;
}

export function fitDelta(role: TargetRole): number | null {
  if (role.auditHistory.length < 2) return null;
  const first = role.auditHistory[0].fitScore;
  const last = role.auditHistory[role.auditHistory.length - 1].fitScore;
  return last - first;
}

/**
 * Proof Strength (0-100): the headline competitiveness metric.
 * Components: latest fit average (60%), verified-evidence breadth (25%),
 * live/verified claim ratio (15%). Deliberately simple and explainable.
 */
export function computeProofStrength(roles: TargetRole[]): {
  score: number;
  auditedRoles: number;
  avgFit: number;
  totalGaps: number;
  totalUnverified: number;
} {
  const withAudits = roles.filter((r) => r.auditHistory.length > 0);
  if (withAudits.length === 0) {
    return { score: 0, auditedRoles: 0, avgFit: 0, totalGaps: 0, totalUnverified: 0 };
  }

  const latestScores = withAudits
    .map(latestAudit)
    .filter((a): a is TargetRoleAuditEntry => !!a)
    .map((a) => a.fitScore);
  const avgFit = Math.round(
    latestScores.reduce((s, n) => s + n, 0) / Math.max(1, latestScores.length)
  );

  const totalGaps = withAudits.reduce((s, r) => s + (latestAudit(r)?.missingCount || 0), 0);
  const totalMet = withAudits.reduce((s, r) => s + (latestAudit(r)?.metCount || 0), 0);
  const totalUnverified = withAudits.reduce(
    (s, r) => s + (latestAudit(r)?.unverified.length || 0),
    0
  );

  const requirementBreadth = totalGaps + totalMet > 0 ? totalMet / (totalGaps + totalMet) : 0;
  const claimChecks = totalMet + totalUnverified;
  const claimRatio = claimChecks > 0 ? totalMet / claimChecks : 0;

  // Coverage penalty: auditing only 1 role of many planned caps confidence.
  const coverage = Math.min(1, withAudits.length / Math.max(1, roles.length));
  const score = Math.round(
    (avgFit * 0.6 + requirementBreadth * 100 * 0.25 + claimRatio * 100 * 0.15) *
      (0.7 + 0.3 * coverage)
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    auditedRoles: withAudits.length,
    avgFit,
    totalGaps,
    totalUnverified,
  };
}

/** Aggregated, ranked gap list across all roles — the Skill Gap Radar. */
export function aggregateGaps(roles: TargetRole[]): { skill: string; count: number; roles: string[] }[] {
  const map = new Map<string, { count: number; roles: Set<string> }>();
  for (const role of roles) {
    const audit = latestAudit(role);
    if (!audit) continue;
    for (const gap of audit.gaps) {
      const key = gap.trim();
      if (!key) continue;
      const existing = map.get(key) || { count: 0, roles: new Set<string>() };
      existing.count += 1;
      existing.roles.add(role.title);
      map.set(key, existing);
    }
  }
  return [...map.entries()]
    .map(([skill, v]) => ({ skill, count: v.count, roles: [...v.roles] }))
    .sort((a, b) => b.count - a.count);
}

/** Aggregated unverified claims — the Interview Defense queue. */
export function aggregateUnverified(roles: TargetRole[]): { skill: string; count: number }[] {
  const map = new Map<string, number>();
  for (const role of roles) {
    const audit = latestAudit(role);
    if (!audit) continue;
    for (const skill of audit.unverified) {
      const key = skill.trim();
      if (!key) continue;
      map.set(key, (map.get(key) || 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Evidence-building task suggestions derived from gaps — deterministic,
 * agent-free, and honest (they propose actions, they don't fabricate market data).
 */
export function generateEvidenceTasks(roles: TargetRole[]): { title: string; why: string }[] {
  const tasks: { title: string; why: string }[] = [];
  const gaps = aggregateGaps(roles);

  for (const gap of gaps.slice(0, 4)) {
    tasks.push({
      title: `Build a small, deployed project demonstrating: ${gap.skill}`,
      why: `Flagged as a gap in ${gap.count} target role${gap.count > 1 ? 's' : ''} (${gap.roles
        .slice(0, 2)
        .join(', ')}). A live, inspectable artifact converts this from "claimed" to "verified".`,
    });
  }

  const unverified = aggregateUnverified(roles);
  if (unverified.length > 0) {
    tasks.push({
      title: `Strengthen public evidence for: ${unverified
        .slice(0, 3)
        .map((u) => u.skill)
        .join(', ')}`,
      why: 'Currently unverified claims — the exact skills interviewers probe. Add README detail, tests, or docs linking real usage.',
    });
  }

  const stale = roles.filter((r) => {
    const audit = latestAudit(r);
    return audit && Date.now() - audit.at > 14 * 24 * 3600 * 1000;
  });
  if (stale.length > 0) {
    tasks.push({
      title: `Re-verify ${stale.length} stale role audit${stale.length > 1 ? 's' : ''}`,
      why: 'Audits older than two weeks no longer reflect your current evidence. Re-run to refresh fit scores.',
    });
  }

  return tasks;
}
