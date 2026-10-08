import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import PropTypes from 'prop-types';

/**
 * Universal Card component for LifeOS with strict Visual Depth Hierarchy (Levels 1–3).
 * Supports standard glass surfaces, elevated cards, interactive lift, highlighted accents,
 * feature showcase cards, compact list rows, and semantic color variants.
 *
 * @param {object} props
 * @param {'default'|'elevated'|'interactive'|'highlighted'|'feature'|'compact'|'hud'|'minimal'} [props.variant='default']
 * @param {'indigo'|'teal'|'emerald'|'amber'|'peach'|'violet'|'rose'|'coral'|'sky'} [props.color]
 * @param {boolean} [props.interactive=false]
 * @param {boolean} [props.asMotion=false]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export const Card = forwardRef(function Card(
  {
    variant = 'default',
    color,
    interactive = false,
    asMotion = false,
    className,
    children,
    ...props
  },
  ref
) {
  const baseVariants = {
    // Depth Level 1: Standard quiet glass surface
    default: clsx(
      'bg-white/45 border border-white/60 text-slate-800',
      'dark:bg-white/[0.04] dark:border-white/12 dark:text-ink',
      'backdrop-blur-2xl rounded-3xl',
      'shadow-[0_8px_30px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)]',
      'dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.12)]'
    ),
    // Depth Level 2: Elevated card with top-edge hairline highlight & deeper ambient shadow
    elevated: clsx(
      'bg-white/60 border border-white/70 text-slate-900',
      'dark:bg-white/[0.06] dark:border-white/15 dark:text-ink',
      'backdrop-blur-2xl rounded-3xl',
      'shadow-[0_12px_40px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)]',
      'dark:shadow-[0_14px_44px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.18)]'
    ),
    // Depth Level 2-3: Interactive surface with hover lift & shadow bloom
    interactive: clsx(
      'bg-white/50 border border-white/65 text-slate-900',
      'dark:bg-white/[0.045] dark:border-white/12 dark:text-ink',
      'backdrop-blur-2xl rounded-3xl',
      'shadow-[0_8px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
      'hover:shadow-[0_16px_40px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)]',
      'dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.22)]',
      'hover:border-white/90 dark:hover:border-white/25 dark:hover:bg-white/[0.08]',
      'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985]',
      'transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1) cursor-pointer'
    ),
    // Depth Level 3: Highlighted surface with soft accent tint
    highlighted: clsx(
      'bg-white/60 border border-indigo-200/80 text-slate-950',
      'dark:bg-indigo-500/[0.08] dark:border-indigo-500/30 dark:text-ink',
      'backdrop-blur-3xl rounded-3xl',
      'shadow-[0_12px_36px_rgba(99,102,241,0.08),inset_0_1px_1px_rgba(255,255,255,0.85)]',
      'dark:shadow-[0_12px_40px_rgba(99,102,241,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)]'
    ),
    // Depth Level 3: Feature showcase card with gradient border sheen
    feature: clsx(
      'bg-white/65 border border-white/80 text-slate-900',
      'dark:bg-white/[0.065] dark:border-white/18 dark:text-ink',
      'backdrop-blur-3xl rounded-3xl',
      'shadow-[0_16px_48px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)]',
      'dark:shadow-[0_20px_56px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.22)]'
    ),
    // Depth Level 1: Compact list row with tight padding
    compact: clsx(
      'bg-white/45 border border-white/60 text-slate-800 p-2.5 sm:p-3',
      'dark:bg-white/[0.035] dark:border-white/10 dark:text-ink',
      'backdrop-blur-xl rounded-2xl shadow-xs'
    ),
    // Depth Level 2: Persistent HUD cockpit style
    hud: clsx(
      'bg-white/60 border border-white/70 text-slate-800',
      'dark:bg-white/[0.06] dark:border-white/15 dark:text-ink',
      'backdrop-blur-3xl rounded-3xl',
      'shadow-[0_12px_40px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.03)]',
      'dark:shadow-[0_12px_40px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)]'
    ),
    // Depth Level 1: Minimal quiet container
    minimal: clsx(
      'bg-white/35 border border-white/50 text-slate-700',
      'dark:bg-white/[0.025] dark:border-white/[0.08] dark:text-ink-muted',
      'backdrop-blur-xl rounded-2xl',
      'shadow-[0_4px_20px_rgba(0,0,0,0.03)]',
      'dark:shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.08)]'
    ),
  };

  const colorClass = color ? `color-card color-card-${color}` : '';
  const isInteractive = interactive || variant === 'interactive';

  const classes = clsx(
    colorClass || baseVariants[variant] || baseVariants.default,
    isInteractive &&
      variant !== 'interactive' &&
      'hover:shadow-md hover:border-slate-300 dark:hover:border-white/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] transition-all duration-200 cursor-pointer',
    className
  );

  if (asMotion) {
    return (
      <motion.div ref={ref} className={classes} {...props}>
        {children}
      </motion.div>
    );
  }

  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
});

Card.propTypes = {
  variant: PropTypes.oneOf([
    'default',
    'elevated',
    'interactive',
    'highlighted',
    'feature',
    'compact',
    'hud',
    'minimal',
  ]),
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
  asMotion: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};
