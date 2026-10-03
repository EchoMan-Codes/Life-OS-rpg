import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass,
  Zap,
  BookOpen,
  Flame,
  Wallet,
  Target,
  ShoppingBag,
  Bot,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useCharacter } from '@/features/character/hooks';
import { useHabits } from '@/features/habits/hooks';
import { useDailies } from '@/features/dailies/hooks';
import { useQuests } from '@/features/quests/hooks';
import { useStudySummary } from '@/features/study/hooks';
import { useFinanceSummary } from '@/features/finance/hooks';

export function GlobalCommandCenterRibbon({ onOpenAi }) {
  const navigate = useNavigate();
  const { data: character } = useCharacter();
  const { data: habits = [] } = useHabits();
  const { data: dailies = [] } = useDailies();
  const { data: quests = [] } = useQuests();
  const { data: studySummary } = useStudySummary();
  const { data: financeSummary } = useFinanceSummary();

  // ── 1. Calculate "How am I doing?" Holistic Score ──
  const { completedDailies, totalDailies, completionRate } = useMemo(() => {
    const total = dailies.length;
    const completed = dailies.filter((d) => d.completed_today || d.is_complete_today).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 100;
    return { completedDailies: completed, totalDailies: total, completionRate: rate };
  }, [dailies]);

  // ── 2. Calculate "What matters now?" ──
  const topPriorityQuest = useMemo(() => {
    const active = quests.filter((q) => q.status === 'active');
    if (!active.length) return null;
    return active.sort((a, b) => {
      if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
      if (a.priority === 'urgent') return -1;
      return 1;
    })[0];
  }, [quests]);

  const level = character?.level || 1;
  const xp = character?.xp || 0;
  const gold = character?.gold || 0;
  const totalStudyHours = studySummary?.totalHours || '0.0';
  const monthSpent = financeSummary?.totalMonth || 0;

  return (
    <section className="space-y-4 mb-6">
      {/* ── Core Command Center Answers Card ── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#130E26] via-[#0C091C] to-[#060412] border border-purple-500/25 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                GLOBAL COMMAND CENTER
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Level {level} Explorer • {gold} Coins
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight mt-1">
              Your Daily Life Command
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenAi?.() || navigate('/ai')}
              className="px-3.5 py-1.5 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Bot size={14} />
              <span>Ask Jeevan AI</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/focus')}
              className="px-3.5 py-1.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Zap size={14} />
              <span>Start Focus</span>
            </button>
          </div>
        </div>

        {/* 3 Core Questions Triad */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5">
          {/* Question 1: How am I doing? */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-mono font-bold">
              <Compass size={13} />
              <span>HOW AM I DOING?</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-display">{completionRate}%</span>
              <span className="text-xs text-slate-400">Routine execution</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {completedDailies} of {totalDailies} rituals complete • {habits.length} habits active
            </p>
          </div>

          {/* Question 2: What matters now? */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-mono font-bold">
              <AlertCircle size={13} />
              <span>WHAT MATTERS NOW?</span>
            </div>
            <div className="truncate">
              <span className="text-sm font-bold text-white font-display">
                {topPriorityQuest ? topPriorityQuest.title : 'Deep Academic Study'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {topPriorityQuest?.description || 'Maintain momentum on core subjects'}
            </p>
          </div>

          {/* Question 3: What should I do next? */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/30 space-y-1.5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-purple-300 text-xs font-mono font-bold">
              <Zap size={13} />
              <span>WHAT SHOULD I DO NEXT?</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/focus')}
              className="w-full py-1 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>Launch 25-Min Focus Sprint</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Major Life Domains Telemetry Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Ecosystem Domain Snapshots
          </p>
          <span className="text-[10px] font-mono text-purple-400">Tap card to enter section</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Domain 1: StudySmart */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => navigate('/study')}
            className="p-3.5 rounded-2xl bg-[#120E26]/80 hover:bg-[#1A1435] border border-indigo-500/25 hover:border-indigo-400/50 space-y-2 cursor-pointer transition-all shadow-md"
          >
            <div className="flex items-center justify-between text-indigo-400">
              <BookOpen size={16} />
              <span className="text-[10px] font-mono font-bold">STUDY</span>
            </div>
            <div>
              <p className="text-lg font-black text-white font-display">{totalStudyHours} hrs</p>
              <p className="text-[10px] text-slate-400">Academic sprints logged</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-indigo-300 font-mono">
              <span>View Subjects</span>
              <ArrowRight size={10} />
            </div>
          </motion.div>

          {/* Domain 2: Wellness */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => navigate('/wellness')}
            className="p-3.5 rounded-2xl bg-[#0E1F1A]/80 hover:bg-[#142B24] border border-emerald-500/25 hover:border-emerald-400/50 space-y-2 cursor-pointer transition-all shadow-md"
          >
            <div className="flex items-center justify-between text-emerald-400">
              <Flame size={16} />
              <span className="text-[10px] font-mono font-bold">WELLNESS</span>
            </div>
            <div>
              <p className="text-lg font-black text-white font-display">
                {habits.length} Habits
              </p>
              <p className="text-[10px] text-slate-400">Rituals & vital health</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-mono">
              <span>Enter Wellness</span>
              <ArrowRight size={10} />
            </div>
          </motion.div>

          {/* Domain 3: Finance */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => navigate('/finance')}
            className="p-3.5 rounded-2xl bg-[#1F180B]/80 hover:bg-[#2B210F] border border-amber-500/25 hover:border-amber-400/50 space-y-2 cursor-pointer transition-all shadow-md"
          >
            <div className="flex items-center justify-between text-amber-400">
              <Wallet size={16} />
              <span className="text-[10px] font-mono font-bold">FINANCE</span>
            </div>
            <div>
              <p className="text-lg font-black text-white font-display">₹{monthSpent.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">This month's expenses</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-amber-300 font-mono">
              <span>Manage Vault</span>
              <ArrowRight size={10} />
            </div>
          </motion.div>

          {/* Domain 4: Goals & Planning */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => navigate('/goals')}
            className="p-3.5 rounded-2xl bg-[#200E1C]/80 hover:bg-[#2C1327] border border-pink-500/25 hover:border-pink-400/50 space-y-2 cursor-pointer transition-all shadow-md"
          >
            <div className="flex items-center justify-between text-pink-400">
              <Target size={16} />
              <span className="text-[10px] font-mono font-bold">GOALS</span>
            </div>
            <div>
              <p className="text-lg font-black text-white font-display">{quests.length} Quests</p>
              <p className="text-[10px] text-slate-400">Roadmap milestones</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-pink-300 font-mono">
              <span>Plan Roadmap</span>
              <ArrowRight size={10} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Intelligent Quick Actions Bar ── */}
      <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 shrink-0">
          Quick Actions:
        </span>
        <button
          type="button"
          onClick={() => navigate('/goals')}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus size={13} className="text-pink-400" />
          <span>Add Task</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/study')}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus size={13} className="text-indigo-400" />
          <span>Log Study</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/finance')}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus size={13} className="text-amber-400" />
          <span>Add Expense</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/wellness')}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus size={13} className="text-emerald-400" />
          <span>Log Workout</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/habits')}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Flame size={13} className="text-orange-400" />
          <span>Score Habit</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <ShoppingBag size={13} className="text-yellow-400" />
          <span>Reward Shop</span>
        </button>
      </div>
    </section>
  );
}
