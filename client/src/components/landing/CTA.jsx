import React from 'react';
import { useAuthCtx } from '../../auth/AuthProvider.jsx';

export default function CTA() {
  const { signInWithGoogle } = useAuthCtx();
  return (
    <section id="cta" className="landing-section">
      <div className="card" style={{ display:'grid', gap:8, textAlign:'center' }}>
        <h3 className="section-title" style={{ margin:'0 auto' }}>Ready to connect?</h3>
        <div className="muted">Sign in to manage your AI and start safe auto‑replies.</div>
        <div><button className="btn" onClick={signInWithGoogle}>Continue with Google</button></div>
      </div>
    </section>
  );
}
