export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
/**
 * Animation Utilities
 * Helper functions for working with animations
 */

import { AnimationType, AnimationConfig, ElementAnimation, EasingType } from '../types/animation';
import { CanvasElement } from '../types';

// ==================== Animation Creation Helpers ====================

/**
 * Create a quick animation configuration
 */
export function createAnimation(
  type: AnimationType,
  duration: number = 500,
  easing: EasingType = 'ease-out'
): AnimationConfig {
  return {
    type,
    duration,
    delay: 0,
    easing,
    repeat: 1,
    repeatDelay: 0,
  };
}

/**
 * Create entrance + exit animation
 */
export function createEnterExitAnimation(
  enterType: AnimationType,
  exitType: AnimationType,
  duration: number = 500
): ElementAnimation {
  return {
    enabled: true,
    enter: createAnimation(enterType, duration),
    exit: createAnimation(exitType, duration),
  };
}

/**
 * Create looping animation (for attention grabbers)
 */
export function createLoopingAnimation(
  type: AnimationType,
  duration: number = 1000,
  repeatDelay: number = 500
): ElementAnimation {
  return {
    enabled: true,
    enter: {
      type,
      duration,
      delay: 0,
      easing: 'ease-in-out',
      repeat: -1, // Infinite
      repeatDelay,
    },
  };
}

// ==================== Animation Timing Helpers ====================

/**
 * Calculate total animation duration (including delays and repeats)
 */
export function calculateTotalDuration(config: AnimationConfig): number {
  const repeats = config.repeat === -1 ? 1 : (config.repeat || 1);
  const repeatDelays = (repeats - 1) * (config.repeatDelay || 0);
  return config.delay + (config.duration * repeats) + repeatDelays;
}

/**
 * Create sequential delays for multiple elements
 */
export function createSequentialDelays(
  count: number,
  staggerDelay: number = 200
): number[] {
  return Array.from({ length: count }, (_, i) => i * staggerDelay);
}

/**
 * Apply sequential delays to element animations
 */
export function applySequentialDelays(
  elements: CanvasElement[],
  baseAnimation: AnimationConfig,
  staggerDelay: number = 200
): CanvasElement[] {
  return elements.map((element, index) => ({
    ...element,
    animation: {
      enabled: true,
      enter: {
        ...baseAnimation,
        delay: index * staggerDelay,
      },
    },
  }));
}

// ==================== Animation Validation ====================

/**
 * Validate animation configuration
 */
export function isValidAnimation(config: AnimationConfig): boolean {
  if (!config.type) return false;
  if (config.duration < 0) return false;
  if (config.delay < 0) return false;
  return true;
}

/**
 * Check if element has animation enabled
 */
export function hasAnimation(element: CanvasElement): boolean {
  return !!(element.animation?.enabled && (element.animation.enter || element.animation.exit));
}

/**
 * Check if element has entrance animation
 */
export function hasEnterAnimation(element: CanvasElement): boolean {
  return !!(element.animation?.enabled && element.animation.enter);
}

/**
 * Check if element has exit animation
 */
export function hasExitAnimation(element: CanvasElement): boolean {
  return !!(element.animation?.enabled && element.animation.exit);
}

// ==================== Animation Cloning ====================

/**
 * Clone animation configuration
 */
export function cloneAnimation(animation: ElementAnimation): ElementAnimation {
  return JSON.parse(JSON.stringify(animation));
}

/**
 * Copy animation from one element to another
 */
export function copyAnimationToElements(
  sourceElement: CanvasElement,
  targetElements: CanvasElement[]
): CanvasElement[] {
  if (!sourceElement.animation) return targetElements;

  const animationClone = cloneAnimation(sourceElement.animation);

  return targetElements.map(element => ({
    ...element,
    animation: animationClone,
  }));
}

// ==================== Animation Speed Helpers ====================

/**
 * Scale animation speed (1.0 = normal, 2.0 = 2x faster, 0.5 = 2x slower)
 */
export function scaleAnimationSpeed(
  config: AnimationConfig,
  speedMultiplier: number
): AnimationConfig {
  return {
    ...config,
    duration: config.duration / speedMultiplier,
    delay: config.delay / speedMultiplier,
    repeatDelay: (config.repeatDelay || 0) / speedMultiplier,
  };
}

/**
 * Scale all element animations
 */
export function scaleAllAnimationSpeeds(
  elements: CanvasElement[],
  speedMultiplier: number
): CanvasElement[] {
  return elements.map(element => {
    if (!element.animation) return element;

    return {
      ...element,
      animation: {
        ...element.animation,
        enter: element.animation.enter
          ? scaleAnimationSpeed(element.animation.enter, speedMultiplier)
          : undefined,
        exit: element.animation.exit
          ? scaleAnimationSpeed(element.animation.exit, speedMultiplier)
          : undefined,
      },
    };
  });
}

// ==================== Animation Filters ====================

/**
 * Get all animated elements
 */
export function getAnimatedElements(elements: CanvasElement[]): CanvasElement[] {
  return elements.filter(hasAnimation);
}

/**
 * Get elements by animation type
 */
export function getElementsByAnimationType(
  elements: CanvasElement[],
  type: AnimationType
): CanvasElement[] {
  return elements.filter(
    el =>
      (el.animation?.enter?.type === type) ||
      (el.animation?.exit?.type === type)
  );
}

/**
 * Count animated elements
 */
export function countAnimatedElements(elements: CanvasElement[]): number {
  return getAnimatedElements(elements).length;
}

// ==================== Animation Export/Import ====================

/**
 * Export animations as JSON
 */
export function exportAnimations(elements: CanvasElement[]) {
  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    animations: elements.reduce((acc, el) => {
      if (el.animation) {
        acc[el.id] = el.animation;
      }
      return acc;
    }, {} as Record<string, ElementAnimation>),
  };
}

/**
 * Import animations from JSON
 */
export function importAnimations(
  elements: CanvasElement[],
  animationData: Record<string, ElementAnimation>
): CanvasElement[] {
  return elements.map(element => ({
    ...element,
    animation: animationData[element.id] || element.animation,
  }));
}

// ==================== Animation Recommendations ====================

/**
 * Get recommended animation based on element type
 */
export function getRecommendedAnimation(elementType: string): AnimationType {
  const recommendations: Record<string, AnimationType> = {
    TEXT: 'fadeIn',
    RECT: 'scaleIn',
    CIRCLE: 'scaleIn',
    IMAGE: 'fadeIn',
    STAR: 'rotateIn',
    HEART: 'pulse',
    VIDEO: 'fadeIn',
  };

  return recommendations[elementType] || 'fadeIn';
}

/**
 * Get recommended easing based on animation type
 */
export function getRecommendedEasing(animationType: AnimationType): EasingType {
  const easingMap: Record<string, EasingType> = {
    // Entrance animations - ease out
    fadeIn: 'ease-out',
    slideInLeft: 'power2.out',
    slideInRight: 'power2.out',
    slideInUp: 'power2.out',
    slideInDown: 'power2.out',
    scaleIn: 'back.out',
    rotateIn: 'power3.out',
    flipIn: 'back.out',
    zoomIn: 'power3.out',
    rollIn: 'power2.out',

    // Exit animations - ease in
    fadeOut: 'ease-in',
    slideOutLeft: 'power2.in',
    slideOutRight: 'power2.in',
    slideOutUp: 'power2.in',
    slideOutDown: 'power2.in',
    scaleOut: 'back.in',
    rotateOut: 'power3.in',
    flipOut: 'back.in',
    zoomOut: 'power3.in',
    rollOut: 'power2.in',

    // Attention animations - ease in-out
    pulse: 'ease-in-out',
    bounce: 'bounce.out',
    shake: 'linear',
    wiggle: 'ease-in-out',
    flash: 'linear',
    swing: 'ease-in-out',
    tada: 'ease-out',
    heartbeat: 'ease-in-out',
  };

  return easingMap[animationType] || 'ease-out';
}

// ==================== Animation Performance ====================

/**
 * Check if animation is performance-friendly
 */
export function isPerformanceFriendly(config: AnimationConfig): {
  isOptimal: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let isOptimal = true;

  // Check duration
  if (config.duration > 1500) {
    warnings.push('Duration > 1500ms may feel slow');
    isOptimal = false;
  }

  // Check delay
  if (config.delay > 1000) {
    warnings.push('Delay > 1000ms may feel unresponsive');
    isOptimal = false;
  }

  // Check repeats
  if (config.repeat !== -1 && config.repeat && config.repeat > 5) {
    warnings.push('Many repeats may be distracting');
    isOptimal = false;
  }

  return { isOptimal, warnings };
}

/**
 * Optimize animation configuration
 */
export function optimizeAnimation(config: AnimationConfig): AnimationConfig {
  return {
    ...config,
    duration: Math.min(config.duration, 1500),
    delay: Math.min(config.delay, 1000),
    repeat: config.repeat === -1 ? -1 : Math.min(config.repeat || 1, 5),
  };
}

// ==================== Animation Presets Management ====================

/**
 * Create custom preset
 */
export function createCustomPreset(
  id: string,
  name: string,
  animation: Partial<ElementAnimation>
) {
  return {
    id,
    name,
    category: 'custom' as const,
    description: 'Custom animation',
    ...animation,
  };
}

// ==================== Billboard Helpers ====================

/**
 * Create billboard loop animation
 */
export function createBillboardLoop(
  enterType: AnimationType = 'slideInDown',
  duration: number = 1000,
  displayTime: number = 5000
): ElementAnimation {
  return {
    enabled: true,
    enter: {
      type: enterType,
      duration,
      delay: 0,
      easing: 'power4.out',
      repeat: -1,
      repeatDelay: displayTime,
    },
  };
}

/**
 * Create playlist sequence (multiple elements with timing)
 */
export function createPlaylistSequence(
  elements: CanvasElement[],
  itemDuration: number = 5000,
  transitionDuration: number = 1000
): CanvasElement[] {
  return elements.map((element, index) => ({
    ...element,
    animation: {
      enabled: true,
      enter: {
        type: 'fadeIn',
        duration: transitionDuration,
        delay: index * (itemDuration + transitionDuration),
        easing: 'ease-out',
      },
      exit: {
        type: 'fadeOut',
        duration: transitionDuration,
        delay: (index + 1) * (itemDuration + transitionDuration) - transitionDuration,
        easing: 'ease-in',
      },
    },
  }));
}

// ==================== Accessibility ====================

/**
 * Check if animation respects reduced motion preference
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Create reduced motion version of animation
 */
export function createReducedMotionAnimation(
  config: AnimationConfig
): AnimationConfig {
  // For reduced motion, only use fade animations
  const reducedType: AnimationType = config.type.includes('Out') ? 'fadeOut' : 'fadeIn';

  return {
    ...config,
    type: reducedType,
    duration: Math.min(config.duration, 200), // Faster
    repeat: 1, // No loops
  };
}

/**
 * Apply reduced motion to all elements
 */
export function applyReducedMotion(elements: CanvasElement[]): CanvasElement[] {
  if (!shouldReduceMotion()) return elements;

  return elements.map(element => {
    if (!element.animation) return element;

    return {
      ...element,
      animation: {
        ...element.animation,
        enter: element.animation.enter
          ? createReducedMotionAnimation(element.animation.enter)
          : undefined,
        exit: element.animation.exit
          ? createReducedMotionAnimation(element.animation.exit)
          : undefined,
      },
    };
  });
}
