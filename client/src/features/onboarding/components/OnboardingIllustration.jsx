import { motion, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import clsx from 'clsx';

/**
 * Minimalist editorial vector illustration components for the LifeOS onboarding journey.
 * Inspired by the clean editorial line art, stippling dots, and geometric elegance of the reference.
 */
export function OnboardingIllustration({ step, type, className }) {
  const activeType = step || type || 'intro';
  const shouldReduceMotion = useReducedMotion();

  const floatAnimation = shouldReduceMotion
    ? {}
    : {
        animate: { y: [-4, 4, -4], rotate: [-0.5, 0.5, -0.5] },
        transition: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
      };

  const orbitAnimation = shouldReduceMotion
    ? {}
    : {
        animate: { rotate: 360 },
        transition: { repeat: Infinity, duration: 24, ease: 'linear' },
      };

  return (
    <div className={clsx('relative flex items-center justify-center select-none', className)}>
      {/* ── 1. Manifesto / Gateway Scene (Intro) ── */}
      {activeType === 'intro' && (
        <svg viewBox="0 0 320 320" fill="none" className="w-full h-full max-w-[320px]">
          {/* Subtle Ambient Backdrop Glow */}
          <circle cx="160" cy="160" r="110" fill="#A78BFA" fillOpacity="0.04" />
          
          {/* Celestial Orbit Ring & Stipples */}
          <motion.g {...orbitAnimation} style={{ transformOrigin: '160px 160px' }}>
            <ellipse
              cx="160"
              cy="160"
              rx="120"
              ry="50"
              stroke="white"
              strokeOpacity="0.18"
              strokeDasharray="4 6"
              transform="rotate(-25 160 160)"
            />
            {/* Small Orbiting Sphere */}
            <circle cx="270" cy="115" r="3.5" fill="#EAB308" />
            <circle cx="50" cy="205" r="2.5" fill="#38BDF8" />
          </motion.g>

          {/* Stippled Field (Artistic dots) */}
          <g fill="white" fillOpacity="0.35">
            <circle cx="90" cy="90" r="1" />
            <circle cx="105" cy="80" r="1.5" />
            <circle cx="230" cy="85" r="1" />
            <circle cx="245" cy="100" r="1.5" />
            <circle cx="75" cy="230" r="1" />
            <circle cx="235" cy="240" r="1.2" />
            <circle cx="160" cy="45" r="1.5" />
            <circle cx="180" cy="40" r="1" />
            <circle cx="140" cy="50" r="1" />
            <circle cx="260" cy="170" r="1.2" />
            <circle cx="60" cy="150" r="1.2" />
          </g>

          {/* Gateway Arch / Portal Doorway */}
          <path
            d="M 115 255 L 115 130 C 115 105, 140 85, 160 85 C 180 85, 205 105, 205 130 L 205 255"
            stroke="white"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />
          <path
            d="M 125 255 L 125 136 C 125 116, 144 100, 160 100 C 176 100, 195 116, 195 136 L 195 255"
            stroke="white"
            strokeWidth="1"
            strokeOpacity="0.2"
          />
          <line x1="85" y1="255" x2="235" y2="255" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />

          {/* Radiating Light Lines from Gateway Portal */}
          <g stroke="white" strokeOpacity="0.15" strokeWidth="1">
            <line x1="160" y1="100" x2="160" y2="60" strokeDasharray="3 4" />
            <line x1="140" y1="110" x2="110" y2="80" strokeDasharray="3 4" />
            <line x1="180" y1="110" x2="210" y2="80" strokeDasharray="3 4" />
          </g>

          {/* Stylized Minimalist Hero Figure standing before doorway */}
          <motion.g {...floatAnimation}>
            {/* Head */}
            <circle cx="160" cy="170" r="7.5" fill="white" fillOpacity="0.9" />
            {/* Body */}
            <path
              d="M 160 180 C 150 185, 146 200, 148 220 L 172 220 C 174 200, 170 185, 160 180 Z"
              fill="white"
              fillOpacity="0.85"
            />
            {/* Legs */}
            <line x1="153" y1="220" x2="151" y2="255" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="167" y1="220" x2="169" y2="255" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            {/* Arms at sides */}
            <path
              d="M 148 188 C 142 195, 142 208, 144 218"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M 172 188 C 178 195, 178 208, 176 218"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </motion.g>

          {/* Small Floating System Sigil */}
          <g transform="translate(160, 135)">
            <circle cx="0" cy="0" r="10" stroke="#A78BFA" strokeWidth="1" strokeOpacity="0.6" fill="#A78BFA" fillOpacity="0.1" />
            <text x="0" y="3.5" textAnchor="middle" fill="#A78BFA" fontSize="10" fontWeight="bold">Ω</text>
          </g>
        </svg>
      )}

      {/* ── 2. Primary Objective / Mastery Scene (Core Focus) ── */}
      {activeType === 'focus' && (
        <svg viewBox="0 0 320 320" fill="none" className="w-full h-full max-w-[320px]">
          <circle cx="160" cy="160" r="110" fill="#38BDF8" fillOpacity="0.04" />

          {/* Horizon Floor */}
          <line x1="80" y1="250" x2="240" y2="250" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />

          {/* Radiating Concentration Lines / Stipples */}
          <g fill="white" fillOpacity="0.35">
            <circle cx="160" cy="75" r="1.5" />
            <circle cx="175" cy="80" r="1" />
            <circle cx="145" cy="80" r="1" />
            <circle cx="190" cy="95" r="1.5" />
            <circle cx="130" cy="95" r="1.5" />
            <circle cx="210" cy="115" r="1" />
            <circle cx="110" cy="115" r="1" />
            <circle cx="230" cy="140" r="1.5" />
            <circle cx="90" cy="140" r="1.5" />
          </g>

          {/* Floating Spheres of Focus */}
          <motion.g {...floatAnimation}>
            <circle cx="160" cy="95" r="5" fill="#38BDF8" />
            <circle cx="135" cy="110" r="3.5" fill="white" fillOpacity="0.8" />
            <circle cx="185" cy="110" r="3.5" fill="white" fillOpacity="0.8" />
            <circle cx="115" cy="130" r="3" fill="#A78BFA" />
            <circle cx="205" cy="130" r="3" fill="#34D399" />
          </motion.g>

          {/* Stylized Meditating / Focused Figure */}
          <g>
            {/* Head */}
            <circle cx="160" cy="155" r="8" fill="white" fillOpacity="0.9" />
            {/* Torso */}
            <path
              d="M 160 165 C 148 172, 144 190, 146 210 L 174 210 C 176 190, 172 172, 160 165 Z"
              fill="white"
              fillOpacity="0.85"
            />
            {/* Raised Arms in serene concentration */}
            <path
              d="M 148 174 C 138 160, 134 140, 138 125"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 172 174 C 182 160, 186 140, 182 125"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Cross-legged Base */}
            <path
              d="M 125 240 C 135 215, 145 210, 160 210 C 175 210, 185 215, 195 240 C 185 250, 135 250, 125 240 Z"
              fill="white"
              fillOpacity="0.8"
            />
          </g>
        </svg>
      )}

      {/* ── 3. Daily Rhythm / Discipline Level Scene ── */}
      {(activeType === 'cadence' || activeType === 'level') && (
        <svg viewBox="0 0 320 320" fill="none" className="w-full h-full max-w-[320px]">
          <circle cx="160" cy="160" r="110" fill="#FBBF24" fillOpacity="0.04" />

          {/* Rising Sun / Moon Disc behind steps */}
          <circle cx="160" cy="120" r="38" stroke="white" strokeWidth="1" strokeOpacity="0.25" fill="#EAB308" fillOpacity="0.06" />
          <path
            d="M 122 120 A 38 38 0 0 1 198 120"
            stroke="#EAB308"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />

          {/* Stepped Altar / Progress Stairs */}
          <path
            d="M 90 250 L 125 250 L 125 225 L 155 225 L 155 200 L 185 200 L 185 175 L 215 175 L 215 250"
            stroke="white"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />
          <line x1="70" y1="250" x2="250" y2="250" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />

          {/* Subtle Stippled Dawn Rays */}
          <g fill="white" fillOpacity="0.3">
            <circle cx="160" cy="65" r="1" />
            <circle cx="175" cy="70" r="1.5" />
            <circle cx="145" cy="70" r="1.5" />
            <circle cx="190" cy="80" r="1" />
            <circle cx="130" cy="80" r="1" />
            <circle cx="210" cy="95" r="1.2" />
            <circle cx="110" cy="95" r="1.2" />
          </g>

          {/* Figure ascending the steps towards consistency */}
          <motion.g {...floatAnimation}>
            {/* Head */}
            <circle cx="178" cy="148" r="7" fill="white" fillOpacity="0.9" />
            {/* Torso */}
            <path
              d="M 178 156 C 172 162, 170 174, 172 186 L 188 186 C 190 174, 186 162, 178 156 Z"
              fill="white"
              fillOpacity="0.85"
            />
            {/* Stepping Legs */}
            <line x1="174" y1="186" x2="168" y2="200" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="184" y1="186" x2="190" y2="200" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            {/* Arm with glowing quill / scroll */}
            <path
              d="M 184 163 C 192 168, 196 174, 194 180"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </motion.g>
        </svg>
      )}

      {/* ── 4. Focus Style / Deep Work Scene (Chamber) ── */}
      {activeType === 'style' && (
        <svg viewBox="0 0 320 320" fill="none" className="w-full h-full max-w-[320px]">
          <circle cx="160" cy="160" r="110" fill="#38BDF8" fillOpacity="0.04" />

          {/* Minimalist Hourglass Symbol */}
          <motion.g {...floatAnimation}>
            <path
              d="M 135 105 L 185 105 L 165 140 L 185 175 L 135 175 L 155 140 Z"
              stroke="white"
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />
            {/* Top & Bottom Bases */}
            <line x1="130" y1="105" x2="190" y2="105" stroke="white" strokeWidth="2" strokeOpacity="0.6" strokeLinecap="round" />
            <line x1="130" y1="175" x2="190" y2="175" stroke="white" strokeWidth="2" strokeOpacity="0.6" strokeLinecap="round" />
            {/* Sand particles inside */}
            <circle cx="160" cy="155" r="1.5" fill="#38BDF8" />
            <circle cx="160" cy="165" r="2" fill="#38BDF8" />
            <path d="M 148 172 C 154 168, 166 168, 172 172 Z" fill="#38BDF8" fillOpacity="0.6" />
          </motion.g>

          {/* Radiating Flow Wave Arcs */}
          <ellipse cx="160" cy="140" rx="65" ry="65" stroke="white" strokeWidth="1" strokeOpacity="0.12" strokeDasharray="5 7" />
          <ellipse cx="160" cy="140" rx="95" ry="95" stroke="white" strokeWidth="1" strokeOpacity="0.08" strokeDasharray="4 8" />

          {/* Stippled Field */}
          <g fill="white" fillOpacity="0.3">
            <circle cx="85" cy="120" r="1" />
            <circle cx="95" cy="135" r="1.5" />
            <circle cx="235" cy="120" r="1" />
            <circle cx="225" cy="135" r="1.5" />
            <circle cx="160" cy="225" r="1.5" />
            <circle cx="170" cy="235" r="1" />
            <circle cx="150" cy="235" r="1" />
          </g>

          {/* Minimalist Desk & Scholar Silhouette */}
          <line x1="90" y1="250" x2="230" y2="250" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
          <rect x="115" y="220" width="90" height="30" rx="4" stroke="white" strokeWidth="1" strokeOpacity="0.25" fill="white" fillOpacity="0.02" />
        </svg>
      )}

      {/* ── 5. System Dossier / Authentication Scene (Triumph & Entry) ── */}
      {activeType === 'auth' && (
        <svg viewBox="0 0 320 320" fill="none" className="w-full h-full max-w-[320px]">
          <circle cx="160" cy="160" r="110" fill="#A78BFA" fillOpacity="0.05" />

          {/* Radiating Celestial Halo */}
          <motion.g {...orbitAnimation} style={{ transformOrigin: '160px 140px' }}>
            <circle cx="160" cy="140" r="85" stroke="white" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="4 8" />
            <circle cx="220" cy="80" r="3" fill="#EAB308" />
            <circle cx="100" cy="200" r="2.5" fill="#A78BFA" />
          </motion.g>

          {/* Stipples of Celebration */}
          <g fill="white" fillOpacity="0.35">
            <circle cx="120" cy="75" r="1.2" />
            <circle cx="135" cy="65" r="1.5" />
            <circle cx="185" cy="65" r="1.5" />
            <circle cx="200" cy="75" r="1.2" />
            <circle cx="75" cy="150" r="1.2" />
            <circle cx="245" cy="150" r="1.2" />
          </g>

          {/* Heroic Crest Star / Trophy (inspired by the reference's 'success!' screen) */}
          <motion.g {...floatAnimation}>
            <g transform="translate(160, 115)">
              {/* Star Crest */}
              <polygon
                points="0,-22 6,-7 22,-7 9,3 14,18 0,9 -14,18 -9,3 -22,-7 -6,-7"
                fill="#EAB308"
                fillOpacity="0.9"
              />
              <circle cx="0" cy="0" r="28" stroke="#EAB308" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 4" />
            </g>

            {/* Two Stylized Figures reaching upwards together */}
            {/* Left Hero */}
            <circle cx="128" cy="148" r="7" fill="white" fillOpacity="0.9" />
            <path
              d="M 128 156 C 120 162, 116 178, 120 196 L 138 196 C 142 178, 136 162, 128 156 Z"
              fill="white"
              fillOpacity="0.85"
            />
            <line x1="124" y1="196" x2="120" y2="245" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="134" y1="196" x2="138" y2="245" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 134 162 C 144 145, 148 135, 154 125" stroke="white" strokeWidth="2" strokeLinecap="round" />

            {/* Right Hero */}
            <circle cx="192" cy="148" r="7" fill="white" fillOpacity="0.9" />
            <path
              d="M 192 156 C 184 162, 180 178, 184 196 L 202 196 C 206 178, 200 162, 192 156 Z"
              fill="white"
              fillOpacity="0.85"
            />
            <line x1="188" y1="196" x2="184" y2="245" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="198" y1="196" x2="202" y2="245" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 188 162 C 178 145, 174 135, 166 125" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </motion.g>

          <line x1="75" y1="245" x2="245" y2="245" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
        </svg>
      )}
    </div>
  );
}

OnboardingIllustration.propTypes = {
  step: PropTypes.oneOf(['intro', 'focus', 'cadence', 'level', 'style', 'auth']),
  type: PropTypes.oneOf(['intro', 'focus', 'cadence', 'level', 'style', 'auth']),
  className: PropTypes.string,
};
