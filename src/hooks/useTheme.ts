import { useState, useEffect, useCallback } from 'react';

export type ThemeName = 'default' | 'highroller' | 'cyber' | 'forest';
export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeName;
  mode: ThemeMode;
}

const STORAGE_KEY = 'poker-club-theme';

function loadTheme(): ThemeState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { theme: 'default', mode: 'dark' };
}

function applyTheme(state: ThemeState) {
  const root = document.documentElement;
  // Remove all theme classes
  root.classList.remove('theme-default', 'theme-highroller', 'theme-cyber', 'theme-forest', 'light', 'dark');
  root.classList.add(`theme-${state.theme}`, state.mode);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useTheme() {
  const [state, setState] = useState<ThemeState>(loadTheme);

  useEffect(() => {
    applyTheme(state);
  }, [state]);

  const setTheme = useCallback((theme: ThemeName) => {
    setState((prev) => ({ ...prev, theme }));
  }, []);

  const setMode = useCallback((mode: ThemeMode) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const toggleMode = useCallback(() => {
    setState((prev) => ({ ...prev, mode: prev.mode === 'dark' ? 'light' : 'dark' }));
  }, []);

  return { theme: state.theme, mode: state.mode, setTheme, setMode, toggleMode };
}

export const THEME_OPTIONS: { value: ThemeName; label: string; emoji: string }[] = [
  { value: 'default', label: 'Padrão', emoji: '♠️' },
  { value: 'highroller', label: 'High Roller', emoji: '👑' },
  { value: 'cyber', label: 'Cyber', emoji: '⚡' },
  { value: 'forest', label: 'Forest', emoji: '🌿' },
];
