import React, { useState } from 'react';
import {
  Trophy,
  Share2,
  ExternalLink,
  Check,
  Flame,
  FolderArchive,
  BarChart2,
  Clock
} from 'lucide-react';
import type { AchievementItem } from '@/types/game';
import { soundFX } from '@/utils/audio';
import { calculateAccuracy } from '@/utils/game-rules';
import { useDailyCountdown } from '@/hooks/useDailyCountdown';
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
  unlockedAchievements?: AchievementItem[];
  onOpenLeaderboard?: () => void;
  onOpenArchive?: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
  currentStreak,
  durationSeconds = 0,
  unlockedAchievements = [],
  onOpenLeaderboard,
  onOpenArchive
}) => {
  const [copied, setCopied] = useState(false);
  const countdown = useDailyCountdown();

  const accuracy = calculateAccuracy(hitGuesses, totalGuesses);
  const formattedTime = formatDuration(durationSeconds);

  // US-05 AC #3: Strukturirano besedilo z emoji ikonami, ki ne vsebuje naslova članka
  const generateShareText = () => {
    return `[REDACTED] #${puzzleNumber} 🌍
Poskusi: ${totalGuesses} 📉
Natančnost: ${accuracy}% 🎯
Čas: ${formattedTime} ⏱️
Namigi: ${hintsUsed} 💡
Niz zmag: ${currentStreak} 🔥`;
  };

  const handleCopyShare = async () => {
    soundFX.playKeypress();
    const text = generateShareText();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ČESTITKE"
      icon={<Trophy size={22} color="var(--accent-gold)" />}
    >
      <div style={{ textAlign: 'center', margin: '4px 0 16px 0' }}>
        <div className="wf-label" style={{ marginBottom: 6 }}>
          UGANJENO GESLO
        </div>

        <div
          className="wf-box"
          style={{
            padding: '12px 16px',
            fontFamily: 'var(--font-typewriter)',
            fontSize: '1.65rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '8px'
          }}
        >
          {articleTitle}
        </div>

        {wikipediaUrl && (
          <a
            href={wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              textDecoration: 'underline'
            }}
          >
            Preberi izvirni članek na Wikipediji <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* WF-02: Mreža 4 ključnih metrik (Poskusi, Odstotkov, Čas, Namigi) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginBottom: '14px'
        }}
      >
        <div className="wf-box" style={{ textAlign: 'center', padding: '10px 4px' }}>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {totalGuesses}
          </div>
          <div className="wf-label" style={{ fontSize: '0.66rem', marginTop: 2 }}>
            POSKUSI
          </div>
        </div>

        <div className="wf-box" style={{ textAlign: 'center', padding: '10px 4px' }}>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-hit)' }}>
            {accuracy}%
          </div>
          <div className="wf-label" style={{ fontSize: '0.66rem', marginTop: 2 }}>
            ODSTOTKOV
          </div>
        </div>

        <div className="wf-box" style={{ textAlign: 'center', padding: '10px 4px' }}>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formattedTime}
          </div>
          <div className="wf-label" style={{ fontSize: '0.66rem', marginTop: 2 }}>
            ČAS
          </div>
        </div>

        <div className="wf-box" style={{ textAlign: 'center', padding: '10px 4px' }}>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
            {hintsUsed}
          </div>
          <div className="wf-label" style={{ fontSize: '0.66rem', marginTop: 2 }}>
            NAMIGI
          </div>
        </div>
      </div>

      {/* WF-02: Dnevni niz */}
      <div
        className="wf-box"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          marginBottom: '10px'
        }}
      >
        <span className="wf-title" style={{ fontSize: '0.8rem' }}>
          DNEVNI NIZ
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: 800,
            fontSize: '1.1rem',
            color: 'var(--accent-gold)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {currentStreak} DNI <Flame size={18} fill="var(--accent-gold)" />
        </span>
      </div>

      {/* WF-02: Novi dosežek */}
      {unlockedAchievements.length > 0 && (
        <div
          className="wf-box-highlight"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            marginBottom: '10px'
          }}
        >
          <span className="wf-title" style={{ fontSize: '0.8rem' }}>
            NOVI DOSEŽEK
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {unlockedAchievements.map(a => a.title).join(', ')}
          </span>
        </div>
      )}

      {/* Gumb DELI REZULTAT po WF-02 */}
      <button
        type="button"
        className="wf-btn-dark"
        style={{ width: '100%', height: 44, fontSize: '0.88rem', marginTop: 6 }}
        onClick={handleCopyShare}
      >
        {copied ? <Check size={18} /> : <Share2 size={18} />}
        <span>{copied ? 'REZULTAT SKOPIRAN!' : 'DELI REZULTAT'}</span>
      </button>

      {/* WF-02: Navigacijska gumba LESTVICA in ARHIV */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        {onOpenLeaderboard && (
          <button
            type="button"
            className="wf-btn"
            style={{ width: '100%', height: 40 }}
            onClick={() => {
              onClose();
              onOpenLeaderboard();
            }}
          >
            <BarChart2 size={16} /> LESTVICA
          </button>
        )}
        {onOpenArchive && (
          <button
            type="button"
            className="wf-btn"
            style={{ width: '100%', height: 40 }}
            onClick={() => {
              onClose();
              onOpenArchive();
            }}
          >
            <FolderArchive size={16} /> ARHIV
          </button>
        )}
      </div>

      {/* WF-02: Napotek o času naslednjega izziva */}
      <div
        className="wf-label"
        style={{
          textAlign: 'center',
          marginTop: 14,
          fontSize: '0.72rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6
        }}
      >
        <Clock size={13} /> NASLEDNJI IZZIV OB POLNOČI (00:00 UTC) // Čez {countdown}
      </div>
    </Modal>
  );
};
