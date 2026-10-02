import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

/**
 * Official Jeevan Logo Component.
 * Supports multiple responsive variants:
 * - 'emblem': The signature glowing 'J' mark (ideal for app icon, compact sidebar, avatar HUD, mobile)
 * - 'full': The complete official Jeevan master artwork with horizon and emblem
 * - 'lockup': Emblem paired with crisp typographic 'JEEVAN' wordmark and optional tagline
 * - 'wordmark': Elegant stylized typography
 *
 * Theme-aware:
 * Automatically provides refined jewel framing and ambient glow across both light and dark modes.
 */
export function JeevanLogo({
  variant = 'lockup',
  size = 'md',
  showTagline = false,
  animated = false,
  className = '',
  onClick,
}) {
  const shouldReduceMotion = useReducedMotion();

  // Size mapping for emblem dimensions
  const sizeMap = {
    xs: { emblem: 'w-6 h-6', img: 'w-6 h-6', text: 'text-sm', sub: 'text-[9px]', gap: 'gap-2' },
    sm: { emblem: 'w-8 h-8', img: 'w-8 h-8', text: 'text-base font-bold', sub: 'text-[10px]', gap: 'gap-2.5' },
    md: { emblem: 'w-10 h-10', img: 'w-10 h-10', text: 'text-lg font-extrabold', sub: 'text-[11px]', gap: 'gap-3' },
    lg: { emblem: 'w-14 h-14', img: 'w-14 h-14', text: 'text-2xl font-black', sub: 'text-xs', gap: 'gap-3.5' },
    xl: { emblem: 'w-20 h-20', img: 'w-20 h-20', text: 'text-3xl font-black', sub: 'text-xs', gap: 'gap-4' },
    hero: { emblem: 'w-28 h-28 sm:w-36 sm:h-36', img: 'w-28 h-28 sm:w-36 sm:h-36', text: 'text-3xl sm:text-4xl font-black', sub: 'text-sm', gap: 'gap-4' },
  };

  const config = sizeMap[size] || sizeMap.md;

  // Emblem image inside an ultra-refined, theme-aware jewel container
  const renderEmblem = () => {
    const emblemInner = (
      <div
        className={clsx(
          'relative flex items-center justify-center rounded-2xl overflow-hidden shrink-0 select-none',
          'transition-all duration-300',
          'bg-[#08090D] border border-amber-400/25 shadow-[0_2px_12px_rgba(0,0,0,0.4)]',
          'dark:border-white/15 dark:shadow-[0_0_20px_rgba(56,189,248,0.15)]',
          config.emblem
        )}
      >
        {/* Soft background ambient gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/60 via-slate-950 to-black pointer-events-none" />

        {/* Ambient back-glow pulse */}
        <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-amber-400/20 blur-md pointer-events-none opacity-80" />

        {/* Official Jeevan Emblem */}
        <img
          src="/branding/jeevan-emblem.png"
          alt="Jeevan Emblem"
          className={clsx(
            'relative z-10 w-full h-full object-contain p-0.5 filter contrast-105 transition-transform duration-300',
            animated && !shouldReduceMotion && 'hover:scale-105'
          )}
          loading="eager"
        />

        {/* Subtle glass reflection highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none rounded-2xl" />
      </div>
    );

    if (animated && !shouldReduceMotion) {
      return (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {emblemInner}
        </motion.div>
      );
    }

    return emblemInner;
  };

  // Full artwork with the original canvas (emblem + horizon + glowing typography)
  if (variant === 'full') {
    return (
      <div
        onClick={onClick}
        className={clsx(
          'relative flex flex-col items-center justify-center select-none',
          onClick && 'cursor-pointer',
          className
        )}
      >
        <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-[#07080C] max-w-full">
          {/* Ambient atmosphere */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          <img
            src="/branding/jeevan-logo.png"
            alt="Jeevan"
            className={clsx('relative z-10 w-full h-auto object-contain', config.img)}
            loading="eager"
          />
        </div>
        {showTagline && (
          <p className="mt-2 text-xs font-medium tracking-widest uppercase text-slate-500 dark:text-ink-muted">
            Live. Track. Grow.
          </p>
        )}
      </div>
    );
  }

  // Emblem only (ideal for small viewports, icons, toolbars)
  if (variant === 'emblem') {
    return (
      <div
        onClick={onClick}
        className={clsx('inline-flex items-center justify-center', onClick && 'cursor-pointer', className)}
      >
        {renderEmblem()}
      </div>
    );
  }

  // Wordmark only
  if (variant === 'wordmark') {
    return (
      <div
        onClick={onClick}
        className={clsx('inline-flex flex-col', onClick && 'cursor-pointer', className)}
      >
        <span
          className={clsx(
            'tracking-wider font-display uppercase font-black text-slate-900 dark:text-white',
            config.text
          )}
          style={{ letterSpacing: '0.12em' }}
        >
          Jeevan
        </span>
        {showTagline && (
          <span className={clsx('tracking-widest uppercase font-mono text-slate-400 dark:text-ink-muted', config.sub)}>
            Live. Track. Grow.
          </span>
        )}
      </div>
    );
  }

  // Default: Lockup (Emblem + JEEVAN typography)
  return (
    <div
      onClick={onClick}
      className={clsx(
        'inline-flex items-center',
        config.gap,
        onClick && 'cursor-pointer group',
        className
      )}
    >
      {renderEmblem()}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={clsx(
              'tracking-wider font-display uppercase font-black truncate',
              'text-slate-900 dark:text-white transition-colors duration-200',
              'group-hover:text-amber-500 dark:group-hover:text-amber-300',
              config.text
            )}
            style={{ letterSpacing: '0.1em' }}
          >
            Jeevan
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
        </div>
        {showTagline ? (
          <span
            className={clsx(
              'tracking-widest uppercase font-mono font-medium truncate',
              'text-slate-500 dark:text-ink-muted',
              config.sub
            )}
          >
            Live. Track. Grow.
          </span>
        ) : (
          <span
            className={clsx(
              'tracking-wider font-mono uppercase text-[10px] truncate',
              'text-slate-500 dark:text-ink-muted/80'
            )}
          >
            Life OS
          </span>
        )}
      </div>
    </div>
  );
}

JeevanLogo.propTypes = {
  variant: PropTypes.oneOf(['full', 'emblem', 'lockup', 'wordmark']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', 'hero']),
  showTagline: PropTypes.bool,
  animated: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default JeevanLogo;
