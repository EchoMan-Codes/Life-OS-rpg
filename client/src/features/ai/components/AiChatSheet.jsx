import PropTypes from 'prop-types';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AiChatView } from './AiChatView';

export function AiChatSheet({ isOpen, onClose }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Sheet Container */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%', opacity: 0.5 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-w-xl h-[85vh] sm:h-[720px] rounded-t-3xl sm:rounded-3xl bg-[#090714] border border-purple-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(168,85,247,0.2)] overflow-hidden flex flex-col"
          >
            {/* Grab handle for mobile */}
            <div className="w-12 h-1 rounded-full bg-white/20 mx-auto mt-2.5 sm:hidden" />
            <AiChatView isModal onClose={onClose} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

AiChatSheet.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
