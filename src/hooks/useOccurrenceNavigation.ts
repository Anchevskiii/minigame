import { useState, useCallback } from 'react';

export function useOccurrenceNavigation() {
  const [focusedWord, setFocusedWord] = useState<string | null>(null);
  const [focusedMatchIndex, setFocusedMatchIndex] = useState<number>(0);
  const [focusedMatchingTokenIds, setFocusedMatchingTokenIds] = useState<number[]>([]);
  const [currentFocusTokenId, setCurrentFocusTokenId] = useState<number | null>(null);
  const [activeHighlightedTokenIds, setActiveHighlightedTokenIds] = useState<Set<number>>(
    new Set()
  );

  const scrollToToken = useCallback((tokenId: number) => {
    setCurrentFocusTokenId(tokenId);
    setTimeout(() => {
      const el = document.getElementById(`token-${tokenId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 40);
  }, []);

  const cycleNextOccurrence = useCallback(() => {
    if (focusedMatchingTokenIds.length === 0) return;
    const nextIndex = (focusedMatchIndex + 1) % focusedMatchingTokenIds.length;
    setFocusedMatchIndex(nextIndex);
    scrollToToken(focusedMatchingTokenIds[nextIndex]);
  }, [focusedMatchIndex, focusedMatchingTokenIds, scrollToToken]);

  const cyclePrevOccurrence = useCallback(() => {
    if (focusedMatchingTokenIds.length === 0) return;
    const prevIndex =
      (focusedMatchIndex - 1 + focusedMatchingTokenIds.length) %
      focusedMatchingTokenIds.length;
    setFocusedMatchIndex(prevIndex);
    scrollToToken(focusedMatchingTokenIds[prevIndex]);
  }, [focusedMatchIndex, focusedMatchingTokenIds, scrollToToken]);

  const setFocus = useCallback(
    (word: string, matchingIds: number[]) => {
      setFocusedWord(word);
      setFocusedMatchingTokenIds(matchingIds);
      setFocusedMatchIndex(0);

      if (matchingIds.length > 0) {
        setActiveHighlightedTokenIds(new Set(matchingIds));
        scrollToToken(matchingIds[0]);
      } else {
        setActiveHighlightedTokenIds(new Set());
        setCurrentFocusTokenId(null);
      }
    },
    [scrollToToken]
  );

  const resetFocus = useCallback(() => {
    setFocusedWord(null);
    setFocusedMatchIndex(0);
    setFocusedMatchingTokenIds([]);
    setCurrentFocusTokenId(null);
    setActiveHighlightedTokenIds(new Set());
  }, []);

  return {
    focusedWord,
    focusedMatchIndex,
    focusedMatchingTokenIds,
    currentFocusTokenId,
    activeHighlightedTokenIds,
    scrollToToken,
    cycleNextOccurrence,
    cyclePrevOccurrence,
    setFocus,
    resetFocus
  };
}
