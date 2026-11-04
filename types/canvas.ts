/**
 * Canvas Types - Single Source of Truth
 *
 * This file contains all type definitions for canvas elements.
 * ALL imports of CanvasElement and ElementType must come from this file.
 */

export enum ElementType {
  // Essential
  TEXT = 'text',
  IMAGE = 'image',
  SLIDESHOW = 'slideshow',
  TICKER = 'ticker',

  // Media
  VIDEO = 'video',
  GIF = 'gif',
  YOUTUBE = 'youtube',
  USTREAM = 'ustream',

  // General
  LABEL = 'label',
  CLOCK = 'clock',
  TIMER = 'timer',
  SHAPE = 'shape',

  // Primitive Shapes
  RECT = 'rect',
  CIRCLE = 'circle',
  TRIANGLE = 'triangle',
  STAR = 'star',
  HEART = 'heart',
  DIAMOND = 'diamond',
  PENTAGON = 'pentagon',
  HEXAGON = 'hexagon',
  OCTAGON = 'octagon',
  LINE = 'line',

  // Extended shapes
  TRAPEZOID = 'trapezoid',
  CRESCENT = 'crescent',
  CROSS = 'cross',

  // Advanced
  CALENDAR = 'calendar',

  // Embed
  WEB_IMAGE = 'web_image',
  WEB_VIDEO = 'web_video',
  SUB_CREATIVE = 'sub_creative',
  EMBED = 'embed',
  HTML = 'html',
}

/**
 * Union type that accepts both ElementType enum values and string literals matching enum values.
 * This allows flexibility in how element types are specified throughout the codebase.
 */
export type ElementTypeValue = ElementType |
  'text' | 'image' | 'slideshow' | 'ticker' |
  'video' | 'gif' | 'youtube' | 'ustream' |
  'label' | 'clock' | 'timer' | 'shape' |
  'rect' | 'circle' | 'triangle' | 'star' | 'heart' | 'diamond' | 'pentagon' | 'hexagon' | 'octagon' | 'line' |
  'trapezoid' | 'crescent' | 'cross' |
  'calendar' |
  'web_image' | 'web_video' | 'sub_creative' | 'embed' | 'html';

export interface TextStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  fontFamily: string;
  letterSpacing: number;
  lineHeight: number;
}

export interface Shadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
  opacity: number;
}

export interface WidgetSettings {
  // Video/YouTube/Streaming settings
  autoplay?: boolean;
  loop?: boolean;
  mute?: boolean;
  controls?: boolean;
  volume?: number;
  playbackSpeed?: number;
  fitMode?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  videoUrl?: string;
  embedCode?: string;
  duration?: number;


  // Slideshow
  slideDuration?: number;
  transitionDuration?: number;
  transitionEffect?: string;

  // Ticker/RSS
  scrollSpeed?: string;
  updateInterval?: number;
  maxItems?: number;
  displayMode?: string;

  // Weather
  temperature?: number;
  condition?: string;
  location?: string;
  temperatureUnit?: string;
  apiKey?: string;

  // Clock/Timer
  timeFormat?: string;
  timezone?: string;
  showSeconds?: boolean;
  showDate?: boolean;
  showIcon?: boolean;
  displayStyle?: string;
  timerType?: string;
  countdownTo?: string;
  displayFormat?: string;
  labelText?: string;
  autoStart?: boolean;

  // Direction/Animation
  direction?: string;
  pauseOnHover?: boolean;
  showImages?: boolean;

  // Calendar
  calendarSource?: 'google' | 'outlook' | 'ical';
  calendarUrl?: string;
  viewMode?: 'monthly' | 'weekly' | 'agenda';
  colorScheme?: string;
  showWeekends?: boolean;
  selectedDate?: string; // ISO date string (YYYY-MM-DD)

  // Table
  rows?: number;
  columns?: number;
  dataSource?: 'manual' | 'csv' | 'sheets' | 'api';
  dataUrl?: string;
  tableStyle?: string;
  showHeader?: boolean;
  sortable?: boolean;

  // Dashboard
  refreshRate?: number;
  dashboardType?: string;
  layout?: string;
  showCharts?: boolean;
  autoRefresh?: boolean;

  // Instagram
  username?: string;

  // Touch
  actionType?: 'url' | 'show' | 'hide' | 'play' | 'custom';
  targetAction?: string;

  // Smart Switch
  switchCondition?: 'time' | 'day' | 'weather' | 'custom';
  contentA?: string;
  contentB?: string;

  // Ad Serving
  adNetwork?: string;
  adUnitId?: string;

  // FTP
  ftpServer?: string;
  ftpUsername?: string;
  ftpPassword?: string;
}

export interface CanvasElement {
  id: string;
  type: ElementTypeValue;
  content?: string;

  // Position & Size
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;

  // Appearance
  opacity: number;
  rotation: number;
  zIndex: number;

  // Colors & Styling
  color?: string;
  backgroundColor?: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;

  // Text styling
  fontSize?: number;
  textStyle?: TextStyle;

  // Widget-specific settings
  widgetSettings?: WidgetSettings;

  // Effects
  shadow?: Shadow;

  // Animations
  animation?: any;
  animationDuration?: number;
  animationSpeed?: number;

  // State
  visible: boolean;
  locked: boolean;
  uploadedAt?: string;
}
