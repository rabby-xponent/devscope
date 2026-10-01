import { promises as fs } from 'fs';
import path from 'path';
import { DevProfile } from '../types/profile';

/**
 * Published Proof Page snapshots.
 *
 * A Proof Page is the developer's shareable, recruiter-legible evidence
 * artifact (see DEVELOPER_CAREER_OS_IDEATION.md §2.3). When a developer
 * publishes, we snapshot the exact audit they vetted — not a link into the
 * 24h profile cache — so the public URL is stable, survives cache expiry,
 * and can never silently change under a recruiter's feet.
 *
 * File-backed for now (mirrors cache.service.ts); the shape maps 1:1 onto a
 * future `proofs` table once accounts ship (Milestone 24/25).
 */

export interface ProofSnapshot {
  /** Canonical key: `${username}__${roleId}` */
  id: string;
  username: string;
  roleId: string;
  /** Published snapshot version — bumped on every re-publish */
  version: number;
  /** Unix ms of first publish (stable across re-publishes) */
  publishedAt: number;
  /** Unix ms of the most recent publish */
  updatedAt: number;
  /** Denormalized for the public page header */
  roleTitle: string;
  /** Freeform note from the developer, shown on the page */
  note?: string;
  /** The full vetted audit (claim matrix, live app audit, fit, panel…) */
  profile: DevProfile;
}

const PROOFS_DIR = process.env.PROOFS_DIR || './cache/proofs';
const proofPath = (id: string) => path.join(PROOFS_DIR, `${id}.json`);

const proofId = (username: string, roleId: string) =>
  `${username.toLowerCase()}__${roleId}`;

const VALID_ID = /^[a-zA-Z0-9_-]+$/;

export async function readProof(username: string, roleId: string): Promise<ProofSnapshot | null> {
  if (!VALID_ID.test(username) || !VALID_ID.test(roleId)) return null;
  try {
    const raw = await fs.readFile(proofPath(proofId(username, roleId)), 'utf-8');
    return JSON.parse(raw) as ProofSnapshot;
  } catch {
    return null;
  }
}

export async function writeProof(
  input: Omit<ProofSnapshot, 'id' | 'version' | 'publishedAt' | 'updatedAt'>
): Promise<ProofSnapshot> {
  const id = proofId(input.username, input.roleId);
  if (!VALID_ID.test(input.username) || !VALID_ID.test(input.roleId)) {
    throw new Error('Invalid username or roleId');
  }

  const existing = await readProof(input.username, input.roleId);
  const now = Date.now();
  const snapshot: ProofSnapshot = {
    ...input,
    id,
    version: (existing?.version || 0) + 1,
    publishedAt: existing?.publishedAt || now,
    updatedAt: now,
  };

  await fs.mkdir(PROOFS_DIR, { recursive: true });
  await fs.writeFile(proofPath(id), JSON.stringify(snapshot, null, 2), 'utf-8');
  return snapshot;
}

/** Published proofs for a username (newest first) — used by CareerOS to flag live links. */
export async function listProofs(username: string): Promise<
  Pick<ProofSnapshot, 'roleId' | 'roleTitle' | 'updatedAt' | 'version'>[]
> {
  if (!VALID_ID.test(username)) return [];
  try {
    const files = await fs.readdir(PROOFS_DIR);
    const out: ProofSnapshot[] = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = await fs.readFile(path.join(PROOFS_DIR, file), 'utf-8');
        const snap = JSON.parse(raw) as ProofSnapshot;
        if (snap.username.toLowerCase() === username.toLowerCase()) out.push(snap);
      } catch {
        /* skip unreadable entries */
      }
    }
    return out
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(({ roleId, roleTitle, updatedAt, version }) => ({ roleId, roleTitle, updatedAt, version }));
  } catch (err: any) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}
