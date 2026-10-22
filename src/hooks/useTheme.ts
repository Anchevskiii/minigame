import { useState, useEffect } from 'react';
import type { ThemeMode } from '@/types/game';
import { loadTheme, saveTheme } from '@/utils/storage';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  return {
    theme,
    setTheme
  };
}
