import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { spring } from '@/lib/motionVariants';

const COLOR_ACCENTS = {
  indigo: {
    iconBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
    progress: 'bg-indigo-500',
    link: 'text-indigo-600 dark:text-indigo-400',
  },
  teal: {
    iconBg: 'bg-teal-500/15 border-teal-500/30 text-teal-600 dark:text-teal-400',
    badge: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/25',
    progress: 'bg-teal-500',
    link: 'text-teal-600 dark:text-teal-400',
  },
  emerald: {
    iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
    progress: 'bg-emerald-500',
    link: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25',
    progress: 'bg-amber-500',
    link: 'text-amber-600 dark:text-amber-400',
  },
  peach: {
    iconBg: 'bg-orange-500/15 border-orange-500/30 text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/25',
    progress: 'bg-orange-500',
    link: 'text-orange-600 dark:text-orange-400',
  },
  violet: {
    iconBg: 'bg-violet-500/15 border-violet-500/30 text-violet-600 dark:text-violet-400',
    badge: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/25',
    progress: 'bg-violet-500',
    link: 'text-violet-600 dark:text-violet-400',
  },
  rose: {
    iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25',
    progress: 'bg-rose-500',
    link: 'text-rose-600 dark:text-rose-400',
  },
  coral: {
    iconBg: 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400',
    badge: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/25',
    progress: 'bg-red-500',
    link: 'text-red-600 dark:text-red-400',
  },
  sky: {
    iconBg: 'bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-400',
    badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25',
    progress: 'bg-sky-500',
    link: 'text-sky-600 dark:text-sky-400',
  },
};

/**
 * Reusable ColorCard component following the LifeOS Color Card System.
 * Clean light-first surface with soft tinted palette, subtle border, and vibrant accents.
 */
export function ColorCard({
  color = 'indigo',
  icon: Icon,
  title,
  value,
  subtitle,
  badge,
  progress,
  actionText,
  actionTo,
  onAction,
  className,
  children,
}) {
  const accent = COLOR_ACCENTS[color] || COLOR_ACCENTS.indigo;

  return (
    <div
      className={clsx(
        'color-card',
        `color-card-${color}`,
        'flex flex-col justify-between group',
        className
      )}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div
                className={clsx(
                  'w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs',
                  accent.iconBg
                )}
              >
                <Icon size={17} />
              </div>
            )}
            {title && (
              <span className="text-xs font-bold font-display uppercase tracking-wider opacity-90 truncate">
                {title}
              </span>
            )}
          </div>

          {badge && (
            <span
              className={clsx(
                'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shadow-2xs',
                accent.badge
              )}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Primary Value */}
        {value !== undefined && (
          <div className="my-1.5">
            <span className="text-2xl sm:text-3xl font-black font-display tracking-tight">
              {value}
            </span>
          </div>
        )}

        {/* Subtitle / Supporting text */}
        {subtitle && (
          <p className="text-xs opacity-75 leading-relaxed line-clamp-2 mt-0.5">
            {subtitle}
          </p>
        )}

        {/* Optional Progress Bar */}
        {progress !== undefined && (
          <div className="my-3 space-y-1">
            <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <motion.div
                className={clsx('h-full rounded-full', accent.progress)}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                transition={spring.snappy}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono opacity-60">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        {children}
      </div>

      {/* Action Footer */}
      {(actionText || actionTo || onAction) && (
        <div className="pt-3 mt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs">
          <span className="text-[11px] opacity-65 font-mono">
            {title || 'Action'}
          </span>
          {actionTo ? (
            <Link
              to={actionTo}
              className={clsx(
                'font-bold hover:underline flex items-center gap-0.5 transition-colors',
                accent.link
              )}
            >
              <span>{actionText || 'Open'}</span>
              <ChevronRight size={13} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className={clsx(
                'font-bold hover:underline flex items-center gap-0.5 transition-colors',
                accent.link
              )}
            >
              <span>{actionText || 'Open'}</span>
              <ChevronRight size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

ColorCard.propTypes = {
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
  icon: PropTypes.elementType,
  title: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
  subtitle: PropTypes.string,
  badge: PropTypes.string,
  progress: PropTypes.number,
  actionText: PropTypes.string,
  actionTo: PropTypes.string,
  onAction: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node,
};
