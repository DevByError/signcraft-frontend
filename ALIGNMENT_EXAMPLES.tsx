/**
 * Multi-Element Alignment System - Usage Examples
 * 
 * This file demonstrates various usage patterns and scenarios
 */

import React, { useState } from 'react';
import * as alignmentService from './services/alignmentService';
import type { CanvasElement } from './types/canvas';

// ==================== Example 1: Basic Horizontal Alignment ====================

function example1_alignLeft() {
  const elements: CanvasElement[] = [
    { id: '1', type: 'rect', x: 100, y: 50, width: 100, height: 50, opacity: 1, rotation: 0, zIndex: 1, visible: true, locked: false },
    { id: '2', type: 'rect', x: 250, y: 50, width: 100, height: 50, opacity: 1, rotation: 0, zIndex: 2, visible: true, locked: false },
    { id: '3', type: 'rect', x: 400, y: 50, width: 100, height: 50, opacity: 1, rotation: 0, zIndex: 3, visible: true, locked: false },
  ];

  // Align all elements to the leftmost position
  const updates = alignmentService.alignHorizontally(elements, 'left');
  const result = alignmentService.applyAlignmentUpdates(elements, updates);

  // Result: All elements have x: 100
  // [
  //   { id: '1', x: 100, ... },
  //   { id: '2', x: 100, ... }, // Changed from 250
  //   { id: '3', x: 100, ... }, // Changed from 400
  // ]
}

// ==================== Example 2: Distribute Evenly ====================

function example2_distributeEvenly() {
  const elements: CanvasElement[] = [
    { id: '1', type: 'rect', x: 0, y: 0, width: 50, height: 100, opacity: 1, rotation: 0, zIndex: 1, visible: true, locked: false },
    { id: '2', type: 'rect', x: 100, y: 0, width: 50, height: 100, opacity: 1, rotation: 0, zIndex: 2, visible: true, locked: false },
    { id: '3', type: 'rect', x: 500, y: 0, width: 50, height: 100, opacity: 1, rotation: 0, zIndex: 3, visible: true, locked: false },
  ];

  // Distribute horizontally with equal spacing
  const updates = alignmentService.distributeHorizontally(elements);
  const result = alignmentService.applyAlignmentUpdates(elements, updates);

  // Result: Elements are spaced evenly across the total width
  // Calculation:
  //   - Total width: 500px (from 0 to 550)
  //   - Total element width: 150px (50+50+50)
  //   - Available space: 350px
  //   - Spacing: 175px (between each element)
}

// ==================== Example 3: Grid Arrangement ====================

function example3_gridArrangement() {
  const elements: CanvasElement[] = [
    { id: 'img1', type: 'image', x: 10, y: 10, width: 100, height: 100, opacity: 1, rotation: 0, zIndex: 1, visible: true, locked: false },
    { id: 'img2', type: 'image', x: 20, y: 20, width: 100, height: 100, opacity: 1, rotation: 0, zIndex: 2, visible: true, locked: false },
    { id: 'img3', type: 'image', x: 30, y: 30, width: 100, height: 100, opacity: 1, rotation: 0, zIndex: 3, visible: true, locked: false },
    { id: 'img4', type: 'image', x: 40, y: 40, width: 100, height: 100, opacity: 1, rotation: 0, zIndex: 4, visible: true, locked: false },
    { id: 'img5', type: 'image', x: 50, y: 50, width: 100, height: 100, opacity: 1, rotation: 0, zIndex: 5, visible: true, locked: false },
    { id: 'img6', type: 'image', x: 60, y: 60, width: 100, height: 100, opacity: 1, rotation: 0, zIndex: 6, visible: true, locked: false },
  ];

  // Arrange 6 images in a 2x3 grid with 20px spacing, starting at (100, 100)
  const cols = Math.ceil(Math.sqrt(6)); // 2 columns
  const updates = alignmentService.arrangeGrid(elements, cols, 20, 100, 100);
  const result = alignmentService.applyAlignmentUpdates(elements, updates);

  // Result: Images arranged as:
  // [img1 at (100, 100)] [img2 at (220, 100)]
  // [img3 at (100, 120)] [img4 at (220, 120)]
  // [img5 at (100, 140)] [img6 at (220, 140)]
}

// ==================== Example 4: Stack Vertically ====================

function example4_stackVertically() {
  const elements: CanvasElement[] = [
    { id: 'btn1', type: 'rect', x: 50, y: 100, width: 200, height: 40, opacity: 1, rotation: 0, zIndex: 1, visible: true, locked: false },
    { id: 'btn2', type: 'rect', x: 150, y: 200, width: 200, height: 40, opacity: 1, rotation: 0, zIndex: 2, visible: true, locked: false },
    { id: 'btn3', type: 'rect', x: 250, y: 300, width: 200, height: 40, opacity: 1, rotation: 0, zIndex: 3, visible: true, locked: false },
  ];

  // Stack buttons vertically at x=100, y=100, with 10px spacing
  const updates = alignmentService.stackVertically(elements, 10, 100, 100);
  const result = alignmentService.applyAlignmentUpdates(elements, updates);

  // Result: Buttons stacked vertically
  // btn1: x=100, y=100
  // btn2: x=100, y=150 (100 + 40 height + 10 spacing)
  // btn3: x=100, y=200 (150 + 40 height + 10 spacing)
}

// ==================== Example 5: Make Same Size ====================

function example5_makeSameSize() {
  const elements: CanvasElement[] = [
    { id: 'box1', type: 'rect', x: 10, y: 10, width: 80, height: 100, opacity: 1, rotation: 0, zIndex: 1, visible: true, locked: false },
    { id: 'box2', type: 'rect', x: 100, y: 10, width: 120, height: 150, opacity: 1, rotation: 0, zIndex: 2, visible: true, locked: false },
    { id: 'box3', type: 'rect', x: 230, y: 10, width: 90, height: 110, opacity: 1, rotation: 0, zIndex: 3, visible: true, locked: false },
  ];

  // Make all boxes the same size as the collective bounding box
  const updates = alignmentService.makeSameSize(elements, 'both');
  const result = alignmentService.applyAlignmentUpdates(elements, updates);

  // Result: All boxes match the largest dimensions
  // Collective width: 120 (rightmost - leftmost)
  // Collective height: 150 (bottommost - topmost)
  // All boxes become 120x150
}

// ==================== Example 6: React Component Integration ====================

export const EditorWithAlignment: React.FC = () => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleAlignLeft = () => {
    const selected = elements.filter(el => selectedIds.includes(el.id));
    if (selected.length < 2) return;

    const updates = alignmentService.alignHorizontally(selected, 'left');
    const updated = alignmentService.applyAlignmentUpdates(elements, updates);
    setElements(updated);
  };

  const handleDistributeH = () => {
    const selected = elements.filter(el => selectedIds.includes(el.id));
    if (selected.length < 3) return;

    const updates = alignmentService.distributeHorizontally(selected);
    const updated = alignmentService.applyAlignmentUpdates(elements, updates);
    setElements(updated);
  };

  return (
    <div>
      <button onClick={handleAlignLeft}>Align Left</button>
      <button onClick={handleDistributeH}>Distribute</button>
      {/* Canvas rendering */}
    </div>
  );
};

// ==================== Example 7: Advanced - Conditional Alignment ====================

function example7_conditionalAlignment() {
  const elements: CanvasElement[] = [
    { id: 'text1', type: 'text', x: 10, y: 10, width: 100, height: 50, opacity: 1, rotation: 0, zIndex: 1, visible: true, locked: false },
    { id: 'img1', type: 'image', x: 50, y: 100, width: 200, height: 150, opacity: 1, rotation: 0, zIndex: 2, visible: true, locked: false },
    { id: 'text2', type: 'text', x: 20, y: 300, width: 150, height: 40, opacity: 1, rotation: 0, zIndex: 3, visible: true, locked: false },
  ];

  // Only align text elements
  const textElements = elements.filter(el => el.type === 'text');
  const updates = alignmentService.alignHorizontally(textElements, 'center-x');
  const result = alignmentService.applyAlignmentUpdates(elements, updates);

  // Result: Only text elements are aligned, image stays in place
}

// ==================== Example 8: Bounding Box Calculations ====================

function example8_boundingBoxes() {
  const elements: CanvasElement[] = [
    { id: '1', type: 'rect', x: 50, y: 100, width: 200, height: 150, opacity: 1, rotation: 0, zIndex: 1, visible: true, locked: false },
    { id: '2', type: 'rect', x: 300, y: 80, width: 150, height: 200, opacity: 1, rotation: 0, zIndex: 2, visible: true, locked: false },
    { id: '3', type: 'rect', x: 100, y: 250, width: 100, height: 100, opacity: 1, rotation: 0, zIndex: 3, visible: true, locked: false },
  ];

  // Get individual bounding box
  const box1 = alignmentService.getElementBoundingBox(elements[0]);
  console.log('Element 1:', {
    left: 50,
    right: 250,
    top: 100,
    bottom: 250,
    width: 200,
    height: 150,
    centerX: 150,
    centerY: 175,
  });

  // Get collective bounding box
  const collective = alignmentService.getCollectiveBoundingBox(elements);
  console.log('All elements:', {
    left: 50,
    right: 450,
    top: 80,
    bottom: 350,
    width: 400,
    height: 270,
    centerX: 250,
    centerY: 215,
  });
}

// ==================== Example 9: Keyboard Shortcut Handler ====================

function example9_keyboardShortcuts() {
  const handleKeyDown = (
    e: KeyboardEvent,
    selectedIds: string[],
    elements: CanvasElement[],
    setElements: (els: CanvasElement[]) => void
  ) => {
    if (selectedIds.length < 2) return;

    const selected = elements.filter(el => selectedIds.includes(el.id));

    // Ctrl+Shift+L: Align Left
    if (e.ctrlKey && e.shiftKey && e.key === 'l') {
      e.preventDefault();
      const updates = alignmentService.alignHorizontally(selected, 'left');
      const updated = alignmentService.applyAlignmentUpdates(elements, updates);
      setElements(updated);
    }

    // Ctrl+Shift+C: Center Horizontally
    if (e.ctrlKey && e.shiftKey && e.key === 'c') {
      e.preventDefault();
      const updates = alignmentService.alignHorizontally(selected, 'center-x');
      const updated = alignmentService.applyAlignmentUpdates(elements, updates);
      setElements(updated);
    }

    // Ctrl+Shift+R: Align Right
    if (e.ctrlKey && e.shiftKey && e.key === 'r') {
      e.preventDefault();
      const updates = alignmentService.alignHorizontally(selected, 'right');
      const updated = alignmentService.applyAlignmentUpdates(elements, updates);
      setElements(updated);
    }
  };
}

// ==================== Example 10: Undo/Redo with Alignment ====================

function example10_undoRedo() {
  const [history, setHistory] = useState<CanvasElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [elements, setElements] = useState<CanvasElement[]>([]);

  const applyAlignment = (updateFn: (els: CanvasElement[]) => CanvasElement[]) => {
    // Add current state to history
    const newElements = updateFn(elements);
    
    // Save to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setElements(newElements);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  // Usage:
  // applyAlignment(elements => {
  //   const updates = alignmentService.alignHorizontally(selected, 'left');
  //   return alignmentService.applyAlignmentUpdates(elements, updates);
  // });
}

export {
  example1_alignLeft,
  example2_distributeEvenly,
  example3_gridArrangement,
  example4_stackVertically,
  example5_makeSameSize,
  example7_conditionalAlignment,
  example8_boundingBoxes,
  example9_keyboardShortcuts,
  example10_undoRedo,
};
