// Design service for backend API integration
// Connects to signcraft-backend design controller

// API base URL - configurable via environment variable
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  canvasData: any; // Canvas elements
  timelineData?: any; // Timeline/animation data
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

/**
 * Get all active designs from backend
 */
export const getAllDesigns = async (): Promise<GetDesignsResponse> => {
  try {
    const response = await fetch(`${API_BASE}/design/getalldesigns`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ [DESIGN_SERVICE] Error fetching designs:', error);
    return {
      success: false,
      msg: error instanceof Error ? error.message : 'Failed to fetch designs',
    };
  }
};

/**
 * Get a specific design by ID
 */
export const getDesignById = async (id: string): Promise<GetDesignByIdResponse> => {
  try {
    const response = await fetch(`${API_BASE}/design/getdesignbyid?id=${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ [DESIGN_SERVICE] Error fetching design:', error);
    return {
      success: false,
      msg: error instanceof Error ? error.message : 'Failed to fetch design',
    };
  }
};

/**
 * Save a new design or update existing one
 */
export const saveDesign = async (designData: SaveDesignRequest): Promise<SaveDesignResponse> => {
  try {
    const response = await fetch(`${API_BASE}/design/postsavedesign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(designData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ [DESIGN_SERVICE] Design saved:', result);
    return result;
  } catch (error) {
    console.error('❌ [DESIGN_SERVICE] Error saving design:', error);
    return {
      success: false,
      msg: error instanceof Error ? error.message : 'Failed to save design',
    };
  }
};

/**
 * Delete a design (soft delete - sets sts to false)
 */
export const deleteDesign = async (id: string): Promise<DeleteDesignResponse> => {
  try {
    const response = await fetch(`${API_BASE}/design/postdeldesign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ [DESIGN_SERVICE] Error deleting design:', error);
    return {
      success: false,
      msg: error instanceof Error ? error.message : 'Failed to delete design',
    };
  }
};

/**
 * Export design as video
 */
export const exportDesignVideo = async (id: string): Promise<ExportVideoResponse> => {
  try {
    const response = await fetch(`${API_BASE}/design/postexportvideo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ [DESIGN_SERVICE] Error exporting video:', error);
    return {
      success: false,
      msg: error instanceof Error ? error.message : 'Failed to export video',
    };
  }
};

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
      canvasWidth: 1920, // Default values - can be extracted from canvasData if stored
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
