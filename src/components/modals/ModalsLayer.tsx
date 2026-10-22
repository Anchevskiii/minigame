import React from 'react';
import type { Puzzle, PlayerStats, ThemeMode } from '@/types/game';
import { HowToPlayModal } from '@/components/modals/HowToPlayModal';
import { StatsModal } from '@/components/modals/StatsModal';
import { ArchiveModal } from '@/components/modals/ArchiveModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { HintModal } from '@/components/modals/HintModal';
import { WinModal } from '@/components/modals/WinModal';

export interface ModalsLayerProps {
  isHowToPlayOpen: boolean;
  onCloseHowToPlay: () => void;

  isStatsOpen: boolean;
  onCloseStats: () => void;
  playerStats: PlayerStats;

  isArchiveOpen: boolean;
  onCloseArchive: () => void;
  currentPuzzleNumber: number;
  onSelectPuzzle: (puzzleNumber: number) => void;

  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  theme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onDataReset: () => void;

  isHintModalOpen: boolean;
  onCloseHint: () => void;
  onUseFreeHint: () => void;
  onUseTitleHint: () => void;
  freeHintUsed: boolean;
  titleHintUsed: boolean;
  remainingTitleWords: number;

  isWinModalOpen: boolean;
  onCloseWin: () => void;
  puzzle: Puzzle | null;
  totalGuesses: number;
  hitGuesses: number;
  durationSeconds: number;
}

export const ModalsLayer: React.FC<ModalsLayerProps> = ({
  isHowToPlayOpen,
  onCloseHowToPlay,
  isStatsOpen,
  onCloseStats,
  playerStats,
  isArchiveOpen,
  onCloseArchive,
  currentPuzzleNumber,
  onSelectPuzzle,
  isSettingsOpen,
  onCloseSettings,
  theme,
  onSelectTheme,
  soundEnabled,
  onToggleSound,
  onDataReset,
  isHintModalOpen,
  onCloseHint,
  onUseFreeHint,
  onUseTitleHint,
  freeHintUsed,
  titleHintUsed,
  remainingTitleWords,
  isWinModalOpen,
  onCloseWin,
  puzzle,
  totalGuesses,
  hitGuesses,
  durationSeconds
}) => {
  return (
    <>
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={onCloseHowToPlay}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={onCloseStats}
        stats={playerStats}
      />

      <ArchiveModal
        isOpen={isArchiveOpen}
        onClose={onCloseArchive}
        currentPuzzleNumber={currentPuzzleNumber}
        onSelectPuzzle={onSelectPuzzle}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={onCloseSettings}
        theme={theme}
        onSelectTheme={onSelectTheme}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        onDataReset={onDataReset}
      />

      <HintModal
        isOpen={isHintModalOpen}
        onClose={onCloseHint}
        onUseFreeHint={onUseFreeHint}
        onUseTitleHint={onUseTitleHint}
        freeHintUsed={freeHintUsed}
        titleHintUsed={titleHintUsed}
        titleWordsRemaining={remainingTitleWords}
      />

      {puzzle && (
        <WinModal
          isOpen={isWinModalOpen}
          onClose={onCloseWin}
          puzzleNumber={puzzle.puzzleNumber}
          articleTitle={puzzle.wikipediaTitle}
          wikipediaUrl={puzzle.wikipediaUrl}
          totalGuesses={totalGuesses}
          hitGuesses={hitGuesses}
          hintsUsed={(freeHintUsed ? 1 : 0) + (titleHintUsed ? 1 : 0)}
          currentStreak={playerStats.currentStreak}
          durationSeconds={durationSeconds}
        />
      )}
    </>
  );
};
