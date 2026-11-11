import crypto from 'node:crypto';
import type { AchievementCode } from '@prisma/client';
import {
  store,
  type StoredPuzzle,
  type StoredGameSession,
  type TokenRecord,
  type StoredAchievement
} from '../lib/store';
import { prisma } from '../lib/prisma';
import { checkServerWinCondition } from './masking';

export interface ServerGuessResult {
  alreadyGuessed: boolean;
  message?: string;
  cleanedWord: string;
  stem: string;
  hits: number;
  isTitleHit: boolean;
  allMatchingIds: number[];
  newlyRevealedTokens: TokenRecord[];
  isWon: boolean;
  unlockedAchievements: StoredAchievement[];
}

/**
 * Poišče vse žetone v uganki, ki se ujemajo z vneseno besedo ali njenim korenom (Porter Stemmer).
 */
export function evaluateServerGuess(
  puzzle: StoredPuzzle,
  cleanedWord: string,
  stem: string,
  alreadyRevealedIds: Set<number>
): {
  allMatchingIds: number[];
  newlyRevealedTokens: TokenRecord[];
  hits: number;
  isTitleHit: boolean;
} {
  const allMatchingIds: number[] = [];
  const newlyRevealedTokens: TokenRecord[] = [];
  let hits = 0;
  let isTitleHit = false;

  const inspectToken = (token: TokenRecord) => {
    if (token.type !== 'word' || token.isStopWord) return;

    const isExactMatch = token.canonical === cleanedWord;
    const isStemMatch = token.stem === stem;

    if (isExactMatch || isStemMatch) {
      allMatchingIds.push(token.id);
      if (!alreadyRevealedIds.has(token.id)) {
        newlyRevealedTokens.push({
          ...token,
          isRevealed: true
        });
        hits++;
        if (token.isTitle) {
          isTitleHit = true;
        }
      }
    }
  };

  const tokenData = puzzle.content.tokenData;
  tokenData.titleTokens.forEach(inspectToken);
  tokenData.sections.forEach(sec => {
    if (sec.heading) {
      sec.heading.tokens.forEach(inspectToken);
    }
    sec.paragraphs.forEach(p => {
      p.tokens.forEach(inspectToken);
    });
  });

  return {
    allMatchingIds,
    newlyRevealedTokens,
    hits,
    isTitleHit
  };
}

/**
 * Posodobi statistiko uporabnika (`user_stats`) in preveri ter odklene značke (`user_achievements`) ob zmagi.
 */
export async function finalizeSessionVictory(
  session: StoredGameSession,
  puzzle: StoredPuzzle
): Promise<StoredAchievement[]> {
  if (!session.userId) return [];

  const userId = session.userId;
  let stats = store.userStats.get(userId);
  if (!stats) {
    stats = {
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
  }

  const todayStr = puzzle.releaseDate;
  if (stats.lastPlayedDate !== todayStr) {
    stats.currentStreak += 1;
    if (stats.currentStreak > stats.maxStreak) {
      stats.maxStreak = stats.currentStreak;
    }
    stats.lastPlayedDate = todayStr;
  } else if (stats.currentStreak === 0) {
    stats.currentStreak = 1;
    stats.maxStreak = Math.max(1, stats.maxStreak);
  }

  stats.gamesPlayed += 1;
  stats.gamesWon += 1;
  stats.totalGuesses += session.guessesCount;
  stats.hitGuesses += session.hitsCount;
  stats.accuracyPercentage =
    stats.totalGuesses > 0
      ? Number(((stats.hitGuesses / stats.totalGuesses) * 100).toFixed(2))
      : 0;

  store.userStats.set(userId, stats);

  // Preveri pogoje za dosežke (US-12)
  const gameAccuracy =
    session.guessesCount > 0 ? (session.hitsCount / session.guessesCount) * 100 : 0;

  const candidateCodes: AchievementCode[] = ['FIRST_WIN'];
  if (stats.currentStreak >= 7) candidateCodes.push('STREAK_7');
  if (stats.currentStreak >= 30) candidateCodes.push('STREAK_30');
  if (session.hintsUsed === 0) candidateCodes.push('NO_HINTS');
  if (session.durationSeconds <= 180) candidateCodes.push('FAST_SOLVER');
  if (gameAccuracy > 80) candidateCodes.push('HIGH_ACCURACY');

  const existingUserAch = store.userAchievements.get(userId) || [];
  const existingCodes = new Set(existingUserAch.map(a => a.code));
  const newlyUnlocked: StoredAchievement[] = [];

  for (const code of candidateCodes) {
    if (!existingCodes.has(code)) {
      const achDef = store.achievements.find(a => a.code === code);
      if (achDef) {
        existingUserAch.push({
          userId,
          achievementId: achDef.id,
          code: achDef.code,
          unlockedAt: new Date()
        });
        newlyUnlocked.push(achDef);
      }
    }
  }

  store.userAchievements.set(userId, existingUserAch);

  if (store.isUsingDatabase() && prisma) {
    try {
      await prisma.userStats.upsert({
        where: { userId },
        update: {
          currentStreak: stats.currentStreak,
          maxStreak: stats.maxStreak,
          gamesPlayed: stats.gamesPlayed,
          gamesWon: stats.gamesWon,
          totalGuesses: stats.totalGuesses,
          hitGuesses: stats.hitGuesses,
          accuracyPercentage: stats.accuracyPercentage,
          lastPlayedDate: new Date(`${todayStr}T00:00:00Z`)
        },
        create: {
          userId,
          currentStreak: stats.currentStreak,
          maxStreak: stats.maxStreak,
          gamesPlayed: stats.gamesPlayed,
          gamesWon: stats.gamesWon,
          totalGuesses: stats.totalGuesses,
          hitGuesses: stats.hitGuesses,
          accuracyPercentage: stats.accuracyPercentage,
          lastPlayedDate: new Date(`${todayStr}T00:00:00Z`)
        }
      });
    } catch (err) {
      console.error('Napaka pri posodabljanju user_stats v Prisma:', err);
    }
  }

  return newlyUnlocked;
}

/**
 * Izvede poskus ugibanja v okviru igralne seje, zapiše v `guess_logs` in preveri zmago.
 */
export async function processSessionGuess(
  session: StoredGameSession,
  puzzle: StoredPuzzle,
  cleanedWord: string,
  stem: string,
  durationSeconds?: number
): Promise<ServerGuessResult> {
  if (typeof durationSeconds === 'number' && durationSeconds >= session.durationSeconds) {
    session.durationSeconds = Math.floor(durationSeconds);
  }

  // US-01 AC #5: Sistem prepreči ponovni vnos že prej uganjene besede brez povečanja števca poskusov
  const duplicate = session.guessLogs.find(
    g => g.wordRaw === cleanedWord || g.normalizedStem === stem
  );
  const revealedSet = new Set<number>(session.revealedTokenIds);

  if (duplicate) {
    const evalExisting = evaluateServerGuess(puzzle, cleanedWord, stem, revealedSet);
    return {
      alreadyGuessed: true,
      message: `Beseda »${cleanedWord.toUpperCase()}« (ali njen koren) je bila že uganjena! Števec poskusov se ni povečal.`,
      cleanedWord,
      stem,
      hits: duplicate.matchCount,
      isTitleHit: evalExisting.isTitleHit,
      allMatchingIds: evalExisting.allMatchingIds,
      newlyRevealedTokens: [],
      isWon: session.status === 'WON',
      unlockedAchievements: []
    };
  }

  const evalResult = evaluateServerGuess(puzzle, cleanedWord, stem, revealedSet);
  evalResult.newlyRevealedTokens.forEach(t => revealedSet.add(t.id));
  session.revealedTokenIds = Array.from(revealedSet);

  const guessOrder = session.guessLogs.length + 1;
  const guessEntry = {
    id: crypto.randomUUID(),
    sessionId: session.id,
    wordRaw: cleanedWord,
    normalizedStem: stem,
    matchCount: evalResult.hits,
    guessOrder,
    createdAt: new Date()
  };

  session.guessLogs.push(guessEntry);
  session.guessesCount = session.guessLogs.length;
  if (evalResult.hits > 0) {
    session.hitsCount += 1;
  }

  const wonNow = checkServerWinCondition(puzzle, revealedSet);
  let unlockedAchievements: StoredAchievement[] = [];

  if (wonNow && session.status !== 'WON') {
    session.status = 'WON';
    session.completedAt = new Date();
    unlockedAchievements = await finalizeSessionVictory(session, puzzle);
  }

  if (store.isUsingDatabase() && prisma) {
    try {
      await prisma.gameSession.upsert({
        where: { id: session.id },
        update: {
          status: session.status,
          guessesCount: session.guessesCount,
          hitsCount: session.hitsCount,
          hintsUsed: session.hintsUsed,
          durationSeconds: session.durationSeconds,
          completedAt: session.completedAt
        },
        create: {
          id: session.id,
          userId: session.userId,
          puzzleId: session.puzzleId,
          status: session.status,
          guessesCount: session.guessesCount,
          hitsCount: session.hitsCount,
          hintsUsed: session.hintsUsed,
          durationSeconds: session.durationSeconds,
          startedAt: session.startedAt,
          completedAt: session.completedAt
        }
      });

      await prisma.guessLog.create({
        data: {
          id: guessEntry.id,
          sessionId: session.id,
          wordRaw: guessEntry.wordRaw,
          normalizedStem: guessEntry.normalizedStem,
          matchCount: guessEntry.matchCount,
          guessOrder: guessEntry.guessOrder,
          createdAt: guessEntry.createdAt
        }
      });
    } catch (err) {
      console.error('Napaka pri zapisu v guess_logs / game_sessions:', err);
    }
  }

  return {
    alreadyGuessed: false,
    cleanedWord,
    stem,
    hits: evalResult.hits,
    isTitleHit: evalResult.isTitleHit,
    allMatchingIds: evalResult.allMatchingIds,
    newlyRevealedTokens: evalResult.newlyRevealedTokens,
    isWon: session.status === 'WON',
    unlockedAchievements
  };
}
