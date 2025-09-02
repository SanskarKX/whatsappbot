import React from 'react';

export default function StatusBadge({ connected, aiEnabled }) {
  return (
    <div className="badges">
      <span className={`badge ${connected ? 'success' : 'off'}`}>{connected ? 'Connected' : 'Disconnected'}</span>
      <span className={`badge ${aiEnabled ? '' : 'off'}`}>AI: {aiEnabled ? 'On' : 'Off'}</span>
    </div>
  );
}
