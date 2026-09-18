import { useState, useCallback } from 'react';
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
  MoreVertical,
  Edit2,
  Trash2,
  Trophy,
} from 'lucide-react';
import clsx from 'clsx';

import { spring } from '@/lib/motionVariants';
import { playSound } from '@/lib/sound';
import { useFloatingText } from '@/features/character/floatingText';
import { useAddQuestItem, useCompleteQuest, useArchiveQuest } from '@/features/quests/hooks';
import { QuestItemRow } from './QuestItemRow';

const PRIORITY_CONFIG = {
  critical: {
    label: 'Critical',
    icon: AlertTriangle,
    className: 'text-hp border-hp/40 bg-hp/10',
  },
  high: {
    label: 'High',
    icon: Circle,
    className: 'text-attr-willpower border-attr-willpower/40 bg-attr-willpower/10',
  },
  medium: {
    label: 'Medium',
    icon: Diamond,
    className: 'text-attr-intelligence border-attr-intelligence/40 bg-attr-intelligence/10',
  },
  low: {
    label: 'Low',
    icon: Minus,
    className: 'text-ink-muted border-glass-border bg-obsidian-800/40',
  },
};

const DIFFICULTY_CONFIG = {
  trivial: { label: 'Trivial', className: 'text-ink-muted border-glass-border' },
  easy: { label: 'Easy', className: 'text-attr-vitality border-attr-vitality/30' },
  medium: { label: 'Medium', className: 'text-attr-intelligence border-attr-intelligence/30' },
  hard: { label: 'Hard', className: 'text-attr-strength border-attr-strength/30' },
};

export function QuestCard({ quest, onEdit }) {
  const shouldReduceMotion = useReducedMotion();
  const { spawnFloatingText } = useFloatingText();
  const [itemsExpanded, setItemsExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const addItemMutation = useAddQuestItem();
  const completeQuestMutation = useCompleteQuest();
  const archiveMutation = useArchiveQuest();

  const isCompleted = quest.status === 'completed';
  const priorityInfo = PRIORITY_CONFIG[quest.priority] || PRIORITY_CONFIG.medium;
  const PriorityIcon = priorityInfo.icon;
  const difficultyInfo = DIFFICULTY_CONFIG[quest.difficulty] || DIFFICULTY_CONFIG.medium;

  const items = quest.items || [];
  const milestones = quest.milestones || [];
  const progressPercent = quest.progressPercent || 0;

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
    spawnFloatingText(`+${quest.reward?.xp || 35} XP`, 'xp');
    setTimeout(() => {
      spawnFloatingText(`+${quest.reward?.gold || 18} Gold`, 'gold');
    }, 150);

    completeQuestMutation.mutate(quest.id);
  }, [quest.id, quest.reward, completeQuestMutation, isCompleted, spawnFloatingText]);

  return (
    <motion.div
      layout={shouldReduceMotion ? false : 'position'}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
      className={clsx(
        'relative rounded-panel p-5 select-none transition-all duration-200',
        'bg-obsidian-900/80 backdrop-blur-glass border border-glass-border',
        'shadow-panel hover:border-glass-border/80 flex flex-col gap-4',
        isCompleted && 'opacity-75 bg-obsidian-900/50'
      )}
    >
      {/* ── Top Header Row ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Priority Badge (Shape + Color) */}
          <span
            className={clsx(
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
              priorityInfo.className
            )}
            title={`Priority: ${priorityInfo.label}`}
          >
            <PriorityIcon className="w-3 h-3 shrink-0" />
            <span>{priorityInfo.label}</span>
          </span>

          {/* Difficulty Badge */}
          <span
            className={clsx(
              'px-2 py-0.5 rounded-full text-xs font-medium border bg-obsidian-950/40',
              difficultyInfo.className
            )}
          >
            {difficultyInfo.label} ({quest.reward?.xp} XP / {quest.reward?.gold} G)
          </span>

          {/* Due Date Badge */}
          {quest.dueDate && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted px-2 py-0.5 rounded-full bg-obsidian-950/30 border border-glass-border/40">
              <Calendar className="w-3 h-3 text-ink-muted" />
              <span>{quest.dueDate}</span>
            </span>
          )}
        </div>

        {/* Action Menu (>= 44x44px target) */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Quest options"
            className="flex items-center justify-center w-11 h-11 -mr-2 -mt-2 rounded-full text-ink-muted hover:text-ink hover:bg-glass/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-attr-intelligence"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-10 w-36 py-1 z-30 rounded-lg bg-obsidian-900 border border-glass-border shadow-panel backdrop-blur-glass">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(quest);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-ink hover:bg-glass/10 transition-colors text-left"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Quest</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    archiveMutation.mutate(quest.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-hp hover:bg-hp/10 transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Archive</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Title & Description ── */}
      <div>
        <h3
          className={clsx(
            'text-display-xs text-ink font-semibold break-words',
            isCompleted && 'line-through text-ink-muted'
          )}
        >
          {quest.title}
        </h3>
        {quest.description && (
          <p className="mt-1 text-body-sm text-ink-muted line-clamp-2 break-words">
            {quest.description}
          </p>
        )}
      </div>

      {/* ── Progress Bar & Milestone Markers ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-ink-muted font-mono">
          <span>Progress ({quest.completedItems}/{quest.totalItems} subtasks)</span>
          <span className="text-ink font-semibold">{progressPercent}%</span>
        </div>

        <div className="relative w-full h-2 rounded-full bg-obsidian-950/60 border border-glass-border/30 overflow-visible flex items-center">
          {/* Progress fill */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-attr-intelligence via-attr-vitality to-gold transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Milestone diamond markers at 25%, 50%, 75%, 100% */}
          {milestones.map((m) => {
            const isReached = m.isReached || progressPercent >= m.thresholdPercent;
            return (
              <div
                key={m.id}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group/marker z-10"
                style={{ left: `${m.thresholdPercent}%` }}
                title={`${m.thresholdPercent}% Milestone: ${m.title} (+${m.xpBonus} XP, +${m.goldBonus} G)`}
              >
                <div
                  className={clsx(
                    'w-3.5 h-3.5 rotate-45 rounded-[2px] border flex items-center justify-center transition-all duration-300',
                    isReached
                      ? 'bg-gold border-gold text-obsidian-950 shadow-glow'
                      : 'bg-obsidian-900 border-glass-border text-ink-muted'
                  )}
                >
                  {isReached && <div className="w-1.5 h-1.5 rounded-full bg-obsidian-950 -rotate-45" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Checklist Subtasks Section ── */}
      <div className="flex flex-col gap-2 pt-1 border-t border-glass-border/30">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setItemsExpanded(!itemsExpanded)}
            className="flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors py-1 cursor-pointer focus:outline-none"
          >
            <span>Subtasks ({items.length})</span>
            {itemsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {!isCompleted && !isAddingItem && (
            <button
              type="button"
              onClick={() => setIsAddingItem(true)}
              className="flex items-center gap-1 text-xs text-attr-intelligence hover:text-attr-intelligence/80 transition-colors cursor-pointer py-1 px-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subtask</span>
            </button>
          )}
        </div>

        <div
          className={clsx(
            'grid transition-all duration-200 ease-out',
            itemsExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
          )}
        >
          <div className="overflow-hidden flex flex-col gap-1.5">
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
                  className="flex-1 px-3 py-2 text-body-sm rounded-lg bg-obsidian-950/60 border border-glass-border text-ink focus:outline-none focus:border-attr-intelligence"
                />
                <button
                  type="submit"
                  disabled={!newItemTitle.trim() || addItemMutation.isPending}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-attr-intelligence text-obsidian-950 disabled:opacity-50 min-h-[40px] hit-area-expand"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-2 py-2 text-xs text-ink-muted hover:text-ink min-h-[40px] hit-area-expand"
                >
                  Cancel
                </button>
              </form>
            )}

            {items.length === 0 && !isAddingItem && (
              <p className="text-xs text-ink-muted italic py-1">
                No subtasks added yet. Complete directly or add steps.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Status / Complete CTA ── */}
      <div className="pt-2 flex items-center justify-between">
        {isCompleted ? (
          <div className="flex items-center gap-2 text-attr-vitality text-body-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Quest Conquered!</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDirectComplete}
            disabled={completeQuestMutation.isPending}
            className={clsx(
              'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm',
              'transition-all duration-200 min-h-[44px]',
              items.length === 0 || progressPercent === 100
                ? 'bg-attr-vitality text-obsidian-950 hover:bg-attr-vitality/90 shadow-glow cursor-pointer'
                : 'bg-glass/10 border border-glass-border text-ink hover:bg-glass/20 cursor-pointer'
            )}
          >
            <Trophy className="w-4 h-4" />
            <span>Complete Quest (+{quest.reward?.xp} XP)</span>
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
    status: PropTypes.string.isRequired,
    progressPercent: PropTypes.number,
    totalItems: PropTypes.number,
    completedItems: PropTypes.number,
    reward: PropTypes.shape({
      xp: PropTypes.number,
      gold: PropTypes.number,
    }),
    items: PropTypes.arrayOf(PropTypes.object),
    milestones: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  onEdit: PropTypes.func,
};
