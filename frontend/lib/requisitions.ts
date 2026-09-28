/**
 * Saved Requisitions & Roles Management Engine
 * Provides client-side persistence (LocalStorage) and pre-configured technical roles,
 * allowing recruiters to screen candidates against a Job Description without repeatedly copy-pasting.
 */

export interface SavedRequisition {
  id: string;
  title: string;
  company: string;
  createdAt: string;
  updatedAt: string;
  rawJdText: string;
  coreStack: string[];
  seniorityMinYears: number;
  allowPrivateRepos: boolean;
}

const STORAGE_KEY = 'devscope_saved_requisitions_v1';
const ACTIVE_ROLE_KEY = 'devscope_active_role_id_v1';

export const DEFAULT_REQUISITIONS: SavedRequisition[] = [
  {
    id: 'req_senior_fullstack',
    title: 'Senior Full-Stack Engineer',
    company: 'Core Product Team',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    coreStack: ['Next.js', 'TypeScript', 'React', 'PostgreSQL', 'Tailwind CSS'],
    seniorityMinYears: 4,
    allowPrivateRepos: true,
    rawJdText: `Senior Full-Stack Engineer

About the Role:
We are seeking a Senior Full-Stack Engineer to architect and build mission-critical customer-facing web applications. You will collaborate closely with product and design to ship modern web interfaces and scalable backend APIs.

Responsibilities:
• Architect, build, and maintain production features using Next.js, React, and TypeScript.
• Design robust SQL database schemas and REST / serverless backend endpoints.
• Ensure web performance, accessibility, responsive UI, and optimal Core Web Vitals.
• Lead code reviews and champion engineering best practices.

Requirements:
• 4+ years of professional full-stack web development experience.
• Deep proficiency with Next.js (App Router), TypeScript, and React.
• Hands-on experience with relational databases (PostgreSQL preferred) and ORMs/query builders.
• Solid understanding of modern CSS/Tailwind, web security, and deployment pipelines (Vercel, Docker).
• Prior experience in fast-paced product environments. Working professional history in private repos welcome.`,
  },
  {
    id: 'req_backend_systems',
    title: 'Backend Systems Engineer',
    company: 'Infrastructure & APIs',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    coreStack: ['Go', 'Node.js', 'PostgreSQL', 'Docker', 'Distributed Systems'],
    seniorityMinYears: 4,
    allowPrivateRepos: true,
    rawJdText: `Backend Systems Engineer

About the Role:
Looking for an experienced Backend Engineer to design high-throughput microservices, data ingestion pipelines, and resilient API architecture.

Responsibilities:
• Design and scale backend microservices handling high concurrent workloads.
• Optimize PostgreSQL queries, database indexing, and distributed caching layers (Redis).
• Implement robust logging, observability, automated testing, and CI/CD pipelines.

Requirements:
• 4+ years building production backend systems using Go or Node.js/TypeScript.
• Strong foundation in distributed systems, concurrency, and SQL performance tuning.
• Experience with containerized deployments (Docker, Kubernetes) and cloud infrastructure.`,
  },
  {
    id: 'req_frontend_architect',
    title: 'Frontend UI/UX Architect',
    company: 'Design Systems & Platform',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    coreStack: ['React', 'TypeScript', 'Tailwind CSS', 'Performance', 'Design Systems'],
    seniorityMinYears: 5,
    allowPrivateRepos: true,
    rawJdText: `Frontend UI/UX Architect

About the Role:
We are hiring a Frontend Architect to own our web application architecture, design system implementation, and performance standards.

Responsibilities:
• Lead frontend architecture and component library development across web properties.
• Enforce high performance standards (sub-second TTFB, smooth 60fps micro-animations).
• Standardize accessible, responsive UI patterns across multi-functional engineering teams.

Requirements:
• 5+ years of specialized frontend engineering with React, Next.js, and TypeScript.
• Proven track record building or maintaining reusable design systems (Radix, Tailwind, shadcn).
• Deep expertise in browser rendering pipelines, bundle analysis, and client-side performance.`,
  },
];

export function getSavedRequisitions(): SavedRequisition[] {
  if (typeof window === 'undefined') return DEFAULT_REQUISITIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_REQUISITIONS));
      return DEFAULT_REQUISITIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_REQUISITIONS;
  } catch {
    return DEFAULT_REQUISITIONS;
  }
}

export function getRequisitionById(id: string): SavedRequisition | null {
  const all = getSavedRequisitions();
  return all.find((r) => r.id === id) || null;
}

export function saveRequisition(
  data: Omit<SavedRequisition, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): SavedRequisition {
  const all = getSavedRequisitions();
  const now = new Date().toISOString();
  const id = data.id || `req_custom_${Date.now()}`;

  const existingIndex = all.findIndex((r) => r.id === id);
  const updatedReq: SavedRequisition = {
    ...data,
    id,
    createdAt: existingIndex >= 0 ? all[existingIndex].createdAt : now,
    updatedAt: now,
  };

  let newList: SavedRequisition[];
  if (existingIndex >= 0) {
    newList = [...all];
    newList[existingIndex] = updatedReq;
  } else {
    newList = [updatedReq, ...all];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  }
  return updatedReq;
}

export function deleteRequisition(id: string): void {
  const all = getSavedRequisitions();
  const newList = all.filter((r) => r.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList.length > 0 ? newList : DEFAULT_REQUISITIONS));
  }
}

export function getActiveRequisitionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ACTIVE_ROLE_KEY) || 'req_senior_fullstack';
  } catch {
    return null;
  }
}

export function setActiveRequisitionId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) {
      localStorage.setItem(ACTIVE_ROLE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_ROLE_KEY);
    }
  } catch {
    /* ignore */
  }
}
