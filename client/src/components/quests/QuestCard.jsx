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
  Clock,
  Layers,
  XCircle,
  RotateCcw,
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
  useRecordQuestProgress,
  useCancelQuest,
} from '@/features/quests/hooks';
import { ItemActionMenu } from '@/components/ui';
import { useJeevanTransition } from '@/context/JeevanTransitionContext';
import { QuestItemRow } from './QuestItemRow';
import { QuestExtendModal } from './QuestExtendModal';

const PRIORITY_CONFIG = {
  critical: {
    label: 'CRITICAL',
    className: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  },
  high: {
    label: 'HIGH',
    className: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  medium: {
    label: 'MEDIUM',
    className: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
  },
  low: {
    label: 'LOW',
    className: 'text-ink-muted border-white/10 bg-white/[0.03]',
  },
};

const DURATION_CONFIG = {
  weekly: { label: 'Weekly', className: 'text-sky-300 border-sky-500/30 bg-sky-500/10' },
  monthly: { label: 'Monthly', className: 'text-purple-300 border-purple-500/30 bg-purple-500/10' },
  yearly: { label: 'Yearly', className: 'text-amber-300 border-amber-500/30 bg-amber-500/10' },
  custom: { label: 'Custom', className: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' },
};

export function QuestCard({ quest, onEdit }) {
  const shouldReduceMotion = useReducedMotion();
  const { spawnFloatingText } = useFloatingText();
  const { triggerTransition } = useJeevanTransition();

  const [itemsExpanded, setItemsExpanded] = useState(true);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);

  const addItemMutation = useAddQuestItem();
  const completeQuestMutation = useCompleteQuest();
  const archiveMutation = useArchiveQuest();
  const deleteMutation = useDeleteQuest();
  const restoreMutation = useRestoreQuest();
  const updateMutation = useUpdateQuest();
  const recordProgressMutation = useRecordQuestProgress();
  const cancelQuestMutation = useCancelQuest();

  const isArchived = Boolean(quest.archivedAt);
  const isCompleted = quest.status === 'completed';
  const isExpired = quest.status === 'expired';
  const isCancelled = quest.status === 'cancelled';
  const isActive = quest.status === 'active';

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
  const durationType = quest.questType || quest.type || 'weekly';
  const durationInfo = DURATION_CONFIG[durationType] || DURATION_CONFIG.weekly;

  const items = quest.items || [];
  const linkedTasks = quest.tasks || quest.linkedTasks || [];
  const progressMode = quest.progressMode || 'task';

  // Progress calculations according to progressMode
  const { currentValue, targetValue, progressPercent, displayMetric } = useMemo(() => {
    if (isCompleted) {
      return {
        currentValue: quest.targetValue || 1,
        targetValue: quest.targetValue || 1,
        progressPercent: 100,
        displayMetric: 'Completed',
      };
    }

    if (progressMode === 'count') {
      const cur = quest.currentValue || 0;
      const tgt = quest.targetValue || 1;
      const pct = Math.min(100, Math.round((cur / tgt) * 100));
      return {
        currentValue: cur,
        targetValue: tgt,
        progressPercent: pct,
        displayMetric: `${cur} / ${tgt} logged`,
      };
    }

    if (progressMode === 'task') {
      const total = linkedTasks.length;
      if (total === 0) {
        return {
          currentValue: quest.currentValue || 0,
          targetValue: quest.targetValue || 1,
          progressPercent: quest.progressPercent || 0,
          displayMetric: 'No linked tasks',
        };
      }
      const completed = linkedTasks.filter((t) => t.status === 'completed').length;
      return {
        currentValue: completed,
        targetValue: total,
        progressPercent: Math.round((completed / total) * 100),
        displayMetric: `${completed} / ${total} tasks`,
      };
    }

    // Default 'manual' / checklist
    const total = items.length;
    if (total === 0) {
      return {
        currentValue: 0,
        targetValue: 0,
        progressPercent: 0,
        displayMetric: 'No subtasks',
      };
    }
    const completed = items.filter((i) => i.isComplete).length;
    return {
      currentValue: completed,
      targetValue: total,
      progressPercent: Math.round((completed / total) * 100),
      displayMetric: `${completed} / ${total} subtasks`,
    };
  }, [quest, progressMode, linkedTasks, items, isCompleted]);

  const xpReward = quest.rewardXp || quest.reward?.xp || 200;
  const coinsReward = quest.rewardCoins || quest.reward?.gold || 40;

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

  const handleIncrementProgress = () => {
    if (!isActive || recordProgressMutation.isPending) return;
    recordProgressMutation.mutate({
      questId: quest.id,
      params: { delta: 1, eventId: `manual-inc-${Date.now()}` },
    });
  };

  const handleDirectComplete = useCallback(() => {
    if (completeQuestMutation.isPending || isCompleted) return;

    playSound('quest_complete');
    spawnFloatingText(`+${xpReward} XP`, 'xp');
    if (coinsReward > 0) {
      setTimeout(() => spawnFloatingText(`+${coinsReward} Coins`, 'gold'), 120);
    }

    completeQuestMutation.mutate(quest.id);
    triggerTransition({
      variant: 'medium',
      message: 'Quest Conquered!',
      submessage: quest.title,
      duration: 1100,
    });
  }, [quest.id, quest.title, xpReward, coinsReward, completeQuestMutation, isCompleted, spawnFloatingText, triggerTransition]);

  return (
    <>
      <motion.div
        layout={shouldReduceMotion ? false : 'position'}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
        className={clsx(
          'relative rounded-3xl p-4 sm:p-5 select-none transition-all duration-200 flex flex-col gap-3.5',
          'bg-white/[0.04] hover:bg-white/[0.07] backdrop-blur-2xl border',
          'border-white/10 hover:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.12)]',
          isCompleted && 'opacity-70 bg-white/[0.02]',
          isExpired && 'border-rose-500/30 bg-rose-500/[0.03]',
          isCancelled && 'opacity-50 grayscale'
        )}
      >
        {/* ── 1. Top Badges & Context Row ── */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Duration Type Badge */}
            <span
              className={clsx(
                'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border',
                durationInfo.className
              )}
            >
              {durationInfo.label}
            </span>

            {/* Category Badge */}
            {quest.category && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium text-ink-muted bg-white/[0.04] border border-white/5 capitalize">
                {quest.category.replace('_', ' ')}
              </span>
            )}

            {/* Priority Pill */}
            <span
              className={clsx(
                'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border',
                priorityInfo.className
              )}
            >
              {priorityInfo.label}
            </span>

            {/* Reward Pill */}
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-gold border border-amber-500/20 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-400" />
              <span>+{xpReward} XP · +{coinsReward} Coins</span>
            </span>

            {/* Due Date or Expired Pill */}
            {isExpired ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-rose-300 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30">
                <AlertTriangle size={11} className="text-rose-400" />
                <span>Expired ({quest.dueDate})</span>
              </span>
            ) : quest.dueDate ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-ink-muted px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/5">
                <Calendar size={11} className="text-slate-400" />
                <span>Due {quest.dueDate}</span>
              </span>
            ) : null}

            {isCancelled && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-ink-muted px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                <XCircle size={11} />
                <span>Cancelled</span>
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
            extraActions={[
              ...(isActive || isExpired
                ? [
                    {
                      label: 'Extend Deadline ⏳',
                      onClick: () => setExtendModalOpen(true),
                    },
                  ]
                : []),
              ...(isActive
                ? [
                    {
                      label: 'Cancel Quest (Free Slot)',
                      onClick: () => cancelQuestMutation.mutate(quest.id),
                    },
                  ]
                : []),
            ]}
          />
        </div>

        {/* ── 2. Dominant Title & Objective ── */}
        <div>
          <h3
            className={clsx(
              'text-base sm:text-lg font-bold text-ink font-display flex items-center gap-2',
              isCompleted && 'line-through text-ink-muted',
              isCancelled && 'line-through text-ink-muted'
            )}
          >
            <Target size={18} className="text-amber-500 shrink-0" />
            <span>{quest.title}</span>
          </h3>

          {quest.objective && (
            <p className="mt-1 text-xs text-amber-200/90 font-medium leading-relaxed bg-amber-500/[0.04] border border-amber-500/15 rounded-xl px-2.5 py-1.5">
              🎯 <strong>Objective:</strong> {quest.objective}
            </p>
          )}

          {quest.description && (
            <p className="mt-1 text-xs text-ink-muted leading-relaxed font-medium line-clamp-3">
              {quest.description}
            </p>
          )}
        </div>

        {/* ── 3. Progress Bar & Metric ── */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-ink-muted font-medium">
              Progress: <strong className="text-ink">{displayMetric}</strong>
            </span>
            <span className="text-gold font-bold">{progressPercent}%</span>
          </div>

          <div className="relative w-full h-2.5 rounded-full bg-obsidian-950/80 border border-white/10 overflow-hidden">
            <motion.div
              className={clsx(
                'h-full rounded-full',
                isExpired
                  ? 'bg-rose-500/60'
                  : 'bg-gradient-to-r from-indigo-500 via-amber-400 to-amber-500'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={spring.snappy}
            />
          </div>
        </div>

        {/* ── 4. Subtasks / Tasks or Count Controller ── */}
        {progressMode === 'count' && isActive && (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
            <span className="text-ink-muted">Quick Count Log:</span>
            <button
              type="button"
              onClick={handleIncrementProgress}
              disabled={recordProgressMutation.isPending}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-gold cursor-pointer active:scale-95 transition-all flex items-center gap-1"
            >
              <Plus size={14} />
              <span>+1 Session ({currentValue + 1}/{targetValue})</span>
            </button>
          </div>
        )}

        {progressMode === 'task' && linkedTasks.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-1 border-t border-white/5">
            <span className="text-[11px] font-semibold text-ink-muted">Linked Tasks ({displayMetric})</span>
            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
              {linkedTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                  <span className={clsx('text-ink', t.status === 'completed' && 'line-through text-ink-muted')}>
                    {t.title}
                  </span>
                  <span className={clsx('text-[10px] font-mono font-bold', t.status === 'completed' ? 'text-emerald-400' : 'text-amber-400')}>
                    {t.status === 'completed' ? 'DONE' : 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {progressMode === 'manual' && (
          <div className="flex flex-col gap-2 pt-1 border-t border-white/5">
            {items.length > 0 && (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setItemsExpanded(!itemsExpanded)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors py-0.5 cursor-pointer"
                >
                  <span>Checklist ({displayMetric})</span>
                  {itemsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {!isCompleted && !isAddingItem && (
                  <button
                    type="button"
                    onClick={() => setIsAddingItem(true)}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
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

                {isAddingItem && (
                  <form onSubmit={handleAddItem} className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      placeholder="Enter subtask title..."
                      autoFocus
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-ink focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                      className="px-2.5 py-2 text-xs text-ink-muted hover:text-ink rounded-xl"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 5. Primary Action CTA ── */}
        <div className="pt-1">
          {isCompleted ? (
            <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <CheckCircle2 size={16} />
              <span>Quest Conquered & Claimed!</span>
            </div>
          ) : isExpired ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExtendModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer active:scale-98 shadow-md"
              >
                <Clock size={16} />
                <span>Extend Deadline & Recover</span>
              </button>
            </div>
          ) : isCancelled ? (
            <div className="text-center py-2 text-xs text-ink-muted font-medium">
              Quest was cancelled. Active slot is free.
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDirectComplete}
              disabled={completeQuestMutation.isPending}
              className={clsx(
                'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm',
                'transition-all duration-200 cursor-pointer active:scale-98 shadow-xs',
                progressPercent === 100 || (items.length === 0 && linkedTasks.length === 0 && progressMode !== 'count')
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300'
              )}
            >
              <Trophy size={16} />
              <span>
                {progressPercent === 100
                  ? `Claim Completion Rewards (+${xpReward} XP)`
                  : `Complete Quest (+${xpReward} XP)`}
              </span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Extension Modal */}
      <QuestExtendModal
        isOpen={extendModalOpen}
        onClose={() => setExtendModalOpen(false)}
        quest={quest}
      />
    </>
  );
}

QuestCard.propTypes = {
  quest: PropTypes.object.isRequired,
  onEdit: PropTypes.func,
};
