import type { PlayerStats } from '@/types/game';

export const STATS_KEY = 'redacted_player_stats_v1';
export const THEME_KEY = 'redacted_theme_mode';
export const SOUND_KEY = 'redacted_sound_enabled';
export const PROGRESS_KEY_PREFIX = 'redacted_progress_';

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDateUtc: null,
  guessDistribution: {
    '1-25': 0,
    '26-50': 0,
    '51-100': 0,
    '101+': 0
  }
};
