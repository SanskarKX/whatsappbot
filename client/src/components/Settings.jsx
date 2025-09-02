import React, { useEffect, useState } from 'react';
import { fetchUserSettings, upsertUserSettings } from '../services/settings.js';
import { toast } from 'react-toastify';
import { setAIConfig } from '../services/api.js';

export default function Settings({ onConfigured }) {
  const [apiKey, setApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasGroqKey, setHasGroqKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await fetchUserSettings();
        // normalize snake_case from SQL to camelCase in UI
        const has = cfg.hasApiKey ?? cfg.has_api_key ?? false;
        const hasGroq = cfg.hasGroqKey ?? cfg.has_groq_key ?? false;
        setHasApiKey(!!has);
        setHasGroqKey(!!hasGroq);
        setPrompt(cfg.prompt || '');
      } catch (e) {
        toast.error('Failed to load settings');
      }
    })();
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await upsertUserSettings({ apiKey: apiKey || null, groqApiKey: groqApiKey || null, prompt });
      const has = res.hasApiKey ?? res.has_api_key ?? false;
      const hasGroq = res.hasGroqKey ?? res.has_groq_key ?? false;
      setHasApiKey(!!has);
      setHasGroqKey(!!hasGroq);
      setPrompt(res.prompt || '');
      setApiKey(''); // clear from UI for safety
      setGroqApiKey(''); // clear from UI for safety
      // Also configure server runtime so auto-replies can work immediately
      const payload = { prompt };
      if (apiKey) payload.apiKey = apiKey;
      if (groqApiKey) payload.groqApiKey = groqApiKey;
      await setAIConfig(payload);
      toast.success('AI settings saved');
      onConfigured?.(res);
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="section-title">AI Settings</h3>
      <form onSubmit={onSave} style={{ display: 'grid', gap: 12 }}>
        <label>
          <div className="qr-hint">Gemini API Key</div>
          <input
            className="input"
            type="password"
            placeholder={hasApiKey ? 'Configured (enter to replace)' : 'Enter your Gemini API key'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
          />
        </label>
        <label>
          <div className="qr-hint">GROQ API Key (fallback)</div>
          <input
            className="input"
            type="password"
            placeholder={hasGroqKey ? 'Configured (enter to replace)' : 'Optional: Enter your GROQ API key for fallback'}
            value={groqApiKey}
            onChange={(e) => setGroqApiKey(e.target.value)}
            autoComplete="off"
          />
        </label>
        <label>
          <div className="qr-hint">Agent Prompt</div>
          <textarea
            className="textarea"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe how the assistant should behave"
          />
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <div className="qr-hint">Status: Gemini {hasApiKey ? 'present' : 'missing'} · GROQ {hasGroqKey ? 'present' : 'missing'}</div>
        </div>
      </form>
    </div>
  );
}
