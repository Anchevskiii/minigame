import crypto from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { store, type StoredPuzzle, type StoredGameSession } from '../lib/store';
import { authenticateOptional } from '../middleware/auth';
import { maskPuzzleForClient } from '../utils/masking';
import { cleanGuess, stemWord } from '../utils/stemmer';
import { processSessionGuess } from '../utils/game-engine';

export const gameRouter = Router();

/**
 * Poišče ali ustvari aktivno igralno sejo za določeno uganko.
 */
export function getOrCreateSession(
  puzzle: StoredPuzzle,
  userId: string | null,
  sessionIdParam?: string
): StoredGameSession {
  if (sessionIdParam) {
    const byId = store.sessions.get(sessionIdParam);
    if (byId && byId.puzzleId === puzzle.id) {
      if (userId && !byId.userId) {
        byId.userId = userId;
      }
      return byId;
    }
  }

  if (userId) {
    const existingForUser = Array.from(store.sessions.values()).find(
      s => s.userId === userId && s.puzzleId === puzzle.id
    );
    if (existingForUser) {
      return existingForUser;
    }
  }

  const newSession: StoredGameSession = {
    id: crypto.randomUUID(),
    userId,
    puzzleId: puzzle.id,
    status: 'IN_PROGRESS',
    guessesCount: 0,
    hitsCount: 0,
    hintsUsed: 0,
    basicHintsUsed: 0,
    titleHintUsed: false,
    revealedTokenIds: [],
    durationSeconds: 0,
    startedAt: new Date(),
    completedAt: null,
    guessLogs: []
  };

  store.sessions.set(newSession.id, newSession);
  return newSession;
}

export function formatSessionResponse(session: StoredGameSession, puzzle: StoredPuzzle) {
  const revealedSet = new Set<number>(session.revealedTokenIds);
  const titleHitStems = new Set<string>(
    puzzle.content.tokenData.titleTokens
      .filter(t => t.type === 'word' && !t.isStopWord && t.stem)
      .map(t => t.stem!)
  );

  const guesses = [...session.guessLogs]
    .sort((a, b) => b.guessOrder - a.guessOrder)
    .map(g => ({
      id: g.id,
      word: g.wordRaw,
      stem: g.normalizedStem,
      hits: g.matchCount,
      isTitleHit: titleHitStems.has(g.normalizedStem),
      timestamp: g.createdAt.getTime()
    }));

  return {
    id: session.id,
    puzzleId: session.puzzleId,
    status: session.status,
    isWon: session.status === 'WON',
    guessesCount: session.guessesCount,
    hitsCount: session.hitsCount,
    hintsUsed: session.hintsUsed,
    basicHintsUsed: session.basicHintsUsed,
    titleHintUsed: session.titleHintUsed,
    durationSeconds: session.durationSeconds,
    revealedTokenIds: Array.from(revealedSet),
    guesses
  };
}

/**
 * GET /api/game/today
 * Vrne današnjo objavljeno dnevno uganko z maskiranimi žetoni (ADR 0003).
 */
gameRouter.get('/today', authenticateOptional, (req: Request, res: Response) => {
  const published =
    Array.from(store.puzzles.values()).find(p => p.status === 'PUBLISHED') ||
    Array.from(store.puzzles.values())[0];

  if (!published) {
    res.status(404).json({ error: 'Današnja dnevna uganka ni na voljo.' });
    return;
  }

  const sessionIdParam = typeof req.query.sessionId === 'string' ? req.query.sessionId : undefined;
  const session = getOrCreateSession(published, req.user?.id ?? null, sessionIdParam);
  const isWon = session.status === 'WON';
  const revealedSet = new Set<number>(session.revealedTokenIds);

  res.json({
    puzzle: maskPuzzleForClient(published, revealedSet, isWon),
    session: formatSessionResponse(session, published)
  });
});

/**
 * GET /api/game/puzzle/:number
 * Vrne uganko po zaporedni številki (#1, #2...) z maskiranimi žetoni (ADR 0003).
 */
gameRouter.get('/puzzle/:number', authenticateOptional, (req: Request, res: Response) => {
  const num = Number(req.params.number);
  if (!Number.isInteger(num) || num <= 0) {
    res.status(400).json({ error: 'Neveljavna številka uganke.' });
    return;
  }

  const puzzle = Array.from(store.puzzles.values()).find(p => p.puzzleNumber === num);
  if (!puzzle) {
    res.status(404).json({ error: `Uganka #${num} ne obstaja.` });
    return;
  }

  const sessionIdParam = typeof req.query.sessionId === 'string' ? req.query.sessionId : undefined;
  const session = getOrCreateSession(puzzle, req.user?.id ?? null, sessionIdParam);
  const isWon = session.status === 'WON';
  const revealedSet = new Set<number>(session.revealedTokenIds);

  res.json({
    puzzle: maskPuzzleForClient(puzzle, revealedSet, isWon),
    session: formatSessionResponse(session, publishedOrFallback(puzzle))
  });
});

function publishedOrFallback(p: StoredPuzzle): StoredPuzzle {
  return p;
}

/**
 * POST /api/game/guess
 * US-01 & US-07: Strežniško preverjanje ugibanja s Porter Stemmerjem, preprečevanje dvojnega vnosa in zapis v `guess_logs`.
 */
gameRouter.post('/guess', authenticateOptional, async (req: Request, res: Response) => {
  try {
    const rawWord = String(req.body?.word || '');
    const puzzleId = String(req.body?.puzzleId || '');
    const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId : undefined;
    const durationSeconds =
      typeof req.body?.durationSeconds === 'number' ? req.body.durationSeconds : undefined;

    const cleaned = cleanGuess(rawWord);
    if (!cleaned) {
      res.status(400).json({ error: 'Vnesite veljavno besedo za ugibanje.' });
      return;
    }

    const puzzle =
      store.puzzles.get(puzzleId) ||
      Array.from(store.puzzles.values()).find(p => p.status === 'PUBLISHED');

    if (!puzzle) {
      res.status(404).json({ error: 'Uganka ni bila najdena.' });
      return;
    }

    const session = getOrCreateSession(puzzle, req.user?.id ?? null, sessionId);
    const stem = stemWord(cleaned);

    const result = await processSessionGuess(session, puzzle, cleaned, stem, durationSeconds);
    const revealedSet = new Set<number>(session.revealedTokenIds);

    res.json({
      ...result,
      session: formatSessionResponse(session, puzzle),
      // Če je igralec zmagal, vrni celoten deklasificiran dokument (US-05 AC #1)
      fullPuzzle: result.isWon ? maskPuzzleForClient(puzzle, revealedSet, true) : undefined
    });
  } catch (err) {
    console.error('Napaka pri preverjanju ugibanja:', err);
    res.status(500).json({ error: 'Prišlo je do napake pri preverjanju besede.' });
  }
});
