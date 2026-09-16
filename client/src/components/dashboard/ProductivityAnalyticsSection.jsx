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

/**
 * Custom glass tooltip for Recharts.
 */
function CustomAnalyticsTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="p-2.5 rounded-panel bg-obsidian-900/95 border border-glass-border shadow-xl backdrop-blur-md text-xs space-y-1">
      <p className="font-semibold text-ink border-b border-glass-border/50 pb-1">{label}</p>
      {payload.map((entry, index) => (
        <div key={`entry-${index}`} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-ink-muted">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}:</span>
          </span>
          <span className="font-mono font-bold text-ink">
            {entry.value} {entry.dataKey === 'focusMinutes' ? 'min' : ''}
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
 * Weekly Activity & Productivity Analytics.
 * Authoritative data derived from real focus sessions and task completions.
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
    <section className={clsx('space-y-3', className)}>
      {/* Header with summary stats & filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-display-xs text-ink font-display font-semibold flex items-center gap-2">
            <BarChart3 size={18} className="text-teal-400" />
            <span>Productivity & Activity Velocity</span>
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-caption font-mono text-ink-muted">
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-azure-400" />
              <span>{Math.round(totalWeeklyFocusMinutes / 60)}h {totalWeeklyFocusMinutes % 60}m focus</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span>{totalWeeklyTasks} tasks</span>
            </span>
          </div>

          {/* Metric toggle */}
          <div className="flex items-center rounded-panel bg-obsidian-900/80 p-0.5 border border-glass-border text-xs">
            <button
              type="button"
              onClick={() => setMetricView('both')}
              className={clsx(
                'px-2.5 py-1 rounded-chip transition-colors font-medium',
                metricView === 'both' ? 'bg-glass text-ink' : 'text-ink-muted hover:text-ink'
              )}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setMetricView('focus')}
              className={clsx(
                'px-2.5 py-1 rounded-chip transition-colors font-medium',
                metricView === 'focus' ? 'bg-glass text-ink' : 'text-ink-muted hover:text-ink'
              )}
            >
              Focus
            </button>
            <button
              type="button"
              onClick={() => setMetricView('tasks')}
              className={clsx(
                'px-2.5 py-1 rounded-chip transition-colors font-medium',
                metricView === 'tasks' ? 'bg-glass text-ink' : 'text-ink-muted hover:text-ink'
              )}
            >
              Tasks
            </button>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="p-4 sm:p-5 rounded-card bg-obsidian-900/60 border border-glass-border">
        <div className="h-48 sm:h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#8C92A4', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
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
                  fill="#38BDF8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              )}
              {(metricView === 'both' || metricView === 'tasks') && (
                <Bar
                  dataKey="tasksCompleted"
                  name="Tasks Done"
                  fill="#34D399"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 pt-2 border-t border-glass-border/30 text-caption font-mono text-ink-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-azure-400" />
            <span>Deep Work (Minutes)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
            <span>Tasks / Dailies Completed</span>
          </div>
        </div>
      </div>
    </section>
  );
}

ProductivityAnalyticsSection.propTypes = {
  last7Days: PropTypes.array,
  className: PropTypes.string,
};
