/**
 * Animation Engine - CapCut Style
 * Pure functional animation evaluation using clip-local time
 * 
 * CRITICAL RULES:
 * 1. All functions are stateless - same input = same output
 * 2. Time is always clip-local (0 = clip start)
 * 3. Keyframes use clip-local time
 * 4. No global timeline time used in evaluation
 * 5. Clamp before first keyframe, after last keyframe
 */

import {
  Animation,
  OpacityAnimation,
  PositionAnimation,
  ScaleAnimation,
  RotationAnimation,
  Keyframe,
  EasingType,
  EvaluatedAnimations,
} from '../types/animation';

// ==================== Easing Functions ====================

/**
 * Apply easing function to normalized time (0-1)
 */
export function applyEasing(t: number, easing: EasingType = 'linear'): number {
  // Clamp to 0-1
  t = Math.max(0, Math.min(1, t));

  switch (easing) {
    case 'linear':
      return t;
    
    case 'easeIn':
    case 'easeInQuad':
      return t * t;
    
    case 'easeOut':
    case 'easeOutQuad':
      return t * (2 - t);
    
    case 'easeInOut':
    case 'easeInOutQuad':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    
    case 'easeInCubic':
      return t * t * t;
    
    case 'easeOutCubic':
      return (--t) * t * t + 1;
    
    case 'easeInOutCubic':
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    
    default:
      return t;
  }
}

// ==================== Interpolation ====================

/**
 * Linear interpolation between two numbers
 */
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Interpolate between two keyframes
 */
function interpolateKeyframes<T>(
  keyframe1: Keyframe<T>,
  keyframe2: Keyframe<T>,
  timeMs: number,
  interpolator: (v1: T, v2: T, t: number) => T
): T {
  const duration = keyframe2.timeMs - keyframe1.timeMs;
  
  // Prevent division by zero
  if (duration === 0) {
    return keyframe2.value;
  }
  
  // Calculate normalized time (0-1) between keyframes
  const t = (timeMs - keyframe1.timeMs) / duration;
  
  // Apply easing (use keyframe2's easing for interpolation TO it)
  const easedT = applyEasing(t, keyframe2.easing || 'linear');
  
  // Interpolate
  return interpolator(keyframe1.value, keyframe2.value, easedT);
}

// ==================== Value Interpolators ====================

function interpolateNumber(v1: number, v2: number, t: number): number {
  return lerp(v1, v2, t);
}

function interpolatePosition(
  v1: { x: number; y: number },
  v2: { x: number; y: number },
  t: number
): { x: number; y: number } {
  return {
    x: lerp(v1.x, v2.x, t),
    y: lerp(v1.y, v2.y, t),
  };
}

function interpolateScale(
  v1: { x: number; y: number },
  v2: { x: number; y: number },
  t: number
): { x: number; y: number } {
  return {
    x: lerp(v1.x, v2.x, t),
    y: lerp(v1.y, v2.y, t),
  };
}

// ==================== Keyframe Evaluation ====================

/**
 * Evaluate animation at specific clip-local time
 * CRITICAL: clipLocalTimeMs must be relative to clip start (0 = clip start)
 */
function evaluateKeyframes<T>(
  keyframes: Keyframe<T>[],
  clipLocalTimeMs: number,
  interpolator: (v1: T, v2: T, t: number) => T,
  defaultValue: T
): T {
  // No keyframes - return default
  if (keyframes.length === 0) {
    return defaultValue;
  }

  // Sort keyframes by time (defensive)
  const sorted = [...keyframes].sort((a, b) => a.timeMs - b.timeMs);

  // Before first keyframe - clamp to first value
  if (clipLocalTimeMs <= sorted[0].timeMs) {
    return sorted[0].value;
  }

  // After last keyframe - clamp to last value
  if (clipLocalTimeMs >= sorted[sorted.length - 1].timeMs) {
    return sorted[sorted.length - 1].value;
  }

  // Find surrounding keyframes
  for (let i = 0; i < sorted.length - 1; i++) {
    const k1 = sorted[i];
    const k2 = sorted[i + 1];

    if (clipLocalTimeMs >= k1.timeMs && clipLocalTimeMs <= k2.timeMs) {
      return interpolateKeyframes(k1, k2, clipLocalTimeMs, interpolator);
    }
  }

  // Fallback (shouldn't reach here)
  return sorted[sorted.length - 1].value;
}

// ==================== Single Animation Evaluation ====================

/**
 * Evaluate opacity animation
 */
function evaluateOpacityAnimation(
  animation: OpacityAnimation,
  clipLocalTimeMs: number
): number {
  // Apply delay
  const animationTime = clipLocalTimeMs - animation.delayMs;

  // Before animation starts (including delay)
  if (animationTime < 0) {
    // Return first keyframe value or default
    return animation.keyframes.length > 0 ? animation.keyframes[0].value : 1;
  }

  return evaluateKeyframes(
    animation.keyframes,
    animationTime,
    interpolateNumber,
    1 // default opacity
  );
}

/**
 * Evaluate position animation
 */
function evaluatePositionAnimation(
  animation: PositionAnimation,
  clipLocalTimeMs: number,
  basePosition: { x: number; y: number }
): { x: number; y: number } {
  const animationTime = clipLocalTimeMs - animation.delayMs;

  if (animationTime < 0) {
    return animation.keyframes.length > 0 ? animation.keyframes[0].value : basePosition;
  }

  return evaluateKeyframes(
    animation.keyframes,
    animationTime,
    interpolatePosition,
    basePosition
  );
}

/**
 * Evaluate scale animation
 */
function evaluateScaleAnimation(
  animation: ScaleAnimation,
  clipLocalTimeMs: number
): { x: number; y: number } {
  const animationTime = clipLocalTimeMs - animation.delayMs;

  if (animationTime < 0) {
    return animation.keyframes.length > 0 ? animation.keyframes[0].value : { x: 1, y: 1 };
  }

  return evaluateKeyframes(
    animation.keyframes,
    animationTime,
    interpolateScale,
    { x: 1, y: 1 }
  );
}

/**
 * Evaluate rotation animation
 */
function evaluateRotationAnimation(
  animation: RotationAnimation,
  clipLocalTimeMs: number,
  baseRotation: number
): number {
  const animationTime = clipLocalTimeMs - animation.delayMs;

  if (animationTime < 0) {
    return animation.keyframes.length > 0 ? animation.keyframes[0].value : baseRotation;
  }

  return evaluateKeyframes(
    animation.keyframes,
    animationTime,
    interpolateNumber,
    baseRotation
  );
}

// ==================== Complete Animation Evaluation ====================

/**
 * Evaluate all animations for a clip at specific clip-local time
 * 
 * @param animations - Array of animations to evaluate
 * @param clipLocalTimeMs - Time relative to clip start (0 = clip start)
 * @param baseValues - Base values to use when no animation exists
 * @returns Evaluated animation values
 * 
 * CRITICAL: This function is stateless and pure
 * Same inputs always produce same outputs
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

  // Evaluate each animation
  for (const animation of animations) {
    switch (animation.type) {
      case 'opacity':
        result.opacity *= evaluateOpacityAnimation(animation, clipLocalTimeMs);
        break;

      case 'position':
        const pos = evaluatePositionAnimation(animation, clipLocalTimeMs, baseValues.position);
        result.position = pos;
        break;

      case 'scale':
        const scale = evaluateScaleAnimation(animation, clipLocalTimeMs);
        result.scale = scale;
        break;

      case 'rotation':
        result.rotation = evaluateRotationAnimation(animation, clipLocalTimeMs, baseValues.rotation);
        break;
    }
  }

  return result;
}

// ==================== Clip Rendering Helpers ====================

/**
 * Check if clip is active at global timeline time
 */
export function isClipActive(
  clipStartMs: number,
  clipDurationMs: number,
  timelineTimeMs: number
): boolean {
  return timelineTimeMs >= clipStartMs && timelineTimeMs <= clipStartMs + clipDurationMs;
}

/**
 * Calculate clip-local time from global timeline time
 * CRITICAL: This is the ONLY place where global timeline time is converted
 */
export function getClipLocalTime(
  clipStartMs: number,
  timelineTimeMs: number
): number {
  return timelineTimeMs - clipStartMs;
}

/**
 * Complete frame evaluation for a clip
 * This is the main entry point for rendering
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
    return null; // Clip not active - don't render
  }

  // Convert to clip-local time
  const clipLocalTimeMs = getClipLocalTime(clip.startMs, timelineTimeMs);

  // Evaluate animations
  return evaluateAnimations(clip.animations, clipLocalTimeMs, clip.baseValues);
}

// ==================== Preset Animation Builders ====================

/**
 * Create a fade-in animation (CapCut style)
 */
export function createFadeInAnimation(durationMs: number = 500): OpacityAnimation {
  return {
    type: 'opacity',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: 0, easing: 'easeOut' },
      { timeMs: durationMs, value: 1, easing: 'linear' },
    ],
  };
}

/**
 * Create a fade-out animation (CapCut style)
 */
export function createFadeOutAnimation(
  startTimeMs: number,
  durationMs: number = 500
): OpacityAnimation {
  return {
    type: 'opacity',
    delayMs: startTimeMs,
    keyframes: [
      { timeMs: 0, value: 1, easing: 'easeIn' },
      { timeMs: durationMs, value: 0, easing: 'linear' },
    ],
  };
}

/**
 * Create a slide-in animation
 */
export function createSlideInAnimation(
  from: { x: number; y: number },
  to: { x: number; y: number },
  durationMs: number = 800
): PositionAnimation {
  return {
    type: 'position',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: from, easing: 'easeOut' },
      { timeMs: durationMs, value: to, easing: 'linear' },
    ],
  };
}

/**
 * Create a scale animation
 */
export function createScaleAnimation(
  fromScale: { x: number; y: number },
  toScale: { x: number; y: number },
  durationMs: number = 600
): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: fromScale, easing: 'easeInOut' },
      { timeMs: durationMs, value: toScale, easing: 'linear' },
    ],
  };
}
