/**
 * Animation Presets
 * Pre-configured animation combinations (Canva-style)
 */

import { AnimationPreset } from '../types/animation';

export const ANIMATION_PRESETS: AnimationPreset[] = [
  // ==================== Featured ====================
  {
    id: 'shake-zoom',
    name: 'Shake Zoom',
    category: 'featured',
    description: 'Shake while zooming in',
    enter: {
      type: 'shake',
      duration: 800,
      delay: 0,
      easing: 'power2.out',
      repeat: 1,
    },
  },
  {
    id: 'whip-slide',
    name: 'Whip Slide',
    category: 'featured',
    description: 'Fast slide with elastic effect',
    enter: {
      type: 'slideInLeft',
      duration: 400,
      delay: 0,
      easing: 'back.out',
    },
  },
  {
    id: 'old-tv',
    name: 'Old TV',
    category: 'featured',
    description: 'Vintage TV scan effect',
    enter: {
      type: 'scaleIn',
      duration: 600,
      delay: 0,
      easing: 'power4.out',
    },
  },
  {
    id: 'chroma-wave',
    name: 'Chroma Wave',
    category: 'featured',
    description: 'Colorful wave effect',
    enter: {
      type: 'wiggle',
      duration: 1000,
      delay: 0,
      easing: 'elastic.out',
    },
  },

  // ==================== Reveal ====================
  {
    id: 'brush',
    name: 'Brush',
    category: 'reveal',
    description: 'Paint brush reveal',
    enter: {
      type: 'fadeIn',
      duration: 800,
      delay: 0,
      easing: 'power2.out',
    },
  },
  {
    id: 'ink',
    name: 'Ink',
    category: 'reveal',
    description: 'Ink splatter reveal',
    enter: {
      type: 'scaleIn',
      duration: 600,
      delay: 0,
      easing: 'elastic.out',
    },
  },
  {
    id: 'digital',
    name: 'Digital',
    category: 'reveal',
    description: 'Digital pixelated reveal',
    enter: {
      type: 'fadeIn',
      duration: 500,
      delay: 0,
      easing: 'power1.out',
    },
  },
  {
    id: 'spray-paint',
    name: 'Spray Paint',
    category: 'reveal',
    description: 'Spray paint effect',
    enter: {
      type: 'fadeIn',
      duration: 700,
      delay: 0,
      easing: 'power2.out',
    },
  },
  {
    id: 'sketch',
    name: 'Sketch',
    category: 'reveal',
    description: 'Hand-drawn sketch reveal',
    enter: {
      type: 'slideInUp',
      duration: 800,
      delay: 0,
      easing: 'power2.out',
    },
  },
  {
    id: 'gradient',
    name: 'Gradient',
    category: 'reveal',
    description: 'Gradient wipe reveal',
    enter: {
      type: 'slideInLeft',
      duration: 700,
      delay: 0,
      easing: 'power2.out',
    },
  },

  // ==================== General ====================
  {
    id: 'rise',
    name: 'Rise',
    category: 'general',
    description: 'Rise up from bottom',
    enter: {
      type: 'slideInUp',
      duration: 600,
      delay: 0,
      easing: 'power2.out',
    },
  },
  {
    id: 'pan',
    name: 'Pan',
    category: 'general',
    description: 'Pan from side',
    enter: {
      type: 'slideInLeft',
      duration: 600,
      delay: 0,
      easing: 'power2.out',
    },
  },
  {
    id: 'fade',
    name: 'Fade',
    category: 'general',
    description: 'Simple fade in',
    enter: {
      type: 'fadeIn',
      duration: 500,
      delay: 0,
      easing: 'ease-out',
    },
  },
  {
    id: 'pop',
    name: 'Pop',
    category: 'general',
    description: 'Pop in with bounce',
    enter: {
      type: 'scaleIn',
      duration: 500,
      delay: 0,
      easing: 'back.out',
    },
  },
  {
    id: 'wipe',
    name: 'Wipe',
    category: 'general',
    description: 'Wipe across screen',
    enter: {
      type: 'slideInRight',
      duration: 600,
      delay: 0,
      easing: 'power2.out',
    },
  },
  {
    id: 'blur',
    name: 'Blur',
    category: 'general',
    description: 'Fade in from blur',
    enter: {
      type: 'fadeIn',
      duration: 700,
      delay: 0,
      easing: 'power2.out',
    },
  },

  // ==================== Effects ====================
  {
    id: 'succession',
    name: 'Succession',
    category: 'effects',
    description: 'Elements appear in sequence',
    enter: {
      type: 'fadeIn',
      duration: 400,
      delay: 0,
      easing: 'power2.out',
    },
  },
  {
    id: 'breathe',
    name: 'Breathe',
    category: 'effects',
    description: 'Gentle breathing animation',
    enter: {
      type: 'pulse',
      duration: 2000,
      delay: 0,
      easing: 'power1.inOut',
      repeat: -1,
    },
  },
  {
    id: 'baseline',
    name: 'Baseline',
    category: 'effects',
    description: 'Bounce from baseline',
    enter: {
      type: 'slideInUp',
      duration: 600,
      delay: 0,
      easing: 'bounce.out',
    },
  },
  {
    id: 'drift',
    name: 'Drift',
    category: 'effects',
    description: 'Slow drifting motion',
    enter: {
      type: 'slideInLeft',
      duration: 1000,
      delay: 0,
      easing: 'power1.out',
    },
  },
  {
    id: 'tectonic',
    name: 'Tectonic',
    category: 'effects',
    description: 'Earthquake shake effect',
    enter: {
      type: 'shake',
      duration: 600,
      delay: 0,
      easing: 'power2.out',
    },
  },
  {
    id: 'tumble',
    name: 'Tumble',
    category: 'effects',
    description: 'Tumbling rotation',
    enter: {
      type: 'rotateIn',
      duration: 800,
      delay: 0,
      easing: 'power2.out',
    },
  },
  {
    id: 'neon',
    name: 'Neon',
    category: 'effects',
    description: 'Neon glow flicker',
    enter: {
      type: 'flash',
      duration: 500,
      delay: 0,
      easing: 'power2.out',
      repeat: 2,
    },
  },
  {
    id: 'scrapbook',
    name: 'Scrapbook',
    category: 'effects',
    description: 'Scrapbook paste effect',
    enter: {
      type: 'rotateIn',
      duration: 600,
      delay: 0,
      easing: 'back.out',
    },
  },
  {
    id: 'stomp',
    name: 'Stomp',
    category: 'effects',
    description: 'Heavy stomp impact',
    enter: {
      type: 'bounce',
      duration: 700,
      delay: 0,
      easing: 'bounce.out',
    },
  },

  // ==================== Add-on Effects ====================
  {
    id: 'rotate',
    name: 'Rotate',
    category: 'addon',
    description: 'Continuous rotation',
    enter: {
      type: 'rotateIn',
      duration: 1000,
      delay: 0,
      easing: 'linear',
      repeat: -1,
    },
  },
  {
    id: 'flicker',
    name: 'Flicker',
    category: 'addon',
    description: 'Flickering effect',
    enter: {
      type: 'flash',
      duration: 300,
      delay: 0,
      easing: 'power1.inOut',
      repeat: -1,
    },
  },
  {
    id: 'pulse',
    name: 'Pulse',
    category: 'addon',
    description: 'Pulsing scale effect',
    enter: {
      type: 'pulse',
      duration: 1000,
      delay: 0,
      easing: 'power2.inOut',
      repeat: -1,
    },
  },
  {
    id: 'wiggle',
    name: 'Wiggle',
    category: 'addon',
    description: 'Wiggling motion',
    enter: {
      type: 'wiggle',
      duration: 800,
      delay: 0,
      easing: 'power1.inOut',
      repeat: -1,
    },
  },

  // ==================== Basic Presets ====================
  {
    id: 'fade-in-out',
    name: 'Fade In/Out',
    category: 'basic',
    description: 'Simple fade in and fade out',
    enter: {
      type: 'fadeIn',
      duration: 500,
      delay: 0,
      easing: 'ease-out',
    },
    exit: {
      type: 'fadeOut',
      duration: 500,
      delay: 0,
      easing: 'ease-in',
    },
  },
  {
    id: 'slide-from-left',
    name: 'Slide From Left',
    category: 'basic',
    description: 'Slide in from left, slide out to right',
    enter: {
      type: 'slideInLeft',
      duration: 600,
      delay: 0,
      easing: 'power2.out',
    },
    exit: {
      type: 'slideOutRight',
      duration: 600,
      delay: 0,
      easing: 'power2.in',
    },
  },
  {
    id: 'slide-from-right',
    name: 'Slide From Right',
    category: 'basic',
    description: 'Slide in from right, slide out to left',
    enter: {
      type: 'slideInRight',
      duration: 600,
      delay: 0,
      easing: 'power2.out',
    },
    exit: {
      type: 'slideOutLeft',
      duration: 600,
      delay: 0,
      easing: 'power2.in',
    },
  },
  {
    id: 'slide-from-top',
    name: 'Slide From Top',
    category: 'basic',
    description: 'Slide in from top, slide out to bottom',
    enter: {
      type: 'slideInDown',
      duration: 600,
      delay: 0,
      easing: 'power2.out',
    },
    exit: {
      type: 'slideOutDown',
      duration: 600,
      delay: 0,
      easing: 'power2.in',
    },
  },
  {
    id: 'slide-from-bottom',
    name: 'Slide From Bottom',
    category: 'basic',
    description: 'Slide in from bottom, slide out to top',
    enter: {
      type: 'slideInUp',
      duration: 600,
      delay: 0,
      easing: 'power2.out',
    },
    exit: {
      type: 'slideOutUp',
      duration: 600,
      delay: 0,
      easing: 'power2.in',
    },
  },
  {
    id: 'scale-pop',
    name: 'Scale Pop',
    category: 'basic',
    description: 'Pop in with scale, pop out',
    enter: {
      type: 'scaleIn',
      duration: 400,
      delay: 0,
      easing: 'back.out',
    },
    exit: {
      type: 'scaleOut',
      duration: 300,
      delay: 0,
      easing: 'back.in',
    },
  },
  {
    id: 'rotate-entrance',
    name: 'Rotate Entrance',
    category: 'basic',
    description: 'Rotate in with fade',
    enter: {
      type: 'rotateIn',
      duration: 800,
      delay: 0,
      easing: 'power3.out',
    },
    exit: {
      type: 'rotateOut',
      duration: 600,
      delay: 0,
      easing: 'power3.in',
    },
  },

  // ==================== Attention Presets ====================
  {
    id: 'pulse-continuous',
    name: 'Pulse',
    category: 'attention',
    description: 'Continuous pulsing effect',
    enter: {
      type: 'pulse',
      duration: 1000,
      delay: 0,
      easing: 'ease-in-out',
      repeat: -1, // Infinite
      repeatDelay: 500,
    },
  },
  {
    id: 'bounce-attention',
    name: 'Bounce',
    category: 'attention',
    description: 'Bouncing effect',
    enter: {
      type: 'bounce',
      duration: 1000,
      delay: 0,
      easing: 'ease-out',
      repeat: -1,
      repeatDelay: 2000,
    },
  },
  {
    id: 'shake-alert',
    name: 'Shake Alert',
    category: 'attention',
    description: 'Shake to grab attention',
    enter: {
      type: 'shake',
      duration: 500,
      delay: 0,
      easing: 'linear',
      repeat: 3,
      repeatDelay: 2000,
    },
  },
  {
    id: 'wiggle',
    name: 'Wiggle',
    category: 'attention',
    description: 'Gentle wiggle effect',
    enter: {
      type: 'wiggle',
      duration: 500,
      delay: 0,
      easing: 'ease-in-out',
      repeat: -1,
      repeatDelay: 3000,
    },
  },
  {
    id: 'flash-blink',
    name: 'Flash',
    category: 'attention',
    description: 'Flashing effect',
    enter: {
      type: 'flash',
      duration: 600,
      delay: 0,
      easing: 'linear',
      repeat: -1,
      repeatDelay: 2000,
    },
  },
  {
    id: 'swing',
    name: 'Swing',
    category: 'attention',
    description: 'Swinging pendulum effect',
    enter: {
      type: 'swing',
      duration: 1000,
      delay: 0,
      easing: 'ease-in-out',
      repeat: 2,
      repeatDelay: 1000,
    },
  },
  {
    id: 'tada',
    name: 'Tada',
    category: 'attention',
    description: 'Celebration effect',
    enter: {
      type: 'tada',
      duration: 800,
      delay: 0,
      easing: 'ease-out',
      repeat: 1,
    },
  },
  {
    id: 'heartbeat',
    name: 'Heartbeat',
    category: 'attention',
    description: 'Heartbeat pulse',
    enter: {
      type: 'heartbeat',
      duration: 600,
      delay: 0,
      easing: 'ease-in-out',
      repeat: -1,
      repeatDelay: 1000,
    },
  },

  // ==================== Advanced Presets ====================
  {
    id: 'flip-card',
    name: 'Flip Card',
    category: 'advanced',
    description: '3D flip effect',
    enter: {
      type: 'flipIn',
      duration: 800,
      delay: 0,
      easing: 'back.out',
    },
    exit: {
      type: 'flipOut',
      duration: 600,
      delay: 0,
      easing: 'back.in',
    },
  },
  {
    id: 'zoom-dramatic',
    name: 'Zoom In/Out',
    category: 'advanced',
    description: 'Dramatic zoom effect',
    enter: {
      type: 'zoomIn',
      duration: 700,
      delay: 0,
      easing: 'power3.out',
    },
    exit: {
      type: 'zoomOut',
      duration: 500,
      delay: 0,
      easing: 'power3.in',
    },
  },
  {
    id: 'roll-entrance',
    name: 'Roll In',
    category: 'advanced',
    description: 'Rolling entrance',
    enter: {
      type: 'rollIn',
      duration: 900,
      delay: 0,
      easing: 'power2.out',
    },
    exit: {
      type: 'rollOut',
      duration: 700,
      delay: 0,
      easing: 'power2.in',
    },
  },

  // ==================== Combo Presets ====================
  {
    id: 'professional-slide',
    name: 'Professional Slide',
    category: 'advanced',
    description: 'Smooth professional slide with bounce',
    enter: {
      type: 'slideInLeft',
      duration: 800,
      delay: 0,
      easing: 'elastic.out',
    },
    exit: {
      type: 'slideOutRight',
      duration: 600,
      delay: 0,
      easing: 'power2.in',
    },
  },
  {
    id: 'billboard-dynamic',
    name: 'Billboard Dynamic',
    category: 'advanced',
    description: 'Perfect for billboard displays',
    enter: {
      type: 'slideInDown',
      duration: 1000,
      delay: 200,
      easing: 'power4.out',
    },
    exit: {
      type: 'slideOutUp',
      duration: 800,
      delay: 0,
      easing: 'power4.in',
    },
  },
];

/**
 * Get presets by category
 */
export function getPresetsByCategory(category: 'basic' | 'attention' | 'advanced'): AnimationPreset[] {
  return ANIMATION_PRESETS.filter(preset => preset.category === category);
}

/**
 * Get preset by ID
 */
export function getPresetById(id: string): AnimationPreset | undefined {
  return ANIMATION_PRESETS.find(preset => preset.id === id);
}

/**
 * Apply preset to element
 */
export function applyPreset(presetId: string) {
  const preset = getPresetById(presetId);
  if (!preset) return null;

  return {
    enabled: true,
    enter: preset.enter ? {
      ...preset.enter,
      repeat: preset.enter.repeat || 1,
      repeatDelay: preset.enter.repeatDelay || 0,
    } : undefined,
    exit: preset.exit ? {
      ...preset.exit,
      repeat: preset.exit.repeat || 1,
      repeatDelay: preset.exit.repeatDelay || 0,
    } : undefined,
  };
}
