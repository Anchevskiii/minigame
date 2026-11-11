import React, { useCallback } from 'react';
import {
  Header,
  DocumentViewer,
  InputBar,
  GuessLogSidebar,
  LoadingScreen,
  ErrorScreen,
  ModalsLayer
} from '@/components';
import { useGame, useTheme, useSound, useModals } from '@/hooks';
import { useAuth } from '@/context/AuthContext';

export const App: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { soundEnabled, toggleSound } = useSound();
  const { user, token, logout } = useAuth();
  const modals = useModals();

  const handleGameWon = useCallback(() => {
    modals.setIsWinModalOpen(true);
  }, [modals]);

  const game = useGame({ onGameWon: handleGameWon, authToken: token });

  const handleDataReset = useCallback(() => {
    game.reloadPlayerStats();
    game.loadPuzzle();
  }, [game]);

  return (
    <div className="app-container">
      {game.puzzle && (
        <Header
          puzzleNumber={game.puzzle.puzzleNumber}
          releaseDateUtc={game.puzzle.releaseDateUtc}
          onOpenHowToPlay={() => modals.setIsHowToPlayOpen(true)}
          onOpenStats={() => modals.setIsStatsOpen(true)}
          onOpenArchive={() => modals.setIsArchiveOpen(true)}
          onOpenLeaderboard={() => modals.setIsLeaderboardOpen(true)}
          onOpenEditorAdmin={() => modals.setIsEditorAdminOpen(true)}
          onOpenAuth={() => modals.setIsAuthOpen(true)}
          onOpenSettings={() => modals.setIsSettingsOpen(true)}
          onToggleSidebarMobile={modals.toggleSidebarMobile}
          isSidebarMobileOpen={modals.isSidebarMobileOpen}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          user={user}
          onLogout={logout}
        />
      )}

      {game.loading ? (
        <LoadingScreen />
      ) : game.error ? (
        <ErrorScreen error={game.error} onRetry={() => game.loadPuzzle()} />
      ) : game.puzzle ? (
        <main className="main-layout">
          <DocumentViewer
            puzzle={game.puzzle}
            revealedTokenIds={game.revealedTokenIds}
            justRevealedTokenIds={game.justRevealedTokenIds}
            activeHighlightedTokenIds={game.activeHighlightedTokenIds}
            currentFocusTokenId={game.currentFocusTokenId}
            isWon={game.isWon}
          />

          <GuessLogSidebar
            guesses={game.guesses}
            isOpenMobile={modals.isSidebarMobileOpen}
            onCloseMobile={() => modals.setIsSidebarMobileOpen(false)}
            onSelectWord={game.handleScrollToWord}
            activeWord={game.focusedWord}
            currentMatchIndex={game.focusedMatchIndex}
          />
        </main>
      ) : null}

      {/* Sticky Bottom Input Bar */}
      <InputBar
        totalGuesses={game.guesses.length}
        hitGuesses={game.hitGuessesCount}
        onGuess={game.handleGuess}
        onOpenHints={() => modals.setIsHintModalOpen(true)}
        isWon={game.isWon}
        disabled={game.loading || !game.puzzle}
        focusedWord={game.focusedWord}
        focusedMatchCount={game.focusedMatchingTokenIds.length}
        currentMatchIndex={game.focusedMatchIndex}
        onCycleNextOccurrence={game.cycleNextOccurrence}
        onCyclePrevOccurrence={game.cyclePrevOccurrence}
        duplicateGuessMessage={game.duplicateGuessMessage}
      />

      {/* Unified Modals Layer */}
      <ModalsLayer
        isHowToPlayOpen={modals.isHowToPlayOpen}
        onCloseHowToPlay={() => modals.setIsHowToPlayOpen(false)}
        isStatsOpen={modals.isStatsOpen}
        onCloseStats={() => modals.setIsStatsOpen(false)}
        playerStats={game.playerStats}
        isArchiveOpen={modals.isArchiveOpen}
        onCloseArchive={() => modals.setIsArchiveOpen(false)}
        currentPuzzleNumber={game.puzzle ? game.puzzle.puzzleNumber : 2}
        onSelectPuzzle={num => game.loadPuzzle(num)}
        isLeaderboardOpen={modals.isLeaderboardOpen}
        onCloseLeaderboard={() => modals.setIsLeaderboardOpen(false)}
        onOpenLeaderboard={() => modals.setIsLeaderboardOpen(true)}
        isEditorAdminOpen={modals.isEditorAdminOpen}
        onCloseEditorAdmin={() => modals.setIsEditorAdminOpen(false)}
        isAuthOpen={modals.isAuthOpen}
        onCloseAuth={() => modals.setIsAuthOpen(false)}
        onOpenAuth={() => modals.setIsAuthOpen(true)}
        user={user}
        isSettingsOpen={modals.isSettingsOpen}
        onCloseSettings={() => modals.setIsSettingsOpen(false)}
        theme={theme}
        onSelectTheme={setTheme}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onDataReset={handleDataReset}
        isHintModalOpen={modals.isHintModalOpen}
        onCloseHint={() => modals.setIsHintModalOpen(false)}
        onUseFreeHint={game.handleUseFreeHint}
        onUseTitleHint={game.handleUseTitleHint}
        basicHintsUsed={game.basicHintsUsed}
        freeHintUsed={game.freeHintUsed}
        titleHintUsed={game.titleHintUsed}
        totalTitleWords={game.totalTitleWords}
        remainingTitleWords={game.remainingTitleWords}
        isWinModalOpen={modals.isWinModalOpen}
        onCloseWin={() => modals.setIsWinModalOpen(false)}
        puzzle={game.puzzle}
        totalGuesses={game.guesses.length}
        hitGuesses={game.hitGuessesCount}
        hintsUsedCount={game.hintsUsedCount}
        durationSeconds={game.durationSeconds}
        unlockedAchievements={game.unlockedAchievements}
        onOpenArchive={() => modals.setIsArchiveOpen(true)}
      />
    </div>
  );
};
