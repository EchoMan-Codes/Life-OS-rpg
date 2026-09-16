import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'lifeos_dashboard_preferences_v1';

const DEFAULT_PREFERENCES = {
  density: 'comfortable', // 'comfortable' | 'compact'
  visibleSections: {
    priorities: true,
    focus: true,
    goals: true,
    analytics: true,
    timeline: true,
    habits: true,
    insights: true,
  },
};

export function useDashboardPreferences() {
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          visibleSections: {
            ...DEFAULT_PREFERENCES.visibleSections,
            ...(parsed.visibleSections || {}),
          },
        };
      }
    } catch {
      // Ignore localStorage errors
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Ignore localStorage errors
    }
  }, [preferences]);

  const toggleSection = useCallback((sectionKey) => {
    setPreferences((prev) => ({
      ...prev,
      visibleSections: {
        ...prev.visibleSections,
        [sectionKey]: !prev.visibleSections[sectionKey],
      },
    }));
  }, []);

  const setDensity = useCallback((density) => {
    setPreferences((prev) => ({
      ...prev,
      density,
    }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  return {
    preferences,
    visibleSections: preferences.visibleSections,
    density: preferences.density,
    toggleSection,
    setDensity,
    resetPreferences,
  };
}
