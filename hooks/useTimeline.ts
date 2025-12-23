/**
 * useTimeline Hook
 * React hook for managing timeline state and operations
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineTrack,
  TimelineState,
} from '../types/timeline';
import * as timelineService from '../services/timelineService';
import { CanvasElement } from '../types';

interface UseTimelineOptions {
  designId: string;
  elements: CanvasElement[];
  autoSave?: boolean;
  onTimelineChange?: (timeline: Timeline) => void;
}

export function useTimeline({
  designId,
  elements,
  autoSave = false,
  onTimelineChange,
}: UseTimelineOptions) {
  // State
  const [timeline, setTimeline] = useState<Timeline>(() =>
    timelineService.createTimeline(designId)
  );
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<Timeline[]>([]);
  const [redoStack, setRedoStack] = useState<Timeline[]>([]);

  // Update callback when timeline changes
  useEffect(() => {
    if (onTimelineChange) {
      onTimelineChange(timeline);
    }
  }, [timeline, onTimelineChange]);

  // Update timeline (with undo support)
  const updateTimeline = useCallback((newTimeline: Timeline) => {
    setUndoStack(prev => [...prev, timeline]);
    setRedoStack([]); // Clear redo stack on new action
    setTimeline(newTimeline);
  }, [timeline]);

  // Undo/Redo
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    
    const previousTimeline = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, timeline]);
    setUndoStack(prev => prev.slice(0, -1));
    setTimeline(previousTimeline);
  }, [undoStack, timeline]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const nextTimeline = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, timeline]);
    setRedoStack(prev => prev.slice(0, -1));
    setTimeline(nextTimeline);
  }, [redoStack, timeline]);

  // Element to timeline operations
  const addElementToTimeline = useCallback((
    element: CanvasElement,
    startTime: number = timeline.currentTime,
    duration: number = 5000,
    trackType: 'visual' | 'audio' = 'visual'
  ) => {
    const item = timelineService.createTimelineItem(
      element,
      startTime,
      duration,
      element.zIndex,
      trackType
    );
    
    const updated = timelineService.addItemToTimeline(timeline, item);
    updateTimeline(updated);
  }, [timeline, updateTimeline]);

  const removeElementFromTimeline = useCallback((elementId: string) => {
    // Find all items for this element
    let updated = timeline;
    
    for (const track of timeline.tracks) {
      for (const item of track.items) {
        if (item.elementId === elementId) {
          updated = timelineService.removeItemFromTimeline(updated, item.id);
        }
      }
    }
    
    updateTimeline(updated);
  }, [timeline, updateTimeline]);

  // Playback controls
  const play = useCallback(() => {
    // If at the end or beyond, reset to start (0)
    if (timeline.currentTime >= timeline.totalDuration) {
      const resetTimeline = timelineService.seek(timeline, 0);
      updateTimeline(timelineService.play(resetTimeline));
    } else {
      updateTimeline(timelineService.play(timeline));
    }
  }, [timeline, updateTimeline]);

  const pause = useCallback(() => {
    updateTimeline(timelineService.pause(timeline));
  }, [timeline, updateTimeline]);

  const stop = useCallback(() => {
    // Stop resets to time 0 (where element-1 starts)
    updateTimeline(timelineService.stop(timeline));
  }, [timeline, updateTimeline]);

  const seek = useCallback((time: number) => {
    updateTimeline(timelineService.seek(timeline, time));
  }, [timeline, updateTimeline]);

  const setSpeed = useCallback((speed: number) => {
    updateTimeline(timelineService.setPlaybackSpeed(timeline, speed));
  }, [timeline, updateTimeline]);

  const toggleLoop = useCallback(() => {
    updateTimeline(timelineService.toggleLoop(timeline));
  }, [timeline, updateTimeline]);

  // Zoom controls
  const setZoom = useCallback((zoom: number) => {
    updateTimeline(timelineService.setZoom(timeline, zoom));
  }, [timeline, updateTimeline]);

  const zoomIn = useCallback(() => {
    updateTimeline(timelineService.setZoom(timeline, timeline.zoom * 1.2));
  }, [timeline, updateTimeline]);

  const zoomOut = useCallback(() => {
    updateTimeline(timelineService.setZoom(timeline, timeline.zoom / 1.2));
  }, [timeline, updateTimeline]);

  // Track management
  const addTrack = useCallback((name: string, type: 'visual' | 'audio') => {
    updateTimeline(timelineService.addTrack(timeline, name, type));
  }, [timeline, updateTimeline]);

  const removeTrack = useCallback((trackId: string) => {
    updateTimeline(timelineService.removeTrack(timeline, trackId));
  }, [timeline, updateTimeline]);

  const toggleTrackVisibility = useCallback((trackId: string) => {
    updateTimeline(timelineService.toggleTrackVisibility(timeline, trackId));
  }, [timeline, updateTimeline]);

  const toggleTrackLock = useCallback((trackId: string) => {
    updateTimeline(timelineService.toggleTrackLock(timeline, trackId));
  }, [timeline, updateTimeline]);

  // Item management
  const addItem = useCallback((item: TimelineItem, trackId?: string) => {
    updateTimeline(timelineService.addItemToTimeline(timeline, item, trackId));
  }, [timeline, updateTimeline]);

  const removeItem = useCallback((itemId: string) => {
    updateTimeline(timelineService.removeItemFromTimeline(timeline, itemId));
  }, [timeline, updateTimeline]);

  const updateItem = useCallback((itemId: string, updates: Partial<TimelineItem>) => {
    updateTimeline(timelineService.updateTimelineItem(timeline, itemId, updates));
  }, [timeline, updateTimeline]);

  const moveItem = useCallback((itemId: string, startTime: number, trackId?: string) => {
    updateTimeline(timelineService.moveTimelineItem(timeline, itemId, startTime, trackId));
  }, [timeline, updateTimeline]);

  const resizeItem = useCallback((itemId: string, duration: number) => {
    updateTimeline(timelineService.resizeTimelineItem(timeline, itemId, duration));
  }, [timeline, updateTimeline]);

  const duplicateItem = useCallback((itemId: string, offsetTime?: number) => {
    updateTimeline(timelineService.duplicateItem(timeline, itemId, offsetTime));
  }, [timeline, updateTimeline]);

  // Selection management
  const selectItem = useCallback((itemId: string, addToSelection: boolean = false) => {
    if (addToSelection) {
      setSelectedItems(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
    } else {
      setSelectedItems([itemId]);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  // Utility functions
  const getItemsAtTime = useCallback((time: number) => {
    return timelineService.getItemsAtTime(timeline, time);
  }, [timeline]);

  const getVisualItems = useCallback(() => {
    return timelineService.getVisualItems(timeline);
  }, [timeline]);

  const getAudioItems = useCallback(() => {
    return timelineService.getAudioItems(timeline);
  }, [timeline]);

  const getStats = useCallback(() => {
    return timelineService.getTimelineStats(timeline);
  }, [timeline]);

  const exportTimeline = useCallback(() => {
    return timelineService.exportTimeline(timeline, elements);
  }, [timeline, elements]);

  const autoArrange = useCallback((trackType: 'visual' | 'audio', gap: number = 0) => {
    updateTimeline(timelineService.autoArrangeSequential(timeline, trackType, gap));
  }, [timeline, updateTimeline]);

  // Sync elements with timeline - arrange sequentially from 0
  const syncElementsToTimeline = useCallback(() => {
    // Add any elements not in timeline
    let updated = { ...timeline };
    let hasNewItems = false;
    
    // First, remove any timeline items for deleted elements
    const elementIds = new Set(elements.map(e => e.id));
    const allItems = updated.tracks.flatMap(t => t.items);
    
    for (const item of allItems) {
      if (!elementIds.has(item.elementId)) {
        updated = timelineService.removeItemFromTimeline(updated, item.id);
      }
    }
    
    // Calculate the end time of the last item in track 1 (visual track)
    const track1 = updated.tracks.find(t => t.type === 'visual');
    let lastEndTime = 0;
    if (track1 && track1.items.length > 0) {
      // Find the latest end time in track 1
      lastEndTime = Math.max(
        ...track1.items.map(item => item.startTime + item.duration)
      );
    }
    
    // Then add any elements not in timeline
    for (const element of elements) {
      const existingItems = updated.tracks
        .flatMap(t => t.items)
        .filter(item => item.elementId === element.id);
      
      if (existingItems.length === 0) {
        // Add new items to track 1 at the end of existing items
        const item = timelineService.createTimelineItem(
          element,
          lastEndTime, // Position at the end of track 1
          5000, // 5 seconds
          element.zIndex,
          'visual'
        );
        
        // Add to track 1 specifically
        const visualTrack = updated.tracks.find(t => t.type === 'visual');
        if (visualTrack) {
          updated = timelineService.addItemToTimeline(updated, item, visualTrack.id);
          lastEndTime += item.duration; // Update for next item
          hasNewItems = true;
        }
      }
    }
    
    // Only auto-arrange if this is the FIRST sync (no items exist yet)
    // This ensures the initial setup has partitions from 0
    if (allItems.length === 0 && hasNewItems) {
      updated = timelineService.autoArrangeAll(updated, 0);
    }
    
    // Only update if there were actual changes
    if (hasNewItems || allItems.length !== updated.tracks.flatMap(t => t.items).length) {
      setTimeline(updated);
    }
  }, [elements, timeline]);

  return {
    // State
    timeline,
    selectedItems,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,

    // Timeline operations
    updateTimeline,
    undo,
    redo,

    // Element operations
    addElementToTimeline,
    removeElementFromTimeline,
    syncElementsToTimeline,

    // Playback
    play,
    pause,
    stop,
    seek,
    setSpeed,
    toggleLoop,

    // Zoom
    setZoom,
    zoomIn,
    zoomOut,

    // Tracks
    addTrack,
    removeTrack,
    toggleTrackVisibility,
    toggleTrackLock,

    // Items
    addItem,
    removeItem,
    updateItem,
    moveItem,
    resizeItem,
    duplicateItem,

    // Selection
    selectItem,
    clearSelection,

    // Utilities
    getItemsAtTime,
    getVisualItems,
    getAudioItems,
    getStats,
    exportTimeline,
    autoArrange,
  };
}
