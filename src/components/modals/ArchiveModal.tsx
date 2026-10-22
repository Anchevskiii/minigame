import React, { useState } from 'react';
import { FolderArchive, Lock, Unlock, Sparkles, Star } from 'lucide-react';
import { ARCHIVE_FILES } from '@/constants/archive';
import { soundFX } from '@/utils/audio';
import { Modal } from '@/components/common/Modal';

export interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPuzzleNumber: number;
  onSelectPuzzle: (puzzleNumber: number) => void;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  currentPuzzleNumber,
  onSelectPuzzle
}) => {
  const [isSubscriber, setIsSubscriber] = useState(true); // Default to unlocked for demo testing

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="HISTORICAL DOSSIER ARCHIVE"
      icon={<FolderArchive size={22} color="var(--text-primary)" />}
    >
      {/* Subscription Banner */}
      <div
        className="classified-card"
        style={{
          background: isSubscriber ? 'var(--accent-hit-light)' : 'var(--bg-surface)',
          borderColor: isSubscriber ? 'var(--accent-hit)' : 'var(--accent-gold)',
          marginBottom: '20px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 700,
              fontSize: '0.9rem'
            }}
          >
            <Star size={16} color="var(--accent-gold)" fill="var(--accent-gold)" />
            {isSubscriber
              ? 'FIELD OPERATIVE SUBSCRIPTION: ACTIVE'
              : 'ARCHIVE PASS REQUIRED ($2.99/mo)'}
          </div>
          <button
            style={{
              background: 'transparent',
              border: '1px dashed var(--border-color)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              padding: '3px 8px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => setIsSubscriber(!isSubscriber)}
          >
            Toggle Demo Sub ({isSubscriber ? 'Active' : 'Free'})
          </button>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isSubscriber
            ? 'All historical Wikipedia classified archives are unlocked. Rewarded ads are automatically disabled.'
            : 'Daily game is 100% free! Subscribe to unlock binge-play access to all past puzzles from Day 1.'}
        </p>
      </div>

      {/* Archive List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ARCHIVE_FILES.map(item => {
          const isCurrent = currentPuzzleNumber === item.number;
          const isAccessible = item.isToday || isSubscriber;

          return (
            <div
              key={item.number}
              className="guess-row"
              style={{
                opacity: isAccessible ? 1 : 0.65,
                cursor: isAccessible ? 'pointer' : 'not-allowed',
                borderColor: isCurrent ? 'var(--text-primary)' : 'var(--border-color)',
                background: isCurrent ? 'var(--bg-surface)' : 'var(--bg-card)'
              }}
              onClick={() => {
                if (isAccessible) {
                  soundFX.playKeypress();
                  onSelectPuzzle(item.number);
                  onClose();
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {item.isToday ? (
                  <Sparkles size={16} color="var(--accent-gold)" />
                ) : isAccessible ? (
                  <Unlock size={16} color="var(--accent-hit)" />
                ) : (
                  <Lock size={16} color="var(--text-muted)" />
                )}

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    DOSSIER #{item.number}{' '}
                    {item.isToday && (
                      <span style={{ color: 'var(--accent-gold)', fontSize: '0.75rem' }}>
                        (TODAY)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Released: {item.date} UTC
                  </div>
                </div>
              </div>

              <div>
                {isCurrent ? (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--accent-hit)'
                    }}
                  >
                    CURRENTLY PLAYING
                  </span>
                ) : isAccessible ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    LOAD FILE →
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-classified)' }}>
                    LOCKED
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
