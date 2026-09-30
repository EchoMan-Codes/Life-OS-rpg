import PropTypes from 'prop-types';

/**
 * Minimalist abstract vector illustrations for Onboarding Selection Option Cards.
 * Inspired by Reference 1's organic, artistic silhouettes while adhering strictly
 * to LifeOS's Dark Obsidian + subtle accent line aesthetic.
 */
export function CardMotif({ type, color = '#A78BFA' }) {
  switch (type) {
    case 'cognitive':
      return (
        <svg viewBox="0 0 100 80" fill="none" className="w-20 h-16 shrink-0 opacity-80">
          <ellipse cx="60" cy="40" rx="32" ry="24" fill={color} fillOpacity="0.08" />
          <path
            d="M 45 45 C 40 35, 55 25, 65 30 C 75 35, 70 50, 60 55 C 50 60, 48 50, 45 45 Z"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <circle cx="65" cy="30" r="3" fill={color} />
          <circle cx="45" cy="45" r="2.5" fill="white" fillOpacity="0.8" />
          <circle cx="60" cy="55" r="2" fill={color} fillOpacity="0.6" />
          <line x1="45" y1="45" x2="65" y2="30" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
          <line x1="65" y1="30" x2="60" y2="55" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        </svg>
      );

    case 'vitality':
      return (
        <svg viewBox="0 0 100 80" fill="none" className="w-20 h-16 shrink-0 opacity-80">
          <path
            d="M 30 50 Q 55 20, 80 40 Q 65 70, 30 50 Z"
            fill={color}
            fillOpacity="0.08"
          />
          <path
            d="M 35 48 C 45 35, 65 30, 75 42"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 40 54 L 50 54 L 55 40 L 62 60 L 68 48 L 75 48"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.8"
          />
        </svg>
      );

    case 'grit':
      return (
        <svg viewBox="0 0 100 80" fill="none" className="w-20 h-16 shrink-0 opacity-80">
          <polygon points="60,20 80,35 75,60 60,68 45,60 40,35" fill={color} fillOpacity="0.08" />
          <path
            d="M 60 25 L 75 36 L 70 56 L 60 62 L 50 56 L 45 36 Z"
            stroke={color}
            strokeWidth="1.5"
          />
          <path d="M 60 30 L 60 55" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" />
          <path d="M 52 42 L 68 42" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" />
        </svg>
      );

    case 'execution':
      return (
        <svg viewBox="0 0 100 80" fill="none" className="w-20 h-16 shrink-0 opacity-80">
          <path d="M 40 60 L 60 20 L 55 42 L 75 36 L 50 68 L 56 48 Z" fill={color} fillOpacity="0.12" />
          <path
            d="M 45 56 L 62 24 L 56 42 L 74 38 L 52 64 L 57 48 Z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'harmony':
      return (
        <svg viewBox="0 0 100 80" fill="none" className="w-20 h-16 shrink-0 opacity-80">
          <circle cx="60" cy="40" r="26" fill={color} fillOpacity="0.06" />
          <path
            d="M 40 40 C 40 28, 60 28, 60 40 C 60 52, 80 52, 80 40"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="50" cy="34" r="3" fill="white" fillOpacity="0.7" />
          <circle cx="70" cy="46" r="3" fill={color} />
        </svg>
      );

    case 'initiate':
      return (
        <svg viewBox="0 0 100 80" fill="none" className="w-20 h-16 shrink-0 opacity-80">
          <circle cx="60" cy="40" r="24" fill={color} fillOpacity="0.08" />
          <path d="M 48 52 L 60 30 L 72 52 Z" stroke={color} strokeWidth="1.5" fill="none" />
          <circle cx="60" cy="42" r="3" fill="white" fillOpacity="0.8" />
        </svg>
      );

    case 'skilled':
      return (
        <svg viewBox="0 0 100 80" fill="none" className="w-20 h-16 shrink-0 opacity-80">
          <rect x="42" y="24" width="36" height="36" rx="10" transform="rotate(45 60 42)" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1.5" />
          <circle cx="60" cy="42" r="4" fill="white" fillOpacity="0.9" />
          <line x1="60" y1="28" x2="60" y2="56" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        </svg>
      );

    case 'master':
      return (
        <svg viewBox="0 0 100 80" fill="none" className="w-20 h-16 shrink-0 opacity-80">
          <circle cx="60" cy="40" r="28" fill={color} fillOpacity="0.1" />
          <circle cx="60" cy="40" r="18" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" />
          <polygon points="60,26 64,36 74,36 66,42 69,52 60,46 51,52 54,42 46,36 56,36" fill="white" fillOpacity="0.85" />
        </svg>
      );

    default:
      return null;
  }
}

CardMotif.propTypes = {
  type: PropTypes.string,
  color: PropTypes.string,
};
