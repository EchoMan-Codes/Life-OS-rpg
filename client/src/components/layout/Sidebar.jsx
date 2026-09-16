import { motion, useReducedMotion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Flame,
  CalendarCheck,
  Scroll,
  ShoppingBag,
  Timer,
  Moon,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
} from 'lucide-react';

import { spring, pressable } from '@/lib/motionVariants';
import { useAuth } from '@/features/auth/hooks';

/**
 * Navigation items — placeholder routes for future phases.
 */
const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/dailies', icon: CalendarCheck, label: 'Dailies' },
  { to: '/quests', icon: Scroll, label: 'Quests' },
  { to: '/shop', icon: ShoppingBag, label: 'Shop' },
  { to: '/focus', icon: Timer, label: 'Focus' },
  { to: '/reflection', icon: Moon, label: 'Reflection' },
];

/**
 * Desktop sidebar — fixed left, w-64 expanded / w-20 collapsed.
 * Hidden below md breakpoint.
 *
 * @param {object} props
 * @param {boolean} props.collapsed - Whether the sidebar is in icon-only mode
 * @param {() => void} props.onToggle - Toggle collapsed state
 * @param {() => void} [props.onOpenAuth] - Callback to open authentication modal
 */
export function Sidebar({ collapsed, onToggle, onOpenAuth }) {
  const shouldReduceMotion = useReducedMotion();
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();

  return (
    <motion.aside
      className={clsx(
        'fixed top-0 left-0 h-screen z-40',
        'hidden md:flex flex-col',
        'bg-obsidian-900 border-r border-glass-border',
        'transition-all duration-200'
      )}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
    >
      {/* Logo / App title */}
      <div className="flex items-center h-16 px-5 border-b border-glass-border">
        {!collapsed && (
          <motion.span
            className="text-display-sm text-ink truncate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            Life OS
          </motion.span>
        )}
        {collapsed && (
          <span className="text-display-sm text-ink mx-auto">L</span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-panel',
                'text-sm font-medium transition-colors duration-150',
                'min-h-[44px]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-border',
                isActive
                  ? 'bg-glass text-ink'
                  : 'text-ink-muted hover:bg-glass hover:text-ink'
              )
            }
          >
            <Icon size={20} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* ── User Session / Auth Section ── */}
      <div className="px-3 py-3 border-t border-glass-border">
        {isAuthenticated && user ? (
          <div
            className={clsx(
              'flex items-center rounded-panel bg-white/[0.03] border border-glass-border p-2',
              collapsed ? 'justify-center' : 'justify-between gap-2'
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full border border-attr-perception/40 object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-attr-perception/20 border border-attr-perception/40 flex items-center justify-center text-attr-perception font-semibold text-xs shrink-0">
                  {user.displayName?.[0]?.toUpperCase() || 'P'}
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink truncate leading-tight">
                    {user.displayName}
                  </p>
                  <p className="text-[11px] text-ink-muted truncate leading-tight">
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
                  'p-1.5 rounded-chip text-ink-muted hover:text-attr-strength hover:bg-white/10',
                  'transition-colors duration-150',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-border'
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
              'bg-attr-perception/10 hover:bg-attr-perception/20',
              'border border-attr-perception/30 text-attr-perception text-xs font-medium',
              'min-h-[40px] transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-border'
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
          'text-ink-muted hover:text-ink hover:bg-glass',
          'transition-colors duration-150',
          'min-h-[44px]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-border'
        )}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </motion.aside>
  );
}
