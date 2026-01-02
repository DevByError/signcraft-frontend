// src/services/designService.ts
import api from '../utils/api'; // ✅ Centralized API with Interceptors

// --- Interfaces (Kept exactly as they were) ---
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
    // We re-throw the error so the Component stops its loading spinner.
    // The Global Modal will handle the UI if it's an Auth error.
    throw error;
  }
};

/**
 * Get a specific design by ID
 */
export const getDesignById = async (id: string): Promise<GetDesignByIdResponse> => {
  try {
    // Uses query parameter ?id=...
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
 * Backend verifies user identity via Cookie Token
 */
export const postsaveDesign = async (designData: SaveDesignRequest): Promise<SaveDesignResponse> => {
  try {
    const response = await api.post('/design/postsavedesign', designData);
    console.log('✅ [DESIGN_SERVICE] Design saved:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [DESIGN_SERVICE] Error saving design:', error);
    throw error;
  }
};

/**
 * Delete a design
 * Backend checks ownership via Cookie Token + Design ID
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

// --- Helper Functions (Pure Logic, No API) ---

/**
 * Helper function to convert local design format to backend format
 */
export const convertLocalToBackend = (localDesign: any): SaveDesignRequest => {
  return {
    id: localDesign.id,
    title: localDesign.metadata?.title || 'Untitled Design',
    canvasData: localDesign.designJSON?.elements || localDesign.designJSON || [],
    timelineData: localDesign.designJSON?.timeline || null,
    userID: localDesign.metadata?.createdBy || undefined,
  };
};

/**
 * Helper function to convert backend design format to local format
 */
export const convertBackendToLocal = (backendDesign: DesignData): any => {
  return {
    id: backendDesign.id,
    metadata: {
      title: backendDesign.title,
      canvasWidth: 1920,
      canvasHeight: 1080,
      canvasColor: '#ffffff',
      createdAt: backendDesign.createdAt || new Date().toISOString(),
      updatedAt: backendDesign.updatedAt || new Date().toISOString(),
      createdBy: backendDesign.userId,
      version: 1,
    },
    designJSON: {
      elements: backendDesign.canvasData || [],
      timeline: backendDesign.timelineData || null,
      totalElements: Array.isArray(backendDesign.canvasData) ? backendDesign.canvasData.length : 0,
      version: '1.0.0',
    },
  };
};

/**
 * Alias for backward compatibility
 */
export const saveDesign = postsaveDesign;