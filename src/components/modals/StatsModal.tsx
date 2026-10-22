import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { PlayerStats } from '@/types/game';
import { Modal } from '@/components/common/Modal';

export interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, stats }) => {
  const winPercentage =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  const maxBucket = Math.max(
    1,
    stats.guessDistribution['1-25'],
    stats.guessDistribution['26-50'],
    stats.guessDistribution['51-100'],
    stats.guessDistribution['101+']
  );

  const buckets = [
    { label: '1 - 25', count: stats.guessDistribution['1-25'] },
    { label: '26 - 50', count: stats.guessDistribution['26-50'] },
    { label: '51 - 100', count: stats.guessDistribution['51-100'] },
    { label: '101+', count: stats.guessDistribution['101+'] }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AGENT CAREER METRICS"
      icon={<BarChart3 size={22} color="var(--text-primary)" />}
    >
      {/* 4-Stat Top Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginBottom: '24px',
          textAlign: 'center'
        }}
      >
        <div className="classified-card" style={{ padding: '12px 4px', margin: 0 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.gamesPlayed}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            PLAYED
          </div>
        </div>
        <div className="classified-card" style={{ padding: '12px 4px', margin: 0 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-hit)' }}>
            {winPercentage}%
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            WIN RATE
          </div>
        </div>
        <div className="classified-card" style={{ padding: '12px 4px', margin: 0 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
            {stats.currentStreak}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            STREAK
          </div>
        </div>
        <div className="classified-card" style={{ padding: '12px 4px', margin: 0 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.maxStreak}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            MAX STREAK
          </div>
        </div>
      </div>

      {/* Guess Distribution Bars */}
      <div className="classified-card">
        <h4>GUESS DISTRIBUTION</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          {buckets.map(b => {
            const widthPct = Math.max(8, Math.round((b.count / maxBucket) * 100));
            return (
              <div
                key={b.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <span style={{ width: '60px', color: 'var(--text-secondary)' }}>{b.label}</span>
                <div
                  style={{
                    flex: 1,
                    background: 'var(--bg-input)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${widthPct}%`,
                      background: b.count > 0 ? 'var(--text-primary)' : 'var(--border-color)',
                      color: 'var(--bg-card)',
                      padding: '3px 8px',
                      fontWeight: 700,
                      textAlign: 'right',
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }}
                  >
                    {b.count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
