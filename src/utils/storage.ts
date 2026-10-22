import type { GuessItem, PlayerStats, ThemeMode } from '@/types/game';
import {
  STATS_KEY,
  THEME_KEY,
  SOUND_KEY,
  PROGRESS_KEY_PREFIX,
  DEFAULT_PLAYER_STATS
} from '@/constants/storage';

export interface SavedPuzzleProgress {
  puzzleId: string;
  guesses: GuessItem[];
  revealedTokenIds: number[];
  isWon: boolean;
  hintsUsed: number;
  freeHintUsed: boolean;
  titleHintUsed: boolean;
  startTime: number;
  completedAt: number | null;
  durationSeconds: number;
}

export function getPuzzleStorageKey(puzzleId: string): string {
  return `${PROGRESS_KEY_PREFIX}${puzzleId}`;
}

export function savePuzzleProgress(puzzleId: string, progress: SavedPuzzleProgress): void {
  try {
    localStorage.setItem(getPuzzleStorageKey(puzzleId), JSON.stringify(progress));
  } catch (err) {
    console.error('Failed to save puzzle progress to localStorage', err);
  }
}

export function loadPuzzleProgress(puzzleId: string): SavedPuzzleProgress | null {
  try {
    const raw = localStorage.getItem(getPuzzleStorageKey(puzzleId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_PLAYER_STATS };
    return { ...DEFAULT_PLAYER_STATS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PLAYER_STATS };
  }
}

export function recordGameWin(puzzleDateUtc: string, totalGuesses: number): PlayerStats {
  const stats = loadPlayerStats();
  stats.gamesPlayed += 1;
  stats.gamesWon += 1;

  // Streak logic (based on consecutive UTC dates)
  if (stats.lastPlayedDateUtc) {
    const lastDate = new Date(`${stats.lastPlayedDateUtc}T00:00:00Z`);
    const currentDate = new Date(`${puzzleDateUtc}T00:00:00Z`);
    const diffDays = Math.round(
      (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      stats.currentStreak += 1;
    } else if (diffDays > 1) {
      stats.currentStreak = 1; // Streak broken, restart
    }
  } else {
    stats.currentStreak = 1;
  }

  if (stats.currentStreak > stats.maxStreak) {
    stats.maxStreak = stats.currentStreak;
  }
  stats.lastPlayedDateUtc = puzzleDateUtc;

  // Guess distribution bucket update
  if (totalGuesses <= 25) stats.guessDistribution['1-25'] += 1;
  else if (totalGuesses <= 50) stats.guessDistribution['26-50'] += 1;
  else if (totalGuesses <= 100) stats.guessDistribution['51-100'] += 1;
  else stats.guessDistribution['101+'] += 1;

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save stats', err);
  }

  return stats;
}

export function loadTheme(): ThemeMode {
  try {
    return (localStorage.getItem(THEME_KEY) as ThemeMode) || 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

export function loadSoundSetting(): boolean {
  try {
    const raw = localStorage.getItem(SOUND_KEY);
    return raw !== null ? raw === 'true' : true;
  } catch {
    return true;
  }
}

export function saveSoundSetting(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, String(enabled));
  } catch {}
}

// GDPR Article 20: Data Portability Export
export function exportAllUserData(): string {
  const exportData: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    stats: loadPlayerStats(),
    theme: loadTheme(),
    savedPuzzles: {}
  };

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PROGRESS_KEY_PREFIX)) {
        const val = localStorage.getItem(key);
        if (val) {
          (exportData.savedPuzzles as Record<string, unknown>)[key] = JSON.parse(val);
        }
      }
    }
  } catch (e) {
    console.error('Error compiling export', e);
  }

  return JSON.stringify(exportData, null, 2);
}

// GDPR Article 17: Right to Erasure / Soft Delete
export function clearAllUserData(): boolean {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('redacted_') || key.startsWith(PROGRESS_KEY_PREFIX))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    return true;
  } catch {
    return false;
  }
}
