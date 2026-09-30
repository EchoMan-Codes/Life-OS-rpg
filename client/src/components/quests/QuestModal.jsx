import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { X, Scroll, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';

import { modalPanel } from '@/lib/motionVariants';
import { useCreateQuest, useUpdateQuest } from '@/features/quests/hooks';

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const DIFFICULTIES = [
  { value: 'trivial', label: 'Trivial', xp: 10, gold: 5 },
  { value: 'easy', label: 'Easy', xp: 20, gold: 10 },
  { value: 'medium', label: 'Medium', xp: 35, gold: 18 },
  { value: 'hard', label: 'Hard', xp: 60, gold: 30 },
];

function QuestForm({ questToEdit, onClose }) {
  const createMutation = useCreateQuest();
  const updateMutation = useUpdateQuest();

  const [title, setTitle] = useState(() => questToEdit?.title || '');
  const [description, setDescription] = useState(() => questToEdit?.description || '');
  const [priority, setPriority] = useState(() => questToEdit?.priority || 'medium');
  const [difficulty, setDifficulty] = useState(() => questToEdit?.difficulty || 'medium');
  const [dueDate, setDueDate] = useState(() => questToEdit?.dueDate || '');
  const [items, setItems] = useState(() => (questToEdit?.items ? questToEdit.items.map((i) => i.title) : []));
  const [newItemInput, setNewItemInput] = useState('');
  const [error, setError] = useState(null);

  const isEditing = Boolean(questToEdit);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleAddInitialItem = (e) => {
    e.preventDefault();
    const trimmed = newItemInput.trim();
    if (!trimmed) return;
    setItems((prev) => [...prev, trimmed]);
    setNewItemInput('');
  };

  const handleRemoveInitialItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a quest title.');
      return;
    }
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      difficulty,
      dueDate: dueDate || null,
    };

    if (!isEditing) {
      payload.items = items;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ questId: questToEdit.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to save quest.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-lg bg-hp/10 border border-hp/30 text-hp text-body-sm">
          {error}
        </div>
      )}

      {/* Quest Title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="quest-title" className="text-body-sm font-semibold text-ink">
          Quest Title <span className="text-hp">*</span>
        </label>
        <input
          id="quest-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Master PostgreSQL Architecture"
          maxLength={200}
          required
          autoFocus
          className="px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-ink placeholder:text-ink-muted/40 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] focus:ring-2 focus:ring-white/10 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] transition-all text-sm"
        />
      </div>

      {/* Description / Lore */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="quest-description" className="text-xs font-semibold text-ink-muted">
          Description / Objectives
        </label>
        <textarea
          id="quest-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your quest, victory conditions, and scope..."
          rows={3}
          maxLength={2000}
          className="px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-ink placeholder:text-ink-muted/40 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] focus:ring-2 focus:ring-white/10 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] transition-all text-sm resize-none"
        />
      </div>

      {/* Priority Pills */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink-muted">Priority</label>
        <div className="grid grid-cols-4 gap-2">
          {PRIORITIES.map((p) => {
            const isSelected = priority === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={clsx(
                  'py-2 px-2 rounded-2xl text-xs font-semibold border transition-all text-center cursor-pointer active:scale-95',
                  isSelected
                    ? 'border-attr-intelligence/60 bg-attr-intelligence/20 text-attr-intelligence shadow-sm'
                    : 'border-white/10 bg-white/[0.04] text-ink-muted hover:border-white/20'
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty & Reward Preview */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink-muted">Difficulty & Reward</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DIFFICULTIES.map((d) => {
            const isSelected = difficulty === d.value;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => setDifficulty(d.value)}
                className={clsx(
                  'flex flex-col items-center p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95',
                  isSelected
                    ? 'border-gold/60 bg-gold/15 text-gold shadow-sm'
                    : 'border-white/10 bg-white/[0.04] text-ink-muted hover:border-white/20'
                )}
              >
                <span className="text-xs font-bold">{d.label}</span>
                <span className="text-[11px] opacity-80 mt-0.5 font-mono">+{d.xp} XP / +{d.gold} G</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Due Date */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="quest-due-date" className="text-xs font-semibold text-ink-muted">
          Due Date (Optional)
        </label>
        <input
          id="quest-due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-ink focus:outline-none focus:border-white/30 transition-colors text-sm backdrop-blur-md"
        />
      </div>

      {/* Initial Subtasks Checklist (Creation mode only) */}
      {!isEditing && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-ink-muted">
            Checklist Subtasks ({items.length})
          </label>

          {/* Added items list */}
          {items.length > 0 && (
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-ink backdrop-blur-md"
                >
                  <span className="truncate">{it}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInitialItem(idx)}
                    className="text-ink-muted hover:text-hp transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newItemInput}
              onChange={(e) => setNewItemInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInitialItem(e);
                }
              }}
              placeholder="Add checklist subtask..."
              className="flex-1 px-4 py-2.5 text-sm rounded-2xl bg-white/[0.04] border border-white/10 text-ink placeholder:text-ink-muted/40 focus:outline-none focus:border-white/30 backdrop-blur-md"
            />
            <button
              type="button"
              onClick={handleAddInitialItem}
              disabled={!newItemInput.trim()}
              className="px-3.5 py-2.5 text-xs font-semibold rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 text-ink disabled:opacity-40 min-h-[42px] flex items-center gap-1 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="px-4 py-2.5 text-xs font-medium text-ink-muted hover:text-ink hover:bg-white/[0.05] rounded-2xl border border-white/10 transition-colors cursor-pointer min-h-[42px]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-attr-intelligence to-cyan-400 text-obsidian-950 font-bold text-xs hover:opacity-90 shadow-md disabled:opacity-50 transition-all cursor-pointer min-h-[42px] active:scale-95"
        >
          {isPending ? 'Saving...' : isEditing ? 'Update Quest' : 'Accept Quest'}
        </button>
      </div>
    </form>
  );
}

export function QuestModal({ isOpen, onClose, questToEdit }) {
  const shouldReduceMotion = useReducedMotion();

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-obsidian-950/75 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            className="relative w-full max-w-lg rounded-3xl p-6 sm:p-7 bg-obsidian-900/90 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl z-10 max-h-[90vh] overflow-y-auto"
            variants={shouldReduceMotion ? {} : modalPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-attr-intelligence/15 border border-attr-intelligence/30 text-attr-intelligence flex items-center justify-center shadow-inner">
                  <Scroll className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-display-xs text-ink font-semibold">
                    {questToEdit ? 'Edit Quest' : 'Embark on Quest'}
                  </h2>
                  <p className="text-[11px] text-ink-muted">
                    {questToEdit ? 'Adjust your quest objectives and rewards' : 'Establish objectives, checklist subtasks, and milestones'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close quest modal"
                className="p-1.5 rounded-full text-ink-muted hover:text-ink bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <QuestForm
              key={questToEdit?.id || 'new-quest'}
              questToEdit={questToEdit}
              onClose={onClose}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

QuestModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  questToEdit: PropTypes.object,
};
