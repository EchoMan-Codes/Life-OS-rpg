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
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            onClick={onClose}
            {...backdropVariants}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            style={{
              bottom: 'var(--keyboard-inset-bottom, 0px)',
              paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
            }}
            className={clsx(
              'absolute inset-x-0',
              'bg-white/85 dark:bg-[#0B0D14]/75 backdrop-blur-3xl border-t border-white/60 dark:border-white/18',
              'shadow-[0_-12px_40px_rgba(0,0,0,0.5)]',
              'rounded-t-panel',
              'max-h-[calc(85vh-var(--keyboard-inset-bottom,0px))] overflow-y-auto transition-[bottom,max-height] duration-200',
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
