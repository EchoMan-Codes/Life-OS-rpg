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
        'p-5 sm:p-6 rounded-3xl',
        'bg-white/90 border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.04)]',
        'dark:bg-obsidian-900/65 dark:border-white/[0.10] dark:shadow-none',
        'backdrop-blur-2xl transition-colors',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4 border-b border-slate-200/80 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-xs">
            <Moon size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-ink font-display">
              {todayReflection ? 'Today’s Reflection (Saved)' : 'Evening Reflection'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-ink-muted">
              Mindful decompression • Non-gamified wellness
            </p>
          </div>
        </div>

        {todayReflection && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-obsidian-700 dark:text-ink-muted dark:border-obsidian-600/60 font-semibold">
            Blended: {todayReflection.blendedScore} / 5
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Mood Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-800 dark:text-ink flex items-center gap-1.5">
              <Smile size={14} className="text-amber-500 dark:text-gold" />
              Mood
            </label>
            <span className="text-xs font-mono text-slate-500 dark:text-ink-muted">
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
                  'h-11 rounded-2xl text-xs font-semibold transition-all',
                  'flex items-center justify-center border',
                  'focus-visible:outline-2 focus-visible:outline-offset-2',
                  mood === val
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:bg-gold/20 dark:border-gold/60 dark:text-gold font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-obsidian-900/60 dark:border-obsidian-700/50 dark:text-ink-muted dark:hover:bg-obsidian-700/60 dark:hover:text-ink'
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
            <label className="text-xs font-semibold text-slate-800 dark:text-ink flex items-center gap-1.5">
              <Zap size={14} className="text-emerald-500 dark:text-emerald-400" />
              Energy
            </label>
            <span className="text-xs font-mono text-slate-500 dark:text-ink-muted">
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
                  'h-11 rounded-2xl text-xs font-semibold transition-all',
                  'flex items-center justify-center border',
                  'focus-visible:outline-2 focus-visible:outline-offset-2',
                  energy === val
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/60 dark:text-emerald-400 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-obsidian-900/60 dark:border-obsidian-700/50 dark:text-ink-muted dark:hover:bg-obsidian-700/60 dark:hover:text-ink'
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
            <label className="text-xs font-semibold text-slate-800 dark:text-ink flex items-center gap-1.5">
              <Target size={14} className="text-sky-600 dark:text-mana" />
              Focus
            </label>
            <span className="text-xs font-mono text-slate-500 dark:text-ink-muted">
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
                  'h-11 rounded-2xl text-xs font-semibold transition-all',
                  'flex items-center justify-center border',
                  'focus-visible:outline-2 focus-visible:outline-offset-2',
                  focus === val
                    ? 'bg-sky-500/15 border-sky-500/50 text-sky-700 dark:bg-mana/20 dark:border-mana/60 dark:text-mana font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-obsidian-900/60 dark:border-obsidian-700/50 dark:text-ink-muted dark:hover:bg-obsidian-700/60 dark:hover:text-ink'
                )}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Optional Text Note */}
        <div>
          <label htmlFor="reflection-note" className="block text-xs font-semibold text-slate-800 dark:text-ink mb-1.5">
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
              'w-full px-4 py-3 rounded-2xl text-xs text-slate-800 dark:text-ink placeholder:text-slate-400 dark:placeholder:text-ink-muted/40',
              'bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10',
              'focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:focus:border-white/25 dark:focus:bg-white/[0.06]',
              'backdrop-blur-md transition-all resize-none shadow-xs'
            )}
          />
        </div>

        {/* 5. Submit Button & Feedback */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {saveSuccess ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 size={16} />
              <span>Evening reflection saved.</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 dark:text-ink-muted">
              Zero progression rewards • Pure wellness record
            </span>
          )}

          <button
            type="submit"
            disabled={isSaving || isLoading}
            className={clsx(
              'px-5 py-2.5 rounded-2xl text-xs font-bold text-white dark:text-ink transition-all',
              'bg-teal-600 hover:bg-teal-700 dark:bg-obsidian-700 dark:hover:bg-obsidian-600 border border-teal-600 dark:border-obsidian-600/70',
              'min-h-[44px] shadow-sm',
              'focus-visible:outline-2 focus-visible:outline-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'
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
