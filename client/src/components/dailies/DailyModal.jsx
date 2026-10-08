import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { X, Sparkles, Calendar, Clock, Bell, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

import { modalPanel } from '@/lib/motionVariants';
import { useCreateDaily, useUpdateDaily } from '@/features/dailies/hooks';
import { JeevanLoader } from '@/components/ui/JeevanLoader';
import { useJeevanTransition } from '@/context/JeevanTransitionContext';
import { notificationService } from '@/lib/notifications';
import { computeNextFireTimes } from '@/lib/scheduler';

const DIFFICULTIES = [
  { value: 'trivial', label: 'Trivial' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

const REMINDER_OPTIONS = [
  { value: 0, label: 'At scheduled time' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
];

const DIFFICULTY_REWARDS = {
  trivial: { xp: 3, gold: 1 },
  easy: { xp: 8, gold: 3 },
  medium: { xp: 15, gold: 6 },
  hard: { xp: 25, gold: 10 },
};

const DAYS_OF_WEEK = [
  { label: 'Sun', day: 0, full: 'Sunday' },
  { label: 'Mon', day: 1, full: 'Monday' },
  { label: 'Tue', day: 2, full: 'Tuesday' },
  { label: 'Wed', day: 3, full: 'Wednesday' },
  { label: 'Thu', day: 4, full: 'Thursday' },
  { label: 'Fri', day: 5, full: 'Friday' },
  { label: 'Sat', day: 6, full: 'Saturday' },
];

function DailyForm({ dailyToEdit, onClose }) {
  const createMutation = useCreateDaily();
  const updateMutation = useUpdateDaily();
  const { triggerTransition } = useJeevanTransition();

  const [title, setTitle] = useState(() => dailyToEdit?.title || '');
  const [description, setDescription] = useState(() => dailyToEdit?.description || '');
  const [difficulty, setDifficulty] = useState(() => dailyToEdit?.difficulty || 'easy');
  const [priority, setPriority] = useState(() => dailyToEdit?.priority || 'medium');
  const [activeDays, setActiveDays] = useState(() => dailyToEdit?.activeDays || [0, 1, 2, 3, 4, 5, 6]);
  const [scheduledTime, setScheduledTime] = useState(() => dailyToEdit?.scheduledTime || '');
  const [durationMinutes, setDurationMinutes] = useState(() => dailyToEdit?.durationMinutes || 30);
  const [reminderEnabled, setReminderEnabled] = useState(() => Boolean(dailyToEdit?.reminderEnabled));
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(() => dailyToEdit?.reminderMinutesBefore ?? 10);
  const [error, setError] = useState(null);

  const fireTimes = useMemo(() => {
    if (!reminderEnabled || !scheduledTime) return [];
    return computeNextFireTimes({
      item: {
        scheduledTime,
        activeDays,
        reminderEnabled,
        reminderMinutesBefore,
      },
      itemType: 'daily',
      limit: 3,
    });
  }, [reminderEnabled, scheduledTime, activeDays, reminderMinutesBefore]);

  const toggleDay = (dayIndex) => {
    setActiveDays((prev) => {
      if (prev.includes(dayIndex)) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== dayIndex).sort();
      }
      return [...prev, dayIndex].sort();
    });
  };

  const selectEveryday = () => setActiveDays([0, 1, 2, 3, 4, 5, 6]);
  const selectWeekdays = () => setActiveDays([1, 2, 3, 4, 5]);
  const selectWeekends = () => setActiveDays([0, 6]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (activeDays.length === 0) {
      setError('Select at least one active day of the week');
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        difficulty,
        activeDays,
        scheduledTime: scheduledTime ? scheduledTime.trim() : null,
        durationMinutes: Number(durationMinutes),
        priority,
        reminderEnabled,
        reminderMinutesBefore: Number(reminderMinutesBefore),
      };

      let savedDaily;
      if (dailyToEdit) {
        savedDaily = await updateMutation.mutateAsync({
          dailyId: dailyToEdit.id,
          data: payload,
        });
      } else {
        savedDaily = await createMutation.mutateAsync(payload);
      }

      // Schedule local notification if reminder enabled
      if (reminderEnabled && scheduledTime) {
        await notificationService.scheduleDailyReminder(savedDaily || { ...payload, id: dailyToEdit?.id });
      }

      onClose();
      triggerTransition({
        variant: 'medium',
        message: dailyToEdit ? 'Updating Daily Ritual...' : 'Inscribing Daily Ritual...',
        submessage: 'Jeevan Daily Rituals Deck',
        duration: 1100,
      });
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to save daily ritual.');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const reward = DIFFICULTY_REWARDS[difficulty] || DIFFICULTY_REWARDS.easy;

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      {error && (
        <div className="p-3 text-xs rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-500">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-ink-muted mb-1.5">
          Ritual Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Study DBMS, Morning Meditation, Workout"
          maxLength={200}
          className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-ink placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-ink-muted mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details, notes, or purpose for this ritual..."
          rows={2}
          maxLength={1000}
          className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-ink placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed"
        />
      </div>

      {/* Time & Duration Scheduling */}
      <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-ink-muted mb-1 flex items-center gap-1">
            <Clock size={12} className="text-indigo-500" />
            <span>Scheduled Time</span>
          </label>
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-ink focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-ink-muted mb-1">
            Duration
          </label>
          <select
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-ink focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {DURATIONS.map((mins) => (
              <option key={mins} value={mins} className="bg-slate-900 text-white">
                {mins} minutes
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Priority Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-ink-muted mb-1.5">
          Priority
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={clsx(
                'py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center',
                priority === p.value
                  ? p.value === 'critical'
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/60 shadow-xs'
                    : p.value === 'high'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/60 shadow-xs'
                    : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/60 shadow-xs'
                  : 'bg-white/[0.04] text-slate-500 dark:text-ink-muted border-slate-200 dark:border-white/10'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Smart Reminders */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-amber-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-ink">
              Smart Reminder Alert
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReminderEnabled(!reminderEnabled)}
            className={clsx(
              'w-10 h-6 rounded-full transition-colors relative p-0.5',
              reminderEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-white/15'
            )}
          >
            <div
              className={clsx(
                'w-5 h-5 rounded-full bg-white shadow-xs transition-transform',
                reminderEnabled ? 'translate-x-4' : 'translate-x-0'
              )}
            />
          </button>
        </div>

        {reminderEnabled && (
          <div className="pt-1 space-y-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-ink-muted mb-1.5">
                Notify before scheduled time
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {REMINDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setReminderMinutesBefore(opt.value)}
                    className={clsx(
                      'py-1.5 px-2 rounded-xl text-[11px] font-medium border text-center transition-all cursor-pointer',
                      reminderMinutesBefore === opt.value
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/60 shadow-xs font-bold'
                        : 'bg-white dark:bg-white/[0.04] text-slate-500 dark:text-ink-muted border-slate-200 dark:border-white/10 hover:border-slate-300'
                    )}
                  >
                    {opt.value === 0 ? 'At time' : `${opt.value}m prior`}
                  </button>
                ))}
              </div>
            </div>

            {/* Authoritative Live Reminder Preview */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>Authoritative Next Reminders</span>
                </span>
                <span className="font-mono text-[10px] opacity-80">
                  {reminderMinutesBefore === 0 ? 'Exact Time' : `-${reminderMinutesBefore}m`}
                </span>
              </div>
              {scheduledTime ? (
                fireTimes.length > 0 ? (
                  <div className="space-y-1 pt-0.5">
                    {fireTimes.map((ft, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700 dark:text-ink-muted">
                        <span className="font-medium text-slate-900 dark:text-ink">{ft.formattedDisplay}</span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                          {ft.isPast ? '(due)' : 'scheduled'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-ink-muted">
                    No active slots scheduled within 60 days for selected days.
                  </p>
                )
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-ink-muted">
                  Set a Scheduled Time above to compute exact fire times.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Days */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-ink-muted">Active Days</label>
          <div className="flex items-center gap-1.5 text-[10px]">
            <button type="button" onClick={selectEveryday} className="text-amber-600 dark:text-amber-400 hover:underline">
              Daily
            </button>
            <span>•</span>
            <button type="button" onClick={selectWeekdays} className="text-amber-600 dark:text-amber-400 hover:underline">
              Weekdays
            </button>
            <span>•</span>
            <button type="button" onClick={selectWeekends} className="text-amber-600 dark:text-amber-400 hover:underline">
              Weekends
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAYS_OF_WEEK.map(({ label, day }) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={clsx(
                'py-2 rounded-xl text-xs font-bold transition-all border',
                activeDays.includes(day)
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                  : 'bg-white/[0.04] text-slate-400 dark:text-ink-muted border-slate-200 dark:border-white/10'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-ink-muted mb-1.5">
          Difficulty
        </label>
        <div className="grid grid-cols-4 gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDifficulty(d.value)}
              className={clsx(
                'py-2 px-2 rounded-xl text-xs font-semibold capitalize transition-all border',
                difficulty === d.value
                  ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/60 shadow-xs'
                  : 'bg-white/[0.04] text-slate-500 dark:text-ink-muted border-slate-200 dark:border-white/10'
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reward Preview */}
      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
        <span className="text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-medium">
          <Sparkles size={14} className="text-amber-500" />
          <span>Reward per completion:</span>
        </span>
        <div className="flex items-center gap-3 font-semibold font-mono text-amber-700 dark:text-gold">
          <span>+{reward.xp} XP</span>
          <span>+{reward.gold} Coins</span>
        </div>
      </div>

      {/* Submit / Cancel Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-ink-muted hover:text-slate-900 rounded-xl border border-slate-200 dark:border-white/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : dailyToEdit ? 'Save Changes' : 'Create Ritual'}
        </button>
      </div>
    </form>
  );
}

DailyForm.propTypes = {
  dailyToEdit: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export function DailyModal({ isOpen, onClose, dailyToEdit }) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="daily-modal-title"
            variants={shouldReduceMotion ? {} : modalPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-md p-5 sm:p-6 rounded-3xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 shadow-2xl z-10"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                  <Calendar size={16} />
                </div>
                <h2 id="daily-modal-title" className="text-base font-bold text-slate-900 dark:text-ink font-display">
                  {dailyToEdit ? 'Edit Daily Ritual' : 'New Daily Ritual'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-white/[0.04] transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            <DailyForm key={dailyToEdit?.id || 'new'} dailyToEdit={dailyToEdit} onClose={onClose} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

DailyModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dailyToEdit: PropTypes.object,
};
