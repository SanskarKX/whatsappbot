import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { SSEHub } from './utils/sse.js';
import { waManager } from './services/waManager.js';
import { aiService } from './services/ai.js';
import { memoryService } from './services/memory.js';
import { isPersonalChat } from './utils/filters.js';
import { authMiddleware } from './middleware/auth.js';
import { metricsService } from './services/metrics.js';

const app = express();
const sse = new SSEHub();
const wiredUsers = new Set(); // users for whom events are already wired
const aiEnabledByUser = new Map(); // per-user AI flag

app.use(cors({ origin: config.allowedOrigin, methods: ['GET','POST'], credentials: false }));
app.use(express.json());

// SSE endpoint for QR and status (per-user)
app.get('/events', authMiddleware, async (req, res) => {
  const userId = req.userId;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const id = sse.addUserClient(userId, res);

  // Start/ensure user's WA client and wire events once
  await waManager.ensure(userId);
  if (!wiredUsers.has(userId)) {
    wiredUsers.add(userId);
    waManager.on(userId, 'qr', ({ dataUrl }) => {
      sse.broadcastTo(userId, 'phase', { phase: 'qr_ready' });
      sse.broadcastTo(userId, 'qr', { dataUrl });
    });
    waManager.on(userId, 'ready', () => {
      sse.broadcastTo(userId, 'phase', { phase: 'ready' });
      sse.broadcastTo(userId, 'status', { connected: true });
    });
    waManager.on(userId, 'authenticated', () => {
      sse.broadcastTo(userId, 'phase', { phase: 'authenticated' });
      // keep status for compatibility
      sse.broadcastTo(userId, 'status', { connected: true });
    });
    waManager.on(userId, 'disconnected', ({ reason }) => sse.broadcastTo(userId, 'status', { connected: false, reason }));
    waManager.on(userId, 'message', async (msg) => {
      try {
        const aiOn = !!aiEnabledByUser.get(userId);
        if (msg.fromMe) return;
        if (!aiOn) return;
        const chat = await msg.getChat();
        if (!isPersonalChat(chat)) return;
        const contact = await msg.getContact();
        const chatId = chat.id._serialized;
        const userText = msg.body || '';
        memoryService.addMessage(chatId, 'user', userText);
        const history = memoryService.getRecent(chatId);
        metricsService.incAttempt(userId);
        const res = await aiService.replyFor(userId, userText, contact?.pushname || contact?.number, history);
        if (!res?.text) return;
        await waManager.sendMessage(userId, chatId, res.text);
        memoryService.addMessage(chatId, 'assistant', res.text);
        metricsService.incSuccess(userId);
        // Estimate tokens/time saved and attribute to provider
        const outTokens = Math.max(0, Number(res.outTokens || 0));
        // rough time saved: assume ~40 wpm typing => 1.5 wps; words ~ text.split spaces
        const words = Math.max(1, res.text.trim().split(/\s+/).length);
        const timeSavedSec = Math.round(words / 1.5); // seconds
        if (res.provider === 'gemini') metricsService.addGeminiUsage(userId, outTokens, timeSavedSec);
        else if (res.provider === 'groq') metricsService.addGroqUsage(userId, outTokens, timeSavedSec);
      } catch (e) {
        console.error('Auto-reply error:', e.message);
      }
    });
  }

  // Send initial status for this user
  const isReady = waManager.isReady(userId);
  sse.broadcastTo(userId, 'status', { connected: isReady });
  sse.broadcastTo(userId, 'phase', { phase: isReady ? 'ready' : 'waiting_qr' });
  sse.broadcastTo(userId, 'ai_status', { enabled: !!aiEnabledByUser.get(userId) });

  req.on('close', () => sse.removeUserClient(userId, id));
});

// Toggle AI auto-reply
app.post('/controls/ai', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { enabled } = req.body || {};
  aiEnabledByUser.set(userId, !!enabled);
  sse.broadcastTo(userId, 'ai_status', { enabled: !!aiEnabledByUser.get(userId) });
  res.json({ ok: true, enabled: !!aiEnabledByUser.get(userId) });
});

// AI runtime configuration (API key & agent prompt)
app.get('/controls/ai-config', authMiddleware, (req, res) => {
  const cfg = aiService.getConfig(req.userId);
  res.json(cfg);
});

app.post('/controls/ai-config', authMiddleware, (req, res) => {
  const { apiKey, prompt, groqApiKey } = req.body || {};
  aiService.configure(req.userId, { apiKey, prompt, groqApiKey });
  const cfg = aiService.getConfig(req.userId);
  res.json({ ok: true, ...cfg });
});

// Status endpoint
app.get('/status', authMiddleware, async (req, res) => {
  const userId = req.userId;
  await waManager.ensure(userId).catch(() => {});
  const { hasApiKey } = aiService.getConfig(userId);
  res.json({ connected: waManager.isReady(userId), aiEnabled: !!aiEnabledByUser.get(userId), hasApiKey });
});

// Metrics endpoint (per-user)
app.get('/metrics', authMiddleware, (req, res) => {
  const m = metricsService.forUser(req.userId);
  const apiCalls = (m.apiCallsGemini + m.apiCallsGroq);
  const successRate = m.attempts ? (m.successes / m.attempts) : 0;
  const costGem = (config.priceGeminiOutPer1K || 0) * (m.outTokensGemini / 1000);
  const costGroq = (config.priceGroqOutPer1K || 0) * (m.outTokensGroq / 1000);
  const estCost = Number((costGem + costGroq).toFixed(4));
  res.json({
    apiCallsGemini: m.apiCallsGemini,
    apiCallsGroq: m.apiCallsGroq,
    apiCalls,
    timeSavedSec: m.timeSavedSec,
    estCost,
    successRate,
    attempts: m.attempts,
    successes: m.successes,
    outTokensGemini: m.outTokensGemini,
    outTokensGroq: m.outTokensGroq,
  });
});

app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});

// Graceful shutdown to release Chromium/LocalAuth locks
const shutdown = async (signal) => {
  try {
    console.log(`\nReceived ${signal}. Shutting down WhatsApp client...`);
    await waManager.stopAll();
  } catch (e) {
    // ignore
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
