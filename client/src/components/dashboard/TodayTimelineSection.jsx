import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Clock, CheckCircle2, Circle, Flame, Timer, Moon } from 'lucide-react';

const TIMELINE_ICONS = {
  habit: Flame,
  focus: Timer,
  daily: CheckCircle2,
  quest: CheckCircle2,
  reflection: Moon,
};

/**
 * Compact Today Timeline showing events, routines, and tasks in chronological order.
 */
export function TodayTimelineSection({
  timeline = [],
  className = '',
}) {
  return (
    <section className={clsx('space-y-3', className)}>
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-display-xs text-ink font-display font-semibold flex items-center gap-2">
          <Clock size={18} className="text-ink-muted" />
          <span>Today’s Flow & Timeline</span>
        </h2>
        <span className="text-caption font-mono text-ink-muted">Chronological</span>
      </div>

      <div className="p-4 sm:p-5 rounded-card bg-obsidian-900/60 border border-glass-border">
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-glass-border">
          {timeline.map((item) => {
            const isCompleted = item.status === 'completed';
            const isActive = item.status === 'active';
            const Icon = TIMELINE_ICONS[item.type] || Circle;

            return (
              <div key={item.id} className="relative flex items-start gap-3 group">
                {/* Node icon / indicator */}
                <div
                  className={clsx(
                    'absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center -translate-x-1/2 transition-colors',
                    isCompleted
                      ? 'bg-emerald-500 text-obsidian-950 ring-2 ring-emerald-950'
                      : isActive
                      ? 'bg-azure-500 text-obsidian-950 ring-2 ring-azure-950 animate-pulse'
                      : 'bg-obsidian-800 border border-glass-border text-ink-muted'
                  )}
                >
                  <Icon size={10} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={clsx(
                        'text-xs font-semibold truncate',
                        isCompleted ? 'line-through text-ink-muted' : 'text-ink'
                      )}
                    >
                      {item.title}
                    </span>
                    <span className="text-[11px] font-mono text-ink-muted/80 shrink-0">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-caption text-ink-muted/70 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

TodayTimelineSection.propTypes = {
  timeline: PropTypes.array,
  className: PropTypes.string,
};
