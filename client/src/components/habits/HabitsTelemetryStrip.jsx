import PropTypes from 'prop-types';
import { Flame, Target, Zap, CheckCircle2 } from 'lucide-react';
import { RitualFrame, ForgeChamber } from '@/components/habits/RitualFrame';

/**
 * HabitsTelemetryStrip — Structural Holographic Telemetry Pods.
 *
 * Implements the Structural Object Mandate:
 * - 4 distinct structural holographic HUD pods with angular rails and corner brackets
 * - Exact difficulty/discipline thematic color channels:
 *   1. Today: Cyan / Azure (Easy theme)
 *   2. Record: Vivid Violet (Medium theme)
 *   3. Total: Deep Electric Cobalt Blue (Difficult theme)
 *   4. Momentum: Arcane Azure / Cyan
 */
export function HabitsTelemetryStrip({
  totalHabits = 0,
  completedTodayCount = 0,
  bestOverallStreak = 0,
  activeStreaksCount = 0,
}) {
  const completionPercent = totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* ── 1. Today's Completions Pod (Light Cyan / Azure) ── */}
      <RitualFrame
        variant="easy"
        hasCrest={false}
        innerClassName="p-3.5 sm:p-4 flex flex-col justify-between h-full"
      >
        <div>
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
              [ CADENCE // TODAY ]
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-ink tracking-tight">
            {completedTodayCount}
            <span className="text-sm sm:text-base font-normal text-ink-muted">/{totalHabits}</span>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="w-full h-1.5 bg-obsidian-950 rounded-full overflow-hidden border border-cyan-500/20">
            <div
              className="h-full bg-linear-to-r from-cyan-500 to-cyan-300 transition-all duration-500 shadow-[0_0_8px_#22d3ee]"
              style={{ width: `${Math.min(completionPercent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted">
            <span>Forged today</span>
            <span className="text-cyan-300 font-semibold">{completionPercent}%</span>
          </div>
        </div>
      </RitualFrame>

      {/* ── 2. Peak Streak Record Pod (Vivid Violet) ── */}
      <RitualFrame
        variant="medium"
        hasCrest={false}
        innerClassName="p-3.5 sm:p-4 flex flex-col justify-between h-full"
      >
        <div>
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-purple-300 uppercase">
              [ RECORD // PEAK ]
            </span>
            <Flame className="w-3.5 h-3.5 text-purple-400 fill-purple-400/40" />
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-ink tracking-tight">
            {bestOverallStreak}
            <span className="text-sm sm:text-base font-normal text-purple-300/80">d</span>
          </div>
        </div>

        <ForgeChamber variant="inset" className="mt-3 py-1 px-2 text-[10px] font-mono text-ink-muted flex items-center justify-between">
          <span>Best streak record</span>
          <span className="text-purple-300 font-bold">{bestOverallStreak > 0 ? 'Verified' : 'Ready'}</span>
        </ForgeChamber>
      </RitualFrame>

      {/* ── 3. Total Tracked Arsenal Pod (Deep Electric Cobalt Blue) ── */}
      <RitualFrame
        variant="difficult"
        hasCrest={false}
        innerClassName="p-3.5 sm:p-4 flex flex-col justify-between h-full"
      >
        <div>
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-blue-200 uppercase">
              [ MATRIX // TOTAL ]
            </span>
            <Target className="w-3.5 h-3.5 text-blue-400" />
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-ink tracking-tight">
            {totalHabits}
          </div>
        </div>

        <ForgeChamber variant="inset" className="mt-3 py-1 px-2 text-[10px] font-mono text-ink-muted flex items-center justify-between">
          <span>Active disciplines</span>
          <span className="text-blue-300 font-bold">{totalHabits > 0 ? 'Loaded' : 'Empty'}</span>
        </ForgeChamber>
      </RitualFrame>

      {/* ── 4. Active Momentum Pod (Azure / Cyan) ── */}
      <RitualFrame
        variant="easy"
        hasCrest={false}
        innerClassName="p-3.5 sm:p-4 flex flex-col justify-between h-full"
      >
        <div>
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
              [ MOMENTUM // RUNNING ]
            </span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-ink tracking-tight">
            {activeStreaksCount}
          </div>
        </div>

        <ForgeChamber variant="inset" className="mt-3 py-1 px-2 text-[10px] font-mono text-ink-muted flex items-center justify-between">
          <span>Streaks active (≥1d)</span>
          <span className="text-amber-300 font-bold">{activeStreaksCount > 0 ? 'Amplified' : 'Standby'}</span>
        </ForgeChamber>
      </RitualFrame>
    </div>
  );
}

HabitsTelemetryStrip.propTypes = {
  totalHabits: PropTypes.number,
  completedTodayCount: PropTypes.number,
  bestOverallStreak: PropTypes.number,
  activeStreaksCount: PropTypes.number,
};

