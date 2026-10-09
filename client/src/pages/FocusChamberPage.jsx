import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
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
  Timer,
  Clock,
  Layers,
  BarChart3,
  Plus,
  Target,
  CheckSquare,
} from 'lucide-react';
import clsx from 'clsx';

import {
  useCurrentFocusSession,
  useStartFocusSession,
  usePauseFocusSession,
  useResumeFocusSession,
  useCompleteFocusSession,
  useAbandonFocusSession,
  useFocusSummary,
  useFocusTimer,
} from '@/features/focus/hooks';
import { useTasks, useCreateTask } from '@/features/tasks/hooks';
import { SelectDropdown } from '@/components/ui';
import { ambientSound } from '@/lib/ambientSound';
import { playSound } from '@/lib/sound';
import { spring } from '@/lib/motionVariants';

const DURATION_PRESETS = [
  { seconds: 900, label: '15m', title: 'Quick Sprint', mana: 22 },
  { seconds: 1500, label: '25m', title: 'Pomodoro', mana: 38 },
  { seconds: 3000, label: '50m', title: 'Extended Flow', mana: 75 },
  { seconds: 5400, label: '90m', title: 'Deep Immersion', mana: 135 },
];

const AMBIENT_TRACKS = [
  { id: 'silence', label: 'Silence', icon: VolumeX },
  { id: 'rain', label: 'Rain', icon: CloudRain },
  { id: 'lofi', label: 'Lo-Fi', icon: Headphones },
];

export default function FocusChamberPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  // Setup state
  const [selectedDuration, setSelectedDuration] = useState(1500);
  const [selectedAmbient, setSelectedAmbient] = useState('silence');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [isAddingQuickTask, setIsAddingQuickTask] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [completedResult, setCompletedResult] = useState(null);

  // Queries & Mutations
  const { data: currentSession } = useCurrentFocusSession();
  const { data: summary = {} } = useFocusSummary();
  const { data: activeTasks = [] } = useTasks({ status: 'active' });

  const startMutation = useStartFocusSession();
  const pauseMutation = usePauseFocusSession();
  const resumeMutation = useResumeFocusSession();
  const completeMutation = useCompleteFocusSession();
  const abandonMutation = useAbandonFocusSession();
  const createTaskMutation = useCreateTask();

  // Rich task options for link to task
  const taskOptions = useMemo(() => {
    const list = [
      {
        value: '',
        label: '✨ Free Flow Sprint (No Task Linked)',
        description: 'Unlinked deep work sprint without associating a backlog item',
        color: '#818CF8',
      },
    ];

    activeTasks.forEach((t) => {
      const pColor =
        t.priority === 'critical'
          ? '#EF4444'
          : t.priority === 'high'
          ? '#F59E0B'
          : t.priority === 'medium'
          ? '#3B82F6'
          : '#94A3B8';

      list.push({
        value: t.id,
        label: t.title,
        description: `[${t.projectName || 'General'}] • ${t.priority || 'medium'} priority`,
        color: pColor,
        badge: t.estimatedDurationMinutes ? `${t.estimatedDurationMinutes}m est` : (t.projectName || 'Task'),
      });
    });

    return list;
  }, [activeTasks]);

  const handleCreateAndLinkTask = async (e) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    try {
      const created = await createTaskMutation.mutateAsync({
        title: quickTaskTitle.trim(),
        priority: 'high',
        projectName: 'Focus Sprints',
      });
      if (created?.id) {
        setSelectedTaskId(created.id);
      }
      setQuickTaskTitle('');
      setIsAddingQuickTask(false);
    } catch (err) {
      console.error('Failed to create quick task:', err);
    }
  };

  // Active timer
  const timer = useFocusTimer(currentSession);

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

  // Start focus session
  const handleStart = async () => {
    try {
      setCompletedResult(null);
      const chosenTask = activeTasks.find((t) => t.id === selectedTaskId);
      await startMutation.mutateAsync({
        plannedDurationSeconds: selectedDuration,
        ambientSound: selectedAmbient,
        taskId: chosenTask?.id || null,
        taskTitle: chosenTask?.title || null,
      });
    } catch (err) {
      console.error('Failed to start focus session:', err);
    }
  };

  // Complete focus session
  const handleComplete = async () => {
    if (!currentSession) return;
    try {
      const result = await completeMutation.mutateAsync(currentSession.id);
      ambientSound.setTrack('silence');
      try {
        playSound('mana_refill');
      } catch {
        // Audio fallback
      }
      setCompletedResult(result || { manaRegenerated: Math.round((currentSession.plannedDurationSeconds / 60) * 1.5) });
    } catch (err) {
      console.error('Failed to complete focus session:', err);
    }
  };

  // Abandon focus session
  const handleAbandon = async () => {
    if (!currentSession) return;
    try {
      await abandonMutation.mutateAsync(currentSession.id);
      ambientSound.setTrack('silence');
      setShowAbandonConfirm(false);
    } catch (err) {
      console.error('Failed to abandon focus session:', err);
    }
  };

  const handleTrackChange = (trackId) => {
    setSelectedAmbient(trackId);
    ambientSound.setTrack(trackId);
  };

  // SVG circular ring geometry
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(1, Math.max(0, timer.progress)));

  return (
    <div className="relative min-h-[calc(100vh-6rem)] w-full text-ink flex flex-col items-center justify-between p-3 sm:p-6 md:p-8 select-none overflow-x-hidden pb-20">
      {/* ── Ambient Celestial Aura Glows (Mana Azure) ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[650px] h-[400px] sm:h-[650px] bg-sky-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-mana/10 rounded-full blur-[120px]" />
      </div>

      {/* ── Top Bar: Navigation & Action Header ── */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-4 z-10">
        {!currentSession ? (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/80 hover:bg-white border border-slate-200/80 text-slate-700 hover:text-slate-900 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/10 dark:text-ink-muted dark:hover:text-ink transition-colors min-h-[44px] text-xs font-mono font-medium shadow-xs backdrop-blur-md"
            title="Return to Dashboard"
          >
            <ArrowLeft size={14} />
            <span>DASHBOARD</span>
          </button>
        ) : (
          <div className="text-xs font-mono text-sky-600 dark:text-sky-400 uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/25 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400 animate-ping" />
            <span>
              {timer.isPaused ? 'SESSION PAUSED' : 'COGNITIVE FLOW IMMERSION'}
            </span>
          </div>
        )}

        {currentSession && !completedResult && (
          <div className="relative">
            {!showAbandonConfirm ? (
              <button
                onClick={() => setShowAbandonConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-ink-muted hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs font-mono min-h-[44px]"
              >
                <X size={14} />
                <span>ABANDON</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-obsidian-900/90 border border-red-500/30 shadow-2xl backdrop-blur-xl">
                <span className="text-xs text-red-400 pl-2 font-mono">Cancel flow?</span>
                <button
                  onClick={handleAbandon}
                  disabled={abandonMutation.isPending}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold min-h-[36px]"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowAbandonConfirm(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-ink-muted hover:text-ink text-xs min-h-[36px]"
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── Main Focus Center ── */}
      <main className="w-full max-w-lg my-auto flex flex-col items-center justify-center z-10 py-4">
        {completedResult ? (
          /* ── Completion Celebration Card ── */
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center p-6 sm:p-9 rounded-3xl bg-gradient-to-br from-obsidian-900/90 via-obsidian-900/75 to-obsidian-800/85 border border-sky-400/40 shadow-[0_16px_48px_rgba(56,189,248,0.25)] backdrop-blur-2xl w-full"
          >
            <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 mb-4 shadow-[0_0_25px_rgba(56,189,248,0.3)]">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold font-display text-ink mb-1">
              Flow State Conquered
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mb-6 max-w-sm">
              Disciplined focus maintained. Your mind sharpened, and Mana has been infused into your hero.
            </p>

            <div className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-around mb-6 backdrop-blur-md">
              <div className="text-center">
                <span className="text-[11px] font-mono text-ink-muted uppercase block">Duration</span>
                <span className="text-xl font-bold font-mono text-ink">
                  {Math.round((currentSession?.plannedDurationSeconds || selectedDuration) / 60)}m
                </span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="text-center">
                <span className="text-[11px] font-mono text-ink-muted uppercase block">Mana Restored</span>
                <span className="text-xl font-bold font-mono text-sky-400 flex items-center justify-center gap-1">
                  <Zap size={18} className="fill-current" />
                  +{completedResult?.manaRegenerated ?? Math.round(((currentSession?.plannedDurationSeconds || selectedDuration) / 60) * 1.5)} MP
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setCompletedResult(null);
                navigate('/');
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-400 to-mana text-obsidian font-bold text-sm shadow-[0_8px_24px_rgba(56,189,248,0.3)] hover:brightness-105 transition-all min-h-[46px]"
            >
              Return to Command Center
            </motion.button>
          </motion.div>
        ) : currentSession ? (
          /* ── Active Session Timer Screen ── */
          <div className="flex flex-col items-center gap-6 w-full">
            {/* Active task badge */}
            {currentSession.taskTitle && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold backdrop-blur-md">
                <Layers size={13} />
                <span className="truncate max-w-xs">{currentSession.taskTitle}</span>
              </div>
            )}

            {/* SVG Countdown Ring */}
            <div className="relative w-72 h-72 sm:w-84 sm:h-84 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
                <circle
                  cx="150"
                  cy="150"
                  r={radius}
                  className="stroke-white/[0.05]"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="150"
                  cy="150"
                  r={radius}
                  className={clsx(
                    'stroke-sky-400 drop-shadow-[0_0_16px_rgba(56,189,248,0.6)]',
                    !shouldReduceMotion && 'transition-[stroke-dashoffset] duration-1000 ease-linear'
                  )}
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>

              {/* Center digits and status */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <span className="text-5xl sm:text-6xl font-mono font-extrabold text-ink tracking-tight">
                  {timer.formattedTime}
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-sky-400 mt-2 font-mono">
                  {timer.isPaused ? 'Paused' : timer.isFinished ? 'Ready to Complete' : 'Deep Work State'}
                </span>
                <span className="text-[11px] text-ink-muted mt-1 font-mono">
                  +{Math.round((currentSession.plannedDurationSeconds / 60) * 1.5)} MP upon finish
                </span>
              </div>
            </div>

            {/* Timer Controls: Pause / Resume / Complete */}
            <div className="flex items-center gap-3">
              {!timer.isFinished && (
                <button
                  type="button"
                  onClick={() => {
                    if (timer.isPaused) resumeMutation.mutate(currentSession.id);
                    else pauseMutation.mutate(currentSession.id);
                  }}
                  disabled={pauseMutation.isPending || resumeMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-ink text-xs font-bold transition-all min-h-[44px]"
                >
                  {timer.isPaused ? (
                    <>
                      <Play size={16} className="text-emerald-400 fill-current" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause size={16} className="text-amber-400" />
                      <span>Pause</span>
                    </>
                  )}
                </button>
              )}

              {timer.isFinished && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleComplete}
                  disabled={completeMutation.isPending}
                  className="py-3 px-6 rounded-2xl bg-gradient-to-r from-sky-400 to-mana hover:brightness-110 text-obsidian font-bold shadow-[0_8px_24px_rgba(56,189,248,0.35)] transition-all flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Sparkles size={18} />
                  <span>Complete & Restore Mana</span>
                </motion.button>
              )}
            </div>

            {/* In-Session Ambient Sound Switcher */}
            <div className="p-1 rounded-full bg-obsidian-900/80 border border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] backdrop-blur-md flex items-center gap-1">
              {AMBIENT_TRACKS.map(({ id, label, icon: Icon }) => {
                const isActive = (currentSession.ambientSound || selectedAmbient) === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleTrackChange(id)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px]',
                      isActive
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-sm'
                        : 'text-ink-muted hover:text-ink hover:bg-white/5'
                    )}
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── Pre-Session Setup Cockpit Screen ── */
          <div className="flex flex-col items-center text-center gap-6 w-full">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs font-mono font-semibold">
                <Sparkles size={13} className="text-sky-400" />
                <span>COGNITIVE FLOW SANCTUM</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-ink tracking-tight font-display">
                Focus Chamber
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-ink-muted max-w-sm mx-auto leading-relaxed">
                Enter an uninterrupted sprint. Every completed minute regenerates 1.5 Mana for your hero.
              </p>
            </div>

            {/* Optional Task Link Selector with Rich Options & Quick Creation */}
            <div className="w-full text-left space-y-2">
              <div className="flex items-center justify-between pl-1">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-ink-muted flex items-center gap-1.5">
                  <Target size={13} className="text-indigo-400" />
                  <span>Link to Task (Optional)</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsAddingQuickTask((prev) => !prev)}
                  className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                >
                  <Plus size={13} />
                  <span>{isAddingQuickTask ? 'Cancel' : '+ New Task'}</span>
                </button>
              </div>

              {/* Inline Quick Task Creation Form */}
              {isAddingQuickTask && (
                <form
                  onSubmit={handleCreateAndLinkTask}
                  className="flex items-center gap-2 p-2 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-200/80 dark:border-indigo-500/30"
                >
                  <input
                    type="text"
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    placeholder="Enter task title to focus on..."
                    autoFocus
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-ink placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={createTaskMutation.isPending || !quickTaskTitle.trim()}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shrink-0 disabled:opacity-50"
                  >
                    Create & Link
                  </button>
                </form>
              )}

              {/* Dropdown with Rich Options */}
              <SelectDropdown
                value={selectedTaskId}
                onChange={setSelectedTaskId}
                options={taskOptions}
                placeholder="Choose a task backlog item to link..."
              />

              {/* Selected Task Highlight Card */}
              {activeTasks.find((t) => t.id === selectedTaskId) && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 backdrop-blur-md">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <CheckSquare size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-ink truncate">
                        {activeTasks.find((t) => t.id === selectedTaskId)?.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-ink-muted flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-indigo-400 font-semibold">
                          [{activeTasks.find((t) => t.id === selectedTaskId)?.projectName || 'General'}]
                        </span>
                        <span>•</span>
                        <span className="capitalize">{activeTasks.find((t) => t.id === selectedTaskId)?.priority} Priority</span>
                        <span>•</span>
                        <span>+25 XP upon finish</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTaskId('')}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Unlink Task"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Duration Preset Cards */}
            <div className="w-full space-y-2 text-left">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-ink-muted block pl-1">
                Sprint Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {DURATION_PRESETS.map((preset) => {
                  const isSelected = selectedDuration === preset.seconds;
                  return (
                    <motion.button
                      key={preset.seconds}
                      type="button"
                      onClick={() => setSelectedDuration(preset.seconds)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      transition={spring.snappy}
                      className={clsx(
                        'flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center min-h-[72px] shadow-xs cursor-pointer',
                        isSelected
                          ? 'bg-sky-50 dark:bg-sky-500/15 border-sky-400 text-sky-950 dark:text-ink shadow-[0_0_20px_rgba(56,189,248,0.2)] ring-2 ring-sky-400/40'
                          : 'bg-white/80 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-ink-muted hover:border-slate-300 dark:hover:border-white/20'
                      )}
                    >
                      <span className="text-base font-bold font-mono">{preset.label}</span>
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono font-semibold mt-0.5">
                        +{preset.mana} MP
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Ambient Sound Selector */}
            <div className="w-full space-y-2 text-left">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-ink-muted block pl-1">
                Ambient Soundscape
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {AMBIENT_TRACKS.map(({ id, label, icon: Icon }) => {
                  const isSelected = selectedAmbient === id;
                  return (
                    <motion.button
                      key={id}
                      type="button"
                      onClick={() => setSelectedAmbient(id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      transition={spring.snappy}
                      className={clsx(
                        'flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all min-h-[64px] shadow-xs cursor-pointer',
                        isSelected
                          ? 'bg-sky-50 dark:bg-sky-500/15 border-sky-400 text-sky-700 dark:text-sky-300 ring-2 ring-sky-400/40'
                          : 'bg-white/80 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-ink-muted hover:border-slate-300 dark:hover:border-white/20'
                      )}
                    >
                      <Icon size={16} className="mb-1" />
                      <span className="text-xs font-semibold">{label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Start Button */}
            <motion.button
              onClick={handleStart}
              disabled={startMutation.isPending}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-400 to-mana text-obsidian font-extrabold text-sm sm:text-base shadow-[0_8px_30px_rgba(56,189,248,0.35)] hover:brightness-105 transition-all flex items-center justify-center gap-2 min-h-[50px] cursor-pointer"
            >
              <Play size={18} className="fill-current" />
              <span>{startMutation.isPending ? 'Igniting Chamber...' : 'Begin Focus Session'}</span>
            </motion.button>
          </div>
        )}
      </main>

      {/* ── Focus Analytics Bottom Strip ── */}
      <footer className="w-full max-w-4xl grid grid-cols-3 gap-3 p-3 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-md">
        <div className="text-center">
          <span className="text-[10px] font-mono uppercase text-slate-400">TODAY'S FOCUS</span>
          <span className="text-sm font-bold font-mono text-slate-800 dark:text-ink block">
            {summary.todayMinutes || 0} mins
          </span>
        </div>
        <div className="text-center border-x border-slate-200/60 dark:border-white/10">
          <span className="text-[10px] font-mono uppercase text-slate-400">WEEKLY TOTAL</span>
          <span className="text-sm font-bold font-mono text-sky-400 block">
            {((summary.weekMinutes || 0) / 60).toFixed(1)} hrs
          </span>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-mono uppercase text-slate-400">COMPLETION RATE</span>
          <span className="text-sm font-bold font-mono text-emerald-400 block">
            {summary.completionRate || 100}%
          </span>
        </div>
      </footer>
    </div>
  );
}
