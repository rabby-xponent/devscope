import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api';
import proofRoutes from './proofs/proof.routes';
import authRoutes from './auth/routes';
import { attachAuth } from './auth/middleware';
import { usageRouter } from './security/usage-ledger';
import { entitlementsRouter } from './security/entitlements';
import workspaceRoutes from './workspace/routes';
import billingRoutes, { stripeWebhookHandler } from './billing/billing.routes';

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.FRONTEND_URL || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // EventSource/fetch from the frontend must be able to carry the demo cookie
  })
);
// Stripe signs the exact bytes it sent, so the webhook must see the RAW body.
// This mount therefore has to come before express.json().
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json());
app.use(attachAuth); // resolve req.auth from Bearer/x-devscope-session when present

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiRoutes);
app.use('/api/proofs', proofRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usage', usageRouter);
app.use('/api/entitlements', entitlementsRouter);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/billing', billingRoutes);

app.listen(PORT, () => {
  console.log(`DevScope backend running on port ${PORT}`);
});
