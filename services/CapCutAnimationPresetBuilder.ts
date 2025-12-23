/**
 * CapCut Animation Preset Builder
 * 
 * Generates full animation definitions from preset names.
 * Maps UI preset names (from CapCutAnimationPresets.ts) to complete
 * JSON animation objects ready for evaluation.
 * 
 * All animations are clip-local and deterministic.
 * IN animations: start at clip beginning (delayMs: 0)
 * OUT animations: start before clip end (delayMs: clipDurationMs - animationDurationMs)
 */

import {
  OpacityAnimation,
  PositionAnimation,
  ScaleAnimation,
  RotationAnimation,
  Animation,
} from '../types/animation';

// ==================== IN ANIMATION BUILDERS ====================

/**
 * Fade In: Opacity 0 → 1
 * Duration: 400ms
 */
export function createFadeInAnimation(durationMs: number = 400): OpacityAnimation {
  return {
    type: 'opacity',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: 0, easing: 'easeOut' },
      { timeMs: durationMs, value: 1 },
    ],
  };
}

/**
 * Pop In: Scale 0 → 1 + Opacity 0 → 1
 * Duration: 350ms
 */
export function createPopInAnimation(durationMs: number = 350): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 0, y: 0 }, easing: 'easeOut' },
      { timeMs: durationMs, value: { x: 1, y: 1 } },
    ],
  };
}

/**
 * Grow In: Scale 0.8 → 1 + Opacity 0 → 1
 * Subtle zoom effect
 * Duration: 300ms
 */
export function createGrowInAnimation(durationMs: number = 300): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 0.8, y: 0.8 }, easing: 'easeOut' },
      { timeMs: durationMs, value: { x: 1, y: 1 } },
    ],
  };
}

/**
 * Slide In Left: Position from left
 * Duration: 500ms
 */
export function createSlideInLeftAnimation(
  durationMs: number = 500,
  distancePixels: number = 100
): PositionAnimation {
  return {
    type: 'position',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: -distancePixels, y: 0 }, easing: 'easeOut' },
      { timeMs: durationMs, value: { x: 0, y: 0 } },
    ],
  };
}

/**
 * Slide In Right: Position from right
 * Duration: 500ms
 */
export function createSlideInRightAnimation(
  durationMs: number = 500,
  distancePixels: number = 100
): PositionAnimation {
  return {
    type: 'position',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: distancePixels, y: 0 }, easing: 'easeOut' },
      { timeMs: durationMs, value: { x: 0, y: 0 } },
    ],
  };
}

/**
 * Slide In Top: Position from top
 * Duration: 500ms
 */
export function createSlideInTopAnimation(
  durationMs: number = 500,
  distancePixels: number = 100
): PositionAnimation {
  return {
    type: 'position',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 0, y: -distancePixels }, easing: 'easeOut' },
      { timeMs: durationMs, value: { x: 0, y: 0 } },
    ],
  };
}

/**
 * Slide In Bottom: Position from bottom
 * Duration: 500ms
 */
export function createSlideInBottomAnimation(
  durationMs: number = 500,
  distancePixels: number = 100
): PositionAnimation {
  return {
    type: 'position',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 0, y: distancePixels }, easing: 'easeOut' },
      { timeMs: durationMs, value: { x: 0, y: 0 } },
    ],
  };
}

/**
 * Bounce In: Bouncy scale animation
 * Duration: 600ms
 */
export function createBounceInAnimation(durationMs: number = 600): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 0, y: 0 }, easing: 'easeOut' },
      { timeMs: durationMs * 0.5, value: { x: 1.2, y: 1.2 }, easing: 'easeOut' },
      { timeMs: durationMs, value: { x: 1, y: 1 }, easing: 'easeOut' },
    ],
  };
}

/**
 * Elastic In: Elastic scale animation
 * Duration: 700ms
 */
export function createElasticInAnimation(durationMs: number = 700): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 0, y: 0 }, easing: 'easeOut' },
      { timeMs: durationMs * 0.3, value: { x: 0.5, y: 0.5 } },
      { timeMs: durationMs * 0.6, value: { x: 1.15, y: 1.15 } },
      { timeMs: durationMs, value: { x: 1, y: 1 } },
    ],
  };
}

/**
 * Spring In: Spring-like scale animation
 * Duration: 800ms
 */
export function createSpringInAnimation(durationMs: number = 800): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 0.3, y: 0.3 }, easing: 'easeOut' },
      { timeMs: durationMs * 0.4, value: { x: 1.1, y: 1.1 } },
      { timeMs: durationMs * 0.7, value: { x: 0.95, y: 0.95 } },
      { timeMs: durationMs, value: { x: 1, y: 1 } },
    ],
  };
}

/**
 * Zoom In: Large scale transition
 * Duration: 500ms
 */
export function createZoomInAnimation(durationMs: number = 500): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 0.3, y: 0.3 }, easing: 'easeOut' },
      { timeMs: durationMs, value: { x: 1, y: 1 } },
    ],
  };
}

/**
 * Zoom In Soft: Subtle zoom
 * Duration: 600ms
 */
export function createZoomInSoftAnimation(durationMs: number = 600): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 0.7, y: 0.7 }, easing: 'easeOut' },
      { timeMs: durationMs, value: { x: 1, y: 1 } },
    ],
  };
}

/**
 * Zoom Rotate In: Scale + Rotation
 * Duration: 600ms
 */
export function createZoomRotateInAnimation(durationMs: number = 600): ScaleAnimation {
  // Note: This returns scale; rotation would be a separate animation
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 0, y: 0 }, easing: 'easeOut' },
      { timeMs: durationMs, value: { x: 1, y: 1 } },
    ],
  };
}

/**
 * Flip In Horizontal: Rotation 90° → 0°
 * Duration: 500ms
 */
export function createFlipInHorizontalAnimation(durationMs: number = 500): RotationAnimation {
  return {
    type: 'rotation',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: 90, easing: 'easeOut' },
      { timeMs: durationMs, value: 0 },
    ],
  };
}

/**
 * Flip In Vertical: Rotation -90° → 0°
 * Duration: 500ms
 */
export function createFlipInVerticalAnimation(durationMs: number = 500): RotationAnimation {
  return {
    type: 'rotation',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: -90, easing: 'easeOut' },
      { timeMs: durationMs, value: 0 },
    ],
  };
}

/**
 * Rotate In: 360° rotation + scale
 * Duration: 600ms
 */
export function createRotateInAnimation(durationMs: number = 600): RotationAnimation {
  return {
    type: 'rotation',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: -180, easing: 'easeOut' },
      { timeMs: durationMs, value: 0 },
    ],
  };
}

/**
 * Flash: Opacity pulse
 * Duration: 400ms, pulses twice
 */
export function createFlashAnimation(durationMs: number = 400): OpacityAnimation {
  return {
    type: 'opacity',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: 1 },
      { timeMs: durationMs * 0.25, value: 0.3 },
      { timeMs: durationMs * 0.5, value: 1 },
      { timeMs: durationMs * 0.75, value: 0.3 },
      { timeMs: durationMs, value: 1 },
    ],
  };
}

/**
 * Pulse: Scale pulse
 * Duration: 500ms
 */
export function createPulseAnimation(durationMs: number = 500): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 1, y: 1 } },
      { timeMs: durationMs * 0.5, value: { x: 1.1, y: 1.1 } },
      { timeMs: durationMs, value: { x: 1, y: 1 } },
    ],
  };
}

/**
 * Heartbeat: Double pulse effect
 * Duration: 600ms
 */
export function createHeartbeatAnimation(durationMs: number = 600): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 1, y: 1 } },
      { timeMs: durationMs * 0.25, value: { x: 1.15, y: 1.15 } },
      { timeMs: durationMs * 0.35, value: { x: 1, y: 1 } },
      { timeMs: durationMs * 0.6, value: { x: 1.15, y: 1.15 } },
      { timeMs: durationMs, value: { x: 1, y: 1 } },
    ],
  };
}

// ==================== OUT ANIMATION BUILDERS ====================

/**
 * Fade Out: Opacity 1 → 0
 * Duration: 400ms
 * Use with delayMs = clipDurationMs - 400
 */
export function createFadeOutAnimation(durationMs: number = 400): OpacityAnimation {
  return {
    type: 'opacity',
    delayMs: 0, // Will be set when applying to clip
    keyframes: [
      { timeMs: 0, value: 1 },
      { timeMs: durationMs, value: 0, easing: 'easeIn' },
    ],
  };
}

/**
 * Pop Out: Scale 1 → 0 + Opacity 1 → 0
 * Duration: 350ms
 */
export function createPopOutAnimation(durationMs: number = 350): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 1, y: 1 } },
      { timeMs: durationMs, value: { x: 0, y: 0 }, easing: 'easeIn' },
    ],
  };
}

/**
 * Shrink Out: Scale 1 → 0.8
 * Duration: 300ms
 */
export function createShrinkOutAnimation(durationMs: number = 300): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 1, y: 1 } },
      { timeMs: durationMs, value: { x: 0.8, y: 0.8 }, easing: 'easeIn' },
    ],
  };
}

/**
 * Slide Out Left: Position to left
 * Duration: 500ms
 */
export function createSlideOutLeftAnimation(
  durationMs: number = 500,
  distancePixels: number = 100
): PositionAnimation {
  return {
    type: 'position',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 0, y: 0 } },
      { timeMs: durationMs, value: { x: -distancePixels, y: 0 }, easing: 'easeIn' },
    ],
  };
}

/**
 * Slide Out Right: Position to right
 * Duration: 500ms
 */
export function createSlideOutRightAnimation(
  durationMs: number = 500,
  distancePixels: number = 100
): PositionAnimation {
  return {
    type: 'position',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 0, y: 0 } },
      { timeMs: durationMs, value: { x: distancePixels, y: 0 }, easing: 'easeIn' },
    ],
  };
}

/**
 * Slide Out Top: Position to top
 * Duration: 500ms
 */
export function createSlideOutTopAnimation(
  durationMs: number = 500,
  distancePixels: number = 100
): PositionAnimation {
  return {
    type: 'position',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 0, y: 0 } },
      { timeMs: durationMs, value: { x: 0, y: -distancePixels }, easing: 'easeIn' },
    ],
  };
}

/**
 * Slide Out Bottom: Position to bottom
 * Duration: 500ms
 */
export function createSlideOutBottomAnimation(
  durationMs: number = 500,
  distancePixels: number = 100
): PositionAnimation {
  return {
    type: 'position',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 0, y: 0 } },
      { timeMs: durationMs, value: { x: 0, y: distancePixels }, easing: 'easeIn' },
    ],
  };
}

/**
 * Bounce Out: Scale reverse bounce
 * Duration: 600ms
 */
export function createBounceOutAnimation(durationMs: number = 600): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 1, y: 1 } },
      { timeMs: durationMs * 0.5, value: { x: 0.8, y: 0.8 } },
      { timeMs: durationMs, value: { x: 0, y: 0 }, easing: 'easeIn' },
    ],
  };
}

/**
 * Elastic Out: Elastic exit
 * Duration: 700ms
 */
export function createElasticOutAnimation(durationMs: number = 700): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 1, y: 1 } },
      { timeMs: durationMs * 0.4, value: { x: 0.85, y: 0.85 } },
      { timeMs: durationMs * 0.7, value: { x: 0.5, y: 0.5 } },
      { timeMs: durationMs, value: { x: 0, y: 0 }, easing: 'easeIn' },
    ],
  };
}

/**
 * Spring Out: Spring-like exit
 * Duration: 800ms
 */
export function createSpringOutAnimation(durationMs: number = 800): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 1, y: 1 } },
      { timeMs: durationMs * 0.3, value: { x: 0.9, y: 0.9 } },
      { timeMs: durationMs * 0.6, value: { x: 0.7, y: 0.7 } },
      { timeMs: durationMs, value: { x: 0.3, y: 0.3 }, easing: 'easeIn' },
    ],
  };
}

/**
 * Zoom Out: Scale down exit
 * Duration: 500ms
 */
export function createZoomOutAnimation(durationMs: number = 500): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 1, y: 1 } },
      { timeMs: durationMs, value: { x: 0.3, y: 0.3 }, easing: 'easeIn' },
    ],
  };
}

/**
 * Zoom Out Soft: Subtle zoom out
 * Duration: 600ms
 */
export function createZoomOutSoftAnimation(durationMs: number = 600): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 1, y: 1 } },
      { timeMs: durationMs, value: { x: 0.7, y: 0.7 }, easing: 'easeIn' },
    ],
  };
}

/**
 * Zoom Rotate Out: Scale + Rotation exit
 * Duration: 600ms
 */
export function createZoomRotateOutAnimation(durationMs: number = 600): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 1, y: 1 } },
      { timeMs: durationMs, value: { x: 0, y: 0 }, easing: 'easeIn' },
    ],
  };
}

/**
 * Flip Out Horizontal: Rotation 0° → 90°
 * Duration: 500ms
 */
export function createFlipOutHorizontalAnimation(durationMs: number = 500): RotationAnimation {
  return {
    type: 'rotation',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: 0 },
      { timeMs: durationMs, value: 90, easing: 'easeIn' },
    ],
  };
}

/**
 * Flip Out Vertical: Rotation 0° → -90°
 * Duration: 500ms
 */
export function createFlipOutVerticalAnimation(durationMs: number = 500): RotationAnimation {
  return {
    type: 'rotation',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: 0 },
      { timeMs: durationMs, value: -90, easing: 'easeIn' },
    ],
  };
}

/**
 * Rotate Out: 360° rotation exit
 * Duration: 600ms
 */
export function createRotateOutAnimation(durationMs: number = 600): RotationAnimation {
  return {
    type: 'rotation',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: 0 },
      { timeMs: durationMs, value: 180, easing: 'easeIn' },
    ],
  };
}

/**
 * Flash Out: Opacity pulse on exit
 * Duration: 400ms
 */
export function createFlashOutAnimation(durationMs: number = 400): OpacityAnimation {
  return {
    type: 'opacity',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: 1 },
      { timeMs: durationMs * 0.25, value: 0.3 },
      { timeMs: durationMs * 0.5, value: 1 },
      { timeMs: durationMs * 0.75, value: 0.3 },
      { timeMs: durationMs, value: 0, easing: 'easeIn' },
    ],
  };
}

/**
 * Pulse Out: Scale pulse on exit
 * Duration: 500ms
 */
export function createPulseOutAnimation(durationMs: number = 500): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 1, y: 1 } },
      { timeMs: durationMs * 0.5, value: { x: 1.1, y: 1.1 } },
      { timeMs: durationMs, value: { x: 0.8, y: 0.8 }, easing: 'easeIn' },
    ],
  };
}

/**
 * Heartbeat Out: Double pulse on exit
 * Duration: 600ms
 */
export function createHeartbeatOutAnimation(durationMs: number = 600): ScaleAnimation {
  return {
    type: 'scale',
    delayMs: 0,
    keyframes: [
      { timeMs: 0, value: { x: 1, y: 1 } },
      { timeMs: durationMs * 0.25, value: { x: 1.15, y: 1.15 } },
      { timeMs: durationMs * 0.35, value: { x: 1, y: 1 } },
      { timeMs: durationMs * 0.6, value: { x: 1.15, y: 1.15 } },
      { timeMs: durationMs, value: { x: 0.7, y: 0.7 }, easing: 'easeIn' },
    ],
  };
}

// ==================== Preset Lookup ====================

export type AnimationPresetName = string;

/**
 * Get IN animation builder function by name
 */
export function getInAnimationBuilder(
  presetName: string,
  durationMs?: number
): Animation | null {
  // Normalize name to lowercase for matching
  const key = presetName.toLowerCase().replace(/\s+/g, ' ');

  const builders: Record<string, (duration?: number) => Animation> = {
    'fade in': createFadeInAnimation,
    'pop in': createPopInAnimation,
    'grow in': createGrowInAnimation,
    'slide in left': createSlideInLeftAnimation,
    'slide in right': createSlideInRightAnimation,
    'slide in top': createSlideInTopAnimation,
    'slide in bottom': createSlideInBottomAnimation,
    'bounce in': createBounceInAnimation,
    'elastic in': createElasticInAnimation,
    'spring in': createSpringInAnimation,
    'zoom in': createZoomInAnimation,
    'zoom in soft': createZoomInSoftAnimation,
    'zoom rotate in': createZoomRotateInAnimation,
    'flip in horizontal': createFlipInHorizontalAnimation,
    'flip in vertical': createFlipInVerticalAnimation,
    'rotate in': createRotateInAnimation,
    'flash': createFlashAnimation,
    'pulse': createPulseAnimation,
    'heartbeat': createHeartbeatAnimation,
  };

  const builder = builders[key];
  return builder ? builder(durationMs) : null;
}

/**
 * Get OUT animation builder function by name
 */
export function getOutAnimationBuilder(
  presetName: string,
  durationMs?: number
): Animation | null {
  const key = presetName.toLowerCase().replace(/\s+/g, ' ');

  const builders: Record<string, (duration?: number) => Animation> = {
    'fade out': createFadeOutAnimation,
    'pop out': createPopOutAnimation,
    'shrink out': createShrinkOutAnimation,
    'slide out left': createSlideOutLeftAnimation,
    'slide out right': createSlideOutRightAnimation,
    'slide out top': createSlideOutTopAnimation,
    'slide out bottom': createSlideOutBottomAnimation,
    'bounce out': createBounceOutAnimation,
    'elastic out': createElasticOutAnimation,
    'spring out': createSpringOutAnimation,
    'zoom out': createZoomOutAnimation,
    'zoom out soft': createZoomOutSoftAnimation,
    'zoom rotate out': createZoomRotateOutAnimation,
    'flip out horizontal': createFlipOutHorizontalAnimation,
    'flip out vertical': createFlipOutVerticalAnimation,
    'rotate out': createRotateOutAnimation,
    'flash out': createFlashOutAnimation,
    'pulse out': createPulseOutAnimation,
    'heartbeat out': createHeartbeatOutAnimation,
  };

  const builder = builders[key];
  return builder ? builder(durationMs) : null;
}
