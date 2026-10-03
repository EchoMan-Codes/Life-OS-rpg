import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Activity,
  Heart,
  Droplet,
  Moon,
  Smile,
  CheckCircle2,
  Plus,
  Dumbbell,
  Timer,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Wind,
  Award,
} from 'lucide-react';
import { useHabits, useScoreHabit } from '@/features/habits/hooks';
import { useDailies } from '@/features/dailies/hooks';
import { useReflections, useTodayReflection } from '@/features/reflections/hooks';
import { useNavigate } from 'react-router-dom';

export default function WellnessPage() {
  const navigate = useNavigate();
  const { data: habits = [] } = useHabits();
  const { data: dailies = [] } = useDailies();
  const { data: reflections = [] } = useReflections({ range: '7d' });
  const { data: todayReflection } = useTodayReflection();
  const scoreHabitMutation = useScoreHabit();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'habits' | 'fitness' | 'health' | 'review'
  const [waterGlasses, setWaterGlasses] = useState(6); // 6 * 250ml = 1.5L
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
  const [exerciseName, setExerciseName] = useState('Pull-Ups & Push-Ups');
  const [setsReps, setSetsReps] = useState('4 sets x 12 reps');

  const activeHabits = habits.filter((h) => !h.archivedAt);
  const completedDailies = dailies.filter((d) => d.completed_today || d.is_complete_today).length;
  const habitCompletionRate = dailies.length > 0 ? Math.round((completedDailies / dailies.length) * 100) : 100;

  const handleScoreHabit = async (habitId, direction) => {
    try {
      await scoreHabitMutation.mutateAsync({ habitId, direction });
    } catch {
      // handled by mutation error
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-28 md:pb-12 px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              Wellness Sanctuary
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              VITALITY & HABIT ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Habit Consistency: <span className="text-emerald-400 font-bold">{habitCompletionRate}%</span> • Active Streaks: <span className="text-amber-400 font-bold">{activeHabits.length} habits</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/reflection')}
            className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
          >
            <Moon size={14} className="text-teal-400" />
            <span>Evening Reflection</span>
          </button>
          <button
            type="button"
            onClick={() => setWorkoutModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
          >
            <Dumbbell size={15} />
            <span>Log Workout</span>
          </button>
        </div>
      </div>

      {/* ── Wellness Sub-Navigation Tabs ── */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'habits', label: 'Atomic Habits', icon: Flame },
          { id: 'fitness', label: 'Workouts & Movement', icon: Dumbbell },
          { id: 'health', label: 'Vitals & Hydration', icon: Droplet },
          { id: 'review', label: 'Reflection & Recovery', icon: Moon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Vitals Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Hydration Today</span>
              <p className="text-2xl font-black text-cyan-400 font-display">{(waterGlasses * 0.25).toFixed(1)} L</p>
              <p className="text-[10px] text-slate-400">Target: 3.0 Liters</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Sleep Recovery</span>
              <p className="text-2xl font-black text-indigo-400 font-display">7.8 hrs</p>
              <p className="text-[10px] text-slate-400">Deep rest index: 88%</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Movement & Steps</span>
              <p className="text-2xl font-black text-emerald-400 font-display">8,420</p>
              <p className="text-[10px] text-slate-400">Burned: ~410 kcal</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Recovery Score</span>
              <p className="text-2xl font-black text-teal-400 font-display">92 / 100</p>
              <p className="text-[10px] text-slate-400">Optimal training state</p>
            </div>
          </div>

          {/* Quick Water Tracker Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#091D1A] to-[#05110E] border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Droplet size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">Hydration Chamber</h3>
                <p className="text-xs text-slate-300">
                  {waterGlasses} glasses ({waterGlasses * 250} ml) logged today. Keep your brain hydrated for peak focus.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWaterGlasses((prev) => Math.max(0, prev - 1))}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center border border-white/10 cursor-pointer"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setWaterGlasses((prev) => prev + 1)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus size={14} />
                <span>+250ml Glass</span>
              </button>
            </div>
          </div>

          {/* Daily Rituals Snapshot */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold font-display text-white">Today's Daily Rituals</h2>
              <button
                type="button"
                onClick={() => navigate('/dailies')}
                className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Manage all</span>
                <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dailies.slice(0, 4).map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      {(d.completed_today || d.is_complete_today) && <CheckCircle2 size={14} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{d.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Streak: {d.streak_current || 0}d</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    +{d.reward_xp || 25} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ATOMIC HABITS ── */}
      {activeTab === 'habits' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeHabits.map((habit) => (
              <div
                key={habit.id}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between hover:border-emerald-500/30 transition-all"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white font-display">{habit.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Flame size={12} />
                      {habit.currentStreak || habit.current_streak || 0}d streak
                    </span>
                    <span>•</span>
                    <span>Best: {habit.bestStreak || habit.best_streak || 0}d</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleScoreHabit(habit.id, 'positive')}
                    className="w-9 h-9 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm cursor-pointer transition-all active:scale-95"
                    title="Score Positive"
                  >
                    +
                  </button>
                  {habit.is_negative && (
                    <button
                      type="button"
                      onClick={() => handleScoreHabit(habit.id, 'negative')}
                      className="w-9 h-9 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-sm cursor-pointer transition-all active:scale-95"
                      title="Score Negative"
                    >
                      -
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: FITNESS & WORKOUTS ── */}
      {activeTab === 'fitness' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#121A0E] to-[#0A1009] border border-emerald-500/25 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 font-bold">TODAY'S WORKOUT SPLIT</span>
              <span className="text-xs text-slate-400">Upper Body Strength</span>
            </div>
            <h3 className="text-lg font-black text-white font-display">Pull-Ups, Push-Ups & Core</h3>
            <p className="text-xs text-slate-300">
              Completed 4 progressive sets. Logged heart rate: 135 bpm. Rest intervals: 60s.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400">EXERCISE PR</span>
              <p className="text-lg font-bold text-white">Weighted Pull-Up</p>
              <p className="text-xs text-emerald-400">+15 kg x 6 reps</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400">CARDIO SPRINT</span>
              <p className="text-lg font-bold text-white">Evening Run</p>
              <p className="text-xs text-cyan-400">4.2 km • 22 mins</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono text-slate-400">REST TIMER</span>
              <p className="text-lg font-bold text-white">60 Seconds</p>
              <p className="text-xs text-indigo-400">Optimal hypertrophy</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: VITALS & HYDRATION ── */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Droplet size={18} />
                <h3 className="text-sm font-bold text-white font-display">Hydration Schedule</h3>
              </div>
              <p className="text-xs text-slate-300">
                You have consumed 1,500 ml out of your 3,000 ml daily goal.
              </p>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  style={{ width: `${Math.min(100, (waterGlasses / 12) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Wind size={18} />
                <h3 className="text-sm font-bold text-white font-display">Box Breathing (4-4-4-4)</h3>
              </div>
              <p className="text-xs text-slate-300">
                Calm the sympathetic nervous system and reset focus in 2 minutes.
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Start 2-Min Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: REFLECTION & RECOVERY ── */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-display">Today's Reflection Status</h3>
              <span className={`text-xs font-mono font-bold ${todayReflection ? 'text-emerald-400' : 'text-amber-400'}`}>
                {todayReflection ? 'COMPLETED' : 'PENDING CHECK-IN'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {todayReflection
                ? `You logged a mood score of ${todayReflection.mood_score}/5 and energy score of ${todayReflection.energy_score}/5.`
                : 'Take 2 minutes this evening to log your wins, gratitude, and prepare for tomorrow.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/reflection')}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              {todayReflection ? 'View Reflection Journal' : 'Write Evening Reflection'}
            </button>
          </div>
        </div>
      )}

      {/* ── Workout Log Modal ── */}
      <AnimatePresence>
        {workoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[#0B1510] border border-emerald-500/30 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white font-display">Log Workout Session</h3>
                <button
                  type="button"
                  onClick={() => setWorkoutModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Exercise / Movement</label>
                  <input
                    type="text"
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Sets x Reps / Distance</label>
                  <input
                    type="text"
                    value={setsReps}
                    onChange={(e) => setSetsReps(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWorkoutModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setWorkoutModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                >
                  Record Workout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
