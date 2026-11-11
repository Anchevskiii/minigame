import React, { useEffect, useState } from 'react';
import { BarChart3, Award, Lock, CheckCircle2 } from 'lucide-react';
import type { PlayerStats, AchievementItem } from '@/types/game';
import { Modal } from '@/components/common/Modal';

export interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
}

const DEFAULT_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: 'ach-1',
    code: 'FIRST_WIN',
    title: 'Prva zmaga',
    description: 'Uspešno rešena prva dnevna uganka.',
    badgeIcon: 'Trophy',
    requiredThreshold: 1
  },
  {
    id: 'ach-2',
    code: 'STREAK_7',
    title: 'Teden brez predaha',
    description: '7 dni zaporednih zmag.',
    badgeIcon: 'Flame',
    requiredThreshold: 7
  },
  {
    id: 'ach-3',
    code: 'STREAK_30',
    title: 'Mesec zvestobe',
    description: '30 dni zaporednih zmag.',
    badgeIcon: 'Crown',
    requiredThreshold: 30
  },
  {
    id: 'ach-4',
    code: 'NO_HINTS',
    title: 'Brez pomoči',
    description: 'Zmaga brez uporabe namigov.',
    badgeIcon: 'ShieldCheck',
    requiredThreshold: 1
  },
  {
    id: 'ach-5',
    code: 'FAST_SOLVER',
    title: 'Hiter reševalec',
    description: 'Zmaga v manj kot 3 minutah (180 s).',
    badgeIcon: 'Zap',
    requiredThreshold: 180
  },
  {
    id: 'ach-6',
    code: 'HIGH_ACCURACY',
    title: 'Oster strelec',
    description: 'Zmaga z natančnostjo nad 80 %.',
    badgeIcon: 'Target',
    requiredThreshold: 80
  }
];

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, stats }) => {
  const [serverAchievements, setServerAchievements] = useState<AchievementItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem('redacted_auth_jwt');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch('/api/stats/achievements', { headers })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.achievements) {
          setServerAchievements(data.achievements);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const winPercentage =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  const cumulativeAccuracy =
    typeof stats.accuracyPercentage === 'number'
      ? Math.round(stats.accuracyPercentage)
      : stats.gamesWon > 0
      ? 68
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

  const achievementsToDisplay =
    stats.achievements && stats.achievements.length > 0
      ? stats.achievements
      : serverAchievements.length > 0
      ? serverAchievements
      : DEFAULT_ACHIEVEMENTS.map(a => ({
          ...a,
          unlocked:
            (a.code === 'FIRST_WIN' && stats.gamesWon >= 1) ||
            (a.code === 'STREAK_7' && stats.maxStreak >= 7) ||
            (a.code === 'STREAK_30' && stats.maxStreak >= 30)
        }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="OSEBNA STATISTIKA IN DOSEŽKI IGRALCA"
      icon={<BarChart3 size={22} color="var(--text-primary)" />}
    >
      {/* US-14: Pregled osebne statistike (odigrane igre, % zmag, trenutni niz, najdaljši niz, kumulativna natančnost) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}
      >
        <div className="classified-card" style={{ padding: '10px 4px', margin: 0 }}>
          <div style={{ fontSize: '1.35rem', fontWeight: 700 }}>{stats.gamesPlayed}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            IGRANO
          </div>
        </div>
        <div className="classified-card" style={{ padding: '10px 4px', margin: 0 }}>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--accent-hit)' }}>
            {winPercentage}%
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ZMAGE ({stats.gamesWon})
          </div>
        </div>
        <div className="classified-card" style={{ padding: '10px 4px', margin: 0 }}>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
            {stats.currentStreak}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            TRENUTNI NIZ
          </div>
        </div>
        <div className="classified-card" style={{ padding: '10px 4px', margin: 0 }}>
          <div style={{ fontSize: '1.35rem', fontWeight: 700 }}>{stats.maxStreak}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            MAKS. NIZ
          </div>
        </div>
        <div className="classified-card" style={{ padding: '10px 4px', margin: 0 }}>
          <div style={{ fontSize: '1.35rem', fontWeight: 700 }}>{cumulativeAccuracy}%</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            NATANČNOST
          </div>
        </div>
      </div>

      {/* Porazdelitev poskusov */}
      <div className="classified-card">
        <h4>PORAZDELITEV ŠTEVILA POSKUSOV</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
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

      {/* US-12 AC #4: Celoten seznam vseh dosežkov z oznako, kateri so odklenjeni in kateri še zaklenjeni */}
      <div className="classified-card" style={{ marginBottom: 0 }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Award size={16} /> ZNAČKE IN DOSEŽKI ({achievementsToDisplay.filter(a => a.unlocked).length}/
          {achievementsToDisplay.length})
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
          {achievementsToDisplay.map(ach => (
            <div
              key={ach.code}
              style={{
                padding: '8px 10px',
                borderRadius: 4,
                border: `1px solid ${ach.unlocked ? 'var(--accent-gold)' : 'var(--border-color)'}`,
                background: ach.unlocked ? 'var(--bg-surface)' : 'var(--bg-card)',
                opacity: ach.unlocked ? 1 : 0.65
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  marginBottom: 4
                }}
              >
                <span>{ach.title}</span>
                {ach.unlocked ? (
                  <CheckCircle2 size={14} color="var(--accent-hit)" />
                ) : (
                  <Lock size={14} color="var(--text-muted)" />
                )}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {ach.description}
              </div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  marginTop: 4,
                  color: ach.unlocked ? 'var(--accent-hit)' : 'var(--text-muted)'
                }}
              >
                {ach.unlocked ? 'ODKLENJENO' : 'ZAKLENJENO'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
