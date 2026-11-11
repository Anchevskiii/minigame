import { useState, useEffect } from 'react';
import type { ThemeMode } from '@/types/game';
import { loadTheme, saveTheme } from '@/utils/storage';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.remove('theme-light', 'theme-dark', 'theme-terminal', 'dark');
    root.classList.add(`theme-${theme}`);
    if (theme === 'dark' || theme === 'terminal') {
      root.classList.add('dark');
    }
    saveTheme(theme);
  }, [theme]);

  return {
    theme,
    setTheme
  };
}
