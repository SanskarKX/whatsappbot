import React, { useState } from 'react';
import { FiMessageSquare, FiGrid, FiPlayCircle, FiLogIn, FiMenu, FiX } from 'react-icons/fi';

export default function LandingHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="landing-header">
      <div className="brand" style={{ display:'flex', alignItems:'center', gap:8 }}>
        <FiMessageSquare />
        <span>WhatsApp Connection Control</span>
      </div>
      <nav className="nav hide-sm">
        <a href="#services"><FiGrid /> <span className="hide-sm">Services</span></a>
        <a href="#how"><FiPlayCircle /> <span className="hide-sm">How it works</span></a>
        <a href="#cta"><FiLogIn /> <span className="hide-sm">Get started</span></a>
      </nav>
      <button className="hamburger" aria-label="menu" onClick={() => setOpen(true)}>
        <FiMenu />
      </button>

      {open && (
        <>
          <div className="sidebar">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div className="brand" style={{ display:'flex', alignItems:'center', gap:8 }}>
                <FiMessageSquare />
                <span>Menu</span>
              </div>
              <button className="hamburger" aria-label="close" onClick={close}><FiX /></button>
            </div>
            <a href="#services" onClick={close}><FiGrid /> Services</a>
            <a href="#how" onClick={close}><FiPlayCircle /> How it works</a>
            <a href="#cta" onClick={close}><FiLogIn /> Get started</a>
          </div>
          <div className="sidebar-backdrop" onClick={close} />
        </>
      )}
    </header>
  );
}
