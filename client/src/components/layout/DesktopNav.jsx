import { motion, useReducedMotion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  LayoutDashboard,
  Flame,
  CalendarCheck,
  Scroll,
  ShoppingBag,
  Timer,
  Moon,
  Coins,
  Shield,
  Swords,
  LogOut,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';

import { spring } from '@/lib/motion';
import { useAuth } from '@/features/auth/hooks';
import { useCharacter } from '@/features/character/hooks';
import { useRestModeStatus } from '@/features/rest-mode/hooks';
import {
  openAttributesDrawer,
  openBattleLogDrawer,
} from '@/features/celebration/celebrationEvents';

/**
 * Primary navigation items for the floating command chrome.
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
 * DesktopNav — Integrated Floating 3-Zone Command Chrome.
 * Replaces the conventional fixed left SaaS sidebar with a floating,
 * cinematic personal operating system header.
 *
 * @param {object} props
 * @param {() => void} [props.onOpenAuth] - Trigger to open AuthModal
 */
export function DesktopNav({ onOpenAuth }) {
  const shouldReduceMotion = useReducedMotion();
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  const { data: character = {} } = useCharacter();
  const { data: restStatus } = useRestModeStatus();

  // Character progression numbers
  const level = character.level ?? 4;
  const hp = character.hp ?? 62;
  const maxHp = character.maxHp ?? 80;
  const mana = character.mana ?? 30;
  const maxMana = character.maxMana ?? 50;
  const xp = character.xp ?? 320;
  const xpForNextLevel = character.xpForNextLevel ?? 604;
  const gold = character.gold ?? 145;

  const xpPct = Math.max(0, Math.min(100, Math.round((xp / Math.max(1, xpForNextLevel)) * 100)));
  const hpPct = Math.max(0, Math.min(100, Math.round((hp / Math.max(1, maxHp)) * 100)));
  const isLowHp = hpPct < 25;

  const displayName = user?.displayName || 'Hero';
  const avatarUrl = user?.avatarUrl;

  return (
    <header
      className="fixed top-3 inset-x-0 z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-none safe-top"
      aria-label="Application Command Header"
    >
      <div className="pointer-events-auto material-translucent border-glass-edge rounded-card-lg px-3.5 py-2 flex items-center justify-between gap-3 lg:gap-4 shadow-elevation-floating transition-all duration-200">
        {/* ══════════════════════════════════════════════
            ZONE 1: Identity, Level & Status
            ══════════════════════════════════════════════ */}
        <div className="flex items-center gap-3 shrink-0">
          {/* LifeOS Brand Emblem */}
          <NavLink
            to="/"
            className="flex items-center gap-2 group p-1 -m-1 rounded-control hit-area-expand focus-visible:outline-2 focus-visible:outline-accent-primary"
            title="LifeOS Home"
            aria-label="LifeOS Home"
          >
            <div className="w-8 h-8 rounded-control bg-gradient-to-br from-accent-primary/20 via-accent-secondary/15 to-transparent border border-white/10 flex items-center justify-center text-accent-primary shadow-inner group-hover:border-accent-primary/40 transition-colors">
              <Sparkles size={16} className="transition-transform duration-200 group-hover:scale-110" />
            </div>
            <span className="hidden xl:inline font-display font-bold text-sm tracking-tight text-ink group-hover:text-white transition-colors">
              LifeOS
            </span>
          </NavLink>

          <div className="h-4 w-px bg-white/10 hidden sm:block" aria-hidden="true" />

          {/* Interactive Player Avatar & Attributes Trigger */}
          <motion.button
            type="button"
            onClick={openAttributesDrawer}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
            className={clsx(
              'flex items-center gap-2 group p-1 -m-1 rounded-control hit-area-expand cursor-pointer',
              'hover:bg-white/[0.04] transition-colors',
              'focus-visible:outline-2 focus-visible:outline-accent-primary'
            )}
            title="View Hero Attributes & Skills"
            aria-label={`View attributes for ${displayName}, Level ${level}`}
          >
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border border-gold/40 shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-obsidian-800 border border-gold/40 flex items-center justify-center text-gold shadow-sm">
                  <UserIcon size={16} />
                </div>
              )}
              {/* Level Chip */}
              <span className="absolute -bottom-1 -right-1.5 bg-obsidian-900 text-gold border border-gold/50 rounded-full px-1 text-[9px] font-mono font-bold leading-none shadow">
                {level}
              </span>
            </div>

            <div className="hidden lg:flex flex-col text-left">
              <span className="text-caption font-semibold text-ink leading-tight truncate max-w-[100px] xl:max-w-[130px]">
                {displayName}
              </span>
              <span className="text-[10px] text-ink-muted leading-none font-mono">
                Lv. {level} Hero
              </span>
            </div>
          </motion.button>

          {/* Rest Mode Status Pill */}
          {restStatus?.isActive && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-950/80 border border-teal-600/40 text-teal-300 text-[11px] font-medium shadow-sm shrink-0"
              title={`Rest Mode Active: HP reset penalties are paused${restStatus.autoDeactivateAt ? ` until ${new Date(restStatus.autoDeactivateAt).toLocaleDateString()}` : ''}`}
            >
              <Moon size={11} className="text-teal-400 shrink-0" />
              <span className="hidden md:inline">Resting</span>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════
            ZONE 2: Center Floating Route Navigation Pill
            ══════════════════════════════════════════════ */}
        <nav
          className="flex items-center gap-0.5 bg-black/25 border border-white/5 rounded-full p-1 shadow-inner"
          aria-label="Main Navigation"
        >
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'relative min-h-[38px] px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium transition-colors duration-150',
                  'hit-area-expand cursor-pointer select-none',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
                  isActive
                    ? 'text-ink font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-white/[0.04]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Sliding Active Pill Indicator */}
                  {isActive && (
                    <motion.span
                      layoutId={shouldReduceMotion ? undefined : 'desktopNavActivePill'}
                      className="absolute inset-0 bg-white/[0.09] border border-white/10 rounded-full shadow-elevation-subtle -z-10"
                      transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
                    />
                  )}
                  <Icon size={16} className={clsx('shrink-0 transition-transform duration-150', isActive && 'text-accent-primary')} />
                  <span className="hidden lg:inline-block tracking-tight">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ══════════════════════════════════════════════
            ZONE 3: Progression Telemetry & Global Controls
            ══════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          {/* Compact XP Gauge */}
          <div
            className="hidden xl:flex flex-col gap-0.5 w-24"
            title={`XP: ${xp} / ${xpForNextLevel} (${xpPct}%)`}
          >
            <div className="flex items-center justify-between text-[10px] leading-tight font-mono">
              <span className="text-xp font-semibold uppercase">XP</span>
              <span className="text-ink-muted tabular-nums">{xpPct}%</span>
            </div>
            <div className="bg-obsidian-700/80 rounded-full h-1.5 overflow-hidden p-px shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-xp to-gold rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={shouldReduceMotion ? { duration: 0 } : spring.gentle}
              />
            </div>
          </div>

          {/* HP Pill */}
          <div
            className={clsx(
              'flex items-center gap-1 px-2 py-1 rounded-chip border text-[11px] font-mono tabular-nums font-semibold',
              isLowHp
                ? 'bg-hp/15 border-hp/40 text-hp animate-pulse'
                : 'bg-obsidian-800/80 border-hp/25 text-hp shadow-inner'
            )}
            title={`HP: ${hp} / ${maxHp}`}
          >
            <span className="text-[9px] uppercase font-display tracking-wider text-hp/80">HP</span>
            <span>{hp}</span>
          </div>

          {/* MP Pill */}
          <div
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded-chip bg-obsidian-800/80 border border-mana/25 text-mana text-[11px] font-mono tabular-nums font-semibold shadow-inner"
            title={`Mana: ${mana} / ${maxMana}`}
          >
            <span className="text-[9px] uppercase font-display tracking-wider text-mana/80">MP</span>
            <span>{mana}</span>
          </div>

          {/* Gold Counter */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-chip bg-obsidian-800/90 border border-gold/30 text-gold shadow-inner"
            title={`${gold} Gold`}
          >
            <Coins size={14} className="text-gold shrink-0" />
            <span className="font-mono font-bold text-xs tabular-nums">{gold}</span>
          </div>

          {/* Battle Activity Feed Button */}
          <motion.button
            type="button"
            onClick={openBattleLogDrawer}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
            className={clsx(
              'w-8 h-8 rounded-control border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-ink-muted hover:text-ink',
              'flex items-center justify-center hit-area-expand cursor-pointer transition-colors',
              'focus-visible:outline-2 focus-visible:outline-accent-primary'
            )}
            title="Battle Activity Feed"
            aria-label="Open Battle Activity Feed"
          >
            <Swords size={15} className="text-gold" />
          </motion.button>

          {/* Attributes Radar Drawer Trigger */}
          <motion.button
            type="button"
            onClick={openAttributesDrawer}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
            className={clsx(
              'w-8 h-8 rounded-control border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-ink-muted hover:text-ink',
              'flex items-center justify-center hit-area-expand cursor-pointer transition-colors',
              'focus-visible:outline-2 focus-visible:outline-accent-primary'
            )}
            title="View Attributes Radar"
            aria-label="Open Attributes Radar"
          >
            <Shield size={15} className="text-attr-willpower" />
          </motion.button>

          {/* User Session Auth / Logout */}
          {isAuthenticated && user ? (
            <motion.button
              type="button"
              onClick={() => logout()}
              disabled={isLoggingOut}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
              className={clsx(
                'w-8 h-8 rounded-control border border-white/10 bg-white/[0.03] hover:bg-attr-strength/20 hover:border-attr-strength/40 text-ink-muted hover:text-attr-strength',
                'flex items-center justify-center hit-area-expand cursor-pointer transition-colors',
                'focus-visible:outline-2 focus-visible:outline-accent-primary'
              )}
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={14} />
            </motion.button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className={clsx(
                'px-3 py-1 rounded-control bg-accent-primary/15 hover:bg-accent-primary/25 border border-accent-primary/30',
                'text-accent-primary text-xs font-semibold hit-area-expand cursor-pointer transition-colors',
                'focus-visible:outline-2 focus-visible:outline-accent-primary'
              )}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

DesktopNav.propTypes = {
  onOpenAuth: PropTypes.func,
};
