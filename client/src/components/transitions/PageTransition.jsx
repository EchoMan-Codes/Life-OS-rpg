import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { useNavigationTransition } from '@/hooks/useNavigationTransition';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { pageTransitionVariants } from '@/lib/pageTransitionVariants';

/**
 * PageTransition — Canonical spatial transition wrapper.
 * Applies directional physical motion, spatial depth, and safe-area margins.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Page component tree
 * @param {'siblingSlide'|'deepenPush'|'lateralCalm'|'none'} [props.variant] - Explicit variant override
 * @param {'forward'|'back'} [props.direction] - Explicit direction override
 * @param {string} [props.className]
 */
export function PageTransition({ children, variant: explicitVariant, direction: explicitDirection, className }) {
  const containerRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [isAnimating, setIsAnimating] = useState(true);

  const transitionContext = useNavigationTransition();
  const activeVariant = explicitVariant || transitionContext.variant || 'none';
  const activeDirection = explicitDirection || transitionContext.direction || 'forward';
  const spatialDirection = transitionContext.spatialDirection ?? 1;

  const variants = pageTransitionVariants[activeVariant] || pageTransitionVariants.none;

  const customProps = {
    direction: activeDirection,
    spatialDirection,
    isMobile,
    shouldReduceMotion,
  };

  const handleAnimationComplete = () => {
    setIsAnimating(false);

    // Focus management on transition completion (§16)
    // Direct focus to the first h1 or page header if available, or container
    if (containerRef.current) {
      const heading = containerRef.current.querySelector('h1, [data-focus-target="true"]');
      if (heading) {
        heading.setAttribute('tabIndex', '-1');
        heading.focus({ preventScroll: true });
      }
    }
  };

  return (
    <motion.div
      ref={containerRef}
      custom={customProps}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      onAnimationStart={() => setIsAnimating(true)}
      onAnimationComplete={handleAnimationComplete}
      className={clsx(
        'w-full min-h-full outline-none',
        isAnimating && 'will-change-[transform,opacity]',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['siblingSlide', 'deepenPush', 'lateralCalm', 'none']),
  direction: PropTypes.oneOf(['forward', 'back']),
  className: PropTypes.string,
};
