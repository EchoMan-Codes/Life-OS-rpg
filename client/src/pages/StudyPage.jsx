import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Sparkles,
  Clock,
  Play,
  CheckCircle2,
  Plus,
  Flame,
  Award,
  GraduationCap,
  Calendar,
  AlertTriangle,
  FileText,
  Target,
  ChevronRight,
  TrendingUp,
  Brain,
  Check,
} from 'lucide-react';
import { useStudyLogs, useStudySummary, useLogStudy } from '@/features/study/hooks';
import { useNavigate } from 'react-router-dom';

const DEFAULT_SUBJECTS = [
  {
    name: 'DBMS',
    progress: 68,
    color: 'from-blue-600 to-indigo-600',
    totalTopics: 18,
    completedTopics: 12,
    weakTopic: 'Normalization & BCNF',
    topics: [
      { name: 'Relational Algebra & SQL', done: true },
      { name: 'ER Diagrams & Schemas', done: true },
      { name: 'Functional Dependencies', done: true },
      { name: 'Normalization & BCNF', done: false, weak: true },
      { name: 'ACID & Concurrency Control', done: true },
      { name: 'B+ Tree Indexing & Storage', done: false },
    ],
  },
  {
    name: 'DS',
    progress: 55,
    color: 'from-purple-600 to-indigo-600',
    totalTopics: 20,
    completedTopics: 11,
    weakTopic: 'AVL & Red-Black Trees',
    topics: [
      { name: 'Arrays & Dynamic Matrices', done: true },
      { name: 'Stacks, Queues, Deques', done: true },
      { name: 'Binary Trees & Traversals', done: true },
      { name: 'AVL & Red-Black Trees', done: false, weak: true },
      { name: 'Graphs & Disjoint Sets', done: false },
      { name: 'Hashing & Collision Handling', done: true },
    ],
  },
  {
    name: 'TOC',
    progress: 35,
    color: 'from-amber-600 to-orange-600',
    totalTopics: 15,
    completedTopics: 5,
    weakTopic: 'Pumping Lemma for CFLs',
    topics: [
      { name: 'DFA & NFA Equivalence', done: true },
      { name: 'Regular Expressions & Pumping Lemma', done: true },
      { name: 'Context Free Grammars', done: false },
      { name: 'Pushdown Automata (PDA)', done: false },
      { name: 'Pumping Lemma for CFLs', done: false, weak: true },
      { name: 'Turing Machines & Undecidability', done: false },
    ],
  },
  {
    name: 'DSA',
    progress: 60,
    color: 'from-emerald-600 to-teal-600',
    totalTopics: 25,
    completedTopics: 15,
    weakTopic: 'Dynamic Programming on Trees',
    topics: [
      { name: 'Two Pointers & Sliding Window', done: true },
      { name: 'Binary Search & Monotonic Queues', done: true },
      { name: 'Backtracking & Recursion Trees', done: true },
      { name: 'Graph BFS/DFS & Topo Sort', done: true },
      { name: 'Dynamic Programming on Trees', done: false, weak: true },
      { name: 'Shortest Path (Dijkstra, Bellman-Ford)', done: false },
    ],
  },
];

const UPCOMING_EXAMS = [
  {
    name: 'GATE 2027 (Computer Science)',
    date: 'Feb 14, 2027',
    daysLeft: 345,
    targetScore: '75+ Marks',
    readiness: 64,
  },
  {
    name: 'Semester Final Examination',
    date: 'Dec 18, 2026',
    daysLeft: 76,
    targetScore: '9.2+ SGPA',
    readiness: 78,
  },
];

const SKILL_TRACKS = [
  {
    name: 'Full Stack Engineering',
    level: 'Advanced',
    progress: 80,
    tags: ['React 19', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
  },
  {
    name: 'Competitive Programming & DSA',
    level: 'Intermediate',
    progress: 62,
    tags: ['LeetCode', 'Codeforces', 'Graph Theory', 'DP'],
  },
  {
    name: 'Applied AI & Agents',
    level: 'Intermediate',
    progress: 45,
    tags: ['LLMs', 'Prompt Engineering', 'LangChain', 'Vector DBs'],
  },
];

export default function StudyPage() {
  const navigate = useNavigate();
  const { data: summary } = useStudySummary();
  const { data: logs = [] } = useStudyLogs();
  const logStudyMutation = useLogStudy();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'subjects' | 'exams' | 'skills'
  const [modalOpen, setModalOpen] = useState(false);
  const [subject, setSubject] = useState('DBMS');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');

  const handleQuickLog = async (e) => {
    e.preventDefault();
    if (!subject || !duration) return;
    await logStudyMutation.mutateAsync({
      subject,
      durationMinutes: parseInt(duration, 10),
      notes,
    });
    setModalOpen(false);
    setNotes('');
  };

  return (
    <div className="min-h-screen pt-20 pb-28 md:pb-12 px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              StudySmart
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              ACADEMIC SANCTUM
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total Study: <span className="text-white font-bold">{summary?.totalHours || '0.0'} hrs</span> • This Week: <span className="text-indigo-400 font-bold">{summary?.weekHours || '0.0'} hrs</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/focus')}
            className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
          >
            <Clock size={14} className="text-indigo-400" />
            <span>Focus Chamber</span>
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_4px_16px_rgba(99,102,241,0.35)] transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Log Study</span>
          </button>
        </div>
      </div>

      {/* ── StudySmart Sub-Navigation Tabs ── */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: BookOpen },
          { id: 'subjects', label: 'Subjects & Topics', icon: FileText },
          { id: 'exams', label: 'Exams & PYQs', icon: GraduationCap },
          { id: 'skills', label: 'Skills & Mastery', icon: Brain },
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
                  ? 'bg-indigo-600 text-white shadow-md'
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
          {/* Key Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Weekly Hours</span>
              <p className="text-2xl font-black text-white font-display">{summary?.weekHours || '0.0'} hrs</p>
              <p className="text-[10px] text-indigo-400">Target: 25.0 hrs / week</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Study Streak</span>
              <p className="text-2xl font-black text-amber-400 font-display flex items-center gap-1.5">
                <Flame size={20} />
                <span>5 Days</span>
              </p>
              <p className="text-[10px] text-slate-400">Best: 14 days</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Exam Readiness</span>
              <p className="text-2xl font-black text-emerald-400 font-display">71%</p>
              <p className="text-[10px] text-slate-400">Weighted syllabus score</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">PYQs Solved</span>
              <p className="text-2xl font-black text-cyan-400 font-display">184</p>
              <p className="text-[10px] text-slate-400">82% accuracy rate</p>
            </div>
          </div>

          {/* Weak Topics & Revision Alert Bar */}
          <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-300">Weak Topic Alert: Normalization & BCNF</p>
                <p className="text-[11px] text-slate-300">
                  Last scored lower on mock test. 1 revision sprint recommended today.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSubject('DBMS');
                setDuration('45');
                setNotes('Revision on 3NF & BCNF decomposition');
                setModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shrink-0 transition-all cursor-pointer"
            >
              Start Revision
            </button>
          </div>

          {/* Subject Progress Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold font-display text-white">Syllabus Progress</h2>
              <button
                type="button"
                onClick={() => setActiveTab('subjects')}
                className="text-[11px] font-mono text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all topics</span>
                <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEFAULT_SUBJECTS.map((sub) => (
                <div
                  key={sub.name}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white font-display">{sub.name}</span>
                      <p className="text-[10px] text-slate-400">
                        {sub.completedTopics}/{sub.totalTopics} Topics Completed
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-300">{sub.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${sub.color}`}
                      style={{ width: `${sub.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Study Sessions */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold font-display text-white">Recent Study Sprints</h2>
            {logs.length > 0 ? (
              <div className="space-y-2">
                {logs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs font-mono">
                        {log.subject?.slice(0, 3)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{log.subject}</p>
                        <p className="text-[10px] text-slate-400">
                          {log.notes || 'Focused study block'} • {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-300">
                      +{log.duration_minutes}m
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-xs text-slate-400">No study logs yet. Complete your first sprint!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: SUBJECTS & SYLLABUS ── */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_SUBJECTS.map((sub) => (
              <div
                key={sub.name}
                className="p-5 rounded-3xl bg-[#120E26]/80 border border-indigo-500/25 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-black font-display text-indigo-300">
                      {sub.name}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-display">{sub.name} Mastery</h3>
                      <p className="text-[11px] text-slate-400">
                        {sub.completedTopics} of {sub.totalTopics} chapters mastered
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold font-mono text-indigo-300">{sub.progress}%</span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                    Topic Checklist
                  </p>
                  {sub.topics.map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        t.done
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-slate-300'
                          : t.weak
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-white/[0.02] border-white/5 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                            t.done
                              ? 'bg-emerald-500 border-emerald-400 text-black font-bold'
                              : 'border-white/20'
                          }`}
                        >
                          {t.done && <Check size={10} />}
                        </div>
                        <span className={t.done ? 'line-through opacity-70' : ''}>{t.name}</span>
                      </div>
                      {t.weak && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          WEAK
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: EXAMS & PYQS ── */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {UPCOMING_EXAMS.map((exam) => (
              <div
                key={exam.name}
                className="p-5 rounded-3xl bg-gradient-to-br from-[#120E26] to-[#0A0718] border border-indigo-500/30 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={20} className="text-indigo-400" />
                    <span className="text-xs font-mono text-indigo-300 uppercase">Upcoming Exam</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {exam.daysLeft} DAYS LEFT
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white font-display">{exam.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Scheduled: {exam.date}</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-slate-400">Target Score</p>
                    <p className="text-sm font-bold text-white">{exam.targetScore}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-slate-400 text-right">Readiness</p>
                    <p className="text-sm font-bold text-emerald-400 text-right">{exam.readiness}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: SKILLS & MASTERY ── */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SKILL_TRACKS.map((skill) => (
              <div
                key={skill.name}
                className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-purple-400 font-bold">{skill.level}</span>
                  <span className="text-xs font-mono text-slate-300">{skill.progress}%</span>
                </div>
                <h3 className="text-base font-bold text-white font-display">{skill.name}</h3>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                    style={{ width: `${skill.progress}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {skill.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-300 font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Log Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[#120E26] border border-indigo-500/30 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white font-display">Log Study Sprint</h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleQuickLog} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                  >
                    <option value="DBMS">DBMS</option>
                    <option value="DS">DS</option>
                    <option value="TOC">TOC</option>
                    <option value="DSA">DSA</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                    min="5"
                    step="5"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Notes / Topic</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Normalization, B+ Trees"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
                  >
                    Record Sprint
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
