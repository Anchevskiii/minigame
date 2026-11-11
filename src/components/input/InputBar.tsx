import React, { useState, useRef, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';
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
  duplicateGuessMessage?: string | null;
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
  onCyclePrevOccurrence,
  duplicateGuessMessage = null
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
    ? 'DOKUMENT V CELOTI RAZKRIT // REŠENO'
    : isNextHitAction
    ? `Pritisnite Enter za skok na zadetek ${((currentMatchIndex + 1) % focusedMatchCount) + 1} od ${focusedMatchCount}...`
    : 'Vnesite besedo za ugibanje...';

  return (
    <footer className="sticky-input-container">
      <div className="input-bar-inner">
        {duplicateGuessMessage && (
          <div
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 4,
              background: 'var(--bg-surface)',
              border: '1px solid var(--accent-gold)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem'
            }}
          >
            <AlertCircle size={14} color="var(--accent-gold)" />
            <span>{duplicateGuessMessage}</span>
          </div>
        )}

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
            className="wf-btn-dark"
            style={{ height: 46, padding: '0 22px', fontSize: '0.85rem' }}
            disabled={(!inputValue.trim() && focusedMatchCount <= 1) || isWon || disabled}
          >
            {isWon ? (
              <CheckCircle2 size={18} />
            ) : isNextHitAction ? (
              <span>NASLEDNJI ↷</span>
            ) : (
              <Send size={16} />
            )}
            <span style={{ marginLeft: 4 }}>
              {isWon ? 'REŠENO' : isNextHitAction ? '' : 'UGIBAJ'}
            </span>
          </button>

          {/* WF-01: Gumb NAMIG desno ob gumbu UGIBAJ */}
          <button
            type="button"
            className="wf-btn"
            style={{ height: 46, padding: '0 16px', fontSize: '0.82rem' }}
            onClick={() => {
              soundFX.playKeypress();
              onOpenHints();
            }}
            disabled={isWon || disabled}
            title="Dostop do pomoči (NAMIG)"
          >
            <Lightbulb size={16} />
            <span>NAMIG</span>
          </button>
        </form>
      </div>
    </footer>
  );
};
