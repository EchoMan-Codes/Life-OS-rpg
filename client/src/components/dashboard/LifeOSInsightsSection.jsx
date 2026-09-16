import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Sparkles, ShieldAlert, Zap, Flame, HeartPulse } from 'lucide-react';

const INSIGHT_STYLES = {
  success: {
    bg: 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200',
    icon: Zap,
    iconColor: 'text-emerald-400',
  },
  warning: {
    bg: 'bg-amber-950/20 border-amber-800/40 text-amber-200',
    icon: ShieldAlert,
    iconColor: 'text-amber-400',
  },
  wellness: {
    bg: 'bg-teal-950/20 border-teal-800/40 text-teal-200',
    icon: HeartPulse,
    iconColor: 'text-teal-400',
  },
  momentum: {
    bg: 'bg-amber-950/20 border-amber-800/40 text-amber-200',
    icon: Flame,
    iconColor: 'text-amber-400',
  },
  neutral: {
    bg: 'bg-obsidian-900/60 border-glass-border text-ink-muted',
    icon: Sparkles,
    iconColor: 'text-gold',
  },
};

/**
 * Real Data-Driven LifeOS Insights.
 * Zero fabricated numbers: derived strictly from database state.
 */
export function LifeOSInsightsSection({
  insights = [],
  className = '',
}) {
  if (insights.length === 0) return null;

  return (
    <section className={clsx('space-y-3', className)}>
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-display-xs text-ink font-display font-semibold flex items-center gap-2">
          <Sparkles size={18} className="text-gold" />
          <span>LifeOS Insights & Signals</span>
        </h2>
        <span className="text-caption font-mono text-ink-muted">Authoritative Data</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((insight) => {
          const style = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.neutral;
          const Icon = style.icon;

          return (
            <div
              key={insight.id}
              className={clsx(
                'p-3.5 rounded-card border transition-all flex flex-col justify-between gap-2',
                style.bg
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-chip bg-obsidian-900/80 border border-glass-border shrink-0 mt-0.5">
                  <Icon size={14} className={style.iconColor} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-ink leading-tight">
                    {insight.title}
                  </h3>
                  <p className="text-caption text-ink-muted/90 mt-1 leading-normal">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

LifeOSInsightsSection.propTypes = {
  insights: PropTypes.array,
  className: PropTypes.string,
};
