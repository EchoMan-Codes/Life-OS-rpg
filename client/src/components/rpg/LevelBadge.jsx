import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Shield } from 'lucide-react';
import { getLevelTier } from '@/lib/progressionTiers';

/**
 * LevelBadge — RPG player level badge with dynamic tier styling and Roman numerals.
 */
export function LevelBadge({ level = 1, size = 'md', className = '' }) {
  const tier = getLevelTier(level);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm',
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg border font-mono font-bold tracking-wider select-none backdrop-blur-md',
        tier.bgBadge,
        tier.borderGlow,
        sizeClasses[size] || sizeClasses.md,
        className
      )}
      title={`Level ${level} • ${tier.name} Tier ${tier.roman}`}
    >
      <Shield size={size === 'sm' ? 11 : 13} className="shrink-0 text-current" />
      <span className="text-white font-extrabold">LV.{level}</span>
      <span className="opacity-40 font-normal">•</span>
      <span className="uppercase text-[10px] tracking-widest font-semibold">{tier.name} {tier.roman}</span>
    </div>
  );
}

LevelBadge.propTypes = {
  level: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};
