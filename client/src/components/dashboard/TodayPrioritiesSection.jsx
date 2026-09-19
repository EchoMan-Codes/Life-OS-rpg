import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { useCompleteDaily, useUndoDaily } from '@/features/dailies/hooks';
import { api } from '@/lib/axios';
import { useToast } from '@/components/ui/useToast';
import { DifficultyBadge } from '@/components/rpg';


const ATTR_BADGES = {
  strength: 'text-attr-strength border-attr-strength/40 bg-attr-strength/10',
  intelligence: 'text-attr-intelligence border-attr-intelligence/40 bg-attr-intelligence/10',
  vitality: 'text-attr-vitality border-attr-vitality/40 bg-attr-vitality/10',
  willpower: 'text-attr-willpower border-attr-willpower/40 bg-attr-willpower/10',
  perception: 'text-attr-perception border-attr-perception/40 bg-attr-perception/10',
};

/**
 * TodayPrioritiesSection — High-tech directive execution center.
 * Features:
 * - Featured Primary Directive (elevated hero card with +XP particle feedback)
 * - Secondary Directive Stack (clean modular command rows with priority accents)
 * - Tactile filter pills & instant quick add actions
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
      return [
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
    }
    return priorityItems;
  }, [priorityItems, completedDailies, completedQuests, activeTab]);

  // When on "all", feature the top item prominently
  const featuredItem = activeTab === 'all' && filteredItems.length > 0 ? filteredItems[0] : null;
  const secondaryItems = activeTab === 'all' && filteredItems.length > 0 ? filteredItems.slice(1) : filteredItems;

  return (
    <section className={clsx('space-y-3.5 select-none', className)}>
      {/* 1. Tactical Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-display-xs text-ink font-display font-bold flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            <span>TODAY’S DIRECTIVES</span>
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-obsidian-800 text-ink-muted border border-glass-border">
            [{priorityItems.length} PENDING]
          </span>
        </div>

        {/* Tab filters & Quick Add buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          <div className="flex items-center rounded-panel bg-obsidian-900/90 p-0.5 border border-glass-border text-xs font-mono">
            {[
              { key: 'all', label: 'ALL' },
              { key: 'dailies', label: 'DAILIES' },
              { key: 'quests', label: 'QUESTS' },
              { key: 'completed', label: `CLEARED [${completedDailies.length + completedQuests.length}]` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={clsx(
                  'px-2.5 py-1 rounded-chip transition-all font-medium text-[11px]',
                  activeTab === tab.key
                    ? 'bg-glass text-ink shadow-sm font-semibold border border-white/10'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenCreateDaily}
              title="Add new daily protocol"
              className="flex items-center gap-1 px-2.5 py-1 rounded-chip bg-glass hover:bg-glass/80 border border-glass-border text-ink-muted hover:text-ink text-[11px] font-mono font-medium transition-colors min-h-8.5"
            >
              <Plus size={12} />
              <span>+ DAILY</span>
            </button>
            <button
              type="button"
              onClick={onOpenCreateQuest}
              title="Add new quest directive"
              className="flex items-center gap-1 px-2.5 py-1 rounded-chip bg-glass hover:bg-glass/80 border border-glass-border text-ink-muted hover:text-ink text-[11px] font-mono font-medium transition-colors min-h-8.5"
            >
              <Plus size={12} />
              <span>+ QUEST</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Priority Items Action List */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 rounded-card-lg border border-glass-border bg-obsidian-900/50 backdrop-blur-md text-center flex flex-col items-center justify-center space-y-2.5 shadow-elevation-surface">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                // PROTOCOL STATUS: ALL CLEAR
              </div>
              <p className="text-base font-display font-bold text-ink mt-0.5">
                {activeTab === 'completed'
                  ? 'No completed directives in current cycle.'
                  : 'All Scheduled Protocols Successfully Executed!'}
              </p>
              <p className="text-caption text-ink-muted mt-1 max-w-sm">
                {activeTab === 'completed'
                  ? 'Complete a daily ritual or quest objective to log execution.'
                  : 'Take a restorative break, initialize the Deep Work Chamber, or set new milestones.'}
              </p>
            </div>
            {activeTab !== 'completed' && (
              <div className="flex items-center gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={onOpenCreateDaily}
                  className="px-3.5 py-1.5 rounded-panel text-xs font-mono font-semibold bg-glass hover:bg-glass/80 border border-glass-border text-ink transition-colors"
                >
                  + ADD PROTOCOL
                </button>
                <Link
                  to="/focus"
                  className="px-3.5 py-1.5 rounded-panel text-xs font-mono font-semibold bg-azure-600 hover:bg-azure-500 text-white transition-colors shadow-glow"
                >
                  ENTER FOCUS CHAMBER
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Featured Primary Directive Card (Only on 'all' view) */}
            {featuredItem && (
              <FeaturedDirectiveCard item={featuredItem} />
            )}

            {/* Secondary Directives Stack */}
            <div className="space-y-2">
              {secondaryItems.map((item) => (
                <PriorityItemRow
                  key={item.id}
                  item={item}
                  isCompletedTab={activeTab === 'completed'}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/**
 * Featured Primary Directive Card with tactile feedback.
 */
function FeaturedDirectiveCard({ item }) {
  const isDaily = item.type === 'daily';
  const completeMutation = useCompleteDaily(item.rawId, item.entity);
  const undoMutation = useUndoDaily(item.rawId, item.entity);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showXpFeedback, setShowXpFeedback] = useState(false);

  const handleToggle = async () => {
    if (isDaily) {
      if (item.isComplete) {
        undoMutation.mutate();
      } else {
        setShowXpFeedback(true);
        setTimeout(() => setShowXpFeedback(false), 1200);
        completeMutation.mutate();
      }
    } else {
      try {
        setShowXpFeedback(true);
        setTimeout(() => setShowXpFeedback(false), 1200);
        await api.post(`/quests/${item.rawId}/complete`);
        queryClient.invalidateQueries({ queryKey: ['quests'] });
        queryClient.invalidateQueries({ queryKey: ['character'] });
        queryClient.invalidateQueries({ queryKey: ['battle-events'] });
        showToast({
          title: 'Directive Cleared!',
          message: `${item.title} completed. Progression rewarded!`,
          type: 'success',
        });
      } catch (err) {
        showToast({
          title: 'Action Failed',
          message: err?.response?.data?.error?.message || 'Failed to complete directive.',
          type: 'error',
        });
      }
    }
  };

  const isPending = completeMutation.isPending || undoMutation.isPending;
  const attrBadge = item.attribute ? ATTR_BADGES[item.attribute] : null;

  return (
    <div className="relative p-4 sm:p-5 rounded-card-lg border border-accent-primary/50 bg-linear-to-r from-obsidian-900 via-obsidian-850 to-obsidian-900 shadow-[0_0_24px_rgba(56,189,248,0.14)] backdrop-blur-xl overflow-hidden group">
      {/* Cybernetic Corner Brackets (Image 2 Solo Leveling Inspired) */}
      <span className="absolute top-1 left-2 font-mono text-[10px] font-bold text-accent-primary/70 select-none pointer-events-none" aria-hidden="true">┌</span>
      <span className="absolute top-1 right-2 font-mono text-[10px] font-bold text-accent-primary/70 select-none pointer-events-none" aria-hidden="true">┐</span>
      <span className="absolute bottom-1 left-2 font-mono text-[10px] font-bold text-accent-primary/70 select-none pointer-events-none" aria-hidden="true">└</span>
      <span className="absolute bottom-1 right-2 font-mono text-[10px] font-bold text-accent-primary/70 select-none pointer-events-none" aria-hidden="true">┘</span>

      {/* Top Specular Rim Highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-accent-primary/80 to-transparent" />

      {/* Floating +XP reward particle feedback */}
      <AnimatePresence>
        {showXpFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -28, scale: 1.15 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute left-8 top-2 z-30 pointer-events-none flex items-center gap-1 font-mono font-bold text-xs text-gold bg-obsidian-950/90 px-2 py-0.5 rounded-full border border-gold/40 shadow-glow"
          >
            <Sparkles size={11} className="text-gold" />
            <span>+25 XP</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          {/* Tactile Checkbox Button */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            aria-label={item.isComplete ? `Mark ${item.title} as incomplete` : `Complete ${item.title}`}
            className="mt-0.5 p-1 -m-1 rounded-chip text-ink-muted hover:text-ink transition-all shrink-0 min-h-11 min-w-11 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            {item.isComplete ? (
              <CheckCircle2 size={24} className="text-emerald-400" />
            ) : (
              <Circle size={24} className="text-accent-primary/70 group-hover:text-accent-primary group-hover:scale-110 transition-all" />
            )}
          </button>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold tracking-wider text-accent-primary uppercase px-2 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/30">
                // FEATURED DIRECTIVE
              </span>
              <DifficultyBadge difficulty={item.difficulty || item.priority || 'medium'} size="sm" />
            </div>

            <h3 className={clsx('text-base font-display font-bold text-ink truncate', item.isComplete && 'line-through text-ink-muted')}>
              {item.title}
            </h3>

            <div className="flex items-center gap-2.5 text-caption text-ink-muted font-mono flex-wrap pt-0.5">
              <span className="text-[11px] uppercase">
                {isDaily ? 'DAILY PROTOCOL' : 'QUEST CAMPAIGN'}
              </span>

              {isDaily && (item.streak || 0) > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-300">
                  <Flame size={11} className="text-amber-400" />
                  <span>{item.streak}d streak</span>
                </span>
              )}

              {!isDaily && item.itemsCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <ListTodo size={11} />
                  <span>{item.completedItemsCount}/{item.itemsCount} tasks</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side attribute tag & quick link */}
        <div className="flex items-center gap-2 shrink-0">
          {attrBadge && item.attribute && (
            <span className={clsx('px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border', attrBadge)}>
              {item.attribute}
            </span>
          )}
          <Link
            to={isDaily ? '/dailies' : '/quests'}
            aria-label="View in dedicated manager"
            className="p-1.5 rounded-chip text-ink-muted/50 hover:text-ink hover:bg-glass transition-colors"
          >
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual interactive row for secondary priority items.
 */
function PriorityItemRow({ item }) {
  const isDaily = item.type === 'daily';
  const completeMutation = useCompleteDaily(item.rawId, item.entity);
  const undoMutation = useUndoDaily(item.rawId, item.entity);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showXpFeedback, setShowXpFeedback] = useState(false);

  const handleToggle = async () => {
    if (isDaily) {
      if (item.isComplete) {
        undoMutation.mutate();
      } else {
        setShowXpFeedback(true);
        setTimeout(() => setShowXpFeedback(false), 1200);
        completeMutation.mutate();
      }
    } else {
      try {
        setShowXpFeedback(true);
        setTimeout(() => setShowXpFeedback(false), 1200);
        await api.post(`/quests/${item.rawId}/complete`);
        queryClient.invalidateQueries({ queryKey: ['quests'] });
        queryClient.invalidateQueries({ queryKey: ['character'] });
        queryClient.invalidateQueries({ queryKey: ['battle-events'] });
        showToast({
          title: 'Directive Cleared!',
          message: `${item.title} completed. Progression rewarded!`,
          type: 'success',
        });
      } catch (err) {
        showToast({
          title: 'Action Failed',
          message: err?.response?.data?.error?.message || 'Failed to complete directive.',
          type: 'error',
        });
      }
    }
  };

  const isPending = completeMutation.isPending || undoMutation.isPending;
  const attrBadge = item.attribute ? ATTR_BADGES[item.attribute] : null;

  return (
    <div
      className={clsx(
        'relative group p-3 sm:p-3.5 rounded-card border transition-all duration-150',
        'flex items-center justify-between gap-3',
        item.isOverdue
          ? 'bg-red-950/15 border-red-800/40 hover:border-red-700/60'
          : item.isComplete
          ? 'bg-obsidian-900/30 border-glass-border/30 opacity-70'
          : 'bg-obsidian-900/70 border-glass-border hover:border-glass-border-strong hover:bg-obsidian-850/80 shadow-sm'
      )}
    >
      {/* Floating +XP reward particle feedback */}
      <AnimatePresence>
        {showXpFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -24 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute left-10 top-1 z-30 pointer-events-none font-mono font-bold text-[11px] text-gold bg-obsidian-950/90 px-1.5 py-0.5 rounded border border-gold/40"
          >
            +15 XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left: Interactive checkbox & Details */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          aria-label={item.isComplete ? `Mark ${item.title} as incomplete` : `Complete ${item.title}`}
          className={clsx(
            'p-1 -m-1 rounded-chip text-ink-muted hover:text-ink transition-colors shrink-0',
            'min-h-11 min-w-11 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-glass-border'
          )}
        >
          {item.isComplete ? (
            <CheckCircle2 size={19} className="text-emerald-400" />
          ) : (
            <Circle size={19} className="text-ink-muted group-hover:text-ink transition-colors" />
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

            {item.isOverdue && !item.isComplete && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-950 border border-red-800 text-red-300">
                <AlertCircle size={10} />
                OVERDUE
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-caption text-ink-muted font-mono flex-wrap">
            <span className="text-[10px] uppercase text-ink-muted/70">
              {isDaily ? 'Daily' : 'Quest'}
            </span>

            {isDaily && (item.streak || 0) > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-300">
                <Flame size={11} className="text-amber-400" />
                {item.streak}
              </span>
            )}

            {!isDaily && item.itemsCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px]">
                <ListTodo size={11} />
                {item.completedItemsCount}/{item.itemsCount}
              </span>
            )}

            {item.dueDate && (
              <span className="inline-flex items-center gap-1 text-[10px]">
                <Calendar size={10} className="text-ink-muted/60" />
                {item.dueDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Badges & Link shortcut */}
      <div className="flex items-center gap-2 shrink-0">
        <DifficultyBadge
          difficulty={item.difficulty || item.priority || 'low'}
          size="sm"
          className="hidden sm:inline-flex"
        />

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

FeaturedDirectiveCard.propTypes = {
  item: PropTypes.object.isRequired,
};

PriorityItemRow.propTypes = {
  item: PropTypes.object.isRequired,
  isCompletedTab: PropTypes.bool,
};
