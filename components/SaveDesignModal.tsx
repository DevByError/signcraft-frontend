/**
 * SaveDesignModal Component
 * Modal for saving designs with metadata and options
 */

import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export interface SaveDesignModalData {
  title: string;
  description?: string;
  tags?: string[];
}

interface SaveDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveDesignModalData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  successMessage?: string | null;
  defaultTitle?: string;
  isModifying?: boolean;
}

export const SaveDesignModal: React.FC<SaveDesignModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  error = null,
  successMessage = null,
  defaultTitle = 'My Design',
  isModifying = false,
}) => {
  const [formData, setFormData] = useState<SaveDesignModalData>({
    title: defaultTitle,
  });

  // Update form title when defaultTitle changes (important for modify mode)
  React.useEffect(() => {
    setFormData(prev => ({ ...prev, title: defaultTitle }));
  }, [defaultTitle]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!isModifying && !formData.title.trim()) {
      Swal.fire('Error', 'Please enter a design title', 'error');
      return;
    }
    await onSave(formData);
  };

 

  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 modal-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{isModifying ? 'Update Design' : 'Save Design'}</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 error-animation">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 success-animation">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Title Input */}
          <div className="property-section-expand">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Design Title {!isModifying && '*'}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => !isModifying && setFormData(prev => ({ ...prev, title: e.target.value }))}
              disabled={isLoading || isModifying}
              placeholder="Enter design title"
              title={isModifying ? "Design name is fixed from Firebase" : ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 input-focus-animation transition-colors-smooth"
            />
            {isModifying && (
              <p className="text-xs text-gray-500 mt-1">Design name is fetched from Firebase</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all button-hover-scale"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || (!isModifying && !formData.title.trim())}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 button-hover-scale"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                {isModifying ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              isModifying ? 'Update Design' : 'Save Design'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
