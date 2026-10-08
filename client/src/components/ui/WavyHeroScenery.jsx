import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import { useTheme } from '@/lib/theme';

/**
 * WavyHeroScenery
 * Reusable LifeOS Wavy Hero Visual component with organic curved waves,
 * mountain silhouettes, atmospheric lighting, and smooth theme adaptation.
 * Used across Dashboard, Profile, Onboarding, and Auth.
 */
export function WavyHeroScenery({
  variant = 'dashboard', // 'dashboard' | 'profile' | 'auth'
  className = '',
  children,
}) {
  const { isDark } = useTheme();

  return (
    <div
      className={clsx(
        'relative rounded-3xl overflow-hidden transition-all duration-500',
        isDark
          ? 'bg-[#0C0F1D]/80 backdrop-blur-2xl text-white border border-white/12 shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)]'
          : 'bg-gradient-to-b from-[#F0F7FF] via-[#F8FAFC] to-[#EFF4FA] text-slate-900 border border-indigo-200/70 shadow-[0_16px_44px_rgba(99,102,241,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)]',
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
            {/* ── DARK MODE GRADIENTS ── */}
            <linearGradient id={`skyDark-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0B091B" />
              <stop offset="35%" stopColor="#1B1745" />
              <stop offset="70%" stopColor="#311F5E" />
              <stop offset="90%" stopColor="#4A1D6D" />
              <stop offset="100%" stopColor="#160E33" />
            </linearGradient>

            <radialGradient id={`horizonGlowDark-${variant}`} cx="50%" cy="58%" r="55%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
              <stop offset="40%" stopColor="#EC4899" stopOpacity="0.25" />
              <stop offset="80%" stopColor="#6366F1" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>

            <linearGradient id={`ridgeBackDark-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B2668" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#171233" stopOpacity="0.95" />
            </linearGradient>

            <linearGradient id={`ridgeFrontDark-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#25164E" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0D0920" stopOpacity="1" />
            </linearGradient>

            <linearGradient id={`waveDark-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0D0920" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#07080E" stopOpacity="0.98" />
            </linearGradient>

            {/* ── LIGHT MODE GRADIENTS ── */}
            <linearGradient id={`skyLight-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="30%" stopColor="#E8EDFD" />
              <stop offset="65%" stopColor="#DDD6FE" />
              <stop offset="90%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>

            <radialGradient id={`sunLightGlow-${variant}`} cx="52%" cy="46%" r="50%">
              <stop offset="0%" stopColor="#FDE047" stopOpacity="0.7" />
              <stop offset="30%" stopColor="#F59E0B" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#C084FC" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#EFF6FF" stopOpacity="0" />
            </radialGradient>

            <linearGradient id={`ridgeBackLight-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#C7D2FE" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id={`ridgeFrontLight-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#E0E7FF" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id={`waveLight-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EEF2F6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* ══════════ DARK MODE SCENE ══════════ */}
          <g className="transition-opacity duration-700" opacity={isDark ? 1 : 0}>
            {/* Sky */}
            <rect width="400" height="240" fill={`url(#skyDark-${variant})`} />

            {/* Stars */}
            <circle cx="28" cy="22" r="1.1" fill="#FFFFFF" opacity="0.85" />
            <circle cx="85" cy="40" r="1.3" fill="#FDE047" opacity="0.9" />
            <circle cx="140" cy="18" r="0.9" fill="#FFFFFF" opacity="0.7" />
            <circle cx="210" cy="35" r="1.4" fill="#E0E7FF" opacity="0.85" />
            <circle cx="280" cy="20" r="1.1" fill="#FFFFFF" opacity="0.8" />
            <circle cx="340" cy="38" r="1.3" fill="#FDE047" opacity="0.75" />
            <circle cx="380" cy="15" r="0.8" fill="#FFFFFF" opacity="0.6" />
            <circle cx="60" cy="70" r="0.8" fill="#FFFFFF" opacity="0.5" />
            <circle cx="320" cy="65" r="1" fill="#FFFFFF" opacity="0.5" />

            {/* Dark Horizon Glow */}
            <rect width="400" height="240" fill={`url(#horizonGlowDark-${variant})`} />

            {/* Distant Mountain Ridge */}
            <path
              d="M0 160 L35 125 L90 145 L150 98 L210 138 L275 88 L345 132 L400 105 L400 240 L0 240 Z"
              fill={`url(#ridgeBackDark-${variant})`}
              opacity="0.7"
            />

            {/* Midground Mountain Ridge */}
            <path
              d="M0 175 L60 135 L120 165 L190 120 L260 160 L330 115 L400 155 L400 240 L0 240 Z"
              fill={`url(#ridgeFrontDark-${variant})`}
              opacity="0.85"
            />

            {/* Foreground Organic Waves */}
            <path
              d="M0 185 C90 160 170 205 260 175 C320 155 365 170 400 165 L400 240 L0 240 Z"
              fill={`url(#waveDark-${variant})`}
            />
            <path
              d="M0 205 C110 185 200 220 300 195 C350 185 380 190 400 188 L400 240 L0 240 Z"
              fill="#090B14"
              opacity="0.9"
            />
          </g>

          {/* ══════════ LIGHT MODE SCENE ══════════ */}
          <g className="transition-opacity duration-700" opacity={isDark ? 0 : 1}>
            {/* Light Sky */}
            <rect width="400" height="240" fill={`url(#skyLight-${variant})`} />

            {/* Radiant Sun Disc & Horizon Halo */}
            <circle cx="210" cy="80" r="32" fill="#FEF08A" opacity="0.65" filter="drop-shadow(0 0 16px #F59E0B)" />
            <rect width="400" height="240" fill={`url(#sunLightGlow-${variant})`} />

            {/* Soft Morning Mist Clouds */}
            <path
              d="M30 65 Q70 50 110 65 Q140 75 180 65 Q220 55 260 65 Q280 75 320 65 L400 75 L400 120 L0 120 Z"
              fill="#FFFFFF"
              opacity="0.45"
            />

            {/* Alpine Distant Snow-dusted Peaks */}
            <path
              d="M0 160 L35 125 L90 145 L150 98 L210 138 L275 88 L345 132 L400 105 L400 240 L0 240 Z"
              fill={`url(#ridgeBackLight-${variant})`}
              opacity="0.6"
            />

            {/* Alpine Midground Lavender Peaks */}
            <path
              d="M0 175 L60 135 L120 165 L190 120 L260 160 L330 115 L400 155 L400 240 L0 240 Z"
              fill={`url(#ridgeFrontLight-${variant})`}
              opacity="0.75"
            />

            {/* Soft Rolling Valley Waves */}
            <path
              d="M0 185 C90 160 170 205 260 175 C320 155 365 170 400 165 L400 240 L0 240 Z"
              fill={`url(#waveLight-${variant})`}
            />
            <path
              d="M0 205 C110 185 200 220 300 195 C350 185 380 190 400 188 L400 240 L0 240 Z"
              fill="#F8FAFC"
              opacity="0.95"
            />
          </g>
        </svg>

        {/* Ambient Top & Bottom Glow Filters */}
        <div
          className={clsx(
            'absolute -top-16 left-1/4 w-96 h-36 rounded-full blur-3xl pointer-events-none transition-colors duration-500',
            isDark ? 'bg-purple-500/15' : 'bg-amber-400/20'
          )}
        />
        <div
          className={clsx(
            'absolute top-1/3 -right-16 w-72 h-48 rounded-full blur-3xl pointer-events-none transition-colors duration-500',
            isDark ? 'bg-amber-500/15' : 'bg-indigo-400/15'
          )}
        />
      </div>

      {/* ── Content Overlaid on Scenery ── */}
      <div className="relative z-10 p-4 sm:p-6 md:p-7">
        {children}
      </div>
    </div>
  );
}

WavyHeroScenery.propTypes = {
  variant: PropTypes.oneOf(['dashboard', 'profile', 'auth']),
  className: PropTypes.string,
  children: PropTypes.ReactNode,
};
