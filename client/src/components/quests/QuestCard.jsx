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
    label: 'Critical',
    icon: AlertTriangle,
    className: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  },
  high: {
    label: 'High',
    icon: Circle,
    className: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  medium: {
    label: 'Medium',
    icon: Diamond,
    className: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
  },
  low: {
    label: 'Low',
    icon: Minus,
    className: 'text-ink-muted border-glass-border/40 bg-white/[0.02]',
  },
};

const DIFFICULTY_CONFIG = {
  trivial: { label: 'Trivial', xp: 15, gold: 5 },
  easy: { label: 'Easy', xp: 30, gold: 15 },
  medium: { label: 'Medium', xp: 45, gold: 20 },
  hard: { label: 'Hard', xp: 60, gold: 30 },
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
  const PriorityIcon = priorityInfo.icon;
  const diffInfo = DIFFICULTY_CONFIG[quest.difficulty] || DIFFICULTY_CONFIG.medium;

  const items = quest.items || [];

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
        'bg-white/60 dark:bg-obsidian-900/70 hover:bg-white/80 dark:hover:bg-obsidian-900/90 backdrop-blur-2xl border',
        'border-slate-200/80 hover:border-slate-300 dark:border-glass-border/70 dark:hover:border-glass-border shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]',
        isCompleted && 'opacity-70 dark:bg-obsidian-950/50'
      )}
    >
      {/* ── 1. Top Badges & Context Row ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Priority Pill with Distinct Shape (Accessibility) */}
          <span
            className={clsx(
              'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border inline-flex items-center gap-1.5',
              priorityInfo.className
            )}
          >
            <PriorityIcon size={11} className={clsx(quest.priority === 'high' && 'fill-current', quest.priority === 'medium' && 'fill-current')} />
            <span>{priorityInfo.label}</span>
          </span>

          {/* Difficulty Tag */}
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold text-slate-600 dark:text-ink-muted bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-glass-border/40">
            {diffInfo.label}
          </span>

          {/* Reward Pill */}
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-gold border border-amber-500/20 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-500" />
            <span>+{xpReward} XP · +{goldReward} Coins</span>
          </span>

          {/* Due Date */}
          {quest.dueDate && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-slate-500 dark:text-ink-muted px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200/70 dark:border-glass-border/40">
              <Calendar size={11} className="text-slate-400" />
              <span>Due {quest.dueDate}</span>
            </span>
          )}

          {/* Quest Reminder Badge */}
          {quest.reminderEnabled && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <Bell size={11} className="text-indigo-500" />
              <span>{quest.reminderTime || 'Reminder'}</span>
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

      {/* ── 2. Dominant Title & Description ── */}
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

      {/* ── 3. Clean Progress Bar & 25% / 50% / 75% / 100% Milestone Nodes ── */}
      {totalCount > 0 ? (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600 dark:text-ink-muted font-medium">
              Milestone Progress: <strong className="text-slate-900 dark:text-ink font-semibold">{completedCount} / {totalCount} subtasks</strong>
            </span>
            <span className="text-amber-600 dark:text-gold font-bold">{progressPercent}%</span>
          </div>

          <div className="relative pt-1 pb-3">
            <div className="relative w-full h-2 rounded-full bg-slate-200 dark:bg-obsidian-950/90 border border-slate-300/70 dark:border-glass-border overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-amber-400 to-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={spring.snappy}
              />
            </div>

            {/* Milestone Diamond Markers at 25%, 50%, 75%, 100% */}
            <div className="absolute inset-x-0 top-0.5 flex justify-between pointer-events-none px-1">
              {[25, 50, 75, 100].map((tier) => {
                const reached = progressPercent >= tier;
                return (
                  <div
                    key={tier}
                    style={{ left: `${tier}%`, transform: 'translateX(-50%)' }}
                    className="absolute -top-0.5 flex flex-col items-center group pointer-events-auto"
                    title={`${tier}% Milestone Threshold`}
                  >
                    <div
                      className={clsx(
                        'w-3 h-3 rotate-45 rounded-[2px] border transition-all duration-300 flex items-center justify-center',
                        reached
                          ? 'bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.6)] scale-110'
                          : 'bg-white dark:bg-obsidian-900 border-slate-300 dark:border-glass-border text-slate-400 dark:text-ink-muted/50'
                      )}
                    >
                      <div
                        className={clsx(
                          'w-0.5 h-0.5 rounded-full',
                          reached ? 'bg-obsidian-950' : 'bg-slate-400 dark:bg-ink-muted/30'
                        )}
                      />
                    </div>
                    <span
                      className={clsx(
                        'text-[8px] font-mono mt-1 font-semibold transition-colors',
                        reached ? 'text-amber-600 dark:text-gold' : 'text-slate-400 dark:text-ink-muted/50'
                      )}
                    >
                      {tier}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between py-1 text-xs text-slate-500 dark:text-ink-muted border-t border-slate-100 dark:border-glass-border/30 pt-2">
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
      <div className="flex flex-col gap-2 pt-1 border-t border-slate-100 dark:border-glass-border/30">
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
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-glass-border text-slate-900 dark:text-ink focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newItemTitle.trim() || addItemMutation.isPending}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white disabled:opacity-50 active:scale-95 shadow-xs cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-2.5 py-2 text-xs text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
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
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md font-extrabold'
                : 'bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
            )}
          >
            <Trophy size={16} />
            <span>
              {progressPercent === 100 || totalCount === 0
                ? `Conquer Quest (+${xpReward} XP · +${goldReward} Coins)`
                : `Continue Campaign (${completedCount}/${totalCount})`}
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
