/**
 * Animation Service
 * Core animation engine using GSAP
 */

import gsap from 'gsap';
import { 
  AnimationType, 
  AnimationConfig, 
  ElementAnimation,
  EasingType,
  AnimationState,
  AnimationGroup
} from '../types/animation';

// ==================== GSAP Easing Mapping ====================

const EASING_MAP: Record<EasingType, string> = {
  'linear': 'none',
  'ease-in': 'power1.in',
  'ease-out': 'power1.out',
  'ease-in-out': 'power1.inOut',
  'ease-back': 'back.out',
  'ease-elastic': 'elastic.out',
  'ease-bounce': 'bounce.out',
  'power1.in': 'power1.in',
  'power1.out': 'power1.out',
  'power1.inOut': 'power1.inOut',
  'power2.in': 'power2.in',
  'power2.out': 'power2.out',
  'power2.inOut': 'power2.inOut',
  'power3.in': 'power3.in',
  'power3.out': 'power3.out',
  'power3.inOut': 'power3.inOut',
  'power4.in': 'power4.in',
  'power4.out': 'power4.out',
  'power4.inOut': 'power4.inOut',
  'back.in': 'back.in',
  'back.out': 'back.out',
  'back.inOut': 'back.inOut',
  'elastic.in': 'elastic.in',
  'elastic.out': 'elastic.out',
  'elastic.inOut': 'elastic.inOut',
  'bounce.in': 'bounce.in',
  'bounce.out': 'bounce.out',
  'bounce.inOut': 'bounce.inOut',
};

// ==================== Animation Definitions ====================

interface AnimationDefinition {
  from: gsap.TweenVars;
  to: gsap.TweenVars;
}

const ANIMATION_DEFINITIONS: Record<AnimationType, (element: HTMLElement | any) => AnimationDefinition> = {
  // Basic - Fade
  fadeIn: () => ({
    from: { opacity: 0 },
    to: { opacity: 1 },
  }),
  fadeOut: () => ({
    from: { opacity: 1 },
    to: { opacity: 0 },
  }),

  // Basic - Slide
  slideInLeft: () => ({
    from: { x: -100, opacity: 0 },
    to: { x: 0, opacity: 1 },
  }),
  slideInRight: () => ({
    from: { x: 100, opacity: 0 },
    to: { x: 0, opacity: 1 },
  }),
  slideInUp: () => ({
    from: { y: 100, opacity: 0 },
    to: { y: 0, opacity: 1 },
  }),
  slideInDown: () => ({
    from: { y: -100, opacity: 0 },
    to: { y: 0, opacity: 1 },
  }),
  slideOutLeft: () => ({
    from: { x: 0, opacity: 1 },
    to: { x: -100, opacity: 0 },
  }),
  slideOutRight: () => ({
    from: { x: 0, opacity: 1 },
    to: { x: 100, opacity: 0 },
  }),
  slideOutUp: () => ({
    from: { y: 0, opacity: 1 },
    to: { y: -100, opacity: 0 },
  }),
  slideOutDown: () => ({
    from: { y: 0, opacity: 1 },
    to: { y: 100, opacity: 0 },
  }),

  // Basic - Scale
  scaleIn: () => ({
    from: { scale: 0, opacity: 0 },
    to: { scale: 1, opacity: 1 },
  }),
  scaleOut: () => ({
    from: { scale: 1, opacity: 1 },
    to: { scale: 0, opacity: 0 },
  }),

  // Basic - Rotate
  rotateIn: () => ({
    from: { rotation: -180, opacity: 0, scale: 0 },
    to: { rotation: 0, opacity: 1, scale: 1 },
  }),
  rotateOut: () => ({
    from: { rotation: 0, opacity: 1, scale: 1 },
    to: { rotation: 180, opacity: 0, scale: 0 },
  }),

  // Attention - Pulse
  pulse: () => ({
    from: { scale: 1 },
    to: { scale: 1.05, repeat: 1, yoyo: true },
  }),

  // Attention - Bounce
  bounce: () => ({
    from: { y: 0 },
    to: { y: -20, repeat: 3, yoyo: true, ease: 'bounce.out' },
  }),

  // Attention - Shake
  shake: () => ({
    from: { x: 0 },
    to: { x: -10, repeat: 5, yoyo: true, duration: 0.1 },
  }),

  // Attention - Wiggle
  wiggle: () => ({
    from: { rotation: 0 },
    to: { rotation: 5, repeat: 5, yoyo: true, duration: 0.1 },
  }),

  // Attention - Flash
  flash: () => ({
    from: { opacity: 1 },
    to: { opacity: 0, repeat: 3, yoyo: true, duration: 0.2 },
  }),

  // Attention - Swing
  swing: () => ({
    from: { rotation: 0, transformOrigin: 'top center' },
    to: { rotation: 15, repeat: 3, yoyo: true },
  }),

  // Attention - Tada
  tada: () => ({
    from: { scale: 1, rotation: 0 },
    to: { 
      scale: 1.1, 
      rotation: 3,
      repeat: 2,
      yoyo: true,
    },
  }),

  // Attention - Heartbeat
  heartbeat: () => ({
    from: { scale: 1 },
    to: { scale: 1.3, repeat: 2, yoyo: true, duration: 0.2 },
  }),

  // Advanced - Flip
  flipIn: () => ({
    from: { rotationY: 90, opacity: 0 },
    to: { rotationY: 0, opacity: 1 },
  }),
  flipOut: () => ({
    from: { rotationY: 0, opacity: 1 },
    to: { rotationY: 90, opacity: 0 },
  }),
  flipInX: () => ({
    from: { rotationX: 90, opacity: 0 },
    to: { rotationX: 0, opacity: 1 },
  }),
  flipOutX: () => ({
    from: { rotationX: 0, opacity: 1 },
    to: { rotationX: 90, opacity: 0 },
  }),
  flipInY: () => ({
    from: { rotationY: 90, opacity: 0 },
    to: { rotationY: 0, opacity: 1 },
  }),
  flipOutY: () => ({
    from: { rotationY: 0, opacity: 1 },
    to: { rotationY: 90, opacity: 0 },
  }),

  // Advanced - Zoom
  zoomIn: () => ({
    from: { scale: 0.3, opacity: 0 },
    to: { scale: 1, opacity: 1 },
  }),
  zoomOut: () => ({
    from: { scale: 1, opacity: 1 },
    to: { scale: 0.3, opacity: 0 },
  }),

  // Advanced - Roll
  rollIn: () => ({
    from: { x: -100, rotation: -120, opacity: 0 },
    to: { x: 0, rotation: 0, opacity: 1 },
  }),
  rollOut: () => ({
    from: { x: 0, rotation: 0, opacity: 1 },
    to: { x: 100, rotation: 120, opacity: 0 },
  }),

  // None
  none: () => ({
    from: {},
    to: {},
  }),
};

// ==================== Animation Engine ====================

class AnimationEngine {
  private animations: Map<string, gsap.core.Tween | gsap.core.Timeline> = new Map();
  private states: Map<string, AnimationState> = new Map();

  /**
   * Run animation on an element
   */
  async runAnimation(
    elementId: string,
    element: HTMLElement | any, // Can be DOM element or Konva node
    config: AnimationConfig,
    onComplete?: () => void
  ): Promise<void> {
    // Stop any existing animation on this element
    this.stopAnimation(elementId);

    // Get animation definition
    const definition = ANIMATION_DEFINITIONS[config.type];
    if (!definition) {
      console.warn(`Animation type "${config.type}" not found`);
      return;
    }

    const { from, to } = definition(element);

    // Convert duration from ms to seconds
    const duration = config.duration / 1000;
    const delay = config.delay / 1000;

    // Map easing
    const ease = EASING_MAP[config.easing] || 'power1.out';

    // Create animation
    const tween = gsap.fromTo(element, from, {
      ...to,
      duration,
      delay,
      ease,
      repeat: (config.repeat || 1) - 1, // GSAP uses 0 for play once
      repeatDelay: (config.repeatDelay || 0) / 1000,
      onComplete: () => {
        this.states.delete(elementId);
        onComplete?.();
      },
      onUpdate: () => {
        const progress = tween.progress();
        const timeElapsed = tween.time() * 1000;
        this.states.set(elementId, {
          isPlaying: true,
          isPaused: false,
          progress,
          timeElapsed,
          instance: tween,
        });
      },
    });

    // Store animation
    this.animations.set(elementId, tween);

    // Initialize state
    this.states.set(elementId, {
      isPlaying: true,
      isPaused: false,
      progress: 0,
      timeElapsed: 0,
      instance: tween,
    });

    return new Promise((resolve) => {
      tween.eventCallback('onComplete', () => {
        resolve();
      });
    });
  }

  /**
   * Run group animation with stagger
   */
  runGroupAnimation(
    group: AnimationGroup,
    elements: Array<HTMLElement | any>,
    onComplete?: () => void
  ): void {
    const { animation, stagger } = group;
    const definition = ANIMATION_DEFINITIONS[animation.type];
    
    if (!definition || elements.length === 0) return;

    const timeline = gsap.timeline({
      onComplete,
    });

    elements.forEach((element, index) => {
      const { from, to } = definition(element);
      const duration = animation.duration / 1000;
      const ease = EASING_MAP[animation.easing] || 'power1.out';
      const staggerDelay = (stagger / 1000) * index;

      timeline.fromTo(
        element,
        from,
        {
          ...to,
          duration,
          ease,
        },
        staggerDelay
      );
    });

    this.animations.set(group.id, timeline);
  }

  /**
   * Stop animation
   */
  stopAnimation(elementId: string): void {
    const animation = this.animations.get(elementId);
    if (animation) {
      animation.kill();
      this.animations.delete(elementId);
      this.states.delete(elementId);
    }
  }

  /**
   * Pause animation
   */
  pauseAnimation(elementId: string): void {
    const animation = this.animations.get(elementId);
    if (animation) {
      animation.pause();
      const state = this.states.get(elementId);
      if (state) {
        state.isPaused = true;
        state.isPlaying = false;
      }
    }
  }

  /**
   * Resume animation
   */
  resumeAnimation(elementId: string): void {
    const animation = this.animations.get(elementId);
    if (animation) {
      animation.resume();
      const state = this.states.get(elementId);
      if (state) {
        state.isPaused = false;
        state.isPlaying = true;
      }
    }
  }

  /**
   * Get animation state
   */
  getState(elementId: string): AnimationState | undefined {
    return this.states.get(elementId);
  }

  /**
   * Stop all animations
   */
  stopAll(): void {
    this.animations.forEach((animation) => animation.kill());
    this.animations.clear();
    this.states.clear();
  }

  /**
   * Preview animation (non-destructive, resets after completion)
   */
  async previewAnimation(
    element: HTMLElement | any,
    config: AnimationConfig
  ): Promise<void> {
    const tempId = 'preview-' + Date.now();
    
    // Store original state
    const originalState = {
      x: element.x?.() || element.offsetLeft || 0,
      y: element.y?.() || element.offsetTop || 0,
      opacity: element.opacity?.() || 1,
      rotation: element.rotation?.() || 0,
      scaleX: element.scaleX?.() || 1,
      scaleY: element.scaleY?.() || 1,
    };

    await this.runAnimation(tempId, element, config);

    // Reset to original state
    gsap.set(element, originalState);
  }
}

// ==================== Singleton Export ====================

export const animationEngine = new AnimationEngine();

// ==================== Helper Functions ====================

/**
 * Get default animation configuration
 */
export function getDefaultAnimationConfig(): AnimationConfig {
  return {
    type: 'fadeIn',
    duration: 500,
    delay: 0,
    easing: 'ease-out',
    repeat: 1,
    repeatDelay: 0,
  };
}

/**
 * Get animation categories with available types
 */
export function getAnimationCategories() {
  return {
    basic: {
      label: 'Basic',
      animations: [
        'fadeIn', 'fadeOut', 
        'slideInLeft', 'slideInRight', 'slideInUp', 'slideInDown',
        'slideOutLeft', 'slideOutRight', 'slideOutUp', 'slideOutDown',
        'scaleIn', 'scaleOut',
        'rotateIn', 'rotateOut'
      ] as AnimationType[],
    },
    attention: {
      label: 'Attention',
      animations: [
        'pulse', 'bounce', 'shake', 'wiggle', 
        'flash', 'swing', 'tada', 'heartbeat'
      ] as AnimationType[],
    },
    advanced: {
      label: 'Advanced',
      animations: [
        'flipIn', 'flipOut',
        'zoomIn', 'zoomOut',
        'rollIn', 'rollOut'
      ] as AnimationType[],
    },
  };
}

/**
 * Validate animation configuration
 */
export function validateAnimationConfig(config: Partial<AnimationConfig>): boolean {
  if (!config.type || !ANIMATION_DEFINITIONS[config.type]) {
    return false;
  }
  if (config.duration !== undefined && config.duration < 0) {
    return false;
  }
  if (config.delay !== undefined && config.delay < 0) {
    return false;
  }
  return true;
}
