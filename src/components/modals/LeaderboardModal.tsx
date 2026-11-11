import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Calendar } from 'lucide-react';
import type { LeaderboardEntry, UserProfile } from '@/types/game';
import { Modal } from '@/components/common/Modal';
import { soundFX } from '@/utils/audio';

export interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null;
}

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  user = null
}) => {
  const [tab, setTab] = useState<'daily' | 'streak'>('daily');
  const [dailyRows, setDailyRows] = useState<LeaderboardEntry[]>([]);
  const [streakRows, setStreakRows] = useState<LeaderboardEntry[]>([]);
  const [puzzleNumber, setPuzzleNumber] = useState<number>(2);

  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem('redacted_auth_jwt');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch('/api/leaderboard', { headers })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) {
          setDailyRows(data.daily || []);
          setStreakRows(data.streak || []);
          if (data.puzzleNumber) setPuzzleNumber(data.puzzleNumber);
        }
      })
      .catch(() => {});
  }, [isOpen, user]);

  const rows = tab === 'daily' ? dailyRows : streakRows;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="JAVNA LESTVICA NAJBOLJŠIH IGRALCEV"
      icon={<Trophy size={22} color="var(--accent-gold)" />}
    >
      {/* US-09 AC #4 & WF-04: Preklop med dnevnimi rezultati (DANES) in najdaljšimi nizi (NIZ) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className="icon-btn"
          style={{
            width: '100%',
            height: 40,
            gap: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            background: tab === 'daily' ? 'var(--text-primary)' : 'var(--bg-card)',
            color: tab === 'daily' ? 'var(--bg-card)' : 'var(--text-primary)'
          }}
          onClick={() => {
            soundFX.playKeypress();
            setTab('daily');
          }}
        >
          <Calendar size={15} /> DANES (IZZIV #{puzzleNumber})
        </button>

        <button
          type="button"
          className="icon-btn"
          style={{
            width: '100%',
            height: 40,
            gap: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            background: tab === 'streak' ? 'var(--text-primary)' : 'var(--bg-card)',
            color: tab === 'streak' ? 'var(--bg-card)' : 'var(--text-primary)'
          }}
          onClick={() => {
            soundFX.playKeypress();
            setTab('streak');
          }}
        >
          <Flame size={15} /> NAJDALJŠI NIZ (STREAK)
        </button>
      </div>

      {/* US-09 AC #1, #2, #3: Tabela z razvrstitvijo in barvno poudarjeno vrstico prijavljenega uporabnika */}
      <div className="classified-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 0 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              tab === 'daily' ? '50px 1fr 80px 90px 75px' : '50px 1fr 95px 95px 80px',
            padding: '10px 12px',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-color)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--text-secondary)'
          }}
        >
          <span>MESTO</span>
          <span>UPORABNIK</span>
          {tab === 'daily' ? (
            <>
              <span style={{ textAlign: 'right' }}>POSKUSI</span>
              <span style={{ textAlign: 'right' }}>NATANČNOST</span>
              <span style={{ textAlign: 'right' }}>ČAS</span>
            </>
          ) : (
            <>
              <span style={{ textAlign: 'right' }}>TRENUTNI NIZ</span>
              <span style={{ textAlign: 'right' }}>MAKS. NIZ</span>
              <span style={{ textAlign: 'right' }}>ZMAGE</span>
            </>
          )}
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Trenutno še ni zabeleženih rezultatov na lestvici.
          </div>
        ) : (
          rows.map(entry => {
            const isHighlighted =
              Boolean(entry.isCurrentUser) || (user && user.id === entry.userId);

            return (
              <div
                key={`${tab}-${entry.userId}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    tab === 'daily' ? '50px 1fr 80px 90px 75px' : '50px 1fr 95px 95px 80px',
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border-color)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  alignItems: 'center',
                  background: isHighlighted ? 'var(--accent-hit-light)' : 'transparent',
                  borderLeft: isHighlighted ? '4px solid var(--accent-hit)' : 'none',
                  fontWeight: isHighlighted ? 700 : 500
                }}
              >
                <span>#{entry.rank}</span>
                <span>
                  {entry.username}{' '}
                  {isHighlighted && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-hit)' }}>(VI)</span>
                  )}
                </span>
                {tab === 'daily' ? (
                  <>
                    <span style={{ textAlign: 'right' }}>{entry.guessesCount}</span>
                    <span style={{ textAlign: 'right' }}>{entry.accuracyPercentage}%</span>
                    <span style={{ textAlign: 'right' }}>{formatSeconds(entry.durationSeconds)}</span>
                  </>
                ) : (
                  <>
                    <span style={{ textAlign: 'right', color: 'var(--accent-gold)', fontWeight: 700 }}>
                      {entry.currentStreak} 🔥
                    </span>
                    <span style={{ textAlign: 'right' }}>{entry.maxStreak} dni</span>
                    <span style={{ textAlign: 'right' }}>{entry.gamesWon}</span>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
};
