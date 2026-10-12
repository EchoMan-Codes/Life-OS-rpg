import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Zap,
  Coins,
  Shield,
  Layers,
  Calendar,
} from 'lucide-react';
import { useFocusSummary, useFocusHistory } from '@/features/focus/hooks';

export default function FocusAnalyticsView() {
  const { data: summary = {}, isLoading: isSummaryLoading } = useFocusSummary();
  const { data: history = [], isLoading: isHistoryLoading } = useFocusHistory({ limit: 30 });

  return (
    <div className="space-y-6">
      {/* Metric Cards Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-2">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs">
            <Clock className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <span>Today's Focus</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {summary.todayMinutes || 0}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-sans ml-1">mins</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {summary.todayCompletedSessions || 0} completed sprints
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-2">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs">
            <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>7-Day Volume</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {Math.round((summary.weekMinutes || 0) / 60 * 10) / 10}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-sans ml-1">hours</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {summary.weekCompletedSessions || 0} successful sessions
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-2">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs">
            <CheckCircle2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>Completion Rate</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {summary.completionRate ?? 100}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-sans ml-1">%</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {summary.weekInterruptedSessions || 0} interruptions this week
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-2">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs">
            <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Rewards Earned</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono flex items-center space-x-2">
            <span className="text-indigo-600 dark:text-indigo-400">+{summary.weekXp || 0} XP</span>
            <span className="text-amber-600 dark:text-amber-400 text-sm">+{summary.weekGold || 0} G</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">7-day progression total</p>
        </div>
      </div>

      {/* Task & Objective Breakdown */}
      {summary.taskBreakdown?.length > 0 && (
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>Focus Distribution by Objective</span>
          </h4>
          <div className="space-y-2">
            {summary.taskBreakdown.map((item) => (
              <div key={item.taskTitle} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-white/5 last:border-0">
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[240px]">{item.taskTitle}</span>
                <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400 font-mono">
                  <span>{item.sessions} sessions</span>
                  <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{item.minutes}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Focus History Log */}
      <div className="p-5 rounded-3xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <span>Recent Focus Sprints</span>
          </h4>
          <span className="text-[11px] text-slate-500 font-mono">{history.length} logged</span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No focus sessions logged yet. Complete your first sprint in the chamber to see your history!
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map((sess) => {
              const isCompleted = sess.status === 'completed' || sess.completed;
              const isInterrupted = sess.status === 'interrupted';
              const dateStr = new Date(sess.startedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={sess.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : isInterrupted
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        {sess.status || (isCompleted ? 'Completed' : 'Abandoned')}
                      </span>
                      {sess.commitmentLevel > 1 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                          Level {sess.commitmentLevel}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{dateStr}</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[280px]">
                      {sess.taskTitle || sess.goalDescription || 'Free Flow Sprint'}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                      {Math.round((sess.actualDurationSeconds || sess.plannedDurationSeconds) / 60)}m
                      <span className="text-[10px] text-slate-500 font-normal ml-1">
                        / {Math.round(sess.plannedDurationSeconds / 60)}m
                      </span>
                    </div>
                    {isCompleted && (
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-end space-x-1.5">
                        <span>+{sess.xpAwarded || 0} XP</span>
                        {sess.goldAwarded > 0 && <span>+{sess.goldAwarded} G</span>}
                      </div>
                    )}
                    {isInterrupted && sess.interruptionCount > 0 && (
                      <div className="text-[10px] font-mono text-rose-600/80 dark:text-rose-400/80">
                        {sess.interruptionCount} interruption{sess.interruptionCount > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

FocusAnalyticsView.propTypes = {};
