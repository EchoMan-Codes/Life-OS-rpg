/**
 * LifeOS Appearance Mode Manager.
 * Supports:
 * - 'dark' (Default Dark Obsidian #07080C)
 * - 'dim' (Midnight Twilight #0A0D18)
 * - 'light' (Solar Minimalist #F8FAFC)
 * - 'system' (Follows OS preference)
 */

import { useState, useEffect, useCallback } from 'react';

export const THEME_STORAGE_KEY = 'lifeos_appearance_mode';

export const APPEARANCE_MODES = [
  { id: 'light', label: 'Light', desc: 'Solar Premium', icon: 'Sun' },
  { id: 'dark', label: 'Dark', desc: 'Obsidian Black', icon: 'Moon' },
  { id: 'dim', label: 'Dim', desc: 'Midnight Indigo', icon: 'Sparkles' },
];

/**
 * Gets the stored appearance mode or defaults to 'light'.
 */
export function getSavedThemeMode() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && ['light', 'dark', 'dim', 'system'].includes(saved)) {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'light';
}

/**
 * Applies the theme data attribute and root classes to the document element.
 */
export function applyThemeToDOM(mode) {
  const root = document.documentElement;
  let effective = mode;

  if (mode === 'system') {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    effective = prefersDark ? 'dark' : 'light';
  }

  root.setAttribute('data-theme', effective);
  if (effective === 'light') {
    root.classList.add('theme-light');
    root.classList.remove('theme-dim', 'theme-dark');
  } else if (effective === 'dim') {
    root.classList.add('theme-dim');
    root.classList.remove('theme-light', 'theme-dark');
  } else {
    root.classList.add('theme-dark');
    root.classList.remove('theme-light', 'theme-dim');
  }
}

/**
 * React hook to read and update the application theme mode.
 */
export function useTheme() {
  const [mode, setModeState] = useState(getSavedThemeMode);

  useEffect(() => {
    applyThemeToDOM(mode);
  }, [mode]);

  const setMode = useCallback((newMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch {
      // ignore
    }
    applyThemeToDOM(newMode);
  }, []);

  return { mode, setMode, availableModes: APPEARANCE_MODES };
}
