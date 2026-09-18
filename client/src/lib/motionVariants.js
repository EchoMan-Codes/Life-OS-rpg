/**
 * Shared motion variants for Framer Motion.
 * Bridged to canonical client/src/lib/motion.js system for 100% backwards compatibility.
 */

import { spring as canonicalSpring, motionPresets } from './motion';

export const spring = canonicalSpring;
export const pressable = motionPresets.press;
export const modalPanel = motionPresets.modalIn;

export {
  durations,
  easings,
  motionPresets,
  getAccessibleMotion,
} from './motion';
