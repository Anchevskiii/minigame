import { useState, useCallback, useEffect } from 'react';
import type { Puzzle, GuessItem, PlayerStats, Token, AchievementItem } from '@/types/game';
import { stemWord, cleanGuess } from '@/utils/stemmer';
import { soundFX } from '@/utils/audio';
import { triggerVictoryConfetti } from '@/utils/confetti';
import {
  evaluateGuessInPuzzle,
  findMatchingTokenIds,
  checkWinCondition,
  findFreeHintCandidate,
  findTitleHintCandidate
} from '@/utils/game-rules';
import {
  loadPuzzleProgress,
  savePuzzleProgress,
  loadPlayerStats,
  recordGameWin
} from '@/utils/storage';
import { useOccurrenceNavigation } from '@/hooks/useOccurrenceNavigation';
import { usePlayTimer } from '@/hooks/usePlayTimer';

interface UseGameProps {
  onGameWon?: () => void;
  authToken?: string | null;
}

const SESSION_STORAGE_PREFIX = 'redacted_server_session_';
export const MAX_BASIC_HINTS_LIMIT = 3;

function mergeRevealedTokensIntoPuzzle(puzzle: Puzzle, revealedTokens: Token[]): Puzzle {
  if (!revealedTokens || revealedTokens.length === 0) return puzzle;
  const tokenMap = new Map<number, Token>();
  revealedTokens.forEach(t => tokenMap.set(t.id, t));

  const patchToken = (t: Token): Token => {
    const found = tokenMap.get(t.id);
    return found ? { ...t, ...found, isRevealed: true } : t;
  };

  return {
    ...puzzle,
    titleTokens: puzzle.titleTokens.map(patchToken),
    sections: puzzle.sections.map(sec => ({
      heading: sec.heading
        ? {
            ...sec.heading,
            tokens: sec.heading.tokens.map(patchToken)
          }
        : null,
      paragraphs: sec.paragraphs.map(p => ({
        tokens: p.tokens.map(patchToken)
      }))
    }))
  };
}

export function useGame({ onGameWon, authToken = null }: UseGameProps = {}) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [guesses, setGuesses] = useState<GuessItem[]>([]);
  const [revealedTokenIds, setRevealedTokenIds] = useState<Set<number>>(new Set());
  const [justRevealedTokenIds, setJustRevealedTokenIds] = useState<Set<number>>(new Set());

  const [isWon, setIsWon] = useState(false);
  const [basicHintsUsed, setBasicHintsUsed] = useState<number>(0);
  const [titleHintUsed, setTitleHintUsed] = useState(false);
  const [duplicateGuessMessage, setDuplicateGuessMessage] = useState<string | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<AchievementItem[]>([]);
  const [startTime, setStartTime] = useState<number>(() => Date.now());

  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => loadPlayerStats());

  const occurrenceNav = useOccurrenceNavigation();
  const { durationSeconds, setDurationSeconds } = usePlayTimer({
    isActive: !isWon && !loading && Boolean(puzzle)
  });

  const reloadPlayerStats = useCallback(async () => {
    if (authToken) {
      try {
        const res = await fetch('/api/stats/me', {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.stats) {
            setPlayerStats(prev => ({
              ...prev,
              ...data.stats,
              achievements: data.achievements || prev.achievements
            }));
            return;
          }
        }
      } catch {
        // Fallback na lokalno statistiko
      }
    }
    setPlayerStats(loadPlayerStats());
  }, [authToken]);

  useEffect(() => {
    reloadPlayerStats();
  }, [reloadPlayerStats]);

  // Trigger win celebration
  const triggerVictory = useCallback(
    (currentPuzzle: Puzzle, finalGuessesCount: number) => {
      setIsWon(true);
      soundFX.playVictory();
      triggerVictoryConfetti();

      const updatedStats = recordGameWin(
        currentPuzzle.releaseDateUtc,
        finalGuessesCount
      );
      setPlayerStats(prev => ({
        ...updatedStats,
        achievements: prev.achievements
      }));

      setTimeout(() => {
        onGameWon?.();
      }, 650);
    },
    [onGameWon]
  );

  // Load a puzzle by number or load today's puzzle (first tries Backend API per ADR 0003, falls back to static JSON)
  const loadPuzzle = useCallback(
    async (puzzleNumber?: number) => {
      setLoading(true);
      setError(null);
      setDuplicateGuessMessage(null);

      try {
        const storageSessionKey = `${SESSION_STORAGE_PREFIX}${puzzleNumber || 'today'}`;
        const savedSessionId = localStorage.getItem(storageSessionKey) || '';
        const apiEndpoint = puzzleNumber
          ? `/api/game/puzzle/${puzzleNumber}${savedSessionId ? `?sessionId=${encodeURIComponent(savedSessionId)}` : ''}`
          : `/api/game/today${savedSessionId ? `?sessionId=${encodeURIComponent(savedSessionId)}` : ''}`;

        const headers: Record<string, string> = {};
        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        }

        const apiRes = await fetch(apiEndpoint, { headers }).catch(() => null);
        if (apiRes && apiRes.ok) {
          const payload = await apiRes.json();
          const srvPuzzle: Puzzle = payload.puzzle;
          const srvSession = payload.session;

          setPuzzle(srvPuzzle);
          setSessionId(srvSession.id);
          localStorage.setItem(storageSessionKey, srvSession.id);
          localStorage.setItem(`${SESSION_STORAGE_PREFIX}${srvPuzzle.puzzleNumber}`, srvSession.id);

          occurrenceNav.resetFocus();
          setGuesses(srvSession.guesses || []);
          setRevealedTokenIds(new Set(srvSession.revealedTokenIds || []));
          setIsWon(Boolean(srvSession.isWon));
          setBasicHintsUsed(srvSession.basicHintsUsed || 0);
          setTitleHintUsed(Boolean(srvSession.titleHintUsed));
          setDurationSeconds(srvSession.durationSeconds || 0);
          setStartTime(Date.now());

          if (srvSession.isWon) {
            onGameWon?.();
          }
          setLoading(false);
          return;
        }

        // Fallback na statično datoteko v public/puzzles, če backend ne teče
        const url = puzzleNumber
          ? `/puzzles/puzzle-${puzzleNumber}.json`
          : `/puzzles/today.json`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Napaka pri nalaganju uganke: ${url}`);
        }
        const data: Puzzle = await res.json();
        setPuzzle(data);
        setSessionId(null);

        occurrenceNav.resetFocus();

        const saved = loadPuzzleProgress(data.id);
        if (saved) {
          setGuesses(saved.guesses);
          setRevealedTokenIds(new Set(saved.revealedTokenIds));
          setIsWon(saved.isWon);
          setBasicHintsUsed(saved.freeHintUsed ? 1 : 0);
          setTitleHintUsed(saved.titleHintUsed);
          setStartTime(saved.startTime || Date.now());
          setDurationSeconds(saved.durationSeconds || 0);

          if (saved.isWon) {
            onGameWon?.();
          }
        } else {
          setGuesses([]);
          setRevealedTokenIds(new Set());
          setIsWon(false);
          setBasicHintsUsed(0);
          setTitleHintUsed(false);
          setStartTime(Date.now());
          setDurationSeconds(0);
        }
      } catch (err) {
        console.error(err);
        setError('Cenzuriranega dokumenta ni bilo mogoče naložiti. Poskusite znova.');
      } finally {
        setLoading(false);
      }
    },
    [authToken, occurrenceNav, onGameWon, setDurationSeconds]
  );

  useEffect(() => {
    loadPuzzle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  // Handle a player's word guess
  const handleGuess = useCallback(
    async (rawWord: string) => {
      if (!puzzle || isWon) return;

      const cleaned = cleanGuess(rawWord);
      if (!cleaned) return;

      const stem = stemWord(cleaned);
      setDuplicateGuessMessage(null);

      // Try server-side guess evaluation first (ADR 0003)
      if (sessionId) {
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (authToken) {
            headers.Authorization = `Bearer ${authToken}`;
          }

          const res = await fetch('/api/game/guess', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              puzzleId: puzzle.id,
              sessionId,
              word: cleaned,
              durationSeconds
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.alreadyGuessed) {
              setDuplicateGuessMessage(
                data.message || `Beseda »${cleaned.toUpperCase()}« je bila že uganjena!`
              );
              occurrenceNav.setFocus(cleaned, data.allMatchingIds || []);
              return;
            }

            const updatedPuzzle = data.fullPuzzle
              ? (data.fullPuzzle as Puzzle)
              : mergeRevealedTokensIntoPuzzle(puzzle, data.newlyRevealedTokens || []);

            setPuzzle(updatedPuzzle);
            setGuesses(data.session.guesses || []);
            setRevealedTokenIds(new Set(data.session.revealedTokenIds || []));

            occurrenceNav.setFocus(cleaned, data.allMatchingIds || []);

            if (data.hits > 0) {
              soundFX.playRevealHit(data.hits);
            } else {
              soundFX.playMiss();
            }

            const newlyIds = (data.newlyRevealedTokens || []).map((t: Token) => t.id);
            if (newlyIds.length > 0) {
              setJustRevealedTokenIds(new Set(newlyIds));
              setTimeout(() => {
                setJustRevealedTokenIds(new Set());
              }, 800);
            }

            if (data.unlockedAchievements?.length) {
              setUnlockedAchievements(data.unlockedAchievements);
            }

            if (data.isWon && !isWon) {
              triggerVictory(updatedPuzzle, data.session.guessesCount);
              reloadPlayerStats();
            }
            return;
          }
        } catch {
          // Če strežnik ni dosegljiv, uporabi lokalno preverjanje spodaj
        }
      }

      // Lokalno preverjanje (fallback za statične JSON datoteke)
      const alreadyGuessed = guesses.some(
        g => g.word === cleaned || g.stem === stem
      );

      if (alreadyGuessed) {
        setDuplicateGuessMessage(
          `Beseda »${cleaned.toUpperCase()}« (ali njen koren) je bila že uganjena! Števec poskusov se ni povečal.`
        );
        const existingMatches = findMatchingTokenIds(puzzle, cleaned, stem);
        occurrenceNav.setFocus(cleaned, existingMatches);
        return;
      }

      const evalResult = evaluateGuessInPuzzle(
        puzzle,
        cleaned,
        stem,
        revealedTokenIds
      );

      occurrenceNav.setFocus(cleaned, evalResult.allMatchingIds);

      if (evalResult.hits > 0) {
        soundFX.playRevealHit(evalResult.hits);
      } else {
        soundFX.playMiss();
      }

      const nextRevealed = new Set(revealedTokenIds);
      evalResult.newlyRevealedIds.forEach(id => nextRevealed.add(id));
      setRevealedTokenIds(nextRevealed);

      if (evalResult.newlyRevealedIds.length > 0) {
        setJustRevealedTokenIds(new Set(evalResult.newlyRevealedIds));
        setTimeout(() => {
          setJustRevealedTokenIds(new Set());
        }, 800);
      }

      const newGuesses = [
        {
          id: `guess-${Date.now()}`,
          word: cleaned,
          stem,
          hits: evalResult.hits,
          isTitleHit: evalResult.isTitleHit,
          timestamp: Date.now()
        },
        ...guesses
      ];

      setGuesses(newGuesses);

      const wonNow = checkWinCondition(nextRevealed, puzzle);

      savePuzzleProgress(puzzle.id, {
        puzzleId: puzzle.id,
        guesses: newGuesses,
        revealedTokenIds: Array.from(nextRevealed),
        isWon: wonNow,
        hintsUsed: basicHintsUsed + (titleHintUsed ? 1 : 0),
        freeHintUsed: basicHintsUsed >= MAX_BASIC_HINTS_LIMIT,
        titleHintUsed,
        startTime,
        completedAt: wonNow ? Date.now() : null,
        durationSeconds
      });

      if (wonNow && !isWon) {
        triggerVictory(puzzle, newGuesses.length);
      }
    },
    [
      puzzle,
      isWon,
      sessionId,
      authToken,
      durationSeconds,
      guesses,
      revealedTokenIds,
      basicHintsUsed,
      titleHintUsed,
      startTime,
      occurrenceNav,
      triggerVictory,
      reloadPlayerStats
    ]
  );

  // Jump to word in document when clicked in sidebar and cycle through all its hits
  const handleScrollToWord = useCallback(
    (word: string) => {
      if (!puzzle) return;
      const canonical = cleanGuess(word);
      const stem = stemWord(canonical);

      if (
        occurrenceNav.focusedWord === canonical &&
        occurrenceNav.focusedMatchingTokenIds.length > 0
      ) {
        occurrenceNav.cycleNextOccurrence();
        return;
      }

      const matchingIds = findMatchingTokenIds(puzzle, canonical, stem);
      if (matchingIds.length > 0) {
        occurrenceNav.setFocus(canonical, matchingIds);
      }
    },
    [puzzle, occurrenceNav]
  );

  // US-03: Osnovni namig (do 3 uporabe na igro)
  const handleUseFreeHint = useCallback(async () => {
    if (!puzzle || basicHintsUsed >= MAX_BASIC_HINTS_LIMIT || isWon) return;

    if (sessionId) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authToken) headers.Authorization = `Bearer ${authToken}`;

        const res = await fetch('/api/game/hint', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            puzzleId: puzzle.id,
            sessionId,
            type: 'basic',
            durationSeconds
          })
        });

        if (res.ok) {
          const data = await res.json();
          const updatedPuzzle = data.fullPuzzle
            ? (data.fullPuzzle as Puzzle)
            : mergeRevealedTokensIntoPuzzle(puzzle, data.newlyRevealedTokens || []);

          setPuzzle(updatedPuzzle);
          setGuesses(data.session.guesses || []);
          setRevealedTokenIds(new Set(data.session.revealedTokenIds || []));
          setBasicHintsUsed(data.session.basicHintsUsed || basicHintsUsed + 1);
          occurrenceNav.setFocus(data.hintWord, data.allMatchingIds || []);
          soundFX.playRevealHit(data.hits || 1);

          if (data.isWon && !isWon) {
            triggerVictory(updatedPuzzle, data.session.guessesCount);
            reloadPlayerStats();
          }
          return;
        }
      } catch {
        // Fallback na lokalni namig
      }
    }

    const chosenWord = findFreeHintCandidate(puzzle, revealedTokenIds);
    if (!chosenWord) return;

    setBasicHintsUsed(prev => prev + 1);
    handleGuess(chosenWord);
  }, [
    puzzle,
    basicHintsUsed,
    isWon,
    sessionId,
    authToken,
    durationSeconds,
    revealedTokenIds,
    occurrenceNav,
    triggerVictory,
    reloadPlayerStats,
    handleGuess
  ]);

  // US-04: Glavni namig (1x na igro za naslove z vsaj 2 besedama)
  const handleUseTitleHint = useCallback(async () => {
    if (!puzzle || titleHintUsed || isWon) return;

    if (sessionId) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authToken) headers.Authorization = `Bearer ${authToken}`;

        const res = await fetch('/api/game/hint', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            puzzleId: puzzle.id,
            sessionId,
            type: 'title',
            durationSeconds
          })
        });

        if (res.ok) {
          const data = await res.json();
          const updatedPuzzle = data.fullPuzzle
            ? (data.fullPuzzle as Puzzle)
            : mergeRevealedTokensIntoPuzzle(puzzle, data.newlyRevealedTokens || []);

          setPuzzle(updatedPuzzle);
          setGuesses(data.session.guesses || []);
          setRevealedTokenIds(new Set(data.session.revealedTokenIds || []));
          setTitleHintUsed(true);
          occurrenceNav.setFocus(data.hintWord, data.allMatchingIds || []);
          soundFX.playRevealHit(data.hits || 1);

          if (data.unlockedAchievements?.length) {
            setUnlockedAchievements(data.unlockedAchievements);
          }

          if (data.isWon && !isWon) {
            triggerVictory(updatedPuzzle, data.session.guessesCount);
            reloadPlayerStats();
          }
          return;
        }
      } catch {
        // Fallback na lokalni namig
      }
    }

    const chosenWord = findTitleHintCandidate(puzzle, revealedTokenIds);
    if (!chosenWord) return;

    setTitleHintUsed(true);
    handleGuess(chosenWord);
  }, [
    puzzle,
    titleHintUsed,
    isWon,
    sessionId,
    authToken,
    durationSeconds,
    revealedTokenIds,
    occurrenceNav,
    triggerVictory,
    reloadPlayerStats,
    handleGuess
  ]);

  const totalTitleWords = puzzle
    ? puzzle.totalTitleWords ??
      puzzle.titleTokens.filter(t => t.type === 'word' && !t.isStopWord).length
    : 0;

  const remainingTitleWords = puzzle
    ? puzzle.titleTokens.filter(
        t => t.type === 'word' && !t.isStopWord && !revealedTokenIds.has(t.id)
      ).length
    : 0;

  const hitGuessesCount = guesses.filter(g => g.hits > 0).length;
  const hintsUsedCount = basicHintsUsed + (titleHintUsed ? 1 : 0);

  return {
    puzzle,
    loading,
    error,
    guesses,
    revealedTokenIds,
    justRevealedTokenIds,
    activeHighlightedTokenIds: occurrenceNav.activeHighlightedTokenIds,
    focusedWord: occurrenceNav.focusedWord,
    focusedMatchIndex: occurrenceNav.focusedMatchIndex,
    focusedMatchingTokenIds: occurrenceNav.focusedMatchingTokenIds,
    currentFocusTokenId: occurrenceNav.currentFocusTokenId,
    cycleNextOccurrence: occurrenceNav.cycleNextOccurrence,
    cyclePrevOccurrence: occurrenceNav.cyclePrevOccurrence,
    isWon,
    basicHintsUsed,
    freeHintUsed: basicHintsUsed >= MAX_BASIC_HINTS_LIMIT,
    titleHintUsed,
    hintsUsedCount,
    totalTitleWords,
    remainingTitleWords,
    hitGuessesCount,
    durationSeconds,
    playerStats,
    duplicateGuessMessage,
    unlockedAchievements,
    loadPuzzle,
    handleGuess,
    handleScrollToWord,
    handleUseFreeHint,
    handleUseTitleHint,
    reloadPlayerStats
  };
}
