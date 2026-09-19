import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import { spring } from '@/lib/motion';

/**
 * TelemetryCard — Dimensional glass telemetry metric card.
 * Features:
 * - Monospace category identifier [ TAG ]
 * - Tabular big numeral with smooth typography
 * - Icon or circular progress indicator
 * - Delta status or contextual subtitle
 * - Subtle hover lift & edge illumination
 */
export function TelemetryCard({
  tag,
  value,
  subtext,
  delta,
  icon: Icon,
  progress = null, // 0 to 100
  accentColor = 'cyan', // 'cyan' | 'blue' | 'purple' | 'amber' | 'emerald'
  className = '',
}) {
  const shouldReduceMotion = useReducedMotion();

  const colorStyles = {
    cyan: {
      text: 'text-cyan-400',
      border: 'border-cyan-500/30 hover:border-cyan-500/50',
      glow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.18)]',
      iconBg: 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40',
      ring: '#22d3ee',
    },
    blue: {
      text: 'text-sky-400',
      border: 'border-sky-500/30 hover:border-sky-500/50',
      glow: 'hover:shadow-[0_0_20px_rgba(14,165,233,0.18)]',
      iconBg: 'bg-sky-950/60 text-sky-400 border-sky-500/40',
      ring: '#38bdf8',
    },
    purple: {
      text: 'text-purple-400',
      border: 'border-purple-500/30 hover:border-purple-500/50',
      glow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.18)]',
      iconBg: 'bg-purple-950/60 text-purple-400 border-purple-500/40',
      ring: '#c084fc',
    },
    amber: {
      text: 'text-amber-400',
      border: 'border-amber-500/30 hover:border-amber-500/50',
      glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.18)]',
      iconBg: 'bg-amber-950/60 text-amber-400 border-amber-500/40',
      ring: '#fbbf24',
    },
    emerald: {
      text: 'text-emerald-400',
      border: 'border-emerald-500/30 hover:border-emerald-500/50',
      glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.18)]',
      iconBg: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40',
      ring: '#34d399',
    },
  };

  const currentStyle = colorStyles[accentColor] || colorStyles.cyan;

  return (
    <motion.div
      whileHover={shouldReduceMotion ? {} : { y: -2, transition: spring.snappy }}
      className={clsx(
        'relative p-4 rounded-xl border bg-obsidian-900/80 backdrop-blur-xl transition-all duration-200 overflow-hidden flex flex-col justify-between',
        currentStyle.border,
        currentStyle.glow,
        className
      )}
    >
      {/* Top Specular Line */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {/* Header Row: Monospace Tag & Icon / Ring */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-[10px] font-bold tracking-widest text-ink-muted uppercase">
          [ {tag} ]
        </span>
        {progress !== null ? (
          // Mini SVG circular progress ring
          <div className="relative w-7 h-7 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="13"
                className="stroke-white/10"
                strokeWidth="2.5"
                fill="none"
              />
              <circle
                cx="16"
                cy="16"
                r="13"
                stroke={currentStyle.ring}
                strokeWidth="2.5"
                strokeDasharray={81.68}
                strokeDashoffset={81.68 - (81.68 * Math.min(100, progress)) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            {Icon && <Icon size={12} className={clsx('absolute', currentStyle.text)} />}
          </div>
        ) : Icon ? (
          <div className={clsx('w-6 h-6 rounded-md border flex items-center justify-center', currentStyle.iconBg)}>
            <Icon size={13} />
          </div>
        ) : null}
      </div>

      {/* Big Tabular Value */}
      <div className="my-0.5">
        <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums">
          {value}
        </span>
      </div>

      {/* Subtext & Delta */}
      <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted mt-1">
        {subtext && <span className="truncate">{subtext}</span>}
        {delta && (
          <span className={clsx('font-semibold shrink-0 ml-1', currentStyle.text)}>
            {delta}
          </span>
        )}
      </div>
    </motion.div>
  );
}

TelemetryCard.propTypes = {
  tag: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  subtext: PropTypes.node,
  delta: PropTypes.node,
  icon: PropTypes.elementType,
  progress: PropTypes.number,
  accentColor: PropTypes.oneOf(['cyan', 'blue', 'purple', 'amber', 'emerald']),
  className: PropTypes.string,
};
