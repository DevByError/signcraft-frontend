/**
 * Preview Mode Component
 * Canva-like preview/presentation mode for playing animations
 */

import React from 'react';
import { Play, Pause, X, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

interface PreviewModeProps {
  isPlaying: boolean;
  isFullscreen?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onExit: () => void;
  onToggleFullscreen?: () => void;
  duration?: string;
}

export const PreviewModeControls: React.FC<PreviewModeProps> = ({
  isPlaying,
  isFullscreen = false,
  onPlay,
  onPause,
  onStop,
  onExit,
  onToggleFullscreen,
  duration,
}) => {
  return (
    <div className="preview-controls">
      <div className="preview-controls-left">
        <button
          className="preview-btn exit-btn"
          onClick={onExit}
          title="Exit Preview Mode"
        >
          <X size={20} />
          Exit Preview
        </button>
      </div>

      <div className="preview-controls-center">
        <button
          className="preview-btn"
          onClick={onStop}
          title="Stop & Reset"
          disabled={!isPlaying}
        >
          <RotateCcw size={20} />
        </button>

        <button
          className="preview-btn play-btn"
          onClick={isPlaying ? onPause : onPlay}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>

        {duration && (
          <span className="preview-duration">{duration}</span>
        )}
      </div>

      <div className="preview-controls-right">
        {onToggleFullscreen && (
          <button
            className="preview-btn"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Preview Mode Banner
 * Shows at the top when in preview mode
 */
export const PreviewModeBanner: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  return (
    <div className="preview-banner">
      <div className="preview-banner-content">
        <span className="preview-label">Preview Mode</span>
        <span className="preview-hint">Click Play to see animations</span>
      </div>
      <button className="preview-banner-exit" onClick={onExit}>
        <X size={18} />
      </button>
    </div>
  );
};

// ==================== Styles ====================

const styles = `
.preview-controls {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 3rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 400px;
}

.preview-controls-left,
.preview-controls-right {
  flex: 1;
}

.preview-controls-right {
  display: flex;
  justify-content: flex-end;
}

.preview-controls-center {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preview-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 2rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
}

.preview-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.preview-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preview-btn.play-btn {
  width: 56px;
  height: 56px;
  padding: 0;
  justify-content: center;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border: none;
}

.preview-btn.play-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  transform: scale(1.05);
}

.preview-btn.exit-btn {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}

.preview-btn.exit-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.4);
}

.preview-duration {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  font-weight: 500;
}

.preview-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  z-index: 999;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.preview-banner-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.preview-label {
  font-weight: 600;
  font-size: 1rem;
}

.preview-hint {
  font-size: 0.875rem;
  opacity: 0.9;
}

.preview-banner-exit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-banner-exit:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

/* Preview mode overlay */
.preview-mode-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 998;
}

.preview-mode-canvas {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

/* Disable editing in preview mode */
.preview-mode .konvajs-content {
  pointer-events: none !important;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
