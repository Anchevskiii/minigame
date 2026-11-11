import React from 'react';
import type { Puzzle, PlayerStats, ThemeMode, UserProfile, AchievementItem } from '@/types/game';
import { HowToPlayModal } from '@/components/modals/HowToPlayModal';
import { StatsModal } from '@/components/modals/StatsModal';
import { ArchiveModal } from '@/components/modals/ArchiveModal';
import { LeaderboardModal } from '@/components/modals/LeaderboardModal';
import { EditorAdminModal } from '@/components/modals/EditorAdminModal';
import { AuthModal } from '@/components/modals/AuthModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { HintModal } from '@/components/modals/HintModal';
import { WinModal } from '@/components/modals/WinModal';

interface ModalsLayerProps {
  isHowToPlayOpen: boolean;
  onCloseHowToPlay: () => void;

  isStatsOpen: boolean;
  onCloseStats: () => void;
  playerStats: PlayerStats;

  isArchiveOpen: boolean;
  onCloseArchive: () => void;
  currentPuzzleNumber: number;
  onSelectPuzzle: (puzzleNumber: number) => void;

  isLeaderboardOpen?: boolean;
  onCloseLeaderboard?: () => void;
  onOpenLeaderboard?: () => void;

  isEditorAdminOpen?: boolean;
  onCloseEditorAdmin?: () => void;

  isAuthOpen?: boolean;
  onCloseAuth?: () => void;
  onOpenAuth?: () => void;
  user?: UserProfile | null;

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
  basicHintsUsed?: number;
  freeHintUsed: boolean;
  titleHintUsed: boolean;
  totalTitleWords?: number;
  remainingTitleWords: number;

  isWinModalOpen: boolean;
  onCloseWin: () => void;
  puzzle: Puzzle | null;
  totalGuesses: number;
  hitGuesses: number;
  hintsUsedCount?: number;
  durationSeconds: number;
  unlockedAchievements?: AchievementItem[];
  onOpenArchive?: () => void;
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
  isLeaderboardOpen = false,
  onCloseLeaderboard = () => {},
  onOpenLeaderboard,
  isEditorAdminOpen = false,
  onCloseEditorAdmin = () => {},
  isAuthOpen = false,
  onCloseAuth = () => {},
  onOpenAuth,
  user = null,
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
  basicHintsUsed = 0,
  freeHintUsed,
  titleHintUsed,
  totalTitleWords = 2,
  remainingTitleWords,
  isWinModalOpen,
  onCloseWin,
  puzzle,
  totalGuesses,
  hitGuesses,
  hintsUsedCount,
  durationSeconds,
  unlockedAchievements = [],
  onOpenArchive
}) => {
  const hintsUsed =
    typeof hintsUsedCount === 'number'
      ? hintsUsedCount
      : (freeHintUsed ? 1 : 0) + (titleHintUsed ? 1 : 0);

  return (
    <>
      <HowToPlayModal isOpen={isHowToPlayOpen} onClose={onCloseHowToPlay} />

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
        user={user}
        onRequestLogin={onOpenAuth}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={onCloseLeaderboard}
        user={user}
      />

      <EditorAdminModal
        isOpen={isEditorAdminOpen}
        onClose={onCloseEditorAdmin}
        user={user}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={onCloseAuth}
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
        basicHintsUsed={basicHintsUsed}
        freeHintUsed={freeHintUsed}
        titleHintUsed={titleHintUsed}
        totalTitleWords={totalTitleWords}
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
          hintsUsed={hintsUsed}
          currentStreak={playerStats.currentStreak}
          durationSeconds={durationSeconds}
          unlockedAchievements={unlockedAchievements}
          onOpenLeaderboard={onOpenLeaderboard}
          onOpenArchive={onOpenArchive}
        />
      )}
    </>
  );
};
