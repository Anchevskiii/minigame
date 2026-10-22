import React from 'react';

interface ErrorScreenProps {
  error: string;
  onRetry: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ error, onRetry }) => {
  return (
    <main
      className="main-layout"
      style={{ justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
    >
      <div
        style={{
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-stamp)'
        }}
      >
        <h3>{error}</h3>
        <button
          className="btn-guess"
          style={{ marginTop: 16 }}
          onClick={onRetry}
        >
          RETRY RECEPTION
        </button>
      </div>
    </main>
  );
};
