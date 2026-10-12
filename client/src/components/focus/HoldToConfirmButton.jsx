import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { AlertTriangle, Lock } from 'lucide-react';
import clsx from 'clsx';
import { triggerHaptic } from '@/lib/native/nativeHaptics';

export default function HoldToConfirmButton({
  onConfirm,
  holdDurationMs = 4000,
  label = 'Hold 4s to Break Commitment',
  className = '',
}) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const hasTriggeredRef = useRef(false);

  const startHold = () => {
    if (hasTriggeredRef.current) return;
    setIsHolding(true);
    startTimeRef.current = performance.now();
    triggerHaptic('light');

    const update = (now) => {
      const elapsed = now - startTimeRef.current;
      const p = Math.min(1, elapsed / holdDurationMs);
      setProgress(p);

      // Subtle pulse every second
      if (Math.floor(elapsed / 1000) > Math.floor((elapsed - 16) / 1000)) {
        triggerHaptic('medium');
      }

      if (p >= 1) {
        hasTriggeredRef.current = true;
        triggerHaptic('warning');
        setIsHolding(false);
        setProgress(1);
        onConfirm();
      } else {
        animationFrameRef.current = requestAnimationFrame(update);
      }
    };

    animationFrameRef.current = requestAnimationFrame(update);
  };

  const cancelHold = () => {
    if (hasTriggeredRef.current) return;
    setIsHolding(false);
    setProgress(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className={clsx('relative flex flex-col items-center select-none', className)}>
      <button
        type="button"
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        onTouchCancel={cancelHold}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!isHolding) startHold();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            cancelHold();
          }
        }}
        aria-label={`${label} (hold for 4 seconds)`}
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={clsx(
          'relative overflow-hidden group px-4 py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer',
          'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50 text-rose-300 active:scale-[0.98]',
          isHolding && 'ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/20'
        )}
      >
        {/* Fill bar */}
        <motion.div
          className="absolute inset-0 bg-rose-600/30 pointer-events-none"
          style={{ width: `${progress * 100}%` }}
          transition={{ ease: 'linear' }}
        />

        <div className="relative z-10 flex items-center space-x-2 text-xs font-semibold">
          {isHolding ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span>{isHolding ? `Holding... ${Math.round(progress * 100)}%` : label}</span>
        </div>
      </button>

      {isHolding && (
        <p className="mt-1.5 text-[10px] text-rose-400/80 font-mono tracking-tight animate-fade-in">
          Keep holding to confirm early exit request
        </p>
      )}
    </div>
  );
}

HoldToConfirmButton.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  holdDurationMs: PropTypes.number,
  label: PropTypes.string,
  className: PropTypes.string,
};
