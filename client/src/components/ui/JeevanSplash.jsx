import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { JeevanLogo } from './JeevanLogo';

/**
 * JeevanSplash
 * Branded launch screen shown while verifying/restoring session.
 * Features an atmospheric cosmic backdrop, glowing emblem, and smooth resolution.
 */
export function JeevanSplash({ message = 'Restoring Hero Session...', onFinished }) {
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(timer);
          return 95;
        }
        return prev + 18;
      });
    }, 180);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-[#07080C] text-white selection:bg-purple-600 select-none overflow-hidden"
    >
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-purple-900/20 via-indigo-800/15 to-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 left-1/3 w-[450px] h-[450px] bg-indigo-950/20 rounded-full blur-[140px]" />
      </div>

      {/* Top subtle spacing */}
      <div className="w-full flex justify-center pt-4 relative z-10">
        <div className="h-1 w-12 rounded-full bg-white/10" />
      </div>

      {/* Central Branding & Emblem */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6 -mt-8">
        {/* Glowing aura ring */}
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.12, 1],
              opacity: [0.35, 0.65, 0.35],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-500/25 to-purple-600/30 blur-xl"
          />

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="relative"
          >
            <JeevanLogo variant="emblem" size="lg" />
          </motion.div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1.5">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white"
          >
            JEEVAN
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="text-xs font-mono tracking-widest text-slate-400 uppercase font-medium"
          >
            Personal Life Operating System
          </motion.p>
        </div>

        {/* Dynamic Status & Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="w-56 space-y-2 pt-2"
        >
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-400 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.2 }}
            />
          </div>
          <p className="text-[11px] font-mono text-slate-400/80 animate-pulse">
            {message}
          </p>
        </motion.div>
      </div>

      {/* Bottom Footer Philosophy */}
      <div className="relative z-10 pb-4 text-center">
        <p className="text-[11px] font-mono text-slate-500">
          Live. Track. Grow.
        </p>
      </div>
    </motion.div>
  );
}

JeevanSplash.propTypes = {
  message: PropTypes.string,
  onFinished: PropTypes.func,
};
