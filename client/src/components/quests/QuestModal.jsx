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
          className="px-3.5 py-2.5 rounded-lg bg-obsidian-950/60 border border-glass-border text-ink placeholder:text-ink-muted focus:outline-none focus:border-attr-intelligence transition-colors text-body-sm"
        />
      </div>

      {/* Description / Lore */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="quest-description" className="text-body-sm font-semibold text-ink">
          Description / Objectives
        </label>
        <textarea
          id="quest-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your quest, victory conditions, and scope..."
          rows={3}
          maxLength={2000}
          className="px-3.5 py-2.5 rounded-lg bg-obsidian-950/60 border border-glass-border text-ink placeholder:text-ink-muted focus:outline-none focus:border-attr-intelligence transition-colors text-body-sm resize-none"
        />
      </div>

      {/* Priority Pills */}
      <div className="flex flex-col gap-1.5">
        <label className="text-body-sm font-semibold text-ink">Priority</label>
        <div className="grid grid-cols-4 gap-2">
          {PRIORITIES.map((p) => {
            const isSelected = priority === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={clsx(
                  'py-2 px-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer',
                  isSelected
                    ? 'border-attr-intelligence bg-attr-intelligence/20 text-attr-intelligence shadow-glow'
                    : 'border-glass-border bg-obsidian-950/40 text-ink-muted hover:border-glass-border/80'
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
        <label className="text-body-sm font-semibold text-ink">Difficulty & Reward</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DIFFICULTIES.map((d) => {
            const isSelected = difficulty === d.value;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => setDifficulty(d.value)}
                className={clsx(
                  'flex flex-col items-center p-2.5 rounded-lg border transition-all cursor-pointer',
                  isSelected
                    ? 'border-gold bg-gold/15 text-gold shadow-glow'
                    : 'border-glass-border bg-obsidian-950/40 text-ink-muted hover:border-glass-border/80'
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
        <label htmlFor="quest-due-date" className="text-body-sm font-semibold text-ink">
          Due Date (Optional)
        </label>
        <input
          id="quest-due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="px-3.5 py-2.5 rounded-lg bg-obsidian-950/60 border border-glass-border text-ink focus:outline-none focus:border-attr-intelligence transition-colors text-body-sm"
        />
      </div>

      {/* Initial Subtasks Checklist (Creation mode only) */}
      {!isEditing && (
        <div className="flex flex-col gap-2">
          <label className="text-body-sm font-semibold text-ink">
            Checklist Subtasks ({items.length})
          </label>

          {/* Added items list */}
          {items.length > 0 && (
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-obsidian-950/60 border border-glass-border/40 text-xs text-ink"
                >
                  <span className="truncate">{it}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInitialItem(idx)}
                    className="text-ink-muted hover:text-hp transition-colors p-1"
                  >
                    <Trash2 className="w-3 h-3" />
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
              className="flex-1 px-3 py-2 text-body-sm rounded-lg bg-obsidian-950/60 border border-glass-border text-ink placeholder:text-ink-muted focus:outline-none focus:border-attr-intelligence"
            />
            <button
              type="button"
              onClick={handleAddInitialItem}
              disabled={!newItemInput.trim()}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-glass/20 border border-glass-border text-ink hover:bg-glass/30 disabled:opacity-40 min-h-[40px] flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-glass-border">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="px-4 py-2 text-body-sm font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer min-h-[44px]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="px-5 py-2 rounded-lg bg-attr-intelligence text-obsidian-950 font-semibold text-body-sm hover:bg-attr-intelligence/90 shadow-glow disabled:opacity-50 transition-all cursor-pointer min-h-[44px]"
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
            className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            className="relative w-full max-w-lg rounded-panel p-6 bg-obsidian-900 border border-glass-border shadow-panel backdrop-blur-glass z-10 max-h-[90vh] overflow-y-auto"
            variants={shouldReduceMotion ? {} : modalPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-glass-border mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-attr-intelligence/15 text-attr-intelligence">
                  <Scroll className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-display-sm text-ink font-semibold">
                    {questToEdit ? 'Edit Quest' : 'Embark on Quest'}
                  </h2>
                  <p className="text-xs text-ink-muted">
                    {questToEdit ? 'Adjust your quest objectives and rewards' : 'Establish objectives, checklist subtasks, and milestones'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close quest modal"
                className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-glass/10 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
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
