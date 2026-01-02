/**
 * Animation System - Main Export
 * Central export point for all animation-related modules
 */

// ==================== Types ====================
export type {
  Animation,
  EasingType,
  TriggerType,
  AnimationConfig,
  AnimationTrigger,
  ElementAnimation,
  AnimationState,
  AnimationPreset,
  AnimationKeyframe,
  AnimationTimeline,
  AnimationGroup,
  AnimationExport,
} from './types/animation';

// ==================== Services ====================
export {
  animationEngine,
  getDefaultAnimationConfig,
  getAnimationCategories,
  validateAnimationConfig,
} from './services/animationService';

// ==================== Components ====================
export { AnimationPanel } from './components/AnimationPanel';
export { AnimationToolbar } from './components/AnimationToolbar';
export { AnimationPlayback } from './components/AnimationPlayback';
export { PreviewModeControls, PreviewModeBanner } from './components/PreviewMode';
export { AnimationPresetGallery } from './components/AnimationPresetGallery';

// ==================== Hooks ====================
export {
  useAnimation,
  useDragAnimation,
  useGroupAnimation,
} from './hooks/useAnimation';

export { usePreviewMode } from './hooks/usePreviewMode';

// ==================== Presets ====================
export {
  ANIMATION_PRESETS,
  getPresetsByCategory,
  getPresetById,
  applyPreset,
} from './constants/animationPresets';

// ==================== Utilities ====================
export {
  createAnimation,
  createEnterExitAnimation,
  createLoopingAnimation,
  calculateTotalDuration,
  createSequentialDelays,
  applySequentialDelays,
  isValidAnimation,
  hasAnimation,
  hasEnterAnimation,
  hasExitAnimation,
  cloneAnimation,
  copyAnimationToElements,
  scaleAnimationSpeed,
  scaleAllAnimationSpeeds,
  getAnimatedElements,
  getElementsByAnimationType,
  countAnimatedElements,
  exportAnimations,
  importAnimations,
  getRecommendedAnimation,
  getRecommendedEasing,
  isPerformanceFriendly,
  optimizeAnimation,
  createCustomPreset,
  createBillboardLoop,
  createPlaylistSequence,
  shouldReduceMotion,
  createReducedMotionAnimation,
  applyReducedMotion,
} from './utils/animationHelpers';

// ==================== Quick Start Helpers ====================

/**
 * Quick start: Apply a fade in animation
 */
export function quickFadeIn(duration: number = 500) {
  return {
    enabled: true,
    enter: {
      type: 'fadeIn' as const,
      duration,
      delay: 0,
      easing: 'ease-out' as const,
      repeat: 1,
    },
  };
}

/**
 * Quick start: Apply a slide animation
 */
export function quickSlide(
  direction: 'left' | 'right' | 'up' | 'down' = 'left',
  duration: number = 600
) {
  const typeMap = {
    left: 'slideInLeft' as const,
    right: 'slideInRight' as const,
    up: 'slideInUp' as const,
    down: 'slideInDown' as const,
  };

  return {
    enabled: true,
    enter: {
      type: typeMap[direction],
      duration,
      delay: 0,
      easing: 'power2.out' as const,
      repeat: 1,
    },
  };
}

/**
 * Quick start: Apply a pulse animation (looping)
 */
export function quickPulse(duration: number = 1000) {
  return {
    enabled: true,
    enter: {
      type: 'pulse' as const,
      duration,
      delay: 0,
      easing: 'ease-in-out' as const,
      repeat: -1,
      repeatDelay: 500,
    },
  };
}

// ==================== Version ====================
export const ANIMATION_SYSTEM_VERSION = '1.0.0';
