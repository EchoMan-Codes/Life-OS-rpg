import { useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  Sparkles,
  Flame,
  Timer,
  CheckCircle2,
  Moon,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';

/**
 * Top command greeting with dynamic live status and 4 transparent Today at a Glance metrics.
 * Designed with calm visual hierarchy and restrained glass styling per user directives.
 */
export function DashboardGreeting({
  user,
  totalDailiesDueCount = 0,
  completedDailiesCount = 0,
  todayFocusMinutes = 0,
  maxActiveStreak = 0,
  taskCompletionRate = 0,
  hasActiveSession = false,
  isResting = false,
  onOpenCustomizer,
  className = '',
}) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const displayName = user?.displayName || 'Hero';

  return (
    <section className={clsx('space-y-4', className)}>
      {/* 1. Header Bar: Personalized Greeting & Calm Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-caption font-mono text-ink-muted uppercase tracking-wider">
              {formattedDate}
            </span>
            <span className="text-ink-muted/40">•</span>
            {isResting ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-950/70 border border-teal-700/50 text-teal-300">
                <Moon size={12} className="text-teal-400" />
                Rest Mode Active
              </span>
            ) : hasActiveSession ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-azure-950/70 border border-azure-700/50 text-azure-300">
                <Timer size={12} className="animate-spin text-azure-400" style={{ animationDuration: '3s' }} />
                Focus Session In Progress
              </span>
            ) : completedDailiesCount > 0 && completedDailiesCount >= totalDailiesDueCount ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/70 border border-emerald-700/50 text-emerald-300">
                <CheckCircle2 size={12} className="text-emerald-400" />
                Daily Rituals Complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-obsidian-800 border border-glass-border text-ink-muted">
                <Sparkles size={12} className="text-gold" />
                Ready to Flow
              </span>
            )}
          </div>

          <h1 className="text-display-md text-ink tracking-tight font-display">
            {greeting}, <span className="text-ink font-bold">{displayName}</span>
          </h1>
        </div>

        {/* Customization control */}
        <button
          type="button"
          onClick={onOpenCustomizer}
          aria-label="Customize dashboard sections"
          title="Customize dashboard layout"
          className={clsx(
            'self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-panel',
            'bg-glass hover:bg-glass/80 border border-glass-border text-ink-muted hover:text-ink',
            'text-xs font-medium transition-colors min-h-[40px]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-border'
          )}
        >
          <SlidersHorizontal size={14} />
          <span>Customize</span>
        </button>
      </div>

      {/* 2. Today at a Glance Summary Metric Strip (Transparent real numbers, no arbitrary 0-100 score) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Tasks Due & Completed Today */}
        <div className="p-3.5 rounded-card bg-obsidian-900/60 border border-glass-border/70 flex flex-col justify-between min-h-[92px]">
          <div className="flex items-center justify-between text-caption text-ink-muted font-medium">
            <span>Dailies Due Today</span>
            <CheckCircle2 size={15} className="text-emerald-400/80" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-display text-ink">
              {completedDailiesCount}
              <span className="text-sm font-normal text-ink-muted">/{totalDailiesDueCount}</span>
            </span>
            <span className="text-[11px] font-mono text-ink-muted">
              {totalDailiesDueCount > 0
                ? `${Math.max(0, totalDailiesDueCount - completedDailiesCount)} remaining`
                : 'All clear'}
            </span>
          </div>
        </div>

        {/* Metric 2: Deep Work Focus Minutes */}
        <div className="p-3.5 rounded-card bg-obsidian-900/60 border border-glass-border/70 flex flex-col justify-between min-h-[92px]">
          <div className="flex items-center justify-between text-caption text-ink-muted font-medium">
            <span>Deep Work Logged</span>
            <Timer size={15} className="text-azure-400/80" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-display text-ink">
              {todayFocusMinutes}
              <span className="text-sm font-normal text-ink-muted">m</span>
            </span>
            <span className="text-[11px] font-mono text-ink-muted">
              {todayFocusMinutes >= 50 ? 'Daily target reached' : 'Restores Mana'}
            </span>
          </div>
        </div>

        {/* Metric 3: Active Streak */}
        <div className="p-3.5 rounded-card bg-obsidian-900/60 border border-glass-border/70 flex flex-col justify-between min-h-[92px]">
          <div className="flex items-center justify-between text-caption text-ink-muted font-medium">
            <span>Active Streak</span>
            <Flame size={15} className="text-amber-400/80" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-display text-ink">
              {maxActiveStreak}
              <span className="text-sm font-normal text-ink-muted">d</span>
            </span>
            <span className="text-[11px] font-mono text-ink-muted">
              {maxActiveStreak > 0 ? 'Momentum protected' : 'Ready to build'}
            </span>
          </div>
        </div>

        {/* Metric 4: Daily Completion Rate */}
        <div className="p-3.5 rounded-card bg-obsidian-900/60 border border-glass-border/70 flex flex-col justify-between min-h-[92px]">
          <div className="flex items-center justify-between text-caption text-ink-muted font-medium">
            <span>Daily Ritual Rate</span>
            <TrendingUp size={15} className="text-attr-vitality/80" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-display text-ink">
              {totalDailiesDueCount > 0 ? `${taskCompletionRate}%` : '100%'}
            </span>
            <span className="text-[11px] font-mono text-ink-muted">
              {totalDailiesDueCount > 0 ? 'of today’s goals' : 'No pending tasks'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

DashboardGreeting.propTypes = {
  user: PropTypes.object,
  totalDailiesDueCount: PropTypes.number,
  completedDailiesCount: PropTypes.number,
  todayFocusMinutes: PropTypes.number,
  maxActiveStreak: PropTypes.number,
  taskCompletionRate: PropTypes.number,
  hasActiveSession: PropTypes.boolean,
  isResting: PropTypes.boolean,
  onOpenCustomizer: PropTypes.func,
  className: PropTypes.string,
};
