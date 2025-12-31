export type AssetType = 'image' | 'video' | 'audio' | 'icon' | 'svg' | 'font' | 'template';

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  src: string; // blob: or data: URL
  size: number; // bytes
  createdAt: string; // ISO timestamp
  tags: string[];
  folderId?: string;
  // Optional metadata
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number; // seconds
}

export interface AssetFolder {
  id: string;
  name: string;
  createdAt: string;
}
