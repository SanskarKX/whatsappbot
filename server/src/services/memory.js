// Simple in-memory conversation store: last N messages per chat
// Message format: { role: 'user' | 'assistant', text: string, ts: number }

class MemoryService {
  constructor(limit = 10) {
    this.limit = limit;
    this.store = new Map(); // chatId -> [messages]
  }

  addMessage(chatId, role, text) {
    if (!chatId || !text) return;
    const list = this.store.get(chatId) || [];
    list.push({ role, text, ts: Date.now() });
    // keep only last N
    while (list.length > this.limit) list.shift();
    this.store.set(chatId, list);
  }

  getRecent(chatId) {
    return this.store.get(chatId) || [];
  }

  clear(chatId) {
    if (chatId) this.store.delete(chatId);
  }
}

export const memoryService = new MemoryService(10);
