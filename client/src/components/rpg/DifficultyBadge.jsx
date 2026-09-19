import PropTypes from 'prop-types';
import clsx from 'clsx';
import { getDifficultyTier } from '@/lib/progressionTiers';

/**
 * DifficultyBadge — Holographic bracketed pill for quest difficulty / rank.
 * e.g. [ RANK S ] or [ HIGH ]
 */
export function DifficultyBadge({ difficulty = 'low', showRank = false, size = 'sm', className = '' }) {
  const tier = getDifficultyTier(difficulty);

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[9px]',
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const displayText = showRank ? tier.rank : tier.label;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border font-mono font-bold tracking-widest uppercase select-none backdrop-blur-md',
        tier.bgBadge,
        sizeClasses[size] || sizeClasses.sm,
        className
      )}
    >
      <span className="opacity-60">[</span>
      <span>{displayText}</span>
      <span className="opacity-60">]</span>
    </span>
  );
}

DifficultyBadge.propTypes = {
  difficulty: PropTypes.string,
  showRank: PropTypes.bool,
  size: PropTypes.oneOf(['xs', 'sm', 'md']),
  className: PropTypes.string,
};
