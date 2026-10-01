import PropTypes from 'prop-types';

/**
 * OnboardingBanner
 * Renders atmospheric illustrated scene artwork with wavy curves for each
 * of the 5 Onboarding steps matching the reference image:
 * Step 1: Mountain Summit with Flagpole in golden sunset twilight
 * Step 2: Glowing neon cyber-city & learning towers
 * Step 3: Daylight & nocturnal sky with sun, moon, and commitments
 * Step 4: Atmospheric evening rooftop with solitary hero facing challenges
 * Step 5: Floating radiant AI Core with orbital connection nodes
 */
export function OnboardingBanner({ stepIndex = 1 }) {
  if (stepIndex === 1) {
    // Step 1: Mountain Summit with Victory Flag
    return (
      <div className="w-full h-36 sm:h-44 rounded-3xl overflow-hidden relative shadow-lg border border-purple-500/25 bg-gradient-to-b from-[#1E113A] via-[#2A1654] to-[#0D071E]">
        <svg viewBox="0 0 360 160" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="skyGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E0836" />
              <stop offset="45%" stopColor="#581C87" />
              <stop offset="75%" stopColor="#C084FC" />
              <stop offset="90%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#FEF08A" />
            </linearGradient>

            <linearGradient id="mtnGradHero" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2E1065" />
              <stop offset="100%" stopColor="#0B061A" />
            </linearGradient>

            <radialGradient id="summitGlow" cx="44%" cy="40%" r="45%">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#F472B6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#581C87" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sky background */}
          <rect width="360" height="160" fill="url(#skyGrad1)" />

          {/* Distant stars */}
          <circle cx="45" cy="22" r="1" fill="#FFFFFF" opacity="0.8" />
          <circle cx="95" cy="35" r="1.3" fill="#FDE047" opacity="0.9" />
          <circle cx="270" cy="25" r="1.1" fill="#FFFFFF" opacity="0.75" />
          <circle cx="320" cy="42" r="1" fill="#FFFFFF" opacity="0.6" />

          {/* Radiant Summit Dawn Glow */}
          <ellipse cx="155" cy="65" rx="100" ry="60" fill="url(#summitGlow)" />

          {/* Distant Ridge Silhouettes */}
          <path d="M0 160 L40 105 L95 130 L160 70 L240 120 L300 85 L360 115 L360 160 Z" fill="#3B1261" opacity="0.6" />
          <path d="M0 160 L55 120 L120 145 L180 95 L260 140 L340 100 L360 125 L360 160 Z" fill="#200B3B" opacity="0.8" />

          {/* Main Hero Mountain Peak with Flagpole */}
          <path d="M50 160 L155 45 L260 160 Z" fill="url(#mtnGradHero)" />
          {/* Flagpole & Fluttering Victory Flag */}
          <line x1="155" y1="45" x2="155" y2="24" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M155 24 L180 32 L155 40 Z" fill="#F43F5E" />

          {/* Atmospheric Mist & Curved Transition */}
          <path d="M0 135 C100 115, 190 145, 280 125 C320 115, 345 125, 360 120 L360 160 L0 160 Z" fill="#0D071E" opacity="0.95" />
        </svg>
      </div>
    );
  }

  if (stepIndex === 2) {
    // Step 2: Glowing Neon Cyber-Cityscape & Academy Towers
    return (
      <div className="w-full h-36 sm:h-44 rounded-3xl overflow-hidden relative shadow-lg border border-indigo-500/25 bg-gradient-to-b from-[#0F172A] via-[#1E1B4B] to-[#0A071B]">
        <svg viewBox="0 0 360 160" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="skyGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="50%" stopColor="#4338CA" />
              <stop offset="85%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
          </defs>

          <rect width="360" height="160" fill="url(#skyGrad2)" />

          {/* Neon Skyline Towers */}
          <rect x="40" y="75" width="35" height="85" rx="3" fill="#0F172A" opacity="0.85" />
          <rect x="85" y="55" width="45" height="105" rx="3" fill="#1E1B4B" />
          <rect x="140" y="40" width="55" height="120" rx="4" fill="#312E81" />
          <rect x="205" y="65" width="45" height="95" rx="3" fill="#1E1B4B" />
          <rect x="260" y="80" width="50" height="80" rx="3" fill="#0F172A" opacity="0.85" />

          {/* Illuminated Glowing Windows & Spire Beacons */}
          <circle cx="160" cy="58" r="3" fill="#FDE047" opacity="0.9" />
          <circle cx="175" cy="58" r="3" fill="#38BDF8" opacity="0.9" />
          <circle cx="160" cy="75" r="3" fill="#38BDF8" opacity="0.9" />
          <circle cx="175" cy="75" r="3" fill="#FDE047" opacity="0.9" />
          <circle cx="105" cy="72" r="2.5" fill="#A855F7" opacity="0.9" />
          <circle cx="225" cy="80" r="2.5" fill="#34D399" opacity="0.9" />

          {/* Floating Neon Cyber Arcs */}
          <path d="M60 120 Q160 85 280 120" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.7" />

          {/* Organic Curved Base */}
          <path d="M0 135 C100 120, 200 145, 300 125 C340 120, 355 125, 360 122 L360 160 L0 160 Z" fill="#0A071B" opacity="0.95" />
        </svg>
      </div>
    );
  }

  if (stepIndex === 3) {
    // Step 3: Panoramic Daylight & Nocturnal Routine Horizon
    return (
      <div className="w-full h-36 sm:h-44 rounded-3xl overflow-hidden relative shadow-lg border border-amber-500/25 bg-gradient-to-b from-[#1C1917] via-[#292524] to-[#0C0A09]">
        <svg viewBox="0 0 360 160" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="skyGrad3" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#EC4899" stopOpacity="0.7" />
              <stop offset="75%" stopColor="#7C3AED" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          <rect width="360" height="160" fill="url(#skyGrad3)" />

          {/* Sun on Sunrise Left */}
          <circle cx="75" cy="52" r="24" fill="#FEF08A" opacity="0.9" filter="drop-shadow(0 0 16px #F59E0B)" />
          {/* Crescent Moon on Nightfall Right */}
          <circle cx="285" cy="52" r="18" fill="#E2E8F0" opacity="0.95" filter="drop-shadow(0 0 12px #38BDF8)" />
          <circle cx="292" cy="49" r="15" fill="#1E1B4B" />

          {/* Timeline Architecture & Routine Anchors */}
          <path d="M0 160 L45 120 L95 120 L135 95 L180 135 L225 105 L275 125 L360 95 L360 160 Z" fill="#0C0A09" opacity="0.95" />
        </svg>
      </div>
    );
  }

  if (stepIndex === 4) {
    // Step 4: Contemplative Hero on Rooftop Gazing at Stars & Challenges
    return (
      <div className="w-full h-36 sm:h-44 rounded-3xl overflow-hidden relative shadow-lg border border-rose-500/25 bg-gradient-to-b from-[#2A0815] via-[#3B0764] to-[#0A0518]">
        <svg viewBox="0 0 360 160" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="skyGrad4" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E11D48" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#6B21A8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0B091B" />
            </linearGradient>
          </defs>

          <rect width="360" height="160" fill="url(#skyGrad4)" />

          {/* Distant Constellation of Obstacles */}
          <circle cx="180" cy="40" r="14" fill="#F43F5E" opacity="0.5" filter="blur(8px)" />
          <rect x="70" y="55" width="30" height="105" rx="3" fill="#030712" opacity="0.9" />
          <rect x="120" y="40" width="35" height="120" rx="3" fill="#0F172A" />
          <rect x="235" y="45" width="35" height="115" rx="3" fill="#0F172A" />

          {/* Rooftop with Seated Hero Silhouette */}
          <path d="M165 95 L225 95 L230 160 L160 160 Z" fill="#090514" />
          {/* Seated hero */}
          <circle cx="185" cy="85" r="4.5" fill="#C084FC" />
          <path d="M180 90 L190 90 L192 105 L182 105 Z" fill="#C084FC" />

          {/* Organic Wave Floor */}
          <path d="M0 135 C100 120, 200 145, 300 125 C340 120, 355 125, 360 122 L360 160 L0 160 Z" fill="#0A0518" opacity="0.95" />
        </svg>
      </div>
    );
  }

  // Step 5: Floating Radiant AI Core & Interconnected Systems
  return (
    <div className="w-full h-36 sm:h-44 rounded-3xl overflow-hidden relative shadow-lg border border-cyan-500/25 bg-gradient-to-b from-[#042F2E] via-[#083344] to-[#020617]">
      <svg viewBox="0 0 360 160" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="skyGrad5" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.75" />
            <stop offset="45%" stopColor="#3B82F6" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
        </defs>

        <rect width="360" height="160" fill="url(#skyGrad5)" />

        {/* Central Luminous AI Sphere Core */}
        <circle cx="180" cy="65" r="30" fill="#06B6D4" opacity="0.3" filter="blur(14px)" />
        <circle cx="180" cy="65" r="15" fill="#22D3EE" opacity="0.9" filter="drop-shadow(0 0 10px #38BDF8)" />

        {/* Orbiting Satellite Data Nodes */}
        <ellipse cx="180" cy="65" rx="60" ry="24" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 3" fill="none" opacity="0.7" />
        <circle cx="120" cy="65" r="5" fill="#F472B6" />
        <circle cx="240" cy="65" r="5" fill="#A855F7" />
        <circle cx="180" cy="41" r="4" fill="#FDE047" />

        {/* Organic Base */}
        <path d="M0 135 C100 120, 200 145, 300 125 C340 120, 355 125, 360 122 L360 160 L0 160 Z" fill="#020617" />
      </svg>
    </div>
  );
}

OnboardingBanner.propTypes = {
  stepIndex: PropTypes.number,
};
