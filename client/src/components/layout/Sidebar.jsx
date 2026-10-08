import { useRef, useEffect } from 'react';
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
  Search,
} from 'lucide-react';

import { spring, pressable } from '@/lib/motionVariants';
import { useAuth } from '@/features/auth/hooks';
import { JeevanLogo } from '@/components/ui/JeevanLogo';

/**
 * Navigation items for primary Jeevan features.
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
export function Sidebar({ collapsed, onToggle, onOpenAuth, onOpenCommand }) {
  const shouldReduceMotion = useReducedMotion();
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  const asideRef = useRef(null);
  const rafRef = useRef(null);

  const handleMouseMove = (e) => {
    if (shouldReduceMotion || !asideRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!asideRef.current) return;
      const rect = asideRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      asideRef.current.style.setProperty('--mouse-x', `${x}px`);
      asideRef.current.style.setProperty('--mouse-y', `${y}px`);
    });
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <motion.aside
      ref={asideRef}
      onMouseMove={handleMouseMove}
      className={clsx(
        'group/sidebar fixed top-0 left-0 h-screen z-40',
        'hidden md:flex flex-col',
        'bg-white/80 dark:bg-obsidian-950/80 backdrop-blur-2xl',
        'border-r border-slate-200/80 dark:border-glass-border',
        'shadow-[4px_0_24px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_32px_rgba(0,0,0,0.45)]',
        'transition-all duration-200 overflow-hidden select-none'
      )}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
    >
      {/* Ambient cursor light-follow highlight */}
      {!shouldReduceMotion && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 z-0"
          style={{
            background:
              'radial-gradient(320px circle at var(--mouse-x, 100px) var(--mouse-y, 100px), rgba(99, 102, 241, 0.08), transparent 70%)',
          }}
        />
      )}

      {/* Top subtle inner hairline border highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent pointer-events-none z-10" />

      {/* Logo / App title */}
      <div className="flex items-center h-16 px-4 border-b border-slate-200/80 dark:border-glass-border relative z-10">
        {!collapsed && (
          <motion.div
            className="flex items-center gap-2 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            <JeevanLogo variant="lockup" size="sm" showTagline={false} />
          </motion.div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <JeevanLogo variant="emblem" size="sm" />
          </div>
        )}
      </div>

      {/* Desktop Command Palette Quick Search Button */}
      <div className="px-3 pt-3 pb-1 relative z-10">
        <button
          type="button"
          onClick={onOpenCommand}
          className={clsx(
            'w-full flex items-center gap-2.5 p-2 rounded-2xl border transition-all text-left cursor-pointer min-h-[40px]',
            'bg-slate-100/90 hover:bg-slate-200/90 border-slate-200/90 text-slate-700',
            'dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/10 dark:text-ink-muted dark:hover:text-ink',
            collapsed ? 'justify-center' : 'justify-between'
          )}
          title="Command Palette (Cmd+K / Ctrl+K)"
          aria-label="Command Palette (Cmd+K / Ctrl+K)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search size={16} className="text-amber-500 shrink-0" />
            {!collapsed && <span className="text-xs truncate font-medium">Quick Search...</span>}
          </div>
          {!collapsed && (
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-white/10 text-slate-500 dark:text-white/60 border border-slate-200 dark:border-white/10 shadow-2xs">
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 px-3 space-y-1.5 overflow-y-auto relative z-10" aria-label="Desktop Navigation">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'group/item relative flex items-center gap-3 px-3 py-2.5 rounded-2xl',
                'text-sm font-medium transition-colors duration-150',
                'min-h-[44px]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-obsidian-950',
                isActive
                  ? 'text-indigo-600 dark:text-ink font-semibold'
                  : 'text-slate-600 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink hover:bg-slate-100/60 dark:hover:bg-white/[0.04]'
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active pill sliding indicator */}
                {isActive && (
                  <motion.div
                    layoutId="desktop-active-nav-pill"
                    className="absolute inset-0 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/25 dark:border-indigo-400/30 shadow-xs pointer-events-none"
                    transition={shouldReduceMotion ? { duration: 0 } : spring.navbar}
                  />
                )}

                <Icon
                  size={20}
                  className={clsx(
                    'shrink-0 relative z-10 transition-transform duration-150',
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 scale-105'
                      : 'text-slate-500 dark:text-ink-muted group-hover/item:scale-105'
                  )}
                />
                {!collapsed && <span className="truncate relative z-10">{label}</span>}

                {/* Collapsed Tooltip reveal with short spring */}
                {collapsed && (
                  <span
                    className={clsx(
                      'pointer-events-none absolute left-full ml-3 px-3 py-1.5 rounded-xl',
                      'bg-slate-900/90 dark:bg-obsidian-800 text-white text-xs font-semibold whitespace-nowrap',
                      'shadow-xl border border-white/10 z-50',
                      'opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0',
                      'transition-all duration-150'
                    )}
                  >
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Session / Auth Section */}
      <div className="px-3 py-3 border-t border-slate-200/80 dark:border-glass-border relative z-10">
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
                  'transition-colors duration-150 cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500'
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
              'text-xs font-medium min-h-[40px] transition-colors duration-150 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
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
          'transition-colors duration-150 cursor-pointer',
          'min-h-[44px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
        )}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </motion.aside>
  );
}
