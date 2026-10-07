/**
 * Shared motion variants for Framer Motion.
 * Import these rather than inlining spring configs per component.
 *
 * @see docs/specs/phase-1-1-design-system-shell.md
 * @see .agent/rules/10-design-system.md — Motion section
 */

export const spring = {
  snappy: { type: 'spring', stiffness: 500, damping: 32 },
  bouncy: { type: 'spring', stiffness: 300, damping: 15 },
  gentle: { type: 'spring', stiffness: 120, damping: 20 },
  ios: { type: 'spring', stiffness: 380, damping: 28 },
  capsule: { type: 'spring', stiffness: 420, damping: 32 },
  navbar: { type: 'spring', stiffness: 380, damping: 30 },
  lift: { type: 'spring', stiffness: 400, damping: 28 },
  carousel: { type: 'spring', stiffness: 340, damping: 28 },
};

export const pressable = {
  whileTap: { scale: 0.96 },
  whileHover: { scale: 1.02 },
  transition: spring.snappy,
};

export const pressableIos = {
  whileTap: { scale: 0.92 },
  whileHover: { scale: 1.02 },
  transition: spring.ios,
};

export const pressableMobileNav = {
  whileTap: { scale: 0.92 },
  transition: spring.capsule,
};

export const modalPanel = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: spring.snappy },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.12 } },
};

export const sheetPanel = {
  initial: { opacity: 0, y: '100%' },
  animate: { opacity: 1, y: 0, transition: spring.ios },
  exit: { opacity: 0, y: '100%', transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] } },
};

export const cardStaggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] } },
};

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] } },
};
