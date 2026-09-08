import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Flame,
  CalendarCheck,
  Scroll,
  ShoppingBag,
} from 'lucide-react';

/**
 * Navigation items — same as Sidebar, max 5 per spec.
 */
const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/dailies', icon: CalendarCheck, label: 'Dailies' },
  { to: '/quests', icon: Scroll, label: 'Quests' },
  { to: '/shop', icon: ShoppingBag, label: 'Shop' },
];

/**
 * Mobile bottom tab bar — fixed bottom, visible only below md.
 * Active tab gets attr-perception glow underline per spec.
 */
export function BottomNav() {
  return (
    <nav
      className={clsx(
        'fixed bottom-0 inset-x-0 z-40',
        'md:hidden',
        'flex items-center justify-around',
        'h-16 px-2',
        'bg-obsidian-900/95 backdrop-blur-glass',
        'border-t border-glass-border',
        'safe-bottom'
      )}
    >
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center gap-0.5',
              'flex-1 py-1.5',
              'text-[10px] font-medium',
              'min-h-[44px]',
              'transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-border',
              isActive
                ? 'text-ink'
                : 'text-ink-muted'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Icon size={22} />
                {isActive && (
                  <div
                    className={clsx(
                      'absolute -bottom-1.5 left-1/2 -translate-x-1/2',
                      'w-4 h-0.5 rounded-full',
                      'bg-attr-perception shadow-glow-perception'
                    )}
                  />
                )}
              </div>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
