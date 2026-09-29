/**
 * Job Projects & Guardrails Persistence Engine (RecruiterOS)
 * Manages multi-role recruiting workspaces, custom hiring guardrails,
 * and dedicated candidate pipelines per open requisition.
 */

export type SeniorityTarget = 'junior' | 'mid' | 'senior' | 'staff' | 'principal';
export type JobStatus = 'active' | 'paused' | 'filled' | 'archived';
export type CandidateVerdict = 'strong_match' | 'qualified_with_probes' | 'high_gap_risk';
export type PipelineStage = 'new_assessed' | 'phone_screen_scheduled' | 'interviewing' | 'offer' | 'archived';

export interface JobCandidateRecord {
  id: string;
  jobId: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  liveUrl?: string;
  evaluatedAt: string;
  fitScore: number;
  verdict: CandidateVerdict;
  seniorityEstimate: SeniorityTarget;
  persona: string;
  signalConfidence: number;
  requirementsSummary: {
    metCount: number;
    partialCount: number;
    missingCount: number;
  };
  recruiterNotes?: string;
  pipelineStage: PipelineStage;
  starRating?: number; // 1-5
}

export interface JobRequisitionData {
  rawJdText: string;
  seniorityTarget: SeniorityTarget;
  minYearsExperience: number;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  allowPrivateRepos: boolean;
}

export interface JobGuardrails {
  minimumFitScoreThreshold: number;
  flagAIGeneratedRepos: boolean;
  flagLowTenureChurn: boolean;
  customInterviewProbes: string[];
}

export interface JobProject {
  id: string;
  title: string;
  department: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  requisition: JobRequisitionData;
  guardrails: JobGuardrails;
  candidates: JobCandidateRecord[];
}

const STORAGE_KEY = 'devscope_job_projects_v3';
const ACTIVE_JOB_KEY = 'devscope_active_job_id_v3';

export const DEFAULT_JOB_PROJECTS: JobProject[] = [
  {
    id: 'job_staff_go_infra',
    title: 'Staff Distributed Systems Engineer',
    department: 'Core Infrastructure & APIs',
    status: 'active',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-28T12:00:00Z',
    requisition: {
      rawJdText: `Staff Distributed Systems Engineer

About the Role:
We are hiring a Staff Systems Engineer to design high-throughput data processing pipelines, distributed consensus services, and low-latency microservices.

Responsibilities:
• Architect, build, and maintain production Go microservices handling 100k+ req/sec.
• Design Kafka event streaming topologies and fault-tolerant distributed caching architectures.
• Drive database performance tuning, horizontal partitioning, and query optimization on PostgreSQL.
• Champion reliability, automated canary deployments, and observability standards.

Requirements:
• 6+ years professional backend systems engineering experience (Go or Rust).
• Deep knowledge of distributed systems, concurrency primitives, and event-driven architecture (Kafka/Pulsar).
• Hands-on production experience with container orchestration (Kubernetes) and cloud infra.
• Track record of enterprise architectural leadership. Working professional contributions in private corporate repos welcome.`,
      seniorityTarget: 'staff',
      minYearsExperience: 6,
      mustHaveSkills: ['Go', 'Kafka', 'Distributed Systems', 'PostgreSQL', 'Concurrency'],
      niceToHaveSkills: ['Kubernetes', 'Redis', 'Docker', 'gRPC'],
      allowPrivateRepos: true,
    },
    guardrails: {
      minimumFitScoreThreshold: 75,
      flagAIGeneratedRepos: true,
      flagLowTenureChurn: true,
      customInterviewProbes: [
        'Explain how you prevent consumer lag spikes during partition rebalancing in Kafka.',
        'Describe a scenario where distributed lock contention caused deadlocks and how you resolved it.',
      ],
    },
    candidates: [
      {
        id: 'cand_mitchellh_01',
        jobId: 'job_staff_go_infra',
        username: 'mitchellh',
        fullName: 'Mitchell Hashimoto',
        avatarUrl: 'https://github.com/mitchellh.png',
        liveUrl: 'https://mitchellh.com',
        evaluatedAt: '2026-09-28T14:30:00Z',
        fitScore: 96,
        verdict: 'strong_match',
        seniorityEstimate: 'principal',
        persona: 'working_professional',
        signalConfidence: 98,
        requirementsSummary: { metCount: 5, partialCount: 0, missingCount: 0 },
        recruiterNotes: 'Creator of Terraform & Ghostty. Unmatched distributed systems mastery and enterprise Go architecture depth.',
        pipelineStage: 'interviewing',
        starRating: 5,
      },
      {
        id: 'cand_tj_01',
        jobId: 'job_staff_go_infra',
        username: 'tj',
        fullName: 'TJ Holowaychuk',
        avatarUrl: 'https://github.com/tj.png',
        liveUrl: '',
        evaluatedAt: '2026-09-27T10:15:00Z',
        fitScore: 92,
        verdict: 'strong_match',
        seniorityEstimate: 'principal',
        persona: 'open_source_contributor',
        signalConfidence: 96,
        requirementsSummary: { metCount: 5, partialCount: 0, missingCount: 0 },
        recruiterNotes: 'Exceptional systems background. World-class Go code and distributed architectural depth.',
        pipelineStage: 'phone_screen_scheduled',
        starRating: 5,
      },
      {
        id: 'cand_antirez_01',
        jobId: 'job_staff_go_infra',
        username: 'antirez',
        fullName: 'Salvatore Sanfilippo',
        avatarUrl: 'https://github.com/antirez.png',
        liveUrl: 'http://invece.org',
        evaluatedAt: '2026-09-28T16:00:00Z',
        fitScore: 86,
        verdict: 'qualified_with_probes',
        seniorityEstimate: 'principal',
        persona: 'open_source_contributor',
        signalConfidence: 95,
        requirementsSummary: { metCount: 4, partialCount: 1, missingCount: 0 },
        recruiterNotes: 'Redis author. World-renowned low-latency and systems internals; probe Go microservices and Kafka familiarity.',
        pipelineStage: 'new_assessed',
        starRating: 4,
      },
      {
        id: 'cand_jesseduffield_01',
        jobId: 'job_staff_go_infra',
        username: 'jesseduffield',
        fullName: 'Jesse Duffield',
        avatarUrl: 'https://github.com/jesseduffield.png',
        liveUrl: '',
        evaluatedAt: '2026-09-28T18:20:00Z',
        fitScore: 78,
        verdict: 'qualified_with_probes',
        seniorityEstimate: 'senior',
        persona: 'open_source_contributor',
        signalConfidence: 89,
        requirementsSummary: { metCount: 3, partialCount: 2, missingCount: 0 },
        recruiterNotes: 'Author of Lazygit. High quality Go terminal tools; test large-scale distributed consensus experience.',
        pipelineStage: 'new_assessed',
        starRating: 3,
      },
    ],
  },
  {
    id: 'job_senior_fullstack_prod',
    title: 'Senior Full-Stack Engineer',
    department: 'Core Product Team',
    status: 'active',
    createdAt: '2026-09-05T00:00:00Z',
    updatedAt: '2026-09-28T14:00:00Z',
    requisition: {
      rawJdText: `Senior Full-Stack Engineer

About the Role:
We are seeking a Senior Full-Stack Engineer to build modern, performant web applications using Next.js, React, TypeScript, and relational databases.

Responsibilities:
• Architect, build, and maintain production features using Next.js (App Router), React, and TypeScript.
• Design robust SQL database schemas and REST / serverless backend endpoints.
• Ensure web performance, accessibility, responsive UI, and optimal Core Web Vitals.
• Lead code reviews and champion engineering best practices.

Requirements:
• 4+ years of professional full-stack web development experience.
• Proficient with Next.js, TypeScript, React, and PostgreSQL.
• Prior experience in fast-paced product environments. Working professional history in private repos welcome.`,
      seniorityTarget: 'senior',
      minYearsExperience: 4,
      mustHaveSkills: ['Next.js', 'React', 'TypeScript', 'PostgreSQL', 'Tailwind CSS'],
      niceToHaveSkills: ['GraphQL', 'Docker', 'Vercel', 'Prisma / Drizzle'],
      allowPrivateRepos: true,
    },
    guardrails: {
      minimumFitScoreThreshold: 70,
      flagAIGeneratedRepos: true,
      flagLowTenureChurn: false,
      customInterviewProbes: [
        'How do you manage client-side state transitions alongside Next.js Server Actions and React Server Components?',
        'Describe your approach to eliminating cumulative layout shifts (CLS) on heavy dynamic dashboards.',
      ],
    },
    candidates: [
      {
        id: 'cand_shadcn_01',
        jobId: 'job_senior_fullstack_prod',
        username: 'shadcn',
        fullName: 'shadcn',
        avatarUrl: 'https://github.com/shadcn.png',
        liveUrl: 'https://ui.shadcn.com',
        evaluatedAt: '2026-09-28T11:00:00Z',
        fitScore: 94,
        verdict: 'strong_match',
        seniorityEstimate: 'staff',
        persona: 'working_professional',
        signalConfidence: 96,
        requirementsSummary: { metCount: 5, partialCount: 0, missingCount: 0 },
        recruiterNotes: 'Creator of shadcn/ui. Absolute top-tier UI component architecture, Tailwind CSS, and Next.js craft.',
        pipelineStage: 'offer',
        starRating: 5,
      },
      {
        id: 'cand_leerob_01',
        jobId: 'job_senior_fullstack_prod',
        username: 'leerob',
        fullName: 'Lee Robinson',
        avatarUrl: 'https://github.com/leerob.png',
        liveUrl: 'https://leerob.io',
        evaluatedAt: '2026-09-28T12:15:00Z',
        fitScore: 91,
        verdict: 'strong_match',
        seniorityEstimate: 'staff',
        persona: 'working_professional',
        signalConfidence: 95,
        requirementsSummary: { metCount: 5, partialCount: 0, missingCount: 0 },
        recruiterNotes: 'VP of Product / DX at Vercel. Deep Next.js App Router and full-stack performance mastery.',
        pipelineStage: 'interviewing',
        starRating: 5,
      },
      {
        id: 'cand_gaearon_01',
        jobId: 'job_senior_fullstack_prod',
        username: 'gaearon',
        fullName: 'Dan Abramov',
        avatarUrl: 'https://github.com/gaearon.png',
        liveUrl: 'https://overreacted.io',
        evaluatedAt: '2026-09-28T09:30:00Z',
        fitScore: 89,
        verdict: 'strong_match',
        seniorityEstimate: 'staff',
        persona: 'working_professional',
        signalConfidence: 94,
        requirementsSummary: { metCount: 4, partialCount: 1, missingCount: 0 },
        recruiterNotes: 'Deep React / Next.js ecosystem author. Shipped overreacted.io demo audited. Strong shortlist.',
        pipelineStage: 'interviewing',
        starRating: 5,
      },
    ],
  },
  {
    id: 'job_frontend_design_systems',
    title: 'Frontend UI/UX Architect',
    department: 'Design Systems & Platform',
    status: 'active',
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-28T16:00:00Z',
    requisition: {
      rawJdText: `Frontend UI/UX Architect

About the Role:
We are hiring a Frontend Architect to own our web application architecture, design system implementation, and performance standards.

Responsibilities:
• Lead frontend architecture and reusable component library development.
• Enforce high performance standards (sub-second TTFB, smooth 60fps micro-animations).
• Standardize accessible, responsive UI patterns across multi-functional engineering teams.

Requirements:
• 5+ years of specialized frontend engineering with React, Next.js, and TypeScript.
• Proven track record building or maintaining reusable design systems (Radix, Tailwind, shadcn).
• Deep expertise in browser rendering pipelines, bundle analysis, and client-side performance.`,
      seniorityTarget: 'senior',
      minYearsExperience: 5,
      mustHaveSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Design Systems', 'Performance'],
      niceToHaveSkills: ['Radix UI', 'Framer Motion', 'Webpack/Vite', 'Accessibility'],
      allowPrivateRepos: true,
    },
    guardrails: {
      minimumFitScoreThreshold: 75,
      flagAIGeneratedRepos: true,
      flagLowTenureChurn: true,
      customInterviewProbes: [
        'How do you enforce accessible focus trapping and keyboard navigation across complex modal dialogs?',
      ],
    },
    candidates: [
      {
        id: 'cand_developit_01',
        jobId: 'job_frontend_design_systems',
        username: 'developit',
        fullName: 'Jason Miller',
        avatarUrl: 'https://github.com/developit.png',
        liveUrl: 'https://jasonformat.com',
        evaluatedAt: '2026-09-28T15:00:00Z',
        fitScore: 90,
        verdict: 'strong_match',
        seniorityEstimate: 'staff',
        persona: 'open_source_contributor',
        signalConfidence: 94,
        requirementsSummary: { metCount: 5, partialCount: 0, missingCount: 0 },
        recruiterNotes: 'Creator of Preact. Unrivaled browser rendering optimization and lightweight design systems expertise.',
        pipelineStage: 'phone_screen_scheduled',
        starRating: 5,
      },
    ],
  },
];

export function getJobProjects(): JobProject[] {
  if (typeof window === 'undefined') return DEFAULT_JOB_PROJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_JOB_PROJECTS));
      return DEFAULT_JOB_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_JOB_PROJECTS;
  } catch {
    return DEFAULT_JOB_PROJECTS;
  }
}

export function getJobProjectById(id: string): JobProject | null {
  const all = getJobProjects();
  return all.find((p) => p.id === id) || null;
}

export function saveJobProject(project: Partial<JobProject> & { title: string }): JobProject {
  const all = getJobProjects();
  const now = new Date().toISOString();
  const id = project.id || `job_proj_${Date.now()}`;

  const existingIndex = all.findIndex((p) => p.id === id);
  const existing = existingIndex >= 0 ? all[existingIndex] : null;

  const updatedProject: JobProject = {
    id,
    title: project.title.trim(),
    department: project.department?.trim() || existing?.department || 'Engineering',
    status: project.status || existing?.status || 'active',
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
    requisition: {
      rawJdText: project.requisition?.rawJdText || existing?.requisition.rawJdText || '',
      seniorityTarget: project.requisition?.seniorityTarget || existing?.requisition.seniorityTarget || 'senior',
      minYearsExperience: project.requisition?.minYearsExperience ?? existing?.requisition.minYearsExperience ?? 4,
      mustHaveSkills: project.requisition?.mustHaveSkills || existing?.requisition.mustHaveSkills || [],
      niceToHaveSkills: project.requisition?.niceToHaveSkills || existing?.requisition.niceToHaveSkills || [],
      allowPrivateRepos: project.requisition?.allowPrivateRepos ?? existing?.requisition.allowPrivateRepos ?? true,
    },
    guardrails: {
      minimumFitScoreThreshold: project.guardrails?.minimumFitScoreThreshold ?? existing?.guardrails.minimumFitScoreThreshold ?? 70,
      flagAIGeneratedRepos: project.guardrails?.flagAIGeneratedRepos ?? existing?.guardrails.flagAIGeneratedRepos ?? true,
      flagLowTenureChurn: project.guardrails?.flagLowTenureChurn ?? existing?.guardrails.flagLowTenureChurn ?? true,
      customInterviewProbes: project.guardrails?.customInterviewProbes || existing?.guardrails.customInterviewProbes || [],
    },
    candidates: existing ? existing.candidates : (project.candidates || []),
  };

  let newList: JobProject[];
  if (existingIndex >= 0) {
    newList = [...all];
    newList[existingIndex] = updatedProject;
  } else {
    newList = [updatedProject, ...all];
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch {
      /* ignore */
    }
  }
  return updatedProject;
}

export function deleteJobProject(id: string): void {
  const all = getJobProjects();
  const filtered = all.filter((p) => p.id !== id);
  const finalList = filtered.length > 0 ? filtered : DEFAULT_JOB_PROJECTS;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalList));
    } catch {
      /* ignore */
    }
  }
}

export function getActiveJobProjectId(): string {
  if (typeof window === 'undefined') return DEFAULT_JOB_PROJECTS[0].id;
  try {
    const saved = localStorage.getItem(ACTIVE_JOB_KEY);
    return saved || DEFAULT_JOB_PROJECTS[0].id;
  } catch {
    return DEFAULT_JOB_PROJECTS[0].id;
  }
}

export function setActiveJobProjectId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_JOB_KEY, id);
  } catch {
    /* ignore */
  }
}

export function addCandidateToProject(
  jobId: string,
  candidate: Omit<JobCandidateRecord, 'id' | 'jobId' | 'evaluatedAt'>
): JobCandidateRecord {
  const all = getJobProjects();
  const project = all.find((p) => p.id === jobId);
  if (!project) throw new Error(`Job project ${jobId} not found`);

  const candId = `cand_${candidate.username}_${Date.now()}`;
  const newRecord: JobCandidateRecord = {
    ...candidate,
    id: candId,
    jobId,
    evaluatedAt: new Date().toISOString(),
  };

  // Remove previous entry for same candidate in this job if exists
  const updatedCandidates = [
    newRecord,
    ...project.candidates.filter((c) => c.username.toLowerCase() !== candidate.username.toLowerCase()),
  ];

  project.candidates = updatedCandidates;
  project.updatedAt = new Date().toISOString();

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      /* ignore */
    }
  }
  return newRecord;
}

export function updateCandidateInProject(
  jobId: string,
  candidateId: string,
  updates: Partial<JobCandidateRecord>
): void {
  const all = getJobProjects();
  const project = all.find((p) => p.id === jobId);
  if (!project) return;

  const idx = project.candidates.findIndex((c) => c.id === candidateId);
  if (idx >= 0) {
    project.candidates[idx] = { ...project.candidates[idx], ...updates };
    project.updatedAt = new Date().toISOString();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      } catch {
        /* ignore */
      }
    }
  }
}

export function removeCandidateFromProject(jobId: string, candidateId: string): void {
  const all = getJobProjects();
  const project = all.find((p) => p.id === jobId);
  if (!project) return;

  project.candidates = project.candidates.filter((c) => c.id !== candidateId);
  project.updatedAt = new Date().toISOString();

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      /* ignore */
    }
  }
}

export function batchUpdateCandidatesStage(
  jobId: string,
  candidateIds: string[],
  stage: PipelineStage
): void {
  const all = getJobProjects();
  const project = all.find((p) => p.id === jobId);
  if (!project) return;

  const idSet = new Set(candidateIds);
  let changed = false;
  project.candidates = project.candidates.map((cand) => {
    if (idSet.has(cand.id)) {
      changed = true;
      return { ...cand, pipelineStage: stage };
    }
    return cand;
  });

  if (changed) {
    project.updatedAt = new Date().toISOString();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      } catch {
        /* ignore */
      }
    }
  }
}

export function generateCandidateSlackBrief(
  project: JobProject,
  candidate: JobCandidateRecord
): string {
  const stageLabels: Record<PipelineStage, string> = {
    new_assessed: 'New Assessed',
    phone_screen_scheduled: 'Phone Screen Scheduled',
    interviewing: 'Interviewing',
    offer: 'Offer Stage',
    archived: 'Archived',
  };

  const stars = candidate.starRating ? '⭐'.repeat(candidate.starRating) : 'Not rated';
  const verdictEmoji =
    candidate.verdict === 'strong_match' ? '🟢' : candidate.verdict === 'qualified_with_probes' ? '🟡' : '🔴';

  return `*DevScope Candidate Brief: @${candidate.username}*
*Role:* ${project.title} (${project.department})
*Match Score:* ${candidate.fitScore}% ${verdictEmoji} (${candidate.verdict.replace(/_/g, ' ').toUpperCase()})
*Seniority:* ${candidate.seniorityEstimate.toUpperCase()} (Target: ${project.requisition.seniorityTarget.toUpperCase()})
*Pipeline Stage:* ${stageLabels[candidate.pipelineStage]} | *Rating:* ${stars}
*Requirements:* ${candidate.requirementsSummary.metCount} Met · ${candidate.requirementsSummary.partialCount} Partial · ${candidate.requirementsSummary.missingCount} Missing
*Must-Haves Audited:* ${project.requisition.mustHaveSkills.join(', ')}

*Recruiter Evaluation Notes:*
> ${candidate.recruiterNotes || 'No notes entered yet.'}

*Calibrated Phone-Screen Probes for Hiring Team:*
${project.guardrails.customInterviewProbes.map((probe, i) => `${i + 1}. ${probe}`).join('\n')}

_Dossier audited via DevScope RecruiterOS_`;
}

export function exportPipelineToMarkdown(project: JobProject): string {
  const lines: string[] = [
    `# Pipeline Leaderboard: ${project.title}`,
    `**Department:** ${project.department} | **Target Seniority:** ${project.requisition.seniorityTarget.toUpperCase()}`,
    `**Must-Have Skills:** ${project.requisition.mustHaveSkills.join(', ')}`,
    `**Total Evaluated:** ${project.candidates.length} candidate(s)`,
    '',
    '| Rank | Candidate | Fit Score | Seniority | Stage | Rating | Notes |',
    '| :--- | :--- | :---: | :---: | :--- | :---: | :--- |',
  ];

  const sorted = [...project.candidates].sort((a, b) => b.fitScore - a.fitScore);
  sorted.forEach((cand, idx) => {
    const stars = cand.starRating ? '★'.repeat(cand.starRating) : '-';
    lines.push(
      `| #${idx + 1} | [@${cand.username}](https://github.com/${cand.username}) | **${cand.fitScore}%** | ${cand.seniorityEstimate} | ${cand.pipelineStage} | ${stars} | ${cand.recruiterNotes || '-'} |`
    );
  });

  lines.push('');
  lines.push('---');
  lines.push('*Generated via DevScope RecruiterOS*');
  return lines.join('\n');
}

