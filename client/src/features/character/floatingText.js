import { useCallback } from 'react';

export const FLOATING_TEXT_EVENT = 'lifeos:floating-text';

/**
 * Dispatch a floating combat text event.
 *
 * @param {string} text - Floating text string (e.g. '+15 XP', '+5 Gold', '-8 HP')
 * @param {'xp'|'gold'|'hp'|'mana'} [stat] - Stat type for color matching
 */
export function spawnFloatingText(text, stat) {
  if (typeof window === 'undefined') return;

  // Auto-detect stat if not explicitly provided
  let detectedStat = stat;
  if (!detectedStat) {
    const lower = String(text).toLowerCase();
    if (lower.includes('xp')) detectedStat = 'xp';
    else if (lower.includes('gold')) detectedStat = 'gold';
    else if (lower.includes('hp')) detectedStat = 'hp';
    else if (lower.includes('mana') || lower.includes('mp')) detectedStat = 'mana';
    else detectedStat = 'xp';
  }

  window.dispatchEvent(
    new CustomEvent(FLOATING_TEXT_EVENT, {
      detail: {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        text,
        stat: detectedStat,
      },
    })
  );
}

// Expose ONLY window.spawnFloatingText in development for browser console testing
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.spawnFloatingText = spawnFloatingText;
}

/**
 * Hook to trigger floating combat text from any feature.
 */
export function useFloatingText() {
  const trigger = useCallback((text, stat) => {
    spawnFloatingText(text, stat);
  }, []);

  return {
    spawnFloatingText: trigger,
  };
}
