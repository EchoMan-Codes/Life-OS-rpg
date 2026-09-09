import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { X, Sparkles } from 'lucide-react';
import clsx from 'clsx';

import { modalPanel } from '@/lib/motionVariants';
import { useCreateHabit, useUpdateHabit } from '@/features/habits/hooks';
import { DIFFICULTY_REWARDS } from '@/features/habits/rewardTable';

const DIRECTIONS = [
  { value: 'positive', label: 'Positive (+)', description: 'Earn XP & Gold for good deeds' },
  { value: 'both', label: 'Both (+ / -)', description: 'Reward consistency, penalize slip-ups' },
  { value: 'negative', label: 'Negative (-)', description: 'Deduct HP when bad habits occur' },
];

const DIFFICULTIES = [
  { value: 'trivial', label: 'Trivial' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

function HabitForm({ habitToEdit, onClose }) {
  const createMutation = useCreateHabit();
  const updateMutation = useUpdateHabit();

  const [title, setTitle] = useState(() => habitToEdit?.title || '');
  const [description, setDescription] = useState(() => habitToEdit?.description || '');
  const [direction, setDirection] = useState(() => habitToEdit?.direction || 'positive');
  const [difficulty, setDifficulty] = useState(() => habitToEdit?.difficulty || 'easy');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      if (habitToEdit) {
        await updateMutation.mutateAsync({
          habitId: habitToEdit.id,
          data: { title: title.trim(), description: description.trim() || null, direction, difficulty },
        });
      } else {
        await createMutation.mutateAsync({
          title: title.trim(),
          description: description.trim() || null,
          direction,
          difficulty,
        });
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to save habit.');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-5">
      {error && (
        <div className="p-3 text-body-xs rounded-xl bg-attr-strength/15 border border-attr-strength/40 text-attr-strength">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="habit-title" className="block text-body-xs font-medium text-ink-muted mb-1.5">
          Habit Title *
        </label>
        <input
          id="habit-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Read 20 pages, Morning Jog, Meditate..."
          maxLength={200}
          required
          className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-800 border border-glass-border text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-glass-border-strong focus:ring-1 focus:ring-glass-border transition-all"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="habit-desc" className="block text-body-xs font-medium text-ink-muted mb-1.5">
          Description (Optional)
        </label>
        <textarea
          id="habit-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add context, rules, or motivations..."
          rows={2}
          maxLength={1000}
          className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-800 border border-glass-border text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-glass-border-strong focus:ring-1 focus:ring-glass-border transition-all resize-none"
        />
      </div>

      {/* Direction Selector */}
      <div>
        <label className="block text-body-xs font-medium text-ink-muted mb-1.5">
          Habit Direction
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DIRECTIONS.map((dir) => (
            <button
              key={dir.value}
              type="button"
              onClick={() => setDirection(dir.value)}
              className={clsx(
                'flex flex-col items-start p-3 rounded-xl border text-left transition-all',
                direction === dir.value
                  ? 'border-xp bg-xp/10 shadow-glass text-ink'
                  : 'border-glass-border bg-obsidian-800/60 text-ink-muted hover:border-glass-border-strong'
              )}
            >
              <span className="text-body-xs font-semibold text-ink">{dir.label}</span>
              <span className="text-body-2xs text-ink-muted mt-0.5 line-clamp-2">{dir.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Selector */}
      <div>
        <label className="block text-body-xs font-medium text-ink-muted mb-1.5">
          Difficulty & Reward Preview
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DIFFICULTIES.map((diff) => {
            const rewards = DIFFICULTY_REWARDS[diff.value];
            return (
              <button
                key={diff.value}
                type="button"
                onClick={() => setDifficulty(diff.value)}
                className={clsx(
                  'flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all',
                  difficulty === diff.value
                    ? 'border-mana bg-mana/15 shadow-glass text-ink'
                    : 'border-glass-border bg-obsidian-800/60 text-ink-muted hover:border-glass-border-strong'
                )}
              >
                <span className="text-body-xs font-semibold text-ink">{diff.label}</span>
                <span className="text-body-2xs text-xp font-medium mt-1">
                  +{rewards.xp} XP / +{rewards.gold} G
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-glass-border">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl border border-glass-border text-ink-muted hover:text-ink hover:bg-glass/40 transition-colors text-body-xs font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-xp to-gold text-obsidian-950 font-semibold text-body-xs hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-glass"
        >
          {isPending ? 'Saving...' : habitToEdit ? 'Save Changes' : 'Create Habit'}
        </button>
      </div>
    </form>
  );
}

HabitForm.propTypes = {
  habitToEdit: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export function HabitModal({ isOpen, onClose, habitToEdit = null }) {
  const shouldReduceMotion = useReducedMotion();

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
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
            variants={shouldReduceMotion ? {} : modalPanel}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-lg p-6 rounded-2xl bg-obsidian-900 border border-glass-border shadow-glow text-ink z-10 my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-glass-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-xp" />
                <h2 className="text-display-xs text-ink">
                  {habitToEdit ? 'Edit Habit' : 'Create New Habit'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-glass/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form remounts per habitToEdit via key */}
            <HabitForm
              key={habitToEdit?.id || 'new'}
              habitToEdit={habitToEdit}
              onClose={onClose}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

HabitModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  habitToEdit: PropTypes.object,
};
