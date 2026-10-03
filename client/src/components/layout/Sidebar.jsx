import PropTypes from 'prop-types';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import {
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  Layers,
  LayoutDashboard,
  Bot,
  ShoppingBag,
} from 'lucide-react';

import { spring } from '@/lib/motionVariants';
import { useAuth } from '@/features/auth/hooks';
import { JeevanLogo } from '@/components/ui/JeevanLogo';
import { getActiveSectionConfig } from '@/features/navigation/sectionNavConfig';

/**
 * Desktop sidebar — fixed left, w-64 expanded / w-20 collapsed.
 * Dynamically displays specialized navigation for the active Jeevan section,
 * plus a dedicated "Switch Section" trigger to open the 3D rolling cards.
 */
export function Sidebar({ collapsed, onToggle, onOpenAuth, onOpenSectionSwitcher }) {
  const shouldReduceMotion = useReducedMotion();
  const location = useLocation();
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();

  const activeConfig = getActiveSectionConfig(location.pathname);
  const items = activeConfig.sidebarItems || [];

  return (
    <motion.aside
      className={clsx(
        'fixed top-0 left-0 h-screen z-40',
        'hidden md:flex flex-col',
        'bg-[#0B091B] border-r border-white/10',
        'shadow-[4px_0_24px_rgba(0,0,0,0.5)]',
        'transition-all duration-200'
      )}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
    >
      {/* Top Logo & App Title */}
      <div className="flex items-center h-16 px-4 border-b border-white/10">
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

      {/* Active Section Banner & Quick Switcher Trigger */}
      <div className="p-3 border-b border-white/5 space-y-2">
        {!collapsed && (
          <div className="px-1 flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider text-purple-300 font-bold uppercase">
              {activeConfig.badge}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22D3EE]" />
          </div>
        )}

        <button
          type="button"
          onClick={onOpenSectionSwitcher}
          className={clsx(
            'w-full py-2 px-3 rounded-2xl flex items-center gap-2.5 transition-all cursor-pointer group',
            'bg-gradient-to-r from-purple-900/40 to-indigo-900/30 border border-purple-500/30 hover:border-purple-400/60 shadow-md',
            collapsed ? 'justify-center px-0' : 'justify-between'
          )}
          title="Switch Section (Rolling Cards)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
              <Layers size={13} />
            </div>
            {!collapsed && (
              <span className="text-xs font-bold text-white truncate">
                {activeConfig.title}
              </span>
            )}
          </div>
          {!collapsed && (
            <span className="text-[10px] font-mono text-purple-300 group-hover:text-cyan-300 transition-colors">
              SWITCH ↺
            </span>
          )}
        </button>
      </div>

      {/* Specialized Section Nav Items */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider px-2 py-1">
            Section Modules
          </p>
        )}
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-2xl',
                'text-xs font-medium transition-all duration-150',
                'min-h-[40px]',
                'focus-visible:outline-2 focus-visible:outline-offset-2',
                isActive
                  ? 'bg-purple-500/20 text-white border border-purple-500/40 shadow-sm font-semibold'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )
            }
          >
            <Icon size={18} className="shrink-0 text-purple-300" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}

        {/* Global Hub Jump Links */}
        {!collapsed && (
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider px-2 pt-4 pb-1">
            Global Hubs
          </p>
        )}
        <NavLink
          to="/"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2 rounded-2xl text-xs transition-colors',
              isActive ? 'text-white font-bold bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
            )
          }
        >
          <LayoutDashboard size={16} className="shrink-0" />
          {!collapsed && <span>Grand Dashboard</span>}
        </NavLink>

        <NavLink
          to="/ai"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2 rounded-2xl text-xs transition-colors',
              isActive ? 'text-purple-300 font-bold bg-purple-900/30' : 'text-slate-400 hover:text-purple-200 hover:bg-white/5'
            )
          }
        >
          <Bot size={16} className="shrink-0 text-purple-400" />
          {!collapsed && <span>Jeevan AI</span>}
        </NavLink>

        <NavLink
          to="/shop"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2 rounded-2xl text-xs transition-colors',
              isActive ? 'text-amber-300 font-bold bg-amber-900/30' : 'text-slate-400 hover:text-amber-200 hover:bg-white/5'
            )
          }
        >
          <ShoppingBag size={16} className="shrink-0 text-amber-400" />
          {!collapsed && <span>Rewards Shop</span>}
        </NavLink>
      </nav>

      {/* User Session / Auth Section */}
      <div className="px-3 py-3 border-t border-white/10">
        {isAuthenticated && user ? (
          <div
            className={clsx(
              'flex items-center rounded-2xl bg-white/[0.03] border border-white/10 p-2',
              collapsed ? 'justify-center' : 'justify-between gap-2'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">{user.displayName}</p>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                type="button"
                onClick={logout}
                disabled={isLoggingOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="w-full py-2 px-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogIn size={15} />
            {!collapsed && <span>Sign In</span>}
          </button>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <button
        type="button"
        onClick={onToggle}
        className="h-10 border-t border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </motion.aside>
  );
}

Sidebar.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onOpenAuth: PropTypes.func,
  onOpenSectionSwitcher: PropTypes.func.isRequired,
};
