export const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

let authToken = '';
export function setAuthToken(token) { authToken = token || ''; }

export async function getStatus() {
  const res = await fetch(`${apiBase}/status`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  return res.json();
}

export async function setAIEnabled(enabled) {
  const res = await fetch(`${apiBase}/controls/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
    body: JSON.stringify({ enabled }),
  });
  return res.json();
}

export async function getAIConfig() {
  const res = await fetch(`${apiBase}/controls/ai-config`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  return res.json();
}

export async function setAIConfig({ apiKey, prompt, groqApiKey }) {
  const res = await fetch(`${apiBase}/controls/ai-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
    body: JSON.stringify({ apiKey, prompt, groqApiKey }),
  });
  return res.json();
}

export function openEvents() {
  const url = new URL(`${apiBase}/events`);
  if (authToken) url.searchParams.set('token', authToken);
  const es = new EventSource(url.toString());
  return es;
}

export async function getMetrics() {
  const res = await fetch(`${apiBase}/metrics`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  return res.json();
}
