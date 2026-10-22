import type { Puzzle, Token } from '@/types/game';

export interface GuessEvaluationResult {
  allMatchingIds: number[];
  newlyRevealedIds: number[];
  hits: number;
  isTitleHit: boolean;
}

/**
 * Checks whether all target keywords in the article title are revealed
 */
export function checkWinCondition(
  revealedTokenIds: Set<number>,
  puzzle: Puzzle
): boolean {
  const titleWordTokens = puzzle.titleTokens.filter(
    (t: Token) => t.type === 'word' && !t.isStopWord
  );
  if (titleWordTokens.length === 0) return false;
  return titleWordTokens.every((t: Token) => revealedTokenIds.has(t.id));
}

/**
 * Evaluates a cleaned word guess against all tokens in the puzzle
 */
export function evaluateGuessInPuzzle(
  puzzle: Puzzle,
  cleanedWord: string,
  stem: string,
  revealedTokenIds: Set<number>
): GuessEvaluationResult {
  const newlyRevealedIds: number[] = [];
  const allMatchingIds: number[] = [];
  let hits = 0;
  let isTitleHit = false;

  const testToken = (token: Token) => {
    if (token.type !== 'word' || token.isStopWord) return;

    const isExactMatch = token.canonical === cleanedWord;
    const isStemMatch = token.stem === stem;

    if (isExactMatch || isStemMatch) {
      allMatchingIds.push(token.id);
      if (!revealedTokenIds.has(token.id)) {
        newlyRevealedIds.push(token.id);
        hits++;
        if (token.isTitle) {
          isTitleHit = true;
        }
      }
    }
  };

  // 1. Scan title tokens
  puzzle.titleTokens.forEach(testToken);

  // 2. Scan body sections in reading order
  puzzle.sections.forEach(section => {
    if (section.heading) {
      section.heading.tokens.forEach(testToken);
    }
    section.paragraphs.forEach(paragraph => {
      paragraph.tokens.forEach(testToken);
    });
  });

  return {
    allMatchingIds,
    newlyRevealedIds,
    hits,
    isTitleHit
  };
}

/**
 * Finds all token IDs matching a given canonical word or stem
 */
export function findMatchingTokenIds(
  puzzle: Puzzle,
  canonicalWord: string,
  stem: string
): number[] {
  const matchingIds: number[] = [];

  const checkToken = (token: Token) => {
    if (token.type !== 'word' || token.isStopWord) return;
    if (token.canonical === canonicalWord || token.stem === stem) {
      matchingIds.push(token.id);
    }
  };

  puzzle.titleTokens.forEach(checkToken);
  puzzle.sections.forEach(section => {
    if (section.heading) {
      section.heading.tokens.forEach(checkToken);
    }
    section.paragraphs.forEach(paragraph => {
      paragraph.tokens.forEach(checkToken);
    });
  });

  return matchingIds;
}

/**
 * Tier 1 hint: Selects a high-frequency unrevealed word from the document body
 */
export function findFreeHintCandidate(
  puzzle: Puzzle,
  revealedTokenIds: Set<number>
): string | null {
  const unrevealedBodyTokens: Token[] = [];

  puzzle.sections.forEach(section => {
    section.paragraphs.forEach(paragraph => {
      paragraph.tokens.forEach(token => {
        if (
          token.type === 'word' &&
          !token.isStopWord &&
          !revealedTokenIds.has(token.id) &&
          token.canonical
        ) {
          unrevealedBodyTokens.push(token);
        }
      });
    });
  });

  if (unrevealedBodyTokens.length === 0) return null;

  const freqMap = new Map<string, number>();
  unrevealedBodyTokens.forEach(token => {
    freqMap.set(token.canonical!, (freqMap.get(token.canonical!) || 0) + 1);
  });

  const candidates = Array.from(freqMap.entries())
    .filter(([, count]) => count >= 2)
    .map(([word]) => word);

  if (candidates.length > 0) {
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  }

  const randomIndex = Math.floor(Math.random() * unrevealedBodyTokens.length);
  return unrevealedBodyTokens[randomIndex].canonical ?? null;
}

/**
 * Tier 2 hint: Selects the first unrevealed title keyword
 */
export function findTitleHintCandidate(
  puzzle: Puzzle,
  revealedTokenIds: Set<number>
): string | null {
  const unrevealedTitleTokens = puzzle.titleTokens.filter(
    (token: Token) =>
      token.type === 'word' &&
      !token.isStopWord &&
      !revealedTokenIds.has(token.id) &&
      token.canonical
  );

  if (unrevealedTitleTokens.length === 0) return null;
  return unrevealedTitleTokens[0].canonical ?? null;
}

/**
 * Calculates guess accuracy percentage
 */
export function calculateAccuracy(hitGuesses: number, totalGuesses: number): number {
  if (totalGuesses <= 0) return 0;
  return Math.round((hitGuesses / totalGuesses) * 100);
}
