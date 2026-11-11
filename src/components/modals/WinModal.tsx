import React, { useState } from 'react';
import {
  Trophy,
  Share2,
  ExternalLink,
  Check,
  Flame,
  Award,
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
      title="ČESTITKE — DOKUMENT DEKLASIFICIRAN!"
      icon={<Trophy size={24} color="#ffd700" />}
    >
      <div style={{ textAlign: 'center', margin: '12px 0 20px 0' }}>
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
            fontSize: '0.78rem',
            letterSpacing: '2px',
            marginBottom: '10px'
          }}
        >
          <Award size={14} /> SKRITI NASLOV ČLANKA RAZKRIT
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-typewriter)',
            fontSize: '1.85rem',
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}
        >
          »{articleTitle}«
        </h2>

        {wikipediaUrl && (
          <a
            href={wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
              marginTop: '6px',
              textDecoration: 'underline'
            }}
          >
            Preberi izvirni članek na Wikipediji <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* WF-02 & US-05 AC #2: Mreža 4 ključnih metrik (Poskusi, Natančnost, Čas, Namigi) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginBottom: '16px'
        }}
      >
        <div className="classified-card" style={{ textAlign: 'center', padding: '10px 4px', margin: 0 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {totalGuesses}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            POSKUSI
          </div>
        </div>

        <div className="classified-card" style={{ textAlign: 'center', padding: '10px 4px', margin: 0 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-hit)' }}>
            {accuracy}%
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            NATANČNOST
          </div>
        </div>

        <div className="classified-card" style={{ textAlign: 'center', padding: '10px 4px', margin: 0 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formattedTime}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ČAS
          </div>
        </div>

        <div className="classified-card" style={{ textAlign: 'center', padding: '10px 4px', margin: 0 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
            {hintsUsed}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            NAMIGI
          </div>
        </div>
      </div>

      {/* WF-02: Dnevni niz (Streak) */}
      <div
        className="classified-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          marginBottom: '12px'
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700 }}>
          DNEVNI NIZ ZMAG:
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: 700,
            color: 'var(--accent-gold)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {currentStreak} DNI <Flame size={18} fill="var(--accent-gold)" />
        </span>
      </div>

      {/* US-12 AC #3 & WF-02: Obvestilo o osvojenih dosežkih */}
      {unlockedAchievements.length > 0 && (
        <div
          className="classified-card"
          style={{
            borderColor: 'var(--accent-gold)',
            background: 'var(--bg-surface)',
            marginBottom: '12px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--accent-gold)',
              marginBottom: 4
            }}
          >
            <Award size={16} /> ODKLENJEN POSEBEN DOSEŽEK:
          </div>
          {unlockedAchievements.map(ach => (
            <div key={ach.code} style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              🏅 {ach.title} — <span style={{ fontWeight: 400 }}>{ach.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Predogled besedila za deljenje */}
      <div
        style={{
          background: 'var(--bg-surface)',
          padding: '10px 12px',
          borderRadius: '4px',
          border: '1px dashed var(--border-color)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.82rem',
          whiteSpace: 'pre-wrap',
          color: 'var(--text-primary)'
        }}
      >
        {generateShareText()}
      </div>

      {/* US-05 AC #3 & #4: Gumb »Deli rezultat« z jasno vizualno potrditvijo */}
      <button type="button" className="btn-share" onClick={handleCopyShare}>
        {copied ? <Check size={18} /> : <Share2 size={18} />}
        <span>
          {copied ? 'Rezultat skopiran v odložišče!' : 'DELI REZULTAT'}
        </span>
      </button>

      {/* WF-02: Navigacijska gumba za prehod na LESTVICO ali v ARHIV */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        {onOpenLeaderboard && (
          <button
            type="button"
            className="btn-share"
            style={{
              marginTop: 0,
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '10px'
            }}
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
            className="btn-share"
            style={{
              marginTop: 0,
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '10px'
            }}
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
        style={{
          textAlign: 'center',
          marginTop: 14,
          fontSize: '0.76rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6
        }}
      >
        <Clock size={13} /> Naslednji dnevni izziv ob 00:00 UTC (čez {countdown})
      </div>
    </Modal>
  );
};
