import React, { useState } from 'react';
import type { GuessItem } from '@/types/game';
import { X, Search } from 'lucide-react';
import { GuessLogRow } from '@/components/sidebar/GuessLogRow';

export interface GuessLogSidebarProps {
  guesses: GuessItem[];
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onSelectWord: (word: string) => void;
  activeWord?: string | null;
  currentMatchIndex?: number;
}

export type SortOrder = 'recent' | 'hits' | 'alpha';

export const GuessLogSidebar: React.FC<GuessLogSidebarProps> = ({
  guesses,
  isOpenMobile,
  onCloseMobile,
  onSelectWord,
  activeWord = null,
  currentMatchIndex = 0
}) => {
  const [filterText, setFilterText] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');

  const filtered = guesses.filter(g =>
    g.word.toLowerCase().includes(filterText.toLowerCase().trim())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortOrder === 'recent') {
      return b.timestamp - a.timestamp;
    }
    if (sortOrder === 'hits') {
      if (b.hits !== a.hits) return b.hits - a.hits;
      return b.timestamp - a.timestamp;
    }
    if (sortOrder === 'alpha') {
      return a.word.localeCompare(b.word);
    }
    return 0;
  });

  return (
    <aside className={`guesses-sidebar ${isOpenMobile ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <span>TRANSMISSION LOG ({guesses.length})</span>
        {isOpenMobile && (
          <button className="icon-btn" onClick={onCloseMobile} aria-label="Close Log">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="sidebar-controls">
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: 8, color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="filter-input"
            style={{ paddingLeft: 26 }}
            placeholder="Filter past guesses..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
        </div>

        <select
          className="sort-select"
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value as SortOrder)}
          title="Sort order"
          aria-label="Sort past guesses"
        >
          <option value="recent">Recent</option>
          <option value="hits">Most Hits</option>
          <option value="alpha">A-Z</option>
        </select>
      </div>

      <div className="guesses-list">
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {guesses.length === 0
              ? 'No transmissions logged yet. Enter your first deduction below.'
              : 'No matching records found.'}
          </div>
        ) : (
          sorted.map(item => (
            <GuessLogRow
              key={item.id}
              item={item}
              isActive={activeWord === item.word}
              currentMatchIndex={currentMatchIndex}
              onSelectWord={onSelectWord}
            />
          ))
        )}
      </div>
    </aside>
  );
};
