import React, { useState, useEffect } from 'react';
import { Lightbulb, PlayCircle, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';
import { soundFX } from '@/utils/audio';
import { Modal } from '@/components/common/Modal';

export interface HintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseFreeHint: () => void;
  onUseTitleHint: () => void;
  freeHintUsed: boolean;
  titleHintUsed: boolean;
  titleWordsRemaining: number;
}

export const HintModal: React.FC<HintModalProps> = ({
  isOpen,
  onClose,
  onUseFreeHint,
  onUseTitleHint,
  freeHintUsed,
  titleHintUsed,
  titleWordsRemaining
}) => {
  const [adSimulating, setAdSimulating] = useState(false);
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (!adSimulating) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setAdSimulating(false);
          onUseTitleHint();
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [adSimulating, onUseTitleHint, onClose]);

  const startRewardedAd = () => {
    setCountdown(8);
    setAdSimulating(true);
  };

  const handleClose = () => {
    setAdSimulating(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="CLASSIFIED INTELLIGENCE HINTS"
      icon={<Lightbulb size={22} color="var(--accent-gold)" />}
    >
      {adSimulating ? (
        <div style={{ textAlign: 'center', padding: '30px 10px' }}>
          <div
            style={{
              background: '#0a0d12',
              color: '#38ef7d',
              padding: '24px',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              border: '1px solid #1f2937',
              marginBottom: '16px'
            }}
          >
            <Loader2 size={32} className="spin-anim" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ letterSpacing: '2px', marginBottom: '8px' }}>
              SPONSORED SATELLITE INTERCEPT IN PROGRESS
            </h4>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              [Simulating Rewarded Partner Broadcast: Google H5 Gaming Network]
            </p>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                margin: '16px 0',
                color: '#ffffff'
              }}
            >
              {countdown}s REMAINING
            </div>
            <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              Decryption key will release upon transmission completion.
            </p>
          </div>
        </div>
      ) : (
        <div className="hint-options">
          {/* Tier 1 Free Hint */}
          <div className="classified-card">
            <h4>TIER 1: RECONNAISSANCE INTERCEPT (FREE)</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              Decrypts one high-frequency contextual keyword hidden in the document body. Useful for establishing the core domain or era.
            </p>
            {freeHintUsed ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}
              >
                <CheckCircle size={16} /> Already deployed for this daily case file.
              </div>
            ) : (
              <button
                className="btn-share"
                style={{
                  background: 'var(--text-primary)',
                  color: 'var(--bg-card)',
                  marginTop: 0
                }}
                onClick={() => {
                  soundFX.playKeypress();
                  onUseFreeHint();
                  onClose();
                }}
              >
                <Lightbulb size={16} /> DEPLOY RECON HINT (1 FREE)
              </button>
            )}
          </div>

          {/* Tier 2 Rewarded Ad Hint */}
          <div className="classified-card" style={{ borderColor: 'var(--accent-gold)' }}>
            <h4 style={{ color: 'var(--accent-gold)' }}>
              TIER 2: TARGETED TITLE DECLASSIFICATION (REWARDED)
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              Stuck at a brick wall? Receive one guaranteed word from the classified article title by watching a brief partner broadcast.
            </p>
            <div style={{ fontSize: '0.85rem', marginBottom: 14, color: 'var(--text-muted)' }}>
              Target title words remaining: <strong>{titleWordsRemaining}</strong>
            </div>

            {titleHintUsed || titleWordsRemaining === 0 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}
              >
                <ShieldAlert size={16} /> Title hint already claimed or all title words decrypted!
              </div>
            ) : (
              <button
                className="btn-share"
                style={{
                  background: 'var(--accent-gold)',
                  color: '#000000',
                  marginTop: 0,
                  fontWeight: 700
                }}
                onClick={() => {
                  soundFX.playKeypress();
                  startRewardedAd();
                }}
              >
                <PlayCircle size={18} /> WATCH AD & REVEAL TITLE WORD
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
