import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Sparkles,
  Clock,
  Play,
  CheckCircle2,
  Plus,
  Flame,
  Award,
} from 'lucide-react';
import { useStudyLogs, useStudySummary, useLogStudy } from '@/features/study/hooks';
import { useNavigate } from 'react-router-dom';

const DEFAULT_SUBJECTS = [
  { name: 'DBMS', progress: 60, color: 'from-blue-600 to-indigo-600' },
  { name: 'DS', progress: 40, color: 'from-purple-600 to-indigo-600' },
  { name: 'TOC', progress: 25, color: 'from-amber-600 to-orange-600' },
  { name: 'DSA', progress: 55, color: 'from-emerald-600 to-teal-600' },
];

export default function StudyPage() {
  const navigate = useNavigate();
  const { data: summary } = useStudySummary();
  const { data: logs = [] } = useStudyLogs();
  const logStudyMutation = useLogStudy();

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
    <div className="min-h-screen pt-20 pb-28 md:pb-12 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black font-display text-white tracking-tight">
              StudySmart
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              LEARN • PRACTICE • GROW
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total Study: <span className="text-white font-bold">{summary?.totalHours || '0.0'} hrs</span> • This Week: <span className="text-indigo-400 font-bold">{summary?.weekHours || '0.0'} hrs</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_4px_16px_rgba(99,102,241,0.35)] transition-all cursor-pointer"
        >
          <Plus size={15} />
          <span>Log Study</span>
        </button>
      </div>

      {/* ── Subject Progress Grid ── */}
      <div className="space-y-2">
        <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
          Core Subjects
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DEFAULT_SUBJECTS.map((sub) => (
            <motion.div
              key={sub.name}
              whileHover={{ y: -2 }}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 space-y-2.5 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white font-display">{sub.name}</span>
                <span className="text-[10px] font-mono text-indigo-300">{sub.progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${sub.color}`}
                  style={{ width: `${sub.progress}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Focus Timer Quick Launch ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#0A071E] border border-indigo-500/30 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs text-indigo-300 font-mono uppercase tracking-wider">Deep Work Chamber</p>
            <p className="text-lg font-black font-display text-white">50:00 Sprint</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/focus')}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_4px_16px_rgba(99,102,241,0.4)] transition-all cursor-pointer"
        >
          <Play size={14} className="fill-current" />
          <span>Enter Chamber</span>
        </button>
      </div>

      {/* ── Recent Study Sessions ── */}
      <div className="space-y-3">
        <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
          Recent Study Sessions
        </p>
        {logs.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-slate-500 text-xs">
            No study sessions logged yet. Tell Jeevan AI: <span className="text-indigo-400 font-mono">&quot;I studied DBMS for 2 hours&quot;</span> or tap &apos;Log Study&apos; above!
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <BookOpen size={15} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{log.subject}</p>
                    <p className="text-[11px] text-slate-400">
                      {log.duration_minutes} minutes • {new Date(log.logged_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                  <Award size={13} />
                  <span>+{log.xp_earned} XP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Log Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-[#0F0C22] border border-indigo-500/40 p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-display">Log Study Session</h3>
            <form onSubmit={handleQuickLog} className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. DBMS, DSA, TOC"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  required
                  min="5"
                  max="600"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. ER Model revision"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={logStudyMutation.isPending}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Save & Earn XP
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
