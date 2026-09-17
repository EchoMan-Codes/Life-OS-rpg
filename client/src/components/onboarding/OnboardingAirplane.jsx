import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Elegant stylized paper-airplane SVG.
 * Violet-tinted to match the fantasy palette, with a subtle luminous glow.
 * All positioning/rotation is handled by the parent via style/animate props.
 */
function AirplaneSvg() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block"
      aria-hidden="true"
    >
      {/* Main body — elegant folded paper airplane silhouette */}
      <path
        d="M2 16L28 4L18 16L28 28L2 16Z"
        fill="url(#airplane-grad)"
        fillOpacity="0.9"
        stroke="rgba(167,139,250,0.6)"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      {/* Wing fold line — adds depth */}
      <path
        d="M18 16L28 4"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
      {/* Bottom wing shadow fold */}
      <path
        d="M18 16L28 28"
        stroke="rgba(0,0,0,0.2)"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="airplane-grad" x1="2" y1="16" x2="28" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c4b5fd" />
          <stop offset="0.5" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Positioned airplane component for the onboarding flight sequence.
 *
 * @param {object} props
 * @param {boolean} props.visible - Whether to render
 * @param {number} props.x - Viewport-relative X position (vw %)
 * @param {number} props.y - Viewport-relative Y position (vh %)
 * @param {number} props.rotation - Degrees of rotation (from tangent)
 * @param {number} props.scale - Depth-based scale factor
 * @param {number} [props.opacity=1] - Opacity for fade in/out
 */
function OnboardingAirplaneBase({ visible, x, y, rotation, scale, opacity = 1 }) {
  const shouldReduceMotion = useReducedMotion();

  if (!visible) return null;

  return (
    <motion.div
      className="fixed pointer-events-none z-30"
      style={{
        left: `${x}vw`,
        top: `${y}vh`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
        opacity,
        willChange: 'transform, opacity',
        filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.4)) drop-shadow(0 0 20px rgba(139,92,246,0.2))',
      }}
      initial={false}
      animate={
        shouldReduceMotion
          ? {}
          : undefined
      }
    >
      <AirplaneSvg />
    </motion.div>
  );
}

OnboardingAirplaneBase.propTypes = {
  visible: PropTypes.bool.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  rotation: PropTypes.number.isRequired,
  scale: PropTypes.number.isRequired,
  opacity: PropTypes.number,
};

export const OnboardingAirplane = memo(OnboardingAirplaneBase);
