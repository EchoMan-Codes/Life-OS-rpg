import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { X, Flame, ShieldAlert, Sparkles, Check } from 'lucide-react';
import clsx from 'clsx';

import { modalPanel } from '@/lib/motionVariants';
import { useCreateHabit, useUpdateHabit } from '@/features/habits/hooks';
import { RpgButton } from '@/components/rpg/RpgButton';
import { RitualFrame, ForgeChamber, DIFFICULTY_THEMES } from '@/components/habits/RitualFrame';

const DIRECTIONS = [
  { value: 'positive', label: 'Positive (+)', description: 'Rewards XP & Gold for consistency.' },
  { value: 'both', label: 'Dual Flow (±)', description: 'Rewards consistency, deducts HP on slips.' },
  { value: 'negative', label: 'Accountability (-)', description: 'Deducts HP when negative triggers occur.' },
];

const DIFFICULTIES = [
  { value: 'trivial', label: 'TRIVIAL', xp: 3, gold: 1, hp: 1, variant: 'easy' },
  { value: 'easy', label: 'EASY', xp: 8, gold: 3, hp: 3, variant: 'easy' },
  { value: 'medium', label: 'MEDIUM', xp: 15, gold: 6, hp: 6, variant: 'medium' },
  { value: 'hard', label: 'HARD', xp: 25, gold: 10, hp: 10, variant: 'difficult' },
];

function HabitForm({ habitToEdit, onClose, onDifficultyChange }) {
  const createMutation = useCreateHabit();
  const updateMutation = useUpdateHabit();

  const [title, setTitle] = useState(() => habitToEdit?.title || '');
  const [description, setDescription] = useState(() => habitToEdit?.description || '');
  const [direction, setDirection] = useState(() => habitToEdit?.direction || 'positive');
  const [difficulty, setDifficulty] = useState(() => habitToEdit?.difficulty || 'easy');
  const [error, setError] = useState(null);

  const handleDifficultySelect = (val) => {
    setDifficulty(val);
    onDifficultyChange(val);
  };

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
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 sm:space-y-5">
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
          placeholder="e.g. Read 20 pages, Deep Coding, Push-ups..."
          maxLength={200}
          required
          className="w-full px-4 py-2.5 min-h-11 rounded-xl bg-obsidian-950 border border-white/10 text-ink text-sm placeholder:text-ink-muted/40 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-sans"
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
          className="w-full px-4 py-2 rounded-xl bg-obsidian-950 border border-white/10 text-ink text-sm placeholder:text-ink-muted/40 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all resize-none font-sans"
        />
      </div>

      {/* Direction Selector */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-1.5">
          Ritual Direction
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DIRECTIONS.map((dir) => (
            <button
              key={dir.value}
              type="button"
              onClick={() => setDirection(dir.value)}
              className={clsx(
                'flex flex-col items-start p-2.5 min-h-11 rounded-xl border text-left transition-all cursor-pointer select-none',
                direction === dir.value
                  ? 'border-cyan-400 bg-cyan-500/15 text-ink shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'border-white/10 bg-obsidian-950/70 text-ink-muted hover:border-white/20'
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

      {/* Exact Difficulty Selector (Easy=Cyan, Med=Violet, Hard=Deep Electric Cobalt Blue - NEVER RED) */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-1.5">
          Difficulty Tier & Color Palette
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DIFFICULTIES.map((diff) => {
            const isSelected = difficulty === diff.value;
            const diffTheme = DIFFICULTY_THEMES[diff.variant];
            return (
              <button
                key={diff.value}
                type="button"
                onClick={() => handleDifficultySelect(diff.value)}
                className={clsx(
                  'flex flex-col items-center justify-center p-2.5 min-h-11 rounded-xl border text-center transition-all cursor-pointer select-none',
                  isSelected
                    ? `${diffTheme.badgeClass} ring-1 ring-white/20`
                    : 'border-white/10 bg-obsidian-950/70 text-ink-muted hover:border-white/20'
                )}
              >
                <span className="text-xs font-mono font-bold">{diff.label}</span>
                <span className="text-[10px] font-mono opacity-90 font-medium mt-0.5">
                  +{diff.xp} XP / +{diff.gold} G
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Framed Internal Chamber: Reward Preview */}
      <ForgeChamber variant="inset" className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono">
          <Flame className="w-4 h-4 text-cyan-400" />
          <span className="text-ink-muted">Reward yield:</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          {direction !== 'negative' && (
            <>
              <span className="text-cyan-300">+{currentDiff.xp} XP</span>
              <span className="text-amber-300">+{currentDiff.gold} Gold</span>
            </>
          )}
          {direction !== 'positive' && (
            <span className="text-rose-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              -{currentDiff.hp} HP slip
            </span>
          )}
        </div>
      </ForgeChamber>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 min-h-11 rounded-xl border border-white/10 text-ink-muted hover:text-ink hover:bg-white/5 transition-colors text-xs font-mono cursor-pointer"
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
  onDifficultyChange: PropTypes.func.isRequired,
};

function HabitModalContent({ onClose, habitToEdit = null }) {
  const shouldReduceMotion = useReducedMotion();
  const [selectedDifficulty, setSelectedDifficulty] = useState(() => habitToEdit?.difficulty || 'easy');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const modalVariant = selectedDifficulty === 'hard' ? 'difficult' : selectedDifficulty === 'medium' ? 'medium' : 'easy';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-obsidian-950/85 backdrop-blur-md"
      />

      {/* Modal Card Encased in Structural RitualFrame */}
      <motion.div
        variants={shouldReduceMotion ? {} : modalPanel}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative w-full max-w-lg z-10 my-8"
      >
        <RitualFrame
          variant={modalVariant}
          hasCrest={true}
          innerClassName="px-5 py-5 sm:p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold font-mono tracking-wide text-ink">
                {habitToEdit ? '[ EDIT DISCIPLINE ]' : '[ FORGE NEW RITUAL ]'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <HabitForm
            key={habitToEdit?.id || 'new'}
            habitToEdit={habitToEdit}
            onClose={onClose}
            onDifficultyChange={setSelectedDifficulty}
          />
        </RitualFrame>
      </motion.div>
    </div>
  );
}

HabitModalContent.propTypes = {
  onClose: PropTypes.func.isRequired,
  habitToEdit: PropTypes.object,
};

export function HabitModal({ isOpen, onClose, habitToEdit = null }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <HabitModalContent
          key={habitToEdit?.id || 'new-modal'}
          onClose={onClose}
          habitToEdit={habitToEdit}
        />
      )}
    </AnimatePresence>
  );
}

HabitModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  habitToEdit: PropTypes.object,
};

