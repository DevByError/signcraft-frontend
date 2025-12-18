/**
 * Example: Animation Integration in Editor
 * 
 * This file shows how to integrate the animation system into your existing Editor.tsx
 * Copy the relevant parts into your Editor.tsx or ModifyEditor.tsx
 */

import React, { useState, useRef } from 'react';
import { Stage, Layer, Text, Rect, Circle } from 'react-konva';
import { AnimationPanel } from '../AnimationPanel';
import { AnimationToolbar } from '../AnimationToolbar';
import { useAnimation } from '../../hooks/useAnimation';
import { animationEngine } from '../../services/animationService';
import { ElementAnimation } from '../../types/animation';

// ==================== Step 1: Update Element Interface ====================
// Your existing CanvasElement should now include animation property
interface CanvasElement {
  id: string;
  type: 'text' | 'rect' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  animation?: ElementAnimation; // ADD THIS LINE
  // ... other properties
}

// ==================== Step 2: Animated Element Component ====================
// Wrapper component that handles animations for any Konva element

interface AnimatedElementProps {
  element: CanvasElement;
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
}

const AnimatedElement: React.FC<AnimatedElementProps> = ({
  element,
  children,
  isSelected,
  onSelect,
  onUpdate,
}) => {
  const {
    elementRef,
    playEnter,
    playExit,
  } = useAnimation({
    elementId: element.id,
    animation: element.animation,
    autoPlay: false, // Disabled - animations play in preview mode only
  });

  // Handle drag - CRITICAL: Stop animations during drag
  const handleDragStart = () => {
    animationEngine.stopAnimation(element.id);
  };

  const handleDragEnd = (e: any) => {
    const node = e.target;
    onUpdate({
      x: node.x(),
      y: node.y(),
    });
  };

  // Simply render children - ref will be passed through component props
  return children as React.ReactElement;
};

// ==================== Step 3: Main Editor with Animation Support ====================

export const EditorWithAnimations: React.FC = () => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAnimationPanel, setShowAnimationPanel] = useState(false);

  const selectedElement = elements.find(el => el.id === selectedId);

  // Update element
  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  // Handle animation change
  const handleAnimationChange = (animation: ElementAnimation) => {
    if (!selectedId) return;
    updateElement(selectedId, { animation });
  };

  // Handle animation preview
  const handleAnimationPreview = (type: 'enter' | 'exit') => {
    if (!selectedElement?.animation) return;

    const config = type === 'enter' 
      ? selectedElement.animation.enter 
      : selectedElement.animation.exit;

    if (!config) return;

    // Preview on selected element
    const konvaNode = elements.find(el => el.id === selectedId);
    if (konvaNode) {
      animationEngine.previewAnimation(konvaNode, config);
    }
  };

  // Play animation from toolbar
  const handlePlayAnimation = (type: 'enter' | 'exit') => {
    if (!selectedElement?.animation) return;

    const config = type === 'enter'
      ? selectedElement.animation.enter
      : selectedElement.animation.exit;

    if (!config) return;

    const konvaNode = elements.find(el => el.id === selectedId);
    if (konvaNode) {
      animationEngine.runAnimation(selectedId!, konvaNode, config);
    }
  };

  // Stop animation
  const handleStopAnimation = () => {
    if (selectedId) {
      animationEngine.stopAnimation(selectedId);
    }
  };

  // Apply preset from toolbar
  const handleApplyPreset = (animation: ElementAnimation) => {
    if (selectedId) {
      updateElement(selectedId, { animation });
    }
  };

  return (
    <div className="editor-container">
      {/* Top Toolbar with Animation Controls */}
      <div className="top-toolbar">
        <AnimationToolbar
          selectedElementId={selectedId}
          onApplyPreset={handleApplyPreset}
          onPlayAnimation={handlePlayAnimation}
          onStopAnimation={handleStopAnimation}
        />
      </div>

      {/* Main Content */}
      <div className="editor-main">
        {/* Canvas */}
        <div className="canvas-area">
          <Stage width={1920} height={1080}>
            <Layer>
              {elements.map(element => (
                <AnimatedElement
                  key={element.id}
                  element={element}
                  isSelected={element.id === selectedId}
                  onSelect={() => setSelectedId(element.id)}
                  onUpdate={(updates) => updateElement(element.id, updates)}
                >
                  {element.type === 'text' && (
                    <Text
                      x={element.x}
                      y={element.y}
                      text={element.content}
                      fontSize={24}
                    />
                  )}
                  {element.type === 'rect' && (
                    <Rect
                      x={element.x}
                      y={element.y}
                      width={element.width}
                      height={element.height}
                      fill="blue"
                    />
                  )}
                  {element.type === 'circle' && (
                    <Circle
                      x={element.x}
                      y={element.y}
                      radius={element.width / 2}
                      fill="red"
                    />
                  )}
                </AnimatedElement>
              ))}
            </Layer>
          </Stage>
        </div>

        {/* Right Sidebar with Animation Panel */}
        <div className="right-sidebar">
          {showAnimationPanel && (
            <AnimationPanel
              elementId={selectedId}
              elementAnimation={selectedElement?.animation}
              onAnimationChange={handleAnimationChange}
              onPreview={handleAnimationPreview}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== Step 4: Save/Load with Animations ====================

// When saving to Firestore
export const saveDesignWithAnimations = async (elements: CanvasElement[]) => {
  const design = {
    id: 'design-123',
    elements: elements.map(el => ({
      ...el,
      // Animation is automatically included
      animation: el.animation,
    })),
  };

  // Your existing save logic
  // await saveDesignToFirestore(design);
};

// When loading from Firestore
export const loadDesignWithAnimations = async (designId: string) => {
  // Your existing load logic
  // const design = await getDesignById(designId);

  // Elements will automatically have animation property
  // setElements(design.elements);
};

// ==================== Step 5: Bulk Animation Operations ====================

// Apply animation to multiple elements
export const applyAnimationToMultiple = (
  elementIds: string[],
  animation: ElementAnimation,
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>
) => {
  setElements(prev =>
    prev.map(el =>
      elementIds.includes(el.id) ? { ...el, animation } : el
    )
  );
};

// Play animations in sequence
export const playSequentialAnimations = async (
  elements: CanvasElement[],
  delay: number = 200
) => {
  for (const element of elements) {
    if (element.animation?.enabled && element.animation.enter) {
      await animationEngine.runAnimation(
        element.id,
        element,
        element.animation.enter
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// ==================== Step 6: Export Animations ====================

// Export design with animations for other platforms
export const exportDesignWithAnimations = (elements: CanvasElement[]) => {
  return {
    version: '1.0',
    animations: elements.reduce((acc, el) => {
      if (el.animation) {
        acc[el.id] = el.animation;
      }
      return acc;
    }, {} as Record<string, ElementAnimation>),
    elements: elements.map(el => ({
      id: el.id,
      type: el.type,
      x: el.x,
      y: el.y,
      // ... other properties
    })),
  };
};

// ==================== Styles for Example ====================

const styles = `
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.top-toolbar {
  border-bottom: 1px solid #e5e7eb;
}

.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.right-sidebar {
  width: 320px;
  background: white;
  border-left: 1px solid #e5e7eb;
  overflow-y: auto;
}
`;
