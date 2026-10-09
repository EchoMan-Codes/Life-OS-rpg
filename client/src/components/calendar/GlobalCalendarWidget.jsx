import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  ExternalLink,
  X,
  Sparkles,
  Layers,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';

import {
  useCalendarEvents,
  useToggleCalendarEventComplete,
  useScheduleTimeBlock,
} from '@/features/calendar/hooks';
import { useTasks } from '@/features/tasks/hooks';
import { spring } from '@/lib/motionVariants';

export const LIFEOS_OPEN_CALENDAR_EVENT = 'lifeos:open-calendar-quick-access';

export function openCalendarQuickAccess() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LIFEOS_OPEN_CALENDAR_EVENT));
  }
}

/**
 * Global Persistent Quick-Access Calendar Widget & Flyout Agenda.
 * Stays accessible across all pages without cluttering primary nav.
 */
export function GlobalCalendarWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [blockDuration, setBlockDuration] = useState(45);
  const [blockTime, setBlockTime] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Listen for global open event and shortcut
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener(LIFEOS_OPEN_CALENDAR_EVENT, handleOpen);
    return () => window.removeEventListener(LIFEOS_OPEN_CALENDAR_EVENT, handleOpen);
  }, []);

  // Compute 24h range for query
  const { rangeStart, rangeEnd } = useMemo(() => {
    const d = new Date(selectedDate);
    const start = new Date(d.setHours(0, 0, 0, 0));
    const end = new Date(d.setHours(23, 59, 59, 999));
    return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
  }, [selectedDate]);

  const { data: events = [], isLoading } = useCalendarEvents({
    startDate: rangeStart,
    endDate: rangeEnd,
  });

  const { data: backlogTasks = [] } = useTasks({ status: 'active' });
  const toggleCompleteMutation = useToggleCalendarEventComplete();
  const scheduleBlockMutation = useScheduleTimeBlock();

  // Selected date label
  const isToday = useMemo(() => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  }, [selectedDate]);

  const dateLabel = useMemo(() => {
    if (isToday) return 'Today';
    return selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [selectedDate, isToday]);

  // Navigate dates
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const handleGoToday = () => {
    setSelectedDate(new Date());
  };

  const handleQuickSchedule = async (e) => {
    e.preventDefault();
    if (!selectedTaskId) return;

    const slot = blockTime ? new Date(blockTime) : new Date();
    await scheduleBlockMutation.mutateAsync({
      taskId: selectedTaskId,
      startTime: slot.toISOString(),
      durationMinutes: Number(blockDuration),
    });

    setScheduleModalOpen(false);
    setSelectedTaskId('');
  };

  // If user is currently on /calendar, hide the floating button so it doesn't duplicate
  const isOnCalendarPage = location.pathname === '/calendar';

  const pendingCount = events.filter((e) => e.status !== 'completed').length;

  return (
    <>
      {/* ── Persistent Floating Trigger Button ── */}
      {!isOnCalendarPage && (
        <div className="fixed bottom-6 right-6 z-40 hidden md:flex items-center">
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={spring.snappy}
            onClick={() => setIsOpen(true)}
            aria-label="Open Quick Calendar"
            title="Quick Calendar & Agenda"
            className={clsx(
              'group flex items-center gap-2.5 px-4 py-2.5 rounded-full',
              'bg-white/90 dark:bg-[#0D1117]/90 text-slate-800 dark:text-ink',
              'border border-slate-200/90 dark:border-white/12',
              'shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)]',
              'backdrop-blur-xl transition-all cursor-pointer'
            )}
          >
            <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <CalendarDays size={15} />
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>Calendar</span>
                {pendingCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                )}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-ink-muted leading-tight font-mono">
                {dateLabel} • {events.length} item{events.length === 1 ? '' : 's'}
              </span>
            </div>
          </motion.button>
        </div>
      )}

      {/* ── Mobile Compact Trigger ── */}
      {!isOnCalendarPage && (
        <div className="fixed bottom-24 right-4 z-30 md:hidden flex items-center pointer-events-auto">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen(true)}
            aria-label="Open Quick Calendar"
            title="Quick Calendar"
            className={clsx(
              'w-11 h-11 rounded-full flex items-center justify-center',
              'bg-white/95 dark:bg-[#0D1117]/95 text-indigo-600 dark:text-indigo-400',
              'border border-slate-200/90 dark:border-white/15',
              'shadow-lg backdrop-blur-xl relative cursor-pointer'
            )}
          >
            <CalendarDays size={18} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] font-mono flex items-center justify-center shadow-xs">
                {pendingCount}
              </span>
            )}
          </motion.button>
        </div>
      )}

      {/* ── Flyout Slide-over Quick Calendar Drawer / Modal ── */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end md:p-4">
            {/* Frosted Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-over Content Card (Cupertino Light aesthetic) */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={spring.snappy}
              className={clsx(
                'relative z-10 w-full sm:max-w-md h-full md:h-[94vh] md:rounded-[32px]',
                'bg-white/95 dark:bg-[#0D1117]/95 backdrop-blur-2xl',
                'border border-slate-200/90 dark:border-white/12',
                'shadow-[-16px_0_48px_rgba(0,0,0,0.15)] dark:shadow-[-16px_0_48px_rgba(0,0,0,0.7)]',
                'flex flex-col overflow-hidden'
              )}
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/20 flex items-center justify-center">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-slate-900 dark:text-ink">
                      Quick Agenda & Scheduling
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-ink-muted">
                      Centralized synchronization across Jeevan
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/calendar');
                    }}
                    title="Open Full Calendar View"
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-ink-muted dark:hover:text-ink transition-colors cursor-pointer"
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-ink-muted dark:hover:text-ink transition-colors cursor-pointer"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Day Bar Navigation */}
              <div className="px-4 py-3 bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleGoToday}
                    className={clsx(
                      'px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer',
                      isToday
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-white/5 text-slate-700 dark:text-ink border-slate-200 dark:border-white/10 hover:bg-slate-100'
                    )}
                  >
                    Today
                  </button>
                  <div className="flex items-center">
                    <button
                      onClick={handlePrevDay}
                      aria-label="Previous Day"
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-ink-muted dark:hover:text-ink transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={handleNextDay}
                      aria-label="Next Day"
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-ink-muted dark:hover:text-ink transition-colors cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="text-xs font-bold font-mono text-slate-800 dark:text-ink">
                  {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {/* Agenda List Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-2.5 custom-scrollbar">
                {isLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-mono">
                    Synchronizing schedule...
                  </div>
                ) : events.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400">
                      <CalendarIcon size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-ink">
                        No Items Scheduled
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-ink-muted mt-0.5">
                        Items without dates stay unscheduled until assigned.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScheduleModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 text-indigo-700 dark:text-indigo-400 text-xs font-semibold cursor-pointer hover:bg-indigo-100 transition-colors"
                    >
                      <Plus size={14} />
                      <span>Block Time for a Task</span>
                    </button>
                  </div>
                ) : (
                  events.map((ev) => {
                    const isCompleted = ev.status === 'completed';
                    const timeString = ev.allDay
                      ? 'All Day'
                      : new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <motion.div
                        key={ev.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx(
                          'p-3 rounded-2xl border transition-all flex items-start justify-between gap-3',
                          isCompleted
                            ? 'bg-slate-50/60 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 opacity-70'
                            : 'bg-white dark:bg-white/[0.04] border-slate-200/80 dark:border-white/10 shadow-xs'
                        )}
                        style={{
                          borderLeftWidth: '4px',
                          borderLeftColor: ev.color || '#6366F1',
                        }}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          {/* Completion Toggle */}
                          <button
                            type="button"
                            disabled={toggleCompleteMutation.isPending}
                            onClick={() => toggleCompleteMutation.mutate(ev.id)}
                            className="mt-0.5 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer shrink-0"
                            title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                          >
                            {isCompleted ? (
                              <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-500/20" />
                            ) : (
                              <Circle size={18} className="hover:text-emerald-400" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p
                              className={clsx(
                                'text-xs font-semibold truncate leading-tight',
                                isCompleted
                                  ? 'line-through text-slate-400 dark:text-ink-muted'
                                  : 'text-slate-900 dark:text-ink'
                              )}
                            >
                              {ev.title}
                            </p>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono text-slate-500 dark:text-ink-muted flex items-center gap-1">
                                <Clock size={10} />
                                {timeString}
                              </span>

                              <span
                                className="text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold"
                                style={{
                                  backgroundColor: `${ev.color || '#6366F1'}18`,
                                  color: ev.color || '#6366F1',
                                }}
                              >
                                {ev.taskType || ev.category || 'event'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Bottom Quick Actions */}
              <div className="p-4 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/25 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                  <span>Time Block</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/calendar');
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-semibold cursor-pointer transition-all shadow-xs"
                >
                  <Layers size={14} />
                  <span>Full Calendar</span>
                </button>
              </div>

              {/* Inline Schedule Time Block Drawer/Form */}
              <AnimatePresence>
                {scheduleModalOpen && (
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={spring.snappy}
                    className="absolute inset-x-0 bottom-0 z-20 p-5 rounded-t-[28px] bg-white dark:bg-obsidian-900 border-t border-slate-200 dark:border-white/10 shadow-2xl space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-ink font-display">
                        Quick Time Block Task
                      </span>
                      <button
                        type="button"
                        onClick={() => setScheduleModalOpen(false)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-ink rounded-lg"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <form onSubmit={handleQuickSchedule} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">
                          SELECT ACTIVE TASK
                        </label>
                        <select
                          value={selectedTaskId}
                          onChange={(e) => setSelectedTaskId(e.target.value)}
                          required
                          className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-ink"
                        >
                          <option value="">-- Choose Task --</option>
                          {backlogTasks.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title} ({t.projectName || 'General'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 block mb-1">
                            TIME
                          </label>
                          <input
                            type="datetime-local"
                            value={blockTime}
                            onChange={(e) => setBlockTime(e.target.value)}
                            className="w-full p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-800 dark:text-ink"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-mono text-slate-400 block mb-1">
                            DURATION
                          </label>
                          <select
                            value={blockDuration}
                            onChange={(e) => setBlockDuration(e.target.value)}
                            className="w-full p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-ink"
                          >
                            <option value="25">25 mins (Pomodoro)</option>
                            <option value="45">45 mins (Deep Work)</option>
                            <option value="60">60 mins (Sprint)</option>
                            <option value="90">90 mins (Ultra)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setScheduleModalOpen(false)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={scheduleBlockMutation.isPending || !selectedTaskId}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
                        >
                          Lock Time Block
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
