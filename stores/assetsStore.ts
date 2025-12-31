import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Asset, AssetFolder, AssetType } from '../types/assets';
import { listDesignLocals } from '../services/localDesignStore';

const STORAGE_KEY = 'signcraft:assets';

const makeId = () => Math.random().toString(36).slice(2, 10);

const detectType = (file: File): AssetType => {
  const t = file.type;
  if (t.startsWith('image/')) {
    return t === 'image/svg+xml' ? 'svg' : 'image';
  }
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('audio/')) return 'audio';
  return 'icon';
};

export interface AssetsState {
  assets: Record<string, Asset>;
  folders: Record<string, AssetFolder>;
  viewMode: 'grid' | 'list';
  filter: { type?: AssetType; folderId?: string; search?: string };

  // Core actions
  addFiles: (files: File[]) => Promise<void>;
  addUrl: (url: string, name?: string, type?: AssetType) => void;
  importJSON: (data: Asset[]) => void;
  exportJSON: () => Asset[];

  renameAsset: (id: string, name: string) => void;
  duplicateAsset: (id: string) => string | null;
  deleteAsset: (id: string) => { success: boolean; usageCount: number };
  replaceAssetSrc: (id: string, fileOrDataUrl: File | string) => Promise<boolean>;

  bulkDelete: (ids: string[]) => { deleted: string[]; failed: string[] };
  setViewMode: (mode: 'grid' | 'list') => void;
  setFilter: (filter: Partial<AssetsState['filter']>) => void;
}

const revokeIfBlob = (src: string) => {
  if (src && src.startsWith('blob:')) {
    try { URL.revokeObjectURL(src); } catch {}
  }
};

export const useAssetsStore = create<AssetsState>()(persist((set, get) => ({
  assets: {},
  folders: {},
  viewMode: 'grid',
  filter: {},

  addFiles: async (files: File[]) => {
    const assets = { ...get().assets };
    for (const file of files) {
      const id = makeId();
      const type = detectType(file);
      const src = URL.createObjectURL(file);
      const createdAt = new Date().toISOString();
      const mimeType = file.type;
      const size = file.size;
      assets[id] = { id, type, name: file.name, src, size, createdAt, tags: [], mimeType };
    }
    set({ assets });
  },

  addUrl: (url: string, name?: string, type?: AssetType) => {
    if (!url) return;
    // Disallow http(s) to keep offline-only unless it's a data: URL
    if (!url.startsWith('data:') && !url.startsWith('blob:')) {
      console.warn('Asset URL must be data: or blob: for offline-only');
      return;
    }
    const id = makeId();
    const createdAt = new Date().toISOString();
    const aType: AssetType = type || (url.includes('svg') ? 'svg' : 'image');
    const asset: Asset = {
      id,
      type: aType,
      name: name || 'Asset',
      src: url,
      size: url.length,
      createdAt,
      tags: [],
    };
    set({ assets: { ...get().assets, [id]: asset } });
  },

  importJSON: (data: Asset[]) => {
    const assets = { ...get().assets };
    for (const a of data) {
      assets[a.id || makeId()] = {
        id: a.id || makeId(),
        type: a.type,
        name: a.name,
        src: a.src,
        size: a.size || (a.src?.length || 0),
        createdAt: a.createdAt || new Date().toISOString(),
        tags: Array.isArray(a.tags) ? a.tags : [],
        folderId: a.folderId,
        mimeType: a.mimeType,
        width: a.width,
        height: a.height,
        duration: a.duration,
      };
    }
    set({ assets });
  },

  exportJSON: () => {
    return Object.values(get().assets);
  },

  renameAsset: (id: string, name: string) => {
    const assets = { ...get().assets };
    if (assets[id]) {
      assets[id].name = name.trim();
      set({ assets });
    }
  },

  duplicateAsset: (id: string) => {
    const assets = { ...get().assets };
    const orig = assets[id];
    if (!orig) return null;
    const newId = makeId();
    assets[newId] = { ...orig, id: newId, name: `${orig.name} Copy` };
    set({ assets });
    return newId;
  },

  deleteAsset: (id: string) => {
    const assets = { ...get().assets };
    const asset = assets[id];
    if (!asset) return { success: false, usageCount: 0 };
    // Dependency check: scan designs for assetId usage
    const designs = listDesignLocals();
    let usage = 0;
    for (const d of designs) {
      const elements = d.designJSON?.elements || [];
      for (const el of elements) {
        if (el.assetId === id) usage++;
      }
    }
    if (usage > 0) {
      return { success: false, usageCount: usage };
    }
    revokeIfBlob(asset.src);
    delete assets[id];
    set({ assets });
    return { success: true, usageCount: 0 };
  },

  replaceAssetSrc: async (id: string, fileOrDataUrl: File | string) => {
    const assets = { ...get().assets };
    const asset = assets[id];
    if (!asset) return false;
    let nextSrc = asset.src;
    let size = asset.size;
    let mimeType = asset.mimeType;
    if (fileOrDataUrl instanceof File) {
      revokeIfBlob(asset.src);
      nextSrc = URL.createObjectURL(fileOrDataUrl);
      size = fileOrDataUrl.size;
      mimeType = fileOrDataUrl.type;
    } else if (typeof fileOrDataUrl === 'string') {
      if (!fileOrDataUrl.startsWith('data:') && !fileOrDataUrl.startsWith('blob:')) return false;
      revokeIfBlob(asset.src);
      nextSrc = fileOrDataUrl;
      size = fileOrDataUrl.length;
    }
    assets[id] = { ...asset, src: nextSrc, size, mimeType };
    set({ assets });
    return true;
  },

  bulkDelete: (ids: string[]) => {
    const deleted: string[] = [];
    const failed: string[] = [];
    for (const id of ids) {
      const res = get().deleteAsset(id);
      if (res.success) deleted.push(id); else failed.push(id);
    }
    return { deleted, failed };
  },

  setViewMode: (mode: 'grid' | 'list') => set({ viewMode: mode }),
  setFilter: (filter: Partial<AssetsState['filter']>) => set({ filter: { ...get().filter, ...filter } }),

}), { name: STORAGE_KEY }));
