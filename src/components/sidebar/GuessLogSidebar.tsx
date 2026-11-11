import React, { useState } from 'react';
import type { GuessItem } from '@/types/game';
import { Search } from 'lucide-react';
import { GuessLogRow } from '@/components/sidebar/GuessLogRow';

export interface GuessLogSidebarProps {
  guesses: GuessItem[];
  onSelectWord: (word: string) => void;
  activeWord?: string | null;
  currentMatchIndex?: number;
}

export type SortOrder = 'recent' | 'hits' | 'alpha';
export type FilterMode = 'all' | 'hits';

export const GuessLogSidebar: React.FC<GuessLogSidebarProps> = ({
  guesses,
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

  // WF-01: Dodelitev zaporednih številk poskusov (1 do N) glede na čas vnosa
  const orderMap = new Map<string, number>();
  [...guesses]
    .sort((a, b) => a.timestamp - b.timestamp)
    .forEach((g, idx) => orderMap.set(g.id, idx + 1));

  return (
    <aside className="guesses-sidebar">
      <div className="sidebar-header" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span className="wf-title" style={{ letterSpacing: '2px' }}>ZGODOVINA</span>
        </div>

        {/* WF-01: Dva zavihka: VSI [count] in ZADETKI [count] */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, width: '100%' }}>
          <button
            type="button"
            className={filterMode === 'all' ? 'wf-btn-dark' : 'wf-btn'}
            style={{ height: 32, padding: '0 8px', fontSize: '0.74rem' }}
            onClick={() => setFilterMode('all')}
          >
            VSI {guesses.length}
          </button>
          <button
            type="button"
            className={filterMode === 'hits' ? 'wf-btn-dark' : 'wf-btn'}
            style={{ height: 32, padding: '0 8px', fontSize: '0.74rem' }}
            onClick={() => setFilterMode('hits')}
          >
            ZADETKI {guesses.filter(g => g.hits > 0).length}
          </button>
        </div>
      </div>

      <div className="sidebar-controls">
        <div style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: 8, color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="filter-input"
            style={{ paddingLeft: 26, width: '100%' }}
            placeholder="Išči..."
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
          <option value="hits">Zadetki</option>
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
              orderNumber={orderMap.get(item.id)}
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
