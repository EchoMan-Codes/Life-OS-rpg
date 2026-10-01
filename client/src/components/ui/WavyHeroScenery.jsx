import PropTypes from 'prop-types';
import clsx from 'clsx';

/**
 * WavyHeroScenery
 * Organic, atmospheric illustrated scenery with mountain silhouettes,
 * twilight gradients, celestial stars, and a smooth bottom wave curve.
 * Inspired by the LifeOS visual references.
 */
export function WavyHeroScenery({
  variant = 'dashboard', // 'dashboard' | 'profile'
  className = '',
  children,
}) {
  return (
    <div
      className={clsx(
        'relative rounded-3xl overflow-hidden transition-all duration-300',
        'border border-slate-200/90 dark:border-white/15',
        'shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.15)]',
        'bg-[#0C0F1D] text-white',
        className
      )}
    >
      {/* ── Background Atmospheric SVG Artwork ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <svg
          viewBox="0 0 400 240"
          preserveAspectRatio="none"
          className="w-full h-full object-cover"
        >
          <defs>
            {/* Sky Twilight Gradient */}
            <linearGradient id={`skyGradient-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0B091B" />
              <stop offset="35%" stopColor="#1B1745" />
              <stop offset="70%" stopColor="#311F5E" />
              <stop offset="90%" stopColor="#4A1D6D" />
              <stop offset="100%" stopColor="#160E33" />
            </linearGradient>

            {/* Sun / Dawn Horizon Radial Glow */}
            <radialGradient id={`horizonGlow-${variant}`} cx="50%" cy="58%" r="55%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
              <stop offset="40%" stopColor="#EC4899" stopOpacity="0.25" />
              <stop offset="80%" stopColor="#6366F1" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>

            {/* Back Mountain Ridge */}
            <linearGradient id={`ridgeBack-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B2668" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#171233" stopOpacity="0.95" />
            </linearGradient>

            {/* Front Mountain Ridge */}
            <linearGradient id={`ridgeFront-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#25164E" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0D0920" stopOpacity="1" />
            </linearGradient>

            {/* Bottom Wave Fog Blend */}
            <linearGradient id={`waveFog-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0D0920" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#07080E" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* 1. Sky Base */}
          <rect width="400" height="240" fill={`url(#skyGradient-${variant})`} />

          {/* 2. Celestial Stars */}
          <circle cx="28" cy="22" r="1" fill="#FFFFFF" opacity="0.85" />
          <circle cx="85" cy="40" r="1.3" fill="#FDE047" opacity="0.9" />
          <circle cx="140" cy="18" r="0.9" fill="#FFFFFF" opacity="0.7" />
          <circle cx="210" cy="35" r="1.4" fill="#E0E7FF" opacity="0.85" />
          <circle cx="280" cy="20" r="1" fill="#FFFFFF" opacity="0.8" />
          <circle cx="340" cy="38" r="1.2" fill="#FDE047" opacity="0.75" />
          <circle cx="380" cy="15" r="0.8" fill="#FFFFFF" opacity="0.6" />
          <circle cx="60" cy="70" r="0.8" fill="#FFFFFF" opacity="0.5" />
          <circle cx="320" cy="65" r="1" fill="#FFFFFF" opacity="0.5" />

          {/* 3. Horizon Atmosphere Glow */}
          <rect width="400" height="240" fill={`url(#horizonGlow-${variant})`} />

          {/* 4. Distant Mountain Silhouette */}
          <path
            d="M0 160 L35 125 L90 145 L150 98 L210 138 L275 88 L345 132 L400 105 L400 240 L0 240 Z"
            fill={`url(#ridgeBack-${variant})`}
            opacity="0.7"
          />

          {/* 5. Midground Mountain Silhouette */}
          <path
            d="M0 175 L60 135 L120 165 L190 120 L260 160 L330 115 L400 155 L400 240 L0 240 Z"
            fill={`url(#ridgeFront-${variant})`}
            opacity="0.85"
          />

          {/* 6. Foreground Organic Curved Waves */}
          <path
            d="M0 185 C90 160 170 205 260 175 C320 155 365 170 400 165 L400 240 L0 240 Z"
            fill={`url(#waveFog-${variant})`}
          />
          <path
            d="M0 205 C110 185 200 220 300 195 C350 185 380 190 400 188 L400 240 L0 240 Z"
            fill="#090B14"
            opacity="0.9"
          />
        </svg>

        {/* Ambient Top & Bottom Glow Filters */}
        <div className="absolute -top-16 left-1/4 w-96 h-36 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-16 w-72 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Content Overlaid on Scenery ── */}
      <div className="relative z-10 p-4 sm:p-6 md:p-7">
        {children}
      </div>
    </div>
  );
}

WavyHeroScenery.propTypes = {
  variant: PropTypes.oneOf(['dashboard', 'profile']),
  className: PropTypes.string,
  children: PropTypes.ReactNode,
};
