import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Clock, Calendar, AlertCircle, X, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

import { useExtendQuest } from '@/features/quests/hooks';
import { modalPanel, spring } from '@/lib/motionVariants';

export function QuestExtendModal({ isOpen, onClose, quest }) {
  const shouldReduceMotion = useReducedMotion();
  const extendMutation = useExtendQuest();

  const [newDueDate, setNewDueDate] = useState('');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !quest) return null;

  const handleQuickAddDays = (days) => {
    const base = quest.dueDate ? new Date(quest.dueDate) : new Date();
    const target = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    setNewDueDate(target.toISOString().split('T')[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newDueDate) {
      setErrorMsg('Please select a valid new due date.');
      return;
    }

    if (quest.dueDate && new Date(newDueDate) <= new Date(quest.dueDate)) {
      setErrorMsg('New deadline must be later than the current due date.');
      return;
    }

    extendMutation.mutate(
      {
        questId: quest.id,
        newDueDate,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (err) => {
          setErrorMsg(err?.response?.data?.error?.message || 'Failed to extend quest deadline.');
        },
      }
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
          className="relative w-full max-w-md rounded-3xl bg-obsidian-900/95 border border-white/12 p-6 shadow-2xl backdrop-blur-2xl flex flex-col gap-5 text-ink"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-gold">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-ink">Extend Quest Deadline</h3>
                <p className="text-xs text-ink-muted">Graceful recovery preserving all progress</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-xl text-ink-muted hover:text-ink hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quest Banner */}
          <div className="rounded-2xl p-3.5 bg-white/[0.03] border border-white/8 flex flex-col gap-1">
            <span className="text-[11px] font-mono text-gold uppercase tracking-wider font-semibold">
              {quest.questType || quest.type || 'Quest'} · {quest.category || 'Challenge'}
            </span>
            <h4 className="text-sm font-semibold text-ink line-clamp-1">{quest.title}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-ink-muted">
              <span>Current due:</span>
              <strong className="text-ink font-mono">{quest.dueDate || 'None set'}</strong>
              {quest.status === 'expired' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  EXPIRED
                </span>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Quick Add Presets */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-ink-muted">Quick Presets</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickAddDays(3)}
                  className="py-1.5 px-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-ink cursor-pointer active:scale-95 transition-all"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddDays(7)}
                  className="py-1.5 px-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-ink cursor-pointer active:scale-95 transition-all"
                >
                  +1 Week
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddDays(14)}
                  className="py-1.5 px-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-ink cursor-pointer active:scale-95 transition-all"
                >
                  +2 Weeks
                </button>
              </div>
            </div>

            {/* Custom Due Date */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="newDueDate" className="text-xs font-semibold text-ink-muted">
                New Deadline <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="newDueDate"
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-ink text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="extendReason" className="text-xs font-semibold text-ink-muted">
                Reason for Extension (Optional)
              </label>
              <input
                id="extendReason"
                type="text"
                placeholder="e.g. Shifting schedule, recovery, complex blockers..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={extendMutation.isPending || !newDueDate}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
              >
                {extendMutation.isPending ? 'Extending...' : 'Confirm Extension'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

QuestExtendModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  quest: PropTypes.object,
};
