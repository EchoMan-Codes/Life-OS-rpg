import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Intelligent scroll-aware navbar visibility hook for mobile viewports.
 * Hides on intentional scroll-down, restores on scroll-up, idle, top, bottom, and route changes.
 *
 * Uses passive event listeners + requestAnimationFrame with zero state thrashing.
 *
 * @param {object} [options]
 * @param {number} [options.downThreshold=10] - Minimum downward delta to trigger hide
 * @param {number} [options.upThreshold=8] - Minimum upward delta to trigger show
 * @param {number} [options.idleDelay=220] - Milliseconds of scroll stillness before showing
 * @param {number} [options.topOffset=24] - Always visible within this distance from top
 * @param {boolean} [options.disabled=false] - When true (e.g. sheet open), keeps navbar visible or locked
 * @returns {boolean} isVisible
 */
export function useAutoHideNav({
  downThreshold = 10,
  upThreshold = 8,
  idleDelay = 220,
  topOffset = 24,
  disabled = false,
} = {}) {
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();

  const isVisibleRef = useRef(true);
  const lastScrollYRef = useRef(0);
  const idleTimerRef = useRef(null);
  const rafIdRef = useRef(null);

  // Helper to commit state changes only when actual change occurs
  const updateVisibility = (nextVisible) => {
    if (isVisibleRef.current !== nextVisible) {
      isVisibleRef.current = nextVisible;
      setIsVisible(nextVisible);
    }
  };

  // Re-show immediately on route transition
  useEffect(() => {
    updateVisibility(true);
    lastScrollYRef.current = 0;
  }, [location.pathname]);

  // If disabled externally (e.g. open modal or drawer), keep visible
  useEffect(() => {
    if (disabled) {
      updateVisibility(true);
    }
  }, [disabled]);

  useEffect(() => {
    if (disabled) return;

    // Detect actual scroll container: prefer #page-stage if it overflows, otherwise window
    const getScrollContainer = () => {
      const stage = document.getElementById('page-stage');
      if (stage && stage.scrollHeight > stage.clientHeight + 40) {
        return stage;
      }
      return window;
    };

    const container = getScrollContainer();

    const getScrollY = () => {
      if (container === window) {
        return Math.max(0, window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0);
      }
      return Math.max(0, container.scrollTop || 0);
    };

    const getMaxScroll = () => {
      if (container === window) {
        return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      }
      return Math.max(0, container.scrollHeight - container.clientHeight);
    };

    // Initialize baseline
    lastScrollYRef.current = getScrollY();

    const onScroll = () => {
      if (rafIdRef.current) return;

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;

        const currentY = getScrollY();
        const maxScroll = getMaxScroll();
        const delta = currentY - lastScrollYRef.current;

        // Reset idle timer on every movement
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
          updateVisibility(true);
        }, idleDelay);

        // Rule 1: Always visible near top of page (ignore rubber-band)
        if (currentY <= topOffset) {
          updateVisibility(true);
          lastScrollYRef.current = currentY;
          return;
        }

        // Rule 2: Always visible near bottom of scroll container
        if (maxScroll > 0 && currentY >= maxScroll - 48) {
          updateVisibility(true);
          lastScrollYRef.current = currentY;
          return;
        }

        // Rule 3: Intentional scroll-down -> hide
        if (delta > downThreshold) {
          updateVisibility(false);
          lastScrollYRef.current = currentY;
          return;
        }

        // Rule 4: Intentional scroll-up -> show
        if (delta < -upThreshold) {
          updateVisibility(true);
          lastScrollYRef.current = currentY;
          return;
        }
      });
    };

    container.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', onScroll);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [downThreshold, upThreshold, idleDelay, topOffset, disabled]);

  return isVisible;
}
