import { motion } from 'framer-motion';
import { CalendarCheck, CheckCircle2, Clock, Flame, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { spring } from '@/lib/motionVariants';

/**
 * DailiesOrbitRibbon — Unique non-card telemetry ribbon for Dailies.
 * Displays real-time circular completion arc, reset countdown, and daily discipline telemetry.
 */
export function DailiesOrbitRibbon({
  dueCount = 0,
  completedCount = 0,
  bestOverallStreak = 0,
  completionPercent = 0,
  totalDailies = 0,
}) {
  const remaining = Math.max(0, dueCount - completedCount);

  return (
    <section className="relative rounded-3xl p-4 sm:p-5 bg-white/45 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl overflow-hidden">
      {/* Dynamic emerald hairline */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 opacity-70" />

      {/* Header telemetry bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-slate-800 dark:text-ink">
            Daily Ritual Pipeline
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hidden sm:inline">
            Active Cycle
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
          <Clock size={13} className="text-emerald-500 animate-spin" style={{ animationDuration: '10s' }} />
          <span>Resets at 00:00</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left: Interactive Circular Conquest Arc (6 cols) */}
        <div className="md:col-span-6 flex items-center gap-4 sm:gap-6">
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-24 h-24 sm:w-26 sm:h-26 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-200 dark:stroke-obsidian-800"
                strokeWidth="8"
                fill="transparent"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#dailies-orbit-gradient)"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - completionPercent / 100)}
                strokeLinecap="round"
                fill="transparent"
                initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - completionPercent / 100) }}
                transition={spring.gentle}
              />
              <defs>
                <linearGradient id="dailies-orbit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#14B8A6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-ink tracking-tight">
                {completionPercent}%
              </span>
              <span className="text-[8px] uppercase tracking-widest text-slate-500 dark:text-ink-muted font-mono font-semibold">
                Cleared
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-ink leading-tight">
              {remaining === 0 ? 'All Vows Conquered!' : `${remaining} Vow${remaining > 1 ? 's' : ''} Remaining`}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-ink-muted leading-relaxed">
              {remaining === 0
                ? 'Your daily discipline shields your HP from midnight decay penalties.'
                : 'Conquer active rituals to earn Gold, XP, and maintain your streak.'}
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              <Sparkles size={12} />
              <span>+{completedCount * 15} XP Banked</span>
            </div>
          </div>
        </div>

        {/* Right: Key Telemetry Metrics (6 cols) */}
        <div className="md:col-span-6 grid grid-cols-3 gap-2 sm:gap-2.5">
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-xs text-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-ink-muted block truncate">
              Due Today
            </span>
            <p className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-ink mt-0.5">
              {dueCount}
            </p>
            <span className="text-[9px] font-mono text-slate-400 block truncate">{totalDailies} total</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-xs text-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-ink-muted block truncate">
              Conquered
            </span>
            <p className="text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
              <CheckCircle2 size={15} />
              <span>{completedCount}</span>
            </p>
            <span className="text-[9px] font-mono text-emerald-600/80 dark:text-emerald-400/80 block truncate">
              {remaining === 0 ? 'All done' : `${remaining} left`}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-xs text-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-ink-muted block truncate">
              Peak Streak
            </span>
            <p className="text-lg sm:text-xl font-black font-mono text-amber-600 dark:text-gold mt-0.5 flex items-center justify-center gap-1">
              <Flame size={15} className="fill-current" />
              <span>{bestOverallStreak}d</span>
            </p>
            <span className="text-[9px] font-mono text-slate-400 block truncate">Days unbroken</span>
          </div>
        </div>
      </div>
    </section>
  );
}

DailiesOrbitRibbon.propTypes = {
  dueCount: PropTypes.number,
  completedCount: PropTypes.number,
  bestOverallStreak: PropTypes.number,
  completionPercent: PropTypes.number,
  totalDailies: PropTypes.number,
};
