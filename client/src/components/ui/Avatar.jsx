import clsx from 'clsx';
import PropTypes from 'prop-types';

/**
 * Canonical LifeOS Avatar component with optional RPG progression ring.
 */
export function Avatar({
  src,
  name = 'Hero',
  size = 'md',
  level,
  progress = 0, // 0 to 100
  showProgressionRing = false,
  className,
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const sizeDimensions = {
    sm: { box: 'w-8 h-8 text-xs', stroke: 2, radius: 14, circumference: 88 },
    md: { box: 'w-10 h-10 text-sm', stroke: 2.5, radius: 18, circumference: 113 },
    lg: { box: 'w-12 h-12 text-base', stroke: 3, radius: 22, circumference: 138 },
    xl: { box: 'w-16 h-16 text-lg', stroke: 3.5, radius: 30, circumference: 188 },
  };

  const dim = sizeDimensions[size] || sizeDimensions.md;
  const strokeDashoffset = dim.circumference - (progress / 100) * dim.circumference;

  return (
    <div className={clsx('relative inline-flex items-center justify-center shrink-0', className)}>
      {/* Optional SVG Progression Ring */}
      {showProgressionRing && (
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
          viewBox="0 0 100 100"
        >
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="6"
          />
          {/* Progress fill */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#avatarProgressGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={283}
            strokeDashoffset={283 - (progress / 100) * 283}
            className="transition-all duration-300"
          />
          <defs>
            <linearGradient id="avatarProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* Avatar Container */}
      <div
        className={clsx(
          'relative rounded-full overflow-hidden flex items-center justify-center font-display font-semibold select-none',
          'bg-obsidian-800 border border-glass-border-strong text-ink shadow-elevation-subtle',
          showProgressionRing && 'p-1',
          dim.box
        )}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover rounded-full" />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Level Badge Overlay */}
      {typeof level === 'number' && (
        <div className="absolute -bottom-1 -right-1 z-10 px-1.5 py-0.2 rounded-chip bg-obsidian-950 border border-gold text-[10px] font-mono font-bold text-gold shadow-glow">
          {level}
        </div>
      )}
    </div>
  );
}

Avatar.propTypes = {
  src: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  level: PropTypes.number,
  progress: PropTypes.number,
  showProgressionRing: PropTypes.bool,
  className: PropTypes.string,
};
