/**
 * Timeline Service
 * Manages timeline operations for shapes, media, and audio sequencing
 */

import { 
  Timeline, 
  TimelineTrack, 
  TimelineItem, 
  TimelineAction,
  TimelineTrackType,
  TimelineConfig,
  TimelineExport,
  LayerAction,
  LayerInfo,
  TimelineMarker
} from '../types/timeline';
import { CanvasElement, ElementType } from '../types/canvas';
import * as animationEngine from './animationEngine';

// ==================== Default Configuration ====================

const DEFAULT_CONFIG: TimelineConfig = {
  defaultSnapInterval: 100, // 100ms
  defaultZoom: 50, // 50px per second
  minItemDuration: 100, // 100ms minimum
  gridIntervals: [10, 50, 100, 500, 1000, 5000], // Different grid intervals
  trackHeight: 60, // 60px per track
  maxVisualTracks: 20,
  maxAudioTracks: 5,
};

// Duration buffer (2 seconds) added to the latest element end time
const TIMELINE_DURATION_BUFFER = 2000;

// ==================== Helper Functions ====================

/**
 * Calculate dynamic timeline duration based on elements
 * Duration = (latest element end time) + buffer
 * This allows the timeline to grow and shrink based on content
 */
function calculateDynamicDuration(tracks: TimelineTrack[]): number {
  let maxEndTime = 0;

  // Find the latest end time of any element
  for (const track of tracks) {
    for (const item of track.items) {
      const itemEndTime = item.startTime + item.duration;
      maxEndTime = Math.max(maxEndTime, itemEndTime);
    }
  }

  // Return the end time plus a buffer for breathing room
  // If no items, return a minimum duration
  return maxEndTime > 0 ? maxEndTime + TIMELINE_DURATION_BUFFER : 5000;
}

// ==================== Timeline Creation ====================

/**
 * Create a new empty timeline
 */
export function createTimeline(designId: string): Timeline {
  const timeline = {
    id: `timeline-${Date.now()}`,
    designId,
    fps: 30, // Standard 30fps for consistency
    tracks: [
      createTrack('Visual Track 1', 'visual', 0),
      createTrack('Audio Track 1', 'audio', 0),
    ],
    totalDuration: 5000, // 5 seconds default (will grow with elements)
    currentTime: 0,
    isPlaying: false,
    loop: false,
    playbackSpeed: 1.0,
    snapInterval: DEFAULT_CONFIG.defaultSnapInterval,
    zoom: DEFAULT_CONFIG.defaultZoom,
  };
  
  return {
    ...timeline,
    totalDuration: calculateDynamicDuration(timeline.tracks),
  };
}

/**
 * Create a new track
 */
export function createTrack(
  name: string,
  type: TimelineTrackType,
  order: number
): TimelineTrack {
  return {
    id: `track-${Date.now()}-${Math.random()}`,
    name,
    type,
    order,
    items: [],
    visible: true,
    locked: false,
    muted: type === 'audio' ? false : undefined,
    volume: type === 'audio' ? 1.0 : undefined,
  };
}

/**
 * Create a timeline item from a canvas element with CapCut-style animations
 */
export function createTimelineItem(
  element: CanvasElement,
  startTime: number,
  duration: number,
  layer: number,
  trackType: TimelineTrackType = 'visual'
): TimelineItem {
  // No default animations
  const animations: any[] = [];

  return {
    id: `item-${element.id}-${Date.now()}`,
    elementId: element.id,
    elementType: element.type as ElementType,
    trackType,
    startTime,
    duration,
    inPoint: 0, // Start from beginning
    outPoint: duration, // End at full duration
    layer,
    locked: element.locked || false,
    animations, // CapCut-style keyframe animations
    properties: {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      opacity: element.opacity,
      rotation: element.rotation,
      zIndex: element.zIndex,
      color: element.color,
      backgroundColor: element.backgroundColor,
      fillColor: element.fillColor,
      fontSize: element.fontSize,
    },
    audioProperties: trackType === 'audio' ? {
      volume: 1.0,
      fadeIn: 0,
      fadeOut: 0,
      startOffset: 0,
    } : undefined,
    // Legacy transition (use animations instead)
    transition: {
      fadeIn: 0, // Handled by animations now
      fadeOut: 0,
      type: 'fade',
    },
  };
}

// ==================== Timeline Operations ====================

/**
 * Add item to timeline
 */
export function addItemToTimeline(
  timeline: Timeline,
  item: TimelineItem,
  trackId?: string
): Timeline {
  const targetTrack = trackId 
    ? timeline.tracks.find(t => t.id === trackId)
    : timeline.tracks.find(t => t.type === item.trackType);

  if (!targetTrack) {
    throw new Error(`No suitable track found for item type: ${item.trackType}`);
  }

  const updatedTracks = timeline.tracks.map(track => {
    if (track.id === targetTrack.id) {
      return {
        ...track,
        items: [...track.items, item].sort((a, b) => a.startTime - b.startTime),
      };
    }
    return track;
  });

  // Recalculate total duration based on all elements
  const newDuration = calculateDynamicDuration(updatedTracks);

  return {
    ...timeline,
    tracks: updatedTracks,
    totalDuration: newDuration,
  };
}

/**
 * Remove item from timeline
 */
export function removeItemFromTimeline(
  timeline: Timeline,
  itemId: string
): Timeline {
  const updatedTracks = timeline.tracks.map(track => ({
    ...track,
    items: track.items.filter(item => item.id !== itemId),
  }));

  // Recalculate total duration based on remaining elements
  const newDuration = calculateDynamicDuration(updatedTracks);

  return {
    ...timeline,
    tracks: updatedTracks,
    totalDuration: newDuration,
  };
}

/**
 * Ripple delete - Remove item and shift all items after it
 * This is CapCut's default behavior
 */
export function rippleDelete(
  timeline: Timeline,
  itemId: string
): Timeline {
  let deletedItem: TimelineItem | undefined;
  let deletedTrackId: string | undefined;

  // Find the item to delete
  for (const track of timeline.tracks) {
    const found = track.items.find(i => i.id === itemId);
    if (found) {
      deletedItem = found;
      deletedTrackId = track.id;
      break;
    }
  }

  if (!deletedItem || !deletedTrackId) {
    return timeline;
  }

  const deletedEndTime = deletedItem.startTime + deletedItem.duration;

  // Remove the item and shift all items after it
  const updatedTracks = timeline.tracks.map(track => {
    if (track.id === deletedTrackId) {
      return {
        ...track,
        items: track.items
          .filter(item => item.id !== itemId)
          .map(item => {
            // Shift items that start after the deleted item
            if (item.startTime >= deletedEndTime) {
              return {
                ...item,
                startTime: item.startTime - deletedItem!.duration,
              };
            }
            return item;
          })
          .sort((a, b) => a.startTime - b.startTime),
      };
    }
    return track;
  });

  // Recalculate total duration based on remaining elements
  const newDuration = calculateDynamicDuration(updatedTracks);

  return {
    ...timeline,
    tracks: updatedTracks,
    totalDuration: newDuration,
  };
}

/**
 * Update item properties
 */
export function updateTimelineItem(
  timeline: Timeline,
  itemId: string,
  updates: Partial<TimelineItem>
): Timeline {
  const updatedTracks = timeline.tracks.map(track => ({
    ...track,
    items: track.items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ).sort((a, b) => a.startTime - b.startTime),
  }));

  // Recalculate total duration based on dynamic elements
  const newDuration = calculateDynamicDuration(updatedTracks);

  return {
    ...timeline,
    tracks: updatedTracks,
    totalDuration: newDuration,
  };
}

/**
 * Move item to a new time and/or track
 */
export function moveTimelineItem(
  timeline: Timeline,
  itemId: string,
  newStartTime: number,
  newTrackId?: string
): Timeline {
  let item: TimelineItem | undefined;
  let sourceTrackId: string | undefined;

  // Find the item and its current track
  for (const track of timeline.tracks) {
    const foundItem = track.items.find(i => i.id === itemId);
    if (foundItem) {
      item = foundItem;
      sourceTrackId = track.id;
      break;
    }
  }

  if (!item || !sourceTrackId) {
    throw new Error(`Item ${itemId} not found`);
  }

  // Apply snap if enabled
  const snappedTime = snapToGrid(newStartTime, timeline.snapInterval);

  // Update the item
  const updatedItem = { ...item, startTime: snappedTime };

  // If moving to a different track
  if (newTrackId && newTrackId !== sourceTrackId) {
    const updatedTracks = timeline.tracks.map(track => {
      if (track.id === sourceTrackId) {
        // Remove from source track
        return {
          ...track,
          items: track.items.filter(i => i.id !== itemId),
        };
      } else if (track.id === newTrackId) {
        // Add to target track
        return {
          ...track,
          items: [...track.items, updatedItem].sort((a, b) => a.startTime - b.startTime),
        };
      }
      return track;
    });

    return {
      ...timeline,
      tracks: updatedTracks,
    };
  }

  // Same track, just update time
  return updateTimelineItem(timeline, itemId, { startTime: snappedTime });
}

/**
 * Resize timeline item
 */
export function resizeTimelineItem(
  timeline: Timeline,
  itemId: string,
  newDuration: number
): Timeline {
  const constrainedDuration = Math.max(
    DEFAULT_CONFIG.minItemDuration,
    newDuration
  );

  return updateTimelineItem(timeline, itemId, { duration: constrainedDuration });
}

// ==================== Track Management ====================

/**
 * Add a new track
 */
export function addTrack(
  timeline: Timeline,
  name: string,
  type: TimelineTrackType
): Timeline {
  const tracksOfType = timeline.tracks.filter(t => t.type === type);
  const maxAllowed = type === 'visual' 
    ? DEFAULT_CONFIG.maxVisualTracks 
    : DEFAULT_CONFIG.maxAudioTracks;

  if (tracksOfType.length >= maxAllowed) {
    throw new Error(`Maximum ${type} tracks (${maxAllowed}) reached`);
  }

  const newOrder = Math.max(...timeline.tracks.map(t => t.order), -1) + 1;
  const newTrack = createTrack(name, type, newOrder);

  return {
    ...timeline,
    tracks: [...timeline.tracks, newTrack],
  };
}

/**
 * Remove a track
 */
export function removeTrack(timeline: Timeline, trackId: string): Timeline {
  const trackToRemove = timeline.tracks.find(t => t.id === trackId);
  
  if (!trackToRemove) {
    throw new Error(`Track ${trackId} not found`);
  }

  if (trackToRemove.items.length > 0) {
    throw new Error('Cannot remove track with items. Remove items first.');
  }

  return {
    ...timeline,
    tracks: timeline.tracks.filter(t => t.id !== trackId),
  };
}

/**
 * Reorder tracks
 */
export function reorderTrack(
  timeline: Timeline,
  trackId: string,
  newOrder: number
): Timeline {
  const updatedTracks = timeline.tracks.map(track => {
    if (track.id === trackId) {
      return { ...track, order: newOrder };
    }
    return track;
  });

  return {
    ...timeline,
    tracks: updatedTracks.sort((a, b) => a.order - b.order),
  };
}

/**
 * Toggle track visibility
 */
export function toggleTrackVisibility(
  timeline: Timeline,
  trackId: string
): Timeline {
  const updatedTracks = timeline.tracks.map(track => 
    track.id === trackId ? { ...track, visible: !track.visible } : track
  );

  return {
    ...timeline,
    tracks: updatedTracks,
  };
}

/**
 * Toggle track lock
 */
export function toggleTrackLock(timeline: Timeline, trackId: string): Timeline {
  const updatedTracks = timeline.tracks.map(track => 
    track.id === trackId ? { ...track, locked: !track.locked } : track
  );

  return {
    ...timeline,
    tracks: updatedTracks,
  };
}

// ==================== Layer Management ====================

/**
 * Get all layers sorted by z-index
 */
export function getLayers(elements: CanvasElement[]): LayerInfo[] {
  return elements
    .map(el => ({
      elementId: el.id,
      elementType: el.type as ElementType,
      name: el.content || el.type,
      layer: el.zIndex,
      visible: el.visible,
      locked: el.locked,
    }))
    .sort((a, b) => b.layer - a.layer); // Highest layer first
}

/**
 * Bring element to front
 */
export function bringToFront(
  elements: CanvasElement[],
  elementId: string
): CanvasElement[] {
  const maxZIndex = Math.max(...elements.map(el => el.zIndex), 0);
  return elements.map(el => 
    el.id === elementId ? { ...el, zIndex: maxZIndex + 1 } : el
  );
}

/**
 * Send element to back
 */
export function sendToBack(
  elements: CanvasElement[],
  elementId: string
): CanvasElement[] {
  const minZIndex = Math.min(...elements.map(el => el.zIndex), 0);
  return elements.map(el => 
    el.id === elementId ? { ...el, zIndex: minZIndex - 1 } : el
  );
}

/**
 * Bring element forward (one layer up)
 */
export function bringForward(
  elements: CanvasElement[],
  elementId: string
): CanvasElement[] {
  const element = elements.find(el => el.id === elementId);
  if (!element) return elements;

  // Find the element directly above this one
  const elementsAbove = elements
    .filter(el => el.zIndex > element.zIndex)
    .sort((a, b) => a.zIndex - b.zIndex);

  if (elementsAbove.length === 0) return elements; // Already at top

  const targetZIndex = elementsAbove[0].zIndex;

  return elements.map(el => {
    if (el.id === elementId) {
      return { ...el, zIndex: targetZIndex + 1 };
    } else if (el.id === elementsAbove[0].id) {
      return { ...el, zIndex: element.zIndex };
    }
    return el;
  });
}

/**
 * Send element backward (one layer down)
 */
export function sendBackward(
  elements: CanvasElement[],
  elementId: string
): CanvasElement[] {
  const element = elements.find(el => el.id === elementId);
  if (!element) return elements;

  // Find the element directly below this one
  const elementsBelow = elements
    .filter(el => el.zIndex < element.zIndex)
    .sort((a, b) => b.zIndex - a.zIndex);

  if (elementsBelow.length === 0) return elements; // Already at bottom

  const targetZIndex = elementsBelow[0].zIndex;

  return elements.map(el => {
    if (el.id === elementId) {
      return { ...el, zIndex: targetZIndex - 1 };
    } else if (el.id === elementsBelow[0].id) {
      return { ...el, zIndex: element.zIndex };
    }
    return el;
  });
}

/**
 * Set specific layer order
 */
export function setLayerOrder(
  elements: CanvasElement[],
  elementId: string,
  targetLayer: number
): CanvasElement[] {
  return elements.map(el => 
    el.id === elementId ? { ...el, zIndex: targetLayer } : el
  );
}

// ==================== Playback Control ====================

/**
 * Play timeline
 */
export function play(timeline: Timeline): Timeline {
  return {
    ...timeline,
    isPlaying: true,
  };
}

/**
 * Pause timeline
 */
export function pause(timeline: Timeline): Timeline {
  return {
    ...timeline,
    isPlaying: false,
  };
}

/**
 * Stop timeline and reset to start
 */
export function stop(timeline: Timeline): Timeline {
  return {
    ...timeline,
    isPlaying: false,
    currentTime: 0,
  };
}

/**
 * Seek to specific time
 */
export function seek(timeline: Timeline, time: number): Timeline {
  const constrainedTime = Math.max(0, Math.min(time, timeline.totalDuration));
  return {
    ...timeline,
    currentTime: constrainedTime,
  };
}

/**
 * Set playback speed
 */
export function setPlaybackSpeed(timeline: Timeline, speed: number): Timeline {
  const constrainedSpeed = Math.max(0.1, Math.min(4.0, speed));
  return {
    ...timeline,
    playbackSpeed: constrainedSpeed,
  };
}

/**
 * Toggle loop
 */
export function toggleLoop(timeline: Timeline): Timeline {
  return {
    ...timeline,
    loop: !timeline.loop,
  };
}

/**
 * Set zoom level
 */
export function setZoom(timeline: Timeline, zoom: number): Timeline {
  const constrainedZoom = Math.max(10, Math.min(200, zoom));
  return {
    ...timeline,
    zoom: constrainedZoom,
  };
}

/**
 * Set snap interval
 */
export function setSnapInterval(timeline: Timeline, interval: number): Timeline {
  return {
    ...timeline,
    snapInterval: interval,
  };
}

// ==================== Utility Functions ====================

/**
 * Snap time to grid
 */
export function snapToGrid(time: number, interval: number): number {
  return Math.round(time / interval) * interval;
}

/**
 * Get items at specific time
 */
export function getItemsAtTime(timeline: Timeline, time: number): TimelineItem[] {
  const items: TimelineItem[] = [];
  
  for (const track of timeline.tracks) {
    for (const item of track.items) {
      if (time >= item.startTime && time < item.startTime + item.duration) {
        items.push(item);
      }
    }
  }
  
  return items;
}

/**
 * Get all visual items
 */
export function getVisualItems(timeline: Timeline): TimelineItem[] {
  return timeline.tracks
    .filter(t => t.type === 'visual')
    .flatMap(t => t.items);
}

/**
 * Get all audio items
 */
export function getAudioItems(timeline: Timeline): TimelineItem[] {
  return timeline.tracks
    .filter(t => t.type === 'audio')
    .flatMap(t => t.items);
}

/**
 * Calculate timeline statistics
 */
export function getTimelineStats(timeline: Timeline) {
  const visualTracks = timeline.tracks.filter(t => t.type === 'visual');
  const audioTracks = timeline.tracks.filter(t => t.type === 'audio');
  const totalItems = timeline.tracks.reduce((sum, t) => sum + t.items.length, 0);

  return {
    totalTracks: timeline.tracks.length,
    visualTracks: visualTracks.length,
    audioTracks: audioTracks.length,
    totalItems,
    duration: timeline.totalDuration,
    currentTime: timeline.currentTime,
  };
}

/**
 * Export timeline to JSON
 */
export function exportTimeline(
  timeline: Timeline,
  elements: CanvasElement[]
): TimelineExport {
  const elementMap: { [key: string]: { type: ElementType; properties: any } } = {};
  
  elements.forEach(el => {
    elementMap[el.id] = {
      type: el.type as ElementType,
      properties: { ...el },
    };
  });

  return {
    version: '1.0',
    timeline,
    elements: elementMap,
    metadata: {
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      duration: timeline.totalDuration,
    },
  };
}

/**
 * Import timeline from JSON
 */
export function importTimeline(data: TimelineExport): Timeline {
  return data.timeline;
}

/**
 * Auto-arrange items sequentially (one after another)
 */
export function autoArrangeSequential(
  timeline: Timeline,
  trackType: TimelineTrackType,
  gap: number = 0
): Timeline {
  const targetTracks = timeline.tracks.filter(t => t.type === trackType);
  
  if (targetTracks.length === 0) return timeline;

  let currentTime = 0;

  const updatedTracks = timeline.tracks.map(track => {
    if (track.type !== trackType) return track;

    // Sort items by current start time first
    const sortedItems = [...track.items].sort((a, b) => a.startTime - b.startTime);
    
    const arrangedItems = sortedItems.map(item => {
      const newItem = { ...item, startTime: currentTime };
      currentTime += item.duration + gap;
      return newItem;
    });

    return {
      ...track,
      items: arrangedItems,
    };
  });

  // Recalculate total duration based on dynamic elements
  const newDuration = calculateDynamicDuration(updatedTracks);

  return {
    ...timeline,
    tracks: updatedTracks,
    totalDuration: newDuration,
  };
}

/**
 * Auto-arrange all items sequentially across all tracks
 */
export function autoArrangeAll(
  timeline: Timeline,
  gap: number = 500
): Timeline {
  // First arrange visual tracks
  let updated = autoArrangeSequential(timeline, 'visual', gap);
  // Then arrange audio tracks
  updated = autoArrangeSequential(updated, 'audio', gap);
  return updated;
}

/**
 * Duplicate timeline item
 */
export function duplicateItem(
  timeline: Timeline,
  itemId: string,
  offsetTime: number = 1000
): Timeline {
  let itemToDuplicate: TimelineItem | undefined;
  let trackId: string | undefined;

  // Find the item
  for (const track of timeline.tracks) {
    const found = track.items.find(i => i.id === itemId);
    if (found) {
      itemToDuplicate = found;
      trackId = track.id;
      break;
    }
  }

  if (!itemToDuplicate || !trackId) {
    throw new Error(`Item ${itemId} not found`);
  }

  // Create duplicate
  const duplicate: TimelineItem = {
    ...itemToDuplicate,
    id: `item-${Date.now()}-${Math.random()}`,
    startTime: itemToDuplicate.startTime + offsetTime,
  };

  return addItemToTimeline(timeline, duplicate, trackId);
}

/**
 * Split timeline item at specific time
 */
export function splitItem(
  timeline: Timeline,
  itemId: string,
  splitTime: number
): Timeline {
  let itemToSplit: TimelineItem | undefined;
  let trackId: string | undefined;

  // Find the item
  for (const track of timeline.tracks) {
    const found = track.items.find(i => i.id === itemId);
    if (found) {
      itemToSplit = found;
      trackId = track.id;
      break;
    }
  }

  if (!itemToSplit || !trackId) {
    throw new Error(`Item ${itemId} not found`);
  }

  // Check if split time is within item bounds
  const itemEnd = itemToSplit.startTime + itemToSplit.duration;
  if (splitTime <= itemToSplit.startTime || splitTime >= itemEnd) {
    throw new Error('Split time must be within item bounds');
  }

  // Calculate durations for both parts
  const firstDuration = splitTime - itemToSplit.startTime;
  const secondDuration = itemEnd - splitTime;

  // Update first part (original item)
  let updated = updateTimelineItem(timeline, itemId, {
    duration: firstDuration,
  });

  // Create second part
  const secondPart: TimelineItem = {
    ...itemToSplit,
    id: `item-${Date.now()}-${Math.random()}`,
    startTime: splitTime,
    duration: secondDuration,
  };

  updated = addItemToTimeline(updated, secondPart, trackId);

  return updated;
}

/**
 * Merge two adjacent timeline items
 */
export function mergeItems(
  timeline: Timeline,
  firstItemId: string,
  secondItemId: string
): Timeline {
  let firstItem: TimelineItem | undefined;
  let secondItem: TimelineItem | undefined;
  let trackId: string | undefined;

  // Find both items
  for (const track of timeline.tracks) {
    if (!firstItem) {
      firstItem = track.items.find(i => i.id === firstItemId);
      if (firstItem) trackId = track.id;
    }
    if (!secondItem) {
      secondItem = track.items.find(i => i.id === secondItemId);
    }
  }

  if (!firstItem || !secondItem || !trackId) {
    throw new Error('Items not found');
  }

  // Check if items are adjacent
  const firstEnd = firstItem.startTime + firstItem.duration;
  if (Math.abs(firstEnd - secondItem.startTime) > 10) {
    throw new Error('Items must be adjacent to merge');
  }

  // Merge into first item
  const mergedDuration = firstItem.duration + secondItem.duration;
  let updated = updateTimelineItem(timeline, firstItemId, {
    duration: mergedDuration,
  });

  // Remove second item
  updated = removeItemFromTimeline(updated, secondItemId);

  return updated;
}

// ==================== IN/OUT Point Management ====================

/**
 * Set IN point for timeline item (trim start)
 */
export function setInPoint(
  timeline: Timeline,
  itemId: string,
  inPoint: number
): Timeline {
  // Find the item
  let item: TimelineItem | undefined;
  for (const track of timeline.tracks) {
    item = track.items.find(i => i.id === itemId);
    if (item) break;
  }

  if (!item) {
    throw new Error(`Item ${itemId} not found`);
  }

  // Validate IN point
  const constrainedInPoint = Math.max(0, Math.min(inPoint, item.outPoint - 100));
  
  return updateTimelineItem(timeline, itemId, {
    inPoint: constrainedInPoint,
  });
}

/**
 * Set OUT point for timeline item (trim end)
 */
export function setOutPoint(
  timeline: Timeline,
  itemId: string,
  outPoint: number
): Timeline {
  // Find the item
  let item: TimelineItem | undefined;
  for (const track of timeline.tracks) {
    item = track.items.find(i => i.id === itemId);
    if (item) break;
  }

  if (!item) {
    throw new Error(`Item ${itemId} not found`);
  }

  // Validate OUT point
  const constrainedOutPoint = Math.max(item.inPoint + 100, Math.min(outPoint, item.duration));
  
  return updateTimelineItem(timeline, itemId, {
    outPoint: constrainedOutPoint,
  });
}

/**
 * Get effective duration (accounting for IN/OUT points)
 */
export function getEffectiveDuration(item: TimelineItem): number {
  return item.outPoint - item.inPoint;
}

/**
 * Get playback progress (0-1) for item at current time
 */
export function getItemProgress(
  item: TimelineItem,
  currentTime: number
): number | null {
  const itemEndTime = item.startTime + item.duration;
  
  // Check if current time is within item's time range (inclusive on both ends)
  if (currentTime < item.startTime || currentTime > itemEndTime) {
    return null; // Not playing
  }
  
  const itemTime = currentTime - item.startTime;
  
  // Check if within IN/OUT range
  if (itemTime < item.inPoint || itemTime > item.outPoint) {
    return null; // Outside IN/OUT range
  }
  
  const effectiveDuration = item.outPoint - item.inPoint;
  
  // Prevent division by zero
  if (effectiveDuration === 0) {
    return 1;
  }
  
  return Math.min(1, (itemTime - item.inPoint) / effectiveDuration);
}

/**
 * Apply transitions (fade in/out) to opacity based on progress
 */
export function applyTransition(
  item: TimelineItem,
  progress: number
): number {
  if (!item.transition) return 1;
  
  const effectiveDuration = getEffectiveDuration(item);
  const fadeInRatio = (item.transition.fadeIn || 0) / effectiveDuration;
  const fadeOutRatio = (item.transition.fadeOut || 0) / effectiveDuration;
  
  let opacity = 1;
  
  // Fade in
  if (progress < fadeInRatio && fadeInRatio > 0) {
    opacity = progress / fadeInRatio;
  }
  
  // Fade out
  if (progress > (1 - fadeOutRatio) && fadeOutRatio > 0) {
    opacity = (1 - progress) / fadeOutRatio;
  }
  
  return Math.max(0, Math.min(1, opacity));
}

// Export config for external use
export { DEFAULT_CONFIG as TIMELINE_CONFIG };
