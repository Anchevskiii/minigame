import React, { useState, useRef, useEffect } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { soundFX } from '@/utils/audio';
import { calculateAccuracy } from '@/utils/game-rules';
import { StatsRibbon } from '@/components/input/StatsRibbon';

export interface InputBarProps {
  totalGuesses: number;
  hitGuesses: number;
  onGuess: (rawWord: string) => void;
  onOpenHints: () => void;
  isWon: boolean;
  disabled?: boolean;
  focusedWord?: string | null;
  focusedMatchCount?: number;
  currentMatchIndex?: number;
  onCycleNextOccurrence?: () => void;
  onCyclePrevOccurrence?: () => void;
}

export const InputBar: React.FC<InputBarProps> = ({
  totalGuesses,
  hitGuesses,
  onGuess,
  onOpenHints,
  isWon,
  disabled = false,
  focusedWord = null,
  focusedMatchCount = 0,
  currentMatchIndex = 0,
  onCycleNextOccurrence,
  onCyclePrevOccurrence
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const accuracy = calculateAccuracy(hitGuesses, totalGuesses);

  useEffect(() => {
    if (!isWon) {
      inputRef.current?.focus();
    }
  }, [isWon]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    if (isWon || disabled) return;

    // If input is empty and we have multiple hits for the focused word, Enter cycles to next hit
    if (!trimmed) {
      if (focusedMatchCount > 1 && onCycleNextOccurrence) {
        soundFX.playKeypress();
        onCycleNextOccurrence();
      }
      return;
    }

    soundFX.playKeypress();
    onGuess(trimmed);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey && onCyclePrevOccurrence && !inputValue.trim()) {
        e.preventDefault();
        soundFX.playKeypress();
        onCyclePrevOccurrence();
        return;
      }
      handleSubmit();
    } else {
      soundFX.playKeypress();
    }
  };

  const isNextHitAction = !inputValue.trim() && focusedMatchCount > 1;

  const placeholderText = isWon
    ? 'DECRYPTED // DOCUMENT FULLY UNVEILED'
    : isNextHitAction
    ? `Press Enter to jump to hit ${((currentMatchIndex + 1) % focusedMatchCount) + 1}/${focusedMatchCount}...`
    : 'Enter intel word to deduce...';

  return (
    <footer className="sticky-input-container">
      <div className="input-bar-inner">
        <StatsRibbon
          totalGuesses={totalGuesses}
          hitGuesses={hitGuesses}
          accuracy={accuracy}
          focusedWord={focusedWord}
          focusedMatchCount={focusedMatchCount}
          currentMatchIndex={currentMatchIndex}
          isWon={isWon}
          disabled={disabled}
          onOpenHints={onOpenHints}
          onCycleNextOccurrence={onCycleNextOccurrence}
          onCyclePrevOccurrence={onCyclePrevOccurrence}
        />

        <form className="input-form-row" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="guess-input-field"
            placeholder={placeholderText}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isWon || disabled}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            maxLength={35}
          />

          <button
            type="submit"
            className="btn-guess"
            disabled={(!inputValue.trim() && focusedMatchCount <= 1) || isWon || disabled}
          >
            {isWon ? (
              <CheckCircle2 size={18} />
            ) : isNextHitAction ? (
              <span>NEXT HIT ↷</span>
            ) : (
              <Send size={18} />
            )}
            <span style={{ marginLeft: 6 }}>
              {isWon ? 'SOLVED' : isNextHitAction ? '' : 'GUESS'}
            </span>
          </button>
        </form>
      </div>
    </footer>
  );
};
