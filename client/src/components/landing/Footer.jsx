import React from 'react';

export default function Footer() {
  return (
    <footer className="landing-section" style={{ borderTop: '1px solid var(--card-border)', marginTop: 16 }}>
      <div className="muted">© {new Date().getFullYear()} WhatsApp Connection Control · Built with privacy in mind</div>
    </footer>
  );
}
