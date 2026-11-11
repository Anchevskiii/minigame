export type TokenType = 'word' | 'punct' | 'space';

export type UserRole = 'PLAYER' | 'EDITOR' | 'ADMIN';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';
export type PuzzleStatusType = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

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
  difficulty?: DifficultyLevel;
  status?: PuzzleStatusType;
  totalTitleWords?: number;
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

export interface AchievementItem {
  id: string;
  code: 'FIRST_WIN' | 'STREAK_7' | 'STREAK_30' | 'NO_HINTS' | 'FAST_SOLVER' | 'HIGH_ACCURACY';
  title: string;
  description: string;
  badgeIcon: string;
  requiredThreshold: number;
  unlocked?: boolean;
  unlockedAt?: string | null;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  totalGuesses?: number;
  hitGuesses?: number;
  accuracyPercentage?: number;
  lastPlayedDateUtc: string | null;
  guessDistribution: {
    '1-25': number;
    '26-50': number;
    '51-100': number;
    '101+': number;
  };
  achievements?: AchievementItem[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  guessesCount: number;
  accuracyPercentage: number;
  durationSeconds: number;
  currentStreak: number;
  maxStreak: number;
  gamesWon: number;
  isCurrentUser?: boolean;
}

export interface ArchiveEntry {
  id: string;
  puzzleNumber: number;
  releaseDate: string;
  difficulty: DifficultyLevel;
  status: PuzzleStatusType;
  isToday: boolean;
  solved: boolean;
  guessesCount: number | null;
}

export type ThemeMode = 'light' | 'dark' | 'terminal';
