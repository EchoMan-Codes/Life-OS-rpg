import { useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

import { spring } from '@/lib/motionVariants';

/**
 * Slide-up bottom sheet for secondary actions on mobile.
 * Drag-to-dismiss via Framer Motion drag="y" + dragConstraints.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the sheet is visible
 * @param {() => void} props.onClose - Called when sheet should close
 * @param {string} [props.className] - Additional classes for the sheet body
 * @param {React.ReactNode} props.children
 */
export function Sheet({ isOpen, onClose, className, children }) {
  const shouldReduceMotion = useReducedMotion();
  const sheetRef = useRef(null);

  const handleDragEnd = useCallback(
    (_, info) => {
      // Dismiss if dragged down more than 80px or with high velocity
      if (info.offset.y > 80 || info.velocity.y > 300) {
        onClose();
      }
    },
    [onClose]
  );

  const sheetVariants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { y: '100%' },
        animate: { y: 0, transition: spring.snappy },
        exit: { y: '100%', transition: { duration: 0.2 } },
      };

  const backdropVariants = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-obsidian/70"
            onClick={onClose}
            {...backdropVariants}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            className={clsx(
              'absolute bottom-0 inset-x-0',
              'bg-obsidian-900 border-t border-glass-border',
              'rounded-t-panel',
              'max-h-[85vh] overflow-y-auto',
              className
            )}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            {...sheetVariants}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-glass-border" />
            </div>

            {/* Content */}
            <div className="px-4 pb-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
