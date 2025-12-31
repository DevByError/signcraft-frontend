// Screen Service - Backend API Integration
// API base URL for backend integration
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Local-only screen service stubs (for fallback)
const Timestamp = { now: () => new Date().toISOString() } as any;

export interface ScreenDocument {
  id: string;
  screenId: string;
  userId: string;
  userEmail: string;
  name: string;
  location: string;
  resolution: string;
  status: 'online' | 'offline';
  lastSeen: Timestamp;
  ipAddress: string;
  playlistId?: string;
  playlistName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const SCREENS_COLLECTION = 'screens';
const getCurrentUser = () => ({ uid: 'guest-user-123', email: 'guest@signcraft.com' });
const STORAGE_KEY = 'signcraft:screens';
const readAll = () => {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
};
const writeAll = (arr: any[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

export const createScreen = async (name: string, location: string, res: string = '1920x1080', ip: string = '', pId?: string) => {
  const user = getCurrentUser();
  const screens = readAll();
  const id = Math.random().toString(36).slice(2, 10);
  screens.push({ id, screenId: `scr${Math.floor(Math.random() * 1000)}`, userId: user.uid, userEmail: user.email, name, location, resolution: res, ipAddress: ip, status: 'offline', lastSeen: Timestamp.now(), playlistId: pId || null, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
  writeAll(screens);
  return { success: true, screenId: id };
};

export const getUserScreens = async (limitNum: number = 100): Promise<ScreenDocument[]> => {
  return readAll().slice(0, limitNum);
};

export const updateScreenStatus = async (id: string, status: 'online' | 'offline') => {
  const screens = readAll();
  const idx = screens.findIndex((s: any) => s.id === id);
  if (idx >= 0) { screens[idx].status = status; screens[idx].lastSeen = Timestamp.now(); writeAll(screens); return { success: true }; }
  return { success: false };
};

export const deleteScreen = async (id: string) => {
  const screens = readAll();
  const next = screens.filter((s: any) => s.id !== id);
  writeAll(next);
  return { success: true };
};

// ==================== Backend API Integration ====================

/**
 * Get all screens from backend
 */
export const getScreensFromBackend = async (): Promise<{
  success: boolean;
  data?: any[];
  msg?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE}/design/getscreens`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ [SCREEN_BACKEND] Fetched screens:', result);
    return result;
  } catch (error) {
    console.error('❌ [SCREEN_BACKEND] Error fetching screens:', error);
    return {
      success: false,
      msg: error instanceof Error ? error.message : 'Failed to fetch screens',
    };
  }
};

/**
 * Get screen by ID from backend
 */
export const getScreenByIdFromBackend = async (id: string): Promise<{
  success: boolean;
  data?: any;
  msg?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE}/design/getscreenbyid?id=${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ [SCREEN_BACKEND] Fetched screen details:', result);
    return result;
  } catch (error) {
    console.error('❌ [SCREEN_BACKEND] Error fetching screen details:', error);
    return {
      success: false,
      msg: error instanceof Error ? error.message : 'Failed to fetch screen details',
    };
  }
};

/**
 * Create or update screen on backend
 */
export const updateScreenToBackend = async (data: {
  id?: string;
  screenName: string;
  screenLocation: string;
  screenCustomId?: string;
  playlistId?: string;
  userID?: string;
}): Promise<{
  success: boolean;
  data?: any;
  msg?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE}/design/postscreenupdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ [SCREEN_BACKEND] Updated screen:', result);
    return result;
  } catch (error) {
    console.error('❌ [SCREEN_BACKEND] Error updating screen:', error);
    return {
      success: false,
      msg: error instanceof Error ? error.message : 'Failed to update screen',
    };
  }
};

/**
 * Delete screen from backend
 */
export const deleteScreenFromBackend = async (id: string): Promise<{
  success: boolean;
  msg?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE}/design/postdelscreen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ [SCREEN_BACKEND] Deleted screen:', result);
    return result;
  } catch (error) {
    console.error('❌ [SCREEN_BACKEND] Error deleting screen:', error);
    return {
      success: false,
      msg: error instanceof Error ? error.message : 'Failed to delete screen',
    };
  }
};

/**
 * Deploy playlist to screen via backend (uses Socket.IO)
 */
export const deployToScreenViaBackend = async (screenId: string): Promise<{
  success: boolean;
  msg?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE}/design/postdeploytoscreen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ screenId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ [SCREEN_BACKEND] Deployed to screen:', result);
    return result;
  } catch (error) {
    console.error('❌ [SCREEN_BACKEND] Error deploying to screen:', error);
    return {
      success: false,
      msg: error instanceof Error ? error.message : 'Failed to deploy to screen',
    };
  }
};
