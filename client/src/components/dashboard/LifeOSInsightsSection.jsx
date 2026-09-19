import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Sparkles, ShieldAlert, Zap, Flame, HeartPulse } from 'lucide-react';

import { Card } from '@/components/ui/Card';

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
 * LifeOSInsightsSection — Real Data-Driven Tactical Intelligence.
 */
export function LifeOSInsightsSection({
  insights = [],
  className = '',
}) {
  if (insights.length === 0) return null;

  return (
    <section className={clsx('space-y-3.5 select-none', className)}>
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-display-xs text-ink font-display font-bold flex items-center gap-2">
            <Sparkles size={16} className="text-gold shrink-0" />
            <span>TACTICAL INTELLIGENCE</span>
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-obsidian-800 text-ink-muted border border-glass-border">
            [SYS SIGNALS]
          </span>
        </div>
        <span className="hidden sm:inline-block text-[11px] font-mono text-ink-muted">AUTHORITATIVE TELEMETRY</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {insights.map((insight) => {
          const style = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.neutral;
          const Icon = style.icon;

          return (
            <Card
              key={insight.id}
              variant="surface"
              className={clsx(
                'p-4 flex flex-col justify-between gap-2.5 transition-all relative overflow-hidden group',
                style.bg
              )}
            >
              {/* Top specular line */}
              <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-chip bg-obsidian-950/80 border border-glass-border shrink-0 mt-0.5 shadow-sm">
                  <Icon size={14} className={style.iconColor} />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="text-xs font-display font-bold text-ink leading-snug">
                    {insight.title}
                  </h3>
                  <p className="text-caption text-ink-muted leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </Card>
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
