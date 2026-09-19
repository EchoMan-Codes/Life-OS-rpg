import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Target, ArrowRight, Clock, Plus, AlertCircle, Compass } from 'lucide-react';

import { Card } from '@/components/ui/Card';

const ATTR_COLORS = {
  strength: 'text-attr-strength border-attr-strength/40 bg-attr-strength/10',
  intelligence: 'text-attr-intelligence border-attr-intelligence/40 bg-attr-intelligence/10',
  vitality: 'text-attr-vitality border-attr-vitality/40 bg-attr-vitality/10',
  willpower: 'text-attr-willpower border-attr-willpower/40 bg-attr-willpower/10',
  perception: 'text-attr-perception border-attr-perception/40 bg-attr-perception/10',
};

/**
 * GoalsProgressSection — Active strategic campaigns & multi-step quest lines.
 */
export function GoalsProgressSection({
  activeQuests = [],
  onOpenCreateQuest,
  className = '',
}) {
  const displayQuests = activeQuests.slice(0, 3);

  return (
    <section className={clsx('space-y-3.5 select-none', className)}>
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-display-xs text-ink font-display font-bold flex items-center gap-2">
            <Target size={16} className="text-amber-400 shrink-0" />
            <span>ACTIVE CAMPAIGNS & GOALS</span>
          </h2>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-obsidian-800 text-ink-muted border border-glass-border">
            [{activeQuests.length} STRATEGIC]
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCreateQuest}
            aria-label="Add new campaign"
            title="Create new quest"
            className="p-1.5 rounded-chip bg-glass hover:bg-glass/80 border border-glass-border text-ink-muted hover:text-ink transition-colors min-h-8.5 min-w-8.5 flex items-center justify-center"
          >
            <Plus size={13} />
          </button>
          <Link
            to="/quests"
            className="text-caption font-mono text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
          >
            <span>CAMPAIGN LOG</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {displayQuests.length === 0 ? (
        <Card variant="surface" className="p-6 text-center flex flex-col items-center justify-center space-y-2.5">
          <Compass size={24} className="text-ink-muted" />
          <div>
            <p className="text-sm font-display font-semibold text-ink">No active long-range campaigns.</p>
            <p className="text-caption text-ink-muted max-w-sm mt-0.5">
              Quests coordinate multi-stage milestones with structured progression rewards.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCreateQuest}
            className="mt-1 px-3.5 py-1.5 rounded-panel text-xs font-mono font-medium bg-glass hover:bg-glass/80 border border-glass-border text-ink transition-colors"
          >
            + INITIALIZE CAMPAIGN
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {displayQuests.map((quest) => {
            const completedCount = quest.items?.filter((i) => i.isComplete).length || 0;
            const totalCount = quest.items?.length || 0;
            const progress = quest.progressPercent || 0;
            const isFallingBehind = quest.dueDate && quest.dueDate < new Date().toISOString().slice(0, 10) && progress < 100;
            const attrClass = ATTR_COLORS[quest.attribute] || 'text-ink-muted border-glass-border bg-obsidian-800';

            return (
              <Card
                key={quest.id}
                variant="interactive"
                as="div"
                className={clsx(
                  'p-4 flex flex-col justify-between gap-3 relative overflow-hidden group',
                  isFallingBehind && 'border-red-800/60 bg-red-950/15'
                )}
              >
                {/* Top specular accent */}
                <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-display font-bold text-ink truncate flex-1">
                      {quest.title}
                    </h3>
                    {quest.attribute && (
                      <span className={clsx('text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded border', attrClass)}>
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

                <div className="space-y-2">
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
                      <span>{totalCount > 0 ? `[${completedCount}/${totalCount} MILESTONES]` : 'PROGRESS'}</span>
                      <span className="font-bold text-ink">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-obsidian-800 overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-amber-500 to-amber-300 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Deadline & link */}
                  <div className="flex items-center justify-between pt-2 border-t border-glass-border/30 text-[11px] font-mono">
                    {quest.dueDate ? (
                      <span className={clsx('flex items-center gap-1', isFallingBehind ? 'text-red-400 font-bold' : 'text-ink-muted')}>
                        {isFallingBehind ? <AlertCircle size={11} /> : <Clock size={11} />}
                        <span>TARGET // {quest.dueDate}</span>
                      </span>
                    ) : (
                      <span className="text-ink-muted/50">OPEN PROTOCOL</span>
                    )}

                    <Link
                      to="/quests"
                      className="text-amber-400/90 hover:text-amber-300 transition-colors flex items-center gap-0.5"
                    >
                      <span>DETAILS</span>
                      <ArrowRight size={10} />
                    </Link>
                  </div>
                </div>
              </Card>
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
