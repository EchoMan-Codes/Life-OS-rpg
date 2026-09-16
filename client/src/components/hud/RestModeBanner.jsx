import { useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Moon, ShieldCheck, X } from 'lucide-react';
import {
  useRestModeSuggestion,
  useRestModeStatus,
  useActivateRestMode,
} from '@/features/rest-mode/hooks';

/**
 * Quiet, non-modal banner suggesting Rest Mode when burnout conditions are detected.
 * Never a blocking modal popup per spec.
 */
export function RestModeBanner({ className = '' }) {
  const [dismissed, setDismissed] = useState(false);
  const { data: suggestion } = useRestModeSuggestion();
  const { data: restStatus } = useRestModeStatus();
  const activateMutation = useActivateRestMode();

  if (dismissed || !suggestion?.suggested || restStatus?.isActive) {
    return null;
  }

  const handleActivate = async () => {
    try {
      await activateMutation.mutateAsync({
        durationDays: 3,
        reason: suggestion.reason || 'Rest and recovery',
      });
    } catch (err) {
      console.error('Failed to activate rest mode:', err);
    }
  };

  return (
    <div
      role="region"
      aria-label="Rest Mode Suggestion"
      className={clsx(
        'relative rounded-panel p-4 mb-5',
        'bg-teal-950/40 border border-teal-800/50 text-teal-100 shadow-sm',
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3',
        className
      )}
    >
      <div className="flex items-start sm:items-center gap-3 pr-6">
        <div className="w-8 h-8 rounded-full bg-teal-900/60 border border-teal-700/50 flex items-center justify-center text-teal-300 shrink-0">
          <Moon size={16} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wide uppercase text-teal-300">
              Anti-Burnout Safety Valve
            </span>
          </div>
          <p className="text-xs text-teal-200/90 mt-0.5">
            {suggestion.reason || 'Take a breath. Daily reset HP penalties can be safely paused while you recover.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={handleActivate}
          disabled={activateMutation.isPending}
          className={clsx(
            'px-3.5 py-1.5 rounded-chip text-xs font-semibold transition-colors',
            'bg-teal-800 hover:bg-teal-700 text-white border border-teal-600/70',
            'min-h-[40px] flex items-center gap-1.5',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400',
            'disabled:opacity-50'
          )}
        >
          <ShieldCheck size={14} />
          <span>{activateMutation.isPending ? 'Activating...' : 'Turn on Rest Mode (3 Days)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss rest mode suggestion"
          title="Dismiss suggestion"
          className={clsx(
            'p-2 rounded-chip text-teal-400 hover:text-white hover:bg-teal-900/50 transition-colors',
            'min-h-[40px] min-w-[40px] flex items-center justify-center',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400'
          )}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

RestModeBanner.propTypes = {
  className: PropTypes.string,
};
