/**
 * CapCut-Style Timeline Integration Example
 * Professional video-editing style timeline for SignCraft
 */

import React, { useState, useEffect } from 'react';
import TimelineCapCut from '../components/TimelineCapCut';
import { LayerPanel } from '../components/LayerPanel';
import { useTimeline } from '../hooks/useTimeline';
import { CanvasElement, ElementType } from '../types/canvas';
import * as timelineService from '../services/timelineService';
import * as propertyPlaybackService from '../services/propertyPlaybackService';

interface EditorWithCapCutTimelineProps {
  designId: string;
  initialElements: CanvasElement[];
  onElementsChange: (elements: CanvasElement[]) => void;
}

export const EditorWithCapCutTimeline: React.FC<EditorWithCapCutTimelineProps> = ({
  designId,
  initialElements,
  onElementsChange,
}) => {
  const [elements, setElements] = useState<CanvasElement[]>(initialElements);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  const [timelineHeight, setTimelineHeight] = useState(300);

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
    selectItem,
    syncElementsToTimeline,
    getItemsAtTime,
  } = useTimeline({
    designId,
    elements,
    autoSave: true,
    onTimelineChange: (newTimeline) => {
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
    if (timeline.isPlaying || timeline.currentTime > 0) {
      // Apply timeline state to elements (handles properties and visibility)
      const updatedElements = propertyPlaybackService.applyTimelineToElements(elements, timeline);
      setElements(updatedElements);
    } else {
      // When stopped at beginning, show all elements
      setElements(elements.map(el => ({ ...el, visible: true })));
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
    
    // Add to timeline at current time with 5s duration
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

  // Handle split item
  const handleSplitItem = (itemId: string, splitTime: number) => {
    try {
      const updated = timelineService.splitItem(timeline, itemId, splitTime);
      updateTimeline(updated);
    } catch (error) {
      console.error('Split failed:', error);
      alert(error instanceof Error ? error.message : 'Cannot split item');
    }
  };

  // Handle arrange sequential
  const handleArrangeSequential = () => {
    const updated = timelineService.autoArrangeAll(timeline, 500);
    updateTimeline(updated);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space - Play/Pause
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        timeline.isPlaying ? pause() : play();
      }
    
      // Home - Jump to start
      if (e.code === 'Home') {
        e.preventDefault();
        stop();
      }
      
      // End - Jump to end
      if (e.code === 'End') {
        e.preventDefault();
        seek(timeline.totalDuration);
      }
      
      // Arrow keys - Seek
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seek(Math.max(0, timeline.currentTime - 100));
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        seek(Math.min(timeline.totalDuration, timeline.currentTime + 100));
      }
      
      // Ctrl+Z - Undo
      if (e.ctrlKey && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      
      // Ctrl+Y or Ctrl+Shift+Z - Redo
      if ((e.ctrlKey && e.code === 'KeyY') || (e.ctrlKey && e.shiftKey && e.code === 'KeyZ')) {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [timeline.isPlaying, timeline.currentTime, timeline.totalDuration, canUndo, canRedo]);

  // Resize timeline handle
  const handleTimelineResize = (e: React.MouseEvent) => {
    const startY = e.clientY;
    const startHeight = timelineHeight;

    const handleMouseMove = (moveE: MouseEvent) => {
      const deltaY = startY - moveE.clientY;
      setTimelineHeight(Math.max(200, Math.min(600, startHeight + deltaY)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-950 text-white shadow-lg z-10 border-b border-gray-800">
        <h1 className="text-lg font-semibold">SignCraft Editor</h1>
        <div className="flex-1" />
        
        {/* View toggles */}
        <button
          onClick={() => setShowLayers(!showLayers)}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            showLayers ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Layers
        </button>
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            showTimeline ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Timeline
        </button>
        
        <div className="w-px h-6 bg-gray-700 mx-2" />
        
        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="px-3 py-1.5 bg-gray-700 rounded text-sm font-medium hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="px-3 py-1.5 bg-gray-700 rounded text-sm font-medium hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Redo (Ctrl+Y)"
        >
          Redo
        </button>
      </div>

      {/* Canvas area - CapCut style: full width above timeline */}
      <div className="flex-1 flex overflow-hidden">
        {/* Layer panel - left side */}
        {showLayers && (
          <div className="w-72 border-r border-gray-800">
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
          </div>
        )}

        {/* Canvas - center (like CapCut's preview area) */}
        <div className="flex-1 bg-gray-800 overflow-auto relative">
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
              <h2 className="text-3xl font-bold mb-4 text-gray-800">Canvas Area</h2>
              <p className="text-gray-600 mb-6">
                Your canvas elements render here. Add elements and control their timeline below.
              </p>
              
              {/* Quick add buttons */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  onClick={() => handleAddElement(ElementType.TEXT)}
                  className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium shadow-lg transition-all transform hover:scale-105"
                >
                  📝 Add Text
                </button>
                <button
                  onClick={() => handleAddElement(ElementType.RECT)}
                  className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 font-medium shadow-lg transition-all transform hover:scale-105"
                >
                  ▭ Add Rectangle
                </button>
                <button
                  onClick={() => handleAddElement(ElementType.CIRCLE)}
                  className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-medium shadow-lg transition-all transform hover:scale-105"
                >
                  ⚪ Add Circle
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{elements.length}</div>
                  <div className="text-sm text-gray-600">Elements</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{selectedElementIds.length}</div>
                  <div className="text-sm text-gray-600">Selected</div>
                </div>
              </div>

              {/* Keyboard shortcuts help */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">⌨️ Keyboard Shortcuts</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div><kbd className="px-2 py-1 bg-white rounded shadow-sm">Space</kbd> Play/Pause</div>
                  <div><kbd className="px-2 py-1 bg-white rounded shadow-sm">Home</kbd> Jump to start</div>
                  <div><kbd className="px-2 py-1 bg-white rounded shadow-sm">←→</kbd> Seek</div>
                  <div><kbd className="px-2 py-1 bg-white rounded shadow-sm">Ctrl+Z</kbd> Undo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline panel - CapCut style: Full width at bottom with resize handle */}
      {showTimeline && (
        <div className="border-t-2 border-gray-700 relative bg-gray-900" style={{ height: `${timelineHeight}px` }}>
          {/* Resize handle */}
          <div
            className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500 transition-colors z-20"
            onMouseDown={handleTimelineResize}
          />
          
          <TimelineCapCut
            timeline={timeline}
            onTimelineChange={updateTimeline}
            onItemSelect={handleTimelineItemSelect}
            selectedItemIds={selectedItems}
            onSplitItem={handleSplitItem}
            onArrangeSequential={handleArrangeSequential}
          />
        </div>
      )}
    </div>
  );
};

export default EditorWithCapCutTimeline;
