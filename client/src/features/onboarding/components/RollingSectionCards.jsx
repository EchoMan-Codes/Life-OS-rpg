import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Dumbbell,
  Wallet,
  Target,
  Heart,
  CheckSquare,
  ArrowRight,
  Lock,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  LayoutDashboard,
  BookOpen,
  Crown,
  Bot,
} from 'lucide-react';
import clsx from 'clsx';
import { SECTIONS } from '../sections';
import { JeevanLogo } from '@/components/ui/JeevanLogo';

const ICONS = {
  Sparkles,
  Dumbbell,
  Wallet,
  Target,
  Heart,
  CheckSquare,
  LayoutDashboard,
  BookOpen,
  Crown,
  Bot,
};

const AUTO_ROLL_INTERVAL_MS = 3400; // Time per card in continuous rolling loop

/**
 * Looping Rolling Section Cards Experience.
 *
 * Implements a continuous 3D cylindrical rolling carousel inspired by Cards_Rolling.mp4.
 * Continuously loops through all Jeevan modules (Habits & Study, Fitness, Expense,
 * Goals, Health, Productivity) until the user explicitly selects an available section.
 */
export function RollingSectionCards({ onSelectSection }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isEntering, setIsEntering] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  const totalSections = SECTIONS.length;

  // Next / Previous helpers with infinite wrapping
  const nextCard = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % totalSections);
  }, [totalSections]);

  const prevCard = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + totalSections) % totalSections);
  }, [totalSections]);

  // CONTINUOUS LOOPING TIMER
  // Must continue looping automatically until user explicitly selects a section.
  useEffect(() => {
    // If a card has been selected for entry, stop loop immediately!
    if (selectedCard) return;

    if (isPaused) return;

    const timer = setInterval(() => {
      nextCard();
    }, AUTO_ROLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [selectedCard, isPaused, nextCard]);

  // Show non-intrusive feedback toast for upcoming cards
  const showToast = (msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Handle card selection
  const handleCardClick = (section, index) => {
    if (!section.available) {
      setActiveIndex(index);
      showToast(`${section.title} is in forging — coming soon to Jeevan!`);
      return;
    }

    // Immediately halt auto-roll and focus card
    setSelectedCard(section);
    setActiveIndex(index);

    // Trigger unique entrance animation
    setTimeout(() => {
      setIsEntering(true);
    }, 200);

    // Navigate to section after entrance sequence
    setTimeout(() => {
      onSelectSection(section);
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-[#06070B] text-white flex flex-col justify-between p-4 sm:p-8 select-none overflow-hidden"
      onMouseEnter={() => !selectedCard && setIsPaused(true)}
      onMouseLeave={() => !selectedCard && setIsPaused(false)}
      onTouchStart={() => !selectedCard && setIsPaused(true)}
      onTouchEnd={() => {
        if (!selectedCard) {
          // Resume rolling after 2s of inactivity
          setTimeout(() => setIsPaused(false), 2000);
        }
      }}
    >
      {/* ── Ambient Radial Lighting & Depth Gradients ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] bg-gradient-to-tr from-purple-900/30 via-indigo-900/20 to-blue-900/15 rounded-full blur-[170px]"
        />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-600/10 rounded-full blur-[160px]" />
      </div>

      {/* ── Top Header Brand & Guidance Pill ── */}
      <header className="relative z-20 w-full max-w-4xl mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <JeevanLogo variant="lockup" size="sm" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest text-slate-300 uppercase">
            CHOOSE YOUR WORLD
          </span>
        </div>
      </header>

      {/* ── Section Introduction Subtitle ── */}
      <div className="relative z-20 text-center space-y-1 my-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black font-display text-white tracking-tight">
          Where would you like to begin?
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Explore the realms of Jeevan. The cards will cycle continuously until you choose.
        </p>
      </div>

      {/* ── 3D Rolling Section Cards Carousel (Core Visual) ── */}
      <div className="relative z-10 w-full max-w-3xl mx-auto flex-1 flex items-center justify-center [perspective:1200px] py-4">
        <div className="relative w-full max-w-[320px] sm:max-w-[360px] h-[400px] sm:h-[440px] flex items-center justify-center">
          {SECTIONS.map((section, idx) => {
            // Calculate relative offset from active card in circular ring
            let offset = idx - activeIndex;
            if (offset > totalSections / 2) offset -= totalSections;
            if (offset < -totalSections / 2) offset += totalSections;

            const isCenter = offset === 0;
            const isLeft = offset === -1 || (offset < -1 && offset > -3);
            const isRight = offset === 1 || (offset > 1 && offset < 3);
            const isHidden = Math.abs(offset) > 2;

            if (isHidden) return null;

            const Icon = ICONS[section.iconName] || Sparkles;
            const isSelected = selectedCard?.id === section.id;
            const isFadedOut = selectedCard && !isSelected;

            // Compute 3D transforms matching reference video:
            // Center: scale 1, x 0, z 0, rotateY 0
            // Left: scale 0.85, x -160 (or -130 on mobile), z -100, rotateY 24deg
            // Right: scale 0.85, x 160 (or 130 on mobile), z -100, rotateY -24deg
            const xOffset = offset * (window.innerWidth < 640 ? 110 : 155);
            const scale = isSelected ? 1.08 : isCenter ? 1.0 : 0.84;
            const rotateY = offset * -22;
            const zIndex = isSelected ? 50 : 30 - Math.abs(offset) * 10;
            const opacity = isFadedOut ? 0 : isSelected ? 1 : isCenter ? 1 : 0.45;
            const blur = isFadedOut ? '12px' : isCenter ? '0px' : '2px';

            return (
              <motion.div
                key={section.id}
                onClick={() => handleCardClick(section, idx)}
                style={{
                  zIndex,
                  filter: `blur(${blur})`,
                }}
                animate={{
                  x: isSelected ? 0 : xOffset,
                  scale,
                  rotateY: isSelected ? 0 : rotateY,
                  opacity,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 24,
                  mass: 0.8,
                }}
                className={clsx(
                  'absolute inset-0 rounded-3xl p-5 sm:p-6 flex flex-col justify-between border cursor-pointer backdrop-blur-2xl transition-shadow select-none shadow-2xl',
                  section.available
                    ? 'bg-gradient-to-b from-[#1E113A]/90 via-[#150B2D]/95 to-[#090616] border-purple-500/50 hover:border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.25)]'
                    : 'bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-white/[0.01] border-white/10 hover:border-white/20'
                )}
              >
                {/* ── Card Header: Status Tag & Icon ── */}
                <div className="flex items-start justify-between">
                  <div
                    className={clsx(
                      'w-12 h-12 rounded-2xl border flex items-center justify-center shadow-lg transition-transform',
                      section.available
                        ? 'bg-purple-600/25 border-purple-400 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    )}
                  >
                    <Icon size={24} />
                  </div>

                  <span
                    className={clsx(
                      'px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border',
                      section.available
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    )}
                  >
                    {section.status}
                  </span>
                </div>

                {/* ── Card Body: Title, Subtitle, Description ── */}
                <div className="space-y-2 my-auto">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-mono tracking-wider text-purple-300/80 uppercase">
                      {section.subtitle}
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
                      {section.title}
                    </h2>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans line-clamp-3">
                    {section.description}
                  </p>

                  {/* Feature bullet pills */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {section.stats.map((pill) => (
                      <span
                        key={pill}
                        className={clsx(
                          'px-2 py-0.5 rounded-lg text-[10px] font-mono border',
                          section.available
                            ? 'bg-purple-500/10 text-purple-200 border-purple-500/20'
                            : 'bg-white/[0.03] text-slate-400 border-white/5'
                        )}
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ── Card Footer Action CTA ── */}
                <div className="pt-3 border-t border-white/10">
                  {section.available ? (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(section, idx);
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold font-display text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
                    >
                      <span>{section.actionLabel}</span>
                    </motion.button>
                  ) : (
                    <div className="w-full py-2.5 px-4 rounded-2xl bg-white/[0.03] border border-white/5 text-slate-500 font-mono text-xs flex items-center justify-center gap-1.5 cursor-not-allowed">
                      <Lock size={12} />
                      <span>{section.actionLabel}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Controls: Rolling Carousel Indicators & Navigation ── */}
      <footer className="relative z-20 w-full max-w-sm mx-auto flex flex-col items-center gap-3 pb-2">
        {/* Navigation Arrows & Dot Indicators */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={prevCard}
            disabled={Boolean(selectedCard)}
            aria-label="Previous card"
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Indicator dots */}
          <div className="flex items-center gap-1.5">
            {SECTIONS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => !selectedCard && setActiveIndex(idx)}
                aria-label={`Go to section ${s.title}`}
                className={clsx(
                  'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
                  idx === activeIndex
                    ? 'w-6 bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                    : 'w-1.5 bg-white/20 hover:bg-white/40'
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={nextCard}
            disabled={Boolean(selectedCard)}
            aria-label="Next card"
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <p className="text-[11px] font-mono text-slate-500 tracking-wider">
          {isPaused ? 'PAUSED • TAP CARD TO ENTER' : 'AUTO-ROLLING • TAP CARD TO ENTER'}
        </p>
      </footer>

      {/* ── Non-Intrusive Toast Feedback for Upcoming Sections ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#130E26] border border-purple-500/40 text-purple-200 text-xs font-mono shadow-2xl backdrop-blur-xl flex items-center gap-2 pointer-events-none"
          >
            <Shield size={14} className="text-purple-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Unique Cinematic Section Entry Animation Overlay ── */}
      <AnimatePresence>
        {isEntering && selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="fixed inset-0 z-50 bg-[#06070B] flex flex-col items-center justify-center p-6 text-center select-none"
          >
            {/* Radiant portal bloom explosion */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 2.5, 3.5], opacity: [0, 0.8, 0] }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
              className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-amber-300 blur-[80px] pointer-events-none"
            />

            {/* Central Portal Focus */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 space-y-4 max-w-sm"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 border border-purple-400 flex items-center justify-center shadow-[0_0_60px_rgba(168,85,247,0.7)]">
                <Sparkles size={36} className="text-white" />
              </div>

              <div className="space-y-1">
                <h3 className="text-3xl font-black font-display text-white tracking-tight">
                  Entering {selectedCard.title}
                </h3>
                <p className="text-sm text-purple-200/80 font-sans">
                  Preparing your sanctum and daily quests...
                </p>
              </div>

              <div className="pt-2">
                <div className="w-48 h-1 mx-auto rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-400 to-amber-300"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.8, ease: 'easeInOut' }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

RollingSectionCards.propTypes = {
  onSelectSection: PropTypes.func.isRequired,
};
