import { EventEmitter } from 'events';
import qrcode from 'qrcode';
import wweb from 'whatsapp-web.js';

const { Client, LocalAuth } = wweb;

class WhatsAppService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.ready = false;
  }

  get isReady() { return this.ready; }

  async start() {
    if (this.client) return;
    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: 'control-app' }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    this.client.on('qr', async (qr) => {
      try {
        const dataUrl = await qrcode.toDataURL(qr);
        this.emit('qr', { dataUrl });
      } catch (e) {
        console.error('QR gen error', e);
      }
    });

    this.client.on('ready', () => {
      this.ready = true;
      this.emit('ready');
    });

    this.client.on('authenticated', () => {
      this.emit('authenticated');
    });

    this.client.on('disconnected', (reason) => {
      this.ready = false;
      this.emit('disconnected', { reason });
    });

    this.client.on('message', async (msg) => {
      this.emit('message', msg);
    });

    try {
      await this.client.initialize();
    } catch (e) {
      // Surface a clearer hint for Windows file locks on Cookies-journal
      if (String(e?.message || e).includes('EBUSY')) {
        console.error('WhatsApp initialize failed due to locked Chromium cookie store (EBUSY).');
        console.error('Close any running server instances and Chromium/Chrome processes, then try again.');
      }
      throw e;
    }
  }

  async sendMessage(chatId, text) {
    if (!this.client) throw new Error('Client not started');
    return this.client.sendMessage(chatId, text);
  }

  async stop() {
    try {
      if (this.client) {
        await this.client.destroy();
      }
    } catch (e) {
      // Ignore errors on shutdown
    } finally {
      this.client = null;
      this.ready = false;
    }
  }
}

export const waService = new WhatsAppService();
