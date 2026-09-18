import { spring, durations } from './motion';

/**
 * Life OS — Page Transition Motion Variants
 *
 * Implements the 3 canonical spatial variants:
 * 1. siblingSlide (Root ↔ Root with directional leading/trailing logic)
 * 2. deepenPush (Root ↔ Focus Chamber with true spatial inverse)
 * 3. lateralCalm (Any ↔ Reflection & Profile with gentle settle)
 *
 * Animates strictly transform, opacity, and filter.
 */

export const pageTransitionVariants = {
  // ── 1. Sibling Slide (Root ↔ Root) ──
  siblingSlide: {
    initial: ({ spatialDirection = 1, isMobile = false, shouldReduceMotion = false }) => {
      if (shouldReduceMotion) return { opacity: 0 };

      if (isMobile) {
        return {
          x: spatialDirection > 0 ? '100%' : '-100%',
          opacity: 0.15,
          scale: 0.98,
        };
      }

      // Desktop: Restrained translate to prevent jarring motion around fixed chrome
      return {
        x: spatialDirection > 0 ? 36 : -36,
        opacity: 0,
        scale: 0.99,
      };
    },
    animate: ({ shouldReduceMotion = false }) => {
      if (shouldReduceMotion) {
        return {
          opacity: 1,
          transition: { duration: durations.fast },
        };
      }

      return {
        x: 0,
        opacity: 1,
        scale: 1,
        transition: spring.snappy,
      };
    },
    exit: ({ spatialDirection = 1, isMobile = false, shouldReduceMotion = false }) => {
      if (shouldReduceMotion) {
        return {
          opacity: 0,
          transition: { duration: durations.fast },
        };
      }

      if (isMobile) {
        return {
          x: spatialDirection > 0 ? '-30%' : '30%',
          opacity: 0,
          scale: 0.96,
          transition: spring.snappy,
        };
      }

      // Desktop: Subtly recede
      return {
        x: spatialDirection > 0 ? -28 : 28,
        opacity: 0,
        scale: 0.985,
        transition: spring.snappy,
      };
    },
  },

  // ── 2. Deepen Push (Root ↔ Deeper Focus Chamber) ──
  deepenPush: {
    initial: ({ direction = 'forward', shouldReduceMotion = false }) => {
      if (shouldReduceMotion) return { opacity: 0 };

      if (direction === 'forward') {
        // Entering deeper chamber: rises from slightly below with soft blur-to-clear
        return {
          y: 30,
          scale: 0.98,
          opacity: 0,
          filter: 'blur(8px)',
        };
      }

      // Back-out (returning from Focus to Dashboard): scales up from receded background
      return {
        y: 0,
        scale: 0.93,
        opacity: 0.3,
        filter: 'brightness(0.65)',
      };
    },
    animate: ({ shouldReduceMotion = false }) => {
      if (shouldReduceMotion) {
        return {
          opacity: 1,
          transition: { duration: durations.fast },
        };
      }

      return {
        y: 0,
        scale: 1,
        opacity: 1,
        filter: 'blur(0px) brightness(1)',
        transition: spring.smooth,
      };
    },
    exit: ({ direction = 'forward', shouldReduceMotion = false }) => {
      if (shouldReduceMotion) {
        return {
          opacity: 0,
          transition: { duration: durations.fast },
        };
      }

      if (direction === 'forward') {
        // Outgoing Dashboard receding behind entering chamber
        return {
          y: 0,
          scale: 0.93,
          opacity: 0.25,
          filter: 'brightness(0.65)',
          transition: spring.smooth,
        };
      }

      // Outgoing Focus chamber descending away
      return {
        y: 24,
        scale: 0.97,
        opacity: 0,
        filter: 'blur(4px)',
        transition: spring.smooth,
      };
    },
  },

  // ── 3. Lateral Calm (Any ↔ Reflection / Profile) ──
  lateralCalm: {
    initial: ({ shouldReduceMotion = false }) => {
      if (shouldReduceMotion) return { opacity: 0 };

      return {
        y: 12,
        opacity: 0,
        scale: 0.995,
      };
    },
    animate: ({ shouldReduceMotion = false }) => {
      if (shouldReduceMotion) {
        return {
          opacity: 1,
          transition: { duration: durations.fast },
        };
      }

      return {
        y: 0,
        opacity: 1,
        scale: 1,
        transition: spring.settle,
      };
    },
    exit: ({ shouldReduceMotion = false }) => {
      if (shouldReduceMotion) {
        return {
          opacity: 0,
          transition: { duration: durations.fast },
        };
      }

      return {
        y: -8,
        opacity: 0,
        transition: { duration: durations.fast, ease: 'easeOut' },
      };
    },
  },

  // ── 4. Static / None (Direct URL access, OAuth callback, Dev routes) ──
  none: {
    initial: () => ({ opacity: 1 }),
    animate: () => ({ opacity: 1 }),
    exit: () => ({ opacity: 0, transition: { duration: durations.instant } }),
  },
};
