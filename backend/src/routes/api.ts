import { Router, Request, Response } from 'express';
import { AgentService } from '../agent/agent.service';
import { readCache, writeCache } from '../cache/cache.service';
import { TraceEvent } from '../types/profile';

const router = Router();
const agent = new AgentService();

router.get('/generate', async (req: Request, res: Response) => {
  const username = String(req.query.username || '').trim();
  const force = req.query.force === 'true';

  if (!username || !/^[a-zA-Z0-9_-]+$/.test(username)) {
    res.status(400).json({ error: 'Valid username required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event: TraceEvent) => {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    if (!force) {
      const cached = await readCache(username);
      if (cached) {
        send({ type: 'complete', timestamp: new Date().toISOString(), profile: cached, cached: true });
        res.end();
        return;
      }
    }

    const profile = await agent.buildProfile(username, send);
    await writeCache(username, profile);

    send({ type: 'complete', timestamp: new Date().toISOString(), profile, cached: false });
    res.end();
  } catch (err: any) {
    send({
      type: 'error',
      timestamp: new Date().toISOString(),
      message: err.message || 'Generation failed',
    });
    res.end();
  }
});

router.get('/profile/:username', async (req: Request, res: Response) => {
  const cached = await readCache(req.params.username);
  if (!cached) {
    res.status(404).json({ error: 'Profile not found. Generate it first.' });
    return;
  }
  res.json({ cached: true, cachedAt: cached.generatedAt, profile: cached });
});

export default router;
