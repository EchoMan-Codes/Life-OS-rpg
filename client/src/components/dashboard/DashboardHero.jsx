import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Timer,
  CheckCircle2,
  Moon,
  SlidersHorizontal,
  ArrowRight,
  Crosshair,
  Shield,
  Brain,
  Heart,
  Zap,
  Eye,
  Coins,
  Sparkles,
  Check,
  ChevronRight,
} from 'lucide-react';

import { spring } from '@/lib/motion';
import {
  RpgPanel,
  HolographicFrame,
  LevelBadge,
  DifficultyBadge,
  ProgressionBar,
  TelemetryCard,
  RpgButton,
} from '@/components/rpg';
import {
  getLevelTier,
  getAttributeTheme,
} from '@/lib/progressionTiers';
import { LIFEOS_OPEN_ATTRIBUTES_EVENT } from '@/features/celebration/celebrationEvents';
import { useCompleteDaily, useUndoDaily } from '@/features/dailies/hooks';
import { useCompleteQuestItem, useUndoQuestItem } from '@/features/quests/hooks';
import { useToast } from '@/components/ui/useToast';

/**
 * DashboardHero — High-end cinematic RPG command center hero deck.
 *
 * Implements:
 * 1. Top Command Bar: Stardate, Operator Greeting, State Pill, Layout Config
 * 2. Two-Column Hero Deck:
 *    - Left: Hero Character Card (Player Status, Level, Tier, XP, HP/Mana/Gold, 5 Attributes)
 *    - Right: Solo-Leveling Holographic Quest Frame (Today's Main Quest, Subtasks Checklist, Progress, Start Mission CTA)
 * 3. Telemetry Strip ("Today at a Glance"): 4 Circular Progress Metric Cards + Motivational Card
 */
export function DashboardHero({
  user,
  character = {},
  priorityItems = [],
  totalDailiesDueCount = 0,
  completedDailiesCount = 0,
  totalHabitsCount = 0,
  completedHabitsCount = 0,
  todayFocusMinutes = 0,
  maxActiveStreak = 0,
  taskCompletionRate = 0,
  hasActiveSession = false,
  isResting = false,
  primaryPriority = null,
  onOpenCustomizer,
  className = '',
}) {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { showToast } = useToast();

  const completeDailyMutation = useCompleteDaily();
  const undoDailyMutation = useUndoDaily();
  const completeQuestItemMutation = useCompleteQuestItem();
  const undoQuestItemMutation = useUndoQuestItem();

  const [togglingItemId, setTogglingItemId] = useState(null);

  // Operator Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Technical Cycle / Stardate Telemetry
  const stardate = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const weekday = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    return `CYCLE // ${year}.${month}.${day} • ${weekday}`;
  }, []);

  const displayName = user?.displayName || 'Hero';
  const remainingDailies = Math.max(0, totalDailiesDueCount - completedDailiesCount);
  const isAllClear = totalDailiesDueCount > 0 && remainingDailies === 0;

  // Character Stats with fallbacks
  const level = character.level ?? 1;
  const xp = character.xp ?? 0;
  const xpForNextLevel = character.xpForNextLevel ?? 100;
  const hp = character.hp ?? 100;
  const maxHp = character.maxHp ?? 100;
  const mana = character.mana ?? 50;
  const maxMana = character.maxMana ?? 50;
  const gold = character.gold ?? 0;

  const levelTier = getLevelTier(level);

  // 5 Attributes
  const attributesList = useMemo(() => {
    return [
      {
        key: 'strength',
        code: 'STR',
        name: 'Strength',
        value: character.strength ?? 10,
        icon: Shield,
        theme: getAttributeTheme('strength'),
      },
      {
        key: 'intelligence',
        code: 'INT',
        name: 'Intelligence',
        value: character.intelligence ?? 10,
        icon: Brain,
        theme: getAttributeTheme('intelligence'),
      },
      {
        key: 'vitality',
        code: 'VIT',
        name: 'Vitality',
        value: character.vitality ?? 10,
        icon: Heart,
        theme: getAttributeTheme('vitality'),
      },
      {
        key: 'willpower',
        code: 'WIS',
        name: 'Willpower',
        value: character.willpower ?? 10,
        icon: Zap,
        theme: getAttributeTheme('willpower'),
      },
      {
        key: 'perception',
        code: 'PER',
        name: 'Perception',
        value: character.perception ?? 10,
        icon: Eye,
        theme: getAttributeTheme('perception'),
      },
    ];
  }, [character]);

  // Open Global Attributes Drawer
  const handleOpenAttributes = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(LIFEOS_OPEN_ATTRIBUTES_EVENT));
    }
  };

  // Holographic Frame Subtasks / Checklist:
  // If primaryPriority is a quest with subtasks, use its items.
  // Otherwise, use top 3 pending priority items as today's directives.
  const questItems = useMemo(() => {
    if (primaryPriority?.type === 'quest' && Array.isArray(primaryPriority?.entity?.items) && primaryPriority.entity.items.length > 0) {
      return primaryPriority.entity.items.slice(0, 4).map((item) => ({
        id: item.id,
        title: item.title,
        isComplete: Boolean(item.isComplete),
        type: 'quest-item',
        questId: primaryPriority.rawId,
        reward: '+15 XP',
      }));
    }

    // Otherwise show top 3 priority items
    return priorityItems.slice(0, 3).map((item) => ({
      id: item.id,
      rawId: item.rawId,
      title: item.title,
      isComplete: Boolean(item.isComplete),
      type: item.type,
      entity: item.entity,
      reward: item.type === 'quest' ? '+50 XP' : '+25 XP',
    }));
  }, [primaryPriority, priorityItems]);

  const completedQuestItemsCount = questItems.filter((i) => i.isComplete).length;
  const totalQuestItemsCount = questItems.length;

  // Toggle checklist item
  const handleToggleChecklistItem = async (item) => {
    if (togglingItemId) return;
    setTogglingItemId(item.id);

    try {
      if (item.type === 'quest-item') {
        if (item.isComplete) {
          await undoQuestItemMutation.mutateAsync({ questId: item.questId, itemId: item.id });
        } else {
          await completeQuestItemMutation.mutateAsync({ questId: item.questId, itemId: item.id });
        }
      } else if (item.type === 'daily') {
        if (item.isComplete) {
          await undoDailyMutation.mutateAsync(item.rawId);
        } else {
          await completeDailyMutation.mutateAsync(item.rawId);
        }
      } else if (item.type === 'quest') {
        navigate('/quests');
      }
    } catch {
      showToast({
        title: 'Action Failed',
        message: 'Could not update objective status.',
        type: 'error',
      });
    } finally {
      setTogglingItemId(null);
    }
  };

  // Formatted focus time (e.g. 1.5h or 45m)
  const formattedFocus = useMemo(() => {
    if (todayFocusMinutes >= 60) {
      const hours = (todayFocusMinutes / 60).toFixed(1);
      return `${hours.endsWith('.0') ? hours.slice(0, -2) : hours}h`;
    }
    return `${todayFocusMinutes}m`;
  }, [todayFocusMinutes]);

  // Framer Motion staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: spring.snappy,
    },
  };

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={clsx('space-y-4 sm:space-y-5 select-none', className)}
    >
      {/* ── 1. Top Command Bar ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-mono tracking-widest text-ink-muted uppercase">
              {stardate}
            </span>
            <span className="text-ink-muted/30">•</span>

            {/* Hardware-feel Tactical State Pill */}
            {isResting ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-teal-950/80 border border-teal-500/50 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.2)]">
                <Moon size={11} className="text-teal-400" />
                REST PROTOCOL ACTIVE
              </span>
            ) : hasActiveSession ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-azure-950/80 border border-azure-500/50 text-azure-300 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
                <Timer size={11} className="animate-spin text-azure-400" style={{ animationDuration: '3s' }} />
                DEEP WORK ENGAGED
              </span>
            ) : isAllClear ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <CheckCircle2 size={11} className="text-emerald-400" />
                ALL PROTOCOLS CLEARED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-obsidian-850 border border-glass-border-strong text-ink-muted">
                <Crosshair size={11} className="text-gold" />
                COMMAND BRIDGE // ONLINE
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/30">
              LifeOS
            </span>
            <h1 className="text-2xl sm:text-3xl text-ink tracking-tight font-display font-bold">
              {greeting},{' '}
              <span className="text-white bg-linear-to-r from-white via-slate-200 to-ink-muted bg-clip-text">
                {displayName}
              </span>
            </h1>
          </div>
        </div>

        {/* Customization control */}
        <button
          type="button"
          onClick={onOpenCustomizer}
          aria-label="Customize command center layout"
          title="Customize dashboard layout"
          className={clsx(
            'self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-xl',
            'bg-obsidian-900/80 hover:bg-obsidian-850 border border-glass-border hover:border-glass-border-strong',
            'text-ink-muted hover:text-ink text-xs font-mono transition-colors min-h-9.5 shadow-sm cursor-pointer'
          )}
        >
          <SlidersHorizontal size={13} />
          <span>LAYOUT CONFIG</span>
        </button>
      </motion.div>

      {/* ── 2. Two-Column Hero Deck (Player Status + Solo-Leveling Quest Frame) ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Left Column (7 Cols on desktop): Hero Character Card */}
        <div className="lg:col-span-7 flex flex-col">
          <RpgPanel className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
            <div>
              {/* Card Header: Tag & Motivational Subtitle */}
              <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-[11px] font-bold tracking-widest text-ink-muted uppercase">
                    [ PLAYER STATUS ]
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAttributes}
                  className="flex items-center gap-1 text-[11px] font-mono text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                  title="Open full attributes details"
                >
                  <span>EXPAND ATTR</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              <p className="text-xs font-medium text-ink-muted italic mb-3.5">
                &ldquo;A better you is always in progress.&rdquo;
              </p>

              {/* Level, Tier & XP Progress */}
              <div className="space-y-2 mb-4 bg-obsidian-950/60 p-3 rounded-xl border border-white/5">
                <div className="flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <LevelBadge level={level} size="md" />
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-bold tracking-wider text-white uppercase whitespace-nowrap">
                        {levelTier.name} {levelTier.roman}
                      </div>
                      <div className="text-[10px] font-mono text-ink-muted whitespace-nowrap">
                        PLAYER LEVEL {level}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-semibold text-sky-400 tabular-nums whitespace-nowrap">
                      {xp} <span className="text-ink-muted">/ {xpForNextLevel} XP</span>
                    </span>
                  </div>
                </div>

                {/* Smooth Continuous XP Progress Bar */}
                <ProgressionBar
                  value={xp}
                  max={xpForNextLevel}
                  colorVariant="cyan"
                  showLabel={false}
                />
              </div>

              {/* Vitals Counters: HP / Mana / Gold */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-4">
                {/* HP Stat Box */}
                <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/25 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-red-400 uppercase">
                    <span>HP</span>
                    <Heart size={11} className="text-red-400" />
                  </div>
                  <div className="mt-1">
                    <span className="text-xs sm:text-sm font-mono font-bold text-white tabular-nums">
                      {hp}
                      <span className="text-[10px] font-normal text-red-300/60">/{maxHp}</span>
                    </span>
                  </div>
                  <div className="w-full bg-obsidian-950 h-1 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-linear-to-r from-red-600 to-rose-400"
                      style={{ width: `${Math.min(100, Math.round((hp / maxHp) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* MANA Stat Box */}
                <div className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-500/25 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-sky-400 uppercase">
                    <span>MANA</span>
                    <Zap size={11} className="text-sky-400" />
                  </div>
                  <div className="mt-1">
                    <span className="text-xs sm:text-sm font-mono font-bold text-white tabular-nums">
                      {mana}
                      <span className="text-[10px] font-normal text-sky-300/60">/{maxMana}</span>
                    </span>
                  </div>
                  <div className="w-full bg-obsidian-950 h-1 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-linear-to-r from-sky-600 to-cyan-400"
                      style={{ width: `${Math.min(100, Math.round((mana / maxMana) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* GOLD Stat Box */}
                <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/25 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-amber-400 uppercase">
                    <span>GOLD</span>
                    <Coins size={11} className="text-amber-400" />
                  </div>
                  <div className="mt-1">
                    <span className="text-xs sm:text-sm font-mono font-bold text-amber-300 tabular-nums">
                      {gold}
                    </span>
                  </div>
                  <div className="text-[9px] font-mono text-amber-400/60 mt-1 truncate">
                    REWARD POOL
                  </div>
                </div>
              </div>
            </div>

            {/* 5 Core Attributes Grid */}
            <div className="pt-2 border-t border-white/5">
              <div className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider mb-2">
                CORE ATTRIBUTES
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {attributesList.map((attr) => {
                  const Icon = attr.icon;
                  return (
                    <button
                      key={attr.key}
                      type="button"
                      onClick={handleOpenAttributes}
                      className={clsx(
                        'p-2 rounded-lg border text-left transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer',
                        attr.theme.bgClass,
                        attr.theme.borderClass
                      )}
                      title={`View ${attr.name} details`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={clsx('text-[10px] font-mono font-bold', attr.theme.textClass)}>
                          {attr.code}
                        </span>
                        <Icon size={12} className={attr.theme.textClass} />
                      </div>
                      <div className="font-display font-bold text-sm text-white tabular-nums">
                        {attr.value}
                      </div>
                      <div className="w-full bg-obsidian-950 h-1 rounded-full overflow-hidden mt-1.5">
                        <div
                          className={clsx('h-full', attr.theme.barGradient)}
                          style={{ width: `${Math.min(100, (attr.value / 30) * 100)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </RpgPanel>
        </div>

        {/* Right Column (5 Cols on desktop): Holographic Quest Frame */}
        <div className="lg:col-span-5 flex flex-col">
          <HolographicFrame
            headerTag="[ SYSTEM DIRECTIVE ]"
            subtitle="Today's Main Quest"
            badge={
              <DifficultyBadge
                difficulty={primaryPriority?.difficulty || 'high'}
                size="sm"
              />
            }
            energyColor="violet"
            className="flex-1 flex flex-col justify-between"
          >
            <div>
              {/* Quest Title & Description */}
              <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-tight leading-snug mb-1">
                {primaryPriority?.title || "Today's Core Priority Directive"}
              </h2>
              <p className="text-xs text-ink-muted leading-relaxed line-clamp-2 mb-3.5">
                {primaryPriority?.description ||
                  (primaryPriority?.type === 'daily'
                    ? 'Key recurring protocol scheduled for today’s cycle.'
                    : 'Highest impact active quest milestone requiring immediate execution.')}
              </p>

              {/* Subtasks / Objectives Checklist */}
              <div className="space-y-2 mb-4">
                <div className="text-[10px] font-mono font-bold tracking-wider text-purple-300 uppercase flex items-center justify-between">
                  <span>DIRECTIVE CHECKLIST</span>
                  <span>[{completedQuestItemsCount} / {Math.max(1, totalQuestItemsCount)}]</span>
                </div>

                {questItems.length === 0 ? (
                  <div className="p-3 rounded-lg bg-obsidian-950/60 border border-white/5 text-center text-xs font-mono text-ink-muted">
                    No pending directives scheduled.
                  </div>
                ) : (
                  questItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklistItem(item)}
                      className={clsx(
                        'group flex items-center justify-between gap-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none',
                        item.isComplete
                          ? 'bg-obsidian-950/60 border-white/5 text-ink-muted line-through'
                          : 'bg-obsidian-900/90 border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-950/20 text-ink'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* High-tech tactile checkbox */}
                        <button
                          type="button"
                          disabled={togglingItemId === item.id}
                          className={clsx(
                            'w-4 h-4 rounded shrink-0 border flex items-center justify-center transition-all',
                            item.isComplete
                              ? 'bg-purple-600 border-purple-400 text-white'
                              : 'bg-obsidian-950 border-purple-500/40 group-hover:border-purple-400'
                          )}
                          aria-label={`Toggle ${item.title}`}
                        >
                          {item.isComplete && <Check size={11} strokeWidth={3} />}
                        </button>
                        <span className="text-xs font-medium truncate">{item.title}</span>
                      </div>

                      <span className="text-[10px] font-mono font-semibold text-purple-300 shrink-0">
                        {item.reward}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Frame Footer: Segmented Progress & Start Mission CTA */}
            <div className="pt-3 border-t border-white/5 space-y-3">
              <ProgressionBar
                value={completedQuestItemsCount}
                max={Math.max(1, totalQuestItemsCount)}
                segments={Math.max(1, totalQuestItemsCount)}
                colorVariant="purple"
                showLabel={true}
              />

              <div className="flex items-center justify-end gap-2">
                <RpgButton
                  variant="primary"
                  size="md"
                  onClick={() => {
                    if (primaryPriority?.type === 'quest') {
                      navigate('/quests');
                    } else {
                      navigate('/habits');
                    }
                  }}
                  icon={ArrowRight}
                  className="w-full sm:w-auto"
                >
                  START MISSION →
                </RpgButton>
              </div>
            </div>
          </HolographicFrame>
        </div>
      </motion.div>

      {/* ── 3. Telemetry Strip ("Today at a Glance") ── */}
      <motion.div variants={itemVariants} className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold tracking-widest text-ink-muted uppercase">
            [ TELEMETRY // TODAY AT A GLANCE ]
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
          {/* Telemetry 1: Focus */}
          <TelemetryCard
            tag="FOCUS"
            value={formattedFocus}
            progress={Math.min(100, Math.round((todayFocusMinutes / 120) * 100))}
            subtext="Deep Work logged"
            delta={todayFocusMinutes > 0 ? '+Restores Mana' : 'Ready'}
            accentColor="cyan"
          />

          {/* Telemetry 2: Tasks */}
          <TelemetryCard
            tag="TASKS"
            value={`${completedDailiesCount} / ${totalDailiesDueCount}`}
            progress={taskCompletionRate}
            subtext={`${remainingDailies} pending`}
            delta={`${taskCompletionRate}% cleared`}
            accentColor="blue"
          />

          {/* Telemetry 3: Habits */}
          <TelemetryCard
            tag="HABITS"
            value={`${completedHabitsCount} / ${Math.max(1, totalHabitsCount)}`}
            progress={totalHabitsCount > 0 ? Math.round((completedHabitsCount / totalHabitsCount) * 100) : 0}
            subtext="Daily cadence"
            delta="Active streak"
            accentColor="emerald"
          />

          {/* Telemetry 4: Streak */}
          <TelemetryCard
            tag="STREAK"
            value={`${maxActiveStreak}d`}
            icon={Flame}
            progress={100}
            subtext="Momentum active"
            delta={maxActiveStreak > 0 ? '🔥 Hot Streak' : 'Ready'}
            accentColor="amber"
          />

          {/* Telemetry 5: Motivation Banner Card */}
          <div className="col-span-2 md:col-span-1 lg:col-span-1 p-3.5 sm:p-4 rounded-xl border border-purple-500/30 bg-linear-to-br from-purple-950/40 via-obsidian-900/90 to-obsidian-950 backdrop-blur-xl flex flex-col justify-between shadow-[0_0_15px_rgba(168,85,247,0.12)]">
            <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-purple-400 font-bold uppercase mb-1">
              <span>[ DIRECTIVE ]</span>
              <Sparkles size={13} className="text-purple-400" />
            </div>
            <div className="my-1">
              <span className="font-display font-bold text-sm sm:text-base text-white leading-tight block">
                &ldquo;Discipline Builds Freedom&rdquo;
              </span>
            </div>
            <div className="text-[10px] font-mono text-ink-muted truncate">
              Every protocol completed expands attributes.
            </div>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}

DashboardHero.propTypes = {
  user: PropTypes.object,
  character: PropTypes.object,
  priorityItems: PropTypes.array,
  totalDailiesDueCount: PropTypes.number,
  completedDailiesCount: PropTypes.number,
  totalHabitsCount: PropTypes.number,
  completedHabitsCount: PropTypes.number,
  todayFocusMinutes: PropTypes.number,
  maxActiveStreak: PropTypes.number,
  taskCompletionRate: PropTypes.number,
  hasActiveSession: PropTypes.bool,
  isResting: PropTypes.bool,
  primaryPriority: PropTypes.object,
  onOpenCustomizer: PropTypes.func,
  className: PropTypes.string,
};
