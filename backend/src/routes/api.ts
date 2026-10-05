import { Router, Request, Response } from 'express';
import { AgentService } from '../agent/agent.service';
import { readCache, writeCache } from '../cache/cache.service';
import { DevProfile, TraceEvent } from '../types/profile';
import { sanitizeErrorMessage } from '../utils/error-formatter';
import { evaluateDemoRun, isDemoGateEnabled } from '../security/demo-gate';
import { reserveAudit, recordAnonymousRun } from '../security/usage-ledger';

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

  // Cache + demo gate BEFORE flushing headers: Set-Cookie must be set pre-flush,
  // and blocked/cached requests must not start the agent.
  let cached: DevProfile | null = null;
  if (!force) {
    cached = await readCache(username);
  }

  let gateBlock: { code: 'demo_exhausted' | 'rate_limited'; message: string } | null = null;
  let gateCookie: string | null = null;
  let quotaBlock: { message: string; resetAt: string | null } | null = null;

  if (!cached && req.auth) {
    // Signed-in users skip the anonymous demo gate (M24B); the usage ledger
    // meters them with an atomic check-and-reserve BEFORE agent work (M24C).
    const verdict = await reserveAudit(req.auth.userId, username);
    if (!verdict.allowed) {
      quotaBlock = {
        message: `You've used all ${verdict.limit} free audits in this rolling 30-day window. Everything already generated stays viewable — upgrade lifts the limit.`,
        resetAt: verdict.resetAt,
      };
    }
  } else if (!cached && isDemoGateEnabled()) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
    const verdict = evaluateDemoRun(req.headers.cookie, ip, username);
    if (verdict.allowed) {
      gateCookie = verdict.setCookie;
      // Anonymous demo runs are metered too (IP-keyed; survives cookie deletion).
      void recordAnonymousRun(ip, username);
    } else {
      gateBlock = {
        code: verdict.reason,
        message:
          verdict.reason === 'demo_exhausted'
            ? `You have already run the free demo audit for @${username} in this browser. Create a free workspace to keep going — everything already generated stays viewable.`
            : 'Too many fresh audits from this network right now. Try again in a little while, or create a free workspace.',
      };
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (gateCookie) res.setHeader('Set-Cookie', gateCookie);
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
    if (cached) {
      clearInterval(heartbeat);
      send({ type: 'complete', timestamp: new Date().toISOString(), profile: cached, cached: true });
      res.end();
      return;
    }

    // Anonymous demo gate (M24A): fresh runs cost an LLM call, so bound them.
    if (gateBlock) {
      clearInterval(heartbeat);
      send({
        type: 'error',
        timestamp: new Date().toISOString(),
        code: gateBlock.code,
        message: gateBlock.message,
      });
      res.end();
      return;
    }

    // Signed-in quota wall (M24C): structured event, never hides existing data.
    if (quotaBlock) {
      clearInterval(heartbeat);
      send({
        type: 'error',
        timestamp: new Date().toISOString(),
        code: 'quota_exhausted',
        message: quotaBlock.message,
        technicalDetails: quotaBlock.resetAt
          ? `Quota resets on a rolling 30-day window (oldest audit leaves at ${quotaBlock.resetAt}).`
          : undefined,
      });
      res.end();
      return;
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
