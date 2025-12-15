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
  // Text & Image
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  
  // Primitive Shapes (NOT styles of rectangle!)
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
  
  // Placeholder for future
  VIDEO = 'VIDEO',
  CLOCK = 'CLOCK',
  WEATHER = 'WEATHER',
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
  
  // Effects
  shadow?: Shadow;
  
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
