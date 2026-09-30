import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import PropTypes from 'prop-types';

/**
 * HabitMomentumRibbon — Unique connected 7-day habit momentum chain.
 * Replaces generic boxes with an interactive weekly streak wave and real-time telemetry.
 */
export function HabitMomentumRibbon({ habits = [], bestOverallStreak = 0, totalCompletions = 0 }) {
  const weekDays = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayIdx = new Date().getDay();

    // Map 7 days with status
    return days.map((d, idx) => {
      const isToday = idx === todayIdx;
      const isPast = idx < todayIdx;
      // If there are habits with positiveCount or streak, show energetic node
      const hasActivity = habits.some((h) => (h.currentStreak || 0) > 0);

      return {
        name: d,
        isToday,
        isPast,
        isActive: isToday ? hasActivity : (isPast && hasActivity),
      };
    });
  }, [habits]);

  return (
    <section className="relative rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-white via-amber-50/30 to-white dark:from-obsidian-900/90 dark:via-obsidian-900/60 dark:to-obsidian-800/80 border border-slate-200/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-2xl overflow-hidden">
      {/* Energy hairline */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 opacity-70" />

      {/* Ribbon Header bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-slate-800 dark:text-ink">
            Weekly Momentum Wave
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hidden sm:inline">
            Streak Synchronizer
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-600 dark:text-gold">
          <Flame size={14} className="fill-current" />
          <span>{bestOverallStreak}d Peak Streak</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* 7-Day Connected Chain Horizon (7 cols) */}
        <div className="md:col-span-7 relative">
          <div className="text-[10px] font-mono text-slate-500 dark:text-ink-muted mb-2 flex items-center justify-between">
            <span>DISCIPLINE TIMELINE</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">Today: Active Wave</span>
          </div>

          {/* Connected track line */}
          <div className="relative flex items-center justify-between px-2 pt-1 pb-2">
            <div className="absolute left-6 right-6 top-[22px] h-[2px] bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-amber-500/30 pointer-events-none" />

            {weekDays.map((day) => (
              <div key={day.name} className="relative z-10 flex flex-col items-center">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all text-xs font-bold font-mono shadow-xs',
                    day.isToday
                      ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-[0_0_14px_rgba(245,158,11,0.5)] scale-110'
                      : day.isActive
                      ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-400/80 text-amber-700 dark:text-amber-300'
                      : 'bg-white dark:bg-obsidian-800 border-slate-300 dark:border-white/20 text-slate-400 dark:text-ink-muted'
                  )}
                >
                  {day.name[0]}
                </div>
                <span
                  className={clsx(
                    'text-[10px] font-mono mt-1.5 transition-colors',
                    day.isToday
                      ? 'font-bold text-amber-700 dark:text-amber-400 underline underline-offset-2'
                      : 'text-slate-500 dark:text-ink-muted'
                  )}
                >
                  {day.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Telemetry Stats Dock (5 cols) */}
        <div className="md:col-span-5 grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-ink-muted block">
              Total Positive Reps
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <Zap size={14} className="text-amber-500 fill-amber-500" />
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-ink">
                {totalCompletions}
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">XP compounding</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-ink-muted block">
              Active Disciplines
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <ShieldCheck size={14} className="text-indigo-500" />
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-ink">
                {habits.length}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-ink-muted font-medium">Swipe ±80px to score</span>
          </div>
        </div>
      </div>
    </section>
  );
}

HabitMomentumRibbon.propTypes = {
  habits: PropTypes.array,
  bestOverallStreak: PropTypes.number,
  totalCompletions: PropTypes.number,
};
