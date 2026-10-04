import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
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
  Sun,
  Moon,
  ArrowLeft,
  ArrowRight,
  Settings,
  Edit2,
  Check,
  Camera,
  Coins,
  Trophy,
  BookOpen,
  Clock,
  CheckCircle2,
  Award,
  Dumbbell,
  Wallet,
  AlertTriangle,
  Trash2,
  RotateCcw,
  FileText,
  Bell,
  Loader2,
  X,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import clsx from 'clsx';

import { Card, WavyHeroScenery, ModeButton } from '@/components/ui';
import { spring } from '@/lib/motionVariants';
import { useAuth } from '@/features/auth/hooks';
import { useCharacter, useAllocateAttribute } from '@/features/character/hooks';
import { useHabits } from '@/features/habits/hooks';
import { useDailies } from '@/features/dailies/hooks';
import { useQuests } from '@/features/quests/hooks';
import { useFocusHistory } from '@/features/focus/hooks';
import { useFloatingText } from '@/features/character/floatingText';
import { openBattleLogDrawer } from '@/features/celebration/celebrationEvents';
import { AttributesRadarChart } from '@/components/hud/AttributesRadarChart';
import { useTheme } from '@/lib/theme';
import { ReportsModal } from '@/features/reports/ReportsModal';
import { NotificationCenterModal } from '@/features/notifications/components/NotificationCenterModal';

const ATTR_DETAILS = [
  {
    key: 'strength',
    name: 'Strength',
    stat: 'STR',
    icon: Shield,
    color: '#DC2626',
    colorClass: 'text-attr-strength',
    bgClass: 'bg-attr-strength/10 border-attr-strength/25',
    desc: 'Physical power (+4 Max HP per point). Drives execution capacity and stamina.',
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



/**
 * Dedicated Mobile & Desktop Character / Profile Experience.
 * Exactly matches Image 3 blueprint with Hero Banner, Lifetime Stats,
 * Progress Overview 2x2, Weekly Activity Bar Chart, and Life Areas Progress.
 */
export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile, resetAccount, deleteAccount } = useAuth();
  const { data: character = {} } = useCharacter();
  const { data: habits = [] } = useHabits();
  const { data: dailies = [] } = useDailies();
  const { data: quests = [] } = useQuests();
  const { data: focusSessions = [] } = useFocusHistory({ limit: 50 });
  const allocateMutation = useAllocateAttribute();
  const { spawnFloatingText } = useFloatingText();
  const { mode, setMode } = useTheme();

  // Active tab: 'overview' | 'stats' | 'achievements' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');

  // Modals & Avatar state
  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Editable motto quote
  const [motto, setMotto] = useState(() => {
    return localStorage.getItem('lifeos_user_motto') || 'Disciplined today. A better tomorrow.';
  });
  const [isEditingMotto, setIsEditingMotto] = useState(false);
  const [mottoInput, setMottoInput] = useState(motto);

  // Audio preference
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

  const handleSaveMotto = async () => {
    setMotto(mottoInput);
    localStorage.setItem('lifeos_user_motto', mottoInput);
    setIsEditingMotto(false);
    try {
      await updateProfile({ motto: mottoInput });
    } catch (err) {
      console.error('Failed to sync motto:', err);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Please choose an image under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxDim = 200;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.82);
        try {
          setIsUploadingAvatar(true);
          await updateProfile({ avatarUrl: base64 });
          spawnFloatingText('Avatar Updated!');
        } catch (err) {
          console.error('Failed to update avatar:', err);
          alert('Failed to update avatar. Please try again.');
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      img.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsUploadingAvatar(true);
      await updateProfile({ avatarUrl: '' });
      spawnFloatingText('Avatar Removed');
    } catch (err) {
      console.error('Failed to remove avatar:', err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleResetAccount = async () => {
    try {
      setIsResetting(true);
      await resetAccount();
      setShowResetModal(false);
      spawnFloatingText('Account Reset Completed');
    } catch (err) {
      console.error('Reset account failed:', err);
      alert('Failed to reset account. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== 'DELETE') return;
    try {
      setIsDeleting(true);
      await deleteAccount({ confirmation: 'DELETE' });
      setShowDeleteModal(false);
      navigate('/login');
    } catch (err) {
      console.error('Delete account failed:', err);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Real character progression stats
  const attributes = character.attributes || {};
  const unallocatedPoints = character.unallocatedPoints || 0;
  const level = character.level || 1;
  const xp = character.xp || 0;
  const xpForNextLevel = character.xpForNextLevel || 100;
  const gold = character.gold || 0;
  const xpPercent = Math.min(100, Math.round((xp / Math.max(1, xpForNextLevel)) * 100));

  const bestStreak = useMemo(() => {
    const list = habits.map((h) => h.currentStreak || h.streakCurrent || 0);
    return list.length > 0 ? Math.max(...list, 0) : 0;
  }, [habits]);

  const tasksDone = useMemo(() => {
    const dailyDone = dailies.filter((d) => d.isCompleteToday).length;
    const questDone = quests.filter((q) => q.status === 'completed').length;
    return dailyDone + questDone;
  }, [dailies, quests]);

  const totalFocusHours = useMemo(() => {
    const mins = focusSessions
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + (s.durationMinutes || Math.round((s.plannedDurationSeconds || 0) / 60)), 0);
    return (mins / 60).toFixed(1);
  }, [focusSessions]);

  const completedQuestsCount = useMemo(() => {
    return quests.filter((q) => q.status === 'completed').length;
  }, [quests]);

  const rankText = level >= 12 ? 'Top 5%' : level >= 7 ? 'Top 10%' : level >= 3 ? 'Top 20%' : 'Top 50%';

  // Dynamic RPG Class Title based on highest attribute
  const characterTitle = useMemo(() => {
    if (!character?.attributes) return 'Hero';
    const { strength = 0, intelligence = 0, vitality = 0, willpower = 0, perception = 0 } = character.attributes;
    const maxVal = Math.max(strength, intelligence, vitality, willpower, perception);
    if (strength === maxVal) return 'Iron Vanguard';
    if (intelligence === maxVal) return 'Arcane Scholar';
    if (vitality === maxVal) return 'Immortal Warden';
    if (willpower === maxVal) return 'Astral Sovereign';
    return 'Shadow Pathfinder';
  }, [character?.attributes]);

  // Real Weekly Activity Bar Chart Data (Past 7 days from real completed focus sessions)
  const weeklyActivityData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayHours = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    focusSessions
      .filter((s) => s.status === 'completed')
      .forEach((s) => {
        const sessionDate = new Date(s.completedAt || s.createdAt);
        if (sessionDate >= oneWeekAgo) {
          const dayName = sessionDate.toLocaleDateString('en-US', { weekday: 'short' });
          if (dayHours[dayName] !== undefined) {
            const hours = (s.durationMinutes || Math.round((s.plannedDurationSeconds || 0) / 60)) / 60;
            dayHours[dayName] += hours;
          }
        }
      });

    const todayName = now.toLocaleDateString('en-US', { weekday: 'short' });
    return days.map((day) => ({
      day,
      hours: Number(dayHours[day].toFixed(1)),
      active: day === todayName,
    }));
  }, [focusSessions]);

  const totalWeeklyFocusHours = useMemo(() => {
    return weeklyActivityData.reduce((sum, d) => sum + d.hours, 0);
  }, [weeklyActivityData]);

  // Real Life Areas Progress from Active Systems
  const activeSystemsProgress = useMemo(() => {
    const habitRate = habits.length > 0
      ? Math.round((habits.filter((h) => (h.currentStreak || 0) > 0).length / habits.length) * 100)
      : 0;
    const dailiesDone = dailies.filter((d) => d.isCompleteToday).length;
    const dailyRate = dailies.length > 0 ? Math.round((dailiesDone / dailies.length) * 100) : 0;
    const questRate = quests.length > 0
      ? Math.round((completedQuestsCount / quests.length) * 100)
      : 0;
    const focusRate = Math.min(100, Math.round((Number(totalFocusHours) / 5) * 100));

    return [
      { name: 'Habit Momentum', percent: habitRate, color: 'bg-amber-500', icon: Flame, text: `${habitRate}% streak active` },
      { name: 'Daily Rituals', percent: dailyRate, color: 'bg-emerald-500', icon: CheckCircle2, text: `${dailiesDone}/${dailies.length} conquered today` },
      { name: 'Campaign Quests', percent: questRate, color: 'bg-indigo-500', icon: BookOpen, text: `${completedQuestsCount}/${quests.length} completed` },
      { name: 'Deep Focus Chamber', percent: focusRate, color: 'bg-sky-500', icon: Clock, text: `${totalFocusHours}h logged` },
    ];
  }, [habits, dailies, quests, totalFocusHours, completedQuestsCount]);

  // Real Dynamic Achievements derived from user progression
  const dynamicAchievements = useMemo(() => {
    return [
      {
        id: 'first_ritual',
        title: 'Dawn Awakening',
        desc: 'Conquer your first Daily Ritual',
        icon: Sparkles,
        unlocked: dailies.some((d) => d.isCompleteToday),
        progress: dailies.some((d) => d.isCompleteToday) ? 'Unlocked' : '0/1 Daily',
      },
      {
        id: 'streak_7',
        title: 'Unbreakable Momentum',
        desc: 'Hold a 7-day habit discipline streak',
        icon: Flame,
        unlocked: bestStreak >= 7,
        progress: bestStreak >= 7 ? 'Unlocked' : `${bestStreak}/7 Days`,
      },
      {
        id: 'deep_flow',
        title: 'Flow Chamber Adept',
        desc: 'Complete at least 1 hour of cognitive focus sprints',
        icon: Clock,
        unlocked: Number(totalFocusHours) >= 1.0,
        progress: Number(totalFocusHours) >= 1.0 ? 'Unlocked' : `${totalFocusHours}/1.0h`,
      },
      {
        id: 'quest_cleared',
        title: 'Bounty Hunter',
        desc: 'Clear a multi-stage Epic Quest',
        icon: Trophy,
        unlocked: completedQuestsCount > 0,
        progress: completedQuestsCount > 0 ? 'Unlocked' : `${completedQuestsCount} Quests`,
      },
      {
        id: 'gold_hoard',
        title: 'Gilded Vault',
        desc: 'Accumulate 100 Gold in the sanctum',
        icon: Coins,
        unlocked: gold >= 100,
        progress: gold >= 100 ? 'Unlocked' : `${gold}/100 Gold`,
      },
      {
        id: 'mastery_lv5',
        title: 'Ascended Hero',
        desc: 'Reach Character Progression Level 5',
        icon: Award,
        unlocked: level >= 5,
        progress: level >= 5 ? 'Unlocked' : `Lv. ${level}/5`,
      },
    ];
  }, [dailies, bestStreak, totalFocusHours, completedQuestsCount, gold, level]);

  const handleAllocate = async (attributeKey, attributeName) => {
    try {
      await allocateMutation.mutateAsync({ attribute: attributeKey, points: 1 });
      spawnFloatingText(`+1 ${attributeName}`);
    } catch (err) {
      console.error('Failed to allocate point:', err);
    }
  };

  const displayName = user?.displayName || 'Rohit';
  const avatarUrl = user?.avatarUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.snappy}
      className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-24"
    >
      {/* ── 1. Top Mobile Navigation Bar ── */}
      <div className="flex items-center justify-between pb-1">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-ink hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all shadow-xs active:scale-95 cursor-pointer"
          title="Back to Dashboard"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-base font-bold font-display text-slate-900 dark:text-ink">
          Profile
        </h1>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={openBattleLogDrawer}
            className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-amber-600 dark:text-gold hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Battle Chronicles"
            aria-label="Battle Chronicles"
          >
            <Swords size={17} />
          </button>
          <ModeButton compact />
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={clsx(
              'w-10 h-10 rounded-2xl border flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer',
              activeTab === 'settings'
                ? 'bg-indigo-500 text-white border-indigo-400'
                : 'bg-white/80 dark:bg-white/[0.04] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-ink hover:bg-slate-100 dark:hover:bg-white/[0.08]'
            )}
            title="Settings"
            aria-label="Settings"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>

      {/* Hidden file input for custom profile avatar */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleAvatarChange}
      />

      {/* ── 2. Atmospheric Hero Identity Banner with Wavy Scenery & High-Contrast Shield ── */}
      <WavyHeroScenery variant="profile" className="p-3 sm:p-5">
        <div className="relative rounded-3xl bg-slate-950/80 dark:bg-slate-950/90 backdrop-blur-xl p-4 sm:p-6 border border-white/15 shadow-2xl flex flex-col items-center text-center">
          {/* Avatar Positioned with Glow Ring */}
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-amber-400 shadow-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center text-white">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={38} className="text-white" />
              )}
            </div>

            {/* Camera / Upload Action Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform border-2 border-slate-950 cursor-pointer"
              title="Upload new profile picture"
              aria-label="Upload new profile picture"
            >
              {isUploadingAvatar ? (
                <Loader2 size={14} className="animate-spin text-slate-950" />
              ) : (
                <Camera size={14} />
              )}
            </button>
          </div>

          {/* Quick Avatar Actions (if avatar exists) */}
          {avatarUrl && (
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-mono text-amber-300 hover:underline cursor-pointer"
              >
                Change photo
              </button>
              <span className="text-white/30 text-xs">•</span>
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-[10px] font-mono text-rose-300 hover:underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}

          {/* Name & Title with Crystal-Clear Contrast */}
          <h2 className="text-xl sm:text-2xl font-black font-display text-white mt-2.5 tracking-tight drop-shadow-sm">
            {displayName}
          </h2>
          <div className="flex items-center gap-2 text-xs font-mono mt-1 text-slate-200">
            <span className="font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/30">
              Lv. {level}
            </span>
            <span className="text-white/40">•</span>
            <span className="text-indigo-200 font-semibold">{characterTitle}</span>
          </div>

          {/* XP Progress Bar Capsule */}
          <div className="w-full max-w-sm mt-3 px-2">
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-slate-300">XP Progress</span>
              <span className="font-bold text-white">
                {xp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP ({xpPercent}%)
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-black/60 overflow-hidden border border-white/20 shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={spring.snappy}
              />
            </div>
          </div>

          {/* ── 3. Lifetime Stats Row (Coins, Streak, Rank) ── */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-md mt-4 pt-3.5 border-t border-white/15">
            {/* Coins */}
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-black/50 border border-amber-500/40 shadow-sm text-center">
              <div className="flex items-center gap-1 text-xs font-mono text-amber-300 font-bold">
                <Coins size={14} className="text-amber-400" />
                <span>Coins</span>
              </div>
              <span className="text-xl sm:text-2xl font-black font-display text-amber-300 mt-0.5">
                {gold}
              </span>
            </div>

            {/* Day Streak */}
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-black/50 border border-orange-500/40 shadow-sm text-center">
              <div className="flex items-center gap-1 text-xs font-mono text-orange-300 font-bold">
                <Flame size={14} className="text-orange-400 fill-current" />
                <span>Day Streak</span>
              </div>
              <span className="text-xl sm:text-2xl font-black font-display text-white mt-0.5">
                {bestStreak}
              </span>
            </div>

            {/* Rank */}
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-black/50 border border-purple-500/40 shadow-sm text-center">
              <div className="flex items-center gap-1 text-xs font-mono text-purple-300 font-bold">
                <Trophy size={14} className="text-purple-400" />
                <span>Rank</span>
              </div>
              <span className="text-base sm:text-lg font-black font-display text-purple-300 mt-0.5 truncate">
                {rankText}
              </span>
            </div>
          </div>

          {/* ── 4. Editable Motto Quote Card ── */}
          <div className="w-full max-w-md mt-3.5 p-3 rounded-2xl bg-black/50 border border-white/15 flex items-center justify-between gap-3 text-xs backdrop-blur-md">
            {isEditingMotto ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={mottoInput}
                  onChange={(e) => setMottoInput(e.target.value)}
                  className="flex-1 bg-black/70 border border-white/20 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Enter your personal motto..."
                  maxLength={60}
                />
                <button
                  type="button"
                  onClick={handleSaveMotto}
                  className="p-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <>
                <p className="italic text-slate-200 truncate font-serif">
                  &ldquo;{motto}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMottoInput(motto);
                    setIsEditingMotto(true);
                  }}
                  className="p-1.5 text-amber-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Edit motto"
                >
                  <Edit2 size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      </WavyHeroScenery>

      {/* ── 5. Segmented Tab Switcher (Overview, Stats, Achievements, Settings) ── */}
      <div className="p-1 rounded-2xl bg-slate-100/90 dark:bg-obsidian-900/80 border border-slate-200/80 dark:border-white/10 shadow-inner grid grid-cols-4 gap-1 backdrop-blur-md">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'stats', label: 'Stats' },
          { id: 'achievements', label: 'Achievements' },
          { id: 'settings', label: 'Settings' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'py-2 px-1 rounded-xl text-xs font-semibold transition-all relative text-center truncate',
                isActive
                  ? 'bg-white text-slate-950 dark:bg-white/[0.12] dark:text-ink shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-ink-muted dark:hover:text-ink'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── 6. Tab Content ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={spring.snappy}
            className="space-y-4 sm:space-y-6"
          >
            {/* Section A: Progress Overview (2x2 Cards matching Image 3) */}
            {/* Section A: Progress Overview (Real Data Only) */}
            <Card className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink">
                  Progress Overview
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-ink-muted bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-white/5">
                  Real Telemetry
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                {/* 1. Tasks Done */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-ink-muted flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>Tasks Done</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded">
                      Today & Quests
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-ink">
                    {tasksDone}
                  </span>
                </div>

                {/* 2. Habit Streak */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-ink-muted flex items-center gap-1.5">
                      <Flame size={13} className="text-orange-500 fill-current" />
                      <span>Habit Streak</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded">
                      Current Peak
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-ink">
                    {bestStreak} days
                  </span>
                </div>

                {/* 3. Focus Chamber */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-sky-500/10 dark:bg-sky-500/10 border border-sky-500/20 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-ink-muted flex items-center gap-1.5">
                      <Clock size={13} className="text-sky-500" />
                      <span>Focus Chamber</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/15 px-1.5 py-0.2 rounded">
                      Total Time
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-ink">
                    {totalFocusHours}h
                  </span>
                </div>

                {/* 4. Quests Cleared */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-purple-500/10 dark:bg-purple-500/10 border border-purple-500/20 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-ink-muted flex items-center gap-1.5">
                      <Trophy size={13} className="text-purple-500" />
                      <span>Quests Cleared</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/15 px-1.5 py-0.2 rounded">
                      Milestones
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-ink">
                    {completedQuestsCount}
                  </span>
                </div>
              </div>
            </Card>

            {/* Section B: Weekly Activity (Real Data or Intentional Empty State) */}
            <Card className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink">
                    Weekly Activity
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Past 7 Days
                  </span>
                </div>
                {totalWeeklyFocusHours > 0 && (
                  <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                    {totalWeeklyFocusHours.toFixed(1)}h total
                  </span>
                )}
              </div>

              {totalWeeklyFocusHours > 0 ? (
                <div className="h-44 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyActivityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 text-white dark:bg-obsidian-900 border border-white/10 px-2.5 py-1.5 rounded-xl text-xs font-mono shadow-xl">
                                <span className="font-bold">{payload[0].payload.day}:</span> {payload[0].value}h focus
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="hours" radius={[8, 8, 4, 4]}>
                        {weeklyActivityData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.active ? '#8B5CF6' : '#C4B5FD'}
                            className="transition-colors hover:opacity-80"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                /* Intentional Empty State matching user instructions */
                <div className="py-8 px-4 text-center flex flex-col items-center justify-center space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
                    <Clock size={22} />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-ink font-display">
                    Your progress graph will appear as you build your history.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-ink-muted max-w-sm leading-relaxed">
                    Start a sprint in the Focus Chamber or complete your daily rituals to begin recording your personal analytics.
                  </p>
                  <Link
                    to="/focus"
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-600 transition-colors shadow-xs active:scale-95"
                  >
                    <span>Enter Focus Chamber</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </Card>

            {/* Section C: Life Areas & Active Disciplines (Real Progress + Future Modules) */}
            <Card className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink">
                  Life Areas & Systems
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-ink-muted">
                  4 Active Disciplines
                </span>
              </div>

              {/* Active Systems */}
              <div className="space-y-3">
                {activeSystemsProgress.map((area) => {
                  const Icon = area.icon;
                  return (
                    <div key={area.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-ink flex items-center gap-2">
                          <Icon size={14} className="text-slate-500 dark:text-ink-muted" />
                          <span>{area.name}</span>
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-ink text-[11px]">
                          {area.text}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-black/40 overflow-hidden border border-slate-200/50 dark:border-white/5">
                        <motion.div
                          className={clsx('h-full rounded-full', area.color)}
                          initial={{ width: 0 }}
                          animate={{ width: `${area.percent}%` }}
                          transition={spring.snappy}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Upcoming Roadmap Modules (Clean Placeholders without Fake Metrics) */}
              <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-ink-faint font-semibold">
                  Planned Expansion Modules
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                      <Dumbbell size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-ink">Fitness & Health</h4>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                          Phase 6+
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-ink-muted mt-0.5">
                        Physical workout logging and stamina metrics will sync here.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                      <Wallet size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-ink">Finance & Wealth</h4>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold">
                          Phase 6+
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-ink-muted mt-0.5">
                        Budget tracking and savings goals will link into RPG gold.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tab 2: Stats (Attributes Radar & Point Allocation) */}
        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={spring.snappy}
            className="space-y-5"
          >
            <Card className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-glass-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-gold">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold font-display text-slate-900 dark:text-ink">
                      RPG Attribute Pentagon
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-ink-muted">
                      Balanced character attributes shaping your Jeevan specialization
                    </p>
                  </div>
                </div>

                {unallocatedPoints > 0 && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-gold text-xs font-mono font-bold animate-pulse">
                    +{unallocatedPoints} SP Ready
                  </span>
                )}
              </div>

              {/* Radar Chart Visualizer */}
              <div className="py-2 flex flex-col items-center bg-slate-50/80 rounded-2xl border border-slate-200/80 dark:bg-white/[0.01] dark:border-white/5">
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
                        'p-3.5 rounded-2xl border transition-all space-y-2',
                        attr.bgClass
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon size={16} className={attr.colorClass} />
                          <span className="font-bold text-slate-900 dark:text-ink text-xs sm:text-sm">
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

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-ink">
                            {val}
                          </span>
                          {unallocatedPoints > 0 && (
                            <button
                              type="button"
                              onClick={() => handleAllocate(attr.key, attr.name)}
                              disabled={allocateMutation.isPending}
                              aria-label={`Allocate 1 point to ${attr.name}`}
                              className="w-6 h-6 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-700 dark:text-gold flex items-center justify-center transition-all active:scale-95"
                            >
                              <Plus size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-black/40 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: attr.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${barPercent}%` }}
                          transition={spring.snappy}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-ink-muted leading-tight">
                        {attr.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tab 3: Achievements */}
        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={spring.snappy}
            className="space-y-4"
          >
            <Card className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink">
                  Sanctum Achievements & Medals
                </span>
                <span className="text-[11px] font-mono text-amber-600 dark:text-gold font-bold">
                  {dynamicAchievements.filter((a) => a.unlocked).length} / {dynamicAchievements.length} Unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dynamicAchievements.map((ach) => {
                  const Icon = ach.icon;
                  return (
                    <div
                      key={ach.id}
                      className={clsx(
                        'p-3.5 rounded-2xl border transition-all flex items-center gap-3',
                        ach.unlocked
                          ? 'bg-amber-500/10 border-amber-500/30 text-slate-900 dark:text-ink shadow-2xs'
                          : 'bg-slate-50/60 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/5 opacity-60'
                      )}
                    >
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner',
                          ach.unlocked
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-gold'
                            : 'bg-slate-200/60 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-400'
                        )}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-ink truncate">
                            {ach.title}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-ink-muted">
                            {ach.progress}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-ink-muted mt-0.5 line-clamp-1">
                          {ach.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tab 4: Settings & Preferences */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={spring.snappy}
            className="space-y-4"
          >
            {/* Appearance Mode Controller */}
            <Card className="p-4 sm:p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink block">
                Appearance Mode
              </span>
              <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200 dark:bg-white/[0.03] dark:border-white/10 backdrop-blur-md">
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
                        'py-2 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                        isActive
                          ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-300 dark:bg-white/10 dark:text-ink dark:border-white/20'
                          : 'text-slate-600 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink'
                      )}
                    >
                      <Icon size={14} className={isActive ? 'text-amber-500' : 'text-slate-400'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Reports & Data Export */}
            <Card className="p-4 sm:p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink block">
                Reports & Data Export
              </span>
              <p className="text-xs text-slate-500 dark:text-ink-muted">
                Generate high-resolution performance PDF charts, Excel workbooks, and raw CSV files of your authentic telemetry.
              </p>
              <button
                type="button"
                onClick={() => setShowReportsModal(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={17} className="text-amber-500" />
                  <span>Open Reports & Export Sanctum</span>
                </div>
                <ArrowRight size={15} />
              </button>
            </Card>

            {/* Notification Center & Preferences */}
            <Card className="p-4 sm:p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink block">
                Notifications & Reminders
              </span>
              <p className="text-xs text-slate-500 dark:text-ink-muted">
                Manage your scheduled reminders for dailies, habit nudges, and notification preferences.
              </p>
              <button
                type="button"
                onClick={() => setShowNotificationsModal(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <Bell size={17} className="text-indigo-500" />
                  <span>Notification Center & Preferences</span>
                </div>
                <ArrowRight size={15} />
              </button>
            </Card>

            {/* System Preferences & Audio */}
            <Card className="p-4 sm:p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink block">
                Audio & Sound FX
              </span>

              <button
                type="button"
                onClick={toggleSound}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] dark:border-white/10 transition-all text-xs text-slate-800 dark:text-ink cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? (
                    <Volume2 size={16} className="text-amber-500" />
                  ) : (
                    <VolumeX size={16} className="text-slate-400" />
                  )}
                  <span>Audio Haptic FX</span>
                </div>
                <span className="font-mono text-[11px] text-slate-500 dark:text-ink-muted uppercase">
                  {soundEnabled ? 'Enabled' : 'Muted'}
                </span>
              </button>
            </Card>

            {/* Onboarding & Setup Reset */}
            <Card className="p-4 sm:p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink block">
                Onboarding & Setup
              </span>
              <p className="text-xs text-slate-500 dark:text-ink-muted">
                Re-take the initial 5-step personalization survey to adjust your primary goals, schedule, and AI preferences.
              </p>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('lifeos_onboarding_completed');
                  } catch {}
                  navigate('/onboarding');
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles size={17} className="text-purple-500" />
                  <span>Reset & Retake Onboarding</span>
                </div>
                <ArrowRight size={15} />
              </button>
            </Card>

            {/* Danger Zone: Account Management */}
            <Card className="p-4 sm:p-5 space-y-3 border-rose-500/30">
              <span className="text-xs font-bold uppercase tracking-wider font-display text-rose-600 dark:text-rose-400 block">
                Danger Zone & Account Management
              </span>

              <div className="space-y-3 pt-1">
                {/* Reset Account Progress */}
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-ink flex items-center gap-1.5">
                      <RotateCcw size={14} className="text-amber-500" />
                      <span>Reset Account Progress</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-ink-muted mt-0.5">
                      Reset character level to 1, clear all gold, reset habits, dailies, and quests back to a fresh state.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold text-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    Reset Progress
                  </button>
                </div>

                {/* Delete Account */}
                <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <Trash2 size={14} className="text-rose-500" />
                      <span>Delete Account Permanently</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-ink-muted mt-0.5">
                      Permanently erase your account, profile, and all progression history.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmText('');
                      setShowDeleteModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    Delete Account
                  </button>
                </div>

                {/* Sign Out */}
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 transition-all text-xs text-slate-700 dark:text-ink font-semibold cursor-pointer mt-2"
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reports Modal */}
      <ReportsModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />

      {/* Reset Account Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-amber-500/40 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-ink font-display">
                    Reset Account Progress?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-ink-muted">
                    This will revert your RPG stats to Level 1.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  The following will be reset:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <li>Level reset to 1 and XP set to 0</li>
                  <li>Coins/Gold set to 0</li>
                  <li>All active Habits, Dailies & Quests removed</li>
                  <li>Progression stats & streaks restored to baseline</li>
                </ul>
                <p className="text-[10px] text-slate-500 dark:text-ink-muted pt-1">
                  Your login email, password, and account credentials will remain preserved.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  disabled={isResetting}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-ink hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetAccount}
                  disabled={isResetting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isResetting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <span>Confirm Reset</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Danger Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-rose-500/40 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-ink font-display">
                    Delete Account Permanently?
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-ink-muted">
                Your account, profile information, authentication credentials, and all recorded progression data will be permanently wiped.
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-600 dark:text-slate-400 block">
                  To confirm, type <span className="font-bold text-rose-600 dark:text-rose-400">DELETE</span> below:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-rose-500/40 text-xs font-mono text-slate-900 dark:text-ink focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-ink hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText.trim() !== 'DELETE' || isDeleting}
                  className={clsx(
                    'flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md',
                    deleteConfirmText.trim() === 'DELETE' && !isDeleting
                      ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-98'
                      : 'bg-rose-500/30 text-rose-300 cursor-not-allowed'
                  )}
                >
                  {isDeleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <span>Delete Forever</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
