import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { X, Sparkles, Calendar } from 'lucide-react';
import clsx from 'clsx';

import { modalPanel } from '@/lib/motionVariants';
import { useCreateDaily, useUpdateDaily } from '@/features/dailies/hooks';
import { JeevanLoader } from '@/components/ui/JeevanLoader';
import { useJeevanTransition } from '@/context/JeevanTransitionContext';

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
  const { triggerTransition } = useJeevanTransition();

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
          className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-ink placeholder:text-ink-muted/40 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] focus:ring-2 focus:ring-white/10 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] transition-all text-sm min-h-[46px]"
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
          className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-ink placeholder:text-ink-muted/40 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] focus:ring-2 focus:ring-white/10 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] transition-all text-sm resize-none"
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
                  'py-2.5 rounded-2xl text-xs font-semibold transition-all min-h-[44px] flex items-center justify-center active:scale-95 border',
                  isSelected
                    ? 'bg-attr-perception/20 text-attr-perception border-attr-perception/50 shadow-sm'
                    : 'bg-white/[0.04] text-ink-muted/60 border-white/10 hover:bg-white/[0.08] hover:text-ink'
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
                'py-2 px-3 rounded-2xl text-xs font-semibold capitalize transition-all min-h-[44px] border active:scale-95',
                difficulty === d.value
                  ? 'bg-attr-intelligence/20 text-attr-intelligence border-attr-intelligence/60 shadow-sm'
                  : 'bg-white/[0.04] text-ink-muted border-white/10 hover:bg-white/[0.08]'
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reward Preview */}
      <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs backdrop-blur-md">
        <span className="text-ink-muted flex items-center gap-1.5">
          <Sparkles size={14} className="text-gold" />
          <span>Reward upon completion:</span>
        </span>
        <div className="flex items-center gap-3 font-semibold font-mono">
          <span className="text-attr-perception">+{reward.xp} XP</span>
          <span className="text-gold">+{reward.gold} Gold</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="px-4 py-2.5 text-xs font-medium text-ink-muted hover:text-ink hover:bg-white/[0.05] rounded-2xl border border-white/10 transition-colors min-h-[42px]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 text-xs font-bold text-obsidian-950 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-2xl transition-all min-h-[42px] shadow-md hover:opacity-90 active:scale-95 disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <JeevanLoader variant="micro" />
              <span>Saving...</span>
            </>
          ) : dailyToEdit ? (
            'Save Changes'
          ) : (
            'Create Ritual'
          )}
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
            className="fixed inset-0 bg-obsidian-950/75 backdrop-blur-md"
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
            className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl bg-obsidian-900/90 border border-white/15 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.2)] z-10"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-attr-perception/15 border border-attr-perception/30 flex items-center justify-center text-attr-perception shadow-inner">
                  <Calendar size={16} />
                </div>
                <h2 id="daily-modal-title" className="text-base font-semibold text-ink">
                  {dailyToEdit ? 'Edit Daily Ritual' : 'New Daily Ritual'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 text-ink-muted hover:text-ink rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
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
