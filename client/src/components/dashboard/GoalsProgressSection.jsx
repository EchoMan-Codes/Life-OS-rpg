import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Target, ArrowRight, Clock, Plus, AlertCircle } from 'lucide-react';

/**
 * Active Goals & Projects tracker.
 * Shows milestones, checklist subtasks, and progress bars without clutter.
 */
export function GoalsProgressSection({
  activeQuests = [],
  onOpenCreateQuest,
  className = '',
}) {
  const displayQuests = activeQuests.slice(0, 3);

  return (
    <section className={clsx('space-y-3', className)}>
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-display-xs text-ink font-display font-semibold flex items-center gap-2">
            <Target size={18} className="text-amber-400" />
            <span>Active Goals & Quests</span>
          </h2>
          <span className="px-2 py-0.5 rounded-full text-caption font-mono font-medium bg-obsidian-800 text-ink-muted border border-glass-border">
            {activeQuests.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCreateQuest}
            aria-label="Add new quest"
            title="Create new quest"
            className="p-1.5 rounded-chip bg-glass hover:bg-glass/80 border border-glass-border text-ink-muted hover:text-ink transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <Plus size={14} />
          </button>
          <Link
            to="/quests"
            className="text-caption font-medium text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
          >
            <span>Quest Board</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {displayQuests.length === 0 ? (
        <div className="p-6 rounded-card border border-glass-border bg-obsidian-900/40 text-center flex flex-col items-center justify-center space-y-2">
          <p className="text-body font-medium text-ink">No active multi-step goals right now.</p>
          <p className="text-caption text-ink-muted max-w-sm">
            Quests break down long-term objectives into checklists and rewarding milestones.
          </p>
          <button
            type="button"
            onClick={onOpenCreateQuest}
            className="mt-1 px-3.5 py-1.5 rounded-panel text-xs font-medium bg-glass hover:bg-glass/80 border border-glass-border text-ink transition-colors"
          >
            + Set a New Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {displayQuests.map((quest) => {
            const completedCount = quest.items?.filter((i) => i.isComplete).length || 0;
            const totalCount = quest.items?.length || 0;
            const progress = quest.progressPercent || 0;
            const isFallingBehind = quest.dueDate && quest.dueDate < new Date().toISOString().slice(0, 10) && progress < 100;

            return (
              <div
                key={quest.id}
                className={clsx(
                  'p-4 rounded-card border bg-obsidian-900/60 transition-all flex flex-col justify-between gap-3',
                  isFallingBehind
                    ? 'border-red-800/50 bg-red-950/10'
                    : 'border-glass-border hover:border-glass-border-focus'
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-ink truncate flex-1">
                      {quest.title}
                    </span>
                    {quest.attribute && (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-obsidian-800 border border-glass-border text-ink-muted">
                        {quest.attribute.slice(0, 3)}
                      </span>
                    )}
                  </div>

                  {quest.description && (
                    <p className="text-caption text-ink-muted line-clamp-2 mb-2">
                      {quest.description}
                    </p>
                  )}
                </div>

                <div>
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-caption font-mono text-ink-muted">
                      <span>{totalCount > 0 ? `${completedCount}/${totalCount} milestones` : `${progress}%`}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-obsidian-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Deadline status */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-glass-border/30 text-[11px] font-mono">
                    {quest.dueDate ? (
                      <span className={clsx('flex items-center gap-1', isFallingBehind ? 'text-red-400 font-bold' : 'text-ink-muted')}>
                        {isFallingBehind ? <AlertCircle size={11} /> : <Clock size={11} />}
                        <span>Due {quest.dueDate}</span>
                      </span>
                    ) : (
                      <span className="text-ink-muted/60">Open-ended</span>
                    )}

                    <Link
                      to="/quests"
                      className="text-amber-400/80 hover:text-amber-300 transition-colors"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

GoalsProgressSection.propTypes = {
  activeQuests: PropTypes.array,
  onOpenCreateQuest: PropTypes.func,
  className: PropTypes.string,
};
