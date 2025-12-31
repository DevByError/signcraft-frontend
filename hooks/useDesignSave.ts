/**
 * useDesignSave Hook
 * Custom React hook for managing design save operations
 * Handles loading, error, and success states
 */

import { useState, useCallback } from 'react';
import { ExportedDesignData, serializeCanvasDesign, CanvasElementData, DesignMetadataData } from '../services/canvasExportService';
import { saveDesignLocal, updateDesignLocal, SaveResponse } from '../services/localDesignStore';

interface UseDesignSaveState {
  isLoading: boolean;
  isSaved: boolean;
  error: string | null;
  successMessage: string | null;
  designId: string | null;
}

export const useDesignSave = () => {
  const [state, setState] = useState<UseDesignSaveState>({
    isLoading: false,
    isSaved: false,
    error: null,
    successMessage: null,
    designId: null,
  });

  /**
   * Saves a new design to Firestore
   * @param elements - Canvas elements
   * @param metadata - Design metadata
   * @param options - Additional save options
   */
  const saveDesign = useCallback(
    async (
      elements: CanvasElementData[],
      metadata: DesignMetadataData,
      options?: SaveDesignOptions
    ): Promise<SaveResponse> => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        successMessage: null,
      }));

      try {
        // Serialize design
        const exportedDesign = serializeCanvasDesign(elements, metadata);

        // Save locally
        const response = saveDesignLocal({
          metadata: exportedDesign.metadata as any,
          designJSON: exportedDesign.designJSON,
        });

        if (response.success) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            isSaved: true,
            designId: response.designId || null,
            successMessage: `Design "${metadata.title}" saved successfully!`,
          }));

          // Clear success message after 3 seconds
          setTimeout(() => {
            setState(prev => ({
              ...prev,
              successMessage: null,
            }));
          }, 3000);
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: response.error || 'Failed to save design',
          }));
        }

        return response;
      } catch (error: any) {
        const errorMessage = error.message || 'An unexpected error occurred';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        return {
          success: false,
          error: errorMessage,
        } as SaveResponse;
      }
    },
    []
  );

  /**
   * Updates an existing design
   * @param designId - The design document ID
   * @param elements - Updated canvas elements
   * @param metadata - Updated metadata
   */
  const updateDesign = useCallback(
    async (
      designId: string,
      elements: CanvasElementData[],
      metadata: DesignMetadataData
    ): Promise<SaveResponse> => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        successMessage: null,
      }));

      try {
        const exportedDesign = serializeCanvasDesign(elements, metadata);
        const response = updateDesignLocal(designId, {
          metadata: exportedDesign.metadata as any,
          designJSON: exportedDesign.designJSON,
        });

        if (response.success) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            isSaved: true,
            successMessage: `Design updated successfully!`,
          }));

          setTimeout(() => {
            setState(prev => ({
              ...prev,
              successMessage: null,
            }));
          }, 3000);
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: response.error || 'Failed to update design',
          }));
        }

        return response;
      } catch (error: any) {
        const errorMessage = error.message || 'An unexpected error occurred';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        return {
          success: false,
          error: errorMessage,
        } as SaveResponse;
      }
    },
    []
  );

  /**
   * Clears error and success messages
   */
  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      successMessage: null,
    }));
  }, []);

  /**
   * Resets the save state
   */
  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      isSaved: false,
      error: null,
      successMessage: null,
      designId: null,
    });
  }, []);

  return {
    ...state,
    saveDesign,
    updateDesign,
    clearMessages,
    resetState,
  };
};
