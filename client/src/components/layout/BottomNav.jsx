import { useState, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  TrendingUp,
  Sparkles,
  Flame,
  CalendarCheck,
  Scroll,
  Menu,
  ShoppingBag,
  Clock,
  Moon,
  Swords,
  X,
  LogIn,
  LogOut,
  Shield,
  User as UserIcon,
} from 'lucide-react';

import { useKeyboard } from '@/hooks/useKeyboard';
import { useAuth } from '@/features/auth/hooks';
import { useAutoHideNav } from '@/hooks/useAutoHideNav';
import { openBattleLogDrawer, openAttributesDrawer } from '@/features/celebration/celebrationEvents';
import { spring, pressableMobileNav } from '@/lib/motionVariants';
import { ModeButton } from '@/components/ui/ModeButton';
import { JeevanLogo } from '@/components/ui/JeevanLogo';
import { FeatureCardCarousel } from '@/components/ui/FeatureCardCarousel';

const primaryNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/focus', icon: Clock, label: 'Focus' },
  { to: '/insights', icon: TrendingUp, label: 'Insights' },
];

const featureCarouselItems = [
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
    iconBg: 'bg-emerald-500 text-white',
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
    icon: Moon,
    iconBg: 'bg-teal-500 text-white',
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
    icon: UserIcon,
    iconBg: 'bg-sky-500 text-white',
    title: 'Character Profile',
    description: 'Inspect 5 attributes, level progression tiers, and battle history.',
    path: '/profile',
    actionLabel: 'View Profile',
  },
];

/**
 * Mobile iOS-inspired floating rounded glassy navbar.
 * Features intelligent auto-hide on intentional scroll-down and keyboard visibility,
 * spring return on scroll-up/idle, sliding glass active tab pill, and haptic feedback.
 */
export function BottomNav({ onOpenAuth }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { isKeyboardVisible } = useKeyboard();

  const isScrollNavVisible = useAutoHideNav({ disabled: moreOpen });
  const isNavVisible = isScrollNavVisible && !isKeyboardVisible;
  const isMoreActive = [
    '/ai',
    '/insights',
    '/habits',
    '/dailies',
    '/quests',
    '/profile',
    '/reflection',
    '/shop',
  ].includes(location.pathname);

  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(8);
      } catch {}
    }
  }, []);

  return (
    <>
      <motion.div
        style={{ bottom: 'max(1rem, calc(0.5rem + env(safe-area-inset-bottom, 0px)))' }}
        initial={false}
        animate={{
          y: isNavVisible ? 0 : 88,
          opacity: isNavVisible ? 1 : 0,
          scale: isNavVisible ? 1 : 0.95,
        }}
        transition={spring.navbar}
        className={clsx(
          'fixed inset-x-3 sm:inset-x-6 max-w-md mx-auto z-40 md:hidden pointer-events-none'
        )}
        aria-hidden={!isNavVisible}
      >
        <nav
          className={clsx(
            'pointer-events-auto relative',
            'flex items-center justify-around gap-1',
            'h-16 px-2 py-1.5',
            'rounded-full',
            'floating-glass-bar'
          )}
        >
          {primaryNavItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                tabIndex={isNavVisible ? 0 : -1}
                onClick={() => {
                  triggerHaptic();
                  setMoreOpen(false);
                }}
                className="relative flex-1 h-full flex flex-col items-center justify-center focus:outline-none select-none rounded-full focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-attr-perception"
              >
                {isActive && (
                  <motion.div
                    layoutId="ios-active-nav-pill"
                    className="absolute inset-1 rounded-full bg-indigo-50/90 border border-indigo-200/80 shadow-[0_2px_10px_rgba(99,102,241,0.15)] dark:bg-white/[0.12] dark:border-white/15 dark:shadow-[0_2px_12px_rgba(255,255,255,0.08)]"
                    transition={spring.capsule}
                  />
                )}
                <motion.div
                  whileTap={{ scale: 0.91 }}
                  transition={spring.capsule}
                  className="relative z-10 flex flex-col items-center justify-center gap-0.5"
                >
                  <Icon
                    size={19}
                    className={clsx(
                      'transition-all duration-150',
                      isActive
                        ? 'text-indigo-600 dark:text-attr-perception -translate-y-0.5'
                        : 'text-slate-500 dark:text-ink-muted/80'
                    )}
                  />
                  <span
                    className={clsx(
                      'text-[10px] tracking-tight leading-tight transition-colors duration-150',
                      isActive ? 'font-bold text-indigo-700 dark:font-semibold dark:text-ink' : 'font-medium text-slate-500 dark:text-ink-muted/70'
                    )}
                  >
                    {label}
                  </span>
                </motion.div>
              </NavLink>
            );
          })}

          {/* More Hub Capsule Tab */}
          <button
            type="button"
            tabIndex={isNavVisible ? 0 : -1}
            onClick={() => {
              triggerHaptic();
              setMoreOpen((prev) => !prev);
            }}
            aria-label="Open more features menu"
            className="relative flex-1 h-full flex flex-col items-center justify-center focus:outline-none select-none rounded-full focus-visible:ring-2 focus-visible:ring-amber-500 dark:focus-visible:ring-gold"
          >
            {(isMoreActive || moreOpen) && (
              <motion.div
                layoutId="ios-active-nav-pill"
                className="absolute inset-1 rounded-full bg-amber-500/15 border border-amber-500/30 shadow-[0_2px_10px_rgba(245,158,11,0.2)] dark:bg-gold/15 dark:border-gold/30"
                transition={spring.capsule}
              />
            )}
            <motion.div
              whileTap={{ scale: 0.91 }}
              transition={spring.capsule}
              className="relative z-10 flex flex-col items-center justify-center gap-0.5"
            >
              <Menu
                size={19}
                className={clsx(
                  'transition-all duration-150',
                  isMoreActive || moreOpen
                    ? 'text-amber-600 dark:text-gold -translate-y-0.5'
                    : 'text-slate-500 dark:text-ink-muted/80'
                )}
              />
              <span
                className={clsx(
                  'text-[10px] tracking-tight leading-tight transition-colors duration-150',
                  isMoreActive || moreOpen ? 'font-bold text-amber-600 dark:text-gold' : 'font-medium text-slate-500 dark:text-ink-muted/70'
                )}
              >
                Hub
              </span>
            </motion.div>
          </button>
        </nav>
      </motion.div>

      {/* Expandable Mobile Hub Drawer (iOS Glassy Sheet) */}
      <AnimatePresence>
        {moreOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
            {/* Frosted Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-obsidian-950/75 backdrop-blur-md"
            />

            {/* iOS Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={spring.ios}
              style={{
                paddingBottom: 'max(2rem, calc(1.5rem + env(safe-area-inset-bottom, 0px)))',
                paddingLeft: 'max(1.25rem, calc(1rem + env(safe-area-inset-left, 0px)))',
                paddingRight: 'max(1.25rem, calc(1rem + env(safe-area-inset-right, 0px)))',
              }}
              className="relative z-10 rounded-t-[36px] bg-white/96 dark:bg-[#090B10]/98 backdrop-blur-3xl border-t border-slate-200/90 dark:border-white/16 p-5 shadow-[0_-16px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_-16px_50px_rgba(0,0,0,0.85)] space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {/* iOS Grabber Handle & Header */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/25 mb-3.5" />
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <JeevanLogo variant="emblem" size="xs" />
                    <div>
                      <span className="text-sm font-bold font-display text-slate-900 dark:text-ink block leading-tight">
                        Jeevan Command Hub
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-ink-muted leading-tight">
                        Secondary Chambers & Arsenal
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ModeButton compact />
                    <button
                      onClick={() => setMoreOpen(false)}
                      aria-label="Close menu"
                      className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-ink-muted dark:hover:text-ink rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Feature Scrolling Cards (Horizontal Deck matching design) */}
              <div className="pt-1">
                <FeatureCardCarousel
                  items={featureCarouselItems}
                  onSelect={(item) => {
                    setMoreOpen(false);
                    navigate(item.path);
                  }}
                />
              </div>

              {/* RPG Quick Utilities */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    openAttributesDrawer();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/90 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] active:scale-[0.98] dark:border-white/10 text-xs font-medium text-slate-800 dark:text-ink transition-all min-h-[46px] backdrop-blur-md shadow-xs"
                >
                  <Shield size={16} className="text-blue-600 dark:text-attr-willpower shrink-0" />
                  <span className="truncate">Attributes Radar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    openBattleLogDrawer();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/90 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] active:scale-[0.98] dark:border-white/10 text-xs font-medium text-slate-800 dark:text-ink transition-all min-h-[46px] backdrop-blur-md shadow-xs"
                >
                  <Swords size={16} className="text-amber-600 dark:text-gold shrink-0" />
                  <span className="truncate">Battle Chronicles</span>
                </button>
              </div>

              {/* Auth Session Pill */}
              <div className="pt-2">
                {isAuthenticated && user ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-200/90 dark:bg-white/[0.04] dark:border-white/10 backdrop-blur-md shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-amber-400 dark:border-gold/40 shadow-sm" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-attr-perception/20 dark:text-attr-perception dark:border-attr-perception/30 flex items-center justify-center font-bold text-xs shadow-inner">
                          {user.displayName?.[0]?.toUpperCase() || 'H'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-ink truncate">{user.displayName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-ink-muted truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMoreOpen(false);
                        logout();
                      }}
                      className="p-2 text-slate-500 hover:text-rose-600 dark:text-ink-muted dark:hover:text-hp rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors min-h-[36px]"
                      title="Log Out"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMoreOpen(false);
                      onOpenAuth?.();
                    }}
                    className="w-full py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-attr-perception/15 dark:hover:bg-attr-perception/25 dark:text-attr-perception dark:border-attr-perception/40 text-xs font-semibold flex items-center justify-center gap-2 min-h-[46px] transition-all shadow-xs active:scale-[0.98]"
                  >
                    <LogIn size={15} />
                    <span>Sign In to Sync Progress</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
