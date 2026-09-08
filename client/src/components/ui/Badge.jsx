import clsx from 'clsx';

/**
 * Color mapping for badge tints.
 */
const colorMap = {
  strength: 'bg-attr-strength/15 text-attr-strength',
  intelligence: 'bg-attr-intelligence/15 text-attr-intelligence',
  vitality: 'bg-attr-vitality/15 text-attr-vitality',
  willpower: 'bg-attr-willpower/15 text-attr-willpower',
  perception: 'bg-attr-perception/15 text-attr-perception',
  hp: 'bg-hp/15 text-hp',
  mana: 'bg-mana/15 text-mana',
  xp: 'bg-xp/15 text-xp',
  gold: 'bg-gold/15 text-gold',
  default: 'bg-glass text-ink-muted',
};

/**
 * Small pill-shaped label/badge.
 *
 * @param {object} props
 * @param {string} [props.color='default'] - Token color name (attribute or stat)
 * @param {string} [props.className] - Additional classes
 * @param {React.ReactNode} props.children
 */
export function Badge({ color = 'default', className, children, ...props }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5',
        'rounded-chip text-xs font-medium',
        colorMap[color] || colorMap.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
