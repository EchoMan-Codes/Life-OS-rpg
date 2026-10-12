import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, ShieldAlert, X } from 'lucide-react';
import { triggerHaptic } from '@/lib/native/nativeHaptics';

export default function EmergencyExitModal({ isOpen, onClose, onConfirm, isPending }) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    triggerHaptic('heavy');
    onConfirm();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-500/30 text-slate-900 dark:text-white shadow-2xl relative"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Emergency Exit</h3>
              <p className="text-xs text-rose-600 dark:text-rose-300/80 font-mono">Immediate Restriction Release</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            The Emergency Exit pathway is <strong>always available</strong> and guarantees immediate release of all
            device distraction restrictions. It will safely terminate your focus sprint without penalty to your character,
            though no Gold completion rewards will be granted.
          </p>

          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300/90 text-xs mb-6 space-y-1">
            <div className="flex items-center space-x-2 font-semibold">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Safety Guarantee</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Jeevan never interferes with incoming phone calls, 911/emergency communications, or system accessibility controls.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              Resume Focus
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-1.5"
            >
              <span>{isPending ? 'Releasing...' : 'Release & Exit'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

EmergencyExitModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isPending: PropTypes.bool,
};
