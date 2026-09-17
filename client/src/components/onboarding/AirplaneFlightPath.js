/**
 * Bézier flight path utility for the onboarding airplane.
 *
 * All coordinates are viewport-relative percentages (0–100).
 * The interpolation functions return { x, y, rotation, scale } at a given progress (0–1).
 */

// ── Desktop outbound path (6 segments) ──────────────────────────
const DESKTOP_PATH = [
  // Segment 1: Launch upward from CTA area
  { p0: [50, 85], p1: [50, 78], p2: [48, 70], p3: [44, 62] },
  // Segment 2: Sweep left toward mountain area
  { p0: [44, 62], p1: [38, 52], p2: [28, 48], p3: [25, 40] },
  // Segment 3: Arc around moon region
  { p0: [25, 40], p1: [22, 32], p2: [32, 22], p3: [45, 20] },
  // Segment 4: Distant flight across horizon — airplane at smallest scale
  { p0: [45, 20], p1: [56, 18], p2: [68, 22], p3: [65, 30] },
  // Segment 5: Turn toward viewer
  { p0: [65, 30], p1: [62, 38], p2: [56, 46], p3: [52, 55] },
  // Segment 6: Rapid approach to foreground
  { p0: [52, 55], p1: [50, 64], p2: [50, 76], p3: [50, 88] },
];

// ── Mobile outbound path (4 segments, tighter, stays in safe zone) ──
const MOBILE_PATH = [
  // Segment 1: Launch upward
  { p0: [50, 82], p1: [50, 72], p2: [45, 60], p3: [35, 48] },
  // Segment 2: Arc near top
  { p0: [35, 48], p1: [25, 36], p2: [40, 22], p3: [55, 25] },
  // Segment 3: Turn back toward viewer
  { p0: [55, 25], p1: [68, 28], p2: [62, 42], p3: [52, 55] },
  // Segment 4: Approach foreground
  { p0: [52, 55], p1: [50, 66], p2: [50, 76], p3: [50, 86] },
];

// ── Desktop return path (foreground → horizon landing) ──────────
const DESKTOP_RETURN = [
  // Segment 1: From foreground, rise
  { p0: [50, 88], p1: [50, 72], p2: [48, 58], p3: [45, 48] },
  // Segment 2: Sweep toward horizon center
  { p0: [45, 48], p1: [42, 38], p2: [46, 30], p3: [50, 26] },
  // Segment 3: Gentle approach to landing point
  { p0: [50, 26], p1: [53, 22], p2: [52, 20], p3: [50, 18] },
];

// ── Mobile return path ──────────────────────────────────────────
const MOBILE_RETURN = [
  // Segment 1: From foreground, rise
  { p0: [50, 86], p1: [50, 68], p2: [48, 52], p3: [45, 40] },
  // Segment 2: Head toward horizon
  { p0: [45, 40], p1: [42, 32], p2: [48, 24], p3: [50, 20] },
];

/**
 * Evaluate a single cubic Bézier at parameter t.
 * @param {number} t - 0 to 1
 * @param {number} p0
 * @param {number} p1
 * @param {number} p2
 * @param {number} p3
 * @returns {number}
 */
function cubicBezier(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/**
 * Evaluate the derivative (tangent) of a cubic Bézier at parameter t.
 * @param {number} t
 * @param {number} p0
 * @param {number} p1
 * @param {number} p2
 * @param {number} p3
 * @returns {number}
 */
function cubicBezierDerivative(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return 3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2);
}

/**
 * Depth-based scale curve. The airplane shrinks when "distant" (mid-flight)
 * and grows when close (start/end of outbound, and during return approach).
 *
 * @param {number} progress - 0 to 1
 * @param {'outbound'|'return'} direction
 * @returns {number} scale factor
 */
function depthScale(progress, direction) {
  if (direction === 'return') {
    // Start large (foreground), shrink toward horizon
    return 1.8 - progress * 1.4; // 1.8 → 0.4
  }
  // Outbound: start at 1, dip to 0.4 at midpoint, then grow to 2.0 at end
  if (progress < 0.5) {
    // Shrink from 1.0 to 0.4
    const t = progress / 0.5;
    return 1.0 - t * 0.6;
  }
  // Grow from 0.4 to 2.0
  const t = (progress - 0.5) / 0.5;
  return 0.4 + t * 1.6;
}

/**
 * Interpolate along a multi-segment Bézier path.
 *
 * @param {number} progress - 0 to 1 overall progress
 * @param {Array<{p0: [number,number], p1: [number,number], p2: [number,number], p3: [number,number]}>} segments
 * @param {'outbound'|'return'} direction
 * @returns {{ x: number, y: number, rotation: number, scale: number }}
 */
export function interpolatePath(progress, segments, direction = 'outbound') {
  const clamped = Math.max(0, Math.min(1, progress));
  const totalSegments = segments.length;
  const scaledProgress = clamped * totalSegments;
  const segIndex = Math.min(Math.floor(scaledProgress), totalSegments - 1);
  const localT = scaledProgress - segIndex;

  const seg = segments[segIndex];

  const x = cubicBezier(localT, seg.p0[0], seg.p1[0], seg.p2[0], seg.p3[0]);
  const y = cubicBezier(localT, seg.p0[1], seg.p1[1], seg.p2[1], seg.p3[1]);

  // Tangent for rotation
  const dx = cubicBezierDerivative(localT, seg.p0[0], seg.p1[0], seg.p2[0], seg.p3[0]);
  const dy = cubicBezierDerivative(localT, seg.p0[1], seg.p1[1], seg.p2[1], seg.p3[1]);
  const rotation = Math.atan2(dy, dx) * (180 / Math.PI);

  const scale = depthScale(clamped, direction);

  return { x, y, rotation, scale };
}

/**
 * Get the outbound flight path for the current viewport.
 * @param {boolean} isMobile - true for viewports ≤ 640px
 * @returns {Array} Bézier segment array
 */
export function getFlightPath(isMobile) {
  return isMobile ? MOBILE_PATH : DESKTOP_PATH;
}

/**
 * Get the return flight path for the current viewport.
 * @param {boolean} isMobile
 * @returns {Array} Bézier segment array
 */
export function getReturnPath(isMobile) {
  return isMobile ? MOBILE_RETURN : DESKTOP_RETURN;
}

/**
 * Duration configs per viewport.
 * @param {boolean} isMobile
 * @returns {{ outbound: number, return: number }} durations in seconds
 */
export function getFlightDurations(isMobile) {
  return isMobile
    ? { outbound: 3.0, return: 2.0 }
    : { outbound: 4.0, return: 2.5 };
}
