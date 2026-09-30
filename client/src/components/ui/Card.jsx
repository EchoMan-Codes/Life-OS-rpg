import clsx from 'clsx';
import PropTypes from 'prop-types';

/**
 * Universal Card component for LifeOS.
 * Supports Light-first crisp porcelain/alabaster surfaces and Dark Obsidian glass surfaces,
 * plus optional semantic color variants (indigo, teal, emerald, amber, peach, violet, rose, coral, sky).
 *
 * @param {object} props
 * @param {'default'|'hud'|'minimal'} [props.variant='default']
 * @param {'indigo'|'teal'|'emerald'|'amber'|'peach'|'violet'|'rose'|'coral'|'sky'} [props.color]
 * @param {boolean} [props.interactive=false]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export function Card({
  variant = 'default',
  color,
  interactive = false,
  className,
  children,
  ...props
}) {
  const baseVariants = {
    default: clsx(
      'bg-white/90 border border-slate-200/80 text-slate-800',
      'dark:bg-obsidian-900/65 dark:border-white/[0.10] dark:text-ink',
      'backdrop-blur-2xl rounded-3xl',
      'shadow-[0_8px_30px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)]',
      'dark:shadow-[0_8px_32px_rgba(0,0,0,0.37),inset_0_1px_0_rgba(255,255,255,0.12)]'
    ),
    hud: clsx(
      'bg-white/95 border border-slate-300/80 text-slate-800',
      'dark:bg-obsidian-900/80 dark:border-white/[0.16] dark:text-ink',
      'backdrop-blur-3xl rounded-3xl',
      'shadow-[0_12px_40px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.03)]',
      'dark:shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.2)]'
    ),
    minimal: clsx(
      'bg-white/60 border border-slate-200/60 text-slate-700',
      'dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-ink-muted',
      'backdrop-blur-xl rounded-2xl',
      'shadow-[0_4px_20px_rgba(0,0,0,0.03)]',
      'dark:shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.08)]'
    ),
  };

  const colorClass = color ? `color-card color-card-${color}` : '';

  return (
    <div
      className={clsx(
        colorClass || baseVariants[variant] || baseVariants.default,
        interactive &&
          'hover:shadow-md hover:border-slate-300 dark:hover:border-white/25 active:scale-[0.985] transition-all duration-200 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

Card.propTypes = {
  variant: PropTypes.oneOf(['default', 'hud', 'minimal']),
  color: PropTypes.oneOf([
    'indigo',
    'teal',
    'emerald',
    'amber',
    'peach',
    'violet',
    'rose',
    'coral',
    'sky',
  ]),
  interactive: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};
