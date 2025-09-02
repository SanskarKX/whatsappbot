import React, { useEffect, useState } from 'react';
import { getStatus, setAIEnabled, openEvents, setAuthToken } from './services/api.js';
import QRPanel from './components/QRPanel.jsx';
import Controls from './components/Controls.jsx';
import StatusBadge from './components/StatusBadge.jsx';
import Settings from './components/Settings.jsx';
import KPICards from './components/KPICards.jsx';
import { toast } from 'react-toastify';
import { useAuthCtx } from './auth/AuthProvider.jsx';
import Landing from './pages/Landing.jsx';
import { fetchUserSettings } from './services/settings.js';

export default function App() {
  const { user, loading, signOut, session } = useAuthCtx();
  const [connected, setConnected] = useState(false);
  const [phase, setPhase] = useState('init'); // waiting_qr | qr_ready | authenticated | ready
  const [aiEnabled, setAiEnabledState] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    // Only wire API + SSE when authenticated
    if (!session?.access_token) {
      setAuthToken('');
      setConnected(false);
      setPhase('init');
      setQrDataUrl('');
      return; // don't open SSE or call status
    }

    setAuthToken(session.access_token);

    getStatus().then((s) => {
      setConnected(!!s.connected);
      setAiEnabledState(!!s.aiEnabled);
      setHasApiKey(!!s.hasApiKey);
    }).catch(() => {/* ignore transient errors */});

    const es = openEvents();
    es.addEventListener('qr', (e) => {
      const { payload } = JSON.parse(e.data);
      setQrDataUrl(payload.dataUrl || '');
    });
    es.addEventListener('status', (e) => {
      const { payload } = JSON.parse(e.data);
      setConnected(!!payload.connected);
      if (payload.connected) setQrDataUrl('');
    });
    es.addEventListener('phase', (e) => {
      const { payload } = JSON.parse(e.data);
      setPhase(payload.phase || '');
    });
    es.addEventListener('ai_status', (e) => {
      const { payload } = JSON.parse(e.data);
      setAiEnabledState(!!payload.enabled);
    });
    return () => es.close();
  }, [session?.access_token]);

  const onToggleAI = async (flag) => {
    const res = await setAIEnabled(flag);
    setAiEnabledState(!!res.enabled);
    toast[res.enabled ? 'success' : 'info'](`AI auto-reply ${res.enabled ? 'enabled' : 'disabled'}`);
  };

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-card">
          <div className="spinner" />
          <div className="splash-text">Loading…</div>
        </div>
      </div>
    );
  }
  if (!user) return <Landing />;

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="h1" style={{ margin: 0 }}>WhatsApp Connection Control</h1>
        <div className="user-area">
          <div className="user-pill">
            <img
              className="avatar"
              src={user?.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp&f=y'}
              alt="avatar"
            />
            <span className="user-email">{user?.email}</span>
          </div>
          <button className="btn" onClick={signOut}>Sign out</button>
        </div>
      </div>
      <div className="badges" style={{ marginTop: 8 }}>
        <StatusBadge connected={connected} aiEnabled={aiEnabled} />
      </div>

      {/* KPIs on top for visibility */}
      <div className="card" style={{ marginTop: 16 }}>
        <KPICards />
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <div className="card">
          {!connected && <QRPanel dataUrl={qrDataUrl} phase={phase} />}
          <Controls aiEnabled={aiEnabled} onToggleAI={onToggleAI} disabled={!connected || !hasApiKey} />
        </div>
        <div className="card">
          <Settings onConfigured={() => {
            // refresh hasApiKey after saving via Supabase
            fetchUserSettings().then((cfg) => {
              const has = cfg.hasApiKey ?? cfg.has_api_key ?? false;
              setHasApiKey(!!has);
            });
          }} />
        </div>
      </div>
    </div>
  );
}
