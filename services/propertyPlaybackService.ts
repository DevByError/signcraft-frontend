/**
 * Property Playback Engine - CapCut Style
 * Stateless rendering using clip-local time and keyframe animations
 * 
 * CRITICAL PRINCIPLES:
 * 1. Stateless - pure functions only
 * 2. Clip-local time for animations
 * 3. Global timeline time for clip activation
 * 4. Clips only render when active (startTime <= time <= startTime + duration)
 */

import { CanvasElement } from '../types';
import { TimelineItem, Timeline } from '../types/timeline';
import * as timelineService from './timelineService';
import * as animationEngine from './animationEngine';

// ==================== Clip Activation ====================

/**
 * Check if timeline item (clip) should be rendered at current time
 */
function isItemActive(item: TimelineItem, timelineTimeMs: number): boolean {
  return animationEngine.isClipActive(item.startTime, item.duration, timelineTimeMs);
}

// ==================== Property Application with Animations ====================

/**
 * Apply timeline item properties and animations to canvas element
 * This is a STATELESS function - same inputs always produce same outputs
 * 
 * @param element - The canvas element to update
 * @param item - The timeline item with properties and animations
 * @param timelineTimeMs - Current timeline time in milliseconds
 * @param isPlaying - Whether timeline is currently playing (affects visibility)
 */
export function applyItemPropertiesToElement(
  element: CanvasElement,
  item: TimelineItem,
  timelineTimeMs: number,
  isPlaying: boolean = false
): CanvasElement {
  // Check if item is active
  const isActive = isItemActive(item, timelineTimeMs);
  
  if (!isActive) {
    // PARTITION RULE: Element only exists in its time partition
    return {
      ...element,
      visible: isPlaying ? false : true,
      opacity: isPlaying ? 0 : (element.opacity || 1),
    };
  }

  // Start with base properties from timeline item
  const updatedElement: CanvasElement = {
    ...element,
    visible: true,
  };

  // Apply stored properties from timeline item (base values)
  if (item.properties) {
    if (item.properties.x !== undefined) updatedElement.x = item.properties.x;
    if (item.properties.y !== undefined) updatedElement.y = item.properties.y;
    if (item.properties.width !== undefined) updatedElement.width = item.properties.width;
    if (item.properties.height !== undefined) updatedElement.height = item.properties.height;
    if (item.properties.rotation !== undefined) updatedElement.rotation = item.properties.rotation;
    if (item.properties.zIndex !== undefined) updatedElement.zIndex = item.properties.zIndex;
    if (item.properties.color !== undefined) updatedElement.color = item.properties.color;
    if (item.properties.backgroundColor !== undefined) updatedElement.backgroundColor = item.properties.backgroundColor;
    if (item.properties.fillColor !== undefined) updatedElement.fillColor = item.properties.fillColor;
    if (item.properties.fontSize !== undefined) updatedElement.fontSize = item.properties.fontSize;
  }

  // Calculate clip-local time
  const clipLocalTimeMs = animationEngine.getClipLocalTime(item.startTime, timelineTimeMs);

  // Apply CapCut-style keyframe animations if present
  if (item.animations && item.animations.length > 0) {
    const baseValues = {
      opacity: item.properties?.opacity ?? element.opacity ?? 1,
      position: { 
        x: item.properties?.x ?? element.x, 
        y: item.properties?.y ?? element.y 
      },
      scale: { x: 1, y: 1 },
      rotation: item.properties?.rotation ?? element.rotation ?? 0,
    };

    const animated = animationEngine.evaluateAnimations(
      item.animations,
      clipLocalTimeMs,
      baseValues
    );

    // Apply animated values
    updatedElement.opacity = animated.opacity;
    updatedElement.x = animated.position.x;
    updatedElement.y = animated.position.y;
    updatedElement.rotation = animated.rotation;

    // Apply scale (if needed, multiply width/height)
    if (animated.scale.x !== 1 || animated.scale.y !== 1) {
      updatedElement.width = updatedElement.width * animated.scale.x;
      updatedElement.height = updatedElement.height * animated.scale.y;
    }
  } else {
    // Legacy: Apply old transition effects if no animations
    if (item.transition) {
      const progress = timelineService.getItemProgress(item, timelineTimeMs);
      if (progress !== null) {
        const transitionOpacity = timelineService.applyTransition(item, progress);
        const baseOpacity = item.properties?.opacity ?? element.opacity ?? 1;
        updatedElement.opacity = baseOpacity * transitionOpacity;
      }
    }
  }

  return updatedElement;
}

/**
 * Apply timeline state to all elements
 * STATELESS RENDERER - pure function, no side effects
 * 
 * CANVA + CAPCUT HYBRID:
 * - When editing (not playing): All elements visible for editing
 * - When playing: Only active timeline clips visible
 */
export function applyTimelineToElements(
  elements: CanvasElement[],
  timeline: Timeline
): CanvasElement[] {
  const timelineTimeMs = timeline.currentTime;
  const isPlaying = timeline.isPlaying;
  
  // Get all timeline items
  const allItems = timeline.tracks.flatMap(track => track.items);
  
  // Map to store which elements are active
  const activeElementIds = new Set<string>();
  const elementUpdates = new Map<string, CanvasElement>();

  // Process each timeline item (clip)
  for (const item of allItems) {
    // Check if clip is active at current timeline time
    if (isItemActive(item, timelineTimeMs)) {
      activeElementIds.add(item.elementId);
      
      const element = elements.find(el => el.id === item.elementId);
      if (element) {
        const updatedElement = applyItemPropertiesToElement(element, item, timelineTimeMs, isPlaying);
        elementUpdates.set(item.elementId, updatedElement);
      }
    } else if (!isPlaying) {
      // When not playing, also process inactive items to keep them visible
      const element = elements.find(el => el.id === item.elementId);
      if (element) {
        const updatedElement = applyItemPropertiesToElement(element, item, timelineTimeMs, isPlaying);
        elementUpdates.set(item.elementId, updatedElement);
      }
    }
  }

  // Apply updates to elements
  return elements.map(element => {
    if (elementUpdates.has(element.id)) {
      return elementUpdates.get(element.id)!;
    }
    
    // Check if element has timeline item
    const hasTimelineItem = allItems.some(item => item.elementId === element.id);
    
    if (hasTimelineItem) {
      // CLEAR PARTITION BEHAVIOR:
      // Each element has its own time partition
      // When not in its partition time: hide during playback, show during editing
      if (!activeElementIds.has(element.id)) {
        if (isPlaying) {
          // During playback: STRICTLY hide elements outside their partition
          return { ...element, visible: false, opacity: 0 };
        } else {
          // During editing: keep all elements visible for editing
          return { ...element, visible: true };
        }
      }
    }
    
    // Element not in timeline - show as normal
    return element;
  });
}

// ==================== Sequential Playback Helpers ====================

/**
 * Calculate when each element should appear in sequence
 */
export function calculateSequentialTimings(
  elements: CanvasElement[],
  durationPerElement: number = 5000,
  gap: number = 500
): Map<string, { startTime: number; duration: number }> {
  const timings = new Map<string, { startTime: number; duration: number }>();
  
  // Sort by zIndex to maintain layer order
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  
  let currentTime = 0;
  for (const element of sortedElements) {
    timings.set(element.id, {
      startTime: currentTime,
      duration: durationPerElement,
    });
    currentTime += durationPerElement + gap;
  }
  
  return timings;
}

/**
 * Get visible elements at specific time
 */
export function getVisibleElementsAtTime(
  timeline: Timeline,
  time: number
): string[] {
  const visibleElementIds: string[] = [];
  
  for (const track of timeline.tracks) {
    if (!track.visible) continue;
    
    for (const item of track.items) {
      const progress = timelineService.getItemProgress(item, time);
      if (progress !== null) {
        visibleElementIds.push(item.elementId);
      }
    }
  }
  
  return visibleElementIds;
}

// ==================== Property Interpolation ====================

/**
 * Interpolate between two values
 */
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Interpolate element properties for smooth animations
 */
export function interpolateProperties(
  startProperties: Partial<CanvasElement>,
  endProperties: Partial<CanvasElement>,
  progress: number
): Partial<CanvasElement> {
  const result: Partial<CanvasElement> = {};
  
  // Interpolate numeric properties
  const numericProps: (keyof CanvasElement)[] = ['x', 'y', 'width', 'height', 'opacity', 'rotation', 'fontSize'];
  
  for (const prop of numericProps) {
    const start = startProperties[prop] as number | undefined;
    const end = endProperties[prop] as number | undefined;
    
    if (start !== undefined && end !== undefined) {
      (result as any)[prop] = lerp(start, end, progress);
    }
  }
  
  return result;
}

// ==================== Validation ====================

/**
 * Validate element properties are within valid ranges
 */
export function validateElementProperties(element: CanvasElement): CanvasElement {
  return {
    ...element,
    x: isFinite(element.x) ? element.x : 0,
    y: isFinite(element.y) ? element.y : 0,
    width: Math.max(1, isFinite(element.width) ? element.width : 100),
    height: Math.max(1, isFinite(element.height) ? element.height : 100),
    opacity: Math.max(0, Math.min(1, isFinite(element.opacity) ? element.opacity : 1)),
    rotation: isFinite(element.rotation) ? element.rotation % 360 : 0,
    zIndex: Math.floor(isFinite(element.zIndex) ? element.zIndex : 0),
  };
}

/**
 * Ensure all elements have required properties
 */
export function ensureElementDefaults(element: Partial<CanvasElement>): CanvasElement {
  return {
    id: element.id || `element-${Date.now()}`,
    type: element.type || 'RECT' as any,
    content: element.content || '',
    x: element.x ?? 0,
    y: element.y ?? 0,
    width: element.width ?? 100,
    height: element.height ?? 100,
    opacity: element.opacity ?? 1,
    rotation: element.rotation ?? 0,
    zIndex: element.zIndex ?? 0,
    visible: element.visible ?? true,
    locked: element.locked ?? false,
    ...element,
  } as CanvasElement;
}
