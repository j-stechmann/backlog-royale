import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'backlog_royale_theme';

function readStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // localStorage unavailable (private mode) — fall through to default
  }
  return 'system';
}

export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme());
  const [systemDark, setSystemDark] = useState<boolean>(() => {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Subscribe to OS color-scheme changes (independent of the chosen mode)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => setSystemDark(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // localStorage unavailable — keep in-memory state only
    }
    setThemeState(mode);
  }, []);

  // Derived resolved theme (no effect, no cascading renders)
  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  // Apply the .dark class to <html> when the resolved theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  return { theme, setTheme, resolvedTheme };
};
