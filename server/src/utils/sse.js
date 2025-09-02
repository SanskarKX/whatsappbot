import { randomUUID } from 'crypto';

export class SSEHub {
  constructor() {
    this.clients = new Map(); // id -> res (legacy)
    this.userClients = new Map(); // userId -> Map(id->res)
  }

  addClient(res) {
    const id = randomUUID();
    this.clients.set(id, res);
    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ id })}\n\n`);
    return id;
  }

  removeClient(id) {
    const res = this.clients.get(id);
    if (res) {
      try { res.end(); } catch {}
      this.clients.delete(id);
    }
  }

  broadcast(type, payload) {
    const data = JSON.stringify({ type, payload, ts: Date.now() });
    for (const [, res] of this.clients) {
      try {
        res.write(`event: ${type}\n`);
        res.write(`data: ${data}\n\n`);
      } catch {}
    }
  }

  addUserClient(userId, res) {
    const id = randomUUID();
    if (!this.userClients.has(userId)) this.userClients.set(userId, new Map());
    this.userClients.get(userId).set(id, res);
    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ id, userId })}\n\n`);
    return id;
  }

  removeUserClient(userId, id) {
    const m = this.userClients.get(userId);
    if (!m) return;
    const res = m.get(id);
    if (res) {
      try { res.end(); } catch {}
      m.delete(id);
    }
    if (m.size === 0) this.userClients.delete(userId);
  }

  broadcastTo(userId, type, payload) {
    const m = this.userClients.get(userId);
    if (!m) return;
    const data = JSON.stringify({ type, payload, ts: Date.now(), userId });
    for (const [, res] of m) {
      try {
        res.write(`event: ${type}\n`);
        res.write(`data: ${data}\n\n`);
      } catch {}
    }
  }
}
