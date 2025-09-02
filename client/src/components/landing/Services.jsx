import React from 'react';
import { FiShield, FiZap, FiSliders } from 'react-icons/fi';

const items = [
  { title: 'Secure Link', desc: 'Connect via official WhatsApp Web flow. Your session stays on your machine.', Icon: FiShield },
  { title: 'Smart Auto‑Replies', desc: 'Use Gemini with GROQ fallback to reply in personal chats when you choose.', Icon: FiZap },
  { title: 'Fine‑tuned Prompt', desc: 'Control tone and behavior with a simple agent prompt.', Icon: FiSliders },
];

export default function Services() {
  return (
    <section id="services" className="landing-section">
      <h3 className="section-title">Services</h3>
      <div className="section-grid">
        {items.map((f) => {
          const I = f.Icon;
          return (
            <div key={f.title} className="feature" style={{ display:'grid', gridTemplateColumns:'32px 1fr', gap:12, alignItems:'start' }}>
              <div className="feature-icon"><I /></div>
              <div>
                <h4 style={{ margin:0 }}>{f.title}</h4>
                <div className="muted">{f.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
