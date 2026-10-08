import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CalendarCheck, Flame, Scroll, Clock, ArrowUpRight, Zap } from 'lucide-react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { spring } from '@/lib/motionVariants';

/**
 * TelemetryHorizonRibbon — Unique non-card progression ribbon.
 * Replaces generic rectangular cards with a continuous, connected RPG telemetry strip.
 * Features an integrated glowing circuit track, illuminated waypoint nodes,
 * large editorial typographic readouts, and responsive interactive stations.
 */
export function TelemetryHorizonRibbon({
  completedTodayCount = 0,
  totalDailiesCount = 0,
  dailiesRate = 0,
  activeHabitsCount = 0,
  bestStreak = 0,
  activeQuestsCount = 0,
  primaryQuestTitle = '',
  totalFocusMinutes = 0,
  activeFocus = null,
}) {
  const stations = [
    {
      id: 'dailies',
      label: 'Daily Rituals',
      badge: dailiesRate === 100 ? 'All Clear' : `${totalDailiesCount - completedTodayCount} left`,
      value: `${completedTodayCount}/${totalDailiesCount}`,
      subtext: `${dailiesRate}% cleared`,
      icon: CalendarCheck,
      color: 'emerald',
      to: '/dailies',
      actionText: 'Conquer',
      pulse: dailiesRate === 100,
      nodeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
      nodeRing: 'ring-emerald-500/20',
      activeText: 'text-emerald-600 dark:text-emerald-400',
      accentDot: 'bg-emerald-500',
    },
    {
      id: 'habits',
      label: 'Habit Momentum',
      badge: bestStreak > 0 ? `${bestStreak}d streak` : 'Ready',
      value: activeHabitsCount,
      subtext: bestStreak > 0 ? `Peak: ${bestStreak} days` : 'Form new habit',
      icon: Flame,
      color: 'amber',
      to: '/habits',
      actionText: 'Score',
      pulse: bestStreak >= 7,
      nodeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400',
      nodeRing: 'ring-amber-500/20',
      activeText: 'text-amber-600 dark:text-amber-400',
      accentDot: 'bg-amber-500',
    },
    {
      id: 'quests',
      label: 'Campaign Log',
      badge: activeQuestsCount > 0 ? `${activeQuestsCount} active` : 'Standing by',
      value: activeQuestsCount,
      subtext: primaryQuestTitle ? primaryQuestTitle : 'Explore bounty',
      icon: Scroll,
      color: 'violet',
      to: '/quests',
      actionText: 'Embark',
      pulse: activeQuestsCount > 0,
      nodeBg: 'bg-violet-500/15 border-violet-500/40 text-violet-600 dark:text-violet-400',
      nodeRing: 'ring-violet-500/20',
      activeText: 'text-violet-600 dark:text-violet-400',
      accentDot: 'bg-violet-500',
    },
    {
      id: 'focus',
      label: 'Deep Focus',
      badge: activeFocus ? 'In Flow' : `+${Math.round(totalFocusMinutes * 1.5)} MP`,
      value: `${totalFocusMinutes}m`,
      subtext: activeFocus ? 'Sprint running' : 'Cognitive sprints',
      icon: Clock,
      color: 'sky',
      to: '/focus',
      actionText: 'Enter',
      pulse: Boolean(activeFocus),
      nodeBg: 'bg-sky-500/15 border-sky-500/40 text-sky-600 dark:text-sky-400',
      nodeRing: 'ring-sky-500/20',
      activeText: 'text-sky-600 dark:text-sky-400',
      accentDot: 'bg-sky-500',
    },
  ];

  return (
    <section className="relative rounded-3xl p-4 sm:p-5 bg-white/45 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl overflow-hidden">
      {/* Dynamic Background Energy Beam */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-amber-500 via-violet-500 to-sky-500 opacity-60 dark:opacity-75" />

      {/* Ribbon Header bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-slate-800 dark:text-ink">
            Today&apos;s Progress
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-ink-muted hidden sm:inline">
            Progression Horizon
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-ink-muted">
          <Zap size={11} className="text-amber-500 fill-amber-500" />
          <span>Synchronized</span>
        </div>
      </div>

      {/* The 4 Interconnected Horizon Stations - Responsive 2x2 on Mobile, 4-col on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 relative z-10">
        {stations.map((st, idx) => {
          const Icon = st.icon;
          return (
            <motion.div
              key={st.id}
              whileHover={{ y: -2 }}
              transition={spring.snappy}
              className={clsx(
                'group relative p-3 sm:p-4 rounded-2xl sm:rounded-3xl transition-all duration-200',
                'bg-white/80 hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.07]',
                'border border-slate-200/80 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20',
                'shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md backdrop-blur-md',
                'flex flex-col justify-between overflow-hidden'
              )}
            >
              {/* Ambient corner glow */}
              <div
                className={clsx(
                  'absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40',
                  st.color === 'emerald' && 'bg-emerald-500',
                  st.color === 'amber' && 'bg-amber-500',
                  st.color === 'violet' && 'bg-violet-500',
                  st.color === 'sky' && 'bg-sky-500'
                )}
              />

              {/* Waypoint Station Node Header */}
              <div className="flex items-center gap-2 mb-2 min-w-0">
                <div
                  className={clsx(
                    'w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-105',
                    st.nodeBg,
                    st.nodeRing
                  )}
                >
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-ink block truncate leading-tight group-hover:text-slate-900 transition-colors">
                    {st.label}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', st.accentDot, st.pulse && 'animate-pulse')} />
                    <span className="text-[10px] font-mono text-slate-500 dark:text-ink-muted truncate">
                      Station 0{idx + 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* Large Editorial Value Readout with Cleanly Positioned Badge */}
              <div className="my-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-ink tracking-tight">
                    {st.value}
                  </span>
                  {st.badge && (
                    <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100/90 dark:bg-white/10 text-slate-600 dark:text-ink border border-slate-200/80 dark:border-white/10 font-semibold shadow-2xs truncate max-w-[85px]">
                      {st.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-ink-muted truncate font-medium mt-0.5">
                  {st.subtext}
                </p>
              </div>

              {/* Action Trigger Pill Button (Styled to match Image 3) */}
              <div className="pt-2 mt-1">
                <Link
                  to={st.to}
                  className={clsx(
                    'w-full py-1.5 px-2.5 rounded-xl flex items-center justify-center gap-1 text-xs font-bold font-mono transition-all',
                    st.color === 'emerald' && 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
                    st.color === 'amber' && 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20',
                    st.color === 'violet' && 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-400 border border-violet-500/20',
                    st.color === 'sky' && 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/20',
                    'active:scale-[0.98]'
                  )}
                >
                  <span>{st.actionText}</span>
                  <ArrowUpRight size={13} className="stroke-[2.5]" />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

TelemetryHorizonRibbon.propTypes = {
  completedTodayCount: PropTypes.number,
  totalDailiesCount: PropTypes.number,
  dailiesRate: PropTypes.number,
  activeHabitsCount: PropTypes.number,
  bestStreak: PropTypes.number,
  activeQuestsCount: PropTypes.number,
  primaryQuestTitle: PropTypes.string,
  totalFocusMinutes: PropTypes.number,
  activeFocus: PropTypes.object,
};
