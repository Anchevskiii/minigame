import React from 'react';
import {
  HelpCircle,
  BarChart2,
  FolderArchive,
  Settings,
  Volume2,
  VolumeX,
  Trophy,
  Shield,
  User,
  LogOut
} from 'lucide-react';
import type { UserProfile } from '@/types/game';
import { soundFX } from '@/utils/audio';
import { ClassifiedTicker } from '@/components/header/ClassifiedTicker';

export interface HeaderProps {
  puzzleNumber: number;
  releaseDateUtc: string;
  onOpenHowToPlay: () => void;
  onOpenStats: () => void;
  onOpenArchive: () => void;
  onOpenLeaderboard?: () => void;
  onOpenEditorAdmin?: () => void;
  onOpenAuth?: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  user?: UserProfile | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  puzzleNumber,
  releaseDateUtc,
  onOpenHowToPlay,
  onOpenStats,
  onOpenArchive,
  onOpenLeaderboard,
  onOpenEditorAdmin,
  onOpenAuth,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
  user = null,
  onLogout
}) => {
  const canAccessEditor = user?.role === 'EDITOR' || user?.role === 'ADMIN';

  return (
    <>
      <ClassifiedTicker />

      <header className="site-header">
        <div className="brand-wrapper">
          <div
            className="brand-title"
            onClick={() => window.location.reload()}
            title="Osveži aktivni dokument"
          >
            <span className="redacted-box">[REDACTED]</span>
          </div>
          <span
            className="wf-box"
            style={{
              padding: '4px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '1px'
            }}
            title={`Datum UTC: ${releaseDateUtc}`}
          >
            DAN {puzzleNumber}
          </span>
        </div>

        <div className="header-actions">
          {/* WF-01: Navigacijski gumbi z besedilom */}
          <button
            className="wf-nav-btn"
            onClick={() => {
              soundFX.playKeypress();
              onOpenHowToPlay();
            }}
            title="Pravila igre (US-01)"
          >
            <HelpCircle size={15} />
            <span className="hidden sm:inline">PRAVILA</span>
          </button>

          <button
            className="wf-nav-btn"
            onClick={() => {
              soundFX.playKeypress();
              onOpenStats();
            }}
            title="Osebna statistika in dosežki (US-12, US-14)"
          >
            <BarChart2 size={15} />
            <span className="hidden sm:inline">STATISTIKA</span>
          </button>

          <button
            className="wf-nav-btn"
            onClick={() => {
              soundFX.playKeypress();
              onOpenArchive();
            }}
            title="Zgodovinski arhiv ugank (US-08)"
          >
            <FolderArchive size={15} />
            <span className="hidden sm:inline">ARHIV</span>
          </button>

          {onOpenLeaderboard && (
            <button
              className="wf-nav-btn"
              onClick={() => {
                soundFX.playKeypress();
                onOpenLeaderboard();
              }}
              title="Lestvica najboljših igralcev (US-09)"
            >
              <Trophy size={15} />
              <span className="hidden md:inline">LESTVICA</span>
            </button>
          )}

          {canAccessEditor && onOpenEditorAdmin && (
            <button
              className="wf-nav-btn"
              style={{
                borderColor: 'var(--accent-gold)',
                color: 'var(--accent-gold)'
              }}
              onClick={() => {
                soundFX.playKeypress();
                onOpenEditorAdmin();
              }}
              title="Konzola urednika in administratorja (US-10, US-11, US-15)"
            >
              <Shield size={15} />
              <span className="hidden md:inline">UREDNIK</span>
            </button>
          )}

          {/* WF-01: Uporabniški PROFIL / PRIJAVA */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                className="wf-nav-btn wf-nav-btn-active"
                title={`Prijavljen kot ${user.username} (${user.role})`}
              >
                <User size={14} />
                <span>{user.username}</span>
              </span>
              <button
                type="button"
                className="wf-nav-btn"
                onClick={() => {
                  soundFX.playKeypress();
                  onLogout?.();
                }}
                title="Odjava"
                aria-label="Odjava"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            onOpenAuth && (
              <button
                type="button"
                className="wf-btn-dark"
                style={{ height: 34, padding: '0 12px', fontSize: '0.74rem' }}
                onClick={() => {
                  soundFX.playKeypress();
                  onOpenAuth();
                }}
                title="Prijava v profil (US-06)"
              >
                <User size={14} />
                <span>PROFIL</span>
              </button>
            )
          )}

          {/* Nastavitve in zvok */}
          <button
            className="icon-btn"
            style={{ width: 34, height: 34 }}
            onClick={onToggleSound}
            title={soundEnabled ? 'Izklopi zvok tipkanja' : 'Vklopi zvok tipkanja'}
            aria-label="Zvok"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            className="icon-btn"
            style={{ width: 34, height: 34 }}
            onClick={() => {
              soundFX.playKeypress();
              onOpenSettings();
            }}
            title="Nastavitve teme in zvoka (US-13)"
            aria-label="Nastavitve"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>
    </>
  );
};
