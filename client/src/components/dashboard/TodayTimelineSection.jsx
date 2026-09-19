import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Clock, CheckCircle2, Circle, Flame, Timer, Moon, Activity } from 'lucide-react';

import { Card } from '@/components/ui/Card';

const TIMELINE_ICONS = {
  habit: Flame,
  focus: Timer,
  daily: CheckCircle2,
  quest: CheckCircle2,
  reflection: Moon,
  battle: Activity,
};

/**
 * TodayTimelineSection — Chronological operational track for today's cycle.
 */
export function TodayTimelineSection({
  timeline = [],
  className = '',
}) {
  return (
    <section className={clsx('space-y-3.5 select-none', className)}>
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-display-xs text-ink font-display font-bold flex items-center gap-2">
            <Clock size={16} className="text-ink-muted shrink-0" />
            <span>OPERATIONAL TIMELINE</span>
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-obsidian-800 text-ink-muted border border-glass-border">
            [CHRONO LOG]
          </span>
        </div>
        <span className="hidden sm:inline-block text-[11px] font-mono text-ink-muted">TODAY'S TRACK</span>
      </div>

      <Card variant="surface" className="p-4 sm:p-5 relative overflow-hidden">
        {timeline.length === 0 ? (
          <div className="text-center py-6 text-ink-muted text-xs font-mono">
            // NO EVENTS LOGGED IN CURRENT CYCLE YET
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-linear-to-b before:from-white/20 before:via-white/10 before:to-transparent">
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
                        ? 'bg-emerald-500 text-obsidian-950 ring-2 ring-emerald-950 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : isActive
                        ? 'bg-azure-500 text-obsidian-950 ring-2 ring-azure-950 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                        : 'bg-obsidian-850 border border-glass-border text-ink-muted'
                    )}
                  >
                    <Icon size={9} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={clsx(
                          'text-xs font-display font-semibold truncate',
                          isCompleted ? 'line-through text-ink-muted' : 'text-ink'
                        )}
                      >
                        {item.title}
                      </span>
                      <span className="text-[11px] font-mono text-ink-muted/80 shrink-0">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-ink-muted/70 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
}

TodayTimelineSection.propTypes = {
  timeline: PropTypes.array,
  className: PropTypes.string,
};
