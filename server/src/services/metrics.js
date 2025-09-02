// Simple in-memory per-user metrics. Real-time, resets on server restart.
export class MetricsService {
  constructor() {
    this.m = new Map();
  }
  _get(userId) {
    if (!this.m.has(userId)) {
      this.m.set(userId, {
        attempts: 0,
        successes: 0,
        apiCallsGemini: 0,
        apiCallsGroq: 0,
        outTokensGemini: 0,
        outTokensGroq: 0,
        timeSavedSec: 0,
      });
    }
    return this.m.get(userId);
  }
  incAttempt(userId) { this._get(userId).attempts++; }
  incSuccess(userId) { this._get(userId).successes++; }
  addGeminiUsage(userId, outTokens, timeSavedSec) {
    const s = this._get(userId);
    s.apiCallsGemini++;
    s.outTokensGemini += Math.max(0, Math.floor(outTokens || 0));
    s.timeSavedSec += Math.max(0, Math.floor(timeSavedSec || 0));
  }
  addGroqUsage(userId, outTokens, timeSavedSec) {
    const s = this._get(userId);
    s.apiCallsGroq++;
    s.outTokensGroq += Math.max(0, Math.floor(outTokens || 0));
    s.timeSavedSec += Math.max(0, Math.floor(timeSavedSec || 0));
  }
  forUser(userId) { return this._get(userId); }
}

export const metricsService = new MetricsService();
