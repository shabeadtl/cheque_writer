import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'nbo_theme';

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
    return saved;
  }
  return 'light'; // Default to light mode
}

export function applyTheme(theme: Theme): boolean {
  if (typeof document === 'undefined') return false;
  
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  return isDark;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const t = getInitialTheme();
    return t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    const darkApplied = applyTheme(newTheme);
    setIsDark(darkApplied);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [isDark, setTheme]);

  useEffect(() => {
    const darkApplied = applyTheme(theme);
    setIsDark(darkApplied);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setIsDark(applyTheme('system'));
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return { theme, isDark, setTheme, toggleTheme };
}
