import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Timer, Play, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCurrentFocusSession, useFocusTimer, useCompleteFocusSession } from '@/features/focus/hooks';
import { useToast } from '@/components/ui/useToast';

/**
 * Focus Command Block: Primary execution surface.
 * Surfaces active session with real-time countdown or idle state with instant launch actions.
 */
export function FocusCommandSection({
  todayFocusMinutes = 0,
  completedSessionsCount = 0,
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
        title: 'Focus Completed!',
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

  return (
    <section className={clsx('space-y-3', className)}>
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-display-xs text-ink font-display font-semibold flex items-center gap-2">
          <Timer size={18} className="text-azure-400" />
          <span>Deep Work Chamber</span>
        </h2>

        <Link
          to="/focus"
          className="text-caption font-medium text-azure-400 hover:text-azure-300 transition-colors flex items-center gap-1"
        >
          <span>Full Chamber</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {currentSession ? (
        /* Active Focus Session Surface */
        <div className="p-4 sm:p-5 rounded-card bg-azure-950/25 border border-azure-700/50 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Timer visual */}
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 56 56">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.15)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="4"
                    strokeDasharray={150.8}
                    strokeDashoffset={150.8 * (1 - (timer.progress || 0))}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute text-caption font-mono font-bold text-azure-300">
                  {Math.round((timer.progress || 0) * 100)}%
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-azure-400">
                  SESSION IN PROGRESS
                </span>
                <div className="text-2xl font-bold font-mono text-ink tracking-tight">
                  {timer.formattedTime}
                </div>
                <p className="text-caption text-ink-muted">
                  {currentSession.ambientSound !== 'silence'
                    ? `Audio: ${currentSession.ambientSound}`
                    : 'Silent flow state'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Link
                to="/focus"
                className="px-3.5 py-2 rounded-panel text-xs font-semibold text-white bg-azure-600 hover:bg-azure-500 transition-colors min-h-[40px] flex items-center gap-1.5"
              >
                <span>Return to Chamber</span>
                <ArrowRight size={14} />
              </Link>

              {timer.isFinished && (
                <button
                  type="button"
                  onClick={handleCompleteActive}
                  disabled={completeMutation.isPending}
                  className="px-3 py-2 rounded-panel text-xs font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-700/60 hover:bg-emerald-900 transition-colors min-h-[40px] flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>{completeMutation.isPending ? 'Claiming...' : 'Claim Mana'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Idle Focus Surface */
        <div className="p-4 sm:p-5 rounded-card bg-obsidian-900/70 border border-glass-border flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">Ready for a Deep Work Block?</p>
              <p className="text-caption text-ink-muted mt-0.5">
                Full-screen Pomodoro flow state with procedural audio to regenerate Mana.
              </p>
            </div>

            <div className="flex items-center gap-3 text-caption font-mono text-ink-muted shrink-0">
              <span>Today: <strong className="text-ink">{todayFocusMinutes}m</strong></span>
              <span>•</span>
              <span>Sessions: <strong className="text-ink">{completedSessionsCount}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-glass-border/40">
            {/* Duration presets shortcuts */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => navigate('/focus')}
                className="px-2.5 py-1 rounded-chip text-caption font-mono bg-glass hover:bg-glass/80 border border-glass-border text-ink-muted hover:text-ink transition-colors min-h-[36px]"
              >
                15m Sprint
              </button>
              <button
                type="button"
                onClick={() => navigate('/focus')}
                className="px-2.5 py-1 rounded-chip text-caption font-mono bg-glass hover:bg-glass/80 border border-glass-border text-ink-muted hover:text-ink transition-colors min-h-[36px]"
              >
                25m Standard
              </button>
              <button
                type="button"
                onClick={() => navigate('/focus')}
                className="px-2.5 py-1 rounded-chip text-caption font-mono bg-glass hover:bg-glass/80 border border-glass-border text-ink-muted hover:text-ink transition-colors min-h-[36px]"
              >
                50m Deep
              </button>
            </div>

            <Link
              to="/focus"
              className="px-4 py-2 rounded-panel text-xs font-semibold text-white bg-azure-600 hover:bg-azure-500 transition-colors shadow-sm min-h-[40px] flex items-center gap-1.5"
            >
              <Play size={14} fill="currentColor" />
              <span>Start Focus</span>
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
