import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { X, Flame, ShieldAlert, Sparkles, Check } from 'lucide-react';
import clsx from 'clsx';

import { modalPanel } from '@/lib/motionVariants';
import { useCreateHabit, useUpdateHabit } from '@/features/habits/hooks';
import { RpgButton } from '@/components/rpg/RpgButton';

const DIRECTIONS = [
  { value: 'positive', label: 'Positive (+)', description: 'Rewards XP & Gold for virtuous consistency.' },
  { value: 'both', label: 'Dual Flow (±)', description: 'Rewards consistency, deducts HP on slips.' },
  { value: 'negative', label: 'Accountability (-)', description: 'Deducts HP when negative triggers occur.' },
];

const DIFFICULTIES = [
  { value: 'trivial', label: 'TRIVIAL', xp: 3, gold: 1, hp: 1 },
  { value: 'easy', label: 'EASY', xp: 8, gold: 3, hp: 3 },
  { value: 'medium', label: 'MEDIUM', xp: 15, gold: 6, hp: 6 },
  { value: 'hard', label: 'HARD', xp: 25, gold: 10, hp: 10 },
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
      setError('Discipline title is required');
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
      setError(err?.response?.data?.error?.message || 'Failed to save discipline.');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const currentDiff = DIFFICULTIES.find((d) => d.value === difficulty) || DIFFICULTIES[1];

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-5">
      {error && (
        <div className="p-3 text-xs font-mono rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="habit-title" className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-1.5">
          Ritual Name *
        </label>
        <input
          id="habit-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Read 20 pages, Hydration, Deep Coding, Push-ups..."
          maxLength={200}
          required
          className="w-full px-4 py-2.5 min-h-11 rounded-xl bg-obsidian-950/80 border border-glass-border text-ink text-sm placeholder:text-ink-muted/40 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-sans"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="habit-desc" className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-1.5">
          Discipline Guidelines (Optional)
        </label>
        <textarea
          id="habit-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Specify conditions, cadence, or trigger rules..."
          rows={2}
          maxLength={1000}
          className="w-full px-4 py-2.5 rounded-xl bg-obsidian-950/80 border border-glass-border text-ink text-sm placeholder:text-ink-muted/40 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all resize-none font-sans"
        />
      </div>

      {/* Direction Selector */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-1.5">
          Ritual Direction
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {DIRECTIONS.map((dir) => (
            <button
              key={dir.value}
              type="button"
              onClick={() => setDirection(dir.value)}
              className={clsx(
                'flex flex-col items-start p-3 min-h-11 rounded-xl border text-left transition-all cursor-pointer select-none',
                direction === dir.value
                  ? 'border-cyan-400 bg-cyan-500/15 text-ink shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'border-glass-border bg-obsidian-950/60 text-ink-muted hover:border-glass-border-strong'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold font-mono text-ink">{dir.label}</span>
                {direction === dir.value && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
              <span className="text-[10px] text-ink-muted mt-1 leading-relaxed">{dir.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Selector */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-1.5">
          Difficulty Tier & Reward Preview
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DIFFICULTIES.map((diff) => {
            const isSelected = difficulty === diff.value;
            return (
              <button
                key={diff.value}
                type="button"
                onClick={() => setDifficulty(diff.value)}
                className={clsx(
                  'flex flex-col items-center justify-center p-2.5 min-h-11 rounded-xl border text-center transition-all cursor-pointer select-none',
                  isSelected
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'border-glass-border bg-obsidian-950/60 text-ink-muted hover:border-glass-border-strong'
                )}
              >
                <span className="text-xs font-mono font-bold">{diff.label}</span>
                <span className="text-[10px] font-mono text-cyan-400/90 font-medium mt-1">
                  +{diff.xp} XP / +{diff.gold} G
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contract Reward Preview Card */}
      <div className="p-3.5 rounded-xl bg-obsidian-950/80 border border-cyan-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono">
          <Flame className="w-4 h-4 text-cyan-400" />
          <span className="text-ink-muted">Per execution:</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs font-mono font-bold">
          {direction !== 'negative' && (
            <>
              <span className="text-cyan-300">+{currentDiff.xp} XP</span>
              <span className="text-amber-300">+{currentDiff.gold} Gold</span>
            </>
          )}
          {direction !== 'positive' && (
            <span className="text-rose-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              -{currentDiff.hp} HP on slip
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-glass-border">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 min-h-11 rounded-xl border border-glass-border text-ink-muted hover:text-ink hover:bg-white/5 transition-colors text-xs font-mono cursor-pointer"
        >
          CANCEL
        </button>
        <RpgButton
          type="submit"
          disabled={isPending}
          variant="primary"
          size="md"
        >
          <span>{isPending ? 'FORGING...' : habitToEdit ? 'SAVE CHANGES' : 'CREATE RITUAL'}</span>
        </RpgButton>
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
            className="fixed inset-0 bg-obsidian-950/85 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            variants={shouldReduceMotion ? {} : modalPanel}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-lg px-5 py-6 sm:p-7 rounded-2xl bg-obsidian-900 border border-glass-border shadow-elevation-high text-ink z-10 my-8"
          >
            {/* Cybernetic Corner Brackets */}
            <div className="absolute top-2 left-2 text-cyan-400/40 text-[10px] font-mono select-none pointer-events-none">┌</div>
            <div className="absolute top-2 right-2 text-cyan-400/40 text-[10px] font-mono select-none pointer-events-none">┐</div>
            <div className="absolute bottom-2 left-2 text-cyan-400/40 text-[10px] font-mono select-none pointer-events-none">└</div>
            <div className="absolute bottom-2 right-2 text-cyan-400/40 text-[10px] font-mono select-none pointer-events-none">┘</div>

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-glass-border">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-bold font-mono tracking-wide text-ink">
                  {habitToEdit ? '[ EDIT DISCIPLINE ]' : '[ FORGE NEW RITUAL ]'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
