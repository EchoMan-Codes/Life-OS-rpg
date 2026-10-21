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
  LayoutGrid,
  List,
  ArrowUpDown,
  Coins,
  CheckCircle2,
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
import { TaskModal } from '@/components/tasks';
import { SelectDropdown } from '@/components/ui';
import { JeevanLoader } from '@/components/ui/JeevanLoader';
import { useFloatingText } from '@/features/character/floatingText';
import { playSound } from '@/lib/sound';
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
  low: { bg: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20', label: 'Low' },
  medium: { bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', label: 'Medium' },
  high: { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', label: 'High' },
  critical: { bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', label: 'Critical' },
};

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#94A3B8' },
  { value: 'medium', label: 'Medium', color: '#3B82F6' },
  { value: 'high', label: 'High', color: '#F59E0B' },
  { value: 'critical', label: 'Critical', color: '#EF4444' },
];

const SORT_OPTIONS = [
  { value: 'dueDate', label: 'Sort: Due Date' },
  { value: 'priority', label: 'Sort: Priority' },
  { value: 'xp', label: 'Sort: XP Reward' },
  { value: 'title', label: 'Sort: Title (A-Z)' },
];

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'board'
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  // Modal State
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // Quick Capture State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('medium');
  const [quickProject, setQuickProject] = useState('General');

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

  const { data: rawTasks = [], isLoading, isError } = useTasks(queryFilters);

  // Sorting
  const sortedTasks = useMemo(() => {
    return [...rawTasks].sort((a, b) => {
      if (sortBy === 'priority') {
        const pA = PRIORITY_ORDER[a.priority] ?? 2;
        const pB = PRIORITY_ORDER[b.priority] ?? 2;
        if (pA !== pB) return pA - pB;
      } else if (sortBy === 'xp') {
        const xA = a.xpReward || 0;
        const xB = b.xpReward || 0;
        if (xA !== xB) return xB - xA;
      } else if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }

      // Default: Due date (earliest first, nulls at bottom)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  }, [rawTasks, sortBy]);

  // Board columns organized by Priority for board view
  const boardColumns = useMemo(() => {
    const critical = sortedTasks.filter((t) => t.priority === 'critical');
    const high = sortedTasks.filter((t) => t.priority === 'high');
    const medium = sortedTasks.filter((t) => t.priority === 'medium');
    const low = sortedTasks.filter((t) => t.priority === 'low');
    return [
      { id: 'critical', title: 'Critical Urgency', color: 'text-rose-500 border-rose-500/20 bg-rose-500/10', items: critical },
      { id: 'high', title: 'High Priority', color: 'text-amber-500 border-amber-500/20 bg-amber-500/10', items: high },
      { id: 'medium', title: 'Medium Priority', color: 'text-blue-500 border-blue-500/20 bg-blue-500/10', items: medium },
      { id: 'low', title: 'Low / Backlog', color: 'text-slate-500 border-slate-500/20 bg-slate-500/10', items: low },
    ];
  }, [sortedTasks]);

  // Mutations
  const createMutation = useCreateTask();
  const completeMutation = useCompleteTask();
  const uncompleteMutation = useUncompleteTask();
  const deleteMutation = useDeleteTask();
  const { spawnFloatingText } = useFloatingText();

  // Quick task submit
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    await createMutation.mutateAsync({
      title: quickTitle.trim(),
      priority: quickPriority,
      projectName: quickProject.trim() || 'General',
      isInbox: activeTab === 'inbox',
      dueDate: activeTab === 'today' ? new Date().toISOString().slice(0, 10) : null,
    });

    setQuickTitle('');
  };

  const handleToggleTask = (task) => {
    const isCompleted = task.status === 'completed';
    if (isCompleted) {
      playSound('daily_undo');
      uncompleteMutation.mutate(task.id);
    } else {
      playSound('daily_complete');
      spawnFloatingText(`+${task.xpReward} XP`, 'xp');
      if (task.goldReward > 0) {
        setTimeout(() => spawnFloatingText(`+${task.goldReward} Gold`, 'gold'), 120);
      }
      completeMutation.mutate(task.id);
    }
  };

  const toggleSubtasks = (taskId) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleOpenEdit = (task) => {
    setTaskToEdit(task);
    setTaskModalOpen(true);
  };

  const handleOpenCreate = () => {
    setTaskToEdit(null);
    setTaskModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-32 sm:pb-36 select-none max-w-6xl mx-auto">
      {/* ── 1. Header Cockpit & Metrics Strip ── */}
      <section className="relative rounded-3xl p-5 sm:p-7 bg-white/50 dark:bg-white/[0.035] border border-slate-200/80 dark:border-white/12 shadow-[0_10px_35px_rgba(0,0,0,0.03)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-2xl overflow-hidden">
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-24 -left-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-semibold">
              <CheckSquare size={13} className="text-emerald-500" />
              <span>UNIFIED TASK & DEADLINE COMMAND</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-ink tracking-tight font-display">
              Tasks & Objectives
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-ink-muted leading-relaxed max-w-xl">
              Capture, schedule, and execute individual milestones. Every completed task directly awards XP and Gold to fuel your RPG character progression.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              onClick={handleOpenCreate}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={spring.snappy}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-[0_8px_24px_rgba(16,185,129,0.25)] transition-all cursor-pointer min-h-[46px]"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>New Task</span>
            </motion.button>
          </div>
        </div>
      </section>

      {/* ── 2. Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-obsidian-900/60 border border-slate-200/80 dark:border-glass-border flex flex-col shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-ink-muted font-medium">
            <span>Active Queue</span>
            <CheckSquare size={14} className="text-indigo-500" />
          </div>
          <span className="text-2xl text-slate-900 dark:text-ink font-bold mt-1.5 font-display">
            {summary.active || 0}
          </span>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5">Tasks awaiting action</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-obsidian-900/60 border border-slate-200/80 dark:border-glass-border flex flex-col shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span>Due Today</span>
            <Calendar size={14} className="text-emerald-500" />
          </div>
          <span className="text-2xl text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 font-display">
            {summary.today || 0}
          </span>
          <span className="text-[10px] font-mono text-emerald-500/70 mt-0.5">Focus for today</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-obsidian-900/60 border border-slate-200/80 dark:border-glass-border flex flex-col shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-medium">
            <span>Overdue</span>
            <AlertTriangle size={14} className="text-rose-500" />
          </div>
          <span className="text-2xl text-rose-600 dark:text-rose-400 font-bold mt-1.5 font-display flex items-center gap-2">
            <span>{summary.overdue || 0}</span>
            {summary.overdue > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
          </span>
          <span className="text-[10px] font-mono text-rose-500/70 mt-0.5">Requires immediate attention</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-obsidian-900/60 border border-slate-200/80 dark:border-glass-border flex flex-col shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
            <span>Completed</span>
            <Sparkles size={14} className="text-amber-500" />
          </div>
          <span className="text-2xl text-amber-600 dark:text-amber-400 font-bold mt-1.5 font-display">
            {summary.completed || 0}
          </span>
          <span className="text-[10px] font-mono text-amber-500/70 mt-0.5">Conquered tasks</span>
        </div>
      </div>

      {/* ── 3. Quick Task Capture Bar ── */}
      <form
        onSubmit={handleQuickAdd}
        className="flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-2xl bg-white/80 dark:bg-white/[0.035] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs"
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
          <div className="min-w-[120px] shrink-0">
            <SelectDropdown
              size="sm"
              value={quickPriority}
              onChange={setQuickPriority}
              options={PRIORITY_OPTIONS}
            />
          </div>

          {/* Project input */}
          <input
            type="text"
            value={quickProject}
            onChange={(e) => setQuickProject(e.target.value)}
            placeholder="Project"
            className="w-24 px-3 py-1.5 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-ink focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />

          <button
            type="submit"
            disabled={createMutation.isPending || !quickTitle.trim()}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer min-h-[34px]"
          >
            Add Task
          </button>
        </div>
      </form>

      {/* ── 4. Filters & Controls Strip ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-1 border-b border-slate-200/80 dark:border-glass-border/40">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-2xl bg-slate-100 dark:bg-obsidian-950/60 border border-slate-200/80 dark:border-glass-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[34px]',
                activeTab === tab.id
                  ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-ink shadow-xs font-bold'
                  : 'text-slate-500 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink'
              )}
            >
              {tab.label}
              {tab.id === 'overdue' && summary.overdue > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-500 text-[10px] font-mono">
                  {summary.overdue}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right Search, Project Filter & View Switcher */}
        <div className="flex flex-wrap items-center gap-2 justify-between md:justify-end">
          {/* Search */}
          <div className="relative w-36 sm:w-44">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-ink placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Project Filter */}
          <div className="w-32 shrink-0">
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

          {/* Sort Dropdown */}
          <div className="w-36 shrink-0">
            <SelectDropdown
              size="sm"
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS}
            />
          </div>

          {/* View Mode Toggle: List vs Board */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-obsidian-950/60 border border-slate-200/80 dark:border-glass-border shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[32px]',
                viewMode === 'list'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink'
              )}
            >
              <List size={14} />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('board')}
              aria-label="Board view"
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[32px]',
                viewMode === 'board'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink'
              )}
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Board</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. Tasks Content ── */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center">
          <JeevanLoader
            variant="medium"
            message="Loading Tasks & Deadlines..."
            submessage="Synchronizing priorities"
          />
        </div>
      ) : isError ? (
        <div className="p-6 text-center text-red-500 text-sm rounded-2xl bg-red-500/10 border border-red-500/20">
          Failed to load tasks. Please check your connection.
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 sm:p-16 rounded-3xl bg-white/70 dark:bg-obsidian-900/60 border border-dashed border-slate-300 dark:border-glass-border text-center backdrop-blur-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckSquare size={26} />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-ink">No tasks found in this view</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-ink-muted max-w-sm mx-auto leading-relaxed">
            Capture a new task above or switch views to inspect other projects and deadlines.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Create First Task
          </button>
        </div>
      ) : viewMode === 'board' ? (
        /* ── Kanban Board View by Priority ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {boardColumns.map((col) => (
            <div
              key={col.id}
              className="flex flex-col gap-3 rounded-2xl p-3.5 bg-slate-100/70 dark:bg-obsidian-950/40 border border-slate-200/80 dark:border-glass-border/40 backdrop-blur-xl shadow-xs"
            >
              <div className="flex items-center justify-between px-1 py-1">
                <span className={clsx('text-xs font-bold uppercase tracking-wider', col.color.split(' ')[0])}>
                  {col.title}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-white dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-ink-muted">
                  {col.items.length}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 min-h-[120px]">
                {col.items.map((task) => (
                  <TaskCardItem
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggleTask(task)}
                    onEdit={() => handleOpenEdit(task)}
                    onDelete={() => deleteMutation.mutate(task.id)}
                    isExpanded={expandedTasks.has(task.id)}
                    onToggleExpand={() => toggleSubtasks(task.id)}
                    isPending={completeMutation.isPending || uncompleteMutation.isPending}
                  />
                ))}
                {col.items.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-ink-muted italic border border-dashed border-slate-200 dark:border-glass-border/30 rounded-xl">
                    No tasks in this lane
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── List View ── */
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {sortedTasks.map((task) => (
              <TaskCardItem
                key={task.id}
                task={task}
                onToggle={() => handleToggleTask(task)}
                onEdit={() => handleOpenEdit(task)}
                onDelete={() => deleteMutation.mutate(task.id)}
                isExpanded={expandedTasks.has(task.id)}
                onToggleExpand={() => toggleSubtasks(task.id)}
                isPending={completeMutation.isPending || uncompleteMutation.isPending}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}

function TaskCardItem({ task, onToggle, onEdit, onDelete, isExpanded, onToggleExpand, isPending }) {
  const isCompleted = task.status === 'completed';
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
  const subtasks = task.subtasks || [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={clsx(
        'p-3.5 sm:p-4 rounded-2xl border transition-all backdrop-blur-xl group',
        isCompleted
          ? 'bg-slate-50/70 dark:bg-white/[0.015] border-slate-200/60 dark:border-white/5 opacity-70'
          : 'bg-white/80 dark:bg-white/[0.035] border-slate-200/90 dark:border-white/10 shadow-xs hover:border-slate-300 dark:hover:border-white/20'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Checkbox & Info */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onToggle}
            disabled={isPending}
            aria-label={isCompleted ? `Mark ${task.title} as active` : `Complete ${task.title}`}
            className={clsx(
              'w-5 h-5 rounded-lg border flex items-center justify-center mt-0.5 transition-colors shrink-0 cursor-pointer',
              isCompleted
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-slate-300 dark:border-white/20 hover:border-emerald-500 hover:bg-emerald-500/10'
            )}
          >
            {isCompleted && <Check size={13} strokeWidth={3} />}
          </button>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span
                className={clsx(
                  'text-sm font-semibold leading-snug break-words',
                  isCompleted ? 'line-through text-slate-400 dark:text-ink-muted' : 'text-slate-900 dark:text-ink'
                )}
              >
                {task.title}
              </span>

              {/* Priority Badge */}
              <span
                className={clsx(
                  'px-2 py-0.5 rounded-md text-[10px] font-mono border uppercase tracking-wider',
                  PRIORITY_BADGES[task.priority]?.bg || PRIORITY_BADGES.medium.bg
                )}
              >
                {task.priority}
              </span>

              {/* Project Tag */}
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-ink-muted text-[10px] font-mono flex items-center gap-1">
                <Folder size={10} className="text-slate-400" />
                <span>{task.projectName || 'General'}</span>
              </span>
            </div>

            {task.description && (
              <p className="text-xs text-slate-500 dark:text-ink-muted leading-relaxed line-clamp-2">
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
                  <span>Due: {task.dueDate.slice(0, 10)}</span>
                  {isOverdue && <span className="uppercase text-[9px]">(Overdue)</span>}
                </span>
              )}

              <span className="flex items-center gap-1 text-slate-500 dark:text-ink-muted">
                <Clock size={12} />
                <span>{task.estimatedDurationMinutes || 30}m</span>
              </span>

              <span className="text-amber-500 font-semibold flex items-center gap-0.5">
                <Sparkles size={11} />
                <span>+{task.xpReward} XP · +{task.goldReward} G</span>
              </span>

              {subtasks.length > 0 && (
                <button
                  type="button"
                  onClick={onToggleExpand}
                  className="flex items-center gap-1 text-indigo-500 hover:text-indigo-400 font-semibold cursor-pointer"
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
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Edit Task"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Delete Task"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Subtasks Accordion */}
      {isExpanded && subtasks.length > 0 && (
        <div className="mt-3 pl-8 pr-2 pt-2 border-t border-slate-100 dark:border-white/5 space-y-1.5">
          {subtasks.map((st, idx) => (
            <div key={st.id || idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-ink">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>{typeof st === 'string' ? st : st.title}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
