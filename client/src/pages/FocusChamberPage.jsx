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
  Zap,
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
  { seconds: 900, label: '15 min', title: 'Quick Sprint', mana: 22 },
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
  const { data: currentSession } = useCurrentFocusSession();
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

  // Switch ambient audio track on the fly
  const handleTrackChange = (trackId) => {
    setSelectedAmbient(trackId);
    ambientSound.setTrack(trackId);
  };

  // SVG circular ring geometry
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(1, Math.max(0, timer.progress)));

  return (
    <div className="relative min-h-[calc(100vh-6rem)] w-full text-ink flex flex-col items-center justify-between p-3 sm:p-6 md:p-8 select-none overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-mana/10 rounded-full blur-[100px] sm:blur-[140px] opacity-70" />
      </div>

      {/* Top Bar: Corner navigation and abandon button */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-4 z-10">
        {!currentSession ? (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 rounded-panel text-ink-muted hover:text-ink hover:bg-glass transition-colors min-h-[44px] text-xs sm:text-sm font-medium"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        ) : (
          <div className="text-xs font-mono text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-mana animate-ping" />
            <span>Session in progress</span>
          </div>
        )}

        {currentSession && !completedResult && (
          <div className="relative">
            {!showAbandonConfirm ? (
              <button
                onClick={() => setShowAbandonConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-panel text-ink-muted hover:text-hp hover:bg-hp/10 transition-colors text-xs font-medium min-h-[44px]"
              >
                <X className="w-4 h-4" />
                <span>Abandon</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 p-1.5 rounded-panel bg-obsidian-900 border border-hp/30 shadow-xl">
                <span className="text-xs text-hp pl-2">Abandon session?</span>
                <button
                  onClick={handleAbandon}
                  disabled={abandonMutation.isPending}
                  className="px-2.5 py-1.5 rounded-panel bg-hp hover:brightness-110 text-white text-xs font-semibold min-h-[36px]"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowAbandonConfirm(false)}
                  className="px-2.5 py-1.5 rounded-panel bg-obsidian-800 text-ink-muted hover:text-ink text-xs min-h-[36px]"
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Focus Center */}
      <main className="w-full max-w-md my-auto flex flex-col items-center justify-center z-10 py-4">
        {completedResult ? (
          /* Completion Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center p-6 sm:p-8 rounded-card bg-obsidian-800/90 border border-mana/40 shadow-glow backdrop-blur-xl w-full"
          >
            <div className="w-16 h-16 rounded-full bg-mana/20 border border-mana/40 flex items-center justify-center text-mana mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold font-display text-ink mb-1">
              Focus Session Complete!
            </h2>
            <p className="text-sm text-ink-muted mb-6">
              You maintained deep concentration. Mana has been infused into your spirit.
            </p>

            <div className="w-full p-4 rounded-panel bg-obsidian-900/60 border border-glass-border flex items-center justify-around mb-6">
              <div className="text-center">
                <span className="text-xs text-ink-muted block">Duration</span>
                <span className="text-lg font-bold font-mono text-ink">
                  {Math.round((currentSession?.plannedDurationSeconds || selectedDuration) / 60)}m
                </span>
              </div>
              <div className="w-[1px] h-8 bg-glass-border" />
              <div className="text-center">
                <span className="text-xs text-ink-muted block">Mana Restored</span>
                <span className="text-lg font-bold font-mono text-mana flex items-center justify-center gap-1">
                  <Zap className="w-4 h-4 fill-current" />
                  +{completedResult?.manaRegenerated ?? Math.round(((currentSession?.plannedDurationSeconds || selectedDuration) / 60) * 1.5)} MP
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setCompletedResult(null);
                navigate('/');
              }}
              className="w-full py-3 px-6 rounded-panel bg-mana text-obsidian-950 font-bold hover:brightness-110 transition-all min-h-[44px]"
            >
              Back to Command Center
            </button>
          </motion.div>
        ) : currentSession ? (
          /* Active Session Timer Screen */
          <div className="flex flex-col items-center gap-6 w-full">
            {/* SVG Countdown Ring */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
                <circle
                  cx="150"
                  cy="150"
                  r={radius}
                  className="stroke-obsidian-700/60"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="150"
                  cy="150"
                  r={radius}
                  className={clsx(
                    'stroke-mana drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]',
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
                <span className="text-4xl sm:text-6xl font-mono font-extrabold text-ink tracking-tighter">
                  {timer.formattedTime}
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-mana mt-2">
                  {timer.isFinished ? 'Ready to Complete' : 'Deep Work State'}
                </span>
                <span className="text-[11px] sm:text-xs text-ink-muted mt-1 font-mono">
                  +{Math.round((currentSession.plannedDurationSeconds / 60) * 1.5)} MP upon finish
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
                className="w-full max-w-xs py-3.5 px-6 rounded-panel bg-mana hover:brightness-110 text-obsidian-950 font-bold shadow-lg shadow-mana/30 transition-all flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Sparkles className="w-5 h-5" />
                <span>Complete & Restore Mana</span>
              </motion.button>
            )}

            {/* In-Session Ambient Sound Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-panel bg-obsidian-900/90 border border-glass-border">
              {AMBIENT_TRACKS.map(({ id, label, icon: Icon }) => {
                const isActive = (currentSession.ambientSound || selectedAmbient) === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleTrackChange(id)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-2 rounded-chip text-xs font-medium transition-colors min-h-[40px]',
                      isActive
                        ? 'bg-mana/20 text-mana border border-mana/40'
                        : 'text-ink-muted hover:text-ink hover:bg-glass'
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
          <div className="flex flex-col items-center text-center gap-6 sm:gap-7 w-full">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-chip bg-mana/10 border border-mana/30 text-mana text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deep Work Sanctuary</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight mb-2">
                Focus Chamber
              </h1>
              <p className="text-xs sm:text-sm text-ink-muted max-w-sm">
                Enter an uninterrupted flow state. Every focused minute restores 1.5 Mana to your character.
              </p>
            </div>

            {/* Duration Preset Chips */}
            <div className="w-full flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-muted text-left uppercase tracking-wider pl-1">
                Target Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DURATION_PRESETS.map((preset) => {
                  const isSelected = selectedDuration === preset.seconds;
                  return (
                    <button
                      key={preset.seconds}
                      type="button"
                      onClick={() => setSelectedDuration(preset.seconds)}
                      className={clsx(
                        'flex flex-col items-center justify-center p-3 rounded-panel border text-center transition-all min-h-[60px]',
                        isSelected
                          ? 'bg-mana/15 border-mana text-ink shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                          : 'bg-obsidian-800/80 border-glass-border text-ink-muted hover:border-obsidian-600 hover:text-ink'
                      )}
                    >
                      <span className="text-sm sm:text-base font-bold">{preset.label}</span>
                      <span className="text-[10px] sm:text-[11px] text-mana font-mono">
                        +{preset.mana} MP
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ambient Sound Selector */}
            <div className="w-full flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-muted text-left uppercase tracking-wider pl-1">
                Ambient Soundscape
              </label>
              <div className="grid grid-cols-3 gap-2">
                {AMBIENT_TRACKS.map(({ id, label, icon: Icon }) => {
                  const isSelected = selectedAmbient === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedAmbient(id)}
                      className={clsx(
                        'flex flex-col items-center justify-center p-2.5 rounded-panel border text-center transition-all min-h-[52px]',
                        isSelected
                          ? 'bg-mana/15 border-mana text-mana shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                          : 'bg-obsidian-800/80 border-glass-border text-ink-muted hover:border-obsidian-600 hover:text-ink'
                      )}
                    >
                      <Icon className="w-4 h-4 mb-1" />
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
              className="w-full py-3.5 px-6 rounded-panel bg-mana text-obsidian-950 font-extrabold text-sm sm:text-base shadow-lg shadow-mana/25 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span>{startMutation.isPending ? 'Igniting Chamber...' : 'Begin Focus Session'}</span>
            </button>
          </div>
        )}
      </main>

      {/* Minimal Footer Info */}
      <footer className="w-full max-w-4xl text-center text-[11px] text-ink-muted py-2">
        <span>Deep work replenishes Mana. Abandoning mid-way incurs zero HP penalties.</span>
      </footer>
    </div>
  );
}
