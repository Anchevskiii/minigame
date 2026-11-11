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
export type FilterMode = 'all' | 'hits';

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
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const filtered = guesses.filter(g => {
    if (filterMode === 'hits' && g.hits <= 0) return false;
    return g.word.toLowerCase().includes(filterText.toLowerCase().trim());
  });

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
        <span>ZGODOVINA POSKUSOV ({guesses.length})</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            className="icon-btn"
            style={{
              width: 'auto',
              height: 24,
              padding: '0 8px',
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              background: filterMode === 'all' ? 'var(--text-primary)' : 'var(--bg-card)',
              color: filterMode === 'all' ? 'var(--bg-card)' : 'var(--text-secondary)'
            }}
            onClick={() => setFilterMode('all')}
          >
            VSI
          </button>
          <button
            type="button"
            className="icon-btn"
            style={{
              width: 'auto',
              height: 24,
              padding: '0 8px',
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              background: filterMode === 'hits' ? 'var(--accent-hit)' : 'var(--bg-card)',
              color: filterMode === 'hits' ? '#ffffff' : 'var(--text-secondary)'
            }}
            onClick={() => setFilterMode('hits')}
          >
            ZADETKI
          </button>
          {isOpenMobile && (
            <button className="icon-btn" onClick={onCloseMobile} aria-label="Zapri seznam">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-controls">
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: 8, color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="filter-input"
            style={{ paddingLeft: 26 }}
            placeholder="Išči med poskusi..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
        </div>

        <select
          className="sort-select"
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value as SortOrder)}
          title="Razvrsti poskuse"
          aria-label="Razvrsti poskuse"
        >
          <option value="recent">Najnovejši</option>
          <option value="hits">Največ zadetkov</option>
          <option value="alpha">A-Ž</option>
        </select>
      </div>

      <div className="guesses-list">
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {guesses.length === 0
              ? 'Seznam poskusov je še prazen. Vpišite prvo besedo v spodnje polje.'
              : 'Ni ujemajočih se poskusov.'}
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
