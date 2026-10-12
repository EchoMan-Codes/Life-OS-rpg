import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  CloudRain,
  Headphones,
  VolumeX,
  ArrowLeft,
  X,
  Play,
  Pause,
  CheckCircle2,
  Zap,
  Clock,
  Layers,
  BarChart3,
  Plus,
  Target,
  Shield,
  Lock,
  AlertTriangle,
  AlertOctagon,
  Sliders,
  Coins,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import clsx from 'clsx';

import {
  useCurrentFocusSession,
  useStartFocusSession,
  usePauseFocusSession,
  useResumeFocusSession,
  useCompleteFocusSession,
  useAbandonFocusSession,
  useEarlyExitFocusSession,
  useEmergencyExitFocusSession,
  useRecordFocusEvent,
  useFocusProfiles,
  useCreateFocusProfile,
  useFocusCapabilities,
  useFocusTimer,
} from '@/features/focus/hooks';
import { useTasks } from '@/features/tasks/hooks';
import { useQuests } from '@/features/quests/hooks';
import { ambientSound } from '@/lib/ambientSound';
import { playSound } from '@/lib/sound';
import { triggerHaptic } from '@/lib/native/nativeHaptics';
import { distractionShield, PRESET_PROFILES } from '@/features/focus/shield';

import HoldToConfirmButton from '@/components/focus/HoldToConfirmButton';
import EmergencyExitModal from '@/components/focus/EmergencyExitModal';
import PreparationModal from '@/components/focus/PreparationModal';
import ShieldProfileModal from '@/components/focus/ShieldProfileModal';
import FocusAnalyticsView from '@/components/focus/FocusAnalyticsView';

const DURATION_PRESETS = [
  { seconds: 1500, label: '25m', title: 'Classic Pomodoro', desc: 'Standard deep work sprint', multiplierText: '1.0x Base' },
  { seconds: 2700, label: '45m', title: 'Study Session', desc: 'Focused study & analysis', multiplierText: 'High flow' },
  { seconds: 3600, label: '60m', title: 'Deep Work', desc: 'Sustained cognitive immersion', multiplierText: 'Deep sprint' },
  { seconds: 5400, label: '90m', title: 'Extended Immersion', desc: 'Peak cognitive block', multiplierText: 'Ultradian sprint' },
];

const AMBIENT_TRACKS = [
  { id: 'silence', label: 'Silence', icon: VolumeX },
  { id: 'rain', label: 'Rain', icon: CloudRain },
  { id: 'lofi', label: 'Lo-Fi', icon: Headphones },
];

export default function FocusChamberPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  // Tab State: chamber vs analytics
  const [activeTab, setActiveTab] = useState('chamber');

  // Setup State
  const [selectedDuration, setSelectedDuration] = useState(1500);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(30);
  const [selectedAmbient, setSelectedAmbient] = useState('silence');
  const [selectedCommitmentLevel, setSelectedCommitmentLevel] = useState(1);
  const [selectedProfileId, setSelectedProfileId] = useState('');

  // Objective Linking State
  const [linkedEntityType, setLinkedEntityType] = useState('none');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [selectedQuestId, setSelectedQuestId] = useState('');
  const [customGoalTitle, setCustomGoalTitle] = useState('');

  // Modals State
  const [isPrepModalOpen, setIsPrepModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [completedResult, setCompletedResult] = useState(null);

  // Queries
  const { data: currentSession, isLoading: isSessionLoading } = useCurrentFocusSession();
  const { data: profiles = [] } = useFocusProfiles();
  const { data: capabilities } = useFocusCapabilities();
  const { data: activeTasks = [] } = useTasks({ status: 'active' });
  const { data: activeQuests = [] } = useQuests({ status: 'active' });

  // Mutations
  const startMutation = useStartFocusSession();
  const pauseMutation = usePauseFocusSession();
  const resumeMutation = useResumeFocusSession();
  const completeMutation = useCompleteFocusSession();
  const abandonMutation = useAbandonFocusSession();
  const earlyExitMutation = useEarlyExitFocusSession();
  const emergencyExitMutation = useEmergencyExitFocusSession();
  const recordEventMutation = useRecordFocusEvent();
  const createProfileMutation = useCreateFocusProfile();

  // Active Timer Engine
  const timer = useFocusTimer(currentSession);

  // Selected Shield Profile object
  const activeProfile = useMemo(() => {
    if (!selectedProfileId) {
      return profiles.find((p) => p.isDefault) || profiles[0] || PRESET_PROFILES[0];
    }
    return profiles.find((p) => p.id === selectedProfileId) || PRESET_PROFILES[0];
  }, [selectedProfileId, profiles]);

  // Derived Title for active goal
  const activeGoalTitle = useMemo(() => {
    if (linkedEntityType === 'task') {
      const t = activeTasks.find((task) => task.id === selectedTaskId);
      return t ? t.title : 'Selected Task';
    }
    if (linkedEntityType === 'quest') {
      const q = activeQuests.find((quest) => quest.id === selectedQuestId);
      return q ? q.title : 'Selected Quest';
    }
    if (linkedEntityType === 'custom') {
      return customGoalTitle.trim() || 'Custom Focus Goal';
    }
    return 'Free Flow Deep Sprint';
  }, [linkedEntityType, selectedTaskId, selectedQuestId, customGoalTitle, activeTasks, activeQuests]);

  // Ambient sound management
  useEffect(() => {
    if (currentSession && !completedResult && !timer.isPaused) {
      ambientSound.setTrack(currentSession.ambientSound || selectedAmbient);
    } else {
      ambientSound.setTrack('silence');
    }
    return () => {
      ambientSound.setTrack('silence');
    };
  }, [currentSession, selectedAmbient, completedResult, timer.isPaused]);

  // Handle Interruption detection and shield activation while session is active
  useEffect(() => {
    if (!currentSession || currentSession.endedAt) return;

    distractionShield.startShield(currentSession.id, {
      restrictedApps: activeProfile?.restrictedApps || [],
      onInterruption: (eventType, metadata) => {
        recordEventMutation.mutate({
          id: currentSession.id,
          eventType,
          metadata,
          clientTimestamp: new Date().toISOString(),
        });
      },
    });

    return () => {
      distractionShield.stopShield(currentSession.id);
    };
  }, [currentSession?.id]);

  // Start Focus Session Handler
  const handleConfirmStart = async () => {
    try {
      setCompletedResult(null);
      const plannedSec = isCustomDuration ? customMinutes * 60 : selectedDuration;

      await startMutation.mutateAsync({
        plannedDurationSeconds: plannedSec,
        ambientSound: selectedAmbient,
        commitmentLevel: selectedCommitmentLevel,
        shieldProfileId: activeProfile?.id || null,
        goalDescription: activeGoalTitle,
        linkedEntityType: linkedEntityType === 'custom' ? 'none' : linkedEntityType,
        linkedEntityId: linkedEntityType === 'task' ? selectedTaskId : linkedEntityType === 'quest' ? selectedQuestId : null,
        taskTitle: activeGoalTitle,
      });

      setIsPrepModalOpen(false);
      playSound('focus_start');
      triggerHaptic('success');
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  // Complete Session Handler
  const handleComplete = async () => {
    if (!currentSession) return;
    try {
      const result = await completeMutation.mutateAsync(currentSession.id);
      setCompletedResult(result);
      playSound('level_up');
      triggerHaptic('success');
      if (!shouldReduceMotion) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error('Completion verification rejected:', err);
    }
  };

  // Hold-to-Confirm Early Exit
  const handleEarlyExit = async () => {
    if (!currentSession) return;
    try {
      await earlyExitMutation.mutateAsync({
        id: currentSession.id,
        data: { reason: 'User confirmed hold-to-exit', holdConfirmed: true },
      });
      triggerHaptic('medium');
    } catch (err) {
      console.error('Early exit failed:', err);
    }
  };

  // Emergency Exit
  const handleEmergencyExit = async () => {
    if (!currentSession) return;
    try {
      await emergencyExitMutation.mutateAsync({
        id: currentSession.id,
        data: { reason: 'Emergency exit triggered' },
      });
      setIsEmergencyModalOpen(false);
      triggerHaptic('heavy');
    } catch (err) {
      console.error('Emergency exit failed:', err);
    }
  };

  // SVG Progress Ring calculations
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(1, Math.max(0, timer.progress)));

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 flex flex-col selection:bg-indigo-500/30">
      {/* Top Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Chamber</span>
        </button>

        {/* View Switcher Tabs */}
        <div className="flex p-1 rounded-2xl bg-slate-200/60 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('chamber')}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center space-x-1.5',
              activeTab === 'chamber'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Chamber</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center space-x-1.5',
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics & History</span>
          </button>
        </div>

        {/* Emergency Exit Shortcut (Always Accessible during active session) */}
        {currentSession && !completedResult ? (
          <button
            type="button"
            onClick={() => setIsEmergencyModalOpen(true)}
            className="text-[11px] font-mono text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Emergency Exit</span>
          </button>
        ) : (
          <div className="w-24" />
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-2 sm:p-4 flex flex-col items-center justify-center">
        {activeTab === 'analytics' ? (
          <div className="w-full">
            <FocusAnalyticsView />
          </div>
        ) : currentSession && !completedResult ? (
          /* ========================================================================= */
          /* ACTIVE FOCUS CHAMBER (DISTRACTION-FREE RUNNING SCREEN) */
          /* ========================================================================= */
          <div className="w-full flex flex-col items-center justify-center space-y-8 animate-fade-in py-6">
            {/* Status & Commitment Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span
                className={clsx(
                  'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 border',
                  timer.isPaused
                    ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 animate-pulse'
                )}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>{timer.isPaused ? 'Chamber Paused' : 'Focus Flow Active'}</span>
              </span>

              {currentSession.commitmentLevel > 1 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span>
                    Level {currentSession.commitmentLevel}:{' '}
                    {currentSession.commitmentLevel === 3 ? 'Max Shield (+25%)' : 'Commitment Lock (+15%)'}
                  </span>
                </span>
              )}

              {currentSession.shieldProfileName && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/30 flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                  <span>{currentSession.shieldProfileName}</span>
                </span>
              )}
            </div>

            {/* Objective Display */}
            <div className="text-center max-w-md space-y-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono uppercase tracking-widest">Active Objective</p>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {currentSession.taskTitle || currentSession.goalDescription || 'Free Flow Deep Sprint'}
              </h2>
            </div>

            {/* Animated Circular SVG Countdown Ring */}
            <div className="relative flex items-center justify-center">
              <svg width="280" height="280" className="transform -rotate-90">
                {/* Background Track Circle */}
                <circle
                  cx="140"
                  cy="140"
                  r={radius}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-white/10"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Animated Progress Circle */}
                <motion.circle
                  cx="140"
                  cy="140"
                  r={radius}
                  stroke={currentSession.commitmentLevel === 3 ? '#0284c7' : '#6366f1'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </svg>

              {/* Inner Digital Countdown */}
              <div className="absolute flex flex-col items-center justify-center text-center space-y-1">
                <span className="font-mono text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
                  {timer.formattedTime}
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {Math.round(timer.progress * 100)}% Elapsed
                </span>
                {currentSession.interruptionCount > 0 && (
                  <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 flex items-center space-x-1 pt-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{currentSession.interruptionCount} interruption{currentSession.interruptionCount > 1 ? 's' : ''}</span>
                  </span>
                )}
              </div>
            </div>

            {/* In-Session Controls */}
            <div className="w-full max-w-md flex flex-col items-center space-y-4 pt-2">
              {timer.isFinished ? (
                /* Ready to Complete Button */
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={completeMutation.isPending}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm tracking-wide transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-2 animate-bounce"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{completeMutation.isPending ? 'Validating...' : 'Claim Victory & Rewards ⚡'}</span>
                </button>
              ) : currentSession.commitmentLevel === 1 ? (
                /* Level 1: Standard Controls */
                <div className="flex space-x-3 w-full">
                  {timer.isPaused ? (
                    <button
                      type="button"
                      onClick={() => resumeMutation.mutate(currentSession.id)}
                      disabled={resumeMutation.isPending}
                      className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Resume Sprint</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => pauseMutation.mutate(currentSession.id)}
                      disabled={pauseMutation.isPending}
                      className="flex-1 py-3 px-4 rounded-2xl bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-800 dark:text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-2"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowAbandonConfirm(true)}
                    className="py-3 px-4 rounded-2xl bg-slate-200/60 dark:bg-white/5 hover:bg-rose-500/20 border border-slate-300/80 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 font-semibold text-xs transition-colors"
                  >
                    Abandon
                  </button>
                </div>
              ) : (
                /* Level 2 & Level 3: Commitment Lock Controls */
                <div className="w-full flex flex-col items-center space-y-3">
                  <HoldToConfirmButton
                    onConfirm={handleEarlyExit}
                    holdDurationMs={4000}
                    label="Hold 4s to Break Commitment"
                    className="w-full"
                  />
                  <p className="text-[11px] text-slate-500 font-mono text-center">
                    Pause is locked to protect flow state. Hold to exit or use Emergency Exit.
                  </p>
                </div>
              )}

              {/* Ambient Sound Controller */}
              <div className="flex items-center space-x-2 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-white/5 border border-slate-300/80 dark:border-white/10 text-xs">
                {AMBIENT_TRACKS.map((t) => {
                  const Icon = t.icon;
                  const isActive = (currentSession.ambientSound || selectedAmbient) === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedAmbient(t.id);
                        ambientSound.setTrack(t.id);
                      }}
                      className={clsx(
                        'px-3 py-1.5 rounded-xl font-medium transition-all flex items-center space-x-1.5',
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : completedResult ? (
          /* ========================================================================= */
          /* VICTORY CELEBRATION CARD */
          /* ========================================================================= */
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-500/30 text-center space-y-6 shadow-2xl"
          >
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Focus Sprint Conquered!</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Cognitive depth rewarded through Progression Service</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="p-2">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">XP Earned</div>
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">+{completedResult.xpAwarded}</div>
              </div>
              <div className="p-2">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Gold Earned</div>
                <div className="text-lg font-bold text-amber-500 dark:text-amber-400">+{completedResult.goldAwarded}</div>
              </div>
              <div className="p-2">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Mana Restored</div>
                <div className="text-lg font-bold text-sky-500 dark:text-sky-400">+{completedResult.manaRegenerated}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCompletedResult(null);
                setActiveTab('chamber');
              }}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-lg shadow-indigo-600/30"
            >
              Continue to Dashboard
            </button>
          </motion.div>
        ) : (
          /* ========================================================================= */
          /* PREPARATION & CONFIGURATION COCKPIT */
          /* ========================================================================= */
          <div className="w-full space-y-8 animate-fade-in">
            {/* Header Title */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Distraction-Resistant Deep Work</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight sm:text-4xl">Focus Chamber</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Lock in with selectable app restrictions, verified anti-cheat tracking, and authentic gamified progression.
              </p>
            </div>

            {/* Presets Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                  <span>Session Preset</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomDuration(!isCustomDuration)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold text-xs flex items-center space-x-1"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isCustomDuration ? 'Use Standard Presets' : 'Custom Duration'}</span>
                </button>
              </div>

              {!isCustomDuration ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DURATION_PRESETS.map((p) => {
                    const isSelected = selectedDuration === p.seconds;
                    return (
                      <button
                        key={p.seconds}
                        type="button"
                        onClick={() => setSelectedDuration(p.seconds)}
                        className={clsx(
                          'p-4 rounded-2xl border text-left transition-all',
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/10'
                            : 'bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                        )}
                      >
                        <div className="font-mono text-xl font-black text-slate-900 dark:text-white">{p.label}</div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">{p.title}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{p.desc}</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Custom Focus Length</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{customMinutes} minutes</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="180"
                    step="5"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>5m Quick Sprint</span>
                    <span>90m Deep Block</span>
                    <span>180m Marathon</span>
                  </div>
                </div>
              )}
            </div>

            {/* Commitment Level Selector (3 Tiers) */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Anti-Cheat Commitment Level</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    lvl: 1,
                    title: 'Level 1: Standard Flow',
                    desc: 'Normal pause & cancel. Base XP & Gold rewards.',
                    bonus: '1.0x Base',
                  },
                  {
                    lvl: 2,
                    title: 'Level 2: Commitment Lock',
                    desc: 'Pause disabled. Requires 4-second hold to exit early.',
                    bonus: '+15% XP & Gold',
                  },
                  {
                    lvl: 3,
                    title: 'Level 3: Maximum Shield',
                    desc: 'Full distraction blocking barrier + hold to exit.',
                    bonus: '+25% XP & Gold',
                  },
                ].map((item) => {
                  const isSelected = selectedCommitmentLevel === item.lvl;
                  return (
                    <button
                      key={item.lvl}
                      type="button"
                      onClick={() => setSelectedCommitmentLevel(item.lvl)}
                      className={clsx(
                        'p-4 rounded-2xl border text-left transition-all relative overflow-hidden',
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/10'
                          : 'bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{item.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                          {item.bonus}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Distraction Shield Profile Selector */}
            <div className="p-4 rounded-3xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span>Distraction Shield Profile</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create / Edit Profiles</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[...PRESET_PROFILES, ...profiles].map((prof) => {
                  const isSelected = activeProfile?.name === prof.name;
                  return (
                    <button
                      key={prof.id || prof.name}
                      type="button"
                      onClick={() => setSelectedProfileId(prof.id || '')}
                      className={clsx(
                        'p-3 rounded-2xl border text-left transition-all text-xs',
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-slate-900 dark:text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      )}
                    >
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{prof.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {prof.restrictedApps?.length || 0} apps • {prof.restrictedDomains?.length || 0} sites
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Objective Linkage Selector */}
            <div className="p-4 rounded-3xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>Link to Goal or Quest</span>
              </span>

              <div className="flex space-x-2 text-xs">
                {[
                  { id: 'none', label: 'Free Flow Sprint' },
                  { id: 'task', label: 'Linked Task' },
                  { id: 'quest', label: 'Active Quest' },
                  { id: 'custom', label: 'Session Goal' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setLinkedEntityType(t.id)}
                    className={clsx(
                      'flex-1 py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all',
                      linkedEntityType === t.id
                        ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-indigo-700 dark:text-white'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {linkedEntityType === 'task' && (
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">Select a task to focus on...</option>
                  {activeTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} ({task.priority || 'medium'})
                    </option>
                  ))}
                </select>
              )}

              {linkedEntityType === 'quest' && (
                <select
                  value={selectedQuestId}
                  onChange={(e) => setSelectedQuestId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">Select a quest to advance...</option>
                  {activeQuests.map((quest) => (
                    <option key={quest.id} value={quest.id}>
                      {quest.title} ({quest.questType || 'weekly'})
                    </option>
                  ))}
                </select>
              )}

              {linkedEntityType === 'custom' && (
                <input
                  type="text"
                  value={customGoalTitle}
                  onChange={(e) => setCustomGoalTitle(e.target.value)}
                  placeholder="e.g. Master React 19 Server Components"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              )}
            </div>

            {/* Launch Focus Chamber Button */}
            <button
              type="button"
              onClick={() => setIsPrepModalOpen(true)}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-sm tracking-wide transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2"
            >
              <Zap className="w-5 h-5 fill-white" />
              <span>Review & Enter Chamber ⚡</span>
            </button>
          </div>
        )}
      </main>

      {/* Preparation Briefing Modal */}
      <PreparationModal
        isOpen={isPrepModalOpen}
        onClose={() => setIsPrepModalOpen(false)}
        onConfirm={handleConfirmStart}
        isStarting={startMutation.isPending}
        sessionConfig={{
          plannedDurationSeconds: isCustomDuration ? customMinutes * 60 : selectedDuration,
          commitmentLevel: selectedCommitmentLevel,
          shieldProfile: activeProfile,
          taskTitle: activeGoalTitle,
        }}
        capabilities={capabilities}
      />

      {/* Shield Profile Editor Modal */}
      <ShieldProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={(data) => {
          createProfileMutation.mutate(data, {
            onSuccess: (p) => {
              setSelectedProfileId(p.id);
              setIsProfileModalOpen(false);
            },
          });
        }}
        isSaving={createProfileMutation.isPending}
      />

      {/* Emergency Exit Confirmation Modal */}
      <EmergencyExitModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onConfirm={handleEmergencyExit}
        isPending={emergencyExitMutation.isPending}
      />

      {/* Abandon Confirmation Modal (Level 1 only) */}
      {showAbandonConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white space-y-4">
            <h3 className="text-base font-bold">Abandon Focus Session?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Abandoning ends the session without logging focus minutes or awarding XP.
            </p>
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAbandonConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Keep Going
              </button>
              <button
                type="button"
                onClick={() => {
                  abandonMutation.mutate(currentSession?.id);
                  setShowAbandonConfirm(false);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-xs font-bold text-white"
              >
                Abandon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
