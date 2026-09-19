import PropTypes from 'prop-types';
import { Flame, Target, Zap } from 'lucide-react';
import { TelemetryCard } from '@/components/rpg/TelemetryCard';

/**
 * HabitsTelemetryStrip — 4-card telemetry grid for real-time discipline statistics.
 * Derives metrics strictly from real habit data and authoritative positive completions today.
 */
export function HabitsTelemetryStrip({
  totalHabits = 0,
  completedTodayCount = 0,
  bestOverallStreak = 0,
  activeStreaksCount = 0,
}) {
  const completionPercent = totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Today's Completions */}
      <TelemetryCard
        tag="TODAY"
        value={`${completedTodayCount}/${totalHabits}`}
        subtext="Rituals forged today"
        delta={`${completionPercent}% done`}
        progress={completionPercent}
        accentColor="cyan"
      />

      {/* 2. Best Streak Record */}
      <TelemetryCard
        tag="RECORD"
        value={`${bestOverallStreak}d`}
        subtext="Longest discipline streak"
        delta={bestOverallStreak > 0 ? 'Peak record' : 'Awaiting baseline'}
        icon={Flame}
        accentColor="amber"
      />

      {/* 3. Total Tracked */}
      <TelemetryCard
        tag="TOTAL"
        value={totalHabits}
        subtext="Tracked disciplines"
        delta={totalHabits > 0 ? 'Rituals loaded' : 'No habits yet'}
        icon={Target}
        accentColor="blue"
      />

      {/* 4. Momentum (Streaks >= 1) */}
      <TelemetryCard
        tag="MOMENTUM"
        value={activeStreaksCount}
        subtext="Active streaks (≥ 1)"
        delta={activeStreaksCount > 0 ? `${activeStreaksCount} running strong` : 'Zero active streaks'}
        icon={Zap}
        accentColor="emerald"
      />
    </div>
  );
}

HabitsTelemetryStrip.propTypes = {
  totalHabits: PropTypes.number,
  completedTodayCount: PropTypes.number,
  bestOverallStreak: PropTypes.number,
  activeStreaksCount: PropTypes.number,
};
