import React from 'react';

export default function Controls({ aiEnabled, onToggleAI, disabled }) {
  return (
    <div>
      <h3 className="section-title">Controls</h3>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={aiEnabled}
          disabled={disabled}
          onChange={(e) => onToggleAI(e.target.checked)}
        />
        <span>Enable AI auto-reply</span>
      </label>
      {disabled && <p className="qr-hint" style={{ marginTop: 8 }}>Connect WhatsApp and set API key to enable controls.</p>}
    </div>
  );
}
