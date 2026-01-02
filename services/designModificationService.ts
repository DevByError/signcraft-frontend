// Design Modification Service
// Handles design modification operations and permissions

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import authService from './authService';

/**
 * Modify an existing design
 * @param designId - ID of the design to modify
 * @param updateData - Data to update in the design
 * @returns Promise with modification result
 */
export const modifyDesign = async (designId: string, updateData: any) => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE}/api/designs/${designId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to modify design: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error modifying design:', error);
    throw error;
  }
};

/**
 * Check if the current user has permission to modify a design
 * @param designId - ID of the design to check
 * @returns Promise<boolean> - True if user has modification permission
 */
export const hasModificationPermission = async (designId: string): Promise<boolean> => {
  try {
    const token = authService.getToken();
    
    if (!token) {
      return false;
    }

    const response = await fetch(`${API_BASE}/api/designs/${designId}/permissions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.canModify === true;
  } catch (error) {
    console.error('Error checking modification permission:', error);
    return false;
  }
};

/**
 * Check if design can be modified (not locked, user has permission, etc.)
 * @param designId - ID of the design to check
 * @returns Promise<boolean> - True if design can be modified
 */
export const canModifyDesign = async (designId: string): Promise<boolean> => {
  try {
    const hasPermission = await hasModificationPermission(designId);
    return hasPermission;
  } catch (error) {
    console.error('Error checking if design can be modified:', error);
    return false;
  }
};

/**
 * Lock a design to prevent modifications by others
 * @param designId - ID of the design to lock
 * @returns Promise with lock result
 */
export const lockDesign = async (designId: string) => {
  try {
    const token = authService.getToken();

    const response = await fetch(`${API_BASE}/api/designs/${designId}/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to lock design: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error locking design:', error);
    throw error;
  }
};

/**
 * Unlock a design to allow modifications
 * @param designId - ID of the design to unlock
 * @returns Promise with unlock result
 */
export const unlockDesign = async (designId: string) => {
  try {
    const token = authService.getToken();

    const response = await fetch(`${API_BASE}/api/designs/${designId}/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to unlock design: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error unlocking design:', error);
    throw error;
  }
};

/**
 * Get modification history of a design
 * @param designId - ID of the design
 * @returns Promise with modification history
 */
export const getDesignModificationHistory = async (designId: string) => {
  try {
    const token = authService.getToken();

    const response = await fetch(`${API_BASE}/api/designs/${designId}/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get modification history: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting modification history:', error);
    throw error;
  }
};

export default {
  modifyDesign,
  hasModificationPermission,
  canModifyDesign,
  lockDesign,
  unlockDesign,
  getDesignModificationHistory,
};
