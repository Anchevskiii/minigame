import { useState, useCallback, useEffect } from 'react';
import type { Puzzle, GuessItem, PlayerStats } from '@/types/game';
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
}

export function useGame({ onGameWon }: UseGameProps = {}) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [guesses, setGuesses] = useState<GuessItem[]>([]);
  const [revealedTokenIds, setRevealedTokenIds] = useState<Set<number>>(new Set());
  const [justRevealedTokenIds, setJustRevealedTokenIds] = useState<Set<number>>(new Set());

  const [isWon, setIsWon] = useState(false);
  const [freeHintUsed, setFreeHintUsed] = useState(false);
  const [titleHintUsed, setTitleHintUsed] = useState(false);
  const [startTime, setStartTime] = useState<number>(() => Date.now());

  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => loadPlayerStats());

  const occurrenceNav = useOccurrenceNavigation();
  const { durationSeconds, setDurationSeconds } = usePlayTimer({
    isActive: !isWon && !loading && Boolean(puzzle)
  });

  const reloadPlayerStats = useCallback(() => {
    setPlayerStats(loadPlayerStats());
  }, []);

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
      setPlayerStats(updatedStats);

      setTimeout(() => {
        onGameWon?.();
      }, 900);
    },
    [onGameWon]
  );

  // Load a puzzle by number or load today's puzzle
  const loadPuzzle = useCallback(
    async (puzzleNumber?: number) => {
      setLoading(true);
      setError(null);

      try {
        const url = puzzleNumber
          ? `/puzzles/puzzle-${puzzleNumber}.json`
          : `/puzzles/today.json`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to load puzzle file: ${url}`);
        }
        const data: Puzzle = await res.json();
        setPuzzle(data);

        occurrenceNav.resetFocus();

        const saved = loadPuzzleProgress(data.id);
        if (saved) {
          setGuesses(saved.guesses);
          setRevealedTokenIds(new Set(saved.revealedTokenIds));
          setIsWon(saved.isWon);
          setFreeHintUsed(saved.freeHintUsed);
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
          setFreeHintUsed(false);
          setTitleHintUsed(false);
          setStartTime(Date.now());
          setDurationSeconds(0);
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load classified case file. Please retry.');
      } finally {
        setLoading(false);
      }
    },
    [occurrenceNav, onGameWon, setDurationSeconds]
  );

  useEffect(() => {
    loadPuzzle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle a player's word guess
  const handleGuess = useCallback(
    (rawWord: string) => {
      if (!puzzle || isWon) return;

      const cleaned = cleanGuess(rawWord);
      if (!cleaned) return;

      const stem = stemWord(cleaned);

      // If already focusing this word and user hits enter on it again, cycle to next occurrence!
      if (
        occurrenceNav.focusedWord === cleaned &&
        occurrenceNav.focusedMatchingTokenIds.length > 1
      ) {
        soundFX.playKeypress();
        occurrenceNav.cycleNextOccurrence();
        return;
      }

      const alreadyGuessed = guesses.some(
        g => g.word === cleaned || g.stem === stem
      );

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

      const newGuesses = alreadyGuessed
        ? guesses
        : [
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
        hintsUsed: (freeHintUsed ? 1 : 0) + (titleHintUsed ? 1 : 0),
        freeHintUsed,
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
      guesses,
      revealedTokenIds,
      freeHintUsed,
      titleHintUsed,
      startTime,
      durationSeconds,
      occurrenceNav,
      triggerVictory
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

  const handleUseFreeHint = useCallback(() => {
    if (!puzzle || freeHintUsed || isWon) return;

    const chosenWord = findFreeHintCandidate(puzzle, revealedTokenIds);
    if (!chosenWord) return;

    setFreeHintUsed(true);
    handleGuess(chosenWord);
  }, [puzzle, freeHintUsed, isWon, revealedTokenIds, handleGuess]);

  const handleUseTitleHint = useCallback(() => {
    if (!puzzle || titleHintUsed || isWon) return;

    const chosenWord = findTitleHintCandidate(puzzle, revealedTokenIds);
    if (!chosenWord) return;

    setTitleHintUsed(true);
    handleGuess(chosenWord);
  }, [puzzle, titleHintUsed, isWon, revealedTokenIds, handleGuess]);

  const remainingTitleWords = puzzle
    ? puzzle.titleTokens.filter(
        t => t.type === 'word' && !t.isStopWord && !revealedTokenIds.has(t.id)
      ).length
    : 0;

  const hitGuessesCount = guesses.filter(g => g.hits > 0).length;

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
    freeHintUsed,
    titleHintUsed,
    remainingTitleWords,
    hitGuessesCount,
    durationSeconds,
    playerStats,
    loadPuzzle,
    handleGuess,
    handleScrollToWord,
    handleUseFreeHint,
    handleUseTitleHint,
    reloadPlayerStats
  };
}
