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
      title="LESTVICA"
      icon={<Trophy size={22} color="var(--accent-gold)" />}
    >
      {/* WF-04: Dva zavihka: DANES in NIZ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className={tab === 'daily' ? 'wf-btn-dark' : 'wf-btn'}
          style={{ width: '100%', height: 38 }}
          onClick={() => {
            soundFX.playKeypress();
            setTab('daily');
          }}
        >
          <Calendar size={15} /> DANES (IZZIV #{puzzleNumber})
        </button>

        <button
          type="button"
          className={tab === 'streak' ? 'wf-btn-dark' : 'wf-btn'}
          style={{ width: '100%', height: 38 }}
          onClick={() => {
            soundFX.playKeypress();
            setTab('streak');
          }}
        >
          <Flame size={15} /> NIZ
        </button>
      </div>

      {/* WF-04: Tabela z razvrstitvijo po mestu in uporabniku s poudarjeno vrstico TI */}
      <div className="wf-box" style={{ padding: 0, overflow: 'hidden', marginBottom: 0 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              tab === 'daily' ? '60px 1fr 80px 90px 75px' : '60px 1fr 95px 95px 80px',
            padding: '10px 14px',
            background: 'var(--bg-surface)',
            borderBottom: '1.5px solid var(--border-color)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            fontWeight: 800,
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
                className={isHighlighted ? 'wf-box-highlight' : ''}
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    tab === 'daily' ? '60px 1fr 80px 90px 75px' : '60px 1fr 95px 95px 80px',
                  padding: '10px 14px',
                  borderBottom: isHighlighted ? undefined : '1px solid var(--border-color)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  alignItems: 'center',
                  fontWeight: isHighlighted ? 800 : 500,
                  margin: isHighlighted ? '4px 6px' : 0
                }}
              >
                <span>#{entry.rank}</span>
                <span>
                  {isHighlighted ? 'TI' : entry.username}{' '}
                  {isHighlighted && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--accent-gold)' }}>({entry.username})</span>
                  )}
                </span>
                {tab === 'daily' ? (
                  <>
                    <span style={{ textAlign: 'right', fontWeight: 700 }}>{entry.guessesCount}</span>
                    <span style={{ textAlign: 'right' }}>{entry.accuracyPercentage}%</span>
                    <span style={{ textAlign: 'right' }}>{formatSeconds(entry.durationSeconds)}</span>
                  </>
                ) : (
                  <>
                    <span style={{ textAlign: 'right', color: 'var(--accent-gold)', fontWeight: 800 }}>
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
