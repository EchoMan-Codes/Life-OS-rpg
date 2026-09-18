import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Flame,
  CalendarCheck,
  Scroll,
  ShoppingBag,
  Timer,
  Moon,
  MoreHorizontal,
  Shield,
  Swords,
  X,
} from 'lucide-react';

import { spring } from '@/lib/motion';
import {
  openAttributesDrawer,
  openBattleLogDrawer,
} from '@/features/celebration/celebrationEvents';

/**
 * 5 Primary Navigation destinations for mobile.
 */
const primaryTabs = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/dailies', icon: CalendarCheck, label: 'Dailies' },
  { to: '/quests', icon: Scroll, label: 'Quests' },
  { to: '/shop', icon: ShoppingBag, label: 'Shop' },
];

/**
 * Secondary actions revealed through the intentional "More" quick sheet.
 */
const secondaryItems = [
  { to: '/focus', icon: Timer, label: 'Focus Chamber', badge: 'Timer' },
  { to: '/reflection', icon: Moon, label: 'Nightly Reflection', badge: 'Log' },
];

/**
 * BottomNav — Detached Floating Mobile Navigation System.
 * Floats above page content with rounded-pill geometry, 44px+ hit areas,
 * smooth sliding indicator, and a secondary action popover.
 */
export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const location = useLocation();
  const menuRef = useRef(null);

  const isSecondaryActive = secondaryItems.some((item) => item.to === location.pathname);

  // Close menu on click outside or Escape
  useEffect(() => {
    if (!moreOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };

    document.addEventListener('pointerdown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreOpen]);

  return (
    <nav
      className="fixed bottom-3 inset-x-0 z-40 flex flex-col items-center pointer-events-none safe-bottom px-3"
      aria-label="Mobile Bottom Navigation"
    >
      {/* ── Secondary Quick-Action Popover ── */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            ref={menuRef}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.95 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.95 }}
            transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
            className="pointer-events-auto mb-2.5 w-full max-w-[360px] material-modal-glass rounded-card-lg border border-glass-border-strong p-3 shadow-elevation-modal z-50"
            role="dialog"
            aria-label="More options menu"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-caption font-semibold uppercase tracking-wider text-ink-muted">
                More Features
              </span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="w-7 h-7 rounded-control flex items-center justify-center text-ink-muted hover:text-ink hit-area-expand cursor-pointer"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {secondaryItems.map(({ to, icon: Icon, label, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    clsx(
                      'flex flex-col gap-1 p-2.5 rounded-card text-left transition-all',
                      'border hit-area-expand min-h-[56px]',
                      'focus-visible:outline-2 focus-visible:outline-accent-primary',
                      isActive
                        ? 'bg-accent-primary/15 border-accent-primary/40 text-ink'
                        : 'bg-white/[0.03] border-white/5 text-ink-muted hover:text-ink hover:bg-white/[0.06]'
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <Icon size={18} className="text-accent-primary" />
                    {badge && (
                      <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-chip bg-white/10 text-ink">
                        {badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-ink truncate mt-1">{label}</span>
                </NavLink>
              ))}

              {/* Fast triggers for drawers */}
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  openAttributesDrawer();
                }}
                className="flex flex-col gap-1 p-2.5 rounded-card text-left bg-white/[0.03] border border-white/5 text-ink-muted hover:text-ink hover:bg-white/[0.06] transition-all min-h-[56px] hit-area-expand cursor-pointer"
              >
                <Shield size={18} className="text-attr-willpower" />
                <span className="text-xs font-medium text-ink truncate mt-1">Hero Stats</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  openBattleLogDrawer();
                }}
                className="flex flex-col gap-1 p-2.5 rounded-card text-left bg-white/[0.03] border border-white/5 text-ink-muted hover:text-ink hover:bg-white/[0.06] transition-all min-h-[56px] hit-area-expand cursor-pointer"
              >
                <Swords size={18} className="text-gold" />
                <span className="text-xs font-medium text-ink truncate mt-1">Battle Feed</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Detached Floating Navigation Pill ── */}
      <div className="pointer-events-auto material-translucent border-glass-edge rounded-full p-1 shadow-elevation-floating flex items-center justify-between gap-1 w-full max-w-[360px]">
        {primaryTabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'relative flex-1 min-w-[48px] h-12 rounded-full flex flex-col items-center justify-center gap-0.5',
                'touch-target-44 hit-area-expand select-none transition-colors duration-150',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
                isActive ? 'text-ink font-semibold' : 'text-ink-muted hover:text-ink'
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Smooth sliding active background pill */}
                {isActive && (
                  <motion.span
                    layoutId={shouldReduceMotion ? undefined : 'mobileNavActivePill'}
                    className="absolute inset-1 bg-white/[0.12] rounded-full shadow-elevation-subtle -z-10"
                    transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
                  />
                )}

                <Icon
                  size={20}
                  className={clsx(
                    'transition-transform duration-150',
                    isActive && 'text-accent-primary scale-110'
                  )}
                />
                <span className="text-[10px] leading-none tracking-tight truncate max-w-[48px]">
                  {label}
                </span>

                {/* Subtle active accent indicator dot */}
                {isActive && (
                  <span
                    className="w-1 h-1 rounded-full bg-accent-primary absolute bottom-1 shadow-glow-perception"
                    aria-hidden="true"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* 6th Tab: Secondary / More Menu Trigger */}
        <motion.button
          type="button"
          onClick={() => setMoreOpen((prev) => !prev)}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.90 }}
          className={clsx(
            'relative flex-1 min-w-[48px] h-12 rounded-full flex flex-col items-center justify-center gap-0.5',
            'touch-target-44 hit-area-expand select-none transition-colors duration-150 cursor-pointer',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
            moreOpen || isSecondaryActive
              ? 'text-ink font-semibold'
              : 'text-ink-muted hover:text-ink'
          )}
          aria-label="More navigation items and actions"
          aria-expanded={moreOpen}
        >
          {(moreOpen || isSecondaryActive) && (
            <motion.span
              layoutId={shouldReduceMotion ? undefined : 'mobileNavActivePill'}
              className="absolute inset-1 bg-white/[0.12] rounded-full shadow-elevation-subtle -z-10"
              transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
            />
          )}
          <MoreHorizontal
            size={20}
            className={clsx(
              'transition-transform duration-150',
              (moreOpen || isSecondaryActive) && 'text-accent-primary scale-110'
            )}
          />
          <span className="text-[10px] leading-none tracking-tight">More</span>
          {isSecondaryActive && (
            <span
              className="w-1 h-1 rounded-full bg-accent-primary absolute bottom-1 shadow-glow-perception"
              aria-hidden="true"
            />
          )}
        </motion.button>
      </div>
    </nav>
  );
}
