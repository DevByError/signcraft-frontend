/**
 * Timeline Integration Example
 * Shows how to integrate Timeline and Layer Panel into the Editor
 */

import React, { useState, useEffect } from 'react';
import TimelineCapCut from '../components/TimelineCapCut';
import { LayerPanel } from '../components/LayerPanel';
import { useTimeline } from '../hooks/useTimeline';
import { CanvasElement, ElementType } from '../types/canvas';

interface EditorWithTimelineProps {
  designId: string;
  initialElements: CanvasElement[];
  onElementsChange: (elements: CanvasElement[]) => void;
}

export const EditorWithTimeline: React.FC<EditorWithTimelineProps> = ({
  designId,
  initialElements,
  onElementsChange,
}) => {
  const [elements, setElements] = useState<CanvasElement[]>(initialElements);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showLayers, setShowLayers] = useState(true);

  // Initialize timeline hook
  const {
    timeline,
    selectedItems,
    canUndo,
    canRedo,
    updateTimeline,
    undo,
    redo,
    addElementToTimeline,
    removeElementFromTimeline,
    play,
    pause,
    stop,
    seek,
    addTrack,
    removeItem,
    duplicateItem,
    selectItem,
    syncElementsToTimeline,
    getItemsAtTime,
  } = useTimeline({
    designId,
    elements,
    autoSave: true,
    onTimelineChange: (newTimeline) => {
      // Handle timeline changes (e.g., save to backend)
      console.log('Timeline updated:', newTimeline);
    },
  });

  // Sync elements when they change
  useEffect(() => {
    setElements(initialElements);
  }, [initialElements]);

  // Auto-sync new elements to timeline
  useEffect(() => {
    syncElementsToTimeline();
  }, [elements.length]);

  // Update visible elements based on timeline position
  useEffect(() => {
    if (timeline.isPlaying) {
      const activeItems = getItemsAtTime(timeline.currentTime);
      
      // Update element visibility based on timeline
      const updatedElements = elements.map(el => {
        const isActive = activeItems.some(item => item.elementId === el.id);
        return { ...el, visible: isActive };
      });
      
      setElements(updatedElements);
    }
  }, [timeline.currentTime, timeline.isPlaying]);

  // Handle element selection
  const handleElementSelect = (elementId: string, addToSelection = false) => {
    if (addToSelection) {
      setSelectedElementIds(prev =>
        prev.includes(elementId)
          ? prev.filter(id => id !== elementId)
          : [...prev, elementId]
      );
    } else {
      setSelectedElementIds([elementId]);
    }
  };

  // Handle element deletion
  const handleElementDelete = (elementId: string) => {
    const updatedElements = elements.filter(el => el.id !== elementId);
    setElements(updatedElements);
    removeElementFromTimeline(elementId);
    onElementsChange(updatedElements);
  };

  // Handle element duplication
  const handleElementDuplicate = (elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const newElement: CanvasElement = {
      ...element,
      id: `element-${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20,
    };

    const updatedElements = [...elements, newElement];
    setElements(updatedElements);
    addElementToTimeline(newElement, timeline.currentTime, 5000);
    onElementsChange(updatedElements);
  };

  // Handle adding new element
  const handleAddElement = (type: ElementType) => {
    const newElement: CanvasElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === ElementType.TEXT ? 'New Text' : '',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      opacity: 1,
      rotation: 0,
      zIndex: elements.length,
      visible: true,
      locked: false,
      fontSize: type === ElementType.TEXT ? 24 : undefined,
      color: type === ElementType.TEXT ? '#000000' : undefined,
      fillColor: type === ElementType.RECT ? '#3B82F6' : undefined,
    };

    const updatedElements = [...elements, newElement];
    setElements(updatedElements);
    
    // Add to timeline at current time
    addElementToTimeline(newElement, timeline.currentTime, 5000);
    onElementsChange(updatedElements);
  };

  // Handle timeline item selection
  const handleTimelineItemSelect = (itemId: string) => {
    selectItem(itemId);
    
    // Find the element for this item
    const item = timeline.tracks
      .flatMap(t => t.items)
      .find(i => i.id === itemId);
    
    if (item) {
      handleElementSelect(item.elementId);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white">
        <h1 className="text-lg font-semibold">Editor with Timeline</h1>
        <div className="flex-1" />
        
        <button
          onClick={() => setShowLayers(!showLayers)}
          className={`px-3 py-1 rounded ${showLayers ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Layers
        </button>
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className={`px-3 py-1 rounded ${showTimeline ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Timeline
        </button>
        
        <div className="border-l border-gray-600 h-6 mx-2" />
        
        <button
          onClick={undo}
          disabled={!canUndo}
          className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
        >
          Redo
        </button>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area (simplified for example) */}
        <div className="flex-1 bg-gray-200 overflow-auto relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Canvas Area</h2>
              <p className="text-gray-600 mb-4">Your canvas elements render here</p>
              
              {/* Quick add buttons */}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => handleAddElement(ElementType.TEXT)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Text
                </button>
                <button
                  onClick={() => handleAddElement(ElementType.RECT)}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Add Rectangle
                </button>
                <button
                  onClick={() => handleAddElement(ElementType.CIRCLE)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Add Circle
                </button>
              </div>

              {/* Element count */}
              <div className="mt-8 text-gray-600">
                <p>{elements.length} elements on canvas</p>
                <p>{selectedElementIds.length} selected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Layer panel */}
        {showLayers && (
          <LayerPanel
            elements={elements}
            selectedElementIds={selectedElementIds}
            onElementsChange={(updatedElements) => {
              setElements(updatedElements);
              onElementsChange(updatedElements);
            }}
            onElementSelect={handleElementSelect}
            onElementDelete={handleElementDelete}
            onElementDuplicate={handleElementDuplicate}
          />
        )}
      </div>

      {/* Timeline panel */}
      {showTimeline && (
        <div className="h-80 border-t-2 border-gray-300">
          <TimelineCapCut
            timeline={timeline}
            onTimelineChange={updateTimeline}
            onItemSelect={handleTimelineItemSelect}
            selectedItemIds={selectedItems}
            onArrangeSequential={() => {}}
            onSplitItem={() => {}}
          />
        </div>
      )}
    </div>
  );
};

export default EditorWithTimeline;

/**
 * INTEGRATION GUIDE:
 * 
 * 1. Import the components:
 *    import { Timeline } from '../components/Timeline';
 *    import { LayerPanel } from '../components/LayerPanel';
 *    import { useTimeline } from '../hooks/useTimeline';
 * 
 * 2. Initialize the timeline hook:
 *    const timeline = useTimeline({ designId, elements });
 * 
 * 3. Add Timeline component to your layout:
 *    <Timeline 
 *      timeline={timeline.timeline}
 *      onTimelineChange={timeline.updateTimeline}
 *      onItemSelect={timeline.selectItem}
 *      selectedItemIds={timeline.selectedItems}
 *    />
 * 
 * 4. Add LayerPanel component:
 *    <LayerPanel
 *      elements={elements}
 *      selectedElementIds={selectedElementIds}
 *      onElementsChange={setElements}
 *      onElementSelect={handleElementSelect}
 *      onElementDelete={handleElementDelete}
 *      onElementDuplicate={handleElementDuplicate}
 *    />
 * 
 * 5. Sync elements with timeline:
 *    - Call addElementToTimeline() when creating new elements
 *    - Call removeElementFromTimeline() when deleting elements
 *    - Call syncElementsToTimeline() to sync all elements
 * 
 * 6. Layer ordering:
 *    - Use bringToFront, sendToBack, bringForward, sendBackward
 *    - LayerPanel handles this automatically
 * 
 * 7. Timeline playback:
 *    - Use play(), pause(), stop() for playback control
 *    - Use seek() to jump to specific time
 *    - Listen to currentTime to update element visibility
 * 
 * 8. Auto-arrange:
 *    - Use autoArrange() to sequence items automatically
 *    - Useful for creating sequential animations
 */
