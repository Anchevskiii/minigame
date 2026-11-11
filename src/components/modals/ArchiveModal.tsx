import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Lock,
  Unlock,
  Sparkles,
  Search,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import type { ArchiveEntry, UserProfile } from '@/types/game';
import { ARCHIVE_FILES } from '@/constants/archive';
import { loadPuzzleProgress } from '@/utils/storage';
import { soundFX } from '@/utils/audio';
import { Modal } from '@/components/common/Modal';

export interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPuzzleNumber: number;
  onSelectPuzzle: (puzzleNumber: number) => void;
  user?: UserProfile | null;
  onRequestLogin?: () => void;
}

const PAGE_SIZE = 4;

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  currentPuzzleNumber,
  onSelectPuzzle,
  user = null,
  onRequestLogin
}) => {
  const [archiveItems, setArchiveItems] = useState<ArchiveEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem('redacted_auth_jwt');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch('/api/archive', { headers })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.archive) {
          setArchiveItems(data.archive);
        } else {
          // Fallback na lokalni seznam
          const fallback: ArchiveEntry[] = ARCHIVE_FILES.map(f => {
            const localSaved = loadPuzzleProgress(`puzzle-${f.number}`);
            return {
              id: `puzzle-${f.number}`,
              puzzleNumber: f.number,
              releaseDate: f.date,
              difficulty: f.number === 3 ? 'HARD' : f.number % 2 === 0 ? 'EASY' : 'MEDIUM',
              status: f.isToday ? 'PUBLISHED' : 'ARCHIVED',
              isToday: f.isToday,
              solved: Boolean(localSaved?.isWon),
              guessesCount: localSaved?.isWon ? localSaved.guesses.length : null
            };
          });
          setArchiveItems(fallback);
        }
      })
      .catch(() => {
        const fallback: ArchiveEntry[] = ARCHIVE_FILES.map(f => {
          const localSaved = loadPuzzleProgress(`puzzle-${f.number}`);
          return {
            id: `puzzle-${f.number}`,
            puzzleNumber: f.number,
            releaseDate: f.date,
            difficulty: f.number === 3 ? 'HARD' : f.number % 2 === 0 ? 'EASY' : 'MEDIUM',
            status: f.isToday ? 'PUBLISHED' : 'ARCHIVED',
            isToday: f.isToday,
            solved: Boolean(localSaved?.isWon),
            guessesCount: localSaved?.isWon ? localSaved.guesses.length : null
          };
        });
        setArchiveItems(fallback);
      });
  }, [isOpen, user]);

  const filtered = archiveItems.filter(item => {
    if (difficultyFilter !== 'ALL' && item.difficulty !== difficultyFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return (
        `izziv #${item.puzzleNumber}`.includes(q) ||
        String(item.puzzleNumber).includes(q) ||
        item.releaseDate.includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ZGODOVINSKI ARHIV PRETEKLIH UGANK"
      icon={<FolderArchive size={22} color="var(--text-primary)" />}
    >
      {/* US-08 AC #4: Neregistriranim gostom sistem ob kliku na arhiv prikaže prijazen poziv k prijavi */}
      {!user && (
        <div
          className="classified-card"
          style={{
            borderColor: 'var(--accent-gold)',
            background: 'var(--bg-surface)',
            marginBottom: 16
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div>
              <h4 style={{ margin: 0, color: 'var(--accent-gold)' }}>
                DOSTOP DO PRETEKLIH UGANK ZA REGISTRIRANE IGRALCE
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Današnja dnevna uganka je brezplačno odprta za vse goste! Za reševanje preteklih izzivov iz arhiva in shranjevanje napredka se prijavite.
              </p>
            </div>
            {onRequestLogin && (
              <button
                type="button"
                className="btn-share"
                style={{
                  width: 'auto',
                  marginTop: 0,
                  padding: '8px 14px',
                  fontSize: '0.78rem',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => {
                  soundFX.playKeypress();
                  onClose();
                  onRequestLogin();
                }}
              >
                <UserCheck size={15} /> Prijava / Registracija
              </button>
            )}
          </div>
        </div>
      )}

      {/* WF-04: Polje za ISKANJE ter filter kategorij (VSE / EASY / MEDIUM / HARD) */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="filter-input"
            style={{ width: '100%', paddingLeft: 30, height: 38 }}
            placeholder="ISKANJE PO ŠTEVILKI ALI DATUMU..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="sort-select"
          style={{ height: 38, fontFamily: 'var(--font-mono)', fontWeight: 700 }}
          value={difficultyFilter}
          onChange={e => {
            setDifficultyFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter težavnosti"
        >
          <option value="ALL">VSE</option>
          <option value="EASY">LAHKA (EASY)</option>
          <option value="MEDIUM">SREDNJA (MEDIUM)</option>
          <option value="HARD">TEŽKA (HARD)</option>
        </select>
      </div>

      {/* WF-04: Seznam kartic preteklih ugank (IZZIV X s statusom REŠENO ali REŠUJ) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {paginated.map(item => {
          const isCurrent = currentPuzzleNumber === item.puzzleNumber;
          const isAccessible = item.isToday || Boolean(user);
          const localSaved = loadPuzzleProgress(`puzzle-${item.puzzleNumber}`);
          const isSolved = item.solved || Boolean(localSaved?.isWon);
          const solvedGuesses =
            item.guessesCount ?? (localSaved?.isWon ? localSaved.guesses.length : null);

          return (
            <div
              key={item.puzzleNumber}
              className="wf-box"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                opacity: isAccessible ? 1 : 0.75,
                borderColor: isCurrent ? 'var(--text-primary)' : 'var(--border-color)',
                background: isCurrent ? 'var(--bg-surface)' : 'var(--bg-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {item.isToday ? (
                  <Sparkles size={16} color="var(--accent-gold)" />
                ) : isSolved ? (
                  <CheckCircle2 size={16} color="var(--accent-hit)" />
                ) : isAccessible ? (
                  <Unlock size={16} color="var(--text-secondary)" />
                ) : (
                  <Lock size={16} color="var(--text-muted)" />
                )}

                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', fontFamily: 'var(--font-mono)' }}>
                    IZZIV {item.puzzleNumber}{' '}
                    {item.isToday && (
                      <span style={{ color: 'var(--accent-gold)', fontSize: '0.72rem' }}>
                        (DANES)
                      </span>
                    )}
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: '0.65rem',
                        padding: '1px 6px',
                        borderRadius: 3,
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {item.difficulty}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Datum objave: {item.releaseDate}
                  </div>
                </div>
              </div>

              {/* WF-04: Gumb stanja: RESENO (light) ali RESUJ (dark) */}
              <div>
                {isSolved ? (
                  <button
                    type="button"
                    className="wf-btn"
                    style={{ height: 34, padding: '0 12px', fontSize: '0.75rem' }}
                    onClick={() => {
                      soundFX.playKeypress();
                      onSelectPuzzle(item.puzzleNumber);
                      onClose();
                    }}
                  >
                    REŠENO {solvedGuesses ? `(${solvedGuesses})` : ''}
                  </button>
                ) : isAccessible ? (
                  <button
                    type="button"
                    className="wf-btn-dark"
                    style={{ height: 34, padding: '0 16px', fontSize: '0.75rem' }}
                    onClick={() => {
                      soundFX.playKeypress();
                      onSelectPuzzle(item.puzzleNumber);
                      onClose();
                    }}
                  >
                    REŠUJ →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="wf-btn"
                    style={{ height: 34, padding: '0 10px', fontSize: '0.72rem', borderColor: 'var(--accent-gold)' }}
                    onClick={() => {
                      soundFX.playKeypress();
                      onClose();
                      onRequestLogin?.();
                    }}
                  >
                    PRIJAVA 🔒
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* WF-04: Paginacija (PREJ, X OD Y, DALJE) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem'
        }}
      >
        <button
          type="button"
          className="wf-btn"
          style={{ height: 32, padding: '0 14px' }}
          disabled={currentPage <= 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          PREJ
        </button>
        <span className="wf-label">
          {currentPage} OD {totalPages}
        </span>
        <button
          type="button"
          className="wf-btn"
          style={{ height: 32, padding: '0 14px' }}
          disabled={currentPage >= totalPages}
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        >
          DALJE
        </button>
      </div>
    </Modal>
  );
};
