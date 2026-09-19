import React, { useState, useEffect, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { useReducedMotion } from 'framer-motion';

// Lazy-load Three.js scene strictly on demand so it chunks into a route-isolated artifact
const RitualForgeScene = lazy(() => import('./RitualForgeScene'));

/**
 * Checks if WebGL is supported safely without throwing.
 */
function isWebGLAvailable() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

/**
 * Lightweight, high-performance CSS/SVG Celestial Aura fallback.
 * Rendered when WebGL is unavailable, on mobile devices, or when prefers-reduced-motion is active.
 */
function CelestialAuraFallback({ hasActiveStreaks = false }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Radial Atmospheric Glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-radial from-cyan-500/10 via-purple-900/10 to-transparent blur-3xl" />
      {hasActiveStreaks && (
        <div className="absolute w-[350px] h-[350px] rounded-full bg-radial from-amber-500/10 to-transparent blur-2xl animate-pulse" />
      )}

      {/* Procedural Celestial SVG Rings */}
      <svg
        viewBox="0 0 400 400"
        className="w-[320px] h-[320px] opacity-40 text-cyan-400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Ring */}
        <circle
          cx="200"
          cy="200"
          r="160"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 8"
          className="opacity-50"
        />
        {/* Middle Ring */}
        <circle
          cx="200"
          cy="200"
          r="120"
          stroke="#c084fc"
          strokeWidth="1.2"
          strokeDasharray="8 6"
          className="opacity-60"
        />
        {/* Inner Ring */}
        <circle
          cx="200"
          cy="200"
          r="75"
          stroke="currentColor"
          strokeWidth="1.5"
          className="opacity-75"
        />
        {/* Central Rhombus Core */}
        <polygon
          points="200,160 240,200 200,240 160,200"
          stroke="#38bdf8"
          strokeWidth="1.5"
          fill="rgba(109, 40, 217, 0.2)"
        />
      </svg>
    </div>
  );
}

CelestialAuraFallback.propTypes = {
  hasActiveStreaks: PropTypes.bool,
};

class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[HabitsAtmosphere] WebGL scene caught error, falling back to CSS/SVG:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

SceneErrorBoundary.propTypes = {
  children: PropTypes.node,
  fallback: PropTypes.node,
};

/**
 * HabitsAtmosphere — Route-scoped atmospheric background for /habits.
 * Integrates procedural Three.js consistency core with immediate CSS/SVG fallback.
 */
export function HabitsAtmosphere({ hasActiveStreaks = false }) {
  const shouldReduceMotion = useReducedMotion();
  const [canUseWebGL] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 768 && isWebGLAvailable();
  });

  const is3DActive = canUseWebGL && !shouldReduceMotion;

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none" aria-hidden="true">
      {/* Base Dark Fantasy Atmosphere */}
      <div className="absolute inset-0 bg-obsidian-950" />
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-purple-950/20 via-cyan-950/10 to-transparent" />

      {/* 3D Core with Progressive Enhancement & Fallback */}
      {is3DActive ? (
        <SceneErrorBoundary fallback={<CelestialAuraFallback hasActiveStreaks={hasActiveStreaks} />}>
          <Suspense fallback={<CelestialAuraFallback hasActiveStreaks={hasActiveStreaks} />}>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-xl h-[420px] opacity-75">
              <RitualForgeScene hasActiveStreaks={hasActiveStreaks} />
            </div>
          </Suspense>
        </SceneErrorBoundary>
      ) : (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-xl h-[420px]">
          <CelestialAuraFallback hasActiveStreaks={hasActiveStreaks} />
        </div>
      )}
    </div>
  );
}

HabitsAtmosphere.propTypes = {
  hasActiveStreaks: PropTypes.bool,
};
