import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <main
      className="main-layout"
      style={{ justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
    >
      <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
        <div style={{ fontSize: '1.2rem', marginBottom: 8, letterSpacing: '2px' }}>
          DECRYPTING CLASSIFIED TRANSMISSION...
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          ACCESSING SECURE ARCHIVE RECORD
        </div>
      </div>
    </main>
  );
};
