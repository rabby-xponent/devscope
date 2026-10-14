/**
 * Typed validation of the LLM-synthesized profile section (M26 — engine quality).
 *
 * The synthesis prompt (prompts.ts) and this file are two halves of the same
 * contract: the prompt *asks* for a shape, this file *proves* it. Anything
 * with `severity: 'error'` means the object is structurally wrong (missing
 * field, wrong type, invalid enum) and gets one bounded repair attempt before
 * the agent falls back to the deterministic profile. `severity: 'warning'` is
 * a quality/grounding deviation that ships but is scored by the eval harness.
 *
 * Dependency-free on purpose — like `config/tiers.ts`, it must be importable
 * from the backend, the eval script, and (potentially) the browser without
 * pulling a validation library into the bundle.
 */

export type IssueSeverity = 'error' | 'warning';

export interface SchemaIssue {
  severity: IssueSeverity;
  /** Dotted path into the object, e.g. 'recruiterPanel.phoneScreenGuide[1].question' */
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: SchemaIssue[];
  warnings: SchemaIssue[];
}

// ---------------------------------------------------------------------------
// primitives
// ---------------------------------------------------------------------------

const LEVELS = ['primary', 'secondary', 'minor'];
const SENIORITY = ['junior', 'mid', 'senior', 'staff', 'principal'];
const COLLABORATION = ['high', 'medium', 'low', 'solo'];
const PERSONAS = ['working_professional', 'fresher_builder', 'open_source_contributor', 'specialist'];
const COMMIT_QUALITY = ['excellent', 'good', 'average', 'poor'];
const CONSISTENCY = ['daily', 'regular', 'sporadic', 'burst'];
const CLAIM_STATUS = ['verified', 'production_observed', 'unverified_probe'];
const EVIDENCE_SOURCE = ['github_code', 'live_production', 'ecosystem', 'none'];
const REQ_STATUS = ['met', 'partially_met', 'gap_probe'];
const REQ_VERDICT = ['strong_match', 'qualified_with_probes', 'high_gap_risk'];

class Issues {
  readonly list: SchemaIssue[] = [];

  error(path: string, message: string) {
    this.list.push({ severity: 'error', path, message });
  }

  warn(path: string, message: string) {
    this.list.push({ severity: 'warning', path, message });
  }

  result(): ValidationResult {
    const errors = this.list.filter((i) => i.severity === 'error');
    return { ok: errors.length === 0, errors, warnings: this.list.filter((i) => i.severity === 'warning') };
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function checkString(iss: Issues, path: string, v: unknown, opts: { min?: number } = {}): string | null {
  if (typeof v !== 'string') {
    iss.error(path, `expected string, got ${v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v}`);
    return null;
  }
  if (v.trim().length === 0) {
    iss.error(path, 'must not be empty');
    return null;
  }
  if (opts.min && v.trim().length < opts.min) {
    iss.warn(path, `only ${v.trim().length} chars — suspiciously thin for a profile field`);
  }
  return v;
}

function checkNullableString(iss: Issues, path: string, v: unknown): void {
  if (v === null || v === undefined) return;
  if (typeof v !== 'string') {
    iss.error(path, `expected string or null, got ${typeof v}`);
  }
}

function checkNumber(iss: Issues, path: string, v: unknown, opts: { min?: number; max?: number } = {}): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    iss.error(path, `expected number, got ${v === null ? 'null' : typeof v}`);
    return null;
  }
  if (opts.min !== undefined && v < opts.min) iss.error(path, `must be >= ${opts.min}, got ${v}`);
  if (opts.max !== undefined && v > opts.max) iss.error(path, `must be <= ${opts.max}, got ${v}`);
  return v;
}

function checkBoolean(iss: Issues, path: string, v: unknown): void {
  if (typeof v !== 'boolean') iss.error(path, `expected boolean, got ${v === null ? 'null' : typeof v}`);
}

function checkEnum(iss: Issues, path: string, v: unknown, allowed: string[]): void {
  if (typeof v !== 'string' || !allowed.includes(v)) {
    iss.error(path, `expected one of [${allowed.join(', ')}], got ${JSON.stringify(v)}`);
  }
}

function checkStringArray(
  iss: Issues,
  path: string,
  v: unknown,
  opts: { exact?: number; min?: number; max?: number; itemMin?: number } = {}
): void {
  if (!Array.isArray(v)) {
    iss.error(path, `expected array, got ${v === null ? 'null' : typeof v}`);
    return;
  }
  v.forEach((item, i) => checkString(iss, `${path}[${i}]`, item, { min: opts.itemMin }));
  if (opts.exact !== undefined && v.length !== opts.exact) {
    iss.warn(path, `expected exactly ${opts.exact} items, got ${v.length}`);
  }
  if (opts.min !== undefined && v.length < opts.min) {
    iss.warn(path, `expected at least ${opts.min} items, got ${v.length}`);
  }
  if (opts.max !== undefined && v.length > opts.max) {
    iss.warn(path, `expected at most ${opts.max} items, got ${v.length}`);
  }
}

function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// sections
// ---------------------------------------------------------------------------

function validateExpertise(iss: Issues, v: unknown): void {
  if (!Array.isArray(v)) {
    iss.error('expertise', `expected array, got ${v === null ? 'null' : typeof v}`);
    return;
  }
  if (v.length === 0) iss.error('expertise', 'must not be empty');
  if (v.length > 8) iss.warn('expertise', `${v.length} entries — prompt asks for the top languages only`);

  v.forEach((item, i) => {
    const p = `expertise[${i}]`;
    if (!isPlainObject(item)) {
      iss.error(p, `expected object, got ${typeof item}`);
      return;
    }
    checkString(iss, `${p}.language`, item.language);
    checkEnum(iss, `${p}.level`, item.level, LEVELS);
    checkString(iss, `${p}.evidence`, item.evidence, { min: 10 });
    if (item.percentage === undefined) {
      iss.warn(`${p}.percentage`, 'missing — anti-hallucination rule requires exact LANGUAGES percentages');
    } else {
      checkNumber(iss, `${p}.percentage`, item.percentage, { min: 0, max: 100 });
    }
  });
}

function validateOpenSourceImpact(iss: Issues, v: unknown): void {
  if (!isPlainObject(v)) {
    iss.error('openSourceImpact', `expected object, got ${v === null ? 'null' : typeof v}`);
    return;
  }
  checkString(iss, 'openSourceImpact.narrative', v.narrative, { min: 20 });
  if (!Array.isArray(v.topRepos)) {
    iss.error('openSourceImpact.topRepos', `expected array, got ${typeof v.topRepos}`);
    return;
  }
  if (v.topRepos.length === 0) iss.warn('openSourceImpact.topRepos', 'empty — prompt asks for 3-5 repos');
  v.topRepos.forEach((repo, i) => {
    const p = `openSourceImpact.topRepos[${i}]`;
    if (!isPlainObject(repo)) {
      iss.error(p, `expected object, got ${typeof repo}`);
      return;
    }
    checkString(iss, `${p}.name`, repo.name);
    checkString(iss, `${p}.description`, repo.description);
    checkNumber(iss, `${p}.stars`, repo.stars, { min: 0 });
    checkString(iss, `${p}.language`, repo.language);
    if (typeof repo.url === 'string' && repo.url.length > 0 && !isHttpUrl(repo.url)) {
      iss.warn(`${p}.url`, `not an http(s) URL: ${repo.url}`);
    } else if (repo.url === undefined || repo.url === null || repo.url === '') {
      iss.warn(`${p}.url`, 'missing');
    }
    checkString(iss, `${p}.why`, repo.why, { min: 5 });
  });
}

function validateWebPresence(iss: Issues, v: unknown): void {
  if (!isPlainObject(v)) {
    iss.error('webPresence', `expected object, got ${v === null ? 'null' : typeof v}`);
    return;
  }
  if (v.hackerNews !== null && v.hackerNews !== undefined) {
    if (typeof v.hackerNews !== 'string') {
      iss.error('webPresence.hackerNews', `expected string or null, got ${typeof v.hackerNews}`);
    } else if (!isHttpUrl(v.hackerNews)) {
      // The classic model slip: putting "9204 mentions" in the URL field.
      iss.error('webPresence.hackerNews', `must be a URL or null, got ${JSON.stringify(v.hackerNews)}`);
    }
  }
  if (v.hackerNewsMentions !== null && v.hackerNewsMentions !== undefined) {
    checkNumber(iss, 'webPresence.hackerNewsMentions', v.hackerNewsMentions, { min: 0 });
  }
  checkNullableString(iss, 'webPresence.blog', v.blog);
  checkNullableString(iss, 'webPresence.other', v.other);
}

function validateRecruiterPanel(iss: Issues, v: unknown): void {
  if (!isPlainObject(v)) {
    iss.error('recruiterPanel', `expected object, got ${v === null ? 'null' : typeof v}`);
    return;
  }
  checkBoolean(iss, 'recruiterPanel.recentlyActive', v.recentlyActive);
  checkNumber(iss, 'recruiterPanel.daysSinceLastCommit', v.daysSinceLastCommit, { min: 0 });
  checkEnum(iss, 'recruiterPanel.seniorityEstimate', v.seniorityEstimate, SENIORITY);
  checkString(iss, 'recruiterPanel.seniorityReason', v.seniorityReason, { min: 10 });
  checkEnum(iss, 'recruiterPanel.collaborationLevel', v.collaborationLevel, COLLABORATION);
  checkEnum(iss, 'recruiterPanel.developerPersona', v.developerPersona, PERSONAS);
  checkString(iss, 'recruiterPanel.privateWorkContext', v.privateWorkContext, { min: 10 });
  checkStringArray(iss, 'recruiterPanel.standoutFacts', v.standoutFacts, { max: 5, itemMin: 5 });
  checkStringArray(iss, 'recruiterPanel.interviewTopics', v.interviewTopics, { exact: 3, itemMin: 5 });
  checkStringArray(iss, 'recruiterPanel.redFlags', v.redFlags, { max: 5 });
  checkEnum(iss, 'recruiterPanel.commitQuality', v.commitQuality, COMMIT_QUALITY);
  checkString(iss, 'recruiterPanel.commitStyleInsight', v.commitStyleInsight, { min: 10 });
  checkEnum(iss, 'recruiterPanel.consistencyPattern', v.consistencyPattern, CONSISTENCY);

  if (!Array.isArray(v.phoneScreenGuide)) {
    iss.error('recruiterPanel.phoneScreenGuide', `expected array, got ${typeof v.phoneScreenGuide}`);
  } else {
    if (v.phoneScreenGuide.length !== 3) {
      iss.warn(
        'recruiterPanel.phoneScreenGuide',
        `prompt requires EXACTLY 3 questions, got ${v.phoneScreenGuide.length}`
      );
    }
    v.phoneScreenGuide.forEach((q, i) => {
      const p = `recruiterPanel.phoneScreenGuide[${i}]`;
      if (!isPlainObject(q)) {
        iss.error(p, `expected object, got ${typeof q}`);
        return;
      }
      checkString(iss, `${p}.question`, q.question, { min: 10 });
      checkString(iss, `${p}.whatToListenFor`, q.whatToListenFor, { min: 10 });
      checkString(iss, `${p}.redFlagSignal`, q.redFlagSignal, { min: 10 });
    });
  }
}

function validateClaimEvidenceMatrix(iss: Issues, v: unknown): void {
  if (v === null || v === undefined) return; // optional field
  if (!Array.isArray(v)) {
    iss.error('claimEvidenceMatrix', `expected array, got ${typeof v}`);
    return;
  }
  if (v.length < 4 || v.length > 6) {
    iss.warn('claimEvidenceMatrix', `prompt asks for 4-6 items, got ${v.length}`);
  }
  v.forEach((item, i) => {
    const p = `claimEvidenceMatrix[${i}]`;
    if (!isPlainObject(item)) {
      iss.error(p, `expected object, got ${typeof item}`);
      return;
    }
    checkString(iss, `${p}.skill`, item.skill);
    checkEnum(iss, `${p}.status`, item.status, CLAIM_STATUS);
    checkEnum(iss, `${p}.evidenceSource`, item.evidenceSource, EVIDENCE_SOURCE);
    checkString(iss, `${p}.detail`, item.detail, { min: 10 });
    if (item.status === 'unverified_probe' && item.evidenceSource !== 'none') {
      iss.warn(`${p}.evidenceSource`, "unverified_probe should pair with evidenceSource 'none'");
    }
    if (item.status !== 'unverified_probe' && item.evidenceSource === 'none') {
      iss.warn(`${p}.evidenceSource`, "'none' evidence only makes sense for unverified_probe");
    }
  });
}

function validateRequisitionFit(iss: Issues, v: unknown): void {
  if (v === null || v === undefined) return; // null when no JD — by design
  if (!isPlainObject(v)) {
    iss.error('requisitionFit', `expected object or null, got ${typeof v}`);
    return;
  }
  checkString(iss, 'requisitionFit.roleTitle', v.roleTitle);
  checkNumber(iss, 'requisitionFit.matchScore', v.matchScore, { min: 0, max: 100 });
  checkEnum(iss, 'requisitionFit.verdict', v.verdict, REQ_VERDICT);
  checkString(iss, 'requisitionFit.summary', v.summary, { min: 20 });
  if (!Array.isArray(v.requirements)) {
    iss.error('requisitionFit.requirements', `expected array, got ${typeof v.requirements}`);
    return;
  }
  if (v.requirements.length < 3 || v.requirements.length > 6) {
    iss.warn('requisitionFit.requirements', `prompt asks for 3-6 requirements, got ${v.requirements.length}`);
  }
  v.requirements.forEach((r, i) => {
    const p = `requisitionFit.requirements[${i}]`;
    if (!isPlainObject(r)) {
      iss.error(p, `expected object, got ${typeof r}`);
      return;
    }
    checkString(iss, `${p}.requirement`, r.requirement);
    checkEnum(iss, `${p}.status`, r.status, REQ_STATUS);
    checkString(iss, `${p}.evidence`, r.evidence, { min: 5 });
  });
  if (v.customProbeQuestions !== undefined && v.customProbeQuestions !== null) {
    checkStringArray(iss, 'requisitionFit.customProbeQuestions', v.customProbeQuestions);
  }
}

// ---------------------------------------------------------------------------
// entrypoint
// ---------------------------------------------------------------------------

/**
 * Validates the synthesized profile section (the object the LLM produces —
 * also the top-level shape of an assembled DevProfile, minus the wrapper
 * fields this contract does not cover).
 */
export function validateProfileSynthesis(s: unknown): ValidationResult {
  const iss = new Issues();

  if (!isPlainObject(s)) {
    iss.error('$', `profile must be an object, got ${s === null ? 'null' : Array.isArray(s) ? 'array' : typeof s}`);
    return iss.result();
  }

  checkString(iss, 'headline', s.headline, { min: 15 });
  checkString(iss, 'summary', s.summary, { min: 80 });
  validateExpertise(iss, s.expertise);
  checkString(iss, 'techEvolution', s.techEvolution, { min: 30 });
  validateOpenSourceImpact(iss, s.openSourceImpact);
  checkString(iss, 'communicationStyle', s.communicationStyle, { min: 15 });
  validateWebPresence(iss, s.webPresence);
  checkStringArray(iss, 'strengths', s.strengths, { min: 3, max: 5, itemMin: 5 });
  checkStringArray(iss, 'growthAreas', s.growthAreas, { min: 2, max: 3, itemMin: 5 });
  validateRecruiterPanel(iss, s.recruiterPanel);
  validateClaimEvidenceMatrix(iss, s.claimEvidenceMatrix);
  validateRequisitionFit(iss, s.requisitionFit);

  return iss.result();
}

/** One-line-per-issue rendering for repair prompts and eval output. */
export function formatIssues(issues: SchemaIssue[]): string {
  return issues.map((i) => `- [${i.severity}] ${i.path}: ${i.message}`).join('\n');
}

/**
 * Compact verdict line for trace events / logs.
 * e.g. "schema ok (2 warnings)" or "schema INVALID: 3 errors, 1 warning"
 */
export function summarizeValidation(r: ValidationResult): string {
  if (r.ok && r.warnings.length === 0) return 'schema ok';
  if (r.ok) return `schema ok (${r.warnings.length} warning${r.warnings.length === 1 ? '' : 's'})`;
  return `schema INVALID: ${r.errors.length} error${r.errors.length === 1 ? '' : 's'}, ${r.warnings.length} warning${r.warnings.length === 1 ? '' : 's'}`;
}
