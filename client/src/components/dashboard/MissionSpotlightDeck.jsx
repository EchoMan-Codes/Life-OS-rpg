import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  Target,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Compass,
} from 'lucide-react';

import { spring } from '@/lib/motion';
import { HorizontalCardRow } from './HorizontalCardRow';

const ATTR_MAP = {
  strength: { name: 'STR', color: 'text-attr-strength', bg: 'bg-attr-strength/10', border: 'border-attr-strength/30', glow: 'rgba(239, 68, 68, 0.25)' },
  intelligence: { name: 'INT', color: 'text-attr-intelligence', bg: 'bg-attr-intelligence/10', border: 'border-attr-intelligence/30', glow: 'rgba(56, 189, 248, 0.25)' },
  vitality: { name: 'VIT', color: 'text-attr-vitality', bg: 'bg-attr-vitality/10', border: 'border-attr-vitality/30', glow: 'rgba(16, 185, 129, 0.25)' },
  willpower: { name: 'WIS', color: 'text-attr-willpower', bg: 'bg-attr-willpower/10', border: 'border-attr-willpower/30', glow: 'rgba(168, 85, 247, 0.25)' },
  perception: { name: 'PER', color: 'text-attr-perception', bg: 'bg-attr-perception/10', border: 'border-attr-perception/30', glow: 'rgba(245, 158, 11, 0.25)' },
};

/**
 * MissionSpotlightDeck — High-tech fanned card deck & mobile mission carousel.
 *
 * Implements:
 * - Desktop (>= 1024px): 3D fanned card presentation with central spotlight, angled flanking cards, and click-to-swap
 * - Mobile (< 1024px): Horizontal snap-scrolling carousel with edge bleed
 * - Holographic sci-fi command framing with tabular telemetry
 */
export function MissionSpotlightDeck({
  activeQuests = [],
  onOpenCreateQuest,
  className = '',
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Keep active index within bounds
  const clampedIndex = useMemo(() => {
    if (activeQuests.length === 0) return 0;
    return Math.min(Math.max(0, activeIndex), activeQuests.length - 1);
  }, [activeIndex, activeQuests.length]);

  const displayQuests = activeQuests.slice(0, 5);

  const prevCard = () => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  const nextCard = () => {
    setActiveIndex((prev) => Math.min(displayQuests.length - 1, prev + 1));
  };

  if (displayQuests.length === 0) {
    return (
      <div className={clsx('relative p-6 sm:p-8 rounded-card-lg border border-glass-border bg-obsidian-900/60 backdrop-blur-md overflow-hidden text-center flex flex-col items-center justify-center gap-3', className)}>
        {/* Ambient background glow */}
        <div className="absolute inset-0 bg-linear-to-b from-accent-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="w-12 h-12 rounded-xl bg-obsidian-800 border border-glass-border flex items-center justify-center text-accent-primary shadow-glow">
          <Compass size={24} />
        </div>

        <div>
          <div className="text-[11px] font-mono tracking-widest text-ink-muted uppercase">
            // STATUS: ALL CAMPAIGNS CLEARED
          </div>
          <h3 className="text-display-xs font-display text-ink mt-0.5">
            No Active Mission Directives
          </h3>
          <p className="text-caption text-ink-muted max-w-sm mt-1">
            Quests organize high-impact goals into multi-stage milestone checklists with structured XP progression.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateQuest}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-panel bg-accent-primary/20 hover:bg-accent-primary/30 border border-accent-primary/40 text-accent-primary text-xs font-mono font-medium tracking-wide transition-all shadow-glow hover:shadow-glow-willpower"
        >
          <Plus size={14} />
          <span>+ INITIALIZE NEW DIRECTIVE</span>
        </button>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-3.5', className)}>
      {/* 1. Header with Deck Title & Pagination Controls */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-accent-primary">
            <Target size={15} />
            <span>MISSION DIRECTIVES</span>
          </div>
          <span className="text-[11px] font-mono text-ink-muted px-1.5 py-0.5 rounded bg-obsidian-800 border border-glass-border">
            [{displayQuests.length} ACTIVE]
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick desktop controls */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              type="button"
              onClick={prevCard}
              disabled={clampedIndex === 0}
              aria-label="Previous mission"
              className="p-1.5 rounded-chip bg-glass hover:bg-glass/80 border border-glass-border text-ink-muted hover:text-ink disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11px] font-mono text-ink-muted px-1">
              {clampedIndex + 1}/{displayQuests.length}
            </span>
            <button
              type="button"
              onClick={nextCard}
              disabled={clampedIndex === displayQuests.length - 1}
              aria-label="Next mission"
              className="p-1.5 rounded-chip bg-glass hover:bg-glass/80 border border-glass-border text-ink-muted hover:text-ink disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <Link
            to="/quests"
            className="text-caption font-mono text-accent-primary hover:text-accent-primary/80 transition-colors flex items-center gap-1"
          >
            <span>QUEST BOARD</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* 2. Desktop 3D Fanned Card Deck (Visible on lg >= 1024px) */}
      <div className="hidden lg:block relative w-full h-55 select-none perspective-[1000px]">
        {displayQuests.map((quest, index) => {
          const isCenter = index === clampedIndex;
          const isLeft = index === clampedIndex - 1;
          const isRight = index === clampedIndex + 1;
          const isVisible = isCenter || isLeft || isRight;

          if (!isVisible) return null;

          const attrInfo = ATTR_MAP[quest.attribute] || ATTR_MAP.willpower;
          const completedCount = quest.items?.filter((i) => i.isComplete).length || 0;
          const totalCount = quest.items?.length || 0;
          const progress = quest.progressPercent || 0;

          let xOffset = 0;
          let rotateZ = 0;
          let zIndex = 10;
          let scale = 0.92;
          let opacity = 0.65;

          if (isCenter) {
            xOffset = 0;
            rotateZ = 0;
            zIndex = 30;
            scale = 1;
            opacity = 1;
          } else if (isLeft) {
            xOffset = -140;
            rotateZ = -4.5;
            zIndex = 10;
          } else if (isRight) {
            xOffset = 140;
            rotateZ = 4.5;
            zIndex = 10;
          }

          return (
            <motion.div
              key={quest.id}
              onClick={() => setActiveIndex(index)}
              className={clsx(
                'absolute inset-y-0 left-1/2 -ml-57.5 w-115 cursor-pointer rounded-card-lg p-5',
                'border transition-colors duration-200 backdrop-blur-xl',
                isCenter
                  ? 'bg-obsidian-850/95 border-white/20 shadow-elevation-floating'
                  : 'bg-obsidian-900/80 border-glass-border hover:border-glass-border-strong hover:opacity-90'
              )}
              style={{ zIndex }}
              animate={
                shouldReduceMotion
                  ? { opacity: isCenter ? 1 : 0.4 }
                  : {
                      x: xOffset,
                      rotateZ,
                      scale,
                      opacity,
                    }
              }
              transition={spring.snappy}
            >
              {/* Corner Sci-Fi Reticles for Center Card */}
              {isCenter && (
                <>
                  <div className="absolute top-2 left-2 text-[9px] font-mono text-white/30 tracking-tighter">[+]</div>
                  <div className="absolute top-2 right-2 text-[9px] font-mono text-white/30 tracking-tighter">[+]</div>
                  <div
                    className="absolute inset-0 rounded-card-lg pointer-events-none opacity-40 transition-opacity"
                    style={{
                      boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.15), 0 0 30px 0 ${attrInfo.glow}`,
                    }}
                  />
                </>
              )}

              {/* Card Content */}
              <div className="flex flex-col justify-between h-full relative z-10">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={clsx('text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border', attrInfo.bg, attrInfo.color, attrInfo.border)}>
                      {attrInfo.name} // {quest.priority?.toUpperCase() || 'NORMAL'}
                    </span>
                    <span className="text-[11px] font-mono text-ink-muted">
                      {totalCount > 0 ? `[${completedCount}/${totalCount} CHECKLIST]` : '[DIRECTIVE]'}
                    </span>
                  </div>

                  <h4 className="text-base font-display font-bold text-ink truncate">
                    {quest.title}
                  </h4>

                  {quest.description && (
                    <p className="text-xs text-ink-muted line-clamp-2 mt-1">
                      {quest.description}
                    </p>
                  )}
                </div>

                {/* Progress Bar & Subtask Status */}
                <div className="space-y-2 mt-3 pt-3 border-t border-glass-border/50">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-ink-muted text-[11px]">PROGRESS RATIO</span>
                    <span className="font-bold text-ink">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-obsidian-800 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-linear-to-r from-accent-primary to-accent-highlight"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Mobile / Tablet Native Horizontal Carousel (Visible on < 1024px) */}
      <div className="lg:hidden">
        <HorizontalCardRow ariaLabel="Active missions carousel">
          {displayQuests.map((quest) => {
            const attrInfo = ATTR_MAP[quest.attribute] || ATTR_MAP.willpower;
            const completedCount = quest.items?.filter((i) => i.isComplete).length || 0;
            const totalCount = quest.items?.length || 0;
            const progress = quest.progressPercent || 0;

            return (
              <div
                key={quest.id}
                className="snap-start shrink-0 w-72.5 sm:w-[320px] p-4 rounded-card border border-glass-border bg-obsidian-900/90 backdrop-blur-md shadow-elevation-surface flex flex-col justify-between relative overflow-hidden"
              >
                <span className="absolute top-1 left-2 font-mono text-[9px] text-white/25 select-none" aria-hidden="true">┌</span>
                <span className="absolute top-1 right-2 font-mono text-[9px] text-white/25 select-none" aria-hidden="true">┐</span>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={clsx('text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border', attrInfo.bg, attrInfo.color, attrInfo.border)}>
                      {attrInfo.name} // {quest.priority?.toUpperCase() || 'NORMAL'}
                    </span>
                    <span className="text-[11px] font-mono text-ink-muted">
                      [{completedCount}/{totalCount}]
                    </span>
                  </div>

                  <h4 className="text-sm font-display font-bold text-ink line-clamp-1">
                    {quest.title}
                  </h4>

                  {quest.description && (
                    <p className="text-xs text-ink-muted line-clamp-2 mt-1">
                      {quest.description}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 mt-3 pt-2.5 border-t border-glass-border/40">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-ink-muted">PROGRESS</span>
                    <span className="font-bold text-ink">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-obsidian-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </HorizontalCardRow>
      </div>
    </div>
  );
}

MissionSpotlightDeck.propTypes = {
  activeQuests: PropTypes.array,
  onOpenCreateQuest: PropTypes.func,
  className: PropTypes.string,
};
