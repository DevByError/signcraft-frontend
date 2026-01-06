
import authService from './authService';
// Ensure this API_BASE points to your backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ScreenData {
  id: string;
  screenName: string;
  screenLocation: string;
  screenCustomId: string;
  playlistId?: string;
  connectedDevices: number; // From Socket
  status: 'online' | 'offline';
  createdAt: string;
  tblplaylist?: { name: string };
}

// Get All Screens
export const getAllScreens = async () => {
  try {
    const response = await authService.authFetch(`${API_BASE}/design/getscreens`, { method: 'GET' });
    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, msg: 'Network error' };
  }
};

// Create or Update
export const saveScreen = async (data: any) => {
  try {
    const response = await authService.authFetch(`${API_BASE}/design/postscreenupdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    return { success: false, msg: 'Save failed' };
  }
};

// Delete
export const deleteScreen = async (id: string) => {
  try {
    const response = await authService.authFetch(`${API_BASE}/design/postdelscreen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return await response.json();
  } catch (error) {
    return { success: false, msg: 'Delete failed' };
  }
};


export const deploySchedule = async (payload: any, socketId?: string) => {
  try {
    const headers: any = { 'Content-Type': 'application/json' };

    // Pass Socket ID header so backend can emit progress back to THIS specific user
    if (socketId) {
      headers['x-socket-id'] = socketId;
    }

    const response = await authService.authFetch(`${API_BASE}/design/postdeploytoscreen`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    return { success: false, msg: 'Deployment failed' };
  }
};