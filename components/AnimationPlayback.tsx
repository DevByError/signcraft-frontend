/**
 * Animation Playback Controller
 * Controls for previewing and managing animations globally
 */

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Settings, Clock } from 'lucide-react';
import { animationEngine } from '../services/animationService';
import { CanvasElement } from '../types';

interface AnimationPlaybackProps {
  elements: CanvasElement[];
  isPlaying: boolean;
  onPlayAll: () => void;
  onStopAll: () => void;
  onReset: () => void;
}

export const AnimationPlayback: React.FC<AnimationPlaybackProps> = ({
  elements,
  isPlaying,
  onPlayAll,
  onStopAll,
  onReset,
}) => {
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentElement, setCurrentElement] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Count animated elements
  const animatedElements = elements.filter(el => el.animation?.enabled);

  // Play all animations in sequence
  const playSequence = async () => {
    for (const element of animatedElements) {
      if (!element.animation?.enter) continue;

      setCurrentElement(element.id);
      await animationEngine.runAnimation(
        element.id,
        element,
        {
          ...element.animation.enter,
          duration: element.animation.enter.duration / playbackSpeed,
        }
      );
    }
    setCurrentElement(null);
  };

  return (
    <div className="playback-controller">
      <div className="playback-info">
        <Clock size={16} />
        <span>{animatedElements.length} animated elements</span>
      </div>

      <div className="playback-controls">
        <button
          className="playback-btn"
          onClick={isPlaying ? onStopAll : onPlayAll}
          title={isPlaying ? 'Stop' : 'Play All'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <button
          className="playback-btn"
          onClick={onReset}
          title="Reset"
          disabled={isPlaying}
        >
          <RotateCcw size={20} />
        </button>

        <button
          className="playback-btn"
          onClick={playSequence}
          title="Play Sequence"
          disabled={isPlaying}
        >
          <SkipForward size={20} />
        </button>

        <button
          className="playback-btn"
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      {showSettings && (
        <div className="playback-settings">
          <label className="setting-label">
            Playback Speed: {playbackSpeed}x
            <input
              type="range"
              min="0.25"
              max="2"
              step="0.25"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="speed-slider"
            />
          </label>
        </div>
      )}

      {currentElement && (
        <div className="playback-progress">
          Playing: {elements.find(el => el.id === currentElement)?.type || 'Unknown'}
        </div>
      )}
    </div>
  );
};

// ==================== Styles ====================

const styles = `
.playback-controller {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 0.5rem;
  margin: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.playback-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.playback-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.playback-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 0.375rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.playback-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.playback-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.playback-settings {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 100;
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
}

.speed-slider {
  width: 100%;
}

.playback-progress {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  text-align: center;
  font-size: 0.875rem;
  border-radius: 0.25rem;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
