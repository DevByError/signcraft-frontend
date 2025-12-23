/**
 * CapCut-Style Animation Presets for UI Dropdowns
 * 
 * Clean, categorized lists of IN and OUT animation preset names.
 * These are UI-friendly names that map to full animation definitions.
 * 
 * PRINCIPLE: Names only, no implementations here.
 * Implementations are in services/CapCutAnimationEngine.ts
 */

export const IN_ANIMATIONS = {
  // Basic Entrance Animations
  basic: [
    'Fade In',
    'Pop In',
    'Grow In',
  ],

  // Slide Animations
  slide: [
    'Slide In Left',
    'Slide In Right',
    'Slide In Top',
    'Slide In Bottom',
  ],

  // Bounce & Elastic
  bounce: [
    'Bounce In',
    'Elastic In',
    'Spring In',
  ],

  // Zoom Animations
  zoom: [
    'Zoom In',
    'Zoom In Soft',
    'Zoom Rotate In',
  ],

  // Flip & Rotate
  rotate: [
    'Flip In Horizontal',
    'Flip In Vertical',
    'Rotate In',
  ],

  // Premium Effects
  premium: [
    'Neon Glow In',
    'Blur Fade In',
    'Glass Morphism In',
    'Liquid Swipe In',
  ],

  // Attention
  attention: [
    'Flash',
    'Pulse',
    'Heartbeat',
  ],
} as const;

export const OUT_ANIMATIONS = {
  // Basic Exit Animations
  basic: [
    'Fade Out',
    'Pop Out',
    'Shrink Out',
  ],

  // Slide Animations
  slide: [
    'Slide Out Left',
    'Slide Out Right',
    'Slide Out Top',
    'Slide Out Bottom',
  ],

  // Bounce & Elastic
  bounce: [
    'Bounce Out',
    'Elastic Out',
    'Spring Out',
  ],

  // Zoom Animations
  zoom: [
    'Zoom Out',
    'Zoom Out Soft',
    'Zoom Rotate Out',
  ],

  // Flip & Rotate
  rotate: [
    'Flip Out Horizontal',
    'Flip Out Vertical',
    'Rotate Out',
  ],

  // Premium Effects
  premium: [
    'Neon Glow Out',
    'Blur Fade Out',
    'Glass Morphism Out',
    'Liquid Swipe Out',
  ],

  // Attention
  attention: [
    'Flash Out',
    'Pulse Out',
    'Heartbeat Out',
  ],
} as const;

/**
 * Flatten IN animations for simple dropdown (all categories)
 */
export const IN_ANIMATION_LIST = Object.values(IN_ANIMATIONS).flat();

/**
 * Flatten OUT animations for simple dropdown (all categories)
 */
export const OUT_ANIMATION_LIST = Object.values(OUT_ANIMATIONS).flat();

/**
 * Get category for an IN animation name
 */
export function getInAnimationCategory(name: string): keyof typeof IN_ANIMATIONS | null {
  for (const [category, animations] of Object.entries(IN_ANIMATIONS)) {
    if ((animations as readonly string[]).includes(name)) {
      return category as keyof typeof IN_ANIMATIONS;
    }
  }
  return null;
}

/**
 * Get category for an OUT animation name
 */
export function getOutAnimationCategory(name: string): keyof typeof OUT_ANIMATIONS | null {
  for (const [category, animations] of Object.entries(OUT_ANIMATIONS)) {
    if ((animations as readonly string[]).includes(name)) {
      return category as keyof typeof OUT_ANIMATIONS;
    }
  }
  return null;
}
