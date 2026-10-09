import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Tag,
  MapPin,
  CalendarDays,
  Repeat,
  Layers,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

import {
  useCalendarEvents,
  useCreateCalendarEvent,
  useScheduleTimeBlock,
  useDeleteCalendarEvent,
} from '@/features/calendar/hooks';
import { useTasks } from '@/features/tasks/hooks';
import { spring } from '@/lib/motionVariants';

const VIEWS = ['day', 'week', 'month'];
const CATEGORY_COLORS = {
  general: '#6366F1', // Indigo
  deep_work: '#8B5CF6', // Purple
  task: '#10B981', // Emerald
  daily: '#F59E0B', // Amber
  meeting: '#3B82F6', // Blue
  health: '#EC4899', // Pink
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState('week'); // 'day', 'week', 'month'
  const [filterCategory, setFilterCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Calculate range for query based on view
  const { rangeStart, rangeEnd } = useMemo(() => {
    const d = new Date(currentDate);
    if (view === 'day') {
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
    }
    if (view === 'week') {
      const day = d.getDay();
      const diffToMon = day === 0 ? -6 : 1 - day;
      const start = new Date(d.setDate(d.getDate() + diffToMon));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
    }
    // Month
    const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
  }, [currentDate, view]);

  // Queries
  const { data: rawEvents = [], isLoading } = useCalendarEvents({
    startDate: rangeStart,
    endDate: rangeEnd,
  });

  const { data: backlogTasks = [] } = useTasks({ status: 'active' });

  // Filter events
  const events = useMemo(() => {
    if (filterCategory === 'all') return rawEvents;
    return rawEvents.filter((e) => e.category === filterCategory || (filterCategory === 'task' && e.isTaskBlock));
  }, [rawEvents, filterCategory]);

  // Navigate dates
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => setCurrentDate(new Date());

  // Date Header string
  const headerTitle = useMemo(() => {
    const month = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    if (view === 'day') {
      const day = currentDate.getDate();
      const weekday = currentDate.toLocaleString('default', { weekday: 'short' });
      return `${weekday}, ${month} ${day}, ${year}`;
    }
    return `${month} ${year}`;
  }, [currentDate, view]);

  return (
    <div className="space-y-6 pb-32 sm:pb-36 select-none">
      {/* ── Top Bar: Title & Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <CalendarIcon size={18} />
            </span>
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-ink">
              Smart Calendar & Time Blocking
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-ink-muted mt-1">
            Seamlessly orchestrate your events, deep work slots, and task time blocks without conflicts.
          </p>
        </div>

        {/* View Switcher & Action */}
        <div className="flex items-center gap-3">
          {/* Day / Week / Month Toggle */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
            {VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all',
                  view === v
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-ink shadow-xs'
                    : 'text-slate-500 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink'
                )}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setSelectedSlot(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer min-h-[38px]"
          >
            <Plus size={15} />
            <span>Schedule Slot</span>
          </button>
        </div>
      </div>

      {/* ── Navigation Strip & Filter Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl">
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-ink border border-slate-200 dark:border-white/10 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              aria-label="Previous time frame"
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-ink-muted transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next time frame"
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-ink-muted transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-ink font-display ml-2">
            {headerTitle}
          </span>
        </div>

        {/* Categories / Filter Pill Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {['all', 'general', 'deep_work', 'task', 'daily'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={clsx(
                'px-2.5 py-1 rounded-full text-[11px] font-medium transition-all capitalize whitespace-nowrap',
                filterCategory === cat
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 font-semibold'
                  : 'text-slate-500 dark:text-ink-muted hover:text-slate-800 dark:hover:text-ink'
              )}
            >
              {cat === 'all' ? 'All Focus Slots' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Calendar Grid Views ── */}
      {view === 'week' && (
        <WeekView
          currentDate={currentDate}
          events={events}
          onSelectSlot={(slot) => {
            setSelectedSlot(slot);
            setModalOpen(true);
          }}
        />
      )}

      {view === 'day' && (
        <DayView
          currentDate={currentDate}
          events={events}
          onSelectSlot={(slot) => {
            setSelectedSlot(slot);
            setModalOpen(true);
          }}
        />
      )}

      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          events={events}
          onSelectDate={(date) => {
            setCurrentDate(date);
            setView('day');
          }}
        />
      )}

      {/* ── Schedule Event / Time Block Modal ── */}
      <ScheduleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialSlot={selectedSlot}
        backlogTasks={backlogTasks}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WEEK VIEW COMPONENT
// ─────────────────────────────────────────────────────────────
function WeekView({ currentDate, events, onSelectSlot }) {
  // Compute Monday to Sunday dates
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(d.setDate(d.getDate() + diffToMon));

    return Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      return dayDate;
    });
  }, [currentDate]);

  // Hours: 08:00 to 22:00
  const hours = Array.from({ length: 15 }, (_, i) => i + 8);

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="rounded-3xl bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl overflow-x-auto shadow-sm custom-scrollbar">
      <div className="min-w-[680px] md:min-w-0">
        {/* Week Header Row */}
        <div className="grid grid-cols-8 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
          <div className="p-3 text-center border-r border-slate-200/80 dark:border-white/10 text-xs font-mono text-slate-400">
            TIME
          </div>
        {weekDays.map((date, idx) => {
          const today = isToday(date);
          return (
            <div
              key={idx}
              className={clsx(
                'p-3 text-center border-r border-slate-200/80 dark:border-white/10 last:border-r-0',
                today && 'bg-indigo-50/40 dark:bg-indigo-500/10'
              )}
            >
              <div className="text-[11px] font-mono uppercase text-slate-500 dark:text-ink-muted">
                {date.toLocaleString('default', { weekday: 'short' })}
              </div>
              <div
                className={clsx(
                  'w-7 h-7 mx-auto mt-0.5 rounded-full flex items-center justify-center text-xs font-bold font-mono',
                  today
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-800 dark:text-ink'
                )}
              >
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hours Grid */}
      <div className="max-h-[640px] overflow-y-auto">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-slate-200/40 dark:border-white/5 min-h-[58px]">
            {/* Time label */}
            <div className="p-2 text-right border-r border-slate-200/80 dark:border-white/10 text-[11px] font-mono text-slate-400 select-none">
              {hour % 12 === 0 ? 12 : hour % 12}:00 {hour >= 12 ? 'PM' : 'AM'}
            </div>

            {/* 7 Columns for Days */}
            {weekDays.map((date, dayIdx) => {
              const dayStr = date.toISOString().slice(0, 10);
              // Find events that intersect with this hour slot
              const slotEvents = events.filter((ev) => {
                const evStart = new Date(ev.startTime);
                const evDayStr = evStart.toISOString().slice(0, 10);
                if (evDayStr !== dayStr) return false;
                const evHour = evStart.getHours();
                return evHour === hour;
              });

              return (
                <div
                  key={dayIdx}
                  onClick={() => {
                    const slotDate = new Date(date);
                    slotDate.setHours(hour, 0, 0, 0);
                    onSelectSlot(slotDate);
                  }}
                  className="p-1 border-r border-slate-200/60 dark:border-white/5 last:border-r-0 relative hover:bg-slate-50/60 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  {slotEvents.map((ev, eIdx) => (
                    <motion.div
                      key={ev.id || eIdx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-1.5 rounded-xl text-[11px] leading-tight mb-1 border shadow-2xs backdrop-blur-md overflow-hidden"
                      style={{
                        backgroundColor: `${ev.color || '#6366F1'}15`,
                        borderColor: `${ev.color || '#6366F1'}40`,
                        color: ev.color || '#6366F1',
                      }}
                    >
                      <div className="font-semibold truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ev.color || '#6366F1' }} />
                        <span>{ev.title}</span>
                      </div>
                      <div className="text-[9px] opacity-75 font-mono truncate mt-0.5">
                        {new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DAY VIEW COMPONENT
// ─────────────────────────────────────────────────────────────
function DayView({ currentDate, events, onSelectSlot }) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 to 22:00
  const dayStr = currentDate.toISOString().slice(0, 10);

  const dayEvents = events.filter((ev) => {
    const s = new Date(ev.startTime).toISOString().slice(0, 10);
    return s === dayStr;
  });

  return (
    <div className="rounded-3xl bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl p-4 sm:p-6 shadow-sm">
      <div className="space-y-3">
        {hours.map((hour) => {
          const slotEvents = dayEvents.filter((ev) => {
            const h = new Date(ev.startTime).getHours();
            return h === hour;
          });

          return (
            <div
              key={hour}
              onClick={() => {
                const slot = new Date(currentDate);
                slot.setHours(hour, 0, 0, 0);
                onSelectSlot(slot);
              }}
              className="flex items-start gap-4 p-2 rounded-2xl hover:bg-slate-50/80 dark:hover:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 cursor-pointer transition-colors min-h-[64px]"
            >
              <div className="w-16 shrink-0 text-xs font-mono text-slate-400 pt-1">
                {hour % 12 === 0 ? 12 : hour % 12}:00 {hour >= 12 ? 'PM' : 'AM'}
              </div>

              <div className="flex-1 space-y-2">
                {slotEvents.length === 0 ? (
                  <div className="h-6 flex items-center text-xs text-slate-300 dark:text-white/10 font-mono">
                    + Click to block time
                  </div>
                ) : (
                  slotEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-2xl border flex items-center justify-between gap-3 shadow-xs"
                      style={{
                        backgroundColor: `${ev.color || '#6366F1'}12`,
                        borderColor: `${ev.color || '#6366F1'}35`,
                      }}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-ink flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ev.color || '#6366F1' }} />
                          <span>{ev.title}</span>
                          {ev.isTaskBlock && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                              Task Block
                            </span>
                          )}
                        </div>
                        {ev.description && (
                          <div className="text-[11px] text-slate-500 dark:text-ink-muted mt-0.5">
                            {ev.description}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0 font-mono text-xs text-slate-500 dark:text-ink-muted">
                        {new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(ev.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MONTH VIEW COMPONENT
// ─────────────────────────────────────────────────────────────
function MonthView({ currentDate, events, onSelectDate }) {
  const { days, blanks } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    // Normalize Sunday = 6, Mon = 0 for standard week
    const blankCount = firstDay === 0 ? 6 : firstDay - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayList = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
    return { days: dayList, blanks: blankCount };
  }, [currentDate]);

  return (
    <div className="rounded-3xl bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl overflow-x-auto shadow-sm custom-scrollbar">
      <div className="min-w-[580px] md:min-w-0">
        {/* Month Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="p-3 text-center text-xs font-mono text-slate-400 uppercase">
              {day}
            </div>
          ))}
        </div>

      {/* Grid of Cells */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {Array.from({ length: blanks }).map((_, i) => (
          <div key={`blank-${i}`} className="p-2 border-b border-r border-slate-200/40 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.005] min-h-[96px]" />
        ))}

        {days.map((date) => {
          const dateStr = date.toISOString().slice(0, 10);
          const dayEvents = events.filter((ev) => {
            const s = new Date(ev.startTime).toISOString().slice(0, 10);
            return s === dateStr;
          });

          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(date)}
              className={clsx(
                'p-2 border-b border-r border-slate-200/60 dark:border-white/5 min-h-[96px] hover:bg-slate-50/80 dark:hover:bg-white/[0.02] cursor-pointer transition-colors flex flex-col justify-between',
                isToday && 'bg-indigo-50/30 dark:bg-indigo-500/5'
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono',
                    isToday ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-ink'
                  )}
                >
                  {date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {dayEvents.length} items
                  </span>
                )}
              </div>

              {/* Event pills preview */}
              <div className="space-y-1 mt-1">
                {dayEvents.slice(0, 2).map((ev) => (
                  <div
                    key={ev.id}
                    className="p-1 rounded-md text-[10px] font-medium truncate"
                    style={{
                      backgroundColor: `${ev.color || '#6366F1'}15`,
                      color: ev.color || '#6366F1',
                    }}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[9px] font-mono text-slate-400 pl-1">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCHEDULE EVENT / TIME BLOCK MODAL
// ─────────────────────────────────────────────────────────────
function ScheduleModal({ isOpen, onClose, initialSlot, backlogTasks }) {
  const createEventMutation = useCreateCalendarEvent();
  const scheduleBlockMutation = useScheduleTimeBlock();

  const [mode, setMode] = useState('block'); // 'event' or 'block'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('deep_work');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [recurrence, setRecurrence] = useState('none');

  // Sync initial slot
  useMemo(() => {
    if (initialSlot) {
      const pad = (n) => String(n).padStart(2, '0');
      const d = new Date(initialSlot);
      const str = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setStartTime(str);
    } else {
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
      const pad = (n) => String(n).padStart(2, '0');
      setStartTime(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
    }
  }, [initialSlot]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'block' && selectedTaskId) {
      await scheduleBlockMutation.mutateAsync({
        taskId: selectedTaskId,
        startTime: new Date(startTime).toISOString(),
        durationMinutes: parseInt(durationMinutes, 10),
      });
      onClose();
      return;
    }

    // Regular event
    const start = new Date(startTime);
    const end = new Date(start.getTime() + parseInt(durationMinutes, 10) * 60 * 1000);

    await createEventMutation.mutateAsync({
      title: title.trim(),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      category,
      color: CATEGORY_COLORS[category] || '#6366F1',
      recurrenceRule: recurrence !== 'none' ? recurrence : null,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-obsidian-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-display text-slate-900 dark:text-ink">
            Schedule Time Block
          </h2>
          <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setMode('block')}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                mode === 'block' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-ink shadow-xs' : 'text-slate-500'
              )}
            >
              Task Block
            </button>
            <button
              type="button"
              onClick={() => setMode('event')}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                mode === 'event' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-ink shadow-xs' : 'text-slate-500'
              )}
            >
              Event
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'block' ? (
            <div>
              <label className="text-[11px] font-mono text-slate-500 dark:text-ink-muted block mb-1">
                SELECT TASK FROM BACKLOG
              </label>
              {backlogTasks.length === 0 ? (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                  No active tasks found in your backlog. Switch to Event mode or create a task first!
                </div>
              ) : (
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-ink"
                >
                  <option value="">-- Choose Task --</option>
                  {backlogTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.projectName}] {t.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div>
              <label className="text-[11px] font-mono text-slate-500 dark:text-ink-muted block mb-1">
                EVENT TITLE
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep Work Sprint"
                required
                className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-ink placeholder:text-slate-400"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-500 dark:text-ink-muted block mb-1">
                START TIME
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full p-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-800 dark:text-ink"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-500 dark:text-ink-muted block mb-1">
                DURATION
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full p-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-800 dark:text-ink"
              >
                <option value={15}>15 mins</option>
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>60 mins</option>
                <option value={90}>90 mins</option>
                <option value={120}>120 mins</option>
              </select>
            </div>
          </div>

          {mode === 'event' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-500 dark:text-ink-muted block mb-1">
                  CATEGORY
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-ink capitalize"
                >
                  <option value="deep_work">Deep Work</option>
                  <option value="meeting">Meeting</option>
                  <option value="general">General</option>
                  <option value="health">Health</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-500 dark:text-ink-muted block mb-1">
                  RECURRENCE
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-full p-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-ink capitalize"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekdays">Every Weekday (M-F)</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-ink-muted dark:hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createEventMutation.isPending || scheduleBlockMutation.isPending}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              Commit to Calendar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
