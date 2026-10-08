import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Coins,
  Shield,
  Swords,
  User as UserIcon,
  Heart,
  Zap,
  Sparkles,
  Flame,
  CalendarCheck,
  Scroll,
  Clock,
  Moon,
  ShoppingBag,
  Trophy,
} from 'lucide-react';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { useCharacter } from '@/features/character/hooks';
import { useHabits } from '@/features/habits/hooks';
import { useAuth } from '@/features/auth/hooks';
import { LIFEOS_OPEN_ATTRIBUTES_EVENT } from '@/features/celebration/celebrationEvents';
import { spring } from '@/lib/motionVariants';
import { StatBar } from './StatBar';
import { AttributesDrawer } from './AttributesDrawer';
import { ModeButton } from '@/components/ui/ModeButton';
import { JeevanLogo } from '@/components/ui/JeevanLogo';

const PAGE_META = {
  '/habits': { title: 'Habits & Momentum', icon: Flame, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  '/dailies': { title: 'Daily Rituals', icon: CalendarCheck, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
  '/quests': { title: 'Quest Log', icon: Scroll, color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' },
  '/focus': { title: 'Focus Chamber', icon: Clock, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
  '/reflection': { title: 'Evening Reflection', icon: Moon, color: 'text-teal-500 bg-teal-500/10 border-teal-500/30' },
  '/shop': { title: 'Reward Shop', icon: ShoppingBag, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  '/profile': { title: 'Character Dossier', icon: UserIcon, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' },
};

/**
 * Context-Aware Player Status HUD.
 * - Dashboard ('/'): Complete command center overview with full XP, Mana, HP, Coins, and Level.
 * - Individual Focused Pages: Streamlined, distraction-free compact header (h-14) keeping user
 *   focused on the page purpose, while retaining on-demand access to stats via drawer.
 */
export function PlayerHud({ sidebarCollapsed = false, isDesktop = false, onOpenBattleLog }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: character = {} } = useCharacter();
  const { user } = useAuth();
  const location = useLocation();

  const isDashboard = location.pathname === '/';
  const isShop = location.pathname === '/shop';
  const pageMeta = PAGE_META[location.pathname] || {
    title: 'Command Deck',
    icon: UserIcon,
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
  };
  const PageIcon = pageMeta.icon;

  useEffect(() => {
    const handleOpen = () => setDrawerOpen(true);
    window.addEventListener(LIFEOS_OPEN_ATTRIBUTES_EVENT, handleOpen);
    return () => window.removeEventListener(LIFEOS_OPEN_ATTRIBUTES_EVENT, handleOpen);
  }, []);

  const { data: habits = [] } = useHabits();

  // Fallback defaults while initial query loads
  const level = character.level ?? 4;
  const hp = character.hp ?? 62;
  const maxHp = character.maxHp ?? 80;
  const mana = character.mana ?? 30;
  const maxMana = character.maxMana ?? 50;
  const xp = character.xp ?? 320;
  const xpForNextLevel = character.xpForNextLevel ?? 604;
  const gold = character.gold ?? 145;

  const bestStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak || h.streakCurrent || 0), 0) || (level > 1 ? 12 : 0);
  const rankText = level >= 12 ? 'Top 5%' : level >= 7 ? 'Top 10%' : level >= 3 ? 'Top 20%' : 'Top 50%';

  const displayName = user?.displayName || 'Hero';
  const avatarUrl = user?.avatarUrl;

  const hpPct = Math.max(0, Math.min(100, Math.round((hp / Math.max(1, maxHp)) * 100)));
  const manaPct = Math.max(0, Math.min(100, Math.round((mana / Math.max(1, maxMana)) * 100)));
  const xpPct = Math.max(0, Math.min(100, Math.round((xp / Math.max(1, xpForNextLevel)) * 100)));
  const isLowHp = hpPct < 25;

  // On Profile page, or on Dashboard on mobile: do not render sticky/fixed HUD.
  // Both pages have their own natural-scrolling hero cockpit in the regular document flow.
  if (location.pathname === '/profile' || (!isDesktop && isDashboard)) {
    return (
      <AttributesDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        character={character}
      />
    );
  }

  return (
    <>
      {!isDashboard ? (
        /* ══════════════════════════════════════════════════════════════
         * 1. FOCUSED PAGE HEADER: Sleek, compact, distraction-free
         * ══════════════════════════════════════════════════════════════ */
        <header
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            height: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
          }}
          className={clsx(
            'fixed top-0 right-0 z-40 h-14 transition-[left] duration-200',
            'bg-white/45 dark:bg-[#07080C]/40 backdrop-blur-2xl border-b border-slate-200/60 dark:border-white/10',
            'shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)]',
            isDesktop
              ? sidebarCollapsed
                ? 'left-20'
                : 'left-64'
              : 'left-0'
          )}
        >
          <div
            style={{
              paddingLeft: 'max(0.875rem, env(safe-area-inset-left, 0px))',
              paddingRight: 'max(0.875rem, env(safe-area-inset-right, 0px))',
            }}
            className="h-full flex items-center justify-between gap-3"
          >
            {/* Left: Contextual Page Title + Compact Hero Badge */}
            <div className="flex items-center gap-2 min-w-0">
              {!isDesktop && (
                <div className="shrink-0 mr-0.5">
                  <JeevanLogo variant="emblem" size="xs" />
                </div>
              )}
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-xs',
                    pageMeta.color
                  )}
                >
                  <PageIcon size={16} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-ink truncate font-display leading-tight">
                    {pageMeta.title}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-ink-muted leading-none hidden sm:inline">
                    Focused Experience
                  </span>
                </div>
              </div>

              {/* Compact Level Capsule (Expands full stats modal on demand) */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                title="View Full Character Stats & Attributes"
                aria-label="View Full Character Stats & Attributes"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/90 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 transition-all text-[11px] font-mono shrink-0 ml-1 active:scale-95 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-bold text-slate-800 dark:text-gold">Lv.{level}</span>
              </button>
            </div>

            {/* Right: Focused Tools (Coins on shop, Mode Toggle, Stats Drawer trigger) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Gold Pill: Shown when relevant in Shop */}
              {isShop && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-gold shadow-xs"
                  title={`${gold} Gold Available`}
                >
                  <Coins size={14} className="text-amber-500 dark:text-gold shrink-0" />
                  <span className="font-mono font-bold text-xs">
                    {gold}
                  </span>
                </div>
              )}

              {/* Battle Chronicles Trigger Button */}
              {onOpenBattleLog && (
                <button
                  type="button"
                  onClick={onOpenBattleLog}
                  aria-label="Open Battle Chronicles"
                  title="Battle Chronicles"
                  className={clsx(
                    'w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl border border-slate-200/80 dark:border-white/10',
                    'bg-white/80 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] active:scale-95 text-amber-600 dark:text-gold shadow-xs',
                    'flex items-center justify-center transition-all cursor-pointer',
                    'focus:outline-none focus:ring-2 focus:ring-amber-500/20'
                  )}
                >
                  <Swords size={15} className="shrink-0" />
                </button>
              )}

              {/* Instant Light/Dark Mode Toggle */}
              <ModeButton compact />

              {/* Character Attributes Trigger Button */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="View Attributes Radar & Full Stats"
                title="Character Stats & Attributes"
                className={clsx(
                  'w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl border border-slate-200/80 dark:border-white/10',
                  'bg-white/80 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] active:scale-95 text-attr-willpower shadow-xs',
                  'flex items-center justify-center transition-all cursor-pointer',
                  'focus:outline-none focus:ring-2 focus:ring-purple-500/20'
                )}
              >
                <Shield size={16} className="shrink-0" />
              </button>
            </div>
          </div>
        </header>
      ) : (
        /* ══════════════════════════════════════════════════════════════
         * 2. DASHBOARD COMMAND CENTER: Complete, immersive RPG telemetry
         * ══════════════════════════════════════════════════════════════ */
        <header
          className={clsx(
            'fixed top-0 right-0 z-40 transition-[left] duration-200',
            'bg-white/45 dark:bg-[#07080C]/40 backdrop-blur-2xl border-b border-slate-200/60 dark:border-white/10',
            'shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]',
            isDesktop
              ? sidebarCollapsed
                ? 'left-20 h-16'
                : 'left-64 h-16'
              : 'left-0 h-auto md:h-16'
          )}
        >
          {/* ── DESKTOP DASHBOARD HUD (md:flex) ── */}
          <div className="hidden md:flex h-full px-4 md:px-6 items-center justify-between gap-4 md:gap-6">
            {/* 1. Left: Avatar + Level Badge */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              title="Open Character Attributes"
              aria-label="Open character attributes"
              className={clsx(
                'flex items-center gap-2 group p-1 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/[0.06] active:scale-95 transition-all shrink-0 cursor-pointer',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-white/20'
              )}
            >
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover border border-gold/50 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-obsidian-800 border border-gold/40 flex items-center justify-center text-amber-600 dark:text-gold shadow-sm">
                    <UserIcon size={18} />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 bg-slate-900 dark:bg-obsidian-950 text-amber-400 dark:text-gold border border-gold/60 rounded-full px-1.5 text-[10px] font-mono font-bold leading-tight shadow">
                  {level}
                </span>
              </div>

              <div className="hidden xl:flex flex-col text-left">
                <span className="text-caption font-semibold text-slate-900 dark:text-ink leading-tight truncate max-w-[90px]">
                  {displayName}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-ink-muted leading-none">
                  Lv. {level} Hero
                </span>
              </div>
            </button>

            {/* 2. Middle: HP, Mana, XP StatBars */}
            <div className="flex items-center gap-3 md:gap-5 flex-1 max-w-2xl min-w-0">
              <StatBar type="hp" current={hp} max={maxHp} label="HP" />
              <StatBar type="mana" current={mana} max={maxMana} label="MP" />
              <StatBar type="xp" current={xp} max={xpForNextLevel} label="XP" />
            </div>

            {/* 3. Right: Gold Counter & Triggers */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Gold Counter */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-gold shadow-xs"
                title={`${gold} Gold`}
              >
                <Coins size={14} className="text-amber-500 dark:text-gold shrink-0" />
                <span className="font-mono font-bold text-xs sm:text-sm">
                  {gold}
                </span>
              </div>

              {/* Battle Chronicles Trigger Button */}
              {onOpenBattleLog && (
                <button
                  type="button"
                  onClick={onOpenBattleLog}
                  aria-label="Open Battle Chronicles"
                  title="Battle Chronicles"
                  className={clsx(
                    'p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10',
                    'bg-white/80 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] active:scale-95 text-amber-600 dark:text-gold shadow-xs',
                    'flex items-center gap-1 transition-all min-h-[36px] min-w-[36px] justify-center cursor-pointer',
                    'focus:outline-none focus:ring-2 focus:ring-amber-500/20'
                  )}
                >
                  <Swords size={15} className="shrink-0" />
                </button>
              )}

              {/* Mode Appearance Toggle */}
              <ModeButton />

              {/* Attributes Drawer Button */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="View Attributes Radar Chart"
                title="View Attributes"
                className={clsx(
                  'p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10',
                  'bg-white/80 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] active:scale-95 text-slate-700 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink shadow-xs',
                  'flex items-center gap-1.5 text-caption font-display font-medium',
                  'transition-all focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-white/20 min-h-[36px] cursor-pointer'
                )}
              >
                <Shield size={15} className="text-attr-willpower shrink-0" />
                <span className="hidden sm:inline">Stats</span>
              </button>
            </div>
          </div>

          {/* ── MOBILE DASHBOARD HUD (md:hidden) — Spacious & Balanced Layout matching Image 3 ── */}
          <div className="md:hidden px-3 pt-2.5 pb-2.5 flex flex-col gap-2">
            {/* Row 1: Command Header (Identity & Action Buttons) */}
            <div className="flex items-center justify-between gap-2">
              {/* Left: Player Avatar & Level Indicator */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                title="Open Character Attributes"
                aria-label="Open character attributes"
                className="flex items-center gap-2.5 group p-0.5 -ml-0.5 rounded-xl active:scale-95 transition-all text-left focus:outline-none cursor-pointer"
              >
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-amber-500/50 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-obsidian-800 border-2 border-amber-500/50 flex items-center justify-center text-amber-600 dark:text-gold shadow-sm">
                      <UserIcon size={18} />
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 bg-slate-900 dark:bg-obsidian-950 text-amber-400 dark:text-gold border border-amber-500/60 rounded-full px-1.5 py-0.2 text-[9px] font-mono font-bold leading-tight shadow-xs">
                    {level}
                  </span>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-900 dark:text-ink truncate max-w-[120px] leading-tight font-display">
                    {displayName}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-ink-muted leading-tight font-mono mt-0.5">
                    Lv. {level} • Hero
                  </span>
                </div>
              </button>

              {/* Right: Quick Action Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Battle Log Trigger */}
                {onOpenBattleLog && (
                  <button
                    type="button"
                    onClick={onOpenBattleLog}
                    aria-label="Open Battle Chronicles"
                    title="Battle Chronicles"
                    className={clsx(
                      'w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl border border-slate-200/80 dark:border-white/10',
                      'bg-white/80 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] active:scale-95 text-amber-600 dark:text-gold shadow-xs',
                      'flex items-center justify-center transition-all cursor-pointer',
                      'focus:outline-none focus:ring-2 focus:ring-amber-500/20'
                    )}
                  >
                    <Swords size={15} className="shrink-0" />
                  </button>
                )}

                {/* Instant Light/Dark Mode Toggle */}
                <ModeButton compact />

                {/* Stats / Radar Trigger */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="View Attributes Radar Chart"
                  title="View Attributes"
                  className={clsx(
                    'w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl border border-slate-200/80 dark:border-white/10',
                    'bg-white/80 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] active:scale-95 text-attr-willpower shadow-xs',
                    'flex items-center justify-center transition-all cursor-pointer',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500/20'
                  )}
                >
                  <Shield size={15} className="shrink-0" />
                </button>
              </div>
            </div>

            {/* Row 2: 3-Pill Progression Resources Deck (Coins, Streak, Rank) matching Image 3 */}
            <div className="grid grid-cols-3 gap-2">
              {/* Coins Capsule */}
              <div className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-center shadow-2xs">
                <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
                  <Coins size={11} className="text-amber-500 shrink-0" /> Coins
                </span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-gold leading-tight mt-0.5">
                  {gold}
                </span>
              </div>

              {/* Streak Capsule */}
              <div className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/25 text-center shadow-2xs">
                <span className="text-[10px] font-mono text-orange-700 dark:text-orange-300 font-medium flex items-center gap-1">
                  <Flame size={11} className="text-orange-500 fill-current shrink-0" /> Streak
                </span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-ink leading-tight mt-0.5">
                  {bestStreak}d
                </span>
              </div>

              {/* Rank Capsule */}
              <div className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/25 text-center shadow-2xs">
                <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1">
                  <Trophy size={11} className="text-purple-500 shrink-0" /> Rank
                </span>
                <span className="font-mono font-bold text-sm text-purple-700 dark:text-purple-300 leading-tight mt-0.5">
                  {rankText}
                </span>
              </div>
            </div>

            {/* Row 2: Dedicated Vitals & Telemetry Deck */}
            <div className="flex flex-col gap-1.5">
              {/* Split Vitals: HP and MP with generous width & breathing room */}
              <div className="grid grid-cols-2 gap-2">
                {/* HP Segment */}
                <div className="px-2.5 py-1.5 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] leading-tight">
                    <div className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 font-display">
                      <Heart size={11} className={clsx('shrink-0', isLowHp ? 'animate-pulse text-rose-500 fill-rose-500' : 'fill-rose-500/30')} />
                      <span>HP</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-800 dark:text-ink text-[11px]">
                      {hp}<span className="text-slate-400 dark:text-ink-muted font-normal text-[10px]">/{maxHp}</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 dark:bg-black/40 overflow-hidden relative shadow-inner">
                    <motion.div
                      className={clsx(
                        'h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_8px_rgba(225,29,72,0.4)]',
                        isLowHp && 'animate-pulse'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${hpPct}%` }}
                      transition={spring.snappy}
                    />
                  </div>
                </div>

                {/* Mana Segment */}
                <div className="px-2.5 py-1.5 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] leading-tight">
                    <div className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 font-display">
                      <Zap size={11} className="shrink-0 fill-blue-500/30" />
                      <span>MP</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-800 dark:text-ink text-[11px]">
                      {mana}<span className="text-slate-400 dark:text-ink-muted font-normal text-[10px]">/{maxMana}</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 dark:bg-black/40 overflow-hidden relative shadow-inner">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${manaPct}%` }}
                      transition={spring.snappy}
                    />
                  </div>
                </div>
              </div>

              {/* Panoramic XP Ribbon */}
              <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] leading-tight">
                  <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-gold font-display">
                    <Sparkles size={11} className="shrink-0 text-amber-500" />
                    <span>XP Progress</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="font-semibold text-slate-800 dark:text-ink">
                      {xp}<span className="text-slate-400 dark:text-ink-muted font-normal text-[10px]">/{xpForNextLevel}</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-gold">
                      ({xpPct}%)
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-black/40 overflow-hidden relative shadow-inner">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={spring.snappy}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Collapsible Attributes Side Panel */}
      <AttributesDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        character={character}
      />
    </>
  );
}

PlayerHud.propTypes = {
  sidebarCollapsed: PropTypes.bool,
  isDesktop: PropTypes.bool,
  onOpenBattleLog: PropTypes.func,
};
