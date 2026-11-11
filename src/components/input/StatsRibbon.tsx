import React from 'react';
import { soundFX } from '@/utils/audio';

interface StatsRibbonProps {
  totalGuesses: number;
  hitGuesses: number;
  accuracy: number;
  focusedWord?: string | null;
  focusedMatchCount?: number;
  currentMatchIndex?: number;
  isWon: boolean;
  disabled?: boolean;
  onOpenHints?: () => void;
  onCycleNextOccurrence?: () => void;
  onCyclePrevOccurrence?: () => void;
}

export const StatsRibbon: React.FC<StatsRibbonProps> = ({
  totalGuesses,
  hitGuesses,
  accuracy,
  focusedWord = null,
  focusedMatchCount = 0,
  currentMatchIndex = 0,
  onCycleNextOccurrence,
  onCyclePrevOccurrence
}) => {
  return (
    <div className="stats-ribbon">
      <div className="stats-chips">
        <span className="wf-box" style={{ padding: '4px 10px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}>
          POSKUSI: <strong>{totalGuesses}</strong>
        </span>
        <span className="wf-box" style={{ padding: '4px 10px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}>
          ZADETKI: <strong>{hitGuesses}</strong>
        </span>
        <span className="wf-box" style={{ padding: '4px 10px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}>
          NATANČNOST: <strong>{accuracy}%</strong>
        </span>

        {/* US-02 AC #3 & #4: Gumba »Prejšnji« in »Naslednji« ter števec »Zadetek X od Y« */}
        {focusedWord && focusedMatchCount > 0 && (
          <div className="hit-cycle-badge" title="Premikanje med pojavitvami besede v članku">
            <span>
              »{focusedWord.toUpperCase()}« — Zadetek {currentMatchIndex + 1} od {focusedMatchCount}
            </span>
            <button
              type="button"
              className="btn-cycle-nav"
              style={{ width: 'auto', padding: '0 6px', fontSize: '0.7rem' }}
              onClick={() => {
                soundFX.playKeypress();
                onCyclePrevOccurrence?.();
              }}
              title="Prejšnji zadetek (Shift+Enter)"
              aria-label="Prejšnji zadetek"
            >
              ◀ Prejšnji
            </button>
            <button
              type="button"
              className="btn-cycle-nav"
              style={{ width: 'auto', padding: '0 6px', fontSize: '0.7rem' }}
              onClick={() => {
                soundFX.playKeypress();
                onCycleNextOccurrence?.();
              }}
              title="Naslednji zadetek (Enter)"
              aria-label="Naslednji zadetek"
            >
              Naslednji ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
