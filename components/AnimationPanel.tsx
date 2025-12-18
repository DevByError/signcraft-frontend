/**
 * Animation Panel Component
 * UI for controlling element animations
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Eye, Settings, ChevronDown, ChevronRight,
  Zap, Sparkles, Star, Clock, Repeat
} from 'lucide-react';
import { 
  AnimationType, 
  AnimationConfig, 
  ElementAnimation,
  EasingType,
  TriggerType 
} from '../types/animation';
import { 
  animationEngine, 
  getAnimationCategories, 
  getDefaultAnimationConfig 
} from '../services/animationService';

interface AnimationPanelProps {
  elementId: string | null;
  elementAnimation?: ElementAnimation;
  onAnimationChange: (animation: ElementAnimation) => void;
  onPreview?: (type: 'enter' | 'exit') => void;
  elementRef?: any; // Reference to the actual DOM/Konva element
}

export const AnimationPanel: React.FC<AnimationPanelProps> = ({
  elementId,
  elementAnimation,
  onAnimationChange,
  onPreview,
  elementRef,
}) => {
  const [selectedTab, setSelectedTab] = useState<'enter' | 'exit'>('enter');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('basic');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categories = getAnimationCategories();

  // Initialize with default if no animation exists
  const currentAnimation = elementAnimation || {
    enabled: false,
    enter: getDefaultAnimationConfig(),
    exit: undefined,
  };

  const selectedConfig = selectedTab === 'enter' 
    ? currentAnimation.enter 
    : currentAnimation.exit;

  // Handle animation type selection
  const handleTypeSelect = (type: AnimationType) => {
    const config = selectedConfig || getDefaultAnimationConfig();
    const updated = {
      ...currentAnimation,
      [selectedTab]: { ...config, type },
    };
    onAnimationChange(updated);
  };

  // Handle property changes
  const handlePropertyChange = (property: keyof AnimationConfig, value: any) => {
    if (!selectedConfig) return;
    
    const updated = {
      ...currentAnimation,
      [selectedTab]: { ...selectedConfig, [property]: value },
    };
    onAnimationChange(updated);
  };

  // Handle preview
  const handlePreview = async () => {
    if (!elementRef || !selectedConfig) return;
    
    await animationEngine.previewAnimation(elementRef, selectedConfig);
    onPreview?.(selectedTab);
  };

  // Toggle animation enabled
  const toggleEnabled = () => {
    onAnimationChange({
      ...currentAnimation,
      enabled: !currentAnimation.enabled,
    });
  };

  if (!elementId) {
    return (
      <div className="animation-panel-empty">
        <Zap size={48} className="text-gray-300" />
        <p className="text-gray-500 mt-4">Select an element to add animations</p>
      </div>
    );
  }

  return (
    <div className="animation-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-500" />
            <h3 className="font-semibold">Animations</h3>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentAnimation.enabled}
              onChange={toggleEnabled}
              className="toggle-checkbox"
            />
            <span className="text-sm">Enabled</span>
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${selectedTab === 'enter' ? 'active' : ''}`}
          onClick={() => setSelectedTab('enter')}
        >
          <Play size={16} />
          Enter
        </button>
        <button
          className={`tab ${selectedTab === 'exit' ? 'active' : ''}`}
          onClick={() => setSelectedTab('exit')}
        >
          <Pause size={16} />
          Exit
        </button>
      </div>

      {/* Animation Type Selector */}
      <div className="animation-selector">
        <h4 className="section-title">Animation Type</h4>
        
        {Object.entries(categories).map(([key, category]) => (
          <div key={key} className="category-section">
            <button
              className="category-header"
              onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
            >
              {expandedCategory === key ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>{category.label}</span>
              <span className="badge">{category.animations.length}</span>
            </button>
            
            {expandedCategory === key && (
              <div className="animation-grid">
                {category.animations.map((type) => (
                  <button
                    key={type}
                    className={`animation-card ${selectedConfig?.type === type ? 'selected' : ''}`}
                    onClick={() => handleTypeSelect(type)}
                  >
                    <Star size={16} />
                    <span>{formatAnimationName(type)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Properties */}
      {selectedConfig && (
        <div className="animation-properties">
          <h4 className="section-title">Properties</h4>

          {/* Duration */}
          <div className="property-group">
            <label className="property-label">
              <Clock size={14} />
              Duration
              <span className="value-display">{selectedConfig.duration}ms</span>
            </label>
            <input
              type="range"
              min="100"
              max="3000"
              step="50"
              value={selectedConfig.duration}
              onChange={(e) => handlePropertyChange('duration', parseInt(e.target.value))}
              className="slider"
            />
          </div>

          {/* Delay */}
          <div className="property-group">
            <label className="property-label">
              <Clock size={14} />
              Delay
              <span className="value-display">{selectedConfig.delay}ms</span>
            </label>
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={selectedConfig.delay}
              onChange={(e) => handlePropertyChange('delay', parseInt(e.target.value))}
              className="slider"
            />
          </div>

          {/* Easing */}
          <div className="property-group">
            <label className="property-label">
              <Settings size={14} />
              Easing
            </label>
            <select
              value={selectedConfig.easing}
              onChange={(e) => handlePropertyChange('easing', e.target.value as EasingType)}
              className="select-input"
            >
              <optgroup label="Basic">
                <option value="linear">Linear</option>
                <option value="ease-in">Ease In</option>
                <option value="ease-out">Ease Out</option>
                <option value="ease-in-out">Ease In Out</option>
              </optgroup>
              <optgroup label="Power">
                <option value="power1.out">Power 1</option>
                <option value="power2.out">Power 2</option>
                <option value="power3.out">Power 3</option>
                <option value="power4.out">Power 4</option>
              </optgroup>
              <optgroup label="Special">
                <option value="ease-back">Back</option>
                <option value="ease-elastic">Elastic</option>
                <option value="ease-bounce">Bounce</option>
              </optgroup>
            </select>
          </div>

          {/* Advanced Settings */}
          <button
            className="advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Advanced Settings
          </button>

          {showAdvanced && (
            <>
              {/* Repeat */}
              <div className="property-group">
                <label className="property-label">
                  <Repeat size={14} />
                  Repeat
                  <span className="value-display">
                    {selectedConfig.repeat === -1 ? '∞' : selectedConfig.repeat || 1}
                  </span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={selectedConfig.repeat === -1 ? 10 : (selectedConfig.repeat || 1)}
                  onChange={(e) => handlePropertyChange('repeat', parseInt(e.target.value))}
                  className="slider"
                />
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedConfig.repeat === -1}
                    onChange={(e) => handlePropertyChange('repeat', e.target.checked ? -1 : 1)}
                  />
                  Infinite loop
                </label>
              </div>

              {/* Repeat Delay */}
              {(selectedConfig.repeat || 1) > 1 && (
                <div className="property-group">
                  <label className="property-label">
                    Repeat Delay
                    <span className="value-display">{selectedConfig.repeatDelay || 0}ms</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="50"
                    value={selectedConfig.repeatDelay || 0}
                    onChange={(e) => handlePropertyChange('repeatDelay', parseInt(e.target.value))}
                    className="slider"
                  />
                </div>
              )}
            </>
          )}

          {/* Preview Button */}
          <button
            className="preview-button"
            onClick={handlePreview}
            disabled={!elementRef}
          >
            <Eye size={16} />
            Preview Animation
          </button>
        </div>
      )}
    </div>
  );
};

// ==================== Helper Functions ====================

function formatAnimationName(type: string): string {
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// ==================== Styles ====================

const styles = `
.animation-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  overflow-y: auto;
}

.animation-panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.tab.active {
  color: #8b5cf6;
  border-bottom: 2px solid #8b5cf6;
  background: #f5f3ff;
}

.animation-selector {
  padding: 1rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.category-section {
  margin-bottom: 0.75rem;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}

.category-header:hover {
  background: #f3f4f6;
}

.badge {
  margin-left: auto;
  padding: 0.125rem 0.5rem;
  background: #e5e7eb;
  border-radius: 1rem;
  font-size: 0.75rem;
}

.animation-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
}

.animation-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.75rem;
  text-align: center;
}

.animation-card:hover {
  border-color: #8b5cf6;
  background: #f5f3ff;
}

.animation-card.selected {
  border-color: #8b5cf6;
  background: #8b5cf6;
  color: white;
}

.animation-properties {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.property-group {
  margin-bottom: 1.25rem;
}

.property-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.value-display {
  margin-left: auto;
  color: #8b5cf6;
  font-weight: 600;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #8b5cf6;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #8b5cf6;
  cursor: pointer;
  border: none;
}

.select-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

.select-input:focus {
  outline: none;
  border-color: #8b5cf6;
  ring: 2px solid #f5f3ff;
}

.advanced-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.preview-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 1rem;
}

.preview-button:hover {
  background: #7c3aed;
}

.preview-button:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.toggle-checkbox {
  width: 40px;
  height: 20px;
  position: relative;
  appearance: none;
  background: #d1d5db;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-checkbox:checked {
  background: #8b5cf6;
}

.toggle-checkbox::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
}

.toggle-checkbox:checked::before {
  transform: translateX(20px);
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
