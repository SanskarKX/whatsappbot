import React from 'react';
import { FiUser, FiCamera, FiCpu, FiToggleRight } from 'react-icons/fi';

const steps = [
  { n: 1, title: 'Sign in', desc: 'Use your Google account to access your dashboard securely.', Icon: FiUser },
  { n: 2, title: 'Scan QR', desc: 'Connect your WhatsApp using the official QR from WhatsApp Web.', Icon: FiCamera },
  { n: 3, title: 'Set AI', desc: 'Add your Gemini key, optionally GROQ as fallback, and tune the prompt.', Icon: FiCpu },
  { n: 4, title: 'Enable', desc: 'Toggle auto‑reply on. Only personal chats are processed.', Icon: FiToggleRight },
];

export default function HowItWorks() {
  return (
    <section id="how" className="landing-section">
      <h3 className="section-title">How it works</h3>
      <div className="section-grid">
        {steps.map((s) => {
          const I = s.Icon;
          return (
            <div key={s.n} className="feature" style={{ display:'grid', gridTemplateColumns:'32px 1fr', gap:12, alignItems:'start' }}>
              <div className="feature-icon"><I /></div>
              <div>
                <h4 style={{ margin:0 }}>{s.n}. {s.title}</h4>
                <div className="muted">{s.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
