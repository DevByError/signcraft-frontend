/**
 * Timeline Component - CapCut Style
 * 
 * CapCut Principles Implemented:
 * ================================
 * 1. TIME-FIRST ARCHITECTURE
 *    - All calculations are millisecond-based, never pixels
 *    - UI is derived from time, not vice versa
 *    - Formula: pxPerMs = zoom / 1000
 * 
 * 2. PRECISE item.id.toString()

 *    - clipLeftPx = clip.startMs * pxPerMs
 *    - clipWidthPx = clip.durationMs * pxPerMs
 *    - Zoom works perfectly with this formula
 * 
 * 3. PLAYBACK ENGINE
 *    - Uses requestAnimationFrame (not setInterval)
 *    - Time delta from performance.now()
 *    - No drift, accurate audio sync
 * 
 * 4. SNAPPING SYSTEM (80ms threshold)
 *    - Snaps to: clip start, clip end, playhead, grid
 *    - Magnetic feel during drag/resize/scrub
 * 
 * 5. COLLISION DETECTION
 *    - No overlaps in same track
 *    - Auto-pushes clips on collision
 * 
 * 6. SPLIT & RIPPLE
 *    - Split: leftClip.duration = splitTime - startMs
 *    - Ripple delete: shifts all clips after deleted one
 * 
 * 7. CONSISTENT EXPORT
 *    - Timeline model = preview = export
 *    - No UI dependencies in data model
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  StopCircle,
  SkipBack,
  SkipForward,
  Scissors,
  Trash2,
  Copy,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  Upload,
  ArrowRight,
  ListOrdered,
  ChevronRight as InPointIcon,
  ChevronLeft as OutPointIcon,
} from 'lucide-react';
import { Timeline, TimelineItem, TimelineTrack } from '../types/timeline';
import * as timelineService from '../services/timelineService';

interface TimelineComponentProps {
  timeline: Timeline;
  onTimelineChange: (timeline: Timeline) => void;
  onItemSelect?: (itemId: string) => void;
  selectedItemIds?: string[];
  onSplitItem?: (itemId: string, splitTime: number) => void;
  onArrangeSequential?: () => void;
}

export const TimelineCapCut: React.FC<TimelineComponentProps> = ({
  timeline,
  onTimelineChange,
  onItemSelect,
  selectedItemIds = [],
  onArrangeSequential,
  onSplitItem,
}) => {
  // State
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [dragTrackId, setDragTrackId] = useState<string | null>(null);
  const [targetTrackId, setTargetTrackId] = useState<string | null>(null);

  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [resizingItem, setResizingItem] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartTime, setResizeStartTime] = useState(0);
  const [resizeStartDuration, setResizeStartDuration] = useState(0);

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [adjustingInOut, setAdjustingInOut] = useState<{ itemId: string; type: 'in' | 'out' } | null>(null);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Time formatting
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
  };

  // Convert time to pixels
  const timeToPixels = (time: number): number => {
    return (time / 1000) * timeline.zoom;
  };

  // Convert pixels to time (strict time-first calculation)
  const pixelsToTime = (pixels: number): number => {
    return (pixels / timeline.zoom) * 1000;
  };

  // CapCut-style snapping with 80ms threshold
  const snapToTimeline = (timeMs: number): number => {
    if (timeline.snapInterval === 0) return timeMs;

    const SNAP_THRESHOLD_MS = 80;
    const snapPoints: number[] = [];

    // Add grid snap points
    for (let t = 0; t <= timeline.totalDuration; t += timeline.snapInterval) {
      snapPoints.push(t);
    }

    // Add clip start/end points
    timeline.tracks.forEach(track => {
      track.items.forEach(item => {
        snapPoints.push(item.startTime);
        snapPoints.push(item.startTime + item.duration);
      });
    });

    // Add playhead position
    snapPoints.push(timeline.currentTime);

    // Find closest snap point
    for (const point of snapPoints) {
      if (Math.abs(timeMs - point) < SNAP_THRESHOLD_MS) {
        return point;
      }
    }

    return timeMs;
  };

  // Playback control with requestAnimationFrame (CapCut method)
  useEffect(() => {
    if (timeline.isPlaying) {
      let lastFrameTime = performance.now();
      let animationFrameId: number;
      let currentTimeRef = timeline.currentTime; // Track time in closure

      const playbackLoop = (currentFrameTime: number) => {
        const deltaMs = (currentFrameTime - lastFrameTime) * timeline.playbackSpeed;
        lastFrameTime = currentFrameTime;

        currentTimeRef += deltaMs;

        if (currentTimeRef >= timeline.totalDuration) {
          if (timeline.loop) {
            currentTimeRef = 0;
            onTimelineChange(timelineService.seek(timeline, 0));
          } else {
            onTimelineChange(timelineService.stop(timeline));
            return; // Stop the loop
          }
        } else {
          onTimelineChange(timelineService.seek(timeline, currentTimeRef));
        }

        animationFrameId = requestAnimationFrame(playbackLoop);
      };

      animationFrameId = requestAnimationFrame(playbackLoop);

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }
  }, [timeline.isPlaying, timeline.playbackSpeed, timeline.loop, timeline.totalDuration]);

  // Auto-scroll to playhead and sync ruler/tracks scroll
  useEffect(() => {
    if (timeline.isPlaying && scrollContainerRef.current && timelineRef.current) {
      const playheadX = timeToPixels(timeline.currentTime);
      const container = scrollContainerRef.current;
      const containerWidth = container.clientWidth;
      const scrollLeft = container.scrollLeft;

      // Keep playhead in center-right area during playback
      if (playheadX > scrollLeft + containerWidth * 0.7) {
        const newScrollLeft = playheadX - containerWidth * 0.5;
        container.scrollLeft = newScrollLeft;
        timelineRef.current.scrollLeft = newScrollLeft;
      }
    }
  }, [timeline.currentTime, timeline.isPlaying]);

  // Sync horizontal scroll between ruler and tracks
  useEffect(() => {
    const handleTimelineScroll = () => {
      if (scrollContainerRef.current && timelineRef.current) {
        scrollContainerRef.current.scrollLeft = timelineRef.current.scrollLeft;
      }
    };

    if (timelineRef.current) {
      timelineRef.current.addEventListener('scroll', handleTimelineScroll);
      return () => {
        timelineRef.current?.removeEventListener('scroll', handleTimelineScroll);
      };
    }
  }, []);

  // Playback controls
  const handlePlay = () => onTimelineChange(timelineService.play(timeline));
  const handlePause = () => onTimelineChange(timelineService.pause(timeline));
  const handleStop = () => onTimelineChange(timelineService.stop(timeline));

  const handleSeek = (time: number) => {
    onTimelineChange(timelineService.seek(timeline, time));
  };

  const handleZoomIn = () => {
    onTimelineChange(timelineService.setZoom(timeline, Math.min(timeline.zoom * 1.5, 200)));
  };

  const handleZoomOut = () => {
    onTimelineChange(timelineService.setZoom(timeline, Math.max(timeline.zoom / 1.5, 10)));
  };

  const handleToggleLoop = () => {
    onTimelineChange(timelineService.toggleLoop(timeline));
  };

  // Track controls
  const handleAddTrack = (type: 'visual' | 'audio') => {
    const tracksOfType = timeline.tracks.filter(t => t.type === type);
    const name = `${type === 'visual' ? 'Track' : 'Audio'} ${tracksOfType.length + 1}`;
    onTimelineChange(timelineService.addTrack(timeline, name, type));
  };

  const handleRemoveTrack = (trackId: string) => {
    const track = timeline.tracks.find(t => t.id === trackId);
    if (track && track.items.length > 0) {
      if (!confirm(`Track "${track.name}" has ${track.items.length} items. Delete anyway?`)) {
        return;
      }
      // Remove all items first
      let updated = timeline;
      track.items.forEach(item => {
        updated = timelineService.removeItemFromTimeline(updated, item.id);
      });
      onTimelineChange(timelineService.removeTrack(updated, trackId));
    } else {
      try {
        onTimelineChange(timelineService.removeTrack(timeline, trackId));
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Cannot remove track');
      }
    }
  };

  const handleToggleTrackVisibility = (trackId: string) => {
    onTimelineChange(timelineService.toggleTrackVisibility(timeline, trackId));
  };

  const handleToggleTrackLock = (trackId: string) => {
    onTimelineChange(timelineService.toggleTrackLock(timeline, trackId));
  };

  // Item interactions
  const handleItemClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (onItemSelect) {
      onItemSelect(itemId);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    onTimelineChange(timelineService.removeItemFromTimeline(timeline, itemId));
  };

  const handleDuplicateItem = (itemId: string) => {
    onTimelineChange(timelineService.duplicateItem(timeline, itemId, 1000));
  };

  const handleSplitItem = (itemId: string) => {
    if (onSplitItem) {
      onSplitItem(itemId, timeline.currentTime);
    }
  };

  // Drag and drop for items
  const handleItemMouseDown = (e: React.MouseEvent, item: TimelineItem, trackId: string) => {
    if (item.locked) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const itemWidth = rect.width;

    // Check if clicking on resize handles (10% from edges)
    const handleWidth = Math.min(itemWidth * 0.1, 20);

    if (offsetX < handleWidth) {
      // Left handle - resize start
      setIsResizing('left');
      setResizingItem(item.id);
      setResizeStartX(e.clientX);
      setResizeStartTime(item.startTime);
      setResizeStartDuration(item.duration);
    } else if (offsetX > itemWidth - handleWidth) {
      // Right handle - resize end
      setIsResizing('right');
      setResizingItem(item.id);
      setResizeStartX(e.clientX);
      setResizeStartTime(item.startTime);
      setResizeStartDuration(item.duration);
    } else {
      // Middle - drag item
      setIsDragging(true);
      setDraggedItem(item.id);
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
      setDragStartTime(item.startTime);
      setDragTrackId(trackId);
      setTargetTrackId(trackId);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && draggedItem && scrollContainerRef.current && timelineRef.current) {
      const deltaX = e.clientX - dragStartX;
      const deltaTime = pixelsToTime(deltaX);
      let newStartTime = Math.max(0, dragStartTime + deltaTime);

      // Apply snapping
      newStartTime = snapToTimeline(newStartTime);

      // Detect target track based on mouse Y position
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const relativeY = e.clientY - timelineRect.top + timelineRef.current.scrollTop;
      const trackHeight = 64; // Height of each track (h-16 = 64px)
      const trackIndex = Math.floor(relativeY / trackHeight);
      const newTargetTrackId = timeline.tracks[trackIndex]?.id || dragTrackId;

      if (newTargetTrackId !== targetTrackId) {
        setTargetTrackId(newTargetTrackId);
      }

      // Get the item data
      const draggedItemData = timeline.tracks
        .flatMap(t => t.items)
        .find(i => i.id === draggedItem);

      if (draggedItemData && newTargetTrackId) {
        // Collision detection: prevent overlap in target track
        const targetTrack = timeline.tracks.find(t => t.id === newTargetTrackId);
        if (targetTrack) {
          const otherItems = targetTrack.items.filter(i => i.id !== draggedItem);
          for (const other of otherItems) {
            const draggedEnd = newStartTime + draggedItemData.duration;
            const otherEnd = other.startTime + other.duration;

            // Check overlap
            if (newStartTime < otherEnd && draggedEnd > other.startTime) {
              // Push to previous clip's end
              if (newStartTime < other.startTime) {
                newStartTime = Math.max(0, other.startTime - draggedItemData.duration);
              } else {
                newStartTime = otherEnd;
              }
            }
          }
        }

        // If track changed, move item to new track
        if (newTargetTrackId !== dragTrackId) {
          onTimelineChange(timelineService.moveTimelineItem(timeline, draggedItem, newStartTime, newTargetTrackId));
          setDragTrackId(newTargetTrackId);
        } else {
          onTimelineChange(timelineService.updateTimelineItem(timeline, draggedItem, {
            startTime: newStartTime,
          }));
        }
      }
    } else if (isResizing && resizingItem) {
      const deltaX = e.clientX - resizeStartX;
      const deltaTime = pixelsToTime(deltaX);

      if (isResizing === 'left') {
        // Resize from start
        let newStartTime = Math.max(0, resizeStartTime + deltaTime);
        let newDuration = Math.max(100, resizeStartDuration - deltaTime);

        // Apply snapping to start point
        newStartTime = snapToTimeline(newStartTime);
        newDuration = (resizeStartTime + resizeStartDuration) - newStartTime;
        newDuration = Math.max(100, newDuration);

        onTimelineChange(timelineService.updateTimelineItem(timeline, resizingItem, {
          startTime: newStartTime,
          duration: newDuration,
        }));
      } else {
        // Resize from end
        let newDuration = Math.max(100, resizeStartDuration + deltaTime);

        // Apply snapping to end point
        const endTime = resizeStartTime + newDuration;
        const snappedEnd = snapToTimeline(endTime);
        newDuration = Math.max(100, snappedEnd - resizeStartTime);

        onTimelineChange(timelineService.updateTimelineItem(timeline, resizingItem, {
          duration: newDuration,
        }));
      }
    }
  }, [isDragging, isResizing, draggedItem, resizingItem, dragStartX, dragStartY, dragStartTime, resizeStartX, resizeStartTime, resizeStartDuration, dragTrackId, targetTrackId, timeline, onTimelineChange, pixelsToTime, snapToTimeline, timelineRef]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedItem(null);
    setIsResizing(null);
    setResizingItem(null);
    setTargetTrackId(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Timeline ruler with playhead scrubbing
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const x = e.clientX - rect.left + scrollLeft;
      // Subtract the 176px padding (pl-44 = 11 * 16 = 176px) to account for label area
      const adjustedX = Math.max(0, x - 176);
      const time = pixelsToTime(adjustedX);
      const snappedTime = snapToTimeline(time);
      handleSeek(snappedTime);
    }
  };

  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    handleRulerClick(e);
  };

  const handleRulerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      handleRulerClick(e);
    }
  };

  const handleRulerMouseUp = () => {
    setIsScrubbing(false);
  };

  // Render timeline ruler
  const renderRuler = () => {
    const totalWidth = timeToPixels(timeline.totalDuration);
    const interval = timeline.zoom >= 40 ? 1000 : timeline.zoom >= 20 ? 5000 : 10000;
    const markers: React.ReactElement[] = [];

    for (let time = 0; time <= timeline.totalDuration; time += interval) {
      const x = timeToPixels(time);
      const isSecond = time % 1000 === 0;

      markers.push(
        <div
          key={time}
          className="absolute flex flex-col items-start"
          style={{ left: `${x + 176}px` }}
        >
          <span className="text-[10px] text-gray-400 font-mono mb-0.5 select-none">
            {formatTime(time)}
          </span>
          <div className="h-2 w-px bg-gray-300" />
        </div>
      );
    }

    return (
      <div
        className="relative h-8 bg-gray-900 border-b border-gray-700 cursor-pointer select-none overflow-hidden"
        onMouseDown={handleRulerMouseDown}
        onMouseMove={handleRulerMouseMove}
        onMouseUp={handleRulerMouseUp}
        onMouseLeave={handleRulerMouseUp}
      >
        <div className="relative h-full pl-44" style={{ width: `${totalWidth}px`, minWidth: '100%' }}>
          {/* Start indicator (0:00) */}
          <div className="absolute top-0 bottom-0 left-44 w-1 bg-green-500 z-10 opacity-50">
            <div className="absolute -top-1 left-0 bg-green-500 text-white text-[9px] px-1 rounded-t font-bold">
              START
            </div>
          </div>

          {/* Grid markers */}
          {markers}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
            style={{ left: `${timeToPixels(timeline.currentTime) + 176}px` }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-sm shadow-lg" />
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-red-500" />
          </div>
        </div>
      </div>
    );
  };

  // Get thumbnail for item
  const getItemThumbnail = (item: TimelineItem): string => {
    if (!item.elementType) {
      // Fallback based on track type
      return item.trackType === 'audio' ? '🎵' : '📦';
    }

    const iconMap: Record<string, string> = {
      TEXT: '📝',
      IMAGE: '🖼️',
      VIDEO: '🎬',
      RECT: '▭',
      CIRCLE: '⚪',
      TRIANGLE: '▲',
      STAR: '⭐',
      HEART: '❤️',
      AUDIO: '🎵',
    };

    return iconMap[String(item.elementType)] ?? '📦';
  };


  // Render timeline item (CapCut style)
  const renderItem = (item: TimelineItem, track: TimelineTrack) => {
    const x = timeToPixels(item.startTime);
    const width = timeToPixels(item.duration);
    const isSelected = selectedItemIds.includes(item.id);
    const isLocked = item.locked || track.locked;
    const isHovered = hoveredItem === item.id;
    const isDraggingThis = draggedItem === item.id;
    const isResizingThis = resizingItem === item.id;

    const isVisual = item.trackType === 'visual';

    // Calculate IN/OUT point positions
    const inPointX = timeToPixels(item.inPoint || 0);
    const outPointX = timeToPixels(item.outPoint || item.duration);
    const hasInOutPoints = (item.inPoint || 0) > 0 || (item.outPoint || item.duration) < item.duration;

    return (
      <div
        key={item.id}
        className={`absolute h-12 rounded overflow-hidden transition-all group ${isLocked ? 'cursor-not-allowed' : 'cursor-move'
          } ${isDraggingThis || isResizingThis ? 'opacity-70 shadow-2xl scale-105 z-30' : 'z-10'}`}
        style={{
          left: `${x}px`,
          width: `${width}px`,
          top: '8px',
        }}
        onMouseDown={(e) => !isLocked && handleItemMouseDown(e, item, track.id)}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={(e) => handleItemClick(e, item.id)}
      >
        {/* Partition end marker */}
        <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white/50 z-10" />

        {/* Dimmed areas (before IN and after OUT) */}
        {hasInOutPoints && (
          <>
            {(item.inPoint || 0) > 0 && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-black bg-opacity-60 pointer-events-none"
                style={{ width: `${inPointX}px` }}
              />
            )}
            {(item.outPoint || item.duration) < item.duration && (
              <div
                className="absolute right-0 top-0 bottom-0 bg-black bg-opacity-60 pointer-events-none"
                style={{ width: `${width - outPointX}px` }}
              />
            )}
          </>
        )}

        {/* Item background with gradient */}
        <div className={`absolute inset-0 ${isSelected
            ? isVisual
              ? 'bg-gradient-to-r from-blue-500 to-blue-600'
              : 'bg-gradient-to-r from-green-500 to-green-600'
            : isVisual
              ? 'bg-gradient-to-r from-purple-500 to-purple-600'
              : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
          }`}>
          {/* Waveform pattern for audio */}
          {!isVisual && (
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%" className="h-full">
                <pattern id={`wave-${item.id}`} x="0" y="0" width="20" height="48" patternUnits="userSpaceOnUse">
                  <rect x="2" y="18" width="2" height="12" fill="white" />
                  <rect x="6" y="14" width="2" height="20" fill="white" />
                  <rect x="10" y="10" width="2" height="28" fill="white" />
                  <rect x="14" y="16" width="2" height="16" fill="white" />
                </pattern>
                <rect width="100%" height="100%" fill={`url(#wave-${item.id})`} />
              </svg>
            </div>
          )}
        </div>

        {/* IN/OUT point markers */}
        {(isSelected || isHovered) && !isLocked && (
          <>
            {/* IN point marker */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-yellow-400 cursor-col-resize hover:w-1.5 transition-all z-20"
              style={{ left: `${inPointX}px` }}
              title="IN Point - Drag to adjust start"
            >
              <div className="absolute top-0 left-0 w-3 h-3 bg-yellow-400 rounded-br transform -translate-x-px">
                <span className="text-[8px] font-bold text-black">IN</span>
              </div>
            </div>

            {/* OUT point marker */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-yellow-400 cursor-col-resize hover:w-1.5 transition-all z-20"
              style={{ left: `${outPointX}px` }}
              title="OUT Point - Drag to adjust end"
            >
              <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 rounded-bl transform translate-x-px">
                <span className="text-[8px] font-bold text-black">OUT</span>
              </div>
            </div>
          </>
        )}

        {/* Selection border */}
        {isSelected && (
          <div className="absolute inset-0 border-2 border-white rounded pointer-events-none" />
        )}

        {/* Content */}
        <div className="relative h-full px-2 py-1 flex items-center gap-2 text-white text-xs font-medium select-none">
          {/* Thumbnail/Icon */}
          <span className="text-lg">{getItemThumbnail(item)}</span>

          {/* Name with Element ID */}
          <div className="flex-1 truncate">
            <div className="font-semibold">{item.elementType}</div>
            <div className="text-[9px] opacity-60">Start: {formatTime(item.startTime)} | End: {formatTime(item.startTime + item.duration)}</div>
          </div>

          {/* Lock icon */}
          {isLocked && <Lock size={12} className="opacity-70" />}

          {/* Duration */}
          <span className="text-[10px] opacity-70 font-bold">{formatTime(item.duration)}</span>
        </div>

        {/* Trim handles (visible on hover or selection) */}
        {!isLocked && (isHovered || isSelected || isResizingThis) && (
          <>
            <div
              className="absolute left-0 top-0 bottom-0 w-2 bg-white bg-opacity-40 cursor-ew-resize hover:bg-opacity-60 transition-all"
              style={{ borderLeft: '2px solid white' }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-2 bg-white bg-opacity-40 cursor-ew-resize hover:bg-opacity-60 transition-all"
              style={{ borderRight: '2px solid white' }}
            />
          </>
        )}

        {/* Hover actions */}
        {isHovered && !isDraggingThis && !isLocked && (
          <div className="absolute top-0 right-0 flex gap-1 p-1 bg-black bg-opacity-50 rounded-bl">
            <button
              onClick={(e) => { e.stopPropagation(); handleSplitItem(item.id); }}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
              title="Split"
            >
              <Scissors size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDuplicateItem(item.id); }}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
              title="Duplicate"
            >
              <Copy size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }}
              className="p-1 hover:bg-red-500 rounded"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render track (CapCut style)
  const renderTrack = (track: TimelineTrack) => {
    const totalWidth = Math.max(timeToPixels(timeline.totalDuration), 2000);
    const isHovered = hoveredTrack === track.id;
    const isDragTarget = isDragging && targetTrackId === track.id;

    return (
      <div
        key={track.id}
        className={`flex border-b border-gray-700 ${isDragTarget
            ? 'bg-blue-900 bg-opacity-30'
            : isHovered
              ? 'bg-gray-800'
              : 'bg-gray-900'
          } transition-colors`}
        onMouseEnter={() => setHoveredTrack(track.id)}
        onMouseLeave={() => setHoveredTrack(null)}
      >
        {/* Track header */}
        <div className="w-44 flex-shrink-0 border-r border-gray-700 bg-gray-850 px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white truncate flex-1">
              {track.name}
            </span>
            <button
              onClick={() => handleRemoveTrack(track.id)}
              className="p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400"
              title="Remove track"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleToggleTrackVisibility(track.id)}
              className={`p-1 rounded ${track.visible ? 'text-blue-400' : 'text-gray-500'}`}
              title={track.visible ? 'Hide' : 'Show'}
            >
              {track.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              onClick={() => handleToggleTrackLock(track.id)}
              className={`p-1 rounded ${track.locked ? 'text-yellow-400' : 'text-gray-500'}`}
              title={track.locked ? 'Unlock' : 'Lock'}
            >
              {track.locked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
            {track.type === 'audio' && (
              <button
                className={`p-1 rounded ${track.muted ? 'text-red-400' : 'text-gray-400'}`}
                title={track.muted ? 'Unmute' : 'Mute'}
              >
                {track.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            )}

            <div className="text-[10px] text-gray-500 ml-auto">
              {track.items.length}
            </div>
          </div>
        </div>

        {/* Track timeline */}
        <div className="relative h-16 flex-1">
          <div className="relative h-full" style={{ width: `${totalWidth}px` }}>
            {/* Grid lines */}
            {Array.from({ length: Math.ceil(timeline.totalDuration / 1000) }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-gray-800"
                style={{ left: `${timeToPixels(i * 1000)}px` }}
              />
            ))}

            {/* Items */}
            {track.items.map(item => renderItem(item, track))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      {/* Control bar (CapCut style) */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-700">
        {/* Playback controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleStop}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title="Stop"
          >
            <StopCircle size={18} className="text-gray-300" />
          </button>
          <button
            onClick={() => handleSeek(Math.max(0, timeline.currentTime - 1000))}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title="Back 1s"
          >
            <SkipBack size={18} className="text-gray-300" />
          </button>
          <button
            onClick={timeline.isPlaying ? handlePause : handlePlay}
            className="p-2 hover:bg-blue-600 bg-blue-500 rounded-lg transition-colors"
            title={timeline.isPlaying ? 'Pause' : 'Play'}
          >
            {timeline.isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
          </button>
          <button
            onClick={() => handleSeek(Math.min(timeline.totalDuration, timeline.currentTime + 1000))}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title="Forward 1s"
          >
            <SkipForward size={18} className="text-gray-300" />
          </button>
        </div>

        {/* Time display */}
        <div className="px-3 py-1 bg-gray-800 rounded font-mono text-sm text-blue-400 min-w-[140px] text-center">
          {formatTime(timeline.currentTime)} / {formatTime(timeline.totalDuration)}
        </div>

        <div className="w-px h-6 bg-gray-700" />

        {/* Speed control */}
        <select
          value={timeline.playbackSpeed}
          onChange={(e) => onTimelineChange(timelineService.setPlaybackSpeed(timeline, parseFloat(e.target.value)))}
          className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs hover:border-gray-600 focus:outline-none focus:border-blue-500"
        >
          <option value="0.25">0.25x</option>
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1">1.0x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2.0x</option>
        </select>

        {/* Loop toggle */}
        <button
          onClick={handleToggleLoop}
          className={`px-3 py-1 rounded text-xs transition-colors ${timeline.loop ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          title="Toggle Loop"
        >
          Loop
        </button>

        <div className="flex-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-2 bg-gray-800 rounded px-2 py-1">
          <button
            onClick={handleZoomOut}
            className="p-1 hover:bg-gray-700 rounded"
            title="Zoom Out"
          >
            <ZoomOut size={16} className="text-gray-300" />
          </button>
          <div className="w-20 h-1 bg-gray-700 rounded-full relative">
            <div
              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${((timeline.zoom - 10) / (200 - 10)) * 100}%` }}
            />
          </div>
          <button
            onClick={handleZoomIn}
            className="p-1 hover:bg-gray-700 rounded"
            title="Zoom In"
          >
            <ZoomIn size={16} className="text-gray-300" />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-700" />

        {/* Add track buttons */}
        <button
          onClick={() => handleAddTrack('visual')}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-xs font-medium transition-colors"
        >
          + Track
        </button>
        <button
          onClick={() => handleAddTrack('audio')}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-medium transition-colors"
        >
          + Audio
        </button>

        {/* Arrange Sequential button */}
        {onArrangeSequential && (
          <>
            <div className="w-px h-6 bg-gray-700" />
            <button
              onClick={onArrangeSequential}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Arrange all items one after another"
            >
              <ListOrdered size={14} />
              Arrange Sequential
            </button>
          </>
        )}
      </div>

      {/* Timeline area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Ruler - Hidden overflow, scroll synced with tracks */}
        <div className="overflow-hidden bg-gray-900 border-b border-gray-700">
          <div
            className="overflow-x-auto overflow-y-hidden scrollbar-thin"
            ref={scrollContainerRef}
            style={{ width: '100%' }}
          >
            {renderRuler()}
          </div>
        </div>

        {/* Tracks - Main scroll container */}
        <div className="flex-1 overflow-auto scrollbar-thin" ref={timelineRef}>
          {timeline.tracks.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">No tracks yet</p>
                <p className="text-sm opacity-70">Click "+ Track" or "+ Audio" to add a track</p>
              </div>
            </div>
          ) : (
            timeline.tracks.map(track => renderTrack(track))
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-900 border-t border-gray-700 text-[11px] text-gray-400">
        <div className="flex items-center gap-4">
          <span className="text-blue-400 font-semibold">{timeline.fps} FPS</span>
          <span>{timeline.tracks.length} tracks</span>
          <span>{timeline.tracks.reduce((sum, t) => sum + t.items.length, 0)} clips</span>
          <span>Snap: {timeline.snapInterval}ms</span>
          {timeline.isPlaying && (
            <span className="text-green-400 font-semibold animate-pulse">
              ▶ PLAYING | Active: {
                timeline.tracks
                  .flatMap(t => t.items)
                  .filter(item =>
                    timeline.currentTime >= item.startTime &&
                    timeline.currentTime < item.startTime + item.duration
                  ).length
              } element(s)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-green-400">⚡ CapCut Engine | Partition Timeline</span>
          <span>Zoom: {timeline.zoom.toFixed(0)}px/s</span>
        </div>
      </div>
    </div>
  );
};

export default TimelineCapCut;
