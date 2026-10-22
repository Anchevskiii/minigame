import React from 'react';
import type { GuessItem } from '@/types/game';
import { soundFX } from '@/utils/audio';

interface GuessLogRowProps {
  item: GuessItem;
  isActive: boolean;
  currentMatchIndex: number;
  onSelectWord: (word: string) => void;
}

export const GuessLogRow: React.FC<GuessLogRowProps> = ({
  item,
  isActive,
  currentMatchIndex,
  onSelectWord
}) => {
  const getRowTitle = () => {
    if (item.hits > 1 && isActive) {
      const nextHit = ((currentMatchIndex + 1) % item.hits) + 1;
      return `Currently viewing hit ${currentMatchIndex + 1} of ${item.hits}. Click to jump to hit ${nextHit}.`;
    }
    if (item.hits > 1) {
      return `Click to view first of ${item.hits} hits (click repeatedly to cycle).`;
    }
    if (item.hits === 1) {
      return `Click to jump to instance of "${item.word}"`;
    }
    return undefined;
  };

  const classNames = [
    'guess-row',
    item.hits > 0 ? 'hit' : '',
    item.isTitleHit ? 'title-hit' : '',
    isActive ? 'active-focus' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      style={
        isActive
          ? { borderLeftWidth: 5, boxShadow: '0 0 8px rgba(0,0,0,0.1)' }
          : undefined
      }
      onClick={() => {
        soundFX.playKeypress();
        onSelectWord(item.word);
      }}
      title={getRowTitle()}
    >
      <span className="guess-word">
        {item.word}
        {item.isTitleHit && (
          <span
            style={{
              fontSize: '0.7rem',
              marginLeft: 6,
              color: 'var(--accent-gold)'
            }}
          >
            ★ TITLE
          </span>
        )}
      </span>

      <span className={`hits-badge ${item.hits > 0 ? 'has-hits' : 'zero-hits'}`}>
        {isActive && item.hits > 1
          ? `${currentMatchIndex + 1}/${item.hits}`
          : item.hits}
      </span>
    </div>
  );
};
