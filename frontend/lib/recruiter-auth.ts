/**
 * Recruiter Account & Session Persistence (RecruiterOS)
 * Manages recruiter profile settings, company workspace identity,
 * and user preferences for dedicated recruiter workspaces.
 */

export interface RecruiterAccount {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  avatarUrl: string;
  planTier: 'starter' | 'pro' | 'enterprise';
  department: string;
  preferences: {
    defaultMinimumFit: number;
    allowPrivateRepos: boolean;
    autoShortlistTopMatches: boolean;
    notifyOnNewApplication: boolean;
  };
  createdAt: string;
  lastActiveAt: string;
}

const RECRUITER_ACCOUNT_KEY = 'devscope_recruiter_account_v1';

export const DEFAULT_RECRUITER_ACCOUNT: RecruiterAccount = {
  id: 'rec_user_sarah_01',
  name: 'Sarah Chen',
  title: 'Lead Technical Talent Partner',
  company: 'Scale AI / Core Infrastructure',
  email: 'sarah.chen@scale.com',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  planTier: 'pro',
  department: 'Engineering Talent Acquisition',
  preferences: {
    defaultMinimumFit: 75,
    allowPrivateRepos: true,
    autoShortlistTopMatches: true,
    notifyOnNewApplication: true,
  },
  createdAt: '2026-08-15T00:00:00Z',
  lastActiveAt: new Date().toISOString(),
};

export function getRecruiterAccount(): RecruiterAccount {
  if (typeof window === 'undefined') return DEFAULT_RECRUITER_ACCOUNT;
  try {
    const raw = localStorage.getItem(RECRUITER_ACCOUNT_KEY);
    if (!raw) {
      localStorage.setItem(RECRUITER_ACCOUNT_KEY, JSON.stringify(DEFAULT_RECRUITER_ACCOUNT));
      return DEFAULT_RECRUITER_ACCOUNT;
    }
    const parsed = JSON.parse(raw);
    return parsed && parsed.id ? { ...DEFAULT_RECRUITER_ACCOUNT, ...parsed } : DEFAULT_RECRUITER_ACCOUNT;
  } catch {
    return DEFAULT_RECRUITER_ACCOUNT;
  }
}

export function saveRecruiterAccount(updates: Partial<RecruiterAccount>): RecruiterAccount {
  const current = getRecruiterAccount();
  const updated: RecruiterAccount = {
    ...current,
    ...updates,
    preferences: {
      ...current.preferences,
      ...(updates.preferences || {}),
    },
    lastActiveAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(RECRUITER_ACCOUNT_KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  }
  return updated;
}

export function resetToDefaultRecruiterAccount(): RecruiterAccount {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(RECRUITER_ACCOUNT_KEY, JSON.stringify(DEFAULT_RECRUITER_ACCOUNT));
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_RECRUITER_ACCOUNT;
}
