export interface ExpertiseItem {
  language: string;
  level: 'primary' | 'secondary' | 'minor';
  evidence: string;
  percentage?: number;
}

export interface RepoHighlight {
  name: string;
  description: string;
  stars: number;
  language: string;
  url: string;
  why: string;
}

export interface PhoneScreenQuestion {
  question: string;
  whatToListenFor: string;
  redFlagSignal: string;
}

export interface DevProfile {
  username: string;
  generatedAt: string;
  cacheVersion: number;

  github: {
    name: string;
    avatarUrl: string;
    bio: string | null;
    company: string | null;
    location: string | null;
    websiteUrl: string | null;
    followers: number;
    following: number;
    publicRepos: number;
    joinedYear: number;
    totalStars: number;
    totalForks: number;
  };

  headline: string;
  summary: string;
  expertise: ExpertiseItem[];
  techEvolution: string;
  openSourceImpact: {
    narrative: string;
    topRepos: RepoHighlight[];
  };
  communicationStyle: string;
  webPresence: {
    hackerNews: string | null;
    hackerNewsMentions?: number;
    blog: string | null;
    other: string | null;
  };
  strengths: string[];
  growthAreas: string[];
  recruiterPanel?: {
    recentlyActive: boolean;
    daysSinceLastCommit: number;
    seniorityEstimate: 'junior' | 'mid' | 'senior' | 'staff' | 'principal';
    seniorityReason: string;
    collaborationLevel: 'high' | 'medium' | 'low' | 'solo';
    standoutFacts: string[];
    interviewTopics: string[];
    redFlags: string[];
    commitQuality: 'excellent' | 'good' | 'average' | 'poor';
    commitStyleInsight: string;
    consistencyPattern: 'daily' | 'regular' | 'sporadic' | 'burst';
    developerPersona?: 'working_professional' | 'fresher_builder' | 'open_source_contributor' | 'specialist';
    privateWorkContext?: string;
    phoneScreenGuide?: PhoneScreenQuestion[];
  };

  liveAppAudit?: LiveAppAudit;
  claimEvidenceMatrix?: ClaimEvidenceItem[];
}

export interface LiveAppAudit {
  url: string;
  finalUrl: string;
  status: number;
  isLive: boolean;
  responseTimeMs: number;
  speedRating: 'fast' | 'moderate' | 'slow';
  title: string | null;
  description: string | null;
  hostingPlatform: string | null;
  detectedStack: {
    framework?: string;
    styling?: string[];
    toolsAndLibraries?: string[];
    backendSignals?: string[];
  };
  productionStandards: {
    httpsEnforced: boolean;
    mobileResponsive: boolean;
    hasSeoMeta: boolean;
    hasSecurityHeaders: boolean;
  };
  architectureSummary: string;
}

export interface ClaimEvidenceItem {
  skill: string;
  status: 'verified' | 'production_observed' | 'unverified_probe';
  evidenceSource: 'github_code' | 'live_production' | 'ecosystem' | 'none';
  detail: string;
}

export type TraceEventType = 'tool_call' | 'tool_result' | 'thinking' | 'complete' | 'error';

export interface TraceEvent {
  type: TraceEventType;
  timestamp: string;
  tool?: string;
  input?: Record<string, unknown>;
  summary?: string;
  thinking?: string;
  profile?: DevProfile;
  message?: string;
  technicalDetails?: string;
  cached?: boolean;
}
