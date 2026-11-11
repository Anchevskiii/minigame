import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Globe,
  Calendar,
  List,
  Users,
  CheckCircle2,
  AlertCircle,
  Eye,
  Save
} from 'lucide-react';
import type { DifficultyLevel, UserProfile, UserRole } from '@/types/game';
import { Modal } from '@/components/common/Modal';
import { soundFX } from '@/utils/audio';

export interface EditorAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onPuzzleCreated?: () => void;
}

interface AdminPuzzleRow {
  id: string;
  puzzleNumber: number;
  title: string;
  wikipediaUrl: string;
  difficulty: DifficultyLevel;
  status: string;
  releaseDate: string;
  totalWords: number;
}

interface AdminUserRow {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export const EditorAdminModal: React.FC<EditorAdminModalProps> = ({
  isOpen,
  onClose,
  user,
  onPuzzleCreated
}) => {
  const [activeView, setActiveView] = useState<'new' | 'calendar' | 'users'>('new');

  // Step 1-3 state for Wikipedia import & scheduling (WF-03, US-10, US-11)
  const [wikiUrl, setWikiUrl] = useState('https://en.wikipedia.org/wiki/Alan_Turing');
  const [importedTitle, setImportedTitle] = useState('');
  const [summaryLead, setSummaryLead] = useState('');
  const [censoredPreview, setCensoredPreview] = useState('');
  const [wordStats, setWordStats] = useState<{
    totalWords: number;
    hiddenWords: number;
    stopWordsCount: number;
  } | null>(null);
  const [tokenData, setTokenData] = useState<unknown>(null);

  const [difficulty, setDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [releaseDate, setReleaseDate] = useState('2026-10-10');

  const [puzzlesList, setPuzzlesList] = useState<AdminPuzzleRow[]>([]);
  const [usersList, setUsersList] = useState<AdminUserRow[]>([]);

  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('redacted_auth_jwt');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchPuzzlesAndUsers = useCallback(() => {
    if (!isOpen || !user) return;
    const headers = getAuthHeaders();

    fetch('/api/admin/puzzles', { headers })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.puzzles) setPuzzlesList(data.puzzles);
      })
      .catch(() => {});

    if (user.role === 'ADMIN') {
      fetch('/api/admin/users', { headers })
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data?.users) setUsersList(data.users);
        })
        .catch(() => {});
    }
  }, [isOpen, user]);

  useEffect(() => {
    fetchPuzzlesAndUsers();
  }, [fetchPuzzlesAndUsers]);

  // US-10: Uvoz članka iz Wikipedije
  const handleImportFromWikipedia = async () => {
    setStatusMsg(null);
    setLoadingAction(true);
    soundFX.playKeypress();

    try {
      const res = await fetch('/api/admin/puzzles/import', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ wikipediaUrl: wikiUrl })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: 'err', text: data.error || 'Uvoz iz Wikipedije ni uspel.' });
        return;
      }

      setImportedTitle(data.title);
      setSummaryLead(data.summaryLead);
      setCensoredPreview(data.censoredPreview);
      setWordStats(data.stats);
      setTokenData(data.tokenData);
      setStatusMsg({
        type: 'ok',
        text: `Članek »${data.title}« uspešno uvožen (${data.stats.totalWords} besed).`
      });
    } catch {
      setStatusMsg({ type: 'err', text: 'Strežniška napaka pri uvozu članka.' });
    } finally {
      setLoadingAction(false);
    }
  };

  // US-11: Nastavitev težavnosti in razporeditev objave (status SCHEDULED)
  const handleSaveScheduledPuzzle = async () => {
    if (!importedTitle.trim()) {
      setStatusMsg({
        type: 'err',
        text: 'Najprej uvozite članek iz Wikipedije ali vnesite naslov članka.'
      });
      return;
    }

    setStatusMsg(null);
    setLoadingAction(true);
    soundFX.playKeypress();

    try {
      const res = await fetch('/api/admin/puzzles', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: importedTitle.trim(),
          wikipediaUrl: wikiUrl.trim(),
          difficulty,
          releaseDate,
          summaryLead,
          tokenData
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: 'err', text: data.error || 'Shranjevanje uganke ni uspelo.' });
        return;
      }

      setStatusMsg({
        type: 'ok',
        text: `Uganka #${data.puzzle.puzzleNumber} (»${data.puzzle.title}«) shranjena s statusom ${data.puzzle.status} za datum ${data.puzzle.releaseDate}!`
      });
      fetchPuzzlesAndUsers();
      onPuzzleCreated?.();
    } catch {
      setStatusMsg({ type: 'err', text: 'Napaka pri shranjevanju v bazo.' });
    } finally {
      setLoadingAction(false);
    }
  };

  // US-15: Sprememba vloge uporabnika (PLAYER, EDITOR, ADMIN)
  const handleChangeUserRole = async (targetUserId: string, newRole: UserRole) => {
    setStatusMsg(null);
    soundFX.playKeypress();

    try {
      const res = await fetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: 'err', text: data.error || 'Sprememba vloge ni uspela.' });
        return;
      }

      setUsersList(prev =>
        prev.map(u => (u.id === targetUserId ? { ...u, role: data.user.role } : u))
      );
      setStatusMsg({
        type: 'ok',
        text: `Vloga uporabnika »${data.user.username}« posodobljena v ${data.user.role}.`
      });
    } catch {
      setStatusMsg({ type: 'err', text: 'Napaka pri posodabljanju vloge uporabnika.' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`KONZOLA UREDNIKA IN SKRBNIKA (${user?.role || 'EDITOR'})`}
      icon={<Shield size={22} color="var(--accent-gold)" />}
    >
      {/* Navigacijska vrstica po WF-03: NOVA UGANKA | KOLEDAR & SEZNAM | UPORABNIKI (ADMIN) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: user?.role === 'ADMIN' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
          gap: 8,
          marginBottom: 16
        }}
      >
        <button
          type="button"
          className="icon-btn"
          style={{
            width: '100%',
            height: 38,
            gap: 6,
            fontSize: '0.76rem',
            fontFamily: 'var(--font-mono)',
            background: activeView === 'new' ? 'var(--text-primary)' : 'var(--bg-card)',
            color: activeView === 'new' ? 'var(--bg-card)' : 'var(--text-primary)'
          }}
          onClick={() => {
            setActiveView('new');
            setStatusMsg(null);
          }}
        >
          <Globe size={15} /> NOVA UGANKA (UVOZ)
        </button>

        <button
          type="button"
          className="icon-btn"
          style={{
            width: '100%',
            height: 38,
            gap: 6,
            fontSize: '0.76rem',
            fontFamily: 'var(--font-mono)',
            background: activeView === 'calendar' ? 'var(--text-primary)' : 'var(--bg-card)',
            color: activeView === 'calendar' ? 'var(--bg-card)' : 'var(--text-primary)'
          }}
          onClick={() => {
            setActiveView('calendar');
            setStatusMsg(null);
          }}
        >
          <Calendar size={15} /> KOLEDAR IN SEZNAM
        </button>

        {user?.role === 'ADMIN' && (
          <button
            type="button"
            className="icon-btn"
            style={{
              width: '100%',
              height: 38,
              gap: 6,
              fontSize: '0.76rem',
              fontFamily: 'var(--font-mono)',
              background: activeView === 'users' ? 'var(--text-primary)' : 'var(--bg-card)',
              color: activeView === 'users' ? 'var(--bg-card)' : 'var(--text-primary)'
            }}
            onClick={() => {
              setActiveView('users');
              setStatusMsg(null);
            }}
          >
            <Users size={15} /> UPORABNIKI IN VLOGE
          </button>
        )}
      </div>

      {statusMsg && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            borderRadius: 4,
            marginBottom: 14,
            fontSize: '0.82rem',
            background: 'var(--bg-surface)',
            border: `1px solid ${
              statusMsg.type === 'ok' ? 'var(--accent-hit)' : 'var(--text-stamp)'
            }`,
            color: statusMsg.type === 'ok' ? 'var(--accent-hit)' : 'var(--text-stamp)'
          }}
        >
          {statusMsg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* POGLED 1: WF-03 Osrednji vnosni obrazec v 3 korakih (1. Uvoz, 2. Nastavitve, 3. Predogled) */}
      {activeView === 'new' && (
        <div>
          <div className="classified-card">
            <h4>KORAK 1: UVOZ ČLANKA IZ WIKIPEDIJE (US-10)</h4>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                type="url"
                className="guess-input-field"
                style={{ flex: 1, height: 40, fontSize: '0.85rem' }}
                placeholder="https://en.wikipedia.org/wiki/Alan_Turing"
                value={wikiUrl}
                onChange={e => setWikiUrl(e.target.value)}
              />
              <button
                type="button"
                className="btn-guess"
                style={{ height: 40, padding: '0 16px', fontSize: '0.82rem' }}
                disabled={loadingAction}
                onClick={handleImportFromWikipedia}
              >
                UVOZI
              </button>
            </div>
          </div>

          <div className="classified-card">
            <h4>KORAK 2: NASTAVITVE TEŽAVNOSTI IN DATUMA OBJAVE (US-11)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                  NASLOV (GESLO)
                </label>
                <input
                  type="text"
                  className="guess-input-field"
                  style={{ width: '100%', height: 38, fontSize: '0.85rem' }}
                  placeholder="Alan Turing"
                  value={importedTitle}
                  onChange={e => setImportedTitle(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                  TEŽAVNOST (ENUM)
                </label>
                <select
                  className="sort-select"
                  style={{ width: '100%', height: 38 }}
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as DifficultyLevel)}
                >
                  <option value="EASY">EASY (Lahka)</option>
                  <option value="MEDIUM">MEDIUM (Srednja)</option>
                  <option value="HARD">HARD (Težka)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                  DATUM OBJAVE
                </label>
                <input
                  type="date"
                  className="guess-input-field"
                  style={{ width: '100%', height: 38, fontSize: '0.82rem' }}
                  value={releaseDate}
                  onChange={e => setReleaseDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="classified-card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>KORAK 3: PREDOGLED GENERIRANE CENZURE</h4>
              {wordStats && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-hit)' }}>
                  Skupaj besed: <strong>{wordStats.totalWords}</strong> (Skritih: {wordStats.hiddenWords})
                </span>
              )}
            </div>

            <div
              style={{
                marginTop: 10,
                padding: '10px 12px',
                borderRadius: 4,
                background: 'var(--bg-surface)',
                border: '1px dashed var(--border-color)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                lineHeight: 1.6,
                minHeight: 70
              }}
            >
              {censoredPreview ||
                'Kliknite »UVOZI« za prenos besedila iz Wikipedije in samodejni predogled cenzuriranih blokov (██████).'}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button
                type="button"
                className="btn-share"
                style={{
                  flex: 1,
                  marginTop: 0,
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)'
                }}
                onClick={handleImportFromWikipedia}
              >
                <Eye size={16} /> PREDOGLED CENZURE
              </button>

              <button
                type="button"
                className="btn-share"
                style={{ flex: 1, marginTop: 0 }}
                disabled={loadingAction}
                onClick={handleSaveScheduledPuzzle}
              >
                <Save size={16} /> SHRANI V BAZO (SCHEDULED)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POGLED 2: Koledar in seznam ugank */}
      {activeView === 'calendar' && (
        <div className="classified-card" style={{ marginBottom: 0 }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <List size={16} /> SEZNAM IN KOLEDAR UGANK ({puzzlesList.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {puzzlesList.map(p => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: 4,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem'
                }}
              >
                <div>
                  <strong>#{p.puzzleNumber} — {p.title}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Datum: {p.releaseDate} • Besed: {p.totalWords}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: 3,
                      border: '1px solid var(--border-color)',
                      fontSize: '0.68rem'
                    }}
                  >
                    {p.difficulty}
                  </span>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: 3,
                      background: p.status === 'PUBLISHED' ? 'var(--accent-hit)' : 'var(--accent-gold)',
                      color: '#000',
                      fontWeight: 700,
                      fontSize: '0.68rem'
                    }}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POGLED 3: US-15 Upravljanje uporabnikov in vlog (PLAYER, EDITOR, ADMIN) */}
      {activeView === 'users' && user?.role === 'ADMIN' && (
        <div className="classified-card" style={{ marginBottom: 0 }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Users size={16} /> UPRAVLJANJE REGISTRIRANIH UPORABNIKOV IN VLOG (US-15)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {usersList.map(u => {
              const isSelf = u.id === user.id;
              return (
                <div
                  key={u.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: 4,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem'
                  }}
                >
                  <div>
                    <strong>{u.username}</strong>{' '}
                    {isSelf && (
                      <span style={{ color: 'var(--accent-gold)', fontSize: '0.7rem' }}>(VI)</span>
                    )}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {u.email}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select
                      className="sort-select"
                      value={u.role}
                      disabled={isSelf}
                      title={
                        isSelf
                          ? 'Odvzem lastne administratorske vloge je onemogočen (US-15 AC #4)'
                          : 'Spremeni uporabniško vlogo'
                      }
                      onChange={e =>
                        handleChangeUserRole(u.id, e.target.value as UserRole)
                      }
                    >
                      <option value="PLAYER">PLAYER</option>
                      <option value="EDITOR">EDITOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
};
