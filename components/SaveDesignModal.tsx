/**
 * SaveDesignModal Component
 * Modal for saving designs with metadata and options
 */

import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

export interface SaveDesignModalData {
  title: string;
  description: string;
  isPublic: boolean;
  tags: string[];
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
    description: '',
    isPublic: false,
    tags: [],
  });

  // Update form title when defaultTitle changes (important for modify mode)
  React.useEffect(() => {
    setFormData(prev => ({ ...prev, title: defaultTitle }));
  }, [defaultTitle]);
  const [tagInput, setTagInput] = useState('');

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!isModifying && !formData.title.trim()) {
      alert('Please enter a design title');
      return;
    }
    await onSave(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
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

          {/* Description Input */}
          <div className="property-section-expand" style={{ animationDelay: '0.1s' }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={isLoading}
              placeholder="Optional description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 resize-none input-focus-animation transition-colors-smooth"
            />
          </div>

          {/* Tags Input */}
          <div className="property-section-expand" style={{ animationDelay: '0.2s' }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                disabled={isLoading}
                placeholder="Add tag and press Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 input-focus-animation transition-colors-smooth"
              />
              <button
                onClick={addTag}
                disabled={isLoading || !tagInput.trim()}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 button-hover-scale"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, idx) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1 stagger-item transition-smooth"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      disabled={isLoading}
                      className="text-blue-700 hover:text-blue-900 disabled:opacity-50 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Public Toggle */}
          <div className="flex items-center gap-3 property-section-expand" style={{ animationDelay: '0.3s' }}>
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={e => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              disabled={isLoading}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700 cursor-pointer">
              Make this design public (shareable with others)
            </label>
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
