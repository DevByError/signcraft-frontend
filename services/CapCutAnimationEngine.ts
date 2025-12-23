/**
 * CapCut-Style Animation Engine
 * 
 * Core principles:
 * - JSON-based animation definitions (no functions in data)
 * - Clip-local timing (animations are relative to clip start)
 * - Deterministic evaluation (same input = same output always)
 * - Export-safe (works identically in preview and export)
 * - No global timeline time in animation evaluation
 * - Stateless rendering (pure functions only)
 */

import {
  Animation,
  OpacityAnimation,
  PositionAnimation,
  ScaleAnimation,
  RotationAnimation,
  EvaluatedAnimations,
  EasingType,
} from '../types/animation';

// ==================== Easing Functions ====================

/**
 * Easing function implementations
 * All easing functions: (t: 0-1) => (value: 0-1)
 */
const EASING_FUNCTIONS: Record<EasingType, (t: number) => number> = {
  linear: (t) => t,

  // Quadratic
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  // Cubic
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  // Quadratic (aliases)
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => 1 - (1 - t) * (1 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
};

/**
 * Get easing function by name
 */
function getEasingFunction(easingType: EasingType): (t: number) => number {
  return EASING_FUNCTIONS[easingType] || EASING_FUNCTIONS.linear;
}

/**
 * Interpolate between two values using easing
 * 
 * @param from Starting value
 * @param to Ending value
 * @param progress 0-1 progress through the animation
 * @param easing Easing function name
 * @returns Interpolated value
 */
function interpolate(
  from: number,
  to: number,
  progress: number,
  easing: EasingType = 'linear'
): number {
  const easingFn = getEasingFunction(easing);
  const easedProgress = easingFn(Math.max(0, Math.min(1, progress)));
  return from + (to - from) * easedProgress;
}

/**
 * Interpolate between two 2D points
 */
function interpolatePoint(
  from: { x: number; y: number },
  to: { x: number; y: number },
  progress: number,
  easing: EasingType = 'linear'
): { x: number; y: number } {
  return {
    x: interpolate(from.x, to.x, progress, easing),
    y: interpolate(from.y, to.y, progress, easing),
  };
}

// ==================== Keyframe Evaluation ====================

/**
 * Find the two surrounding keyframes for a given time
 * 
 * Returns { before, after, progress } where progress is 0-1
 * between the two keyframes
 */
interface KeyframeWindow<T> {
  before: { timeMs: number; value: T; easing?: EasingType };
  after: { timeMs: number; value: T; easing?: EasingType };
  progress: number;
}

function findKeyframeWindow<T extends any>(
  keyframes: Array<{ timeMs: number; value: T; easing?: EasingType }>,
  timeMs: number
): KeyframeWindow<T> | null {
  // Before first keyframe: clamp to first value
  if (timeMs <= keyframes[0].timeMs) {
    return null;
  }

  // Find surrounding keyframes
  for (let i = 0; i < keyframes.length - 1; i++) {
    const before = keyframes[i];
    const after = keyframes[i + 1];

    if (timeMs >= before.timeMs && timeMs <= after.timeMs) {
      const duration = after.timeMs - before.timeMs;
      const progress = duration > 0 ? (timeMs - before.timeMs) / duration : 0;

      return {
        before,
        after,
        progress: Math.max(0, Math.min(1, progress)),
      };
    }
  }

  // After last keyframe: clamp to last value
  return null;
}

/**
 * Evaluate a keyframe-based value at a specific time
 * 
 * Rules:
 * 1. Before first keyframe → return first value (clamp)
 * 2. Between keyframes → interpolate using easing
 * 3. After last keyframe → return last value (clamp)
 */
function evaluateKeyframeValue<T extends any>(
  keyframes: Array<{ timeMs: number; value: T; easing?: EasingType }>,
  timeMs: number,
  interpolateFn: (from: T, to: T, progress: number, easing: EasingType) => T
): T {
  if (keyframes.length === 0) {
    throw new Error('Cannot evaluate empty keyframes');
  }

  // Clamp before first keyframe
  if (timeMs <= keyframes[0].timeMs) {
    return keyframes[0].value;
  }

  // Clamp after last keyframe
  if (timeMs >= keyframes[keyframes.length - 1].timeMs) {
    return keyframes[keyframes.length - 1].value;
  }

  // Find surrounding keyframes and interpolate
  const window = findKeyframeWindow(keyframes, timeMs);
  if (!window) {
    // This shouldn't happen due to checks above, but be safe
    return keyframes[keyframes.length - 1].value;
  }

  const easing = window.before.easing || 'linear';
  return interpolateFn(window.before.value, window.after.value, window.progress, easing);
}

// ==================== Animation Type Evaluators ====================

/**
 * Evaluate opacity animation at clip-local time
 */
function evaluateOpacityAnimation(
  animation: OpacityAnimation,
  clipLocalTimeMs: number
): number | null {
  // Before delay: animation hasn't started
  if (clipLocalTimeMs < animation.delayMs) {
    return null;
  }

  // Adjust time to animation-local (starting at 0)
  const animationLocalTimeMs = clipLocalTimeMs - animation.delayMs;

  return evaluateKeyframeValue(
    animation.keyframes,
    animationLocalTimeMs,
    (from, to, progress, easing) =>
      interpolate(from, to, progress, easing)
  );
}

/**
 * Evaluate position animation at clip-local time
 */
function evaluatePositionAnimation(
  animation: PositionAnimation,
  clipLocalTimeMs: number
): { x: number; y: number } | null {
  if (clipLocalTimeMs < animation.delayMs) {
    return null;
  }

  const animationLocalTimeMs = clipLocalTimeMs - animation.delayMs;

  return evaluateKeyframeValue(
    animation.keyframes,
    animationLocalTimeMs,
    (from, to, progress, easing) => {
      const easingFn = getEasingFunction(easing);
      const easedProgress = easingFn(Math.max(0, Math.min(1, progress)));
      return {
        x: from.x + (to.x - from.x) * easedProgress,
        y: from.y + (to.y - from.y) * easedProgress,
      };
    }
  );
}

/**
 * Evaluate scale animation at clip-local time
 */
function evaluateScaleAnimation(
  animation: ScaleAnimation,
  clipLocalTimeMs: number
): { x: number; y: number } | null {
  if (clipLocalTimeMs < animation.delayMs) {
    return null;
  }

  const animationLocalTimeMs = clipLocalTimeMs - animation.delayMs;

  return evaluateKeyframeValue(
    animation.keyframes,
    animationLocalTimeMs,
    (from, to, progress, easing) => {
      const easingFn = getEasingFunction(easing);
      const easedProgress = easingFn(Math.max(0, Math.min(1, progress)));
      return {
        x: from.x + (to.x - from.x) * easedProgress,
        y: from.y + (to.y - from.y) * easedProgress,
      };
    }
  );
}

/**
 * Evaluate rotation animation at clip-local time
 */
function evaluateRotationAnimation(
  animation: RotationAnimation,
  clipLocalTimeMs: number
): number | null {
  if (clipLocalTimeMs < animation.delayMs) {
    return null;
  }

  const animationLocalTimeMs = clipLocalTimeMs - animation.delayMs;

  return evaluateKeyframeValue(
    animation.keyframes,
    animationLocalTimeMs,
    (from, to, progress, easing) =>
      interpolate(from, to, progress, easing)
  );
}

// ==================== Public API ====================

/**
 * Check if a clip is active at the given timeline time
 * 
 * Clip is active when: timelineTimeMs >= clipStartMs && timelineTimeMs <= clipStartMs + clipDurationMs
 */
export function isClipActive(
  clipStartMs: number,
  clipDurationMs: number,
  timelineTimeMs: number
): boolean {
  return (
    timelineTimeMs >= clipStartMs &&
    timelineTimeMs <= clipStartMs + clipDurationMs
  );
}

/**
 * Convert timeline time to clip-local time
 * 
 * Clip-local time is the offset from clip start:
 * clipLocalTime = timelineTime - clipStart
 * 
 * This ensures animations always start at 0 and are relative to the clip
 */
export function getClipLocalTime(
  clipStartMs: number,
  timelineTimeMs: number
): number {
  return timelineTimeMs - clipStartMs;
}

/**
 * Evaluate all animations at clip-local time
 * 
 * Returns evaluated values for all animation properties.
 * Properties without animations use their base values.
 * 
 * @param animations Array of animations to evaluate
 * @param clipLocalTimeMs Time within the clip (0 = clip start)
 * @param baseValues Base/initial values for each property
 * @returns Evaluated animation values (with base values as fallbacks)
 */
export function evaluateAnimations(
  animations: Animation[],
  clipLocalTimeMs: number,
  baseValues: {
    opacity: number;
    position: { x: number; y: number };
    scale: { x: number; y: number };
    rotation: number;
  }
): EvaluatedAnimations {
  const result: EvaluatedAnimations = {
    opacity: baseValues.opacity,
    position: { ...baseValues.position },
    scale: { ...baseValues.scale },
    rotation: baseValues.rotation,
  };

  // Process each animation and update results
  for (const animation of animations) {
    switch (animation.type) {
      case 'opacity': {
        const value = evaluateOpacityAnimation(animation, clipLocalTimeMs);
        if (value !== null) {
          result.opacity = value;
        }
        break;
      }

      case 'position': {
        const value = evaluatePositionAnimation(animation, clipLocalTimeMs);
        if (value !== null) {
          result.position = value;
        }
        break;
      }

      case 'scale': {
        const value = evaluateScaleAnimation(animation, clipLocalTimeMs);
        if (value !== null) {
          result.scale = value;
        }
        break;
      }

      case 'rotation': {
        const value = evaluateRotationAnimation(animation, clipLocalTimeMs);
        if (value !== null) {
          result.rotation = value;
        }
        break;
      }
    }
  }

  return result;
}

/**
 * Complete frame evaluation for a clip
 * 
 * This is the primary function to use when rendering a clip.
 * It:
 * 1. Checks if clip is active
 * 2. Converts timeline time to clip-local time
 * 3. Evaluates all animations
 * 4. Returns null if clip is not active (don't render)
 * 
 * @param clip Clip object with animations and base values
 * @param timelineTimeMs Current timeline time (milliseconds)
 * @returns Evaluated animations, or null if clip is not active
 */
export function evaluateClipAtTime(
  clip: {
    startMs: number;
    durationMs: number;
    animations: Animation[];
    baseValues: {
      opacity: number;
      position: { x: number; y: number };
      scale: { x: number; y: number };
      rotation: number;
    };
  },
  timelineTimeMs: number
): EvaluatedAnimations | null {
  // Check if clip is active
  if (!isClipActive(clip.startMs, clip.durationMs, timelineTimeMs)) {
    return null;
  }

  // Convert to clip-local time
  const clipLocalTimeMs = getClipLocalTime(clip.startMs, timelineTimeMs);

  // Evaluate animations
  return evaluateAnimations(
    clip.animations,
    clipLocalTimeMs,
    clip.baseValues
  );
}

/**
 * Export all easing functions for use in other services
 */
export function getEasingFunctionByName(
  easingType: EasingType
): (t: number) => number {
  return getEasingFunction(easingType);
}

export { EASING_FUNCTIONS };
