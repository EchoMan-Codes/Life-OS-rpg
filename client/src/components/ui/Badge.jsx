import clsx from 'clsx';
import PropTypes from 'prop-types';

/**
 * Color mapping for badge tints matching semantic and attribute tokens.
 */
const colorMap = {
  // 5 RPG Attributes
  strength: 'bg-attr-strength/15 border border-attr-strength/30 text-attr-strength',
  intelligence: 'bg-attr-intelligence/15 border border-attr-intelligence/30 text-attr-intelligence',
  vitality: 'bg-attr-vitality/15 border border-attr-vitality/30 text-attr-vitality',
  willpower: 'bg-attr-willpower/15 border border-attr-willpower/30 text-attr-willpower',
  perception: 'bg-attr-perception/15 border border-attr-perception/30 text-attr-perception',

  // Gameplay & Stats
  hp: 'bg-hp/15 border border-hp/30 text-hp',
  mana: 'bg-mana/15 border border-mana/30 text-mana',
  xp: 'bg-xp/15 border border-xp/30 text-xp',
  gold: 'bg-gold/15 border border-gold/30 text-gold',
  streak: 'bg-streak/15 border border-streak/30 text-streak',
  quest: 'bg-quest/15 border border-quest/30 text-quest',

  // Semantic Status
  success: 'bg-success/15 border border-success/30 text-success',
  danger: 'bg-danger/15 border border-danger/30 text-danger',
  warning: 'bg-warning/15 border border-warning/30 text-warning',
  focus: 'bg-focus/15 border border-focus/30 text-focus',
  default: 'bg-glass border border-glass-border text-ink-muted',
};

/**
 * Canonical LifeOS Badge component.
 *
 * @param {object} props
 * @param {string} [props.color='default'] - Token color name (attribute, stat, or status)
 * @param {'sm'|'md'} [props.size='sm'] - Visual badge size
 * @param {string} [props.className] - Additional classes
 * @param {React.ReactNode} props.children
 */
export function Badge({ color = 'default', size = 'sm', className, children, ...props }) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1',
        'rounded-chip font-medium select-none',
        sizeClasses[size] || sizeClasses.sm,
        colorMap[color] || colorMap.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

Badge.propTypes = {
  color: PropTypes.oneOf([
    'strength',
    'intelligence',
    'vitality',
    'willpower',
    'perception',
    'hp',
    'mana',
    'xp',
    'gold',
    'streak',
    'quest',
    'success',
    'danger',
    'warning',
    'focus',
    'default',
  ]),
  size: PropTypes.oneOf(['sm', 'md']),
  className: PropTypes.string,
  children: PropTypes.node,
};
