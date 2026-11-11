import { Router, type Request, type Response } from 'express';
import { store } from '../lib/store';
import { authenticateOptional, requireAuth } from '../middleware/auth';

export const statsRouter = Router();

/**
 * GET /api/stats/achievements
 * Vrne seznam vseh možnih dosežkov v sistemu (US-12).
 */
statsRouter.get('/achievements', authenticateOptional, (req: Request, res: Response) => {
  const userId = req.user?.id;
  const userUnlocked = userId ? store.userAchievements.get(userId) || [] : [];
  const unlockedMap = new Map(userUnlocked.map(u => [u.code, u.unlockedAt]));

  const achievements = store.achievements.map(ach => ({
    ...ach,
    unlocked: unlockedMap.has(ach.code),
    unlockedAt: unlockedMap.get(ach.code)?.toISOString() ?? null
  }));

  res.json({ achievements });
});

/**
 * GET /api/stats/me
 * US-14 & US-12: Vrne osebno statistiko prijavljenega igralca iz `user_stats` in njegove dosežke iz `user_achievements`.
 */
statsRouter.get('/me', authenticateOptional, requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const rawStats = store.userStats.get(userId) || {
    userId,
    currentStreak: 0,
    maxStreak: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    totalGuesses: 0,
    hitGuesses: 0,
    accuracyPercentage: 0,
    lastPlayedDate: null
  };

  // Izračun porazdelitve poskusov iz zaključenih sej uporabnika
  const distribution = {
    '1-25': 0,
    '26-50': 0,
    '51-100': 0,
    '101+': 0
  };

  for (const s of store.sessions.values()) {
    if (s.userId === userId && s.status === 'WON') {
      if (s.guessesCount <= 25) distribution['1-25']++;
      else if (s.guessesCount <= 50) distribution['26-50']++;
      else if (s.guessesCount <= 100) distribution['51-100']++;
      else distribution['101+']++;
    }
  }

  const userUnlocked = store.userAchievements.get(userId) || [];
  const unlockedMap = new Map(userUnlocked.map(u => [u.code, u.unlockedAt]));

  const achievements = store.achievements.map(ach => ({
    ...ach,
    unlocked: unlockedMap.has(ach.code),
    unlockedAt: unlockedMap.get(ach.code)?.toISOString() ?? null
  }));

  res.json({
    stats: {
      gamesPlayed: rawStats.gamesPlayed,
      gamesWon: rawStats.gamesWon,
      currentStreak: rawStats.currentStreak,
      maxStreak: rawStats.maxStreak,
      totalGuesses: rawStats.totalGuesses,
      hitGuesses: rawStats.hitGuesses,
      accuracyPercentage: rawStats.accuracyPercentage,
      lastPlayedDateUtc: rawStats.lastPlayedDate,
      guessDistribution: distribution
    },
    achievements
  });
});
