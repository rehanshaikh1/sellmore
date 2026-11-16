import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'sellmore-theme';

export const getStoredTheme = (): Theme => {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch { /* storage blocked */ }
  return 'light';
};

export const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(KEY, theme); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event('sellmore-theme'));
};

/** Current theme plus a toggle. Every component using it stays in step. */
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  useEffect(() => {
    const sync = () => setTheme(getStoredTheme());
    window.addEventListener('sellmore-theme', sync);
    return () => window.removeEventListener('sellmore-theme', sync);
  }, []);
  const toggle = () => applyTheme(theme === 'dark' ? 'light' : 'dark');
  return { theme, isDark: theme === 'dark', toggle };
};
