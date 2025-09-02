import React from 'react';
import { useAuthCtx } from '../../auth/AuthProvider.jsx';

export default function Hero() {
  const { signInWithGoogle } = useAuthCtx();
  return (
    <section className="landing-hero">
      <h1>Control WhatsApp with AI — securely from your browser</h1>
      <p className="sub">Link your WhatsApp, set your AI assistant, and auto‑reply to personal chats with safe, private control. No data leaves your device except what WhatsApp requires.</p>
      <div className="cta-row">
        <button className="btn" onClick={signInWithGoogle}>Sign in to get started</button>
        <a className="qr-hint" href="#services">Learn more ↓</a>
      </div>
    </section>
  );
}
