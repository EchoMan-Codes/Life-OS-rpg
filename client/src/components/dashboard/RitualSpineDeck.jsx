import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CalendarCheck, Check, Circle, CheckCircle2, Flame, ArrowRight, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { spring } from '@/lib/motionVariants';
import { useCompleteDaily } from '@/features/dailies/hooks';
import { triggerHaptic } from '@/lib/native';

/**
 * Editorial single ritual waypoint item along the connected vertical spine.
 */
function RitualWayointRow({ daily, isLast }) {
  const completeMutation = useCompleteDaily(daily.id, daily);
  const isPending = completeMutation.isPending;

  const handleToggle = () => {
    if (!daily.isCompleteToday && !isPending) {
      triggerHaptic('medium');
      completeMutation.mutate();
    }
  };

  return (
    <div className="relative pl-7 sm:pl-8 group">
      {/* Node connector on the spine */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.85 }}
        onClick={handleToggle}
        disabled={daily.isCompleteToday || isPending}
        className={clsx(
          'absolute left-0 top-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 shadow-xs cursor-pointer',
          daily.isCompleteToday
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
            : 'bg-white dark:bg-obsidian-900 border-slate-300 dark:border-white/30 text-transparent hover:border-emerald-500 group-hover:scale-110'
        )}
        title={daily.isCompleteToday ? 'Conquered' : 'Conquer Daily'}
      >
        {daily.isCompleteToday ? (
          <Check size={12} className="stroke-[3]" />
        ) : (
          <Circle size={8} className="text-slate-300 dark:text-white/20 group-hover:text-emerald-500" />
        )}
      </motion.button>

      {/* Row surface */}
      <motion.div
        whileTap={{ scale: 0.99 }}
        onClick={handleToggle}
        className={clsx(
          'p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer min-h-[50px] flex items-center justify-between gap-3',
          'border',
          daily.isCompleteToday
            ? 'bg-emerald-50/50 dark:bg-white/[0.02] border-emerald-200/60 dark:border-white/5 opacity-70'
            : 'bg-white/70 dark:bg-white/[0.03] border-slate-200/70 dark:border-white/10 hover:bg-white dark:hover:bg-white/[0.07] hover:border-emerald-300 dark:hover:border-white/20 shadow-xs'
        )}
      >
        <div className="min-w-0 flex-1">
          <p
            className={clsx(
              'text-xs sm:text-sm font-semibold truncate transition-all',
              daily.isCompleteToday
                ? 'line-through text-slate-400 dark:text-ink-muted'
                : 'text-slate-900 dark:text-ink'
            )}
          >
            {daily.title}
          </p>

          <div className="flex items-center gap-2 mt-1">
            <span
              className={clsx(
                'text-[9px] sm:text-[10px] font-mono uppercase tracking-wider px-2 py-0.2 rounded-full border',
                daily.difficulty === 'hard'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-hp'
                  : daily.difficulty === 'medium'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-gold'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-attr-vitality'
              )}
            >
              {daily.difficulty || 'easy'}
            </span>

            {daily.currentStreak > 0 && (
              <span className="text-[10px] text-amber-600 dark:text-gold font-mono flex items-center gap-0.5 font-semibold">
                <Flame size={11} className="fill-current" /> {daily.currentStreak}d streak
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          {daily.isCompleteToday ? (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle2 size={13} /> Conquered
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 dark:text-ink-muted group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-mono font-bold transition-colors">
              +XP
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}

RitualWayointRow.propTypes = {
  daily: PropTypes.object.isRequired,
  isLast: PropTypes.bool,
};

/**
 * RitualSpineDeck — Unique connected waypoint spine for Dailies.
 * Instead of wrapping everything in heavy boxy cards, it weaves the dailies
 * into a fluid vertical timeline alongside an integrated circular conquest ring.
 */
export function RitualSpineDeck({ activeDailies = [], completedTodayCount = 0, dailiesRate = 0, totalFocusMinutes = 0 }) {
  return (
    <section className="relative rounded-3xl p-4 sm:p-6 bg-white/45 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200/70 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
            <CalendarCheck size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold font-display text-slate-900 dark:text-ink">
              Daily Ritual Waypoints
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-ink-muted">
              Synchronized discipline spine • tap nodes to conquer
            </p>
          </div>
        </div>

        <Link
          to="/dailies"
          className="text-xs text-indigo-600 dark:text-attr-perception hover:underline font-semibold flex items-center gap-1"
        >
          <span>Manage Vows</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Connected Waypoint Spine (7 cols on lg) */}
        <div className="lg:col-span-7 relative">
          {activeDailies.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-ink-muted text-xs">
              <CalendarCheck size={28} className="mx-auto mb-2 text-emerald-500 opacity-40" />
              <p className="font-semibold text-slate-800 dark:text-ink">No daily rituals configured</p>
              <Link to="/dailies" className="text-emerald-600 dark:text-emerald-400 underline mt-1 inline-block">
                + Inscribe your first daily vow
              </Link>
            </div>
          ) : (
            <div className="relative space-y-3">
              {/* Continuous glowing vertical filament */}
              <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-emerald-500 via-teal-400 to-indigo-500 opacity-30 dark:opacity-40 rounded-full pointer-events-none" />

              {activeDailies.map((daily, idx) => (
                <RitualWayointRow
                  key={daily.id}
                  daily={daily}
                  isLast={idx === activeDailies.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Integrated Astrolabe Ring & Cognitive Telemetry (5 cols on lg) */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 pb-2.5 mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-700 dark:text-ink flex items-center gap-1.5">
              <Sparkles size={12} className="text-emerald-500" />
              Conquest Resonance
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-ink-muted">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Central Ring Gauge */}
          <div className="my-2 flex items-center justify-around gap-4">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
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
                  stroke="url(#deck-conquest-gradient)"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - dailiesRate / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - dailiesRate / 100) }}
                  transition={spring.gentle}
                />
                <defs>
                  <linearGradient id="deck-conquest-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black font-display text-slate-900 dark:text-ink tracking-tight">
                  {dailiesRate}%
                </span>
                <span className="text-[8px] uppercase tracking-widest text-slate-500 dark:text-ink-muted font-mono font-semibold">
                  Cleared
                </span>
              </div>
            </div>

            <div className="space-y-2 min-w-0 flex-1">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-ink-muted">Daily Vows</span>
                <p className="text-sm font-bold font-mono text-slate-900 dark:text-ink">
                  {completedTodayCount} <span className="text-[11px] text-slate-400">/ {activeDailies.length}</span>
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-ink-muted">Cognitive Stamina</span>
                <p className="text-sm font-bold font-mono text-slate-900 dark:text-ink">
                  {totalFocusMinutes}m <span className="text-[11px] text-slate-400">Logged</span>
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2.5 mt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-ink-muted truncate">
              {dailiesRate === 100 ? 'All vows completed!' : `${activeDailies.length - completedTodayCount} left today`}
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
              +{completedTodayCount * 15} XP
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

RitualSpineDeck.propTypes = {
  activeDailies: PropTypes.array,
  completedTodayCount: PropTypes.number,
  dailiesRate: PropTypes.number,
  totalFocusMinutes: PropTypes.number,
};
