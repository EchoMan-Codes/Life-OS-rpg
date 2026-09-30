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
 * Mobile bottom tab bar — fixed bottom, visible only below md.
 * Contains 4 primary tabs + expandable "More" hub for secondary features.
 */
export function BottomNav({ onOpenAuth }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const isMoreActive = ['/focus', '/reflection', '/shop'].includes(location.pathname);

  return (
    <>
      <nav
        className={clsx(
          'fixed bottom-0 inset-x-0 z-40',
          'md:hidden',
          'flex items-center justify-around',
          'h-16 px-1',
          'bg-obsidian-900/95 backdrop-blur-xl',
          'border-t border-glass-border shadow-2xl',
          'safe-bottom'
        )}
      >
        {primaryNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMoreOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center gap-0.5',
                'flex-1 py-1',
                'text-[10px] font-medium',
                'min-h-[48px]',
                'transition-colors duration-150',
                'focus:outline-none',
                isActive ? 'text-ink' : 'text-ink-muted'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={20} className={isActive ? 'text-attr-perception' : ''} />
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-attr-perception shadow-glow-perception"
                    />
                  )}
                </div>
                <span className={isActive ? 'font-semibold' : ''}>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* More Hub Button */}
        <button
          type="button"
          onClick={() => setMoreOpen((prev) => !prev)}
          aria-label="Open more features menu"
          className={clsx(
            'flex flex-col items-center justify-center gap-0.5',
            'flex-1 py-1',
            'text-[10px] font-medium',
            'min-h-[48px]',
            'transition-colors duration-150',
            'focus:outline-none',
            isMoreActive || moreOpen ? 'text-gold' : 'text-ink-muted'
          )}
        >
          <div className="relative">
            <Menu size={20} className={isMoreActive || moreOpen ? 'text-gold' : ''} />
            {(isMoreActive || moreOpen) && (
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gold shadow-glow" />
            )}
          </div>
          <span className={isMoreActive || moreOpen ? 'font-semibold text-gold' : ''}>Hub</span>
        </button>
      </nav>

      {/* Expandable Mobile Hub Drawer */}
      <AnimatePresence>
        {moreOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-sm"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={spring.snappy}
              className="relative z-10 rounded-t-3xl bg-obsidian-900 border-t border-glass-border p-5 pb-8 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Grabber bar & Header */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-1 rounded-full bg-obsidian-700 mb-3" />
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold font-bold text-xs">
                      Ω
                    </div>
                    <span className="text-sm font-bold font-display text-ink">Life OS Command Hub</span>
                  </div>
                  <button
                    onClick={() => setMoreOpen(false)}
                    className="p-1.5 text-ink-muted hover:text-ink rounded-lg bg-glass min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Navigation Grid */}
              <div className="space-y-2 pt-1">
                {moreNavItems.map(({ to, icon: Icon, label, desc, color, bg }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3.5 p-3 rounded-2xl border transition-all min-h-[56px]',
                        isActive
                          ? 'bg-glass border-glass-border text-ink'
                          : 'bg-obsidian-800/80 border-glass-border/60 hover:bg-glass text-ink-muted hover:text-ink'
                      )
                    }
                  >
                    <div className={clsx('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0', bg, color)}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-ink leading-tight">{label}</div>
                      <div className="text-[11px] text-ink-muted leading-tight mt-0.5 truncate">{desc}</div>
                    </div>
                  </NavLink>
                ))}
              </div>

              {/* RPG Quick Utilities */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-glass-border">
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    openAttributesDrawer();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-obsidian-800/60 border border-glass-border text-xs font-medium text-ink hover:bg-glass transition-colors min-h-[44px]"
                >
                  <Shield size={16} className="text-attr-willpower shrink-0" />
                  <span>Attributes Radar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    openBattleLogDrawer();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-obsidian-800/60 border border-glass-border text-xs font-medium text-ink hover:bg-glass transition-colors min-h-[44px]"
                >
                  <Swords size={16} className="text-gold shrink-0" />
                  <span>Battle Chronicles</span>
                </button>
              </div>

              {/* Auth Session */}
              <div className="pt-2">
                {isAuthenticated && user ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-obsidian-800 border border-glass-border">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-gold/40" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-attr-perception/20 text-attr-perception flex items-center justify-center font-bold text-xs">
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
                      className="p-2 text-ink-muted hover:text-hp rounded-lg min-h-[36px]"
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
                    className="w-full py-2.5 rounded-xl bg-attr-perception/20 text-attr-perception border border-attr-perception/40 text-xs font-semibold flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <LogIn size={15} />
                    <span>Sign In to Sync</span>
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
