// Local design store for offline persistence
// Uses localStorage under the key namespace 'signcraft:designs'

export interface StoredDesignMetadata {
  title: string;
  canvasWidth: number;
  canvasHeight: number;
  canvasColor: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  version?: number;
}

export interface StoredDesign {
  id: string;
  metadata: StoredDesignMetadata;
  designJSON: any;
}

const NAMESPACE = 'signcraft:designs';

const readAll = (): Record<string, StoredDesign> => {
  try {
    const raw = localStorage.getItem(NAMESPACE);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeAll = (data: Record<string, StoredDesign>) => {
  localStorage.setItem(NAMESPACE, JSON.stringify(data));
};

const makeId = (): string => Math.random().toString(36).slice(2, 10);

export interface SaveResponse {
  success: boolean;
  designId?: string;
  error?: string;
}

export const saveDesignLocal = (design: Omit<StoredDesign, 'id'>): SaveResponse => {
  try {
    const all = readAll();
    const id = makeId();
    const record: StoredDesign = { id, ...design } as StoredDesign;
    all[id] = record;
    writeAll(all);
    return { success: true, designId: id };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to save locally' };
  }
};

export const updateDesignLocal = (id: string, design: Omit<StoredDesign, 'id'>): SaveResponse => {
  try {
    const all = readAll();
    if (!all[id]) {
      return { success: false, error: 'Design not found' };
    }
    all[id] = { id, ...design } as StoredDesign;
    writeAll(all);
    return { success: true, designId: id };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to update locally' };
  }
};

export const getDesignLocalById = (id: string): StoredDesign | null => {
  const all = readAll();
  return all[id] || null;
};

export const listDesignLocals = (): StoredDesign[] => {
  const all = readAll();
  return Object.values(all).sort((a, b) => (b.metadata.updatedAt || '').localeCompare(a.metadata.updatedAt || ''));
};

export const deleteDesignLocal = (id: string): boolean => {
  const all = readAll();
  if (!all[id]) return false;
  delete all[id];
  writeAll(all);
  return true;
};
