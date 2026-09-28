/**
 * Translates low-level internal exceptions (Axios status codes, LLM provider exhaustion,
 * token expirations, timeouts) into clear, professional, human-friendly messages
 * suitable for recruiters and hiring managers, while preserving raw diagnostics for debugging.
 */

export interface SanitizedError {
  userMessage: string;
  technicalDetails?: string;
  canRetry: boolean;
}

export function sanitizeErrorMessage(err: any, username: string): SanitizedError {
  const raw = String(err?.message || err || '');
  const status = err?.response?.status;

  // 1. LLM Provider Exhaustion / Rate Limits
  if (
    raw.includes('All LLM providers exhausted') ||
    raw.includes('rate_limited') ||
    raw.includes('429') ||
    raw.includes('quota')
  ) {
    return {
      userMessage:
        'All AI synthesis engines are currently at peak capacity or experiencing temporary rate limits. Please wait 30 seconds and retry.',
      technicalDetails: raw,
      canRetry: true,
    };
  }

  // 2. GitHub Token / Authentication (401 / 403 / 409)
  if (status === 401 || raw.includes('Bad credentials') || raw.includes('401')) {
    return {
      userMessage:
        'The GitHub API authentication token is invalid or expired. The server administrator needs to refresh the GITHUB_TOKEN.',
      technicalDetails: raw,
      canRetry: false,
    };
  }

  if (status === 403 || raw.includes('rate limit') || raw.includes('API rate limit')) {
    return {
      userMessage:
        'GitHub API public rate limit reached. Please wait a minute before retrying, or configure an authenticated GitHub token.',
      technicalDetails: raw,
      canRetry: true,
    };
  }

  if (status === 404 || raw.includes('GitHub user not found') || raw.includes('404')) {
    return {
      userMessage: `Candidate handle "@${username}" was not found on GitHub. Please check the spelling of the username.`,
      technicalDetails: raw,
      canRetry: false,
    };
  }

  if (status === 409 || raw.includes('409') || raw.includes('Git Repository is empty')) {
    return {
      userMessage: `GitHub reported an empty repository or commit tree conflict for "@${username}". Analysis could not retrieve sufficient commit history.`,
      technicalDetails: raw,
      canRetry: true,
    };
  }

  // 3. Network Timeouts
  if (err?.code === 'ECONNABORTED' || raw.includes('timeout') || raw.includes('ETIMEDOUT') || raw.includes('ECONNRESET')) {
    return {
      userMessage:
        'The request timed out while contacting upstream services. Free-tier cloud instances may be cold-starting. Please retry.',
      technicalDetails: raw,
      canRetry: true,
    };
  }

  // 4. Default fallback
  return {
    userMessage: 'An unexpected issue occurred while analyzing this candidate profile. Please retry in a few moments.',
    technicalDetails: raw,
    canRetry: true,
  };
}
