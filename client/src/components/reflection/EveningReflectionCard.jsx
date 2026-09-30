import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Moon, Smile, Zap, Target, CheckCircle2 } from 'lucide-react';

import {
  useTodayReflection,
  useCreateReflection,
  useUpdateReflection,
} from '@/features/reflections/hooks';

const SCORE_LABELS = {
  mood: {
    1: 'Rough / Low',
    2: 'Subdued',
    3: 'Neutral / Balanced',
    4: 'Content / Good',
    5: 'Euphoric / Vibrant',
  },
  energy: {
    1: 'Drained / Exhausted',
    2: 'Fatigued',
    3: 'Steady',
    4: 'Energized',
    5: 'Electric / Peak',
  },
  focus: {
    1: 'Scattered / Foggy',
    2: 'Distracted',
    3: 'Moderate',
    4: 'In Flow',
    5: 'Laser Sharp',
  },
};

export function EveningReflectionCard({ className = '' }) {
  const { data: todayReflection, isLoading } = useTodayReflection();
  const createMutation = useCreateReflection();
  const updateMutation = useUpdateReflection();

  const [mood, setUserMood] = useState(3);
  const [energy, setUserEnergy] = useState(3);
  const [focus, setUserFocus] = useState(3);
  const [note, setUserNote] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (todayReflection) {
      setUserMood(todayReflection.moodScore || 3);
      setUserEnergy(todayReflection.energyScore || 3);
      setUserFocus(todayReflection.focusScore || 3);
      setUserNote(todayReflection.note || '');
    }
  }, [todayReflection]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (todayReflection?.id) {
        await updateMutation.mutateAsync({
          id: todayReflection.id,
          payload: {
            moodScore: mood,
            energyScore: energy,
            focusScore: focus,
            note,
          },
        });
      } else {
        await createMutation.mutateAsync({
          moodScore: mood,
          energyScore: energy,
          focusScore: focus,
          note,
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save reflection:', err);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div
      className={clsx(
        'rounded-card p-5 sm:p-6',
        'bg-obsidian-800 border border-obsidian-700/60 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4 border-b border-obsidian-700/50 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-chip bg-obsidian-700/70 border border-obsidian-600/50 flex items-center justify-center text-ink-muted">
            <Moon size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink">
              {todayReflection ? 'Today’s Reflection (Saved)' : 'Evening Reflection'}
            </h2>
            <p className="text-xs text-ink-muted">
              Mindful decompression • Non-gamified wellness
            </p>
          </div>
        </div>

        {todayReflection && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-obsidian-700 text-ink-muted border border-obsidian-600/60">
            Blended: {todayReflection.blendedScore} / 5
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Mood Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-ink flex items-center gap-1.5">
              <Smile size={14} className="text-gold" />
              Mood
            </label>
            <span className="text-xs font-mono text-ink-muted">
              {mood} — {SCORE_LABELS.mood[mood]}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={`mood-${val}`}
                type="button"
                onClick={() => setUserMood(val)}
                className={clsx(
                  'h-11 rounded-panel text-xs font-medium transition-colors',
                  'flex items-center justify-center border',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-obsidian-600',
                  mood === val
                    ? 'bg-gold/20 border-gold/60 text-gold font-bold shadow-inner'
                    : 'bg-obsidian-900/60 border-obsidian-700/50 text-ink-muted hover:bg-obsidian-700/60 hover:text-ink'
                )}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Energy Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-ink flex items-center gap-1.5">
              <Zap size={14} className="text-emerald-400" />
              Energy
            </label>
            <span className="text-xs font-mono text-ink-muted">
              {energy} — {SCORE_LABELS.energy[energy]}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={`energy-${val}`}
                type="button"
                onClick={() => setUserEnergy(val)}
                className={clsx(
                  'h-11 rounded-panel text-xs font-medium transition-colors',
                  'flex items-center justify-center border',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-obsidian-600',
                  energy === val
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 font-bold shadow-inner'
                    : 'bg-obsidian-900/60 border-obsidian-700/50 text-ink-muted hover:bg-obsidian-700/60 hover:text-ink'
                )}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Focus Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-ink flex items-center gap-1.5">
              <Target size={14} className="text-mana" />
              Focus
            </label>
            <span className="text-xs font-mono text-ink-muted">
              {focus} — {SCORE_LABELS.focus[focus]}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={`focus-${val}`}
                type="button"
                onClick={() => setUserFocus(val)}
                className={clsx(
                  'h-11 rounded-panel text-xs font-medium transition-colors',
                  'flex items-center justify-center border',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-obsidian-600',
                  focus === val
                    ? 'bg-mana/20 border-mana/60 text-mana font-bold shadow-inner'
                    : 'bg-obsidian-900/60 border-obsidian-700/50 text-ink-muted hover:bg-obsidian-700/60 hover:text-ink'
                )}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Optional Text Note */}
        <div>
          <label htmlFor="reflection-note" className="block text-xs font-medium text-ink mb-1.5">
            Reflective Notes (Optional)
          </label>
          <textarea
            id="reflection-note"
            rows={3}
            value={note}
            onChange={(e) => setUserNote(e.target.value)}
            placeholder="What went well today? What drained your energy or felt heavy? Freeform journaling..."
            maxLength={2000}
            className={clsx(
              'w-full px-4 py-3 rounded-2xl text-xs text-ink placeholder:text-ink-muted/40',
              'bg-white/[0.03] border border-white/10',
              'focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/25 focus:bg-white/[0.06]',
              'backdrop-blur-md transition-all resize-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]'
            )}
          />
        </div>

        {/* 5. Submit Button & Feedback */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {saveSuccess ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 size={16} />
              <span>Evening reflection saved.</span>
            </div>
          ) : (
            <span className="text-[11px] text-ink-muted">
              Zero progression rewards • Pure wellness record
            </span>
          )}

          <button
            type="submit"
            disabled={isSaving || isLoading}
            className={clsx(
              'px-5 py-2.5 rounded-panel text-xs font-semibold text-ink transition-colors',
              'bg-obsidian-700 hover:bg-obsidian-600 border border-obsidian-600/70',
              'min-h-[44px]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-obsidian-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isSaving ? 'Saving...' : todayReflection ? 'Update Reflection' : 'Save Reflection'}
          </button>
        </div>
      </form>
    </div>
  );
}

EveningReflectionCard.propTypes = {
  className: PropTypes.string,
};
export default EveningReflectionCard;
