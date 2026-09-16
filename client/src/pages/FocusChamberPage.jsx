import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  CloudRain,
  Headphones,
  VolumeX,
  ArrowLeft,
  X,
  Play,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';

import {
  useCurrentFocusSession,
  useStartFocusSession,
  useCompleteFocusSession,
  useAbandonFocusSession,
  useFocusTimer,
} from '@/features/focus/hooks';
import { ambientSound } from '@/lib/ambientSound';
import { playSound } from '@/lib/sound';

const DURATION_PRESETS = [
  { seconds: 900, label: '15 min', title: 'Quick Sprint', mana: 23 },
  { seconds: 1500, label: '25 min', title: 'Pomodoro', mana: 38 },
  { seconds: 3000, label: '50 min', title: 'Deep Dive', mana: 75 },
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
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [completedResult, setCompletedResult] = useState(null);

  // Queries & Mutations
  const { data: currentSession, isLoading } = useCurrentFocusSession();
  const startMutation = useStartFocusSession();
  const completeMutation = useCompleteFocusSession();
  const abandonMutation = useAbandonFocusSession();

  // Active timer
  const timer = useFocusTimer(currentSession);

  // Handle ambient sound playback based on active session or user choice
  useEffect(() => {
    if (currentSession && !completedResult) {
      ambientSound.setTrack(currentSession.ambientSound || selectedAmbient);
    } else {
      ambientSound.setTrack('silence');
    }

    return () => {
      ambientSound.setTrack('silence');
    };
  }, [currentSession, selectedAmbient, completedResult]);

  // Start focus session
  const handleStart = async () => {
    try {
      setCompletedResult(null);
      await startMutation.mutateAsync({
        plannedDurationSeconds: selectedDuration,
        ambientSound: selectedAmbient,
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
      playSound('mana_refill');
      setCompletedResult(result);
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

  // Switch ambient audio track on the fly
  const handleTrackChange = (trackId) => {
    setSelectedAmbient(trackId);
    ambientSound.setTrack(trackId);
  };

  // SVG circular ring geometry
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - timer.progress);

  return (
    <div className="relative min-h-screen w-full bg-obsidian-950 text-obsidian-100 flex flex-col items-center justify-between p-4 md:p-8 select-none overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-azure-500/10 rounded-full blur-[140px] opacity-70" />
      </div>

      {/* Top Bar: Corner navigation and abandon button */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10">
        {!currentSession ? (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-obsidian-400 hover:text-white hover:bg-obsidian-800/60 transition-colors min-h-[44px] min-w-[44px]"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Exit Chamber</span>
          </button>
        ) : (
          <div />
        )}

        {currentSession && !completedResult && (
          <div className="relative">
            {!showAbandonConfirm ? (
              <button
                onClick={() => setShowAbandonConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-obsidian-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-medium min-h-[44px] min-w-[44px]"
              >
                <X className="w-4 h-4" />
                <span>Abandon</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-obsidian-900 border border-rose-500/30 shadow-xl">
                <span className="text-xs text-rose-300 pl-2">Abandon session?</span>
                <button
                  onClick={handleAbandon}
                  disabled={abandonMutation.isPending}
                  className="px-2.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors min-h-[36px]"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowAbandonConfirm(false)}
                  className="px-2.5 py-1.5 rounded bg-obsidian-800 hover:bg-obsidian-700 text-obsidian-300 text-xs font-medium transition-colors min-h-[36px]"
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-xl flex flex-col items-center justify-center my-auto py-6">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-12 h-12 rounded-full border-2 border-azure-400/20 border-t-azure-400 animate-spin" />
            <p className="text-sm text-obsidian-400 font-mono">Entering Focus Chamber...</p>
          </div>
        ) : completedResult ? (
          /* Completion State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center p-8 rounded-2xl bg-obsidian-900/90 border border-azure-500/30 shadow-2xl backdrop-blur-md max-w-md w-full"
          >
            <div className="w-16 h-16 rounded-full bg-azure-500/10 border border-azure-500/30 flex items-center justify-center text-azure-400 mb-4 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">Deep Work Completed</h2>
            <p className="text-sm text-obsidian-400 mb-6">
              Your mind is focused and your spirit refreshed.
            </p>

            <div className="w-full p-4 rounded-xl bg-obsidian-800/80 border border-azure-500/20 mb-6 flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-azure-400 tracking-wide uppercase">
                Mana Restored
              </span>
              <span className="text-3xl font-extrabold text-azure-300 font-mono">
                +{completedResult.manaRegenerated} MP
              </span>
              {completedResult.maxManaCapped && (
                <span className="text-xs text-amber-400/90 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Max Mana Capacity Reached
                </span>
              )}
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 px-6 rounded-xl bg-azure-600 hover:bg-azure-500 text-white font-medium shadow-lg shadow-azure-900/30 transition-all min-h-[44px]"
            >
              Return to Life OS
            </button>
          </motion.div>
        ) : currentSession ? (
          /* Active Focus Chamber Timer */
          <div className="flex flex-col items-center gap-8 w-full">
            {/* Circular Progress Ring */}
            <div className="relative flex items-center justify-center w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 320 320">
                {/* Track background */}
                <circle
                  cx="160"
                  cy="160"
                  r={radius}
                  className="stroke-obsidian-800"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Animated active progress */}
                <circle
                  cx="160"
                  cy="160"
                  r={radius}
                  className={clsx(
                    'stroke-azure-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]',
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
                <span className="text-5xl sm:text-6xl font-mono font-extrabold text-white tracking-tighter drop-shadow-md">
                  {timer.formattedTime}
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-azure-400 mt-2">
                  {timer.isFinished ? 'Ready to Complete' : 'Deep Focus'}
                </span>
                <span className="text-xs text-obsidian-400 mt-1">
                  +{Math.round((currentSession.plannedDurationSeconds / 60) * 1.5)} Max MP on completion
                </span>
              </div>
            </div>

            {/* Complete Button (active when time has elapsed) */}
            {timer.isFinished && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleComplete}
                disabled={completeMutation.isPending}
                className="w-full max-w-xs py-3.5 px-6 rounded-xl bg-azure-500 hover:bg-azure-400 text-obsidian-950 font-bold shadow-lg shadow-azure-500/30 transition-all flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Sparkles className="w-5 h-5" />
                <span>Complete & Restore Mana</span>
              </motion.button>
            )}

            {/* In-Session Ambient Sound Switcher */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-obsidian-900/80 border border-glass-border backdrop-blur-sm">
              {AMBIENT_TRACKS.map(({ id, label, icon: Icon }) => {
                const isActive = (currentSession.ambientSound || selectedAmbient) === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleTrackChange(id)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[44px]',
                      isActive
                        ? 'bg-azure-500/20 text-azure-300 border border-azure-500/30'
                        : 'text-obsidian-400 hover:text-white hover:bg-obsidian-800/40'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Pre-Session Setup Screen */
          <div className="flex flex-col items-center text-center gap-8 w-full max-w-md">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-azure-500/10 border border-azure-500/30 text-azure-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deep Work Sanctuary</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                Focus Chamber
              </h1>
              <p className="text-sm text-obsidian-300 max-w-sm">
                Enter an uninterrupted flow state. Every focused minute restores 1.5 Mana to your character.
              </p>
            </div>

            {/* Duration Preset Chips */}
            <div className="w-full flex flex-col gap-2">
              <label className="text-xs font-medium text-obsidian-400 text-left uppercase tracking-wider pl-1">
                Target Duration
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {DURATION_PRESETS.map((preset) => {
                  const isSelected = selectedDuration === preset.seconds;
                  return (
                    <button
                      key={preset.seconds}
                      type="button"
                      onClick={() => setSelectedDuration(preset.seconds)}
                      className={clsx(
                        'flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all min-h-[64px]',
                        isSelected
                          ? 'bg-azure-500/15 border-azure-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                          : 'bg-obsidian-900/60 border-glass-border text-obsidian-400 hover:border-obsidian-600 hover:text-white'
                      )}
                    >
                      <span className="text-base font-bold">{preset.label}</span>
                      <span className="text-[11px] text-azure-400/90 font-mono">
                        +{preset.mana} MP
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ambient Sound Selector */}
            <div className="w-full flex flex-col gap-2">
              <label className="text-xs font-medium text-obsidian-400 text-left uppercase tracking-wider pl-1">
                Ambient Sound
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {AMBIENT_TRACKS.map(({ id, label, icon: Icon }) => {
                  const isSelected = selectedAmbient === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedAmbient(id)}
                      className={clsx(
                        'flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all min-h-[56px]',
                        isSelected
                          ? 'bg-azure-500/15 border-azure-400 text-azure-300 shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                          : 'bg-obsidian-900/60 border-glass-border text-obsidian-400 hover:border-obsidian-600 hover:text-white'
                      )}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStart}
              disabled={startMutation.isPending}
              className="w-full py-4 px-6 rounded-xl bg-azure-500 hover:bg-azure-400 text-obsidian-950 font-extrabold text-base shadow-lg shadow-azure-500/25 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Begin Focus Session</span>
            </button>
          </div>
        )}
      </main>

      {/* Minimal Footer Info */}
      <footer className="w-full max-w-5xl flex items-center justify-center text-center text-xs text-obsidian-500 z-10">
        <span>Deep work reduces burnout. Abandoning mid-way incurs zero HP penalties.</span>
      </footer>
    </div>
  );
}
