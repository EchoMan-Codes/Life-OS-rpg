import { useSyncExternalStore } from 'react';

/**
 * Custom hook for responsive breakpoint detection using useSyncExternalStore.
 * @param {string} query - CSS media query string, e.g. '(min-width: 768px)'
 * @returns {boolean} Whether the media query currently matches
 */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
