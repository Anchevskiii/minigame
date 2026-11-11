import React from 'react';
import {
  HelpCircle,
  BarChart2,
  FolderArchive,
  Settings,
  Volume2,
  VolumeX,
  List,
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
  onToggleSidebarMobile: () => void;
  isSidebarMobileOpen: boolean;
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
  onToggleSidebarMobile,
  isSidebarMobileOpen,
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
          <span className="puzzle-badge" title={`Datum UTC: ${releaseDateUtc}`}>
            DAN #{puzzleNumber}
          </span>
        </div>

        <div className="header-actions">
          <button
            className={`icon-btn ${isSidebarMobileOpen ? 'active' : ''}`}
            onClick={onToggleSidebarMobile}
            title="Zgodovina ugibanj"
            aria-label="Zgodovina ugibanj"
          >
            <List size={18} />
          </button>

          <button
            className="icon-btn"
            onClick={onToggleSound}
            title={soundEnabled ? 'Izklopi zvok tipkanja' : 'Vklopi zvok tipkanja'}
            aria-label="Zvok"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button
            className="icon-btn"
            onClick={() => {
              soundFX.playKeypress();
              onOpenArchive();
            }}
            title="Zgodovinski arhiv ugank (US-08)"
            aria-label="Arhiv"
          >
            <FolderArchive size={18} />
          </button>

          {onOpenLeaderboard && (
            <button
              className="icon-btn"
              onClick={() => {
                soundFX.playKeypress();
                onOpenLeaderboard();
              }}
              title="Lestvica najboljših igralcev (US-09)"
              aria-label="Lestvica"
            >
              <Trophy size={18} />
            </button>
          )}

          <button
            className="icon-btn"
            onClick={() => {
              soundFX.playKeypress();
              onOpenStats();
            }}
            title="Osebna statistika in dosežki (US-12, US-14)"
            aria-label="Statistika"
          >
            <BarChart2 size={18} />
          </button>

          {canAccessEditor && onOpenEditorAdmin && (
            <button
              className="icon-btn"
              style={{
                borderColor: 'var(--accent-gold)',
                color: 'var(--accent-gold)'
              }}
              onClick={() => {
                soundFX.playKeypress();
                onOpenEditorAdmin();
              }}
              title="Konzola urednika in administratorja (US-10, US-11, US-15)"
              aria-label="Urednik in Admin"
            >
              <Shield size={18} />
            </button>
          )}

          <button
            className="icon-btn"
            onClick={() => {
              soundFX.playKeypress();
              onOpenHowToPlay();
            }}
            title="Pravila igre"
            aria-label="Pravila"
          >
            <HelpCircle size={18} />
          </button>

          <button
            className="icon-btn"
            onClick={() => {
              soundFX.playKeypress();
              onOpenSettings();
            }}
            title="Nastavitve teme in zvoka (US-13)"
            aria-label="Nastavitve"
          >
            <Settings size={18} />
          </button>

          {/* US-06 AC #4: Po uspešni prijavi se v glavi strani namesto gumba za prijavo izpiše uporabniško ime ter gumb za odjavo */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                className="puzzle-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)'
                }}
                title={`Prijavljen kot ${user.username} (${user.role})`}
              >
                <User size={13} />
                {user.username}
              </span>
              <button
                type="button"
                className="icon-btn"
                style={{ width: 'auto', padding: '0 8px', fontSize: '0.75rem', gap: 4 }}
                onClick={() => {
                  soundFX.playKeypress();
                  onLogout?.();
                }}
                title="Odjava"
                aria-label="Odjava"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            onOpenAuth && (
              <button
                type="button"
                className="icon-btn"
                style={{
                  width: 'auto',
                  padding: '0 10px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  gap: 5
                }}
                onClick={() => {
                  soundFX.playKeypress();
                  onOpenAuth();
                }}
                title="Prijava ali registracija (US-06)"
              >
                <User size={15} />
                <span>PRIJAVA</span>
              </button>
            )
          )}
        </div>
      </header>
    </>
  );
};
