export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
}

export enum ElementType {
  // Essential
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SLIDESHOW = 'SLIDESHOW',
  TICKER = 'TICKER',
  RSS = 'RSS',
  WEATHER = 'WEATHER',
  
  // Media
  VIDEO = 'VIDEO',
  GIF = 'GIF',
  MEDIA_RSS = 'MEDIA_RSS',
  YOUTUBE = 'YOUTUBE',
  USTREAM = 'USTREAM',
  FTP = 'FTP',
  INSTAGRAM = 'INSTAGRAM',
  STREAMING = 'STREAMING',
  
  // General
  LABEL = 'LABEL',
  CLOCK = 'CLOCK',
  TIMER = 'TIMER',
  SHAPE = 'SHAPE',
  TOUCH = 'TOUCH',
  WEATHER_2 = 'WEATHER_2',
  
  // Primitive Shapes
  RECT = 'RECT',
  CIRCLE = 'CIRCLE',
  TRIANGLE = 'TRIANGLE',
  STAR = 'STAR',
  HEART = 'HEART',
  DIAMOND = 'DIAMOND',
  PENTAGON = 'PENTAGON',
  HEXAGON = 'HEXAGON',
  OCTAGON = 'OCTAGON',
  LINE = 'LINE',
  
  // Advanced
  AD_SERVING = 'AD_SERVING',
  CALENDAR = 'CALENDAR',
  DASHBOARDS = 'DASHBOARDS',
  TABLE = 'TABLE',
  SMART_SWITCH = 'SMART_SWITCH',
  
  // Embed
  WEB_IMAGE = 'WEB_IMAGE',
  WEB_VIDEO = 'WEB_VIDEO',
  SUB_CREATIVE = 'SUB_CREATIVE',
  EMBED = 'EMBED',
}

export interface TextStyle {
  bold: boolean; // Required with default false
  italic: boolean; // Required with default false
  underline: boolean; // Required with default false
  textAlign: 'left' | 'center' | 'right' | 'justify'; // Required with default 'left'
  fontFamily: string; // Required with default 'Arial'
  letterSpacing: number; // In pixels, required with default 0
  lineHeight: number; // In pixels, required with default 1.2x font size
}

export interface Shadow {
  offsetX: number; // In pixels, required
  offsetY: number; // In pixels, required
  blur: number; // In pixels, required
  color: string; // Hex format (#RRGGBBAA), required
  opacity: number; // 0-1, required
}

export interface WidgetSettings {
  // Video/YouTube/Streaming settings
  autoplay?: boolean;
  loop?: boolean;
  videoUrl?: string;
  
  // Slideshow settings
  transitionDuration?: number; // seconds
  transitionEffect?: 'fade' | 'slide' | 'zoom' | 'flip';
  
  // Ticker settings
  scrollSpeed?: 'slow' | 'medium' | 'fast';
  
  // RSS settings
  feedUrl?: string;
  updateInterval?: number; // minutes
  maxItems?: number;
  
  // Weather settings
  location?: string;
  temperatureUnit?: 'F' | 'C';
  apiKey?: string;
  
  // Clock settings
  timeFormat?: '12' | '24';
  timezone?: string;
  
  // Timer settings
  countdownTo?: string; // ISO datetime
  displayFormat?: 'HH:MM:SS' | 'DD:HH:MM:SS' | 'Days, Hours, Minutes';
  
  // Calendar settings
  calendarSource?: 'google' | 'outlook' | 'ical';
  calendarUrl?: string;
  viewMode?: 'monthly' | 'weekly' | 'agenda';
  
  // Table settings
  rows?: number;
  columns?: number;
  dataSource?: 'manual' | 'csv' | 'sheets' | 'api';
  dataUrl?: string;
  
  // Dashboard settings
  refreshRate?: number; // seconds
  
  // Instagram settings
  username?: string;
  displayMode?: 'grid' | 'carousel' | 'single';
  
  // Touch settings
  actionType?: 'url' | 'show' | 'hide' | 'play' | 'custom';
  targetAction?: string;
  
  // Smart Switch settings
  switchCondition?: 'time' | 'day' | 'weather' | 'custom';
  contentA?: string;
  contentB?: string;
  
  // Ad Serving settings
  adNetwork?: string;
  adUnitId?: string;
  
  // FTP settings
  ftpServer?: string;
  ftpUsername?: string;
  ftpPassword?: string;
  
  // Embed settings
  embedCode?: string;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  content?: string; // Text content or Image URL
  
  // Position & Size (all in pixels, precise floating-point)
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number; // For circles: radius = width / 2
  
  // Appearance
  opacity: number; // 0-1, required with default 1
  rotation: number; // 0-360 degrees, required with default 0
  zIndex: number; // Required, integer for layer ordering
  
  // Colors & Styling (hex format #RRGGBB or #RRGGBBAA)
  color?: string; // Text color in hex format
  backgroundColor?: string; // Canvas/shape background in hex format
  fillColor?: string; // Shape fill in hex format
  strokeColor?: string; // Shape stroke in hex format
  strokeWidth?: number; // In pixels
  borderRadius?: number; // In pixels
  
  // Text styling
  fontSize?: number; // In pixels
  textStyle?: TextStyle;
  
  // Widget-specific settings
  widgetSettings?: WidgetSettings;
  
  // Effects
  shadow?: Shadow;
  
  // Animations (import from types/animation.ts)
  animation?: any; // ElementAnimation type (avoiding circular dependency)
  
  // State
  visible: boolean; // Required with default true
  locked: boolean; // Required with default false
  uploadedAt?: string; // ISO 8601 format
}

export interface Design {
  id: string;
  name: string;
  resolution: BillboardResolution;
  elements: CanvasElement[];
  lastModified: string; // ISO 8601 format
  ownerId: string; // Required, UUID format
  collaborators?: string[]; // Array of user IDs
  isShared: boolean; // Required with default false
  thumbnail?: string; // Base64 or image URL
  version: number; // For conflict resolution, required with default 1
  isLocked: boolean; // Design-level lock, required with default false
  tags?: string[]; // For categorization
  description?: string; // Design description
}

export interface BillboardResolution {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
}

export interface NavItem {
  label: string;
  path: string;
}

export interface CollaborativeSession {
  id: string;
  designId: string;
  users: string[];
  createdAt: string;
  lastActivity: string;
}

export interface MediaUpload {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  serverUrl: string;
}
