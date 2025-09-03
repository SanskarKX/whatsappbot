import { EventEmitter } from 'events';
import qrcode from 'qrcode';
import wweb from 'whatsapp-web.js';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client, LocalAuth } = wweb;

class PerUserClient {
  constructor(userId) {
    this.userId = userId;
    this.client = null;
    this.emitter = new EventEmitter();
    this.ready = false;
  }

  get isReady() { return this.ready; }

  async ensure() {
    if (this.client) return this.client;
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // Persist auth. Prefer AUTH_DATA_PATH (e.g., a Render disk mount), fallback to repo path.
    const authBase = process.env.AUTH_DATA_PATH
      ? path.resolve(process.env.AUTH_DATA_PATH)
      : path.resolve(__dirname, '../../.wwebjs_auth');
    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: this.userId, dataPath: authBase }),
      puppeteer: { 
        headless: true, 
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ] 
      },
    });

    this.client.on('qr', async (qr) => {
      try {
        const dataUrl = await qrcode.toDataURL(qr);
        this.emitter.emit('qr', { dataUrl });
      } catch (e) {
        console.error(`[WA][${this.userId}] QR gen error`, e.message);
      }
    });

    this.client.on('ready', () => {
      this.ready = true;
      this.emitter.emit('ready');
    });

    this.client.on('authenticated', () => {
      this.emitter.emit('authenticated');
    });

    this.client.on('disconnected', (reason) => {
      this.ready = false;
      this.emitter.emit('disconnected', { reason });
    });

    this.client.on('message', (msg) => {
      this.emitter.emit('message', msg);
    });

    await this.client.initialize();
    return this.client;
  }

  async sendMessage(chatId, text) {
    if (!this.client) throw new Error('Client not started');
    return this.client.sendMessage(chatId, text);
  }

  async stop() {
    try { if (this.client) await this.client.destroy(); } catch {}
    this.client = null;
    this.ready = false;
  }
}

class WhatsAppManager {
  constructor() {
    this.clients = new Map(); // userId -> PerUserClient
  }

  get(userId) {
    if (!this.clients.has(userId)) this.clients.set(userId, new PerUserClient(userId));
    return this.clients.get(userId);
  }

  isReady(userId) { return this.get(userId).isReady; }

  async ensure(userId) { return this.get(userId).ensure(); }

  async sendMessage(userId, chatId, text) { return this.get(userId).sendMessage(chatId, text); }

  on(userId, event, handler) { this.get(userId).emitter.on(event, handler); }

  async stopAll() {
    const tasks = [];
    for (const [, c] of this.clients) tasks.push(c.stop());
    await Promise.allSettled(tasks);
  }
}

export const waManager = new WhatsAppManager();
