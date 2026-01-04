// // Screen Service - Backend API Integration
// // API base URL for backend integration
// const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// // Local-only screen service stubs (for fallback)
// const Timestamp = { now: () => new Date().toISOString() } as any;

// export interface ScreenDocument {
//   id: string;
//   screenId: string;
//   userId: string;
//   userEmail: string;
//   name: string;
//   location: string;
//   resolution: string;
//   status: 'online' | 'offline';
//   lastSeen: Timestamp;
//   ipAddress: string;
//   playlistId?: string;
//   playlistName?: string;
//   createdAt: Timestamp;
//   updatedAt: Timestamp;
// }

// const SCREENS_COLLECTION = 'screens';
// import authService from './authService';

// const getCurrentUser = () => {
//   const u = authService.getUser();
//   if (u && u.id) return { uid: u.id, email: u.email || '' };
//   return { uid: 'guest-user-123', email: 'guest@signcraft.com' };
// };

// // Local screen functions removed - use backend API instead
// export const createScreen = async (name: string, location: string, res: string = '1920x1080', ip: string = '', pId?: string) => {
//   // Use backend API
//   return { success: false, error: 'Use backend API instead' };
// };


// export const getUserScreens = async (limitNum: number = 100): Promise<ScreenDocument[]> => {
//   return [];
// };

// export const updateScreenStatus = async (id: string, status: 'online' | 'offline') => {
//   return { success: false };
// };

// export const deleteScreen = async (id: string) => {
//   return { success: false };
// };

// // ==================== Backend API Integration ====================

// /**
//  * Get all screens from backend
//  */

// export const getScreensFromBackend = async (): Promise<{
//   success: boolean;
//   data?: any[];
//   msg?: string;
// }> => {
//   try {
//     const response = await authService.authFetch(`${API_BASE}/design/getscreens`, {
//       method: 'GET',
//       headers: { 'Content-Type': 'application/json' },
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const result = await response.json();
//     console.log('✅ [SCREEN_BACKEND] Fetched screens:', result);
//     return result;
//   } catch (error) {
//     console.error('❌ [SCREEN_BACKEND] Error fetching screens:', error);
//     return {
//       success: false,
//       msg: error instanceof Error ? error.message : 'Failed to fetch screens',
//     };
//   }
// };

// /**
//  * Get screen by ID from backend
//  */
// export const getScreenByIdFromBackend = async (id: string): Promise<{
//   success: boolean;
//   data?: any;
//   msg?: string;
// }> => {
//   try {
//     const response = await authService.authFetch(`${API_BASE}/design/getscreenbyid?id=${id}`, {
//       method: 'GET',
//       headers: { 'Content-Type': 'application/json' },
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const result = await response.json();
//     console.log('✅ [SCREEN_BACKEND] Fetched screen details:', result);
//     return result;
//   } catch (error) {
//     console.error('❌ [SCREEN_BACKEND] Error fetching screen details:', error);
//     return {
//       success: false,
//       msg: error instanceof Error ? error.message : 'Failed to fetch screen details',
//     };
//   }
// };

// /**
//  * Create or update screen on backend
//  */
// export const updateScreenToBackend = async (data: {
//   id?: string;
//   screenName: string;
//   screenLocation: string;
//   screenCustomId?: string;
//   playlistId?: string;
//   userID?: string;
// }): Promise<{
//   success: boolean;
//   data?: any;
//   msg?: string;
// }> => {
//   try {
//     const response = await authService.authFetch(`${API_BASE}/design/postscreenupdate`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const result = await response.json();
//     console.log('✅ [SCREEN_BACKEND] Updated screen:', result);
//     return result;
//   } catch (error) {
//     console.error('❌ [SCREEN_BACKEND] Error updating screen:', error);
//     return {
//       success: false,
//       msg: error instanceof Error ? error.message : 'Failed to update screen',
//     };
//   }
// };

// /**
//  * Delete screen from backend
//  */
// export const deleteScreenFromBackend = async (id: string): Promise<{
//   success: boolean;
//   msg?: string;
// }> => {
//   try {
//     const response = await authService.authFetch(`${API_BASE}/design/postdelscreen`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ id }),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const result = await response.json();
//     console.log('✅ [SCREEN_BACKEND] Deleted screen:', result);
//     return result;
//   } catch (error) {
//     console.error('❌ [SCREEN_BACKEND] Error deleting screen:', error);
//     return {
//       success: false,
//       msg: error instanceof Error ? error.message : 'Failed to delete screen',
//     };
//   }
// };

// /**
//  * Deploy playlist to screen via backend (uses Socket.IO)
//  */
// export const deployToScreenViaBackend = async (screenId: string): Promise<{
//   success: boolean;
//   msg?: string;
// }> => {
//   try {
//     const response = await authService.authFetch(`${API_BASE}/design/postdeploytoscreen`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ screenId }),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const result = await response.json();
//     console.log('✅ [SCREEN_BACKEND] Deployed to screen:', result);
//     return result;
//   } catch (error) {
//     console.error('❌ [SCREEN_BACKEND] Error deploying to screen:', error);
//     return {
//       success: false,
//       msg: error instanceof Error ? error.message : 'Failed to deploy to screen',
//     };
//   }
// };

// import api from '../utils/api';

// export const getAllScreens = async () => {
//   try {
//     const response = await api.get('/screen/getallscreens'); // Adjust endpoint if needed
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching screens:", error);
//     return { success: false, data: [] };
//   }
// };
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

// 🚀 BROADCAST / DEPLOY
export const deploySchedule = async (payload: any, socketId?: string) => {
  try {
    const headers: any = { 'Content-Type': 'application/json' };

    // Pass Socket ID header so backend can emit progress back to us
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