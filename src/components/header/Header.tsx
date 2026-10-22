import React from 'react';
import {
  HelpCircle,
  BarChart2,
  FolderArchive,
  Settings,
  Volume2,
  VolumeX,
  List
} from 'lucide-react';
import { soundFX } from '@/utils/audio';
import { ClassifiedTicker } from '@/components/header/ClassifiedTicker';

export interface HeaderProps {
  puzzleNumber: number;
  releaseDateUtc: string;
  onOpenHowToPlay: () => void;
  onOpenStats: () => void;
  onOpenArchive: () => void;
  onOpenSettings: () => void;
  onToggleSidebarMobile: () => void;
  isSidebarMobileOpen: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  puzzleNumber,
  releaseDateUtc,
  onOpenHowToPlay,
  onOpenStats,
  onOpenArchive,
  onOpenSettings,
  onToggleSidebarMobile,
  isSidebarMobileOpen,
  soundEnabled,
  onToggleSound
}) => {
  return (
    <>
      <ClassifiedTicker />

      <header className="site-header">
        <div className="brand-wrapper">
          <div
            className="brand-title"
            onClick={() => window.location.reload()}
            title="Reload Active File"
          >
            <span className="redacted-box">[REDACTED]</span>
          </div>
          <span className="puzzle-badge" title={`UTC Date: ${releaseDateUtc}`}>
            DOSSIER #{puzzleNumber}
          </span>
        </div>

        <div className="header-actions">
          <button
            className={`icon-btn ${isSidebarMobileOpen ? 'active' : ''}`}
            onClick={onToggleSidebarMobile}
            title="Toggle Guesses Log"
            aria-label="Toggle Guesses"
          >
            <List size={18} />
          </button>

          <button
            className="icon-btn"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Mechanical Audio' : 'Enable Mechanical Audio'}
            aria-label="Sound"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button
            className="icon-btn"
            onClick={() => {
              soundFX.playKeypress();
              onOpenArchive();
            }}
            title="Dossier Archives"
            aria-label="Archives"
          >
            <FolderArchive size={18} />
          </button>

          <button
            className="icon-btn"
            onClick={() => {
              soundFX.playKeypress();
              onOpenStats();
            }}
            title="Agent Statistics"
            aria-label="Statistics"
          >
            <BarChart2 size={18} />
          </button>

          <button
            className="icon-btn"
            onClick={() => {
              soundFX.playKeypress();
              onOpenHowToPlay();
            }}
            title="Protocol / How to Play"
            aria-label="Help"
          >
            <HelpCircle size={18} />
          </button>

          <button
            className="icon-btn"
            onClick={() => {
              soundFX.playKeypress();
              onOpenSettings();
            }}
            title="Settings & Privacy"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>
    </>
  );
};
