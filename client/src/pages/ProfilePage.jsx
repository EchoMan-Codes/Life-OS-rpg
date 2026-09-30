import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Shield,
  Brain,
  Heart,
  Zap,
  Eye,
  Plus,
  Flame,
  User as UserIcon,
  LogOut,
  Swords,
  Volume2,
  VolumeX,
  Calendar,
  Sun,
  Moon,
  TrendingUp,
  Activity,
  ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

import { Card } from '@/components/ui';
import { spring } from '@/lib/motionVariants';
import { useAuth } from '@/features/auth/hooks';
import { useCharacter, useAllocateAttribute } from '@/features/character/hooks';
import { useHabits } from '@/features/habits/hooks';
import { useDailies } from '@/features/dailies/hooks';
import { useFloatingText } from '@/features/character/floatingText';
import { openBattleLogDrawer } from '@/features/celebration/celebrationEvents';
import { AttributesRadarChart } from '@/components/hud/AttributesRadarChart';
import { useTheme } from '@/lib/theme';

const ATTR_DETAILS = [
  {
    key: 'strength',
    name: 'Strength',
    stat: 'STR',
    icon: Shield,
    color: '#DC2626',
    colorClass: 'text-attr-strength',
    bgClass: 'bg-attr-strength/10 border-attr-strength/25',
    desc: 'Physical power (+4 Max HP per point). Drives execution capacity and work stamina.',
  },
  {
    key: 'intelligence',
    name: 'Intelligence',
    stat: 'INT',
    icon: Brain,
    color: '#38BDF8',
    colorClass: 'text-attr-intelligence',
    bgClass: 'bg-attr-intelligence/10 border-attr-intelligence/25',
    desc: 'Cognitive acuity (+3 Max Mana per point). Deep work retention & complex problem solving.',
  },
  {
    key: 'vitality',
    name: 'Vitality',
    stat: 'VIT',
    icon: Heart,
    color: '#34D399',
    colorClass: 'text-attr-vitality',
    bgClass: 'bg-attr-vitality/10 border-attr-vitality/25',
    desc: 'Biological resilience (+4 Max HP per point). Fatigue resistance & immune recovery.',
  },
  {
    key: 'willpower',
    name: 'Willpower',
    stat: 'WIL',
    icon: Zap,
    color: '#A78BFA',
    colorClass: 'text-attr-willpower',
    bgClass: 'bg-attr-willpower/10 border-attr-willpower/25',
    desc: 'Habit discipline (+3 Max Mana per point). Resistance against distraction and cognitive drift.',
  },
  {
    key: 'perception',
    name: 'Perception',
    stat: 'PER',
    icon: Eye,
    color: '#FBBF24',
    colorClass: 'text-attr-perception',
    bgClass: 'bg-attr-perception/10 border-attr-perception/25',
    desc: 'Mindful clarity, burnout sensing, and daily streak consistency.',
  },
];

function getWeekDays() {
  const now = new Date();
  const currentDayOfWeek = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - currentDayOfWeek);

  const days = [];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    days.push({
      label: dayLabels[i],
      dateNumber: d.getDate(),
      isToday: i === currentDayOfWeek,
      isPast: i < currentDayOfWeek,
    });
  }
  return days;
}

/**
 * Dedicated Profile & Personal Space Page.
 * Implements Reference 4 layout principles with rich asymmetric desktop composition
 * and touch-friendly mobile hierarchy.
 */
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { data: character = {} } = useCharacter();
  const { data: habits = [] } = useHabits();
  const { data: dailies = [] } = useDailies();
  const allocateMutation = useAllocateAttribute();
  const { spawnFloatingText } = useFloatingText();
  const { mode, setMode } = useTheme();

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('lifeos_sound_enabled') !== 'false';
  });

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('lifeos_sound_enabled', String(next));
      return next;
    });
  };

  const attributes = character.attributes || {};
  const unallocatedPoints = character.unallocatedPoints || 0;
  const level = character.level || 1;
  const xp = character.xp || 0;
  const xpForNextLevel = character.xpForNextLevel || 100;
  const xpRemaining = Math.max(0, xpForNextLevel - xp);
  const xpPercent = Math.min(100, Math.round((xp / xpForNextLevel) * 100));

  const bestStreak = useMemo(() => {
    const habitStreaks = habits.map((h) => h.streakCurrent || 0);
    return habitStreaks.length > 0 ? Math.max(...habitStreaks, 0) : 0;
  }, [habits]);

  const weekDays = useMemo(() => getWeekDays(), []);

  const handleAllocate = async (attributeKey, attributeName) => {
    try {
      await allocateMutation.mutateAsync({ attribute: attributeKey, points: 1 });
      spawnFloatingText(`+1 ${attributeName}`);
    } catch (err) {
      console.error('Failed to allocate point:', err);
    }
  };

  const displayName = user?.displayName || 'Hero Operator';
  const email = user?.email || 'operator@lifeos.local';
  const avatarUrl = user?.avatarUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.snappy}
      className="space-y-6 max-w-7xl mx-auto pb-16"
    >
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-glass-border pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10px] font-mono tracking-widest uppercase mb-1">
            <Sparkles size={11} />
            <span>Personal Sanctum</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-ink tracking-tight">
            Profile & Character Control Center
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted">
            Manage your personal identity, RPG instrumentation, appearance modes, and system preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openBattleLogDrawer}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold/15 hover:bg-gold/25 text-gold border border-gold/40 text-xs font-semibold transition-all active:scale-95"
          >
            <Swords size={14} />
            <span>Chronicles</span>
          </button>
        </div>
      </div>

      {/* ── Main Asymmetric Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols on desktop): Identity, Week Strip, Mode, Preferences */}
        <div className="lg:col-span-4 space-y-5">
          {/* Identity Card (Ref 4) */}
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-gold/50 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/20 to-obsidian-800 border-2 border-gold/40 flex items-center justify-center text-gold font-display font-extrabold text-2xl shadow-lg">
                    <UserIcon size={28} />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 bg-obsidian-950 text-gold border border-gold/60 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold shadow-md">
                  Lv.{level}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-bold font-display text-ink truncate">
                  {displayName}
                </h2>
                <p className="text-xs text-ink-muted truncate font-mono mt-0.5">
                  {email}
                </p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10px] font-mono font-bold">
                    <Flame size={12} className="fill-current" />
                    <span>{bestStreak > 0 ? `${bestStreak}d Streak` : 'Streak Active'}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-ink-muted text-[10px] font-mono">
                    Level {level} Sovereign
                  </span>
                </div>
              </div>
            </div>

            {/* Level XP Progress Gauge */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.07] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted font-medium flex items-center gap-1.5">
                  <Sparkles size={12} className="text-xp" />
                  <span>XP Progress</span>
                </span>
                <span className="font-mono text-ink font-bold">
                  {xp} / {xpForNextLevel}
                </span>
              </div>
              <div className="h-2 rounded-full bg-obsidian-800 overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-xp to-gold rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={spring.snappy}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-ink-muted font-mono">
                <span>{xpPercent}% completed</span>
                <span>{xpRemaining} XP to next level</span>
              </div>
            </div>
          </Card>

          {/* 7-Day Week Discipline Strip (Ref 4) */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink uppercase tracking-wider font-display">
                <Calendar size={13} className="text-attr-perception" />
                <span>Weekly Discipline Strip</span>
              </div>
              <span className="text-[10px] font-mono text-ink-muted">
                {bestStreak > 0 ? `${bestStreak}-day momentum` : 'Daily focus'}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-1">
              {weekDays.map((day) => {
                const isToday = day.isToday;
                const isPast = day.isPast;

                return (
                  <div
                    key={day.label}
                    className={clsx(
                      'flex flex-col items-center py-2 px-1 rounded-xl border transition-all text-center',
                      isToday
                        ? 'bg-gradient-to-b from-attr-perception/20 to-gold/10 border-attr-perception/50 shadow-[0_0_15px_rgba(251,191,36,0.15)] ring-1 ring-attr-perception/40'
                        : isPast
                        ? 'bg-white/[0.03] border-white/10'
                        : 'bg-white/[0.01] border-white/5 opacity-60'
                    )}
                  >
                    <span
                      className={clsx(
                        'text-[9px] font-mono uppercase tracking-wider',
                        isToday ? 'text-attr-perception font-bold' : 'text-ink-muted'
                      )}
                    >
                      {day.label}
                    </span>
                    <span
                      className={clsx(
                        'text-xs font-bold font-mono mt-0.5',
                        isToday ? 'text-ink' : 'text-ink-muted'
                      )}
                    >
                      {day.dateNumber}
                    </span>
                    <div className="mt-1">
                      {isPast || isToday ? (
                        <div
                          className={clsx(
                            'w-1.5 h-1.5 rounded-full',
                            isToday ? 'bg-attr-perception animate-pulse' : 'bg-emerald-400'
                          )}
                        />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Appearance Mode Controller (Requirement 10) */}
          <Card className="p-5 space-y-3">
            <div className="text-xs font-bold text-ink uppercase tracking-wider font-display">
              Appearance Mode
            </div>
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              {[
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'dim', label: 'Dim', icon: Sparkles },
                { id: 'light', label: 'Light', icon: Sun },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={clsx(
                      'py-2 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all',
                      isActive
                        ? 'bg-white/10 text-ink font-bold shadow-sm border border-white/20'
                        : 'text-ink-muted hover:text-ink hover:bg-white/[0.04]'
                    )}
                  >
                    <Icon size={14} className={isActive ? 'text-attr-perception' : 'text-ink-muted'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* System Preferences Card (Ref 4) */}
          <Card className="p-5 space-y-3">
            <div className="text-xs font-bold text-ink uppercase tracking-wider font-display">
              Preferences & Account
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={toggleSound}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 transition-all text-xs text-ink"
              >
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? (
                    <Volume2 size={16} className="text-attr-perception" />
                  ) : (
                    <VolumeX size={16} className="text-ink-muted" />
                  )}
                  <span>Audio Haptic FX</span>
                </div>
                <span className="font-mono text-[11px] text-ink-muted uppercase">
                  {soundEnabled ? 'Enabled' : 'Muted'}
                </span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await logout();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-hp/10 hover:bg-hp/15 border border-hp/20 transition-all text-xs text-hp font-semibold mt-3"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut size={16} />
                  <span>Sign Out of Sanctum</span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                  Disconnect
                </span>
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column (8 cols on desktop): Attributes Instrumentation & Radar Visualizer */}
        <div className="lg:col-span-8 space-y-5">
          {/* Attributes Instrumentation Deck (Requirement 7) */}
          <Card className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-glass-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
                  <Shield size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold font-display text-ink">
                    Personal Development Instrumentation
                  </h2>
                  <p className="text-[11px] text-ink-muted">
                    Balanced RPG attribute growth across physical, cognitive, and discipline vectors
                  </p>
                </div>
              </div>

              {unallocatedPoints > 0 && (
                <span className="px-3 py-1 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs font-mono font-bold animate-pulse">
                  +{unallocatedPoints} Stat Points Ready
                </span>
              )}
            </div>

            {/* Radar Chart Visualizer */}
            <div className="py-2 flex flex-col items-center bg-white/[0.01] rounded-2xl border border-white/5">
              <AttributesRadarChart attributes={attributes} />
            </div>

            {/* 5 Attributes Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {ATTR_DETAILS.map((attr) => {
                const Icon = attr.icon;
                const val = attributes[attr.key] ?? 5;
                const maxBaseline = 25;
                const barPercent = Math.min(100, Math.round((val / maxBaseline) * 100));

                return (
                  <div
                    key={attr.key}
                    className={clsx(
                      'p-4 rounded-2xl border transition-all space-y-2.5',
                      attr.bgClass
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={clsx(
                            'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                            attr.colorClass
                          )}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-ink text-sm">
                              {attr.name}
                            </span>
                            <span
                              className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold"
                              style={{
                                backgroundColor: `${attr.color}20`,
                                color: attr.color,
                              }}
                            >
                              {attr.stat}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-ink">
                          {val}
                        </span>
                        {unallocatedPoints > 0 && (
                          <button
                            type="button"
                            onClick={() => handleAllocate(attr.key, attr.name)}
                            disabled={allocateMutation.isPending}
                            aria-label={`Allocate 1 point to ${attr.name}`}
                            className="w-6 h-6 rounded-lg bg-gold/20 hover:bg-gold/30 border border-gold/40 text-gold flex items-center justify-center transition-all active:scale-95"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 rounded-full bg-black/40 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: attr.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${barPercent}%` }}
                        transition={spring.snappy}
                      />
                    </div>

                    <p className="text-[11px] text-ink-muted leading-relaxed">
                      {attr.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
