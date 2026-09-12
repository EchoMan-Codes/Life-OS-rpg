import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { X, Sparkles, Calendar } from 'lucide-react';
import clsx from 'clsx';

import { modalPanel } from '@/lib/motionVariants';
import { useCreateDaily, useUpdateDaily } from '@/features/dailies/hooks';

const DIFFICULTIES = [
  { value: 'trivial', label: 'Trivial' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
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

  const [title, setTitle] = useState(() => dailyToEdit?.title || '');
  const [description, setDescription] = useState(() => dailyToEdit?.description || '');
  const [difficulty, setDifficulty] = useState(() => dailyToEdit?.difficulty || 'easy');
  const [activeDays, setActiveDays] = useState(() => dailyToEdit?.activeDays || [0, 1, 2, 3, 4, 5, 6]);
  const [error, setError] = useState(null);

  const toggleDay = (dayIndex) => {
    setActiveDays((prev) => {
      if (prev.includes(dayIndex)) {
        if (prev.length === 1) return prev; // At least one active day required
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
      if (dailyToEdit) {
        await updateMutation.mutateAsync({
          dailyId: dailyToEdit.id,
          data: {
            title: title.trim(),
            description: description.trim() || null,
            difficulty,
            activeDays,
          },
        });
      } else {
        await createMutation.mutateAsync({
          title: title.trim(),
          description: description.trim() || null,
          difficulty,
          activeDays,
        });
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to save daily ritual.');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const reward = DIFFICULTY_REWARDS[difficulty] || DIFFICULTY_REWARDS.easy;

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-5">
      {error && (
        <div className="p-3 text-xs rounded-panel bg-attr-strength/15 border border-attr-strength/40 text-attr-strength">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="daily-title" className="block text-xs font-medium text-ink-muted mb-1.5">
          Ritual Title *
        </label>
        <input
          id="daily-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 30 Minutes Cardio, Review Budget, Floss..."
          maxLength={200}
          required
          className="w-full px-3.5 py-2.5 rounded-panel bg-obsidian-800 border border-glass-border text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-attr-perception/60 focus:ring-1 focus:ring-attr-perception transition-all min-h-[44px]"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="daily-desc" className="block text-xs font-medium text-ink-muted mb-1.5">
          Description (Optional)
        </label>
        <textarea
          id="daily-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Specific requirements or goals for this daily..."
          rows={2}
          maxLength={1000}
          className="w-full px-3.5 py-2.5 rounded-panel bg-obsidian-800 border border-glass-border text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-attr-perception/60 focus:ring-1 focus:ring-attr-perception transition-all resize-none"
        />
      </div>

      {/* Active Days Picker */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-ink-muted flex items-center gap-1.5">
            <Calendar size={13} />
            <span>Active Days *</span>
          </label>
          <div className="flex items-center gap-1 text-[11px] text-attr-perception">
            <button
              type="button"
              onClick={selectEveryday}
              className="hover:underline px-1 py-0.5 rounded"
            >
              Everyday
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={selectWeekdays}
              className="hover:underline px-1 py-0.5 rounded"
            >
              Weekdays
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={selectWeekends}
              className="hover:underline px-1 py-0.5 rounded"
            >
              Weekends
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {DAYS_OF_WEEK.map(({ label, day, full }) => {
            const isSelected = activeDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                aria-pressed={isSelected}
                aria-label={`Toggle ${full}`}
                className={clsx(
                  'py-2 rounded-panel text-xs font-semibold transition-all min-h-[44px] flex items-center justify-center',
                  isSelected
                    ? 'bg-attr-perception/20 text-attr-perception border border-attr-perception/50 shadow-glow-perception'
                    : 'bg-obsidian-800/60 text-ink-muted/50 border border-glass-border hover:bg-obsidian-800 hover:text-ink'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty Selector */}
      <div>
        <label className="block text-xs font-medium text-ink-muted mb-2">Difficulty</label>
        <div className="grid grid-cols-4 gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDifficulty(d.value)}
              className={clsx(
                'py-2 px-3 rounded-panel text-xs font-semibold capitalize transition-all min-h-[44px] border',
                difficulty === d.value
                  ? 'bg-attr-intelligence/20 text-attr-intelligence border-attr-intelligence/60'
                  : 'bg-obsidian-800/40 text-ink-muted border-glass-border hover:bg-obsidian-800'
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reward Preview */}
      <div className="p-3 rounded-panel bg-obsidian-950/60 border border-glass-border flex items-center justify-between text-xs">
        <span className="text-ink-muted flex items-center gap-1.5">
          <Sparkles size={14} className="text-attr-vitality" />
          <span>Reward upon completion:</span>
        </span>
        <div className="flex items-center gap-3 font-semibold">
          <span className="text-attr-perception">+{reward.xp} XP</span>
          <span className="text-attr-vitality">+{reward.gold} Gold</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink hover:bg-glass rounded-panel transition-colors min-h-[44px]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 text-xs font-semibold text-obsidian-950 bg-attr-perception hover:bg-attr-perception/90 rounded-panel transition-all min-h-[44px] shadow-glow-perception disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="daily-modal-title"
            variants={shouldReduceMotion ? {} : modalPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-md p-6 rounded-2xl bg-obsidian-900 border border-glass-border shadow-modal z-10"
          >
            <div className="flex items-center justify-between pb-4 border-b border-glass-border">
              <h2 id="daily-modal-title" className="text-base font-semibold text-ink">
                {dailyToEdit ? 'Edit Daily Ritual' : 'New Daily Ritual'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 text-ink-muted hover:text-ink rounded-panel hover:bg-glass transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X size={18} />
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
