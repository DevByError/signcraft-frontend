/**
 * Timeline System Types
 * Comprehensive timeline for managing shapes, media, and audio sequencing
 */

import { ElementType } from './canvas';
import { Animation } from './animation';

// ==================== Timeline Types ====================

export type TimelineTrackType = 'visual' | 'audio';

export interface TimelineItem {
  /** Unique identifier */
  id: string;
  /** Element ID this timeline item references */
  elementId: string;
  /** Type of element */
  elementType: ElementType;
  /** Track type (visual or audio) */
  trackType: TimelineTrackType;
  /** Start time in milliseconds (global timeline time) */
  startTime: number;
  /** Duration in milliseconds */
  duration: number;
  /** IN point - where the item content starts (relative to startTime) */
  inPoint: number;
  /** OUT point - where the item content ends (relative to startTime) */
  outPoint: number;
  /** Layer/track index (for visual stacking) */
  layer: number;
  /** Whether item is locked */
  locked: boolean;
  /** CapCut-style animations (clip-local time, keyframe-based) */
  animations?: Animation[];
  /** Visual properties snapshot */
  // new one

  properties?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    opacity?: number;
    rotation?: number;
    zIndex?: number;
    color?: string;
    backgroundColor?: string;
    fillColor?: string;
    fontSize?: number;
  };
  /** Audio properties (for audio tracks) */
  audioProperties?: {
    volume: number; // 0-1
    fadeIn?: number; // Duration in ms
    fadeOut?: number; // Duration in ms
    startOffset?: number; // Start offset in ms from original file
  };
  /** Transition effects (legacy - use animations instead) */
  transition?: {
    fadeIn?: number; // Fade in duration in ms
    fadeOut?: number; // Fade out duration in ms
    type?: 'fade' | 'slide' | 'zoom' | 'none';
  };
  // new one
  initialState?: any;
}

export interface TimelineTrack {
  /** Track identifier */
  id: string;
  /** Track name */
  name: string;
  /** Track type */
  type: TimelineTrackType;
  /** Track layer order (higher = on top) */
  order: number;
  /** Items in this track */
  items: TimelineItem[];
  /** Whether track is visible */
  visible: boolean;
  /** Whether track is locked */
  locked: boolean;
  /** Whether track is muted (for audio) */
  muted?: boolean;
  /** Track volume (for audio tracks, 0-1) */
  volume?: number;
}

export interface Timeline {
  /** Timeline identifier */
  id: string;
  /** Design ID this timeline belongs to */
  designId: string;
  /** Frames per second for export consistency */
  fps: number;
  /** All tracks (visual and audio) */
  tracks: TimelineTrack[];
  /** Total duration in milliseconds */
  totalDuration: number;
  /** Current playback position in milliseconds */
  currentTime: number;
  /** Whether timeline is playing */
  isPlaying: boolean;
  /** Whether timeline is looping */
  loop: boolean;
  /** Playback speed multiplier */
  playbackSpeed: number;
  /** Snap to grid (in milliseconds) */
  snapInterval: number;
  /** Zoom level (pixels per second) */
  zoom: number;
}

export interface TimelineConfig {
  /** Default snap interval in ms */
  defaultSnapInterval: number;
  /** Default zoom level */
  defaultZoom: number;
  /** Minimum duration for items in ms */
  minItemDuration: number;
  /** Grid intervals (in ms) for different zoom levels */
  gridIntervals: number[];
  /** Default track height in pixels */
  trackHeight: number;
  /** Maximum number of visual tracks */
  maxVisualTracks: number;
  /** Maximum number of audio tracks */
  maxAudioTracks: number;
}

// ==================== Timeline Actions ====================

export interface TimelineAction {
  type:
  | 'ADD_ITEM'
  | 'REMOVE_ITEM'
  | 'UPDATE_ITEM'
  | 'MOVE_ITEM'
  | 'RESIZE_ITEM'
  | 'ADD_TRACK'
  | 'REMOVE_TRACK'
  | 'REORDER_TRACK'
  | 'TOGGLE_TRACK_VISIBILITY'
  | 'TOGGLE_TRACK_LOCK'
  | 'UPDATE_PLAYBACK_POSITION'
  | 'PLAY'
  | 'PAUSE'
  | 'STOP'
  | 'SEEK'
  | 'SET_LOOP'
  | 'SET_SPEED'
  | 'SET_ZOOM'
  | 'SET_SNAP';
  payload?: any;
}

// ==================== Layer Management ====================

export interface LayerAction {
  type:
  | 'BRING_TO_FRONT'
  | 'SEND_TO_BACK'
  | 'BRING_FORWARD'
  | 'SEND_BACKWARD'
  | 'SET_LAYER_ORDER';
  elementId: string;
  targetLayer?: number;
}

export interface LayerInfo {
  elementId: string;
  elementType: ElementType;
  name: string;
  layer: number;
  visible: boolean;
  locked: boolean;
  thumbnail?: string;
}

// ==================== Timeline State ====================

export interface TimelineState {
  /** Current timeline */
  timeline: Timeline;
  /** Selected items */
  selectedItems: string[];
  /** Clipboard items */
  clipboard: TimelineItem[];
  /** Undo stack */
  undoStack: TimelineAction[];
  /** Redo stack */
  redoStack: TimelineAction[];
  /** Whether snap is enabled */
  snapEnabled: boolean;
  /** Timeline ruler markers */
  markers: TimelineMarker[];
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color?: string;
}

// ==================== Timeline Events ====================

export interface TimelineEvent {
  type:
  | 'itemAdded'
  | 'itemRemoved'
  | 'itemMoved'
  | 'itemResized'
  | 'playbackStarted'
  | 'playbackPaused'
  | 'playbackStopped'
  | 'timeUpdated'
  | 'durationChanged';
  timestamp: number;
  data?: any;
}

// ==================== Timeline Export ====================

export interface TimelineExport {
  version: string;
  timeline: Timeline;
  elements: {
    [elementId: string]: {
      type: ElementType;
      properties: any;
    };
  };
  metadata: {
    createdAt: string;
    modifiedAt: string;
    duration: number;
  };
}

// ==================== Playback Control ====================

export interface PlaybackControl {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setSpeed: (speed: number) => void;
  setLoop: (loop: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
}

// ==================== Property Timeline ====================

export interface PropertyKeyframe {
  /** Time in milliseconds (relative to item start) */
  time: number;
  /** Property values at this time */
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
}

export interface PropertyTimeline {
  /** Item ID */
  itemId: string;
  /** Keyframes */
  keyframes: PropertyKeyframe[];
}

// ==================== Timeline Constraints ====================

export interface TimelineConstraints {
  /** Minimum duration in ms */
  minDuration: number;
  /** Maximum duration in ms */
  maxDuration: number;
  /** Minimum item duration in ms */
  minItemDuration: number;
  /** Maximum overlap allowed in ms */
  maxOverlap: number;
  /** Whether items can overlap */
  allowOverlap: boolean;
  /** Whether to auto-arrange items */
  autoArrange: boolean;
}
