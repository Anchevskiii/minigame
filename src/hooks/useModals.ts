import { useState, useCallback } from 'react';

export function useModals() {
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  const toggleSidebarMobile = useCallback(() => {
    setIsSidebarMobileOpen(prev => !prev);
  }, []);

  return {
    isHowToPlayOpen,
    setIsHowToPlayOpen,
    isStatsOpen,
    setIsStatsOpen,
    isArchiveOpen,
    setIsArchiveOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isHintModalOpen,
    setIsHintModalOpen,
    isWinModalOpen,
    setIsWinModalOpen,
    isSidebarMobileOpen,
    setIsSidebarMobileOpen,
    toggleSidebarMobile
  };
}
