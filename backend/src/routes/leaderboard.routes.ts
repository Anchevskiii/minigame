import { Router, type Request, type Response } from 'express';
import { store } from '../lib/store';
import { authenticateOptional } from '../middleware/auth';

export const leaderboardRouter = Router();

/**
 * GET /api/archive
 * US-08: Vrne kronološki seznam objavljenih in arhiviranih ugank z datumom, zaporedno številko in statusom rešenosti.
 */
leaderboardRouter.get('/archive', authenticateOptional, (req: Request, res: Response) => {
  const userId = req.user?.id ?? null;

  const visiblePuzzles = Array.from(store.puzzles.values())
    .filter(p => p.status === 'PUBLISHED' || p.status === 'ARCHIVED')
    .sort((a, b) => b.puzzleNumber - a.puzzleNumber);

  const items = visiblePuzzles.map(p => {
    let solved = false;
    let guessesCount: number | null = null;

    if (userId) {
      const wonSession = Array.from(store.sessions.values()).find(
        s => s.userId === userId && s.puzzleId === p.id && s.status === 'WON'
      );
      if (wonSession) {
        solved = true;
        guessesCount = wonSession.guessesCount;
      }
    }

    return {
      id: p.id,
      puzzleNumber: p.puzzleNumber,
      releaseDate: p.releaseDate,
      difficulty: p.difficulty,
      status: p.status,
      isToday: p.status === 'PUBLISHED',
      solved,
      guessesCount
    };
  });

  res.json({ archive: items });
});

/**
 * GET /api/leaderboard
 * US-09: Javna lestvica najboljših igralcev.
 * Primarno razvrščeno po najmanjšem številu poskusov (`guessesCount ASC`), sekundarno po krajšem času (`durationSeconds ASC`).
 * Vključuje tudi skupno lestvico najdaljših nizov zaporednih zmag (`streak`).
 */
leaderboardRouter.get('/leaderboard', authenticateOptional, (req: Request, res: Response) => {
  const currentUserId = req.user?.id ?? null;

  const publishedPuzzle =
    Array.from(store.puzzles.values()).find(p => p.status === 'PUBLISHED') ||
    Array.from(store.puzzles.values())[0];

  // 1. Dnevna lestvica za današnjo uganko
  const dailySessions = Array.from(store.sessions.values()).filter(
    s =>
      publishedPuzzle &&
      s.puzzleId === publishedPuzzle.id &&
      s.status === 'WON' &&
      s.userId
  );

  // Združi po uporabniku (najboljši rezultat uporabnika na današnji uganki)
  const bestByUser = new Map<string, (typeof dailySessions)[number]>();
  for (const s of dailySessions) {
    const existing = bestByUser.get(s.userId!);
    if (
      !existing ||
      s.guessesCount < existing.guessesCount ||
      (s.guessesCount === existing.guessesCount && s.durationSeconds < existing.durationSeconds)
    ) {
      bestByUser.set(s.userId!, s);
    }
  }

  const dailySorted = Array.from(bestByUser.values()).sort((a, b) => {
    if (a.guessesCount !== b.guessesCount) return a.guessesCount - b.guessesCount;
    return a.durationSeconds - b.durationSeconds;
  });

  const daily = dailySorted.map((s, idx) => {
    const u = store.users.get(s.userId!);
    const stats = store.userStats.get(s.userId!);
    const acc =
      s.guessesCount > 0 ? Math.round((s.hitsCount / s.guessesCount) * 100) : 0;

    return {
      rank: idx + 1,
      userId: s.userId!,
      username: u?.username || 'Igralec',
      guessesCount: s.guessesCount,
      accuracyPercentage: acc,
      durationSeconds: s.durationSeconds,
      currentStreak: stats?.currentStreak ?? 1,
      maxStreak: stats?.maxStreak ?? 1,
      gamesWon: stats?.gamesWon ?? 1,
      isCurrentUser: currentUserId === s.userId
    };
  });

  // 2. Lestvica najdaljših nizov zaporednih zmag (streak)
  const streakSorted = Array.from(store.userStats.values())
    .sort((a, b) => {
      if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
      if (b.maxStreak !== a.maxStreak) return b.maxStreak - a.maxStreak;
      return b.gamesWon - a.gamesWon;
    });

  const streak = streakSorted.map((st, idx) => {
    const u = store.users.get(st.userId);
    return {
      rank: idx + 1,
      userId: st.userId,
      username: u?.username || 'Igralec',
      guessesCount: st.totalGuesses,
      accuracyPercentage: Math.round(st.accuracyPercentage),
      durationSeconds: 0,
      currentStreak: st.currentStreak,
      maxStreak: st.maxStreak,
      gamesWon: st.gamesWon,
      isCurrentUser: currentUserId === st.userId
    };
  });

  res.json({
    puzzleNumber: publishedPuzzle?.puzzleNumber ?? 2,
    daily,
    streak
  });
});
