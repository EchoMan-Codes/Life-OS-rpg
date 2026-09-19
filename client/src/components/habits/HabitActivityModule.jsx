import PropTypes from 'prop-types';
import { Flame, ShieldAlert, Activity, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import clsx from 'clsx';
import { ForgePanel, ForgeChamber } from '@/components/habits/RitualFrame';

function formatLogTime(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * HabitActivityModule — Structural Holographic Momentum & Scoring Audit Stream.
 *
 * Implements the Structural Object Mandate:
 * - Both panels built as structural holographic HUD instruments
 * - Inset dark-glass planes with framed chambers
 */
export function HabitActivityModule({
  habits = [],
  recentLogs = [],
  isLoading = false,
}) {
  // Filter for real high streaks (>= 3)
  const highStreakHabits = habits
    .filter((h) => h.currentStreak >= 3)
    .sort((a, b) => b.currentStreak - a.currentStreak);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* ══════════════════════════════════════════════════
          PANEL 1: ACTIVE DISCIPLINE MOMENTUM (VIVID VIOLET)
          ══════════════════════════════════════════════════ */}
      <ForgePanel
        variant="medium"
        hasCrest={true}
        innerClassName="p-4 sm:p-5 flex flex-col justify-between h-full"
      >
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400/50" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-purple-300 uppercase">
              [ DISCIPLINE MOMENTUM ]
            </span>
          </div>
          <h3 className="text-base font-bold text-ink mb-1 tracking-tight">Streak Amplification</h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            Streaks of 3+ consecutive executions establish neural permanence and character momentum.
          </p>
        </div>

        <div className="mt-4 space-y-2.5">
          {highStreakHabits.length > 0 ? (
            highStreakHabits.slice(0, 3).map((habit) => (
              <ForgeChamber
                key={habit.id}
                variant="inset"
                className="flex items-center justify-between p-2.5 border-purple-500/20"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-semibold text-ink truncate">{habit.title}</p>
                  <span className="text-[10px] font-mono text-ink-muted uppercase">
                    Best: {habit.bestStreak}d
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{habit.currentStreak}d</span>
                </div>
              </ForgeChamber>
            ))
          ) : (
            <ForgeChamber variant="inset" className="p-4 text-center border-dashed">
              <p className="text-xs font-mono text-ink-muted">
                Complete rituals consistently to unlock momentum signals.
              </p>
            </ForgeChamber>
          )}
        </div>
      </ForgePanel>

      {/* ══════════════════════════════════════════════════
          PANEL 2: REAL SCORING AUDIT STREAM (NEUTRAL / CYAN)
          ══════════════════════════════════════════════════ */}
      <ForgePanel
        variant="neutral"
        hasCrest={true}
        className="lg:col-span-2"
        innerClassName="p-4 sm:p-5"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
              [ RECENT SCORING AUDIT ]
            </span>
          </div>
          <span className="text-xs font-mono text-ink-muted">Last {recentLogs.length} events</span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs font-mono text-ink-muted animate-pulse">
            Loading activity audit stream...
          </div>
        ) : recentLogs.length === 0 ? (
          <ForgeChamber variant="inset" className="py-8 text-center border-dashed">
            <Clock className="w-6 h-6 mx-auto text-ink-muted/50 mb-2" />
            <p className="text-xs font-mono text-ink-muted">
              No recent habit executions logged yet. Score a ritual to start your audit stream.
            </p>
          </ForgeChamber>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => {
              const isPos = log.direction === 'positive';
              return (
                <ForgeChamber
                  key={log.id}
                  variant="inset"
                  className="flex items-center justify-between gap-3 p-2.5 sm:p-3 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={clsx(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border',
                        isPos
                          ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300'
                          : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                      )}
                    >
                      {isPos ? (
                        <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 stroke-[2.2]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink truncate flex items-center gap-1.5">
                        <span>{log.habitTitle}</span>
                        {log.isArchived && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-obsidian-800 text-ink-muted border border-white/10">
                            Archived
                          </span>
                        )}
                      </p>
                      <span className="text-[10px] font-mono text-ink-muted">
                        {formatLogTime(log.createdAt)} • {isPos ? 'Execution' : 'Slip Logged'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                    {isPos ? (
                      <>
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold">
                          +{log.xpAwarded} XP
                        </span>
                        {log.goldAwarded > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-300 font-bold">
                            +{log.goldAwarded} G
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        {log.hpChange} HP
                      </span>
                    )}
                  </div>
                </ForgeChamber>
              );
            })}
          </div>
        )}
      </ForgePanel>
    </div>
  );
}

HabitActivityModule.propTypes = {
  habits: PropTypes.array,
  recentLogs: PropTypes.array,
  isLoading: PropTypes.bool,
};

