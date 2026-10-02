import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Sun, Moon, Plus, X, ArrowRight, ArrowLeft, Clock } from 'lucide-react';
import clsx from 'clsx';

/**
 * Step 3: Typical Day Schedule & Commitments
 * "⏰ What does your typical day look like?"
 */
export function Step3Schedule({
  wakeTime = '06:00 AM',
  sleepTime = '11:15 PM',
  commitments = [],
  onUpdateWake,
  onUpdateSleep,
  onAddCommitment,
  onRemoveCommitment,
  onNext,
  onBack,
}) {
  const safeCommitments = Array.isArray(commitments) ? commitments : [];
  const [newCommitment, setNewCommitment] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (newCommitment.trim()) {
      onAddCommitment(newCommitment.trim());
      setNewCommitment('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
          What does your typical day look like?
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Set your routine so we can create better plans for you.
        </p>
      </div>

      {/* Routine Cards (Wake & Sleep) */}
      <div className="space-y-2.5">
        {/* Wake Up Time */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Sun size={16} />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-white">
              Wake up time
            </span>
          </div>

          <input
            type="text"
            value={wakeTime}
            onChange={(e) => onUpdateWake(e.target.value)}
            className="w-28 text-center px-2 py-1 rounded-xl bg-white/[0.06] border border-white/15 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Sleep Time */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Moon size={16} />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-white">
              Sleep time
            </span>
          </div>

          <input
            type="text"
            value={sleepTime}
            onChange={(e) => onUpdateSleep(e.target.value)}
            className="w-28 text-center px-2 py-1 rounded-xl bg-white/[0.06] border border-white/15 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Commitments Section */}
      <div className="space-y-2 pt-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-display">
          Your commitments
        </label>

        {/* Commitments Tag Pills */}
        <div className="flex flex-wrap gap-2">
          {safeCommitments.map((item, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-medium"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => onRemoveCommitment(idx)}
                className="text-purple-400 hover:text-white p-0.5 rounded-full"
                title="Remove"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {/* Add Commitment Button / Inline Form */}
          {isAdding ? (
            <form onSubmit={handleAddSubmit} className="flex items-center gap-1">
              <input
                type="text"
                value={newCommitment}
                onChange={(e) => setNewCommitment(e.target.value)}
                placeholder="e.g. Job (9 AM - 5 PM)"
                className="px-3 py-1 text-xs rounded-xl bg-white/[0.06] border border-white/20 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-2.5 py-1 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-500"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Add another</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <span>Next</span>
          <ArrowRight size={14} />
        </motion.button>
      </div>
    </div>
  );
}

Step3Schedule.propTypes = {
  wakeTime: PropTypes.string,
  sleepTime: PropTypes.string,
  commitments: PropTypes.arrayOf(PropTypes.string),
  onUpdateWake: PropTypes.func.isRequired,
  onUpdateSleep: PropTypes.func.isRequired,
  onAddCommitment: PropTypes.func.isRequired,
  onRemoveCommitment: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};
