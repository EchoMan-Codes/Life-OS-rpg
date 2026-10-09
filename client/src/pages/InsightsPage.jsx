import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Award,
  BookOpen,
  Target,
  Plus,
  Trash2,
  Save,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import clsx from 'clsx';

import {
  useWeeklyInsights,
  useInsightTrends,
  useWeeklyReviews,
  useSaveWeeklyReview,
} from '@/features/insights/hooks';
import { spring } from '@/lib/motionVariants';

const TABS = [
  { id: 'analytics', label: 'Personal Analytics' },
  { id: 'review', label: 'Weekly Review Flow' },
  { id: 'archive', label: 'Review Archive' },
];

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState('analytics');

  // Queries
  const { data: insightsData = {}, isLoading: insightsLoading } = useWeeklyInsights();
  const { data: trendsData = {}, isLoading: trendsLoading } = useInsightTrends({ weeks: 4 });
  const { data: reviewArchive = [] } = useWeeklyReviews();

  const metrics = insightsData.metrics || {};
  const weekRange = insightsData.weekRange || {};
  const savedReview = insightsData.savedReview || null;

  // Weekly Review State
  const [wins, setWins] = useState(() => savedReview?.wins || '');
  const [blockers, setBlockers] = useState(() => savedReview?.blockers || '');
  const [lessons, setLessons] = useState(() => savedReview?.lessons || '');
  const [priorities, setPriorities] = useState(() => savedReview?.nextWeekPriorities || ['']);
  const [followUpTasks, setFollowUpTasks] = useState(['']);

  const saveReviewMutation = useSaveWeeklyReview();

  // Handle saving weekly review
  const handleSaveReview = async (e) => {
    e.preventDefault();
    await saveReviewMutation.mutateAsync({
      weekStartDate: weekRange.startDate,
      weekEndDate: weekRange.endDate,
      summary: {
        tasksCompleted: metrics.tasksCompleted,
        focusMinutes: metrics.focusMinutes,
        habitStreak: metrics.bestHabitStreak,
      },
      wins,
      blockers,
      lessons,
      nextWeekPriorities: priorities.filter((p) => p.trim()),
      followUpTasks: followUpTasks.filter((t) => t.trim()),
    });
  };

  return (
    <div className="space-y-6 pb-32 sm:pb-36 select-none">
      {/* ── Top Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingUp size={18} />
            </span>
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-ink">
              Weekly Review & Personal Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-ink-muted mt-1">
            Authoritative retrospective derived from your genuine tasks, time blocks, and deep work logs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                activeTab === tab.id
                  ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-ink shadow-xs'
                  : 'text-slate-500 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB 1: PERSONAL ANALYTICS ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Hero Metrics 4-Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Tasks Completed */}
            <div className="p-4 rounded-3xl bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono uppercase">Tasks Conquered</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-ink">
                  {metrics.tasksCompleted || 0}
                </span>
                <span
                  className={clsx(
                    'text-[11px] font-mono flex items-center font-bold',
                    (metrics.taskChangePercent || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  )}
                >
                  {(metrics.taskChangePercent || 0) >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(metrics.taskChangePercent || 0)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-ink-muted block mt-1">
                vs. {metrics.tasksCompletedPrior || 0} in prior week
              </span>
            </div>

            {/* 2. Total Focus Time */}
            <div className="p-4 rounded-3xl bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono uppercase">Focus Chamber</span>
                <Clock size={16} className="text-sky-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-ink">
                  {((metrics.focusMinutes || 0) / 60).toFixed(1)}h
                </span>
                <span
                  className={clsx(
                    'text-[11px] font-mono flex items-center font-bold',
                    (metrics.focusChangePercent || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  )}
                >
                  {(metrics.focusChangePercent || 0) >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(metrics.focusChangePercent || 0)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-ink-muted block mt-1">
                {metrics.focusSessionsCompleted || 0} completed sessions
              </span>
            </div>

            {/* 3. Habit Momentum */}
            <div className="p-4 rounded-3xl bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono uppercase">Habit Streak</span>
                <Flame size={16} className="text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-ink">
                  {metrics.bestHabitStreak || 0}d
                </span>
                <span className="text-[11px] font-mono text-amber-500 font-bold">Best</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-ink-muted block mt-1">
                across {metrics.habitsActive || 0} active habits
              </span>
            </div>

            {/* 4. Calendar Workload */}
            <div className="p-4 rounded-3xl bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono uppercase">Calendar Load</span>
                <Calendar size={16} className="text-purple-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-ink">
                  {metrics.calendarScheduledHours || 0}h
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-ink-muted block mt-1">
                {metrics.calendarEventsCount || 0} scheduled time blocks
              </span>
            </div>
          </div>

          {/* Interactive Recharts Chart: 28-Day Longitudinal Productivity Trends */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold font-display text-slate-900 dark:text-ink">
                  Longitudinal Daily Velocity (Past 4 Weeks)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-ink-muted">
                  Daily comparison of Tasks Conquered vs. Focus Minutes elapsed.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span>Tasks Done</span>
                </div>
                <div className="flex items-center gap-1.5 text-sky-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <span>Focus Mins</span>
                </div>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsData.dailyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="day"
                    tickFormatter={(val) => val.slice(5)}
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={10}
                    fontFamily="monospace"
                  />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F1117',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="focusMinutes"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#focusGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="tasksDone"
                    stroke="#6366F1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#taskGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Project Distribution Breakdown */}
          {trendsData.projectBreakdown?.length > 0 && (
            <div className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-4">
              <h3 className="text-sm font-bold font-display text-slate-900 dark:text-ink">
                Project Workload Distribution
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {trendsData.projectBreakdown.map((proj) => {
                  const pct = proj.totalTasks > 0 ? Math.round((proj.completedTasks / proj.totalTasks) * 100) : 0;
                  return (
                    <div
                      key={proj.projectName}
                      className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800 dark:text-ink">{proj.projectName}</span>
                        <span className="font-mono text-indigo-400">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>{proj.completedTasks} completed</span>
                        <span>{proj.totalTasks} total</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: WEEKLY REVIEW FLOW ── */}
      {activeTab === 'review' && (
        <form onSubmit={handleSaveReview} className="space-y-6 max-w-3xl mx-auto">
          <div className="p-6 rounded-3xl bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
              <div>
                <h2 className="text-base font-bold font-display text-slate-900 dark:text-ink">
                  Weekly Review: {weekRange.startDate} to {weekRange.endDate}
                </h2>
                <p className="text-xs text-slate-500 dark:text-ink-muted">
                  Guided retrospective flow. Take 10 minutes to consolidate learnings and calibrate your compass.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-mono font-semibold">
                WEEKLY SYNAPSE
              </span>
            </div>

            {/* Step 1: Wins */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-ink flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span>1. Wins & Breakthroughs</span>
              </label>
              <textarea
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                placeholder="What objectives did you crush? What moments created genuine momentum?"
                rows={3}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-ink placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            {/* Step 2: Blockers */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-ink flex items-center gap-1.5">
                <Clock size={14} className="text-rose-500" />
                <span>2. Friction, Missed Commitments & Blockers</span>
              </label>
              <textarea
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="Where did resistance occur? What got delayed or disrupted?"
                rows={3}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-ink placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            {/* Step 3: Lessons */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-ink flex items-center gap-1.5">
                <BookOpen size={14} className="text-sky-400" />
                <span>3. Key Strategic Insights</span>
              </label>
              <textarea
                value={lessons}
                onChange={(e) => setLessons(e.target.value)}
                placeholder="What did you learn about your energy, routines, or project priorities?"
                rows={3}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-ink placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            {/* Step 4: Next Week Priorities */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-ink flex items-center gap-1.5">
                  <Target size={14} className="text-purple-400" />
                  <span>4. Next Week Top Priorities</span>
                </label>
                <button
                  type="button"
                  onClick={() => setPriorities((prev) => [...prev, ''])}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Add Priority</span>
                </button>
              </div>

              {priorities.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const next = [...priorities];
                      next[idx] = e.target.value;
                      setPriorities(next);
                    }}
                    placeholder={`Priority ${idx + 1}`}
                    className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-ink"
                  />
                  {priorities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPriorities(priorities.filter((_, i) => i !== idx))}
                      className="p-2 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Follow-up Tasks Generation */}
            <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-ink flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Auto-Spawn Follow-Up Tasks (Into Task Queue)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setFollowUpTasks((prev) => [...prev, ''])}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Add Task</span>
                </button>
              </div>

              {followUpTasks.map((task, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={task}
                    onChange={(e) => {
                      const next = [...followUpTasks];
                      next[idx] = e.target.value;
                      setFollowUpTasks(next);
                    }}
                    placeholder={`Follow-up task title...`}
                    className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-ink"
                  />
                  {followUpTasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setFollowUpTasks(followUpTasks.filter((_, i) => i !== idx))}
                      className="p-2 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Commit Button */}
            <button
              type="submit"
              disabled={saveReviewMutation.isPending}
              className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save size={15} />
              <span>{saveReviewMutation.isPending ? 'Immortalizing Review...' : 'Immortalize Weekly Review'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 3: REVIEW ARCHIVE ── */}
      {activeTab === 'archive' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {reviewArchive.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/50 dark:bg-white/[0.01] border border-dashed border-slate-300 dark:border-white/10">
              <BookOpen size={24} className="text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-ink">No Saved Reviews Yet</h3>
              <p className="text-xs text-slate-500 dark:text-ink-muted mt-1">
                Complete your first weekly review in the "Weekly Review Flow" tab to build your repository of reflections.
              </p>
            </div>
          ) : (
            reviewArchive.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-3xl bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/5">
                  <span className="text-xs font-bold font-display text-slate-900 dark:text-ink">
                    Week: {rev.weekStartDate} to {rev.weekEndDate}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Recorded</span>
                </div>

                {rev.wins && (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">WINS</span>
                    <p className="text-xs text-slate-700 dark:text-ink-muted leading-relaxed mt-0.5">{rev.wins}</p>
                  </div>
                )}

                {rev.lessons && (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">STRATEGIC LESSONS</span>
                    <p className="text-xs text-slate-700 dark:text-ink-muted leading-relaxed mt-0.5">{rev.lessons}</p>
                  </div>
                )}

                {rev.nextWeekPriorities?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">PRIORITIES</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {rev.nextWeekPriorities.map((p, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-medium">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
