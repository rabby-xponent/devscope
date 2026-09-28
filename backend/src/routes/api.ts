import { Router, Request, Response } from 'express';
import { AgentService } from '../agent/agent.service';
import { readCache, writeCache } from '../cache/cache.service';
import { TraceEvent } from '../types/profile';
import { sanitizeErrorMessage } from '../utils/error-formatter';

const router = Router();
const agent = new AgentService();

router.get('/generate', async (req: Request, res: Response) => {
  const username = String(req.query.username || '').trim();
  const liveUrl = req.query.liveUrl ? String(req.query.liveUrl).trim() : undefined;
  const roleTitle = req.query.roleTitle ? String(req.query.roleTitle).trim() : undefined;
  const jobDescription = req.query.jd ? String(req.query.jd).trim() : undefined;
  const force = req.query.force === 'true' || Boolean(liveUrl) || Boolean(jobDescription);

  if (!username || !/^[a-zA-Z0-9_-]+$/.test(username)) {
    res.status(400).json({ error: 'Valid username required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send periodic SSE keepalive comment every 4 seconds to prevent proxy / Vercel timeouts
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': keepalive\n\n');
    }
  }, 4000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });

  const send = (event: TraceEvent) => {
    if (res.writableEnded) return;
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    if (!force) {
      const cached = await readCache(username);
      if (cached) {
        clearInterval(heartbeat);
        send({ type: 'complete', timestamp: new Date().toISOString(), profile: cached, cached: true });
        res.end();
        return;
      }
    }

    const profile = await agent.buildProfile(username, send, liveUrl, jobDescription, roleTitle);
    await writeCache(username, profile);

    clearInterval(heartbeat);
    send({ type: 'complete', timestamp: new Date().toISOString(), profile, cached: false });
    res.end();
  } catch (err: any) {
    clearInterval(heartbeat);
    const sanitized = sanitizeErrorMessage(err, username);
    send({
      type: 'error',
      timestamp: new Date().toISOString(),
      message: sanitized.userMessage,
      technicalDetails: sanitized.technicalDetails,
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
