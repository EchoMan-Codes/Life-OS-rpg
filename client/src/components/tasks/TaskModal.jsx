import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  X,
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Folder,
  Tag,
  Sparkles,
  AlertCircle,
  Flame,
} from 'lucide-react';
import clsx from 'clsx';

import { modalPanel } from '@/lib/motionVariants';
import { useCreateTask, useUpdateTask } from '@/features/tasks/hooks';
import { JeevanLoader } from '@/components/ui/JeevanLoader';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { useJeevanTransition } from '@/context/JeevanTransitionContext';

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#94A3B8' },
  { value: 'medium', label: 'Medium', color: '#3B82F6' },
  { value: 'high', label: 'High', color: '#F59E0B' },
  { value: 'critical', label: 'Critical', color: '#EF4444' },
];

const DIFFICULTIES = [
  { value: 'trivial', label: 'Trivial', xp: 10, gold: 5 },
  { value: 'easy', label: 'Easy', xp: 20, gold: 10 },
  { value: 'medium', label: 'Medium', xp: 35, gold: 18 },
  { value: 'hard', label: 'Hard', xp: 60, gold: 30 },
];

const PROJECT_SUGGESTIONS = ['General', 'Deep Work', 'Learning', 'Health', 'Career', 'Personal'];

const DURATION_PRESETS = [15, 25, 45, 60, 90, 120];

function TaskForm({ taskToEdit, onClose }) {
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const { triggerTransition } = useJeevanTransition();

  const isEditing = Boolean(taskToEdit);

  const [title, setTitle] = useState(() => taskToEdit?.title || '');
  const [description, setDescription] = useState(() => taskToEdit?.description || '');
  const [projectName, setProjectName] = useState(() => taskToEdit?.projectName || 'General');
  const [priority, setPriority] = useState(() => taskToEdit?.priority || 'medium');
  const [difficulty, setDifficulty] = useState(() => taskToEdit?.difficulty || 'medium');
  const [dueDate, setDueDate] = useState(() => {
    if (!taskToEdit?.dueDate) return '';
    return taskToEdit.dueDate.slice(0, 10);
  });
  const [scheduledTime, setScheduledTime] = useState(() => taskToEdit?.scheduledTime || '');
  const [estimatedDuration, setEstimatedDuration] = useState(() => taskToEdit?.estimatedDurationMinutes || 30);
  const [subtasks, setSubtasks] = useState(() => {
    if (taskToEdit?.subtasks && Array.isArray(taskToEdit.subtasks)) {
      return taskToEdit.subtasks.map((st) => (typeof st === 'string' ? st : st.title));
    }
    return [];
  });
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [error, setError] = useState(null);

  const isPending = createTaskMutation.isPending || updateTaskMutation.isPending;

  // Selected difficulty rewards preview
  const activeDifficulty = DIFFICULTIES.find((d) => d.value === difficulty) || DIFFICULTIES[2];

  const handleAddSubtask = (e) => {
    e?.preventDefault();
    const trimmed = newSubtaskInput.trim();
    if (!trimmed) return;
    setSubtasks((prev) => [...prev, trimmed]);
    setNewSubtaskInput('');
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuickDueDate = (type) => {
    const now = new Date();
    if (type === 'today') {
      setDueDate(now.toISOString().slice(0, 10));
    } else if (type === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().slice(0, 10));
    } else if (type === 'next-week') {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setDueDate(nextWeek.toISOString().slice(0, 10));
    } else if (type === 'clear') {
      setDueDate('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      projectName: projectName.trim() || 'General',
      priority,
      difficulty,
      dueDate: dueDate || null,
      scheduledTime: scheduledTime || null,
      estimatedDurationMinutes: Number(estimatedDuration) || 30,
      subtasks: subtasks.map((st, idx) => ({ title: st, position: idx })),
    };

    try {
      if (isEditing) {
        await updateTaskMutation.mutateAsync({ id: taskToEdit.id, data: payload });
        triggerTransition({
          variant: 'medium',
          message: 'Task Updated',
          submessage: payload.title,
          duration: 900,
        });
      } else {
        await createTaskMutation.mutateAsync(payload);
        triggerTransition({
          variant: 'medium',
          message: 'Task Enrolled',
          submessage: `+${activeDifficulty.xp} XP reward waiting`,
          duration: 1000,
        });
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to save task.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        variants={modalPanel}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-lg rounded-3xl bg-white/95 dark:bg-[#0B0D14]/95 border border-slate-200/80 dark:border-white/10 shadow-2xl backdrop-blur-2xl overflow-hidden my-auto select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <CheckSquare size={18} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-ink">
                {isEditing ? 'Edit Task' : 'New Task Protocol'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-ink-muted">
                {isEditing ? 'Update task attributes and milestones' : 'Capture an actionable objective with XP yield'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto [scrollbar-width:thin]">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-ink">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Deliver quarterly client proposal presentation"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-900 dark:text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-ink">
              Notes & Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional context, links, or execution steps..."
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Project Tag Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-ink flex items-center gap-1.5">
              <Folder size={13} className="text-indigo-500" />
              <span>Project or Domain</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {PROJECT_SUGGESTIONS.map((proj) => (
                <button
                  key={proj}
                  type="button"
                  onClick={() => setProjectName(proj)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer',
                    projectName === proj
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-ink-muted hover:bg-slate-200 dark:hover:bg-white/10'
                  )}
                >
                  {proj}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Or enter custom project name..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Priority & Difficulty Grids */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-ink">Priority</label>
              <SelectDropdown
                value={priority}
                onChange={setPriority}
                options={PRIORITIES}
                size="md"
              />
            </div>

            {/* Difficulty with live XP badge */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-ink">Difficulty</label>
                <span className="text-[10px] font-mono font-bold text-amber-500 flex items-center gap-0.5">
                  <Sparkles size={10} />
                  <span>+{activeDifficulty.xp} XP · +{activeDifficulty.gold} G</span>
                </span>
              </div>
              <SelectDropdown
                value={difficulty}
                onChange={setDifficulty}
                options={DIFFICULTIES.map((d) => ({
                  value: d.value,
                  label: `${d.label} (+${d.xp} XP)`,
                }))}
                size="md"
              />
            </div>
          </div>

          {/* Due Date & Scheduled Time */}
          <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-ink flex items-center gap-1.5">
                <Calendar size={13} className="text-indigo-500" />
                <span>Due Date & Scheduling</span>
              </label>

              {/* Quick Date Pills */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickDueDate('today')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 hover:bg-indigo-500/10 hover:text-indigo-500 text-[10px] font-mono text-slate-500 transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDueDate('tomorrow')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 hover:bg-indigo-500/10 hover:text-indigo-500 text-[10px] font-mono text-slate-500 transition-colors cursor-pointer"
                >
                  Tomorrow
                </button>
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => handleQuickDueDate('clear')}
                    className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[10px] font-mono hover:bg-rose-500/20 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-ink focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <Clock size={12} className="text-slate-400 shrink-0" />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-ink focus:outline-none"
                  placeholder="Time"
                />
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <input
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-ink focus:outline-none"
                />
                <span className="text-[10px] font-mono text-slate-400 shrink-0">min</span>
              </div>
            </div>
          </div>

          {/* Subtasks Checklist Builder */}
          <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-ink flex items-center gap-1.5">
                <CheckSquare size={13} className="text-indigo-500" />
                <span>Subtasks ({subtasks.length})</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">Optional breakdown</span>
            </div>

            {/* Subtask Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add sequential subtask..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-ink placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!newSubtaskInput.trim()}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 disabled:opacity-40 transition-all cursor-pointer shrink-0"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Subtask List */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {subtasks.map((st, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 text-xs text-slate-800 dark:text-ink"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span className="truncate">{st}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(index)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer min-w-[120px]"
            >
              {isPending ? (
                <JeevanLoader variant="micro" />
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Create Task'}</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function TaskModal({ isOpen, onClose, taskToEdit }) {
  return (
    <AnimatePresence>
      {isOpen && <TaskForm taskToEdit={taskToEdit} onClose={onClose} />}
    </AnimatePresence>
  );
}

TaskModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  taskToEdit: PropTypes.object,
};
