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
};

export const pressable = {
  whileTap: { scale: 0.96 },
  whileHover: { scale: 1.02 },
  transition: spring.snappy,
};

export const modalPanel = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: spring.snappy },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.12 } },
};
