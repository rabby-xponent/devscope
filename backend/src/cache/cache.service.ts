import { promises as fs } from 'fs';
import path from 'path';
import { CACHE_VERSION } from '../agent/agent.service';
import { DevProfile } from '../types/profile';

const CACHE_DIR = process.env.CACHE_DIR || './cache/profiles';
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_HOURS || 24) * 60 * 60 * 1000;

const cachePath = (username: string) => path.join(CACHE_DIR, `${username.toLowerCase()}.json`);

export async function readCache(username: string): Promise<DevProfile | null> {
  const file = cachePath(username);

  try {
    const stats = await fs.stat(file);
    if (Date.now() - stats.mtimeMs > CACHE_TTL_MS) {
      return null;
    }

    const raw = await fs.readFile(file, 'utf-8');
    const profile: DevProfile = JSON.parse(raw);
    if (profile.cacheVersion !== CACHE_VERSION) {
      return null;
    }

    return profile;
  } catch (err: any) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function writeCache(username: string, profile: DevProfile): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(cachePath(username), JSON.stringify(profile, null, 2), 'utf-8');
}
