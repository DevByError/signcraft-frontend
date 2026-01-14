import { MediaUpload } from '../types';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Upload media to the server
 * @param file - File to upload
 * @param userId - User ID uploading the file
 * @param onProgress - Callback for upload progress (0-100)
 * @returns MediaUpload object with server URL
 */
export async function uploadMedia(
  file: File, 
  userId: string,
  onProgress?: (progress: number) => void
): Promise<MediaUpload> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);

  try {
    const response = await axios.post(`${API_BASE}/media/upload`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    const data = response.data;
    return {
      id: data.id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
      serverUrl: data.url,
    };
  } catch (error) {
    console.error('Media upload error:', error);
    throw error;
  }
}

/**
 * Delete media from server
 * @param mediaId - ID of media to delete
 */
export async function deleteMedia(mediaId: string): Promise<void> {
  try {
    const response = await authService.authFetch(`${API_BASE}/media/${mediaId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Media delete error:', error);
    throw error;
  }
}

/**
 * Get list of uploaded media for a user
 * @param userId - User ID
 */
export async function getMediaList(userId: string): Promise<MediaUpload[]> {
  try {
    const response = await authService.authFetch(`${API_BASE}/media/user/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Media list fetch error:', error);
    throw error;
  }
}
