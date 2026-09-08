import { motion, useReducedMotion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Flame,
  CalendarCheck,
  Scroll,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { spring } from '@/lib/motionVariants';

/**
 * Navigation items — placeholder routes for future phases.
 */
const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/dailies', icon: CalendarCheck, label: 'Dailies' },
  { to: '/quests', icon: Scroll, label: 'Quests' },
  { to: '/shop', icon: ShoppingBag, label: 'Shop' },
];

/**
 * Desktop sidebar — fixed left, w-64 expanded / w-20 collapsed.
 * Hidden below md breakpoint.
 *
 * @param {object} props
 * @param {boolean} props.collapsed - Whether the sidebar is in icon-only mode
 * @param {() => void} props.onToggle - Toggle collapsed state
 */
export function Sidebar({ collapsed, onToggle }) {
  const shouldReduceMotion = useReducedMotion();

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
