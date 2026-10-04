import { useState, useCallback, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  Calendar,
  AlertTriangle,
  Circle,
  Diamond,
  Minus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trophy,
  Target,
  Sparkles,
  Coins,
  Bell,
} from 'lucide-react';
import clsx from 'clsx';

import { spring } from '@/lib/motionVariants';
import { playSound } from '@/lib/sound';
import { useFloatingText } from '@/features/character/floatingText';
import {
  useAddQuestItem,
  useCompleteQuest,
  useArchiveQuest,
  useDeleteQuest,
  useRestoreQuest,
  useUpdateQuest,
} from '@/features/quests/hooks';
import { ItemActionMenu } from '@/components/ui';
import { useJeevanTransition } from '@/context/JeevanTransitionContext';
import { QuestItemRow } from './QuestItemRow';

const PRIORITY_CONFIG = {
  critical: {
    label: 'CRITICAL PRIORITY',
    className: 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10',
  },
  high: {
    label: 'HIGH PRIORITY',
    className: 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  medium: {
    label: 'MEDIUM PRIORITY',
    className: 'text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
  },
  low: {
    label: 'LOW PRIORITY',
    className: 'text-slate-500 dark:text-ink-muted border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/[0.03]',
  },
};

const DIFFICULTY_CONFIG = {
  trivial: { label: 'TRIVIAL', xp: 15, gold: 5 },
  easy: { label: 'EASY', xp: 30, gold: 15 },
  medium: { label: 'MEDIUM', xp: 45, gold: 20 },
  hard: { label: 'HARD', xp: 60, gold: 30 },
};

export function QuestCard({ quest, onEdit }) {
  const shouldReduceMotion = useReducedMotion();
  const { spawnFloatingText } = useFloatingText();
  const { triggerTransition } = useJeevanTransition();
  const [itemsExpanded, setItemsExpanded] = useState(true);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const addItemMutation = useAddQuestItem();
  const completeQuestMutation = useCompleteQuest();
  const archiveMutation = useArchiveQuest();
  const deleteMutation = useDeleteQuest();
  const restoreMutation = useRestoreQuest();
  const updateMutation = useUpdateQuest();

  const isArchived = Boolean(quest.archivedAt);
  const isCompleted = quest.status === 'completed';

  const moveOptions = [
    { id: 'critical', label: 'Critical Priority', current: quest.priority === 'critical' },
    { id: 'high', label: 'High Priority', current: quest.priority === 'high' },
    { id: 'medium', label: 'Medium Priority', current: quest.priority === 'medium' },
    { id: 'low', label: 'Low Priority', current: quest.priority === 'low' },
  ];

  const handleMove = (destinationId) => {
    updateMutation.mutate({
      questId: quest.id,
      data: { priority: destinationId },
    });
  };

  const priorityInfo = PRIORITY_CONFIG[quest.priority] || PRIORITY_CONFIG.medium;
  const diffInfo = DIFFICULTY_CONFIG[quest.difficulty] || DIFFICULTY_CONFIG.medium;

  const items = quest.items || [];
  const milestones = quest.milestones || [];

  // Accurate dynamic progress calculation from subtasks
  const { completedCount, totalCount, progressPercent } = useMemo(() => {
    const total = items.length;
    if (total === 0) {
      return {
        completedCount: 0,
        totalCount: 0,
        progressPercent: isCompleted ? 100 : 0,
      };
    }
    const completed = items.filter((i) => i.isComplete).length;
    return {
      completedCount: completed,
      totalCount: total,
      progressPercent: Math.round((completed / total) * 100),
    };
  }, [items, isCompleted]);

  const xpReward = quest.reward?.xp || diffInfo.xp;
  const goldReward = quest.reward?.gold || diffInfo.gold;

  const handleAddItem = (e) => {
    e.preventDefault();
    const trimmed = newItemTitle.trim();
    if (!trimmed || addItemMutation.isPending) return;

    addItemMutation.mutate(
      { questId: quest.id, data: { title: trimmed } },
      {
        onSuccess: () => {
          setNewItemTitle('');
          setIsAddingItem(false);
        },
      }
    );
  };

  const handleDirectComplete = useCallback(() => {
    if (completeQuestMutation.isPending || isCompleted) return;

    playSound('quest_complete');
    spawnFloatingText(`+${xpReward} XP`, 'xp');
    if (goldReward > 0) {
      setTimeout(() => spawnFloatingText(`+${goldReward} Gold`, 'gold'), 120);
    }

    completeQuestMutation.mutate(quest.id);
    triggerTransition({
      variant: 'medium',
      message: 'Quest Conquered!',
      submessage: quest.title,
      duration: 1100,
    });
  }, [quest.id, quest.title, xpReward, goldReward, completeQuestMutation, isCompleted, spawnFloatingText, triggerTransition]);

  return (
    <motion.div
      layout={shouldReduceMotion ? false : 'position'}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
      className={clsx(
        'relative rounded-3xl p-4 sm:p-5 select-none transition-all duration-200 flex flex-col gap-3.5',
        'bg-white dark:bg-obsidian-900/80 backdrop-blur-2xl border',
        'border-slate-200/90 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]',
        isCompleted && 'opacity-70 bg-slate-50 dark:bg-obsidian-950/60'
      )}
    >
      {/* ── 1. Top Badges & Context Row ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Priority & Difficulty Pill */}
          <span
            className={clsx(
              'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border',
              priorityInfo.className
            )}
          >
            {priorityInfo.label} · {diffInfo.label}
          </span>

          {/* Reward Pill */}
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-gold border border-amber-500/20 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-500" />
            <span>+{xpReward} XP · +{goldReward} Coins</span>
          </span>

          {/* Due Date */}
          {quest.dueDate && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-slate-500 dark:text-ink-muted px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/5">
              <Calendar size={11} className="text-slate-400" />
              <span>Due {quest.dueDate}</span>
            </span>
          )}

          {/* Quest Reminder Badge */}
          {quest.reminderEnabled && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <Bell size={11} className="text-indigo-500" />
              <span>Reminder {quest.reminderTime || 'Active'}</span>
            </span>
          )}
        </div>

        {/* Action Menu */}
        <ItemActionMenu
          title={quest.title}
          entityName="Quest"
          onEdit={onEdit ? () => onEdit(quest) : undefined}
          moveOptions={moveOptions}
          onMove={handleMove}
          onArchive={() => archiveMutation.mutate(quest.id)}
          isArchived={isArchived}
          onRestore={() => restoreMutation.mutate(quest.id)}
          onDelete={() => deleteMutation.mutate(quest.id)}
        />
      </div>

      {/* ── 2. Dominant Title & Meaningful Description ── */}
      <div>
        <h3
          className={clsx(
            'text-base sm:text-lg font-bold text-slate-900 dark:text-ink font-display flex items-center gap-2',
            isCompleted && 'line-through text-slate-400 dark:text-ink-muted'
          )}
        >
          <Target size={18} className="text-amber-500 shrink-0" />
          <span>{quest.title}</span>
        </h3>
        {quest.description && (
          <p className="mt-1 text-xs text-slate-600 dark:text-ink-muted leading-relaxed font-medium line-clamp-3">
            {quest.description}
          </p>
        )}
      </div>

      {/* ── 3. Clean Progress Bar & Subtask State ── */}
      {totalCount > 0 ? (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600 dark:text-ink-muted font-medium">
              Progress: <strong className="text-slate-900 dark:text-ink">{completedCount} / {totalCount} subtasks</strong>
            </span>
            <span className="text-amber-600 dark:text-gold font-bold">{progressPercent}%</span>
          </div>

          <div className="relative w-full h-2.5 rounded-full bg-slate-100 dark:bg-obsidian-950/80 border border-slate-200 dark:border-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-amber-400 to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={spring.snappy}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between py-1 text-xs text-slate-500 dark:text-ink-muted border-t border-slate-100 dark:border-white/5 pt-2">
          <span className="italic">No subtasks yet</span>
          {!isCompleted && !isAddingItem && (
            <button
              type="button"
              onClick={() => setIsAddingItem(true)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Subtask</span>
            </button>
          )}
        </div>
      )}

      {/* ── 4. Subtasks Checklist ── */}
      <div className="flex flex-col gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
        {totalCount > 0 && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setItemsExpanded(!itemsExpanded)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink transition-colors py-0.5 cursor-pointer"
            >
              <span>Checklist ({completedCount}/{totalCount})</span>
              {itemsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {!isCompleted && !isAddingItem && (
              <button
                type="button"
                onClick={() => setIsAddingItem(true)}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Subtask</span>
              </button>
            )}
          </div>
        )}

        {itemsExpanded && (
          <div className="flex flex-col gap-1.5">
            {items.map((item) => (
              <QuestItemRow
                key={item.id}
                item={item}
                questId={quest.id}
                isQuestCompleted={isCompleted}
              />
            ))}

            {/* Inline Add Item Form */}
            {isAddingItem && (
              <form onSubmit={handleAddItem} className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="Enter subtask title..."
                  autoFocus
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-ink focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newItemTitle.trim() || addItemMutation.isPending}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-500 text-white disabled:opacity-50 active:scale-95 shadow-xs cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-2.5 py-2 text-xs text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ── 5. Primary Action CTA ── */}
      <div className="pt-1">
        {isCompleted ? (
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 size={16} />
            <span>Quest Conquered & Claimed!</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDirectComplete}
            disabled={completeQuestMutation.isPending}
            className={clsx(
              'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm',
              'transition-all duration-200 cursor-pointer active:scale-98 shadow-xs',
              totalCount === 0 || progressPercent === 100
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                : 'bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
            )}
          >
            <Trophy size={16} />
            <span>
              {progressPercent === 100 || totalCount === 0
                ? `Complete Quest (+${xpReward} XP)`
                : `Continue Quest (${completedCount}/${totalCount})`}
            </span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

QuestCard.propTypes = {
  quest: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    priority: PropTypes.string,
    difficulty: PropTypes.string,
    dueDate: PropTypes.string,
    status: PropTypes.string,
    reward: PropTypes.shape({
      xp: PropTypes.number,
      gold: PropTypes.number,
    }),
    items: PropTypes.array,
    milestones: PropTypes.array,
    archivedAt: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func,
};
