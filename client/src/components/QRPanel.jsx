import React from 'react';

export default function QRPanel({ dataUrl, phase }) {
  const waitingForQR = !dataUrl && (phase === 'waiting_qr' || phase === 'init');
  const qrReady = !!dataUrl && phase === 'qr_ready';
  const authenticating = phase === 'authenticated';

  return (
    <div className="qr-wrap">
      <h3 className="section-title">Scan QR to connect</h3>
      {waitingForQR && (
        <p className="qr-hint">Generating QR… please wait</p>
      )}
      {qrReady && (
        <img className="qr-img" src={dataUrl} alt="WhatsApp QR" />
      )}
      {authenticating && (
        <p className="qr-hint">QR scanned. Connecting to WhatsApp…</p>
      )}
      {!waitingForQR && !qrReady && !authenticating && !dataUrl && (
        <p className="qr-hint">Waiting…</p>
      )}
      <p className="qr-hint">Open WhatsApp on your phone → Linked devices → Link a device.</p>
    </div>
  );
}
