import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Moon,
  Bell,
  Sparkles,
  CalendarCheck,
  Flame,
  Scroll,
  Heart,
  ShoppingBag,
  User,
} from 'lucide-react';
import clsx from 'clsx';
import { spring } from '@/lib/motionVariants';

export const DEFAULT_FEATURE_ITEMS = [
  {
    id: 'theme',
    category: 'DISPLAY',
    badge: 'Crystal Light',
    icon: Moon,
    iconBg: 'bg-indigo-600 text-white dark:bg-white dark:text-slate-900',
    title: 'Appearance & Theme',
    description: 'Customize light, dark & glassmorphism visuals across your OS.',
    path: '/profile',
    actionLabel: 'Active Section',
  },
  {
    id: 'alerts',
    category: 'SYSTEM',
    badge: 'Real-Time',
    icon: Bell,
    iconBg: 'bg-emerald-500 text-white',
    title: 'Alerts & Reminders',
    description: 'Schedule daily rituals, nudges & streak protections across modules.',
    path: '/calendar',
    actionLabel: 'Tap to Open',
  },
  {
    id: 'ai',
    category: 'INTELLIGENCE',
    badge: 'Adaptive AI',
    icon: Sparkles,
    iconBg: 'bg-amber-500 text-slate-950',
    title: 'Jeevan AI Strategist',
    description: 'Conversational reasoning, schedule optimization, and auto task actions.',
    path: '/ai',
    actionLabel: 'Consult AI',
  },
  {
    id: 'dailies',
    category: 'RITUALS',
    badge: 'Recurring',
    icon: CalendarCheck,
    iconBg: 'bg-teal-500 text-white',
    title: 'Daily Rituals',
    description: 'Conquer non-negotiable daily recurring commitments and protect streaks.',
    path: '/dailies',
    actionLabel: 'Conquer Dailies',
  },
  {
    id: 'habits',
    category: 'DISCIPLINES',
    badge: 'Momentum',
    icon: Flame,
    iconBg: 'bg-orange-500 text-white',
    title: 'Habit Momentum',
    description: 'Score positive and negative disciplines, building compounding momentum.',
    path: '/habits',
    actionLabel: 'Build Streaks',
  },
  {
    id: 'quests',
    category: 'ROADMAPS',
    badge: 'Milestones',
    icon: Scroll,
    iconBg: 'bg-purple-500 text-white',
    title: 'Campaign Quests',
    description: 'Break down major life milestones into multi-step RPG campaign roadmaps.',
    path: '/quests',
    actionLabel: 'View Quests',
  },
  {
    id: 'reflection',
    category: 'WELLNESS',
    badge: '30d Heatmap',
    icon: Heart,
    iconBg: 'bg-rose-500 text-white',
    title: 'Evening Reflection',
    description: 'Mindful daily decompression, mood tracking, and 30-day cognitive heatmap.',
    path: '/reflection',
    actionLabel: 'Begin Reflection',
  },
  {
    id: 'shop',
    category: 'ECONOMY',
    badge: 'Gold Vault',
    icon: ShoppingBag,
    iconBg: 'bg-yellow-500 text-slate-950',
    title: 'Reward Shop',
    description: 'Spend hard-earned gold coins on custom real-life rewards and gear.',
    path: '/shop',
    actionLabel: 'Explore Loot',
  },
  {
    id: 'profile',
    category: 'HERO',
    badge: 'Radar Astrolabe',
    icon: User,
    iconBg: 'bg-sky-500 text-white',
    title: 'Character Profile',
    description: 'Inspect 5 attributes, level progression tiers, and battle history.',
    path: '/profile',
    actionLabel: 'View Profile',
  },
];

/**
 * FeatureCardCarousel — Inspired by premium iOS / Linear OS horizontal card decks.
 * Displays swipeable/scrollable feature cards with category pills, status chips,
 * prominent squircles, hairline dividers, and active pill pagination dots.
 */
export function FeatureCardCarousel({
  items = DEFAULT_FEATURE_ITEMS,
  activePath,
  onSelect,
  className,
  cardWidth = 'w-[280px] sm:w-[320px]',
}) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track active card on scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const cardSize = 300; // estimated card + gap
    const index = Math.round(scrollLeft / cardSize);
    setActiveIndex(Math.max(0, Math.min(items.length - 1, index)));
  };

  const scrollToIndex = (index) => {
    if (!scrollRef.current) return;
    const cardElements = scrollRef.current.children;
    if (cardElements[index]) {
      cardElements[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      });
      setActiveIndex(index);
    }
  };

  return (
    <div className={clsx('w-full space-y-3 select-none', className)}>
      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 pt-1 px-1 custom-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, idx) => {
          const isActive = activePath === item.path;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.id || item.title}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={spring.snappy}
              onClick={() => {
                if (onSelect) onSelect(item);
                else if (item.path) navigate(item.path);
                else if (item.action) item.action();
              }}
              className={clsx(
                'snap-start shrink-0 rounded-[28px] p-5 sm:p-6 border transition-all cursor-pointer flex flex-col justify-between',
                cardWidth,
                isActive
                  ? 'bg-slate-900 dark:bg-[#12141F] text-white border-indigo-500/50 shadow-[0_12px_40px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/40'
                  : 'bg-white/90 dark:bg-[#11131B]/95 text-slate-800 dark:text-ink border-slate-200/90 dark:border-white/10 hover:border-indigo-400/40 shadow-md backdrop-blur-xl'
              )}
            >
              {/* Top Row: Category Tag & Status Pill */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-500 dark:text-ink-muted">
                  {item.category || 'FEATURE'}
                </span>

                {item.badge && (
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-semibold border bg-white/10 dark:bg-white/5 border-white/15 text-slate-600 dark:text-ink-muted">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Main Info: Icon Squircle + Title + Description */}
              <div className="space-y-3 mb-4">
                <div
                  className={clsx(
                    'w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0 border transition-transform',
                    item.iconBg || 'bg-white text-slate-950 dark:bg-white dark:text-slate-900 border-white/20'
                  )}
                >
                  {Icon && <Icon size={22} />}
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold font-display tracking-tight leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-ink-muted mt-1 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Bottom Row: Hairline divider & Action indicator */}
              <div className="border-t border-slate-200/70 dark:border-white/10 pt-3.5 flex items-center justify-between text-xs font-semibold">
                <span className={clsx(isActive ? 'text-indigo-400 font-bold' : 'text-slate-500 dark:text-ink-muted')}>
                  {isActive ? 'Active Section' : item.actionLabel || 'Tap to Open'}
                </span>
                <div
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5',
                    isActive ? 'text-indigo-400' : 'text-slate-400 dark:text-ink-muted'
                  )}
                >
                  <ArrowRight size={14} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination Pill Dots Indicator */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={clsx(
                'transition-all duration-300 rounded-full cursor-pointer',
                activeIndex === i
                  ? 'w-7 h-1.5 bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                  : 'w-1.5 h-1.5 bg-slate-300 dark:bg-white/20 hover:bg-slate-400 dark:hover:bg-white/40'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

FeatureCardCarousel.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      category: PropTypes.string,
      badge: PropTypes.string,
      icon: PropTypes.elementType,
      iconBg: PropTypes.string,
      path: PropTypes.string,
      action: PropTypes.func,
      actionLabel: PropTypes.string,
    })
  ),
  activePath: PropTypes.string,
  onSelect: PropTypes.func,
  className: PropTypes.string,
  cardWidth: PropTypes.string,
};
