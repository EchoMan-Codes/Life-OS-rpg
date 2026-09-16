import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Calendar,
  Flame,
  ListTodo,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCompleteDaily, useUndoDaily } from '@/features/dailies/hooks';
import { api } from '@/lib/axios';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/useToast';

const PRIORITY_BADGES = {
  critical: { label: 'Critical', bg: 'bg-red-950/40 text-red-300 border-red-800/50' },
  high: { label: 'High', bg: 'bg-amber-950/40 text-amber-300 border-amber-800/50' },
  medium: { label: 'Medium', bg: 'bg-blue-950/40 text-blue-300 border-blue-800/50' },
  low: { label: 'Low', bg: 'bg-obsidian-800 text-ink-muted border-glass-border' },
};

const ATTR_BADGES = {
  strength: 'text-attr-strength border-attr-strength/30 bg-attr-strength/10',
  intelligence: 'text-attr-intelligence border-attr-intelligence/30 bg-attr-intelligence/10',
  vitality: 'text-attr-vitality border-attr-vitality/30 bg-attr-vitality/10',
  willpower: 'text-attr-willpower border-attr-willpower/30 bg-attr-willpower/10',
  perception: 'text-attr-perception border-attr-perception/30 bg-attr-perception/10',
};

/**
 * Visual centerpiece: Today's Priorities action surface.
 * Fast, tactile checkboxes, clear priority indicators, and responsive tab filtering.
 */
export function TodayPrioritiesSection({
  priorityItems = [],
  completedDailies = [],
  completedQuests = [],
  onOpenCreateDaily,
  onOpenCreateQuest,
  className = '',
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'dailies' | 'quests' | 'completed'

  const filteredItems = useMemo(() => {
    if (activeTab === 'dailies') {
      return priorityItems.filter((item) => item.type === 'daily');
    }
    if (activeTab === 'quests') {
      return priorityItems.filter((item) => item.type === 'quest');
    }
    if (activeTab === 'completed') {
      const completedList = [
        ...completedDailies.map((d) => ({
          id: `done-daily-${d.id}`,
          rawId: d.id,
          type: 'daily',
          title: d.title,
          difficulty: d.difficulty,
          attribute: d.attribute,
          isComplete: true,
          entity: d,
        })),
        ...completedQuests.map((q) => ({
          id: `done-quest-${q.id}`,
          rawId: q.id,
          type: 'quest',
          title: q.title,
          priority: q.priority,
          attribute: q.attribute,
          isComplete: true,
          entity: q,
        })),
      ];
      return completedList;
    }
    return priorityItems;
  }, [priorityItems, completedDailies, completedQuests, activeTab]);

  return (
    <section className={clsx('space-y-3', className)}>
      {/* 1. Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-display-xs text-ink font-display font-semibold">Today’s Priorities</h2>
          <span className="px-2 py-0.5 rounded-full text-caption font-mono font-medium bg-obsidian-800 text-ink-muted border border-glass-border">
            {priorityItems.length}
          </span>
        </div>

        {/* Tab filters & Quick Add buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center rounded-panel bg-obsidian-900/80 p-0.5 border border-glass-border text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={clsx(
                'px-2.5 py-1 rounded-chip transition-colors font-medium',
                activeTab === 'all'
                  ? 'bg-glass text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dailies')}
              className={clsx(
                'px-2.5 py-1 rounded-chip transition-colors font-medium',
                activeTab === 'dailies'
                  ? 'bg-glass text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              Dailies
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quests')}
              className={clsx(
                'px-2.5 py-1 rounded-chip transition-colors font-medium',
                activeTab === 'quests'
                  ? 'bg-glass text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              Quests
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={clsx(
                'px-2.5 py-1 rounded-chip transition-colors font-medium',
                activeTab === 'completed'
                  ? 'bg-glass text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              Done ({completedDailies.length})
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenCreateDaily}
              className="flex items-center gap-1 px-2.5 py-1 rounded-chip bg-glass hover:bg-glass/80 border border-glass-border text-ink-muted hover:text-ink text-caption font-medium transition-colors min-h-[36px]"
            >
              <Plus size={13} />
              <span>Daily</span>
            </button>
            <button
              type="button"
              onClick={onOpenCreateQuest}
              className="flex items-center gap-1 px-2.5 py-1 rounded-chip bg-glass hover:bg-glass/80 border border-glass-border text-ink-muted hover:text-ink text-caption font-medium transition-colors min-h-[36px]"
            >
              <Plus size={13} />
              <span>Quest</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Priority Items Action List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="p-8 rounded-card border border-glass-border bg-obsidian-900/40 text-center flex flex-col items-center justify-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-emerald-950/50 border border-emerald-700/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-body font-medium text-ink">
                {activeTab === 'completed'
                  ? 'No completed tasks yet today.'
                  : 'All priority tasks clear for today!'}
              </p>
              <p className="text-caption text-ink-muted mt-0.5">
                {activeTab === 'completed'
                  ? 'Complete a daily ritual or quest subtask to see it logged here.'
                  : 'Take a mindful break, enter the Focus Chamber, or add a new goal.'}
              </p>
            </div>
            {activeTab !== 'completed' && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onOpenCreateDaily}
                  className="px-3 py-1.5 rounded-panel text-xs font-medium bg-glass hover:bg-glass/80 border border-glass-border text-ink transition-colors"
                >
                  + Add Daily
                </button>
                <Link
                  to="/focus"
                  className="px-3 py-1.5 rounded-panel text-xs font-medium bg-azure-600/80 hover:bg-azure-600 text-white transition-colors"
                >
                  Start Focus
                </Link>
              </div>
            )}
          </div>
        ) : (
          filteredItems.map((item) => (
            <PriorityItemRow
              key={item.id}
              item={item}
              isCompletedTab={activeTab === 'completed'}
            />
          ))
        )}
      </div>
    </section>
  );
}

/**
 * Individual interactive row for a priority item (Daily or Quest).
 */
function PriorityItemRow({ item }) {
  const isDaily = item.type === 'daily';
  const completeMutation = useCompleteDaily(item.rawId, item.entity);
  const undoMutation = useUndoDaily(item.rawId, item.entity);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const handleToggle = async () => {
    if (isDaily) {
      if (item.isComplete) {
        undoMutation.mutate();
      } else {
        completeMutation.mutate();
      }
    } else {
      // Quest 1-click complete
      try {
        await api.post(`/quests/${item.rawId}/complete`);
        queryClient.invalidateQueries({ queryKey: ['quests'] });
        queryClient.invalidateQueries({ queryKey: ['character'] });
        queryClient.invalidateQueries({ queryKey: ['battle-events'] });
        showToast({
          title: 'Quest Completed!',
          message: `${item.title} completed. Progression rewarded!`,
          type: 'success',
        });
      } catch (err) {
        showToast({
          title: 'Action Failed',
          message: err?.response?.data?.error?.message || 'Failed to complete quest.',
          type: 'error',
        });
      }
    }
  };

  const isPending = completeMutation.isPending || undoMutation.isPending;

  const priorityBadge = item.priority ? PRIORITY_BADGES[item.priority] : null;
  const attrBadge = item.attribute ? ATTR_BADGES[item.attribute] : null;

  return (
    <div
      className={clsx(
        'group p-3 sm:p-3.5 rounded-card border transition-all duration-150',
        'flex items-center justify-between gap-3',
        item.isOverdue
          ? 'bg-red-950/15 border-red-800/40 hover:border-red-700/60'
          : item.isComplete
          ? 'bg-obsidian-900/30 border-glass-border/40 opacity-70'
          : 'bg-obsidian-900/70 border-glass-border hover:border-glass-border-focus hover:bg-obsidian-900/90'
      )}
    >
      {/* Left: Interactive checkbox & Title Details */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          aria-label={item.isComplete ? `Mark ${item.title} as incomplete` : `Complete ${item.title}`}
          className={clsx(
            'p-1 -m-1 rounded-chip text-ink-muted hover:text-ink transition-colors shrink-0',
            'min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-glass-border'
          )}
        >
          {item.isComplete ? (
            <CheckCircle2 size={20} className="text-emerald-400" />
          ) : (
            <Circle size={20} className="text-ink-muted group-hover:text-ink transition-colors" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={clsx(
                'text-sm font-medium tracking-tight truncate',
                item.isComplete ? 'line-through text-ink-muted' : 'text-ink font-semibold'
              )}
            >
              {item.title}
            </span>

            {/* Subtle Overdue Alert */}
            {item.isOverdue && !item.isComplete && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-950 border border-red-800 text-red-300">
                <AlertCircle size={10} />
                OVERDUE
              </span>
            )}
          </div>

          {/* Subtext: Attribute, Difficulty/Priority, Checklist/Streak */}
          <div className="flex items-center gap-2 mt-0.5 text-caption text-ink-muted flex-wrap">
            {/* Entity type tag */}
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted/70">
              {isDaily ? 'Daily' : 'Quest'}
            </span>

            {/* Streak counter for dailies */}
            {isDaily && (item.streak || 0) > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-mono text-amber-300">
                <Flame size={11} className="text-amber-400" />
                {item.streak}
              </span>
            )}

            {/* Checklist items for quests */}
            {!isDaily && item.itemsCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-muted">
                <ListTodo size={11} />
                {item.completedItemsCount}/{item.itemsCount}
              </span>
            )}

            {/* Due date if available */}
            {item.dueDate && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono">
                <Calendar size={10} className="text-ink-muted/60" />
                {item.dueDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Badges & Link shortcut */}
      <div className="flex items-center gap-2 shrink-0">
        {priorityBadge && (
          <span
            className={clsx(
              'hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border',
              priorityBadge.bg
            )}
          >
            {priorityBadge.label}
          </span>
        )}

        {attrBadge && item.attribute && (
          <span
            className={clsx(
              'px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border',
              attrBadge
            )}
          >
            {item.attribute.slice(0, 3)}
          </span>
        )}

        <Link
          to={isDaily ? '/dailies' : '/quests'}
          aria-label={`Go to ${isDaily ? 'Dailies' : 'Quests'} page`}
          className="p-1 rounded-chip text-ink-muted/40 hover:text-ink hover:bg-glass transition-colors"
        >
          <ArrowUpRight size={15} />
        </Link>
      </div>
    </div>
  );
}

TodayPrioritiesSection.propTypes = {
  priorityItems: PropTypes.array,
  completedDailies: PropTypes.array,
  completedQuests: PropTypes.array,
  onOpenCreateDaily: PropTypes.func,
  onOpenCreateQuest: PropTypes.func,
  className: PropTypes.string,
};

PriorityItemRow.propTypes = {
  item: PropTypes.object.isRequired,
  isCompletedTab: PropTypes.bool,
};
