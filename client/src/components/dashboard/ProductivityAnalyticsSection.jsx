import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { BarChart3, Clock, CheckCircle2 } from 'lucide-react';

import { Card } from '@/components/ui/Card';

/**
 * Custom glass tooltip for Recharts with sci-fi telemetry formatting.
 */
function CustomAnalyticsTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="p-3 rounded-card bg-obsidian-950/95 border border-white/15 shadow-2xl backdrop-blur-xl text-xs space-y-1.5 min-w-35">
      <p className="font-mono font-bold text-ink border-b border-glass-border/50 pb-1 uppercase tracking-wider text-[11px]">
        CYCLE // {label}
      </p>
      {payload.map((entry, index) => (
        <div key={`entry-${index}`} className="flex items-center justify-between gap-3 font-mono">
          <span className="flex items-center gap-1.5 text-ink-muted text-[11px]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}:</span>
          </span>
          <span className="font-bold text-ink">
            {entry.value} {entry.dataKey === 'focusMinutes' ? 'm' : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

CustomAnalyticsTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

/**
 * ProductivityAnalyticsSection — 7-Day Velocity & Deep Work Analytics.
 */
export function ProductivityAnalyticsSection({
  last7Days = [],
  className = '',
}) {
  const [metricView, setMetricView] = useState('both'); // 'both' | 'focus' | 'tasks'

  const totalWeeklyFocusMinutes = useMemo(() => {
    return last7Days.reduce((acc, d) => acc + (d.focusMinutes || 0), 0);
  }, [last7Days]);

  const totalWeeklyTasks = useMemo(() => {
    return last7Days.reduce((acc, d) => acc + (d.tasksCompleted || 0), 0);
  }, [last7Days]);

  return (
    <section className={clsx('space-y-3.5 select-none', className)}>
      {/* Header with summary stats & filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-display-xs text-ink font-display font-bold flex items-center gap-2">
            <BarChart3 size={16} className="text-teal-400" />
            <span>VELOCITY TELEMETRY</span>
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-obsidian-800 text-ink-muted border border-glass-border">
            [7-DAY CYCLE]
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 text-[11px] font-mono text-ink-muted">
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-azure-400" />
              <span>{Math.round(totalWeeklyFocusMinutes / 60)}h {totalWeeklyFocusMinutes % 60}m</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={11} className="text-emerald-400" />
              <span>{totalWeeklyTasks} cleared</span>
            </span>
          </div>

          {/* Metric toggle */}
          <div className="flex items-center rounded-panel bg-obsidian-900/90 p-0.5 border border-glass-border text-xs font-mono">
            {[
              { key: 'both', label: 'OVERVIEW' },
              { key: 'focus', label: 'FOCUS' },
              { key: 'tasks', label: 'TASKS' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMetricView(tab.key)}
                className={clsx(
                  'px-2.5 py-1 rounded-chip transition-all text-[11px] font-medium',
                  metricView === tab.key
                    ? 'bg-glass text-ink shadow-sm font-semibold border border-white/10'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart container Card */}
      <Card variant="surface" className="p-4 sm:p-5 relative overflow-hidden">
        <div className="h-48 sm:h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0284C7" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="tasksGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#8C92A4', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#8C92A4', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomAnalyticsTooltip />} />
              {(metricView === 'both' || metricView === 'focus') && (
                <Bar
                  dataKey="focusMinutes"
                  name="Focus Minutes"
                  fill="url(#focusGradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
              )}
              {(metricView === 'both' || metricView === 'tasks') && (
                <Bar
                  dataKey="tasksCompleted"
                  name="Tasks Cleared"
                  fill="url(#tasksGradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 pt-2.5 border-t border-glass-border/30 text-[11px] font-mono text-ink-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-azure-400 shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
            <span>Deep Work (Minutes)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
            <span>Protocols Cleared</span>
          </div>
        </div>
      </Card>
    </section>
  );
}

ProductivityAnalyticsSection.propTypes = {
  last7Days: PropTypes.array,
  className: PropTypes.string,
};
