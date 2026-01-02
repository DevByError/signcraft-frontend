// localDesignStore.ts
// Local design store - Deprecated, but functions still exist for frontend compatibility

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

export interface SaveResponse {
  success: boolean;
  designId?: string;
  error?: string;
}

// --- Helper: read all designs from localStorage ---
export async function readAll(): Promise<StoredDesign[]> {
  const raw = localStorage.getItem('designs');
  return raw ? JSON.parse(raw) : [];
}

// --- Save a new design locally ---
export const saveDesignLocal = async (design: Omit<StoredDesign, 'id'>): Promise<SaveResponse> => {
  try {
    const all = await readAll();
    const newDesign: StoredDesign = { ...design, id: crypto.randomUUID() };
    all.push(newDesign);
    localStorage.setItem('designs', JSON.stringify(all));
    return { success: true, designId: newDesign.id };
  } catch (err) {
    console.error('saveDesignLocal error:', err);
    return { success: false, error: 'Failed to save locally' };
  }
};

// --- Update an existing design locally ---
export const updateDesignLocal = async (id: string, design: Omit<StoredDesign, 'id'>): Promise<SaveResponse> => {
  try {
    const all = await readAll();
    const index = all.findIndex(d => d.id === id);
    if (index === -1) return { success: false, error: 'Design not found' };
    all[index] = { ...design, id };
    localStorage.setItem('designs', JSON.stringify(all));
    return { success: true, designId: id };
  } catch (err) {
    console.error('updateDesignLocal error:', err);
    return { success: false, error: 'Failed to update locally' };
  }
};

// --- Get design by ID ---
export const getDesignLocalById = async (id: string): Promise<StoredDesign | null> => {
  const all = await readAll();
  return all.find(d => d.id === id) || null;
};

// --- List all designs ---
export const listDesignLocals = async (): Promise<StoredDesign[]> => {
  return await readAll();
};

// --- Delete design locally ---
export const deleteDesignLocal = async (id: string): Promise<StoredDesign[]> => {
  const all = await readAll();
  const filtered = all.filter(d => d.id !== id);
  localStorage.setItem('designs', JSON.stringify(filtered));
  return filtered;
};
