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
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  let effective = mode;

  if (mode === 'system') {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    effective = prefersDark ? 'dark' : 'light';
  }

  root.setAttribute('data-theme', effective);
  if (effective === 'light') {
    root.classList.add('theme-light');
    root.classList.remove('theme-dim', 'theme-dark', 'dark');
  } else if (effective === 'dim') {
    root.classList.add('theme-dim', 'dark');
    root.classList.remove('theme-light', 'theme-dark');
  } else {
    root.classList.add('theme-dark', 'dark');
    root.classList.remove('theme-light', 'theme-dim');
  }

  // Dispatch global event for components listening to theme change
  try {
    window.dispatchEvent(new CustomEvent('lifeos-theme-change', { detail: { mode, effective } }));
  } catch {
    // ignore
  }
}

// Immediate initial execution on module load to prevent theme flicker
try {
  if (typeof window !== 'undefined') {
    applyThemeToDOM(getSavedThemeMode());
  }
} catch {
  // ignore
}

// Cross-component listener registry
const themeListeners = new Set();

/**
 * Saves and applies a new theme mode, broadcasting to all subscribers.
 */
export function setSavedTheme(newMode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, newMode);
  } catch {
    // ignore
  }
  applyThemeToDOM(newMode);
  themeListeners.forEach((listener) => {
    try {
      listener(newMode);
    } catch {
      // ignore
    }
  });
}

/**
 * Toggles directly between Light and Dark mode.
 */
export function toggleTheme() {
  const current = getSavedThemeMode();
  const next = current === 'dark' || current === 'dim' ? 'light' : 'dark';
  setSavedTheme(next);
  return next;
}

/**
 * Toggles directly between Light and Dark mode with cinematic radial reveal.
 * Starts from the exact button coordinates and expands across the viewport.
 * Respects prefers-reduced-motion.
 */
export async function toggleThemeWithTransition(event) {
  const current = getSavedThemeMode();
  const next = current === 'dark' || current === 'dim' ? 'light' : 'dark';

  if (typeof window === 'undefined') {
    setSavedTheme(next);
    return next;
  }

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Extract coordinates of the trigger button or click
  let x = window.innerWidth / 2;
  let y = 0;
  if (event) {
    const el = event.currentTarget || event.target;
    if (el && typeof el.getBoundingClientRect === 'function') {
      const rect = el.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else if (typeof event.clientX === 'number') {
      x = event.clientX;
      y = event.clientY;
    }
  }

  const maxRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  // Broadcast cinematic ripple event for the radiant halo/sun flare or cosmic wave
  try {
    window.dispatchEvent(
      new CustomEvent('lifeos-theme-cinematic-ripple', {
        detail: { x, y, nextMode: next, maxRadius, prefersReduced },
      })
    );
  } catch {
    // ignore
  }

  // Check if View Transition API is supported and reduced motion is off
  if (!document.startViewTransition || prefersReduced) {
    setSavedTheme(next);
    return next;
  }

  const transition = document.startViewTransition(() => {
    applyThemeToDOM(next);
    setSavedTheme(next);
  });

  try {
    await transition.ready;
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 680,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        pseudoElement: '::view-transition-new(root)',
      }
    );
  } catch {
    // animation fallback
  }

  return next;
}

/**
 * React hook to read and update the application theme mode in full sync.
 */
export function useTheme() {
  const [mode, setModeState] = useState(getSavedThemeMode);

  useEffect(() => {
    // Sync current state on mount
    applyThemeToDOM(mode);

    const handleListener = (newMode) => {
      setModeState(newMode);
    };
    themeListeners.add(handleListener);

    const handleCustomEvent = (e) => {
      if (e?.detail?.mode) {
        setModeState(e.detail.mode);
      }
    };
    window.addEventListener('lifeos-theme-change', handleCustomEvent);

    const handleStorage = (e) => {
      if (e.key === THEME_STORAGE_KEY) {
        const nextMode = getSavedThemeMode();
        setModeState(nextMode);
        applyThemeToDOM(nextMode);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      themeListeners.delete(handleListener);
      window.removeEventListener('lifeos-theme-change', handleCustomEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, [mode]);

  const setMode = useCallback((newMode) => {
    setSavedTheme(newMode);
  }, []);

  const toggle = useCallback((event) => {
    return toggleThemeWithTransition(event);
  }, []);

  return {
    mode,
    isDark: mode === 'dark' || mode === 'dim',
    setMode,
    toggleTheme: toggle,
    toggleThemeDirect: toggleTheme,
    toggleThemeWithTransition,
    availableModes: APPEARANCE_MODES,
  };
}
