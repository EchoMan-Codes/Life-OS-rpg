import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Trash2 } from 'lucide-react';
import clsx from 'clsx';

import { playSound } from '@/lib/sound';
import { useCompleteQuestItem, useUndoQuestItem, useDeleteQuestItem } from '@/features/quests/hooks';

/**
 * Checklist subtask row with animated checkmark and inline floating XP feedback.
 */
export function QuestItemRow({ item, questId, isQuestCompleted }) {
  const shouldReduceMotion = useReducedMotion();
  const [showFloatingXp, setShowFloatingXp] = useState(false);

  const completeMutation = useCompleteQuestItem();
  const undoMutation = useUndoQuestItem();
  const deleteMutation = useDeleteQuestItem();

  const isPending = completeMutation.isPending || undoMutation.isPending || deleteMutation.isPending;

  const handleToggle = useCallback(() => {
    if (isPending || isQuestCompleted) return;

    if (item.isComplete) {
      playSound('daily_undo');
      undoMutation.mutate({ questId, itemId: item.id });
    } else {
      playSound('quest_item_complete');
      setShowFloatingXp(true);
      setTimeout(() => setShowFloatingXp(false), 800);
      completeMutation.mutate({ questId, itemId: item.id });
    }
  }, [item.isComplete, item.id, questId, isPending, isQuestCompleted, completeMutation, undoMutation]);

  const handleDelete = useCallback(() => {
    if (isPending) return;
    deleteMutation.mutate({ questId, itemId: item.id });
  }, [item.id, questId, isPending, deleteMutation]);

  return (
    <div
      className={clsx(
        'relative flex items-center justify-between gap-3 px-3 py-2 rounded-lg',
        'bg-obsidian-950/40 border border-glass-border/40 hover:border-glass-border/70',
        'transition-all duration-150 group',
        item.isComplete && 'opacity-65'
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Checkbox Target (>= 44x44px touch area) */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending || isQuestCompleted}
          aria-label={item.isComplete ? `Mark ${item.title} as incomplete` : `Mark ${item.title} as complete`}
          className={clsx(
            'relative flex items-center justify-center shrink-0',
            'w-11 h-11 -ml-2 rounded-full cursor-pointer focus:outline-none',
            'focus-visible:ring-2 focus-visible:ring-attr-intelligence/60',
            (isPending || isQuestCompleted) && 'cursor-not-allowed opacity-60'
          )}
        >
          <div
            className={clsx(
              'w-5 h-5 rounded border flex items-center justify-center transition-all duration-200',
              item.isComplete
                ? 'bg-attr-vitality/20 border-attr-vitality text-attr-vitality'
                : 'border-glass-border bg-obsidian-800/60 hover:border-attr-intelligence/50'
            )}
          >
            {item.isComplete && (
              <motion.svg
                className="w-3.5 h-3.5 stroke-current"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.2 }}
              >
                <path d="M20 6L9 17l-5-5" />
              </motion.svg>
            )}
          </div>
        </button>

        {/* Item Title */}
        <span
          className={clsx(
            'text-body-sm text-ink truncate select-none',
            item.isComplete && 'line-through text-ink-muted'
          )}
        >
          {item.title}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Reward tag */}
        <span className="text-[11px] font-mono text-ink-muted px-1.5 py-0.5 rounded bg-obsidian-800/60 border border-glass-border/40">
          +{item.xpReward || 2} XP
        </span>

        {/* Delete button */}
        {!isQuestCompleted && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            aria-label={`Delete subtask ${item.title}`}
            className={clsx(
              'flex items-center justify-center w-8 h-8 rounded-md',
              'text-ink-muted hover:text-hp hover:bg-hp/10 transition-colors',
              'opacity-0 group-hover:opacity-100 focus:opacity-100',
              'min-w-[32px] min-h-[32px]'
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Inline floating +2 XP feedback */}
      <AnimatePresence>
        {showFloatingXp && (
          <motion.div
            className="absolute left-6 -top-2 px-2 py-0.5 rounded bg-attr-intelligence/90 text-obsidian-950 font-bold text-xs pointer-events-none shadow-glow z-20"
            initial={{ opacity: 0, y: 4, scale: 0.8 }}
            animate={{ opacity: 1, y: -12, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            +{item.xpReward || 2} XP
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

QuestItemRow.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    isComplete: PropTypes.bool.isRequired,
    xpReward: PropTypes.number,
    goldReward: PropTypes.number,
  }).isRequired,
  questId: PropTypes.string.isRequired,
  isQuestCompleted: PropTypes.bool,
};

QuestItemRow.defaultProps = {
  isQuestCompleted: false,
};
