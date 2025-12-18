/**
 * Animation Toolbar Component
 * Quick access to animation presets and controls
 */

import React, { useState } from 'react';
import { Play, Pause, Square, RotateCcw, Zap, Sparkles } from 'lucide-react';
import { ANIMATION_PRESETS, applyPreset } from '../constants/animationPresets';
import { ElementAnimation } from '../types/animation';

interface AnimationToolbarProps {
  selectedElementId: string | null;
  onApplyPreset: (animation: ElementAnimation) => void;
  onPlayAnimation: (type: 'enter' | 'exit') => void;
  onStopAnimation: () => void;
  isPlaying?: boolean;
}

export const AnimationToolbar: React.FC<AnimationToolbarProps> = ({
  selectedElementId,
  onApplyPreset,
  onPlayAnimation,
  onStopAnimation,
  isPlaying = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'basic' | 'attention' | 'advanced'>('basic');
  const [showPresets, setShowPresets] = useState(false);

  const filteredPresets = ANIMATION_PRESETS.filter(
    preset => preset.category === selectedCategory
  );

  const handlePresetClick = (presetId: string) => {
    const animation = applyPreset(presetId);
    if (animation) {
      onApplyPreset(animation as ElementAnimation);
      setShowPresets(false);
    }
  };

  if (!selectedElementId) {
    return null;
  }

  return (
    <div className="animation-toolbar">
      {/* Playback Controls */}
      <div className="toolbar-section">
        <button
          className="toolbar-btn"
          onClick={() => onPlayAnimation('enter')}
          title="Play Enter Animation"
          disabled={!selectedElementId}
        >
          <Play size={18} />
        </button>
        <button
          className="toolbar-btn"
          onClick={onStopAnimation}
          title="Stop Animation"
          disabled={!isPlaying}
        >
          <Square size={18} />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Quick Presets */}
      <div className="toolbar-section">
        <button
          className={`toolbar-btn ${showPresets ? 'active' : ''}`}
          onClick={() => setShowPresets(!showPresets)}
          title="Animation Presets"
        >
          <Sparkles size={18} />
          <span>Presets</span>
        </button>
      </div>

      {/* Preset Dropdown */}
      {showPresets && (
        <div className="preset-dropdown">
          {/* Category Tabs */}
          <div className="preset-tabs">
            <button
              className={`preset-tab ${selectedCategory === 'basic' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('basic')}
            >
              Basic
            </button>
            <button
              className={`preset-tab ${selectedCategory === 'attention' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('attention')}
            >
              Attention
            </button>
            <button
              className={`preset-tab ${selectedCategory === 'advanced' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('advanced')}
            >
              Advanced
            </button>
          </div>

          {/* Preset List */}
          <div className="preset-list">
            {filteredPresets.map(preset => (
              <button
                key={preset.id}
                className="preset-item"
                onClick={() => handlePresetClick(preset.id)}
              >
                <Zap size={16} />
                <div className="preset-info">
                  <div className="preset-name">{preset.name}</div>
                  <div className="preset-description">{preset.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== Styles ====================

const styles = `
.animation-toolbar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
  transition: all 0.2s;
}

.toolbar-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #8b5cf6;
  color: #8b5cf6;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn.active {
  background: #8b5cf6;
  color: white;
  border-color: #8b5cf6;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
  margin: 0 0.25rem;
}

.preset-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-top: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preset-tabs {
  display: flex;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.preset-tab {
  flex: 1;
  padding: 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
}

.preset-tab:hover {
  background: #f3f4f6;
}

.preset-tab.active {
  color: #8b5cf6;
  background: white;
  border-bottom: 2px solid #8b5cf6;
}

.preset-list {
  overflow-y: auto;
  max-height: 320px;
}

.preset-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  background: white;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
}

.preset-item:hover {
  background: #f9fafb;
}

.preset-item:last-child {
  border-bottom: none;
}

.preset-info {
  flex: 1;
}

.preset-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.preset-description {
  font-size: 0.75rem;
  color: #6b7280;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
