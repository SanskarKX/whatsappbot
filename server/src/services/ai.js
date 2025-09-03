import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import Groq from 'groq-sdk';

class AIService {
  constructor() {
    // Per-user state
    this.models = new Map(); // userId -> generative model instance
    this.apiKeys = new Map(); // userId -> apiKey
    this.prompts = new Map(); // userId -> prompt
    this.cooldowns = new Map(); // userId -> epoch ms
    this.groqKeys = new Map(); // userId -> groq api key
    this.groqClients = new Map(); // userId -> Groq client
    // Default fallback prompt
    this.defaultPrompt = 'You are a friendly WhatsApp assistant. Keep replies very short: 1–2 simple sentences. Be helpful, casual, and safe. Plain text only (no markdown).';
    // Optional global default key from env used only if user-specific key not provided
    this.globalApiKey = config.geminiApiKey || '';
  }

  #getPrompt(userId) {
    return (this.prompts.get(userId) || this.defaultPrompt);
  }

  configure(userId, { apiKey, prompt, groqApiKey }) {
    if (typeof apiKey === 'string') {
      const key = apiKey.trim();
      if (key) {
        this.apiKeys.set(userId, key);
      } else {
        this.apiKeys.delete(userId);
      }
      // Recreate model for this user
      const useKey = key || this.globalApiKey;
      if (useKey) {
        const genAI = new GoogleGenerativeAI(useKey);
        this.models.set(userId, genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }));
      } else {
        this.models.delete(userId);
      }
      // reset cooldown for this user
      this.cooldowns.set(userId, 0);
    }
    if (typeof prompt === 'string') {
      const p = prompt.trim();
      if (p) this.prompts.set(userId, p); else this.prompts.delete(userId);
    }
    if (typeof groqApiKey === 'string') {
      const k = groqApiKey.trim();
      if (k) {
        this.groqKeys.set(userId, k);
        this.groqClients.set(userId, new Groq({ apiKey: k }));
      } else {
        this.groqKeys.delete(userId);
        this.groqClients.delete(userId);
      }
    }
  }

  getConfig(userId) {
    const hasUserKey = this.apiKeys.has(userId);
    const hasGlobal = !!this.globalApiKey;
    return { hasApiKey: hasUserKey || hasGlobal, prompt: this.#getPrompt(userId) };
  }

  // history: array of { role: 'user' | 'assistant', text: string }
  async replyFor(userId, messageText, contactName, history = []) {
    const model = this.models.get(userId) || (this.globalApiKey ? (new GoogleGenerativeAI(this.globalApiKey)).getGenerativeModel({ model: 'gemini-1.5-flash' }) : null);
    const cooldownUntil = this.cooldowns.get(userId) || 0;
    if (Date.now() < cooldownUntil) return null;
    
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI request timeout')), 8000)
    );
    const header = [
      this.#getPrompt(userId),
      `Sender: ${contactName || 'Unknown'}`,
      '',
      'Recent conversation (oldest first):',
    ].join('\n');

    const transcript = history
      .map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.text}`)
      .join('\n');

    const footer = [
      '',
      `Current user: ${messageText}`,
      'Reply:',
    ].join('\n');

    const prompt = [header, transcript, footer].join('\n');
    // First try Gemini if available
    if (model) {
      try {
        const result = await Promise.race([
          model.generateContent(prompt),
          timeoutPromise
        ]);
        const text = result.response.text();
        const trimmed = (text || '').trim();
        if (trimmed) {
          const outTokens = Math.ceil(trimmed.length / 4);
          return { text: trimmed, provider: 'gemini', outTokens };
        }
      } catch (e) {
        const msg = String(e?.message || e);
        if (msg.includes('429') || msg.toLowerCase().includes('too many requests')) {
          const match = msg.match(/retryDelay\"\s*:\s*\"(\d+)(s|ms)\"/i);
          let delayMs = 60_000;
          if (match) {
            const val = Number(match[1]);
            const unit = match[2];
            delayMs = unit === 'ms' ? val : val * 1000;
          }
          this.cooldowns.set(userId, Date.now() + delayMs);
          console.warn(`Gemini rate-limited. Cooling down ${Math.round(delayMs/1000)}s, will try GROQ.`);
        } else {
          console.warn('Gemini error, will try GROQ:', msg);
        }
      }
    }

    // Fallback to GROQ if configured
    const groq = this.groqClients.get(userId);
    if (!groq) return null;
    try {
      const messages = [
        { role: 'system', content: this.#getPrompt(userId) },
        ...history.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text })),
        { role: 'user', content: `Sender: ${contactName || 'Unknown'}\n\n${messageText}` },
      ];
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        temperature: 0.5,
        messages,
      });
      const text = (completion?.choices?.[0]?.message?.content || '').trim();
      if (!text) return null;
      const outTokens = Math.ceil(text.length / 4);
      return { text, provider: 'groq', outTokens };
    } catch (e) {
      console.error('GROQ error:', e?.message || e);
      return null;
    }
  }
}

export const aiService = new AIService();
