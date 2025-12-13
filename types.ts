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
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontFamily?: string;
  letterSpacing?: number;
  lineHeight?: number;
}

export interface Shadow {
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  color?: string;
  opacity?: number;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  content?: string; // Text content or Image URL
  
  // Position & Size
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number; // For circles: radius = width / 2
  
  // Appearance
  opacity?: number;
  rotation?: number;
  zIndex?: number;
  
  // Colors & Styling
  color?: string; // Text color
  backgroundColor?: string;
  fillColor?: string; // Shape fill
  strokeColor?: string; // Shape stroke
  strokeWidth?: number;
  borderRadius?: number;
  
  // Text styling
  fontSize?: number;
  textStyle?: TextStyle;
  
  // Effects
  shadow?: Shadow;
  
  // State
  visible?: boolean;
  uploadedAt?: string;
}

export interface Design {
  id: string;
  name: string;
  resolution: BillboardResolution;
  elements: CanvasElement[];
  lastModified: string;
  ownerId?: string;
  collaborators?: string[];
  isShared?: boolean;
  thumbnail?: string;
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
