import { motion, useReducedMotion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Flame,
  CalendarCheck,
  Scroll,
  ShoppingBag,
  Clock,
  Moon,
  User,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
} from 'lucide-react';

import { spring, pressable } from '@/lib/motionVariants';
import { useAuth } from '@/features/auth/hooks';

/**
 * Navigation items for primary RPG LifeOS features.
 */
const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/dailies', icon: CalendarCheck, label: 'Dailies' },
  { to: '/quests', icon: Scroll, label: 'Quests' },
  { to: '/focus', icon: Clock, label: 'Focus Chamber' },
  { to: '/reflection', icon: Moon, label: 'Reflection' },
  { to: '/shop', icon: ShoppingBag, label: 'Shop' },
  { to: '/profile', icon: User, label: 'Profile' },
];

/**
 * Desktop sidebar — fixed left, w-64 expanded / w-20 collapsed.
 * Hidden below md breakpoint.
 */
export function Sidebar({ collapsed, onToggle, onOpenAuth }) {
  const shouldReduceMotion = useReducedMotion();
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();

  return (
    <motion.aside
      className={clsx(
        'fixed top-0 left-0 h-screen z-40',
        'hidden md:flex flex-col',
        'bg-white dark:bg-obsidian-900 border-r border-slate-200/80 dark:border-glass-border',
        'shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none',
        'transition-all duration-200'
      )}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
    >
      {/* Logo / App title */}
      <div className="flex items-center h-16 px-5 border-b border-slate-200/80 dark:border-glass-border">
        {!collapsed && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/40 flex items-center justify-center text-gold font-bold font-display text-sm">
              Ω
            </div>
            <span className="text-display-sm text-slate-800 dark:text-ink truncate">Life OS</span>
          </motion.div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/40 flex items-center justify-center text-gold font-bold font-display text-sm mx-auto">
            Ω
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-2xl',
                'text-sm font-medium transition-all duration-150',
                'min-h-[44px]',
                'focus-visible:outline-2 focus-visible:outline-offset-2',
                isActive
                  ? 'bg-indigo-50/90 text-indigo-700 border border-indigo-200/70 shadow-xs font-semibold dark:bg-glass dark:text-ink dark:border-glass-border'
                  : 'text-slate-600 dark:text-ink-muted hover:bg-slate-100/70 dark:hover:bg-glass hover:text-slate-900 dark:hover:text-ink'
              )
            }
          >
            <Icon size={20} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Session / Auth Section */}
      <div className="px-3 py-3 border-t border-slate-200/80 dark:border-glass-border">
        {isAuthenticated && user ? (
          <div
            className={clsx(
              'flex items-center rounded-panel bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-glass-border p-2',
              collapsed ? 'justify-center' : 'justify-between gap-2'
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full border border-indigo-400 dark:border-attr-perception/40 object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-attr-perception/20 dark:border-attr-perception/40 flex items-center justify-center dark:text-attr-perception font-semibold text-xs shrink-0">
                  {user.displayName?.[0]?.toUpperCase() || 'H'}
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-ink truncate leading-tight">
                    {user.displayName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-ink-muted truncate leading-tight">
                    {user.email}
                  </p>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                type="button"
                onClick={() => logout()}
                disabled={isLoggingOut}
                aria-label="Log out"
                title="Log out"
                className={clsx(
                  'p-1.5 rounded-chip text-slate-400 hover:text-rose-600 dark:text-ink-muted dark:hover:text-hp hover:bg-slate-100 dark:hover:bg-white/10',
                  'transition-colors duration-150',
                  'focus-visible:outline-2 focus-visible:outline-offset-2'
                )}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className={clsx(
              'w-full flex items-center justify-center gap-2',
              'py-2 px-3 rounded-panel',
              'bg-indigo-50/90 hover:bg-indigo-100/90 text-indigo-700 border border-indigo-200/80',
              'dark:bg-attr-perception/10 dark:hover:bg-attr-perception/20 dark:border-attr-perception/30 dark:text-attr-perception',
              'text-xs font-medium min-h-[40px] transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2'
            )}
            {...(shouldReduceMotion ? {} : pressable)}
          >
            <LogIn size={16} className="shrink-0" />
            {!collapsed && <span>Sign In</span>}
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={clsx(
          'flex items-center justify-center',
          'h-12 mx-3 mb-4 rounded-panel',
          'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 dark:text-ink-muted dark:hover:text-ink dark:hover:bg-glass',
          'transition-colors duration-150',
          'min-h-[44px]',
          'focus-visible:outline-2 focus-visible:outline-offset-2'
        )}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </motion.aside>
  );
}
