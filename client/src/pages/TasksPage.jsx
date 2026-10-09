import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertCircle,
  Folder,
  Tag,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit2,
  Check,
  Flame,
  Award,
  Sparkles,
  Inbox,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';

import {
  useTasks,
  useTaskSummary,
  useCreateTask,
  useUpdateTask,
  useCompleteTask,
  useUncompleteTask,
  useDeleteTask,
} from '@/features/tasks/hooks';
import { SelectDropdown } from '@/components/ui';
import { spring } from '@/lib/motionVariants';

const TABS = [
  { id: 'all', label: 'All Active' },
  { id: 'today', label: 'Due Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'completed', label: 'Completed' },
];

const PRIORITY_BADGES = {
  low: { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', label: 'Low' },
  medium: { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Medium' },
  high: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'High' },
  critical: { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Critical' },
};

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#94A3B8' },
  { value: 'medium', label: 'Medium', color: '#3B82F6' },
  { value: 'high', label: 'High', color: '#F59E0B' },
  { value: 'critical', label: 'Critical', color: '#EF4444' },
];

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('medium');
  const [quickProject, setQuickProject] = useState('General');
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  // Queries
  const { data: summary = {} } = useTaskSummary();

  const queryFilters = useMemo(() => {
    const f = {};
    if (activeTab === 'completed') f.status = 'completed';
    else if (activeTab === 'inbox') f.filterType = 'inbox';
    else if (activeTab === 'today') f.filterType = 'today';
    else if (activeTab === 'overdue') f.filterType = 'overdue';
    else if (activeTab === 'upcoming') f.filterType = 'upcoming';
    else f.status = 'active';

    if (search.trim()) f.search = search.trim();
    if (selectedProject !== 'all') f.projectName = selectedProject;
    return f;
  }, [activeTab, search, selectedProject]);

  const { data: tasks = [], isLoading } = useTasks(queryFilters);

  // Mutations
  const createMutation = useCreateTask();
  const completeMutation = useCompleteTask();
  const uncompleteMutation = useUncompleteTask();
  const deleteMutation = useDeleteTask();

  // Quick task submit
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    await createMutation.mutateAsync({
      title: quickTitle.trim(),
      priority: quickPriority,
      projectName: quickProject,
      isInbox: activeTab === 'inbox',
      dueDate: activeTab === 'today' ? new Date().toISOString() : null,
    });

    setQuickTitle('');
  };

  const toggleSubtasks = (taskId) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  return (
    <div className="space-y-6 pb-32 sm:pb-36 select-none">
      {/* ── Top Bar: Title & Stats ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckSquare size={18} />
            </span>
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-ink">
              Unified Task & Deadline Manager
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-ink-muted mt-1">
            Capture, prioritize, and conquer tasks. Every completed action awards XP & Gold to your hero.
          </p>
        </div>

        {/* Quick Metric Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <div className="px-3 py-1.5 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center gap-2 backdrop-blur-md">
            <span className="text-[11px] font-mono text-slate-400">ACTIVE</span>
            <span className="text-xs font-bold font-mono text-indigo-500">{summary.active || 0}</span>
          </div>
          <div className="px-3 py-1.5 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center gap-2 backdrop-blur-md">
            <span className="text-[11px] font-mono text-slate-400">TODAY</span>
            <span className="text-xs font-bold font-mono text-emerald-500">{summary.today || 0}</span>
          </div>
          <div className="px-3 py-1.5 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center gap-2 backdrop-blur-md">
            <span className="text-[11px] font-mono text-slate-400">OVERDUE</span>
            <span className="text-xs font-bold font-mono text-rose-500">{summary.overdue || 0}</span>
          </div>
        </div>
      </div>

      {/* ── Quick Task Capture Bar ── */}
      <form
        onSubmit={handleQuickAdd}
        className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs"
      >
        <div className="flex-1 w-full flex items-center gap-2 px-3">
          <Plus size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Quick capture task... (press Enter to commit)"
            className="w-full py-1.5 bg-transparent text-xs font-medium text-slate-800 dark:text-ink placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end px-2">
          {/* Priority selector */}
          <div className="min-w-[130px] shrink-0">
            <SelectDropdown
              size="sm"
              value={quickPriority}
              onChange={setQuickPriority}
              options={PRIORITY_OPTIONS}
            />
          </div>

          {/* Project selector */}
          <input
            type="text"
            value={quickProject}
            onChange={(e) => setQuickProject(e.target.value)}
            placeholder="Project"
            className="w-24 px-3 py-1.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 text-xs text-slate-700 dark:text-ink focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />

          <button
            type="submit"
            disabled={createMutation.isPending || !quickTitle.trim()}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors shrink-0 disabled:opacity-50"
          >
            Add Task
          </button>
        </div>
      </form>

      {/* ── Filters & Tabs Strip ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                activeTab === tab.id
                  ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-ink shadow-xs'
                  : 'text-slate-500 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink'
              )}
            >
              {tab.label}
              {tab.id === 'overdue' && summary.overdue > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 text-[10px]">
                  {summary.overdue}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Project Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-ink placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="w-36 shrink-0">
            <SelectDropdown
              size="sm"
              value={selectedProject}
              onChange={setSelectedProject}
              options={[
                { value: 'all', label: 'All Projects' },
                ...(summary.projects || []).map((p) => ({
                  value: p.name,
                  label: p.name,
                  badge: `${p.count}`,
                })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* ── Task List Cards ── */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-3xl bg-white/50 dark:bg-white/[0.01] border border-dashed border-slate-300 dark:border-white/10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
            <CheckSquare size={22} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-ink">No tasks in this view</h3>
          <p className="text-xs text-slate-500 dark:text-ink-muted mt-1 max-w-sm">
            Capture a new task above or switch views to inspect other projects and deadlines.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
            const subtasks = task.subtasks || [];
            const isExpanded = expandedTasks.has(task.id);

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  'p-3.5 sm:p-4 rounded-2xl border transition-all backdrop-blur-xl',
                  isCompleted
                    ? 'bg-slate-50/60 dark:bg-white/[0.01] border-slate-200/60 dark:border-white/5 opacity-70'
                    : 'bg-white/80 dark:bg-white/[0.03] border-slate-200/90 dark:border-white/10 shadow-xs'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Checkbox & Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => {
                        if (isCompleted) uncompleteMutation.mutate(task.id);
                        else completeMutation.mutate(task.id);
                      }}
                      disabled={completeMutation.isPending || uncompleteMutation.isPending}
                      className={clsx(
                        'w-5 h-5 rounded-lg border flex items-center justify-center mt-0.5 transition-colors shrink-0 cursor-pointer',
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-white/20 hover:border-emerald-500'
                      )}
                    >
                      {isCompleted && <Check size={13} strokeWidth={3} />}
                    </button>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={clsx(
                            'text-sm font-semibold leading-snug',
                            isCompleted ? 'line-through text-slate-400 dark:text-ink-muted' : 'text-slate-900 dark:text-ink'
                          )}
                        >
                          {task.title}
                        </span>

                        {/* Priority Badge */}
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded-md text-[10px] font-mono border uppercase',
                            PRIORITY_BADGES[task.priority]?.bg || PRIORITY_BADGES.medium.bg
                          )}
                        >
                          {task.priority}
                        </span>

                        {/* Project Tag */}
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-ink-muted text-[10px] font-mono flex items-center gap-1">
                          <Folder size={10} />
                          <span>{task.projectName}</span>
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-ink-muted leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
                        {task.dueDate && (
                          <span
                            className={clsx(
                              'flex items-center gap-1',
                              isOverdue ? 'text-rose-500 font-bold' : 'text-slate-500 dark:text-ink-muted'
                            )}
                          >
                            <Calendar size={12} />
                            <span>Due: {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            {isOverdue && <span className="uppercase text-[9px]">(Overdue)</span>}
                          </span>
                        )}

                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{task.estimatedDurationMinutes || 30}m est</span>
                        </span>

                        <span className="text-amber-500 font-semibold flex items-center gap-0.5">
                          <Sparkles size={11} />
                          <span>+{task.xpReward} XP</span>
                        </span>

                        {subtasks.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleSubtasks(task.id)}
                            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 cursor-pointer"
                          >
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            <span>{subtasks.length} Subtasks</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => deleteMutation.mutate(task.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Subtasks Accordion */}
                {isExpanded && subtasks.length > 0 && (
                  <div className="mt-3 pl-8 pr-2 pt-2 border-t border-slate-100 dark:border-white/5 space-y-1.5">
                    {subtasks.map((st) => (
                      <div key={st.id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-ink">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>{st.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
