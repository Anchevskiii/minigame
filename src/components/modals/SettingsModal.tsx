import React, { useState } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Terminal,
  Volume2,
  VolumeX,
  Download,
  Trash2,
  ShieldCheck,
  Check
} from 'lucide-react';
import type { ThemeMode } from '@/types/game';
import { exportAllUserData, clearAllUserData } from '@/utils/storage';
import { soundFX } from '@/utils/audio';
import { Modal } from '@/components/common/Modal';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onDataReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onSelectTheme,
  soundEnabled,
  onToggleSound,
  onDataReset
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleExportData = () => {
    soundFX.playKeypress();
    const dataStr = exportAllUserData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redacted_dossier_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleClearData = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    clearAllUserData();
    onDataReset();
    setConfirmDelete(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SYSTEM SETTINGS & PRIVACY"
      icon={<Settings size={22} color="var(--text-primary)" />}
    >
      {/* Display Theme */}
      <div className="classified-card">
        <h4>DISPLAY THEME</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
          <button
            className="icon-btn"
            style={{
              width: '100%',
              height: 44,
              gap: 6,
              borderColor: theme === 'light' ? 'var(--text-primary)' : 'var(--border-color)',
              background: theme === 'light' ? 'var(--text-primary)' : 'var(--bg-card)',
              color: theme === 'light' ? 'var(--bg-card)' : 'var(--text-primary)'
            }}
            onClick={() => onSelectTheme('light')}
          >
            <Sun size={16} /> Light
          </button>

          <button
            className="icon-btn"
            style={{
              width: '100%',
              height: 44,
              gap: 6,
              borderColor: theme === 'dark' ? 'var(--text-primary)' : 'var(--border-color)',
              background: theme === 'dark' ? 'var(--text-primary)' : 'var(--bg-card)',
              color: theme === 'dark' ? 'var(--bg-card)' : 'var(--text-primary)'
            }}
            onClick={() => onSelectTheme('dark')}
          >
            <Moon size={16} /> Dark
          </button>

          <button
            className="icon-btn"
            style={{
              width: '100%',
              height: 44,
              gap: 6,
              borderColor: theme === 'terminal' ? 'var(--text-primary)' : 'var(--border-color)',
              background: theme === 'terminal' ? 'var(--text-primary)' : 'var(--bg-card)',
              color: theme === 'terminal' ? 'var(--bg-card)' : 'var(--text-primary)'
            }}
            onClick={() => onSelectTheme('terminal')}
          >
            <Terminal size={16} /> CRT Green
          </button>
        </div>
      </div>

      {/* Audio Effects */}
      <div
        className="classified-card"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <h4>AUDIO SYNTHESIZER</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Mechanical typewriter key clacks and declassification chimes.
          </p>
        </div>
        <button
          className="icon-btn"
          style={{ width: 44, height: 44 }}
          onClick={onToggleSound}
          aria-label="Toggle Sound"
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {/* GDPR & Privacy Controls */}
      <div className="classified-card">
        <h4>
          <ShieldCheck size={14} style={{ display: 'inline', marginRight: 4 }} /> PRIVACY & GDPR COMPLIANCE
        </h4>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
          In accordance with GDPR Articles 17 & 20, game logs and statistics are stored locally on your device with zero cross-site tracker scripts.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn-share"
            style={{
              flex: 1,
              marginTop: 0,
              fontSize: '0.85rem',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '10px 14px'
            }}
            onClick={handleExportData}
          >
            {downloadSuccess ? (
              <Check size={16} color="var(--accent-hit)" />
            ) : (
              <Download size={16} />
            )}
            <span>{downloadSuccess ? 'EXPORT READY' : 'EXPORT DATA (JSON)'}</span>
          </button>

          <button
            className="btn-share"
            style={{
              flex: 1,
              marginTop: 0,
              fontSize: '0.85rem',
              background: confirmDelete ? 'var(--text-stamp)' : 'var(--bg-surface)',
              color: confirmDelete ? '#ffffff' : 'var(--text-stamp)',
              border: '1px solid var(--text-stamp)',
              padding: '10px 14px'
            }}
            onClick={handleClearData}
          >
            <Trash2 size={16} />
            <span>{confirmDelete ? 'CONFIRM PURGE?' : 'PURGE ALL LOCAL DATA'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
