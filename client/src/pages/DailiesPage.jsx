import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, Plus, Sparkles, CheckCircle2, Clock, Zap, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

import { useDailies } from '@/features/dailies/hooks';
import { DailyCard, DailyModal, DailiesOrbitRibbon } from '@/components/dailies';
import { spring } from '@/lib/motionVariants';

const FILTERS = [
  { id: 'all', label: 'All Dailies' },
  { id: 'due', label: 'Due Today' },
  { id: 'completed', label: 'Conquered' },
  { id: 'pending', label: 'Pending' },
];

export default function DailiesPage() {
  const { data: dailies = [], isLoading, isError } = useDailies();
  const [activeFilter, setActiveFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [dailyToEdit, setDailyToEdit] = useState(null);

  const currentWeekday = new Date().getDay();

  // Filtered dailies
  const filteredDailies = useMemo(() => {
    return dailies.filter((d) => {
      const isDue = (d.activeDays || [0, 1, 2, 3, 4, 5, 6]).includes(currentWeekday);
      const isDone = Boolean(d.isCompleteToday);

      if (activeFilter === 'due') return isDue;
      if (activeFilter === 'completed') return isDone;
      if (activeFilter === 'pending') return isDue && !isDone;
      return true;
    });
  }, [dailies, activeFilter, currentWeekday]);

  // Statistics
  const dueCount = useMemo(() => {
    return dailies.filter((d) => (d.activeDays || [0, 1, 2, 3, 4, 5, 6]).includes(currentWeekday)).length;
  }, [dailies, currentWeekday]);

  const completedCount = useMemo(() => {
    return dailies.filter((d) => Boolean(d.isCompleteToday)).length;
  }, [dailies]);

  const bestOverallStreak = useMemo(() => {
    if (!dailies.length) return 0;
    return Math.max(...dailies.map((d) => d.streakBest || 0), 0);
  }, [dailies]);

  const completionPercent = dueCount > 0 ? Math.round((completedCount / dueCount) * 100) : 100;

  const handleOpenCreate = () => {
    setDailyToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (daily) => {
    setDailyToEdit(daily);
    setModalOpen(true);
  };

  const todayFormatted = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* ── 1. Glassy Cockpit Header (Emerald Vitality Theme) ── */}
      <section className="relative rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-white via-emerald-50/40 to-slate-50 border border-slate-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:from-obsidian-900/85 dark:via-obsidian-900/65 dark:to-obsidian-800/75 dark:border-white/15 dark:shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl overflow-hidden">
        {/* Ambient emerald & jade glow */}
        <div className="absolute -top-24 -left-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-semibold">
              <Clock size={13} className="animate-spin text-emerald-500" style={{ animationDuration: '8s' }} />
              <span>{todayFormatted.toUpperCase()} • RESETS AT 00:00</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-ink tracking-tight font-display">
              Daily Rituals & Vows
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-ink-muted leading-relaxed max-w-xl">
              Essential commitments refreshed each day. Conquering dailies safeguards your HP and awards consistent Gold & XP. Incomplete rituals risk daily damage.
            </p>
          </div>

          <motion.button
            type="button"
            onClick={handleOpenCreate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={spring.snappy}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs sm:text-sm hover:from-emerald-400 hover:to-teal-300 transition-all shadow-[0_8px_24px_rgba(16,185,129,0.25)] self-start sm:self-auto min-h-[46px]"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Daily</span>
          </motion.button>
        </div>
      </section>

      {/* ── 2. Unique Connected Daily Conquest Orbit Ribbon ── */}
      <DailiesOrbitRibbon
        dueCount={dueCount}
        completedCount={completedCount}
        bestOverallStreak={bestOverallStreak}
        completionPercent={completionPercent}
        totalDailies={dailies.length}
      />

      {/* ── 3. iOS Frosted Segmented Filter Capsule ── */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="p-1 rounded-full bg-slate-100/90 dark:bg-obsidian-900/80 border border-slate-200/90 dark:border-white/10 shadow-inner backdrop-blur-md flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={clsx(
                  'px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-ink-muted dark:hover:text-ink hover:bg-slate-200/60 dark:hover:bg-white/5'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-mono text-slate-400 dark:text-ink-faint hidden sm:inline">
          Showing {filteredDailies.length} of {dailies.length} rituals
        </span>
      </div>

      {/* ── 4. Dailies List / Empty State ── */}
      {isLoading ? (
        <div className="py-20 text-center text-ink-muted text-sm animate-pulse space-y-2">
          <CalendarCheck size={28} className="mx-auto text-emerald-500 animate-bounce" />
          <p>Consulting daily ritual chronicles...</p>
        </div>
      ) : isError ? (
        <div className="p-6 text-center text-red-400 text-sm rounded-2xl bg-red-500/10 border border-red-500/20">
          Failed to load daily rituals. Please verify your connection.
        </div>
      ) : filteredDailies.length === 0 ? (
        <div className="p-10 sm:p-14 text-center rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-lg space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles size={26} />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-ink">
            {dailies.length === 0 ? 'No Daily Rituals Enrolled' : 'No Rituals Match Filter'}
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted max-w-sm mx-auto leading-relaxed">
            {dailies.length === 0
              ? 'Establish recurring daily rituals to gain XP, secure Gold, and protect your HP from nighttime penalties.'
              : 'Try selecting a different filter tab above to view other daily rituals.'}
          </p>
          {dailies.length === 0 && (
            <motion.button
              type="button"
              onClick={handleOpenCreate}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-obsidian font-bold text-xs hover:bg-emerald-400 transition-all shadow-md inline-flex items-center gap-1.5"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Create First Daily</span>
            </motion.button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence initial={false}>
            {filteredDailies.map((daily) => (
              <motion.div
                key={daily.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={spring.ios}
              >
                <DailyCard daily={daily} onEdit={handleOpenEdit} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Daily Creation & Edit Modal */}
      <DailyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        dailyToEdit={dailyToEdit}
      />
    </div>
  );
}
