import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Flame, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { ForgePanel, ForgeChamber } from '@/components/habits/RitualFrame';

/**
 * Parses YYYY-MM-DD into human weekday and day number safely.
 */
function parseDateLabel(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return { weekday: '—', dayNum: '—' };
  const [year, month, day] = dateStr.split('-').map(Number);
  // Anchor at noon UTC to avoid DST boundary shifts
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
  return { weekday, dayNum: String(day) };
}

/**
 * WeeklyConsistencyModule — Structural Holographic 7-Day Calendar Ritual Cadence.
 *
 * Implements the Structural Object Mandate:
 * - Angular structural rails with animated energy seams and center crest emitter
 * - Segmented side pylons and mechanical corner brackets
 * - Inset dark-glass plane with framed internal chambers
 * - Mathematically truthful 7 local calendar days from PostgreSQL
 */
export function WeeklyConsistencyModule({
  calendarDays = [],
  dailyCompletions = {},
  todayDate = '',
  weeklyTotal = 0,
  isLoading = false,
}) {
  const shouldReduceMotion = useReducedMotion();

  // Active days count (days with at least 1 positive completion)
  const activeDaysCount = calendarDays.filter((d) => (dailyCompletions[d] || 0) > 0).length;

  return (
    <ForgePanel
      variant="neutral"
      hasCrest={true}
      innerClassName="p-5 sm:p-6"
    >
      {/* Background Arcane Gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* ══════════════════════════════════════════════════
          CHAMBER 1: CADENCE TELEMETRY & ALIGNMENT HEADER
          ══════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
              [ 7-DAY CADENCE // CELESTIAL ALIGNMENT ]
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-ink mt-0.5 tracking-tight">
            Weekly Discipline Alignment
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ForgeChamber variant="inset" className="py-1 px-2.5 text-xs font-mono text-ink-muted flex items-center gap-1">
            <strong className="text-cyan-300 font-bold">{activeDaysCount}</strong>/7 active days
          </ForgeChamber>
          <div className="px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-xs font-mono text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <strong className="text-cyan-300 font-bold">{weeklyTotal}</strong> total reps
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          CHAMBER 2: 7-DAY CAPACITOR STRIP
          ══════════════════════════════════════════════════ */}
      {isLoading ? (
        <div className="py-8 text-center text-xs font-mono text-ink-muted animate-pulse">
          Synchronizing cadence matrix from PostgreSQL...
        </div>
      ) : (
        <ForgeChamber variant="inset" className="p-3 sm:p-4 relative">
          {/* Connector Conduit Line behind nodes */}
          <div className="hidden sm:block absolute top-[44px] left-[6%] right-[6%] h-0.5 bg-obsidian-800 border-t border-cyan-500/25 z-0 pointer-events-none" />

          <div className="grid grid-cols-7 gap-1.5 sm:gap-3 relative z-10">
            {calendarDays.map((dayStr, idx) => {
              const { weekday, dayNum } = parseDateLabel(dayStr);
              const count = dailyCompletions[dayStr] || 0;
              const isToday = dayStr === todayDate;
              const isCleared = count > 0;

              return (
                <div
                  key={dayStr || idx}
                  className="flex flex-col items-center text-center group"
                >
                  {/* Weekday Label */}
                  <span
                    className={clsx(
                      'text-[10px] sm:text-xs font-mono uppercase tracking-wider mb-2 transition-colors',
                      isToday ? 'text-cyan-300 font-bold' : 'text-ink-muted'
                    )}
                  >
                    {weekday}
                  </span>

                  {/* Celestial Capacitor Node */}
                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.08 }}
                    className={clsx(
                      'relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex flex-col items-center justify-center transition-all duration-300 border select-none',
                      isToday && 'ring-2 ring-cyan-400/60 ring-offset-2 ring-offset-obsidian-950 shadow-[0_0_12px_rgba(6,182,212,0.3)]',
                      isCleared
                        ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 shadow-[0_0_16px_rgba(6,182,212,0.3)]'
                        : 'bg-obsidian-950/80 border-white/10 text-ink-muted hover:border-white/20'
                    )}
                  >
                    {isCleared ? (
                      count > 1 ? (
                        <div className="flex flex-col items-center">
                          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/60" />
                          <span className="text-[10px] font-mono font-bold leading-none mt-0.5">
                            {count}
                          </span>
                        </div>
                      ) : (
                        <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                      )
                    ) : (
                      <span className="text-xs font-mono text-ink-muted/60">{dayNum}</span>
                    )}

                    {/* Today Marker Dot */}
                    {isToday && (
                      <span className="absolute -top-1 right-0 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                    )}
                  </motion.div>

                  {/* Count / Status Under Node */}
                  <div className="mt-2 text-center">
                    <span
                      className={clsx(
                        'text-[10px] sm:text-xs font-mono font-medium block',
                        isCleared ? 'text-cyan-300 font-bold' : 'text-ink-muted/50'
                      )}
                    >
                      {isCleared ? `${count} rep${count > 1 ? 's' : ''}` : isToday ? 'Pending' : 'Missed'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ForgeChamber>
      )}
    </ForgePanel>
  );
}

WeeklyConsistencyModule.propTypes = {
  calendarDays: PropTypes.arrayOf(PropTypes.string),
  dailyCompletions: PropTypes.object,
  todayDate: PropTypes.string,
  weeklyTotal: PropTypes.number,
  isLoading: PropTypes.bool,
};

