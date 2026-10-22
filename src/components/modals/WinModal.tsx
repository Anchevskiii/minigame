import React, { useState } from 'react';
import { Trophy, Share2, ExternalLink, Check, Flame, Award } from 'lucide-react';
import { soundFX } from '@/utils/audio';
import { calculateAccuracy } from '@/utils/game-rules';
import { Modal } from '@/components/common/Modal';

export interface WinModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzleNumber: number;
  articleTitle: string;
  wikipediaUrl: string;
  totalGuesses: number;
  hitGuesses: number;
  hintsUsed: number;
  currentStreak: number;
  durationSeconds?: number;
}

export const WinModal: React.FC<WinModalProps> = ({
  isOpen,
  onClose,
  puzzleNumber,
  articleTitle,
  wikipediaUrl,
  totalGuesses,
  hitGuesses,
  hintsUsed,
  currentStreak
}) => {
  const [copied, setCopied] = useState(false);

  const accuracy = calculateAccuracy(hitGuesses, totalGuesses);

  const generateShareText = () => {
    return `[REDACTED] #${puzzleNumber} 🌍
Guesses: ${totalGuesses} 📉
Accuracy: ${accuracy}% 🎯
Hints used: ${hintsUsed} 💪
Streak: ${currentStreak} 🔥
https://redacted-game.com`;
  };

  const handleCopyShare = async () => {
    soundFX.playKeypress();
    const text = generateShareText();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="DOSSIER DECLASSIFIED!"
      icon={<Trophy size={24} color="#ffd700" />}
    >
      <div style={{ textAlign: 'center', margin: '16px 0 24px 0' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--text-stamp)',
            color: '#ffffff',
            padding: '4px 14px',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            letterSpacing: '2px',
            marginBottom: '12px'
          }}
        >
          <Award size={14} /> CLASSIFIED IDENTITY CONFIRMED
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-typewriter)',
            fontSize: '2rem',
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}
        >
          "{articleTitle}"
        </h2>

        <a
          href={wikipediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginTop: '6px',
            textDecoration: 'underline'
          }}
        >
          Read unredacted article on Wikipedia <ExternalLink size={12} />
        </a>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <div
          className="classified-card"
          style={{ textAlign: 'center', padding: '12px 6px', margin: 0 }}
        >
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: 'var(--text-primary)'
            }}
          >
            {totalGuesses}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            TOTAL GUESSES
          </div>
        </div>

        <div
          className="classified-card"
          style={{ textAlign: 'center', padding: '12px 6px', margin: 0 }}
        >
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: 'var(--accent-hit)'
            }}
          >
            {accuracy}%
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            ACCURACY
          </div>
        </div>

        <div
          className="classified-card"
          style={{ textAlign: 'center', padding: '12px 6px', margin: 0 }}
        >
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: 'var(--accent-gold)'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              {currentStreak} <Flame size={18} fill="var(--accent-gold)" />
            </span>
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            DAILY STREAK
          </div>
        </div>
      </div>

      {/* Share Block Preview */}
      <div
        style={{
          background: 'var(--bg-surface)',
          padding: '12px',
          borderRadius: '4px',
          border: '1px dashed var(--border-color)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          whiteSpace: 'pre-wrap',
          color: 'var(--text-primary)'
        }}
      >
        {generateShareText()}
      </div>

      <button className="btn-share" onClick={handleCopyShare}>
        {copied ? <Check size={18} /> : <Share2 size={18} />}
        <span>
          {copied ? 'COPIED INTELLIGENCE TO CLIPBOARD!' : 'SHARE SPOILER-FREE REPORT'}
        </span>
      </button>
    </Modal>
  );
};
