import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  User,
  Sun,
  Moon,
  Bell,
  Volume2,
  VolumeX,
  Bot,
  RotateCcw,
  Headphones,
  Info,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  ExternalLink,
  Flame,
  CalendarCheck,
  Scroll,
  ShoppingBag,
  ArrowRight,
  LogOut,
  Edit2,
  Check,
  Camera,
  Coins,
} from 'lucide-react';
import clsx from 'clsx';

import { Card } from '@/components/ui/Card';
import { pageTransition } from '@/lib/motionVariants';
import { useAuth } from '@/features/auth/hooks';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/components/ui/useToast';
import { playSound } from '@/lib/sound';

import { SETTINGS_SECTIONS, RESET_TARGETS } from './settingsConstants';

export function SettingsCarousel({
  onOpenNotifications,
  onOpenFeedback,
  onOpenReports,
  onRetakeOnboarding,
  fileInputRef,
  isUploadingAvatar,
  handleRemoveAvatar,
}) {
  const shouldReduceMotion = useReducedMotion();
  const { user, updateProfile, resetSection, resetAccount, deleteAccount, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const { showToast } = useToast();

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedSectionId, setSelectedSectionId] = useState('appearance');
  const trackRef = useRef(null);

  // Sound preference
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('lifeos_sound_enabled') !== 'false';
  });

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('lifeos_sound_enabled', String(next));
      if (next) playSound('click');
      return next;
    });
  };

  // Motto Quote
  const [motto, setMotto] = useState(() => {
    return localStorage.getItem('lifeos_user_motto') || 'Disciplined today. A better tomorrow.';
  });
  const [isEditingMotto, setIsEditingMotto] = useState(false);
  const [mottoInput, setMottoInput] = useState(motto);

  const handleSaveMotto = async () => {
    setMotto(mottoInput);
    localStorage.setItem('lifeos_user_motto', mottoInput);
    setIsEditingMotto(false);
    try {
      await updateProfile({ motto: mottoInput });
      showToast({ title: 'Motto Updated', message: 'Your personal sanctum motto has been saved.', type: 'success' });
    } catch (err) {
      console.error('Failed to sync motto:', err);
      showToast({ title: 'Error', message: 'Failed to update motto.', type: 'error' });
    }
  };

  // AI Preferences
  const [aiPreferences, setAiPreferences] = useState(() => {
    return (
      user?.aiPreferences || {
        enabled: true,
        provider: 'auto',
        allowTelemetry: true,
        autoCreateDailies: false,
        requireConfirmation: true,
      }
    );
  });

  const handleUpdateAiPref = async (key, val) => {
    const updated = { ...aiPreferences, [key]: val };
    setAiPreferences(updated);
    try {
      await updateProfile({ aiPreferences: updated });
      showToast({ title: 'AI Preferences Updated', message: 'Changes synchronized to sanctum.', type: 'success' });
    } catch (e) {
      console.warn('Failed to persist AI preferences:', e);
      showToast({ title: 'Sync Error', message: 'Could not save AI preferences.', type: 'error' });
    }
  };

  // Granular Reset Dialog States
  const [activeResetModal, setActiveResetModal] = useState(null); // null or target object
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [isResettingTarget, setIsResettingTarget] = useState(false);

  // Account Deletion Danger Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle Carousel Scroll & Active Sync
  const scrollToCard = useCallback((index) => {
    const container = trackRef.current;
    if (!container) return;
    const cards = container.children;
    if (cards[index]) {
      cards[index].scrollIntoView({
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest',
      });
      setActiveIndex(index);
      setSelectedSectionId(SETTINGS_SECTIONS[index].id);
    }
  }, [shouldReduceMotion]);

  const handlePrev = () => {
    const nextIdx = Math.max(0, activeIndex - 1);
    scrollToCard(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = Math.min(SETTINGS_SECTIONS.length - 1, activeIndex + 1);
    scrollToCard(nextIdx);
  };

  // Keyboard navigation on carousel container (Left/Right arrows, Enter)
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'Enter') {
      setSelectedSectionId(SETTINGS_SECTIONS[activeIndex].id);
    }
  };

  // Perform Granular Reset
  const handleExecuteReset = async () => {
    if (!activeResetModal) return;
    const target = activeResetModal.id;

    if (target === 'all' && resetConfirmInput.trim() !== 'RESET') {
      return;
    }

    try {
      setIsResettingTarget(true);
      if (target === 'all') {
        await resetAccount();
        showToast({
          title: 'System Wipe Complete',
          message: 'All RPG progression and tasks have been reset to baseline.',
          type: 'success',
        });
      } else {
        await resetSection(target);
        showToast({
          title: `${activeResetModal.title} Complete`,
          message: 'Targeted data reset successfully. Unrelated data remains intact.',
          type: 'success',
        });
      }
      setActiveResetModal(null);
      setResetConfirmInput('');
    } catch (err) {
      console.error('Reset execution failed:', err);
      showToast({
        title: 'Reset Failed',
        message: err.message || 'An error occurred while executing the reset.',
        type: 'error',
      });
    } finally {
      setIsResettingTarget(false);
    }
  };

  // Perform Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== 'DELETE') return;
    try {
      setIsDeleting(true);
      await deleteAccount({ confirmation: 'DELETE' });
      setShowDeleteModal(false);
      window.location.href = '/login';
    } catch (err) {
      console.error('Delete account failed:', err);
      showToast({ title: 'Deletion Failed', message: err.message || 'Could not delete account.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Get dynamic summary for a card
  const getSectionSummary = (id) => {
    switch (id) {
      case 'appearance':
        return mode === 'dark' ? 'Obsidian Dark' : 'Crystal Light';
      case 'notifications':
        return 'System Alerts Active';
      case 'sound':
        return soundEnabled ? 'Audio FX Active' : 'Sound Muted';
      case 'ai':
        return aiPreferences.enabled !== false ? `Provider: ${aiPreferences.provider?.toUpperCase() || 'AUTO'}` : 'Disabled';
      case 'account':
        return user?.displayName ? `${user.displayName}` : 'Active Sanctum';
      case 'data-resets':
        return '6 Reset Targets';
      case 'feedback':
        return 'Engineering Desk';
      case 'about':
        return 'LifeOS RPG v2.4';
      default:
        return 'Configure';
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Settings Carousel Header & Discovery Chrome ── */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-slate-900 dark:text-ink flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-500" />
            <span>Settings & Preferences Hub</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-ink-muted">
            Explore and configure each layer of your personal operating system.
          </p>
        </div>

        {/* Desktop Arrow Controls */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className="w-8 h-8 rounded-xl bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-ink hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all disabled:opacity-30 cursor-pointer shadow-xs active:scale-95"
            aria-label="Previous section"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={activeIndex === SETTINGS_SECTIONS.length - 1}
            className="w-8 h-8 rounded-xl bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-ink hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all disabled:opacity-30 cursor-pointer shadow-xs active:scale-95"
            aria-label="Next section"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── 2. The Horizontal Scroll-Snap Carousel ── */}
      <div
        role="region"
        aria-label="Settings Categories Carousel"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-3xl"
      >
        <div
          ref={trackRef}
          className="flex gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none py-2 px-1 focus:outline-none"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {SETTINGS_SECTIONS.map((section, idx) => {
            const Icon = section.icon;
            const isActive = selectedSectionId === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setActiveIndex(idx);
                  setSelectedSectionId(section.id);
                  if (section.id === 'feedback') {
                    onOpenFeedback?.();
                  }
                }}
                className={clsx(
                  'shrink-0 snap-center text-left rounded-3xl p-4 sm:p-5 transition-all duration-200 relative overflow-hidden',
                  'w-[250px] sm:w-[270px] min-h-[160px] flex flex-col justify-between cursor-pointer select-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                  isActive
                    ? 'bg-slate-900/90 dark:bg-white/[0.08] backdrop-blur-2xl border-2 shadow-2xl scale-100 z-10'
                    : 'bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 opacity-80 hover:opacity-100 scale-95'
                )}
                style={{
                  borderColor: isActive ? undefined : undefined,
                  boxShadow: isActive ? `0 12px 30px ${section.glowColor}` : undefined,
                }}
                aria-current={isActive ? 'true' : undefined}
                aria-label={`${section.title} section, status: ${getSectionSummary(section.id)}`}
              >
                {/* Glow ambient background on active */}
                {isActive && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-25"
                    style={{
                      background: `radial-gradient(200px circle at 80% 20%, ${section.glowColor}, transparent 70%)`,
                    }}
                  />
                )}

                {/* Top Row: Category tag + Live state chip */}
                <div className="flex items-center justify-between gap-2 relative z-10">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 dark:text-ink-muted">
                    {section.category}
                  </span>
                  <span
                    className={clsx(
                      'text-[10px] font-mono px-2 py-0.5 rounded-full border truncate font-bold',
                      isActive ? 'bg-white/20 text-white border-white/30' : section.badgeColor
                    )}
                  >
                    {getSectionSummary(section.id)}
                  </span>
                </div>

                {/* Middle: Icon + Title + Short description */}
                <div className="space-y-1 relative z-10 my-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={clsx(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-transform',
                        isActive
                          ? 'bg-white text-slate-950 border-white shadow-md scale-105'
                          : 'bg-slate-100 dark:bg-white/[0.06] border-slate-200 dark:border-white/10 text-slate-700 dark:text-ink'
                      )}
                    >
                      <Icon size={16} />
                    </div>
                    <h3
                      className={clsx(
                        'text-sm font-bold font-display truncate',
                        isActive ? 'text-white' : 'text-slate-900 dark:text-ink'
                      )}
                    >
                      {section.title}
                    </h3>
                  </div>
                  <p
                    className={clsx(
                      'text-[11px] line-clamp-2 leading-tight',
                      isActive ? 'text-slate-300' : 'text-slate-500 dark:text-ink-muted'
                    )}
                  >
                    {section.description}
                  </p>
                </div>

                {/* Bottom: Affordance indicator */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10 relative z-10 text-[11px] font-semibold">
                  <span className={isActive ? 'text-white font-bold' : 'text-slate-500 dark:text-ink-muted'}>
                    {isActive ? 'Active Section' : 'Tap to Open'}
                  </span>
                  <ArrowRight
                    size={14}
                    className={clsx(
                      'transition-transform',
                      isActive ? 'text-white translate-x-1' : 'text-slate-400'
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {SETTINGS_SECTIONS.map((section, idx) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToCard(idx)}
              className={clsx(
                'h-1.5 rounded-full transition-all duration-200 cursor-pointer',
                activeIndex === idx
                  ? 'w-6 bg-indigo-500 dark:bg-indigo-400'
                  : 'w-1.5 bg-slate-300 dark:bg-white/20 hover:bg-slate-400'
              )}
              aria-label={`Go to ${section.title}`}
            />
          ))}
        </div>
      </div>

      {/* ── 3. Dedicated Section Detail View with Smooth Transition ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedSectionId}
          {...(shouldReduceMotion ? {} : pageTransition)}
          className="space-y-4"
        >
          {/* SECTION A: Appearance & Theme */}
          {selectedSectionId === 'appearance' && (
            <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/25 flex items-center justify-center">
                    <Moon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-slate-900 dark:text-ink">
                      Appearance & Interface Theme
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-ink-muted">
                      Toggle high-contrast obsidian dark mode or daylight crystal mode.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('dark')}
                  className={clsx(
                    'p-4 rounded-2xl border text-left space-y-2 transition-all cursor-pointer',
                    mode === 'dark'
                      ? 'bg-slate-950 border-violet-500 text-white shadow-lg ring-2 ring-violet-500/30'
                      : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-700 dark:text-ink hover:bg-slate-100'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Moon size={18} className="text-violet-400" />
                    {mode === 'dark' && <CheckCircle2 size={16} className="text-violet-400" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold">Obsidian Dark</p>
                    <p className="text-[10px] text-slate-400">Deep OLED contrast with glass depth</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('light')}
                  className={clsx(
                    'p-4 rounded-2xl border text-left space-y-2 transition-all cursor-pointer',
                    mode === 'light'
                      ? 'bg-white border-violet-500 text-slate-900 shadow-lg ring-2 ring-violet-500/30'
                      : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-700 dark:text-ink hover:bg-slate-100'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Sun size={18} className="text-amber-500" />
                    {mode === 'light' && <CheckCircle2 size={16} className="text-violet-600" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold">Crystal Light</p>
                    <p className="text-[10px] text-slate-500">High-clarity daylight theme</p>
                  </div>
                </button>
              </div>
            </Card>
          )}

          {/* SECTION B: Notifications & Reminders */}
          {selectedSectionId === 'notifications' && (
            <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center">
                    <Bell size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-slate-900 dark:text-ink">
                      Alerts & Reminders Hub
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-ink-muted">
                      Manage scheduled notifications for daily rituals, streak nudges & bedtime.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <Bell size={18} className="text-emerald-500" />
                    <div>
                      <div className="text-left font-bold text-xs">Open Notification Center & Rules</div>
                      <div className="text-[10px] font-normal text-slate-500 dark:text-ink-muted">
                        Configure schedules, quiet hours, sound alerts & priority levels
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} />
                </button>
              </div>
            </Card>
          )}

          {/* SECTION C: Audio & Sound FX */}
          {selectedSectionId === 'sound' && (
            <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center">
                    <Volume2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-slate-900 dark:text-ink">
                      Audio Feedback & Haptics
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-ink-muted">
                      Synthesized sound effects for task checks, XP celebrations & level-ups.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    {soundEnabled ? (
                      <Volume2 size={18} className="text-amber-500" />
                    ) : (
                      <VolumeX size={18} className="text-slate-400" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-ink">Audio FX Sounds</p>
                      <p className="text-[10px] text-slate-500 dark:text-ink-muted">
                        Play micro-sound effects when completing tasks and gaining XP
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleSound}
                    className={clsx(
                      'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                      soundEnabled
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-ink-muted border-transparent'
                    )}
                  >
                    {soundEnabled ? 'Active' : 'Muted'}
                  </button>
                </div>

                {soundEnabled && (
                  <button
                    type="button"
                    onClick={() => playSound('achievement')}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-ink transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Test Audio Synthesis (Play Achievement Fanfare)</span>
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* SECTION D: AI Agent & Logic */}
          {selectedSectionId === 'ai' && (
            <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 flex items-center justify-center">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-slate-900 dark:text-ink">
                      Jeevan AI Agent & Reasoning
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-ink-muted">
                      LLM provider selection, telemetry permissions, and autonomous task creation guards.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleUpdateAiPref('enabled', !aiPreferences.enabled)}
                  className={clsx(
                    'w-10 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0',
                    aiPreferences.enabled !== false ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-white/15'
                  )}
                  aria-label="Toggle AI agent"
                >
                  <div
                    className={clsx(
                      'w-5 h-5 rounded-full bg-white shadow-xs transition-transform',
                      aiPreferences.enabled !== false ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {aiPreferences.enabled !== false && (
                <div className="space-y-3.5 pt-1">
                  {/* Provider Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Reasoning Provider
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'auto', label: 'Auto (Best)' },
                        { id: 'gemini', label: 'Google Gemini' },
                        { id: 'openai', label: 'OpenAI GPT' },
                        { id: 'offline', label: 'Offline Engine' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleUpdateAiPref('provider', p.id)}
                          className={clsx(
                            'py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer',
                            (aiPreferences.provider || 'auto') === p.id
                              ? 'border-cyan-500 bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold shadow-xs'
                              : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-ink-muted'
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Telemetry Toggle */}
                  <div
                    onClick={() => handleUpdateAiPref('allowTelemetry', !aiPreferences.allowTelemetry)}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-ink">
                        Telemetry & Productivity History
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-ink-muted">
                        Allow AI to analyze habits, dailies, streaks, and focus sessions
                      </p>
                    </div>
                    <div
                      className={clsx(
                        'w-9 h-5 rounded-full transition-colors relative p-0.5 shrink-0',
                        aiPreferences.allowTelemetry !== false ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-white/15'
                      )}
                    >
                      <div
                        className={clsx(
                          'w-4 h-4 rounded-full bg-white shadow-xs transition-transform',
                          aiPreferences.allowTelemetry !== false ? 'translate-x-4' : 'translate-x-0'
                        )}
                      />
                    </div>
                  </div>

                  {/* Auto Create Tasks vs Propose */}
                  <div
                    onClick={() => handleUpdateAiPref('autoCreateDailies', !aiPreferences.autoCreateDailies)}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-ink">
                        Allow AI to Create Dailies Directly
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-ink-muted">
                        {aiPreferences.autoCreateDailies
                          ? 'Tasks are committed directly into your active routine'
                          : 'Proposes scheduled task cards for manual confirmation'}
                      </p>
                    </div>
                    <div
                      className={clsx(
                        'w-9 h-5 rounded-full transition-colors relative p-0.5 shrink-0',
                        aiPreferences.autoCreateDailies ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-white/15'
                      )}
                    >
                      <div
                        className={clsx(
                          'w-4 h-4 rounded-full bg-white shadow-xs transition-transform',
                          aiPreferences.autoCreateDailies ? 'translate-x-4' : 'translate-x-0'
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* SECTION E: Account & Sanctum */}
          {selectedSectionId === 'account' && (
            <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 flex items-center justify-center">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-slate-900 dark:text-ink">
                      Sanctum Identity & Session
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-ink-muted">
                      Profile picture, identity motto, email credentials & danger zone.
                    </p>
                  </div>
                </div>
              </div>

              {/* User Identity Details */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white border-2 border-indigo-400">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <User size={22} />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef?.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md cursor-pointer hover:scale-105"
                      title="Upload photo"
                    >
                      {isUploadingAvatar ? <Loader2 size={10} className="animate-spin" /> : <Camera size={10} />}
                    </button>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-ink">{user?.displayName || 'Hero'}</h4>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-ink-muted">{user?.email}</p>
                  </div>
                </div>

                {user?.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-[11px] font-mono text-rose-500 hover:underline cursor-pointer"
                  >
                    Remove avatar
                  </button>
                )}
              </div>

              {/* Motto Editor */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Personal Motto Quote
                </label>
                {isEditingMotto ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={mottoInput}
                      onChange={(e) => setMottoInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/20 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      maxLength={60}
                    />
                    <button
                      type="button"
                      onClick={handleSaveMotto}
                      className="p-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors cursor-pointer"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs italic text-slate-600 dark:text-slate-300 truncate font-serif">
                      &ldquo;{motto}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMottoInput(motto);
                        setIsEditingMotto(true);
                      }}
                      className="p-1.5 text-indigo-500 hover:text-indigo-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Sign Out */}
              <button
                type="button"
                onClick={() => logout()}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 transition-all text-xs text-slate-800 dark:text-ink font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut size={16} />
                  <span>Sign Out of Sanctum</span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-ink-muted">
                  Disconnect
                </span>
              </button>

              {/* Danger Zone: Account Deletion */}
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <Trash2 size={14} className="text-rose-500" />
                    <span>Delete Account Permanently</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-ink-muted mt-0.5">
                    Permanently wipe your account, credentials, and all historical progression.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmText('');
                    setShowDeleteModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  Delete Account
                </button>
              </div>
            </Card>
          )}

          {/* SECTION F: Data & Granular Resets (Task 3 Core Requirement) */}
          {selectedSectionId === 'data-resets' && (
            <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center justify-center">
                    <RotateCcw size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-slate-900 dark:text-ink">
                      Data Management & Granular Resets
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-ink-muted">
                      Selectively reset individual systems without wiping unrelated data.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Row: Onboarding + Export Reports */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={onRetakeOnboarding}
                  className="p-3.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/25 text-left transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-purple-500" />
                      <span>Retake Onboarding Survey</span>
                    </span>
                    <ArrowRight size={14} className="text-purple-500" />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-ink-muted">
                    Re-run the initial 5-step schedule, goal & RPG archetype quiz
                  </p>
                </button>

                <button
                  type="button"
                  onClick={onOpenReports}
                  className="p-3.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/25 text-left transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <Coins size={14} className="text-indigo-500" />
                      <span>Export Reports & Telemetry</span>
                    </span>
                    <ArrowRight size={14} className="text-indigo-500" />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-ink-muted">
                    Generate and download weekly productivity & focus logs
                  </p>
                </button>
              </div>

              {/* Granular Reset Targets List */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Select a System to Reset
                </span>

                <div className="grid grid-cols-1 gap-2.5">
                  {RESET_TARGETS.map((target) => {
                    const TargetIcon = target.icon;
                    return (
                      <div
                        key={target.id}
                        className={clsx(
                          'p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                          target.isDanger
                            ? 'bg-rose-500/5 border-rose-500/30'
                            : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={clsx(
                              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border',
                              target.isDanger
                                ? 'bg-rose-500/20 text-rose-500 border-rose-500/30'
                                : 'bg-slate-100 dark:bg-white/[0.06] border-slate-200 dark:border-white/10'
                            )}
                          >
                            <TargetIcon size={16} className={target.color} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4
                                className={clsx(
                                  'text-xs font-bold',
                                  target.isDanger ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-ink'
                                )}
                              >
                                {target.title}
                              </h4>
                              <span
                                className={clsx(
                                  'text-[10px] font-mono px-1.5 py-0.2 rounded border',
                                  target.isDanger
                                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold'
                                    : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-ink-muted border-slate-200 dark:border-white/10'
                                )}
                              >
                                {target.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-ink-muted mt-0.5">
                              {target.subtitle}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setResetConfirmInput('');
                            setActiveResetModal(target);
                          }}
                          className={clsx(
                            'px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto border',
                            target.isDanger
                              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-xs'
                              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          )}
                        >
                          {target.isDanger ? 'Wipe Everything' : 'Reset Target'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* SECTION G: Feedback & Support (Decoupled Card Destination) */}
          {selectedSectionId === 'feedback' && (
            <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25 flex items-center justify-center">
                    <Headphones size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-slate-900 dark:text-ink">
                      Help & Feedback Desk
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-ink-muted">
                      Direct engineering support, triage bug reporting, and user feature suggestions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={onOpenFeedback}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 hover:from-sky-500/15 hover:to-purple-500/15 border border-sky-500/30 text-sky-800 dark:text-sky-300 font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <Headphones size={18} className="text-sky-500" />
                    <div>
                      <div className="text-left font-bold text-xs">Open Dedicated Feedback Center</div>
                      <div className="text-[10px] font-normal text-slate-500 dark:text-ink-muted">
                        Submit categorized reports (Bug, Suggestion, UI/UX Polish) with attachments
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} />
                </button>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-ink block">Direct Contacts</span>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-ink-muted">
                    <span>Engineering Email</span>
                    <a
                      href="mailto:support@jeevan.app"
                      className="font-mono text-indigo-500 hover:underline flex items-center gap-1"
                    >
                      <span>support@jeevan.app</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION H: About Jeevan */}
          {selectedSectionId === 'about' && (
            <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/25 flex items-center justify-center">
                    <Info size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-slate-900 dark:text-ink">
                      About Jeevan LifeOS
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-ink-muted">
                      Personal operating system architecture, gamification engine & local storage.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1 text-xs text-slate-600 dark:text-ink-muted">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span>Operating System:</span>
                    <span className="font-bold text-slate-900 dark:text-ink">Jeevan LifeOS RPG</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Engine Version:</span>
                    <span className="text-indigo-500 font-bold">v2.4.0 (Production)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>UI Glass System:</span>
                    <span className="text-slate-900 dark:text-ink">Tailwind v4 @theme + 5-Level Depth</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Motion Architecture:</span>
                    <span className="text-slate-900 dark:text-ink">Framer Motion Compositor Springs</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── 4. Granular Reset Confirmation Modal (Task 3 Data Safety) ── */}
      <AnimatePresence>
        {activeResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={clsx(
                'bg-white dark:bg-slate-900 border rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4',
                activeResetModal.isDanger ? 'border-rose-500/40' : 'border-amber-500/40'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
                    activeResetModal.isDanger
                      ? 'bg-rose-500/20 text-rose-500'
                      : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  )}
                >
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-ink font-display">
                    {activeResetModal.title}?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-ink-muted">
                    {activeResetModal.subtitle}
                  </p>
                </div>
              </div>

              {/* Data Safety Breakdown */}
              <div
                className={clsx(
                  'p-3.5 rounded-2xl border text-xs space-y-2',
                  activeResetModal.isDanger
                    ? 'bg-rose-500/10 border-rose-500/20 text-slate-700 dark:text-slate-300'
                    : 'bg-amber-500/10 border-amber-500/20 text-slate-700 dark:text-slate-300'
                )}
              >
                <div>
                  <p
                    className={clsx(
                      'font-bold text-[11px] uppercase tracking-wider',
                      activeResetModal.isDanger ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'
                    )}
                  >
                    What will be erased:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] pt-0.5">
                    {activeResetModal.willDelete.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-1 border-t border-black/10 dark:border-white/10">
                  <p className="font-bold text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    What remains untouched:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] pt-0.5 text-slate-600 dark:text-slate-400">
                    {activeResetModal.willPreserve.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Strict Type-to-Confirm for "all" */}
              {activeResetModal.id === 'all' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-600 dark:text-slate-400 block">
                    To confirm full wipe, type <span className="font-bold text-rose-600 dark:text-rose-400">RESET</span> below:
                  </label>
                  <input
                    type="text"
                    value={resetConfirmInput}
                    onChange={(e) => setResetConfirmInput(e.target.value)}
                    placeholder="Type RESET"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-rose-500/40 text-xs font-mono text-slate-900 dark:text-ink focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveResetModal(null);
                    setResetConfirmInput('');
                  }}
                  disabled={isResettingTarget}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-ink hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteReset}
                  disabled={
                    isResettingTarget ||
                    (activeResetModal.id === 'all' && resetConfirmInput.trim() !== 'RESET')
                  }
                  className={clsx(
                    'flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer',
                    activeResetModal.isDanger
                      ? resetConfirmInput.trim() === 'RESET'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-rose-500/30 text-rose-300 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  )}
                >
                  {isResettingTarget ? (
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

      {/* ── 5. Account Deletion Modal ── */}
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
                Your account, profile information, credentials, and all recorded progression data will be permanently wiped from the database.
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
                      ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                      : 'bg-rose-500/30 text-rose-300 cursor-not-allowed'
                  )}
                >
                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <span>Delete Forever</span>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
