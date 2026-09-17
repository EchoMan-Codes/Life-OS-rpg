import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useReducedMotion } from 'framer-motion';

/**
 * Full-screen background video component for LifeOS Onboarding.
 * Renders an actual seamless looping HTML5 <video> element with WebM and MP4 fallback,
 * lightweight poster fallback, and gentle vignette gradient overlays for contrast.
 */
export function OnboardingVideoBackground({ className = '', blurred = false, children }) {
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldReduceMotion) {
      video.pause();
      return;
    }

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setVideoLoaded(true);
        })
        .catch(() => {
          // Autoplay was prevented or video couldn't play
          setVideoLoaded(false);
        });
    }
  }, [shouldReduceMotion]);

  return (
    <div className={clsx('fixed inset-0 overflow-hidden bg-obsidian', className)}>
      {/* 1. Poster Fallback Image (always present under video to prevent flashing) */}
      <img
        src="/videos/onboarding-poster.webp"
        alt="LifeOS Landscape Poster"
        className={clsx(
          'absolute inset-0 w-full h-full object-cover object-center transition-all duration-1000 select-none pointer-events-none',
          videoLoaded && !shouldReduceMotion ? 'opacity-0' : 'opacity-100'
        )}
        style={blurred ? { filter: 'blur(6px)', transition: 'filter 500ms ease' } : { filter: 'blur(0px)', transition: 'filter 500ms ease' }}
      />

      {/* 2. Seamless HTML5 Video Background */}
      {!shouldReduceMotion && !hasError && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/videos/onboarding-poster.webp"
          onLoadedData={() => setVideoLoaded(true)}
          onPlaying={() => setVideoLoaded(true)}
          onError={() => setHasError(true)}
          className={clsx(
            'absolute inset-0 w-full h-full object-cover object-center transition-all duration-1000 select-none pointer-events-none',
            videoLoaded ? 'opacity-100' : 'opacity-0'
          )}
          style={blurred ? { filter: 'blur(6px)', transition: 'filter 500ms ease' } : { filter: 'blur(0px)', transition: 'filter 500ms ease' }}
        >
          <source src="/videos/onboarding-loop.webm" type="video/webm" />
          <source src="/videos/onboarding-loop.mp4" type="video/mp4" />
        </video>
      )}

      {/* 3. Multi-layer Readability Vignettes (Clean iOS Glass Aesthetics) */}
      {/* Top Header Vignette */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-obsidian/90 via-obsidian/40 to-transparent pointer-events-none" />

      {/* Subtle Peripheral Vignette for Cinematic Focus */}
      <div className="absolute inset-0 bg-radial-[circle_at_50%_40%] from-transparent via-obsidian/20 to-obsidian/75 pointer-events-none" />

      {/* Bottom Hero & CTA Vignette (Ensures pristine readability over any frame) */}
      <div className="absolute bottom-0 left-0 right-0 h-[65%] bg-gradient-to-t from-obsidian via-obsidian/75 to-transparent pointer-events-none" />

      {/* Foreground Content */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}

OnboardingVideoBackground.propTypes = {
  className: PropTypes.string,
  blurred: PropTypes.bool,
  children: PropTypes.node,
};
