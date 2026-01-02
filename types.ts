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

/**
 * Canvas element types - Single source of truth
 * @see ./types/canvas.ts
 */
export { ElementType, ElementTypeValue, CanvasElement, TextStyle, Shadow, WidgetSettings } from './types/canvas';

export interface Design {
  id: string;
  name: string;
  resolution: BillboardResolution;
  elements: any[]; // Use CanvasElement from types/canvas
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
