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
      title="NASTAVITVE VIDEZA IN ZVOKA"
      icon={<Settings size={22} color="var(--text-primary)" />}
    >
      {/* US-13: Izbira barvne teme (Svetla, Temna, Terminal) */}
      <div className="classified-card">
        <h4>IZBIRA BARVNE TEME (TAILWIND TEME)</h4>
        <div className="grid grid-cols-3 gap-2 mt-2.5">
          <button
            type="button"
            className="icon-btn w-full h-11 gap-1.5 font-mono text-xs"
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
            <Sun size={16} /> Svetla (Papir)
          </button>

          <button
            type="button"
            className="icon-btn w-full h-11 gap-1.5 font-mono text-xs"
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
            <Moon size={16} /> Temna (Oglje)
          </button>

          <button
            type="button"
            className="icon-btn w-full h-11 gap-1.5 font-mono text-xs"
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
            <Terminal size={16} /> Terminal (CRT)
          </button>
        </div>
      </div>

      {/* US-13: Zvočni učinki mehanskega pisalnega stroja (Web Audio API) */}
      <div
        className="classified-card flex justify-between items-center"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <h4>ZVOČNI UČINKI PISALNEGA STROJA (WEB AUDIO API)</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Mehanski zvoki tipkanja in zvočni signal ob razkritju besed.
          </p>
        </div>
        <button
          type="button"
          className="icon-btn"
          style={{ width: 44, height: 44 }}
          onClick={onToggleSound}
          aria-label="Preklopi zvok"
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {/* Zasebnost in lokalni podatki */}
      <div className="classified-card">
        <h4>
          <ShieldCheck size={14} style={{ display: 'inline', marginRight: 4 }} /> ZASEBNOST IN LOKALNA SHRAMBA
        </h4>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
          Izbrana tema, stanje zvoka in lokalni napredek gosta se hranijo v brskalnikovi shrambi (localStorage) brez zunanjih sledilnikov.
        </p>

        <div className="flex gap-2.5 flex-wrap" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
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
            <span>{downloadSuccess ? 'IZVOŽENO' : 'IZVOZI PODATKE (JSON)'}</span>
          </button>

          <button
            type="button"
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
            <span>{confirmDelete ? 'POTRDI IZBRIS?' : 'PONASTAVI LOKALNE PODATKE'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
