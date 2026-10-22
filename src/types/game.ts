export type TokenType = 'word' | 'punct' | 'space';

export interface Token {
  id: number;
  type: TokenType;
  text: string;
  canonical?: string;
  stem?: string;
  length?: number;
  isStopWord?: boolean;
  isTitle?: boolean;
  isRevealed: boolean;
}

export interface SectionHeading {
  text: string;
  tokens: Token[];
}

export interface Paragraph {
  tokens: Token[];
}

export interface Section {
  heading: SectionHeading | null;
  paragraphs: Paragraph[];
}

export interface PuzzleStats {
  totalWords: number;
  hiddenWords: number;
  stopWordsCount: number;
  paragraphCount: number;
}

export interface Puzzle {
  id: string;
  puzzleNumber: number;
  releaseDateUtc: string;
  wikipediaTitle: string;
  wikipediaUrl: string;
  stats: PuzzleStats;
  titleTokens: Token[];
  titleTargetWords: string[];
  sections: Section[];
}

export interface GuessItem {
  id: string;
  word: string;
  stem: string;
  hits: number;
  isTitleHit: boolean;
  timestamp: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDateUtc: string | null;
  guessDistribution: {
    '1-25': number;
    '26-50': number;
    '51-100': number;
    '101+': number;
  };
}

export type ThemeMode = 'light' | 'dark' | 'terminal';
