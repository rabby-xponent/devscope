import { promises as fs } from 'fs';
import path from 'path';
import { CACHE_VERSION } from '../agent/agent.service';
import { DevProfile } from '../types/profile';

const CACHE_DIR = process.env.CACHE_DIR || './cache/profiles';
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_HOURS || 24) * 60 * 60 * 1000;

// In-memory hot cache layer to avoid unnecessary disk I/O and survive ephemeral container resets
const memoryCache = new Map<string, { profile: DevProfile; cachedAt: number }>();

const cachePath = (username: string) => path.join(CACHE_DIR, `${username.toLowerCase()}.json`);

export async function readCache(username: string): Promise<DevProfile | null> {
  const key = username.toLowerCase().trim();

  // 1. Check in-memory hot cache first
  const mem = memoryCache.get(key);
  if (mem) {
    if (Date.now() - mem.cachedAt <= CACHE_TTL_MS && mem.profile.cacheVersion === CACHE_VERSION) {
      return mem.profile;
    }
    memoryCache.delete(key);
  }

  // 2. Check disk cache
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

    // Warm up memory cache
    memoryCache.set(key, { profile, cachedAt: stats.mtimeMs });
    return profile;
  } catch (err: any) {
    if (err.code === 'ENOENT') return null;
    console.warn(`[cache] Failed to read disk cache for ${username}:`, err.message);
    return null;
  }
}

export async function writeCache(username: string, profile: DevProfile): Promise<void> {
  const key = username.toLowerCase().trim();
  memoryCache.set(key, { profile, cachedAt: Date.now() });

  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(cachePath(username), JSON.stringify(profile, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn(`[cache] Failed to write disk cache for ${username}:`, err.message);
  }
}
