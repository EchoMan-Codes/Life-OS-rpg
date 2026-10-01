import PropTypes from 'prop-types';

/**
 * Atmospheric Scene Banner for each of the 5 Onboarding Steps.
 * Faithfully matches the top artwork in Image 3's bottom row:
 * Step 1: Mountain Peak with Summit Flag
 * Step 2: Illuminated Learning Cityscape
 * Step 3: Daylight / Nocturnal Clock Architecture
 * Step 4: Overcoming Obstacles Skyline
 * Step 5: Cyberpunk AI Core & Companions
 */
export function OnboardingBanner({ stepIndex = 1 }) {
  if (stepIndex === 1) {
    // Step 1: Mountain Summit with Flag
    return (
      <div className="w-full h-36 sm:h-44 rounded-3xl overflow-hidden relative shadow-lg border border-purple-500/20 bg-gradient-to-b from-[#1E113A] via-[#2D1B69] to-[#0D071E]">
        <svg viewBox="0 0 360 160" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="skyGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B0764" />
              <stop offset="50%" stopColor="#7E22CE" />
              <stop offset="85%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#FDE047" />
            </linearGradient>
            <linearGradient id="mtnGradA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="100%" stopColor="#0B091A" />
            </linearGradient>
          </defs>
          <rect width="360" height="160" fill="url(#skyGrad1)" opacity="0.8" />
          {/* Distant Peaks */}
          <path d="M0 160 L50 95 L110 135 L180 60 L260 125 L320 85 L360 110 L360 160 Z" fill="#312E81" opacity="0.6" />
          {/* Main Hero Summit with Flag */}
          <path d="M40 160 L140 50 L240 160 Z" fill="url(#mtnGradA)" />
          {/* Flagpole & Glowing Flag on Summit */}
          <line x1="140" y1="50" x2="140" y2="28" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" />
          <path d="M140 28 L160 35 L140 42 Z" fill="#F43F5E" />
          {/* Cloud Mist */}
          <ellipse cx="140" cy="115" rx="160" ry="30" fill="#F472B6" opacity="0.3" filter="blur(8px)" />
        </svg>
      </div>
    );
  }

  if (stepIndex === 2) {
    // Step 2: Learning Cityscape & Towers
    return (
      <div className="w-full h-36 sm:h-44 rounded-3xl overflow-hidden relative shadow-lg border border-indigo-500/20 bg-gradient-to-b from-[#0F172A] via-[#1E1B4B] to-[#0A071B]">
        <svg viewBox="0 0 360 160" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="skyGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="60%" stopColor="#4338CA" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
          </defs>
          <rect width="360" height="160" fill="url(#skyGrad2)" opacity="0.85" />
          {/* City Silhouettes */}
          <rect x="50" y="80" width="35" height="80" fill="#0F172A" opacity="0.8" />
          <rect x="95" y="60" width="45" height="100" fill="#1E1B4B" />
          <rect x="150" y="45" width="55" height="115" fill="#312E81" />
          <rect x="215" y="70" width="40" height="90" fill="#1E1B4B" />
          <rect x="265" y="90" width="50" height="70" fill="#0F172A" opacity="0.8" />
          {/* Glowing Windows */}
          <circle cx="170" cy="65" r="3" fill="#FDE047" opacity="0.9" />
          <circle cx="185" cy="65" r="3" fill="#38BDF8" opacity="0.9" />
          <circle cx="170" cy="85" r="3" fill="#38BDF8" opacity="0.9" />
          <circle cx="185" cy="85" r="3" fill="#FDE047" opacity="0.9" />
          <circle cx="115" cy="78" r="2.5" fill="#A855F7" opacity="0.9" />
          {/* Atmospheric Mist */}
          <ellipse cx="180" cy="140" rx="180" ry="25" fill="#C084FC" opacity="0.25" />
        </svg>
      </div>
    );
  }

  if (stepIndex === 3) {
    // Step 3: Daily Routine Clock & Day-Night Architecture
    return (
      <div className="w-full h-36 sm:h-44 rounded-3xl overflow-hidden relative shadow-lg border border-amber-500/20 bg-gradient-to-b from-[#1C1917] via-[#292524] to-[#0C0A09]">
        <svg viewBox="0 0 360 160" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="skyGrad3" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <rect width="360" height="160" fill="url(#skyGrad3)" />
          {/* Sun on Left */}
          <circle cx="70" cy="55" r="22" fill="#FEF08A" opacity="0.85" filter="drop-shadow(0 0 12px #F59E0B)" />
          {/* Moon on Right */}
          <circle cx="290" cy="55" r="18" fill="#E2E8F0" opacity="0.9" filter="drop-shadow(0 0 10px #38BDF8)" />
          <circle cx="296" cy="52" r="15" fill="#1E1B4B" />
          {/* Architectural Skyline */}
          <path d="M0 160 L40 120 L90 120 L130 90 L180 140 L230 100 L280 130 L360 90 L360 160 Z" fill="#0C0A09" opacity="0.9" />
        </svg>
      </div>
    );
  }

  if (stepIndex === 4) {
    // Step 4: Challenges & Obstacles to Break Through
    return (
      <div className="w-full h-36 sm:h-44 rounded-3xl overflow-hidden relative shadow-lg border border-rose-500/20 bg-gradient-to-b from-[#2A0815] via-[#3B0764] to-[#0A0518]">
        <svg viewBox="0 0 360 160" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="skyGrad4" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E11D48" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#6B21A8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>
          <rect width="360" height="160" fill="url(#skyGrad4)" />
          {/* Towering Monoliths Representing Friction */}
          <rect x="70" y="45" width="30" height="115" rx="4" fill="#030712" opacity="0.9" />
          <rect x="120" y="30" width="35" height="130" rx="4" fill="#0F172A" />
          <rect x="175" y="20" width="40" height="140" rx="4" fill="#1E1B4B" />
          <rect x="235" y="40" width="35" height="120" rx="4" fill="#0F172A" />
          {/* Luminous Glow of Victory breaking through */}
          <circle cx="195" cy="50" r="16" fill="#F43F5E" opacity="0.6" filter="blur(10px)" />
        </svg>
      </div>
    );
  }

  // Step 5: Cyberpunk AI Core & Personal Assistant
  return (
    <div className="w-full h-36 sm:h-44 rounded-3xl overflow-hidden relative shadow-lg border border-cyan-500/20 bg-gradient-to-b from-[#042F2E] via-[#083344] to-[#020617]">
      <svg viewBox="0 0 360 160" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="skyGrad5" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
        </defs>
        <rect width="360" height="160" fill="url(#skyGrad5)" />
        {/* Glowing Neural Network Node in Center */}
        <circle cx="180" cy="65" r="28" fill="#06B6D4" opacity="0.25" filter="blur(12px)" />
        <circle cx="180" cy="65" r="14" fill="#22D3EE" opacity="0.8" />
        {/* Connection Arcs */}
        <line x1="80" y1="90" x2="180" y2="65" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
        <line x1="280" y1="90" x2="180" y2="65" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
        <circle cx="80" cy="90" r="6" fill="#A855F7" />
        <circle cx="280" cy="90" r="6" fill="#F43F5E" />
        {/* Silhouette Base */}
        <path d="M0 160 L90 120 L180 135 L270 120 L360 160 Z" fill="#020617" />
      </svg>
    </div>
  );
}

OnboardingBanner.propTypes = {
  stepIndex: PropTypes.number,
};
