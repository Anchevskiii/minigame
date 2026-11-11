import React, { useState } from 'react';
import { UserCheck, UserPlus, LogIn, AlertCircle, Shield } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useAuth } from '@/context/AuthContext';
import { soundFX } from '@/utils/audio';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    soundFX.playKeypress();

    if (mode === 'register') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Vnesite veljaven elektronski naslov.');
        return;
      }
      if (username.trim().length < 3) {
        setError('Uporabniško ime mora vsebovati najmanj 3 znake.');
        return;
      }
      if (password.length < 6) {
        setError('Geslo mora vsebovati najmanj 6 znakov.');
        return;
      }

      const res = await register(username.trim(), email.trim(), password);
      if (!res.ok) {
        setError(res.error || 'Registracija ni uspela.');
        return;
      }
    } else {
      const res = await login(email.trim(), password);
      if (!res.ok) {
        setError(res.error || 'Prijava ni uspela.');
        return;
      }
    }

    setUsername('');
    setEmail('');
    setPassword('');
    onAuthSuccess?.();
    onClose();
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setError(null);
    soundFX.playKeypress();
    const res = await login(demoEmail, 'geslo123');
    if (res.ok) {
      onAuthSuccess?.();
      onClose();
    } else {
      setError(res.error || 'Prijava z demo računom ni uspela.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'PRIJAVA UPORABNIKA (SUPABASE AUTH)' : 'REGISTRACIJA NOVEGA IGRALCA'}
      icon={<UserCheck size={22} color="var(--text-primary)" />}
    >
      {/* Preklop med Prijavo in Registracijo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className="icon-btn"
          style={{
            width: '100%',
            height: 40,
            gap: 6,
            background: mode === 'login' ? 'var(--text-primary)' : 'var(--bg-card)',
            color: mode === 'login' ? 'var(--bg-card)' : 'var(--text-primary)'
          }}
          onClick={() => {
            setMode('login');
            setError(null);
          }}
        >
          <LogIn size={16} /> Prijava
        </button>
        <button
          type="button"
          className="icon-btn"
          style={{
            width: '100%',
            height: 40,
            gap: 6,
            background: mode === 'register' ? 'var(--text-primary)' : 'var(--bg-card)',
            color: mode === 'register' ? 'var(--bg-card)' : 'var(--text-primary)'
          }}
          onClick={() => {
            setMode('register');
            setError(null);
          }}
        >
          <UserPlus size={16} /> Registracija
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            borderRadius: 4,
            background: 'var(--bg-surface)',
            border: '1px solid var(--text-stamp)',
            color: 'var(--text-stamp)',
            fontSize: '0.85rem',
            marginBottom: 14
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="classified-card">
        {mode === 'register' && (
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                marginBottom: 4
              }}
            >
              UPORABNIŠKO IME (UNIKATNO)
            </label>
            <input
              type="text"
              className="guess-input-field"
              style={{ width: '100%', height: 42, fontSize: '0.92rem' }}
              placeholder="npr. agent_novak"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              marginBottom: 4
            }}
          >
            {mode === 'login' ? 'E-POŠTNI NASLOV ALI UPORABNIŠKO IME' : 'ELEKTRONSKI NASLOV'}
          </label>
          <input
            type={mode === 'register' ? 'email' : 'text'}
            className="guess-input-field"
            style={{ width: '100%', height: 42, fontSize: '0.92rem' }}
            placeholder="igralec@redacted.si"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              marginBottom: 4
            }}
          >
            GESLO (NAJMANJ 6 ZNAKOV)
          </label>
          <input
            type="password"
            className="guess-input-field"
            style={{ width: '100%', height: 42, fontSize: '0.92rem' }}
            placeholder="••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn-share"
          disabled={loading}
          style={{ marginTop: 0 }}
        >
          {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
          <span>
            {loading
              ? 'PREVERJANJE...'
              : mode === 'login'
              ? 'PRIJAVI SE V SISTEM'
              : 'USTVARI PROFIL IGRALCA'}
          </span>
        </button>
      </form>

      {/* Hitra prijava za testiranje vlog (PLAYER, EDITOR, ADMIN) */}
      <div className="classified-card" style={{ marginBottom: 0 }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Shield size={15} /> HITRA DEMO PRIJAVA PO VLOGAH (ZA PREIZKUS)
        </h4>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
          Za takojšen preizkus pravic in funkcionalnosti izberite eno od predpripravljenih vlog:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <button
            type="button"
            className="icon-btn"
            style={{ width: '100%', height: 36, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
            onClick={() => handleQuickDemoLogin('igralec@redacted.si')}
          >
            Igralec (PLAYER)
          </button>
          <button
            type="button"
            className="icon-btn"
            style={{ width: '100%', height: 36, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
            onClick={() => handleQuickDemoLogin('urednik@redacted.si')}
          >
            Urednik (EDITOR)
          </button>
          <button
            type="button"
            className="icon-btn"
            style={{ width: '100%', height: 36, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
            onClick={() => handleQuickDemoLogin('admin@redacted.si')}
          >
            Skrbnik (ADMIN)
          </button>
        </div>
      </div>
    </Modal>
  );
};
