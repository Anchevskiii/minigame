import type { StoredPuzzle, TokenRecord } from '../lib/store';

/**
 * Maskira posamezen žeton tako, da za še neodkrite besede odstrani `text`, `canonical` in `stem` (ADR 0003).
 */
export function maskToken(
  token: TokenRecord,
  revealedIds: Set<number>,
  isWon: boolean
): TokenRecord {
  if (token.type !== 'word' || token.isStopWord || isWon || revealedIds.has(token.id)) {
    return {
      ...token,
      isRevealed: true
    };
  }

  const len = token.length ?? token.text.length;
  return {
    id: token.id,
    type: 'word',
    text: '█'.repeat(len),
    length: len,
    isStopWord: false,
    isTitle: Boolean(token.isTitle),
    isRevealed: false
  };
}

/**
 * Pripravi varno (cenzurirano) različico uganke za prenos na odjemalca.
 * Rešitev (naslov članka, povezava do Wikipedije in neodkrite besede) ostane na strežniku do konca igre.
 */
export function maskPuzzleForClient(
  puzzle: StoredPuzzle,
  revealedIds: Set<number>,
  isWon: boolean
) {
  const tokenData = puzzle.content.tokenData;
  const totalTitleWords = tokenData.titleTokens.filter(
    t => t.type === 'word' && !t.isStopWord
  ).length;

  return {
    id: puzzle.id,
    puzzleNumber: puzzle.puzzleNumber,
    releaseDateUtc: puzzle.releaseDate,
    difficulty: puzzle.difficulty,
    status: puzzle.status,
    wikipediaTitle: isWon ? puzzle.title : '[CLASSIFIED]',
    wikipediaUrl: isWon ? puzzle.wikipediaUrl : '',
    totalTitleWords,
    stats: tokenData.stats,
    titleTokens: tokenData.titleTokens.map(t => maskToken(t, revealedIds, isWon)),
    titleTargetWords: isWon ? tokenData.titleTargetWords : [],
    sections: tokenData.sections.map(sec => ({
      heading: sec.heading
        ? {
            text: isWon ? sec.heading.text : '[CLASSIFIED]',
            tokens: sec.heading.tokens.map(t => maskToken(t, revealedIds, isWon))
          }
        : null,
      paragraphs: sec.paragraphs.map(p => ({
        tokens: p.tokens.map(t => maskToken(t, revealedIds, isWon))
      }))
    }))
  };
}

/**
 * Preveri, ali so razkrite vse ključne besede v naslovu članka.
 */
export function checkServerWinCondition(
  puzzle: StoredPuzzle,
  revealedIds: Set<number>
): boolean {
  const titleWords = puzzle.content.tokenData.titleTokens.filter(
    t => t.type === 'word' && !t.isStopWord
  );
  if (titleWords.length === 0) return false;
  return titleWords.every(t => revealedIds.has(t.id));
}
