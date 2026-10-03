import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RollingSectionCards } from '@/features/onboarding/components/RollingSectionCards';

/**
 * Universal Section Switcher Modal.
 *
 * Allows users from any authenticated screen to open the 3D rolling cards carousel
 * and switch seamlessly between Jeevan sections:
 * - Dashboard
 * - StudySmart
 * - Wellness
 * - Finance
 * - Goals & Planning
 * - Rewards
 * - Jeevan AI
 */
export function SectionSwitcherModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSelectSection = (section) => {
    try {
      localStorage.setItem('lifeos_selected_section', section.id);
    } catch {
      // ignore
    }
    const targetRoute = section.route || '/';
    onClose();
    navigate(targetRoute);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-2xl overflow-y-auto">
        {/* Top Control Bar */}
        <div className="fixed top-3 right-3 sm:top-5 sm:right-6 z-50 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-mono transition-colors cursor-pointer shadow-lg backdrop-blur-xl"
          >
            <X size={14} />
            <span>Close</span>
          </button>
        </div>

        {/* Rolling Section Cards Carousel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-4xl min-h-[620px] flex items-center justify-center"
        >
          <RollingSectionCards onSelectSection={handleSelectSection} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

SectionSwitcherModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
