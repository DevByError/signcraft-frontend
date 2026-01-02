/**
 * Editor with Preview Mode Integration Example
 * Shows how to implement Canva-like preview mode for animations
 * 
 * Key Concepts:
 * - Editing Mode: NO animations, full control
 * - Preview Mode: Animations play, no editing
 * - Play button triggers animation playback
 */

import React, { useState } from 'react';
import { Stage, Layer, Text, Rect } from 'react-konva';
import { Eye, Edit3 } from 'lucide-react';
import { ElementType, CanvasElement } from '../types/canvas';
import { AnimationPanel } from '../components/AnimationPanel';
import { PreviewModeControls, PreviewModeBanner } from '../components/PreviewMode';
import { usePreviewMode } from '../hooks/usePreviewMode';

export const EditorWithPreviewMode: React.FC = () => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    isPreviewMode,
    isPlaying,
    enterPreviewMode,
    exitPreviewMode,
    playAnimations,
    stopAnimations,
    togglePlayback,
    registerElementRef,
  } = usePreviewMode(elements);

  const selectedElement = elements.find(el => el.id === selectedId);

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  return (
    <div className={isPreviewMode ? 'editor-container preview-mode' : 'editor-container'}>
      {/* Preview Mode Banner */}
      {isPreviewMode && <PreviewModeBanner onExit={exitPreviewMode} />}

      {/* Top Toolbar */}
      <div className="top-toolbar">
        {!isPreviewMode ? (
          // Edit Mode Controls
          <>
            <div className="toolbar-left">
              <h2>Editor</h2>
            </div>
            <div className="toolbar-right">
              <button
                className="preview-toggle-btn"
                onClick={enterPreviewMode}
              >
                <Eye size={18} />
                Preview
              </button>
            </div>
          </>
        ) : (
          // Preview Mode - Show minimal controls
          <div className="toolbar-center">
            <span className="preview-mode-label">Preview Mode</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="editor-main">
        {/* Canvas */}
        <div className="canvas-area">
          <Stage 
            width={1920} 
            height={1080}
            style={{
              background: isPreviewMode ? '#000' : '#f3f4f6',
            }}
          >
            <Layer>
              {elements.map(element => (
                <React.Fragment key={element.id}>
                  {element.type === ElementType.TEXT && (
                    <Text
                      ref={(ref) => registerElementRef(element.id, ref)}
                      x={element.x}
                      y={element.y}
                      text={element.content}
                      fontSize={element.fontSize || 24}
                      fill={element.color || '#000'}
                      // Disable dragging in preview mode
                      draggable={!isPreviewMode}
                      onDragEnd={(e) => {
                        if (!isPreviewMode) {
                          updateElement(element.id, {
                            x: e.target.x(),
                            y: e.target.y(),
                          });
                        }
                      }}
                      onClick={() => !isPreviewMode && setSelectedId(element.id)}
                    />
                  )}
                  {element.type === ElementType.RECT && (
                    <Rect
                      ref={(ref) => registerElementRef(element.id, ref)}
                      x={element.x}
                      y={element.y}
                      width={element.width}
                      height={element.height}
                      fill={element.fillColor || '#3b82f6'}
                      draggable={!isPreviewMode}
                      onDragEnd={(e) => {
                        if (!isPreviewMode) {
                          updateElement(element.id, {
                            x: e.target.x(),
                            y: e.target.y(),
                          });
                        }
                      }}
                      onClick={() => !isPreviewMode && setSelectedId(element.id)}
                    />
                  )}
                </React.Fragment>
              ))}
            </Layer>
          </Stage>
        </div>

        {/* Right Sidebar - Only in Edit Mode */}
        {!isPreviewMode && (
          <div className="right-sidebar">
            <AnimationPanel
              elementId={selectedId}
              elementAnimation={selectedElement?.animation}
              onAnimationChange={(animation) => {
                if (selectedId) {
                  updateElement(selectedId, { animation });
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Preview Mode Controls */}
      {isPreviewMode && (
        <PreviewModeControls
          isPlaying={isPlaying}
          onPlay={playAnimations}
          onPause={stopAnimations}
          onStop={stopAnimations}
          onExit={exitPreviewMode}
        />
      )}
    </div>
  );
};

// ==================== Integration Instructions ====================

/**
 * HOW TO INTEGRATE INTO YOUR EXISTING EDITOR:
 * 
 * 1. Import the hooks and components:
 */
/*
import { usePreviewMode } from '../hooks/usePreviewMode';
import { PreviewModeControls, PreviewModeBanner } from '../components/PreviewMode';
*/

/**
 * 2. Add the hook to your component:
 */
/*
const {
  isPreviewMode,
  isPlaying,
  enterPreviewMode,
  exitPreviewMode,
  playAnimations,
  stopAnimations,
  registerElementRef,
} = usePreviewMode(elements);
*/

/**
 * 3. Register element refs (IMPORTANT):
 */
/*
<Text
  ref={(ref) => registerElementRef(element.id, ref)}
  // ... other props
/>
*/

/**
 * 4. Add Preview button to toolbar:
 */
/*
<button onClick={enterPreviewMode}>
  <Eye size={18} />
  Preview
</button>
*/

/**
 * 5. Add Preview Mode controls:
 */
/*
{isPreviewMode && (
  <PreviewModeControls
    isPlaying={isPlaying}
    onPlay={playAnimations}
    onStop={stopAnimations}
    onExit={exitPreviewMode}
  />
)}
*/

/**
 * 6. Disable editing in preview mode:
 */
/*
<Element
  draggable={!isPreviewMode}
  onClick={() => !isPreviewMode && onSelect()}
/>
*/

// ==================== Styles ====================

const styles = `
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;
}

.editor-container.preview-mode {
  background: #000;
}

.top-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.preview-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-toggle-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.right-sidebar {
  width: 320px;
  background: white;
  border-left: 1px solid #e5e7eb;
  overflow-y: auto;
}

.editor-container.preview-mode .right-sidebar {
  display: none;
}

.preview-mode-label {
  font-weight: 600;
  color: #8b5cf6;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
