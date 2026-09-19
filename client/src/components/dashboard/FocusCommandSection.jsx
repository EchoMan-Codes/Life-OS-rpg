import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Play, ArrowRight, CheckCircle2, Activity } from 'lucide-react';

import { useCurrentFocusSession, useFocusTimer, useCompleteFocusSession } from '@/features/focus/hooks';
import { useToast } from '@/components/ui/useToast';

/**
 * FocusCommandSection — High-tech deep work execution block.
 *
 * Implements:
 * - Real-time active chamber status with live countdown ring and Mana claim trigger
 * - Precision idle state with progress gauge toward daily flow baseline (120m)
 * - Tactical quick presets ([15m SPRINT], [25m FLOW], [50m DEEP])
 */
export function FocusCommandSection({
  todayFocusMinutes = 0,
  completedSessionsCount: _completedSessionsCount = 0,
  className = '',
}) {
  const navigate = useNavigate();
  const { data: currentSession } = useCurrentFocusSession();
  const timer = useFocusTimer(currentSession);
  const completeMutation = useCompleteFocusSession();
  const { showToast } = useToast();

  const handleCompleteActive = async () => {
    if (!currentSession?.id) return;
    try {
      await completeMutation.mutateAsync(currentSession.id);
      showToast({
        title: 'Deep Work Logged!',
        message: 'Mana restored to your character.',
        type: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Completion Failed',
        message: err?.response?.data?.error?.message || 'Failed to complete focus session.',
        type: 'error',
      });
    }
  };

  const dailyTargetMinutes = 120;
  const progressRatio = Math.min(1, todayFocusMinutes / dailyTargetMinutes);

  return (
    <section className={clsx('space-y-3.5 select-none', className)}>
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-display-xs text-ink font-display font-bold flex items-center gap-2">
          <Activity size={16} className="text-azure-400 animate-pulse" />
          <span>DEEP WORK CHAMBER</span>
        </h2>

        <Link
          to="/focus"
          className="text-caption font-mono text-azure-400 hover:text-azure-300 transition-colors flex items-center gap-1"
        >
          <span>FULL CHAMBER</span>
          <ArrowRight size={12} />
        </Link>
      </div>

      {currentSession ? (
        /* Active Focus Session Surface */
        <div className="relative p-4 sm:p-5 rounded-card-lg bg-linear-to-br from-azure-950/40 via-obsidian-900 to-obsidian-900 border border-azure-500/50 shadow-[0_0_24px_rgba(56,189,248,0.18)] overflow-hidden">
          {/* Top Specular Rim */}
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-azure-400/60 to-transparent" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            {/* Timer visual */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.15)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="4"
                    strokeDasharray={163.3}
                    strokeDashoffset={163.3 * (1 - (timer.progress || 0))}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute text-caption font-mono font-bold text-azure-300">
                  {Math.round((timer.progress || 0) * 100)}%
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-azure-400">
                  // CHAMBER ENGAGED
                </span>
                <div className="text-3xl font-bold font-mono tabular-nums text-ink tracking-tight">
                  {timer.formattedTime}
                </div>
                <p className="text-caption font-mono text-ink-muted">
                  {currentSession.ambientSound !== 'silence'
                    ? `AUDIO // ${currentSession.ambientSound.toUpperCase()}`
                    : 'SILENT FLOW RESONANCE'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              <Link
                to="/focus"
                className="px-4 py-2 rounded-panel text-xs font-mono font-bold tracking-wider text-obsidian bg-azure-400 hover:bg-azure-300 transition-all min-h-10 flex items-center gap-1.5 shadow-glow"
              >
                <span>RESUME</span>
                <ArrowRight size={13} />
              </Link>

              {timer.isFinished && (
                <button
                  type="button"
                  onClick={handleCompleteActive}
                  disabled={completeMutation.isPending}
                  className="px-3.5 py-2 rounded-panel text-xs font-mono font-bold tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-600/70 hover:bg-emerald-900 transition-colors min-h-10 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                >
                  <CheckCircle2 size={14} />
                  <span>{completeMutation.isPending ? 'RESTORING...' : 'CLAIM MANA'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Idle Focus Surface */
        <div className="relative p-4 sm:p-5 rounded-card-lg bg-obsidian-900/80 border border-glass-border flex flex-col justify-between gap-4 backdrop-blur-md shadow-elevation-surface">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-[10px] font-mono tracking-widest text-azure-400 uppercase">
                // MANA REGENERATION CHAMBER
              </div>
              <h3 className="text-base font-display font-bold text-ink">
                Initialize Deep Work Block
              </h3>
              <p className="text-caption text-ink-muted max-w-sm">
                Full-screen distraction-free execution with spatial binaural atmosphere to restore Mana.
              </p>
            </div>

            {/* Daily Target Progress Gauge */}
            <div className="flex items-center gap-3 p-2 rounded-card bg-obsidian-950/60 border border-glass-border/60 shrink-0">
              <div className="relative w-11 h-11 flex items-center justify-center">
                <svg className="w-11 h-11 -rotate-90 transform" viewBox="0 0 48 48">
                  <circle
                    cx="24"
                    cy="24"
                    r="19"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="19"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="3.5"
                    strokeDasharray={119.4}
                    strokeDashoffset={119.4 * (1 - progressRatio)}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute text-[10px] font-mono font-bold text-ink">
                  {Math.round(progressRatio * 100)}%
                </span>
              </div>
              <div className="text-right pr-1">
                <div className="text-xs font-mono font-bold tabular-nums text-ink">
                  {todayFocusMinutes} / {dailyTargetMinutes}m
                </div>
                <div className="text-[10px] font-mono text-ink-muted">
                  DAILY TARGET
                </div>
              </div>
            </div>
          </div>

          {/* Quick presets and Enter Chamber action */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-glass-border/40">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/focus')}
                className="px-2.5 py-1 rounded-chip text-[11px] font-mono bg-obsidian-800 hover:bg-obsidian-750 border border-glass-border text-ink-muted hover:text-ink transition-colors min-h-8.5"
              >
                [15m SPRINT]
              </button>
              <button
                type="button"
                onClick={() => navigate('/focus')}
                className="px-2.5 py-1 rounded-chip text-[11px] font-mono bg-obsidian-800 hover:bg-obsidian-750 border border-glass-border text-ink-muted hover:text-ink transition-colors min-h-8.5"
              >
                [25m FLOW]
              </button>
              <button
                type="button"
                onClick={() => navigate('/focus')}
                className="px-2.5 py-1 rounded-chip text-[11px] font-mono bg-obsidian-800 hover:bg-obsidian-750 border border-glass-border text-ink-muted hover:text-ink transition-colors min-h-8.5"
              >
                [50m DEEP]
              </button>
            </div>

            <Link
              to="/focus"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-panel text-xs font-mono font-bold tracking-wider text-obsidian bg-azure-400 hover:bg-azure-300 transition-all shadow-glow min-h-9.5"
            >
              <Play size={13} fill="currentColor" />
              <span>INITIALIZE CHAMBER</span>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

FocusCommandSection.propTypes = {
  todayFocusMinutes: PropTypes.number,
  completedSessionsCount: PropTypes.number,
  className: PropTypes.string,
};
