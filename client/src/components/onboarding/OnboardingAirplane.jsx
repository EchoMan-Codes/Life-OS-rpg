import { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * High-fidelity 3D-styled folded paper airplane SVG.
 * Strictly faces RIGHT (0 degrees) so tangent rotation lines up perfectly.
 * Includes shaded facets for genuine paper fold dimensionality and a radiant magical glow.
 */
function AirplaneSvg() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block filter drop-shadow-[0_0_14px_rgba(167,139,250,0.9)] drop-shadow-[0_0_30px_rgba(139,92,246,0.6)]"
      aria-hidden="true"
    >
      <defs>
        {/* Top wing facet gradient (illuminated from above) */}
        <linearGradient id="plane-top-wing" x1="6" y1="8" x2="44" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ede9fe" />
          <stop offset="50%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>

        {/* Bottom wing facet gradient (in shadow) */}
        <linearGradient id="plane-bottom-wing" x1="6" y1="40" x2="44" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="60%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>

        {/* Underbody keel shadow */}
        <linearGradient id="plane-keel" x1="16" y1="24" x2="44" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4c1d95" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>

        {/* Tail thruster glow */}
        <radialGradient id="plane-thruster" cx="16" cy="24" r="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#c084fc" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Underbody keel / center fold */}
      <polygon points="16,24 44,24 6,29" fill="url(#plane-keel)" opacity="0.7" />

      {/* Top Wing Facet (facing right: nose at (44, 24), tail at (6, 8), crease at (16, 24)) */}
      <polygon
        points="44,24 6,8 16,24"
        fill="url(#plane-top-wing)"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />

      {/* Bottom Wing Facet (nose at (44, 24), tail at (6, 40), crease at (16, 24)) */}
      <polygon
        points="44,24 16,24 6,40"
        fill="url(#plane-bottom-wing)"
        stroke="rgba(167,139,250,0.5)"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />

      {/* Center Spine highlight line */}
      <line
        x1="16"
        y1="24"
        x2="44"
        y2="24"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Subtle magical thruster star at tail notch */}
      <circle cx="16" cy="24" r="5" fill="url(#plane-thruster)" />
      <circle cx="16" cy="24" r="1.5" fill="#ffffff" />
    </svg>
  );
}

/**
 * Live foreground Airplane component.
 * Positioned using exact viewport-relative percentages (vw/vh).
 *
 * @param {object} props
 * @param {boolean} props.visible - Whether to render
 * @param {number} props.x - Viewport-relative X position (vw %)
 * @param {number} props.y - Viewport-relative Y position (vh %)
 * @param {number} props.rotation - Degrees of rotation (from trajectory tangent)
 * @param {number} props.scale - Depth-based scale factor
 * @param {number} [props.opacity=1] - Opacity for fade in/out
 */
function OnboardingAirplaneBase({ visible, x, y, rotation, scale, opacity = 1 }) {
  if (!visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-30"
      style={{
        left: `${x}vw`,
        top: `${y}vh`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
        opacity,
        willChange: 'transform, opacity',
        transition: 'opacity 150ms ease-out',
      }}
    >
      <AirplaneSvg />
    </div>
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
