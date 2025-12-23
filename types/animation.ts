/**
 * Animation System Types - CapCut Style
 * Pure JSON-based animations with clip-local time
 * 
 * CRITICAL PRINCIPLES:
 * 1. All time values are clip-local (starting at 0)
 * 2. Animations use keyframes, not preset names
 * 3. Stateless evaluation - pure functions only
 * 4. JSON-friendly - no functions in data
 */

// ==================== Easing Functions ====================

export type EasingType = 
  | 'linear' 
  | 'easeIn' 
  | 'easeOut' 
  | 'easeInOut' 
  | 'easeInCubic' 
  | 'easeOutCubic' 
  | 'easeInOutCubic'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad';

// ==================== Keyframe Types ====================

export interface Keyframe<T> {
  /** Time in milliseconds (clip-local, starting at 0) */
  timeMs: number;
  /** Value at this keyframe */
  value: T;
  /** Easing function to use when interpolating TO this keyframe */
  easing?: EasingType;
}

// ==================== Animation Property Types ====================

export interface OpacityKeyframe extends Keyframe<number> {
  value: number; // 0-1
}

export interface PositionKeyframe extends Keyframe<{ x: number; y: number }> {
  value: { x: number; y: number };
}

export interface ScaleKeyframe extends Keyframe<{ x: number; y: number }> {
  value: { x: number; y: number }; // 1 = 100%
}

export interface RotationKeyframe extends Keyframe<number> {
  value: number; // degrees
}

// ==================== Animation Definitions ====================

export interface OpacityAnimation {
  type: 'opacity';
  /** Delay before animation starts (clip-local time) */
  delayMs: number;
  /** Keyframes (clip-local time, starting at 0) */
  keyframes: OpacityKeyframe[];
}

export interface PositionAnimation {
  type: 'position';
  delayMs: number;
  keyframes: PositionKeyframe[];
}

export interface ScaleAnimation {
  type: 'scale';
  delayMs: number;
  keyframes: ScaleKeyframe[];
}

export interface RotationAnimation {
  type: 'rotation';
  delayMs: number;
  keyframes: RotationKeyframe[];
}

export type Animation = OpacityAnimation | PositionAnimation | ScaleAnimation | RotationAnimation;

// ==================== Clip Animation Container ====================

export interface ClipAnimations {
  /** All animations for this clip */
  animations: Animation[];
}

// ==================== Evaluated Animation Result ====================

export interface EvaluatedAnimations {
  /** Evaluated opacity (0-1) */
  opacity: number;
  /** Evaluated position */
  position: { x: number; y: number };
  /** Evaluated scale */
  scale: { x: number; y: number };
  /** Evaluated rotation (degrees) */
  rotation: number;
}

// ==================== Legacy Animation Types (Deprecated) ====================
// These are kept for backward compatibility but should not be used for new code
  | 'power1.out'
  | 'power1.inOut'
  | 'power2.in'
  | 'power2.out'
  | 'power2.inOut'
  | 'power3.in'
  | 'power3.out'
  | 'power3.inOut'
  | 'power4.in'
  | 'power4.out'
  | 'power4.inOut'
  | 'back.in'
  | 'back.out'
  | 'back.inOut'
  | 'elastic.in'
  | 'elastic.out'
  | 'elastic.inOut'
  | 'bounce.in'
  | 'bounce.out'
  | 'bounce.inOut';

export type TriggerType = 
  | 'onLoad'        // Triggers when preview mode starts
  | 'afterPrevious' // Triggers after previous animation
  | 'manual'        // Manually triggered via code
  | 'loop';         // Continuously loops in preview

export interface AnimationTrigger {
  type: TriggerType;
  /** For 'afterPrevious' trigger: ID of the element to wait for */
  targetElementId?: string;
  /** For 'loop' trigger: number of times to repeat (-1 for infinite) */
  repeatCount?: number;
  /** Delay before repeating (in ms) */
  repeatDelay?: number;
}

export interface AnimationConfig {
  /** Type of animation effect */
  type: AnimationType;
  /** Duration in milliseconds */
  duration: number;
  /** Delay before animation starts (in ms) */
  delay: number;
  /** Easing function */
  easing: EasingType;
  /** Animation direction (for reversible animations) */
  direction?: 'normal' | 'reverse' | 'alternate';
  /** Number of times to repeat (1 = play once, -1 = infinite) */
  repeat?: number;
  /** Delay between repeats (in ms) */
  repeatDelay?: number;
}

export interface ElementAnimation {
  /** Entrance animation (when element appears) */
  enter?: AnimationConfig;
  /** Exit animation (when element disappears) */
  exit?: AnimationConfig;
  /** Trigger conditions */
  trigger?: AnimationTrigger;
  /** Whether animation is enabled */
  enabled: boolean;
}

// ==================== Animation State ====================

export interface AnimationState {
  /** Is the animation currently playing? */
  isPlaying: boolean;
  /** Is the animation paused? */
  isPaused: boolean;
  /** Current progress (0-1) */
  progress: number;
  /** Time elapsed (in ms) */
  timeElapsed: number;
  /** Animation instance reference (GSAP timeline or tween) */
  instance?: any;
}

// ==================== Preset Animations ====================

export interface AnimationPreset {
  id: string;
  name: string;
  category: 'basic' | 'attention' | 'advanced' | 'featured' | 'reveal' | 'general' | 'effects' | 'addon';
  description: string;
  enter?: Partial<AnimationConfig>;
  exit?: Partial<AnimationConfig>;
  thumbnail?: string; // SVG or icon representation
}

// ==================== Timeline Support ====================

export interface AnimationKeyframe {
  /** Time in milliseconds from start */
  time: number;
  /** Properties to animate */
  properties: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    opacity?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
  };
  /** Easing for this keyframe */
  easing?: EasingType;
}

export interface AnimationTimeline {
  /** Timeline ID */
  id: string;
  /** Element ID this timeline belongs to */
  elementId: string;
  /** Duration of entire timeline (in ms) */
  duration: number;
  /** Keyframes */
  keyframes: AnimationKeyframe[];
  /** Whether timeline loops */
  loop: boolean;
}

// ==================== Animation Group ====================

export interface AnimationGroup {
  /** Group ID */
  id: string;
  /** Name of the group */
  name: string;
  /** Element IDs in this group */
  elementIds: string[];
  /** Stagger delay between elements (in ms) */
  stagger: number;
  /** Group animation configuration */
  animation: AnimationConfig;
}

// ==================== Export/Import Support ====================

export interface AnimationExport {
  version: string;
  animations: {
    [elementId: string]: ElementAnimation;
  };
  groups?: AnimationGroup[];
  timelines?: AnimationTimeline[];
}
