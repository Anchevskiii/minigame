import React from 'react';
import { Lightbulb } from 'lucide-react';
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
  onOpenHints: () => void;
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
  isWon,
  disabled = false,
  onOpenHints,
  onCycleNextOccurrence,
  onCyclePrevOccurrence
}) => {
  return (
    <div className="stats-ribbon">
      <div className="stats-chips">
        <span className="stat-chip">
          GUESSES: <strong>{totalGuesses}</strong>
        </span>
        <span className="stat-chip">
          HITS: <strong>{hitGuesses}</strong>
        </span>
        <span className="stat-chip">
          ACCURACY: <strong>{accuracy}%</strong>
        </span>

        {/* Stepper for cycling through multiple occurrences */}
        {focusedWord && focusedMatchCount > 1 && (
          <div className="hit-cycle-badge" title="Cycle through hits in document">
            <span>
              "{focusedWord}": {currentMatchIndex + 1}/{focusedMatchCount}
            </span>
            <button
              type="button"
              className="btn-cycle-nav"
              onClick={() => {
                soundFX.playKeypress();
                onCyclePrevOccurrence?.();
              }}
              title="Previous occurrence (Shift+Enter)"
              aria-label="Previous hit"
            >
              ▲
            </button>
            <button
              type="button"
              className="btn-cycle-nav"
              onClick={() => {
                soundFX.playKeypress();
                onCycleNextOccurrence?.();
              }}
              title="Next occurrence (Enter)"
              aria-label="Next hit"
            >
              ▼
            </button>
            <span className="hit-cycle-hint">(Enter to cycle)</span>
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn-hint-trigger"
        onClick={() => {
          soundFX.playKeypress();
          onOpenHints();
        }}
        disabled={isWon || disabled}
        title="Access Classified Intelligence Hints"
      >
        <Lightbulb size={16} />
        <span>HINTS</span>
      </button>
    </div>
  );
};
