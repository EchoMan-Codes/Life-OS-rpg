import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import {
  LayoutDashboard,
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
} from 'lucide-react';

import { useAuth } from '@/features/auth/hooks';
import { openBattleLogDrawer, openAttributesDrawer } from '@/features/celebration/celebrationEvents';
import { spring } from '@/lib/motionVariants';

const primaryNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/dailies', icon: CalendarCheck, label: 'Dailies' },
  { to: '/quests', icon: Scroll, label: 'Quests' },
];

const moreNavItems = [
  {
    to: '/focus',
    icon: Clock,
    label: 'Focus Chamber',
    desc: 'Deep work timer & Mana regeneration',
    color: 'text-mana',
    bg: 'bg-mana/15 border-mana/30',
  },
  {
    to: '/reflection',
    icon: Moon,
    label: 'Evening Reflection',
    desc: 'Mindful decompression & 30d heatmap',
    color: 'text-teal-400',
    bg: 'bg-teal-500/15 border-teal-500/30',
  },
  {
    to: '/shop',
    icon: ShoppingBag,
    label: 'Reward Shop',
    desc: 'Spend hard-earned gold on loot',
    color: 'text-gold',
    bg: 'bg-gold/15 border-gold/30',
  },
];

/**
 * Mobile iOS-inspired floating rounded glassy navbar.
 * Elevated pill elevated above the screen edge with smooth spring tab transitions.
 */
export function BottomNav({ onOpenAuth }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const isMoreActive = ['/focus', '/reflection', '/shop'].includes(location.pathname);

  return (
    <>
      <div className="fixed bottom-4 inset-x-3 sm:inset-x-6 max-w-md mx-auto z-40 md:hidden pointer-events-none">
        <nav
          className={clsx(
            'pointer-events-auto relative',
            'flex items-center justify-around gap-1',
            'h-16 px-2 py-1.5',
            'rounded-full',
            'bg-obsidian-950/80 backdrop-blur-2xl',
            'border border-white/15',
            'shadow-[0_12px_40px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.22)]'
          )}
        >
          {primaryNavItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMoreOpen(false)}
                className="relative flex-1 h-full flex flex-col items-center justify-center focus:outline-none select-none"
              >
                {isActive && (
                  <motion.div
                    layoutId="ios-active-nav-pill"
                    className="absolute inset-1 rounded-full bg-white/[0.12] border border-white/15 shadow-sm"
                    transition={spring.capsule}
                  />
                )}
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  transition={spring.capsule}
                  className="relative z-10 flex flex-col items-center justify-center gap-0.5"
                >
                  <Icon
                    size={19}
                    className={clsx(
                      'transition-colors duration-150',
                      isActive ? 'text-attr-perception' : 'text-ink-muted/80'
                    )}
                  />
                  <span
                    className={clsx(
                      'text-[10px] tracking-tight leading-tight transition-colors duration-150',
                      isActive ? 'font-semibold text-ink' : 'font-medium text-ink-muted/70'
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
            onClick={() => setMoreOpen((prev) => !prev)}
            aria-label="Open more features menu"
            className="relative flex-1 h-full flex flex-col items-center justify-center focus:outline-none select-none"
          >
            {(isMoreActive || moreOpen) && (
              <motion.div
                layoutId="ios-active-nav-pill"
                className="absolute inset-1 rounded-full bg-gold/15 border border-gold/30 shadow-sm"
                transition={spring.capsule}
              />
            )}
            <motion.div
              whileTap={{ scale: 0.88 }}
              transition={spring.capsule}
              className="relative z-10 flex flex-col items-center justify-center gap-0.5"
            >
              <Menu
                size={19}
                className={clsx(
                  'transition-colors duration-150',
                  isMoreActive || moreOpen ? 'text-gold' : 'text-ink-muted/80'
                )}
              />
              <span
                className={clsx(
                  'text-[10px] tracking-tight leading-tight transition-colors duration-150',
                  isMoreActive || moreOpen ? 'font-semibold text-gold' : 'font-medium text-ink-muted/70'
                )}
              >
                Hub
              </span>
            </motion.div>
          </button>
        </nav>
      </div>

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
              className="fixed inset-0 bg-obsidian-950/75 backdrop-blur-md"
            />

            {/* iOS Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={spring.ios}
              className="relative z-10 rounded-t-[36px] bg-obsidian-900/90 backdrop-blur-3xl border-t border-white/15 p-5 pb-8 shadow-[0_-12px_40px_rgba(0,0,0,0.65)] space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {/* iOS Grabber Handle & Header */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-1.5 rounded-full bg-white/25 mb-3.5" />
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold font-bold text-xs shadow-inner">
                      Ω
                    </div>
                    <div>
                      <span className="text-sm font-bold font-display text-ink block leading-tight">
                        Life OS Command Hub
                      </span>
                      <span className="text-[10px] text-ink-muted leading-tight">
                        Secondary Chambers & Arsenal
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setMoreOpen(false)}
                    aria-label="Close menu"
                    className="p-1.5 text-ink-muted hover:text-ink rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Navigation Grid (Frosted Glass Tiles) */}
              <div className="space-y-2.5 pt-1">
                {moreNavItems.map(({ to, icon: Icon, label, desc, color, bg }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all duration-200 min-h-[58px]',
                        'backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.08)] active:scale-[0.98]',
                        isActive
                          ? 'bg-white/[0.10] border-white/25 text-ink'
                          : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-ink-muted hover:text-ink'
                      )
                    }
                  >
                    <div className={clsx('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner', bg, color)}>
                      <Icon size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-ink leading-tight">{label}</div>
                      <div className="text-[11px] text-ink-muted leading-tight mt-0.5 truncate">{desc}</div>
                    </div>
                  </NavLink>
                ))}
              </div>

              {/* RPG Quick Utilities */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    openAttributesDrawer();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] border border-white/10 text-xs font-medium text-ink transition-all min-h-[46px] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                >
                  <Shield size={16} className="text-attr-willpower shrink-0" />
                  <span className="truncate">Attributes Radar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    openBattleLogDrawer();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] border border-white/10 text-xs font-medium text-ink transition-all min-h-[46px] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                >
                  <Swords size={16} className="text-gold shrink-0" />
                  <span className="truncate">Battle Chronicles</span>
                </button>
              </div>

              {/* Auth Session Pill */}
              <div className="pt-2">
                {isAuthenticated && user ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-gold/40 shadow-sm" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-attr-perception/20 text-attr-perception border border-attr-perception/30 flex items-center justify-center font-bold text-xs shadow-inner">
                          {user.displayName?.[0]?.toUpperCase() || 'H'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink truncate">{user.displayName}</p>
                        <p className="text-[10px] text-ink-muted truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMoreOpen(false);
                        logout();
                      }}
                      className="p-2 text-ink-muted hover:text-hp rounded-xl hover:bg-white/[0.06] transition-colors min-h-[36px]"
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
                    className="w-full py-3 rounded-2xl bg-attr-perception/15 hover:bg-attr-perception/25 text-attr-perception border border-attr-perception/40 text-xs font-semibold flex items-center justify-center gap-2 min-h-[46px] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] active:scale-[0.98]"
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
