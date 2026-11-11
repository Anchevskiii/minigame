import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/types/game';
import { supabaseClient } from '@/lib/supabase';

const AUTH_TOKEN_KEY = 'redacted_auth_jwt';
const AUTH_USER_KEY = 'redacted_auth_user';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
          }
        } else if (res.status === 401) {
          setToken(null);
          setUser(null);
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
        }
      })
      .catch(() => {
        // Če strežnik ni dosegljiv, ohrani obstoječo sejo v localStorage
      });
  }, [token]);

  const login = useCallback(async (emailOrUsername: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrUsername, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Prijava ni uspela.' };
      }

      if (supabaseClient && emailOrUsername.includes('@')) {
        await supabaseClient.auth.signInWithPassword({
          email: emailOrUsername,
          password
        }).catch(() => {});
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Strežnik za prijavo trenutno ni dosegljiv.' };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Registracija ni uspela.' };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Strežnik za registracijo trenutno ni dosegljiv.' };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    if (supabaseClient) {
      supabaseClient.auth.signOut().catch(() => {});
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// oxlint-disable-next-line react/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth mora biti uporabljen znotraj AuthProvider.');
  }
  return ctx;
}
