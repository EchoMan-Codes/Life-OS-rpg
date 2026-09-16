import { useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useReflections } from '@/features/reflections/hooks';

/**
 * Maps a blended score (1.0..5.0) to a muted cool-to-warm color token.
 * Muted scale per spec: cool slate -> teal -> emerald -> warm amber.
 *
 * @param {number|null} score
 * @returns {string} Tailwind color classes
 */
function getIntensityColor(score) {
  if (score === null || score === undefined) {
    return 'bg-obsidian-900/80 border-obsidian-700/40 text-ink-muted/40';
  }
  if (score <= 2.0) {
    return 'bg-slate-700/60 border-slate-600/60 text-slate-300';
  }
  if (score <= 3.0) {
    return 'bg-teal-900/50 border-teal-700/50 text-teal-300';
  }
  if (score <= 4.0) {
    return 'bg-emerald-900/50 border-emerald-700/50 text-emerald-300';
  }
  return 'bg-amber-800/60 border-amber-600/60 text-amber-200';
}

/**
 * Consistency heatmap displaying daily reflection blended intensity over the past 30 days.
 */
export function ConsistencyHeatmap({ className = '' }) {
  const { data: reflections = [] } = useReflections('30d');
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Generate the last 30 calendar days ending today (anchor noon UTC to prevent DST shift)
  const today = new Date();
  const days = [];
  const reflectionsMap = new Map();

  for (const ref of reflections) {
    reflectionsMap.set(ref.forDate, ref);
  }

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const ref = reflectionsMap.get(dateStr) || null;
    days.push({
      dateStr,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekday: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      reflection: ref,
    });
  }

  const recordedCount = reflections.length;
  const avgBlended = recordedCount > 0
    ? (reflections.reduce((acc, r) => acc + (r.blendedScore || 0), 0) / recordedCount).toFixed(1)
    : '—';

  return (
    <div
      className={clsx(
        'rounded-card p-5 sm:p-6',
        'bg-obsidian-800 border border-obsidian-700/60 shadow-sm',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-obsidian-700/50 pb-3">
        <div>
          <h2 className="text-base font-semibold text-ink">30-Day Consistency Heatmap</h2>
          <p className="text-xs text-ink-muted">
            Daily blended wellness (Mood, Energy, Focus) on a cool-to-warm scale
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-ink-muted">
          <span>Logged: <strong className="text-ink">{recordedCount}/30</strong></span>
          <span>30d Avg: <strong className="text-ink">{avgBlended}</strong></span>
        </div>
      </div>

      {/* Grid of 30 days (5 columns on small mobile, 6 on mobile, 10 or 15 on tablet/desktop) */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
        {days.map(({ dateStr, label, reflection }) => {
          const score = reflection?.blendedScore ?? null;
          const isSelected = activeTooltip?.dateStr === dateStr;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setActiveTooltip(isSelected ? null : { dateStr, label, reflection })}
              onMouseEnter={() => setActiveTooltip({ dateStr, label, reflection })}
              aria-label={`Reflection for ${label}: ${score ? `${score} out of 5` : 'No entry'}`}
              className={clsx(
                'flex flex-col items-center justify-center p-2 rounded-panel border text-center transition-all',
                'min-h-[48px] focus:outline-none focus:ring-2 focus:ring-obsidian-500',
                getIntensityColor(score),
                isSelected && 'ring-2 ring-ink ring-offset-1 ring-offset-obsidian-800'
              )}
            >
              <span className="text-[10px] font-medium opacity-70 leading-none mb-1">
                {label}
              </span>
              <span className="text-xs font-bold leading-none">
                {score !== null ? score : '—'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Details / Tooltip card */}
      <div className="mt-4 min-h-[56px] p-3 rounded-panel bg-obsidian-900/60 border border-obsidian-700/50 flex flex-col justify-center">
        {activeTooltip ? (
          activeTooltip.reflection ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-ink">{activeTooltip.label}</span>
                <span className="font-mono text-ink-muted">
                  Blended: <strong className="text-ink">{activeTooltip.reflection.blendedScore}</strong>/5
                </span>
                <span className="text-ink-muted hidden sm:inline">
                  (Mood: {activeTooltip.reflection.moodScore} • Energy: {activeTooltip.reflection.energyScore} • Focus: {activeTooltip.reflection.focusScore})
                </span>
              </div>
              {activeTooltip.reflection.note && (
                <p className="text-ink-muted italic truncate max-w-sm">
                  "{activeTooltip.reflection.note}"
                </p>
              )}
            </div>
          ) : (
            <div className="text-xs text-ink-muted">
              <strong className="text-ink">{activeTooltip.label}</strong> — No evening reflection recorded.
            </div>
          )
        ) : (
          <div className="text-xs text-ink-muted text-center sm:text-left">
            Hover or tap any day cell to view details.
          </div>
        )}
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center justify-between text-[11px] text-ink-muted mt-3 pt-2 border-t border-obsidian-700/40">
        <span>Low / Rest</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-obsidian-900 border border-obsidian-700/50" title="No entry" />
          <span className="w-3 h-3 rounded-sm bg-slate-700/60 border border-slate-600/60" title="1.0 - 2.0 (Low)" />
          <span className="w-3 h-3 rounded-sm bg-teal-900/50 border border-teal-700/50" title="2.1 - 3.0 (Moderate)" />
          <span className="w-3 h-3 rounded-sm bg-emerald-900/50 border border-emerald-700/50" title="3.1 - 4.0 (Good)" />
          <span className="w-3 h-3 rounded-sm bg-amber-800/60 border border-amber-600/60" title="4.1 - 5.0 (Peak)" />
        </div>
        <span>Peak Wellness</span>
      </div>
    </div>
  );
}

ConsistencyHeatmap.propTypes = {
  className: PropTypes.string,
};
