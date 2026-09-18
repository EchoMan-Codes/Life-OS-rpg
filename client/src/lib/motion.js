/**
 * Life OS — Motion System Architecture
 *
 * Single source of truth for animation durations, easings, spring configs,
 * and semantic motion presets across client components.
 */

export const durations = {
  instant: 0.08, // ~80ms: micro-ticks, toggle switches
  fast: 0.15,    // ~150ms: hover, dropdowns, tooltips
  base: 0.25,    // ~250ms: sheet drawer open, card expand
  slow: 0.40,    // ~400ms: modal entrance, full-screen takeover
  deliberate: 0.60, // ~600ms: celebration, XP level-up fanfare
};

export const easings = {
  standard: [0.2, 0, 0, 1],
  decelerate: [0.0, 0, 0.2, 1],
  accelerate: [0.3, 0, 1, 1],
  emphasized: [0.2, 0, 0, 1],
};

export const spring = {
  press: { type: 'spring', stiffness: 600, damping: 35, mass: 0.5 },
  snappy: { type: 'spring', stiffness: 500, damping: 32 },
  smooth: { type: 'spring', stiffness: 260, damping: 26 },
  bouncyRestrained: { type: 'spring', stiffness: 340, damping: 20 },
  settle: { type: 'spring', stiffness: 180, damping: 24 },
  gentle: { type: 'spring', stiffness: 120, damping: 20 },
};

/**
 * Semantic Motion Presets for Framer Motion components
 */
export const motionPresets = {
  press: {
    whileTap: { scale: 0.97 },
    whileHover: { scale: 1.01 },
    transition: spring.press,
  },
  hoverLift: {
    whileHover: { y: -2 },
    transition: spring.snappy,
  },
  enterFadeRise: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: spring.snappy },
    exit: { opacity: 0, y: 4, transition: { duration: durations.fast } },
  },
  exitFadeSink: {
    initial: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 6, transition: { duration: durations.fast, ease: easings.accelerate } },
  },
  modalIn: {
    initial: { opacity: 0, scale: 0.96, y: 12 },
    animate: { opacity: 1, scale: 1, y: 0, transition: spring.snappy },
    exit: { opacity: 0, scale: 0.98, y: 6, transition: { duration: durations.fast } },
  },
  sheetIn: {
    initial: { opacity: 0, y: '100%' },
    animate: { opacity: 1, y: 0, transition: spring.snappy },
    exit: { opacity: 0, y: '100%', transition: { duration: durations.base, ease: easings.accelerate } },
  },
  toastIn: {
    initial: { opacity: 0, y: 16, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: spring.snappy },
    exit: { opacity: 0, y: 8, scale: 0.98, transition: { duration: durations.fast } },
  },
  listContainer: {
    animate: {
      transition: {
        staggerChildren: 0.04,
      },
    },
  },
  listItem: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: spring.snappy },
    exit: { opacity: 0, scale: 0.96, transition: { duration: durations.fast } },
  },
  progressFill: {
    transition: { duration: durations.slow, ease: easings.decelerate },
  },
};

/**
 * Normalizes motion props when user has prefers-reduced-motion enabled.
 * Preserves opacity transitions without jarring layout or position transforms.
 *
 * @param {boolean} shouldReduceMotion
 * @param {object} standardPreset
 * @returns {object}
 */
export function getAccessibleMotion(shouldReduceMotion, standardPreset) {
  if (!shouldReduceMotion) return standardPreset;
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: durations.fast } },
    exit: { opacity: 0, transition: { duration: durations.instant } },
  };
}
