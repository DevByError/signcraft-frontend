
import api from '../utils/api'; // ✅ Centralized API with Interceptors

// --- Interfaces ---
export interface DesignMetadata {
  title: string;
  canvasWidth: number;
  canvasHeight: number;
  canvasColor: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  version?: number;
}

export interface DesignData {
  id?: string;
  title: string;
  canvasData: any;
  timelineData?: any;
  userId?: string;
  videoUrl?: string;
  videoSize?: string;
  CreatedBy?: string;
  UpdatedBy?: string;
  sts?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveDesignRequest {
  id?: string;
  title: string;
  canvasData: any;
  timelineData?: any;
  userID?: string;
}

export interface SaveDesignResponse {
  success: boolean;
  data?: DesignData;
  msg?: string;
}

export interface GetDesignsResponse {
  success: boolean;
  data?: DesignData[];
  msg?: string;
}

export interface GetDesignByIdResponse {
  success: boolean;
  data?: DesignData;
  msg?: string;
}

export interface DeleteDesignResponse {
  success: boolean;
  msg: string;
}

export interface ExportVideoResponse {
  success: boolean;
  videoUrl?: string;
  videoSize?: string;
  msg?: string;
}

// --- API Functions ---

/**
 * Get all active designs from backend
 * Interceptor handles 401/403 automatically.
 */
export const getAllDesigns = async (): Promise<GetDesignsResponse> => {
  try {
    const response = await api.get('/design/getalldesigns');
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Get a specific design by ID
 */
export const getDesignById = async (id: string): Promise<GetDesignByIdResponse> => {
  if (!id) throw new Error("Design ID is required");

  try {
    const response = await api.get(`/design/getdesignbyid`, {
      params: { id }
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ [DESIGN_SERVICE] Error fetching design:', error);
    throw error;
  }
};

/**
 * Save a new design or update existing one
 */
export const postsaveDesign = async (designData: SaveDesignRequest): Promise<SaveDesignResponse> => {
  try {
    const response = await api.post('/design/postsavedesign', designData);
    console.log('✅ [DESIGN_SERVICE] Design saved:', response.data);
    return response.data;
  } catch (error: any) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      throw error;
    }
    console.error('❌ [DESIGN_SERVICE] Error saving design:', error);
    throw error;
  }
};

/**
 * Delete a design
 */
export const deleteDesign = async (id: string): Promise<DeleteDesignResponse> => {
  try {
    const response = await api.post('/design/postdeldesign', { id });
    return response.data;
  } catch (error: any) {
    console.error('❌ [DESIGN_SERVICE] Error deleting design:', error);
    throw error;
  }
};

/**
 * Export design as video
 */
export const exportDesignVideo = async (id: string): Promise<ExportVideoResponse> => {
  try {
    const response = await api.post('/design/exportvideo', { id });
    return response.data;
  } catch (error: any) {
    console.error('❌ [DESIGN_SERVICE] Error exporting video:', error);
    throw error;
  }
};

/**
 * Upload an asset (Video/Image) to the backend
 */
export const uploadAsset = async (file: File): Promise<{ success: boolean; url?: string; msg?: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/design/postuploadasset', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ [DESIGN_SERVICE] Upload failed:', error);
    return {
      success: false,
      msg: error.response?.data?.msg || 'Upload failed'
    };
  }
};

// --- Helper Functions ---

/**
 * Helper function to convert local design format to backend format
 */
export const convertLocalToBackend = (localDesign: any): SaveDesignRequest => {
  return {
    id: localDesign.id,
    title: localDesign.metadata?.title || 'Untitled Design',
    // We send elements directly, or inside a structure if your backend expects it.
    // Usually, keeping metadata alongside elements in the JSON blob is safer for consistency.
    canvasData: localDesign.designJSON?.elements || localDesign.designJSON || [],
    timelineData: localDesign.designJSON?.timeline || null,
    userID: localDesign.metadata?.createdBy || undefined,
  };
};

/**
 * Helper function to convert backend design format to local format
 * ✅ UPDATED: Now dynamically reads Width/Height/Color from saved data
 */
export const convertBackendToLocal = (backendDesign: DesignData): any => {
  if (!backendDesign) return null;

  // 1. Check if metadata is nested inside canvasData (common pattern)
  const savedMetadata = backendDesign.canvasData?.metadata || {};

  // 2. Normalize Elements (handle if it's an array or an object)
  const elementsArray = Array.isArray(backendDesign.canvasData)
    ? backendDesign.canvasData
    : (backendDesign.canvasData?.elements || []);

  return {
    id: backendDesign.id,
    metadata: {
      title: backendDesign.title || 'Untitled',
      // ✅ Dynamic Dimensions (Fallback to 1920x1080 only if missing)
      canvasWidth: Number(savedMetadata.canvasWidth) || 1920,
      canvasHeight: Number(savedMetadata.canvasHeight) || 1080,
      canvasColor: savedMetadata.canvasColor || '#ffffff',
      createdAt: backendDesign.createdAt || new Date().toISOString(),
      updatedAt: backendDesign.updatedAt || new Date().toISOString(),
      createdBy: backendDesign.userId,
      version: 1,
    },
    designJSON: {
      elements: elementsArray,
      timeline: backendDesign.timelineData || null,
      totalElements: elementsArray.length,
      version: '1.0.0',
    },
  };
};

/**
 * Alias for backward compatibility
 */
export const saveDesign = postsaveDesign;