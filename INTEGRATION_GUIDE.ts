/**
 * Quick Integration Guide for Multi-Element Selection & Alignment
 * 
 * This file provides step-by-step instructions to integrate the alignment
 * system into your existing Editor.tsx component
 */

// ==================== STEP 1: Add State for Multiple Selection ====================
// In your Editor component (if not already present), ensure you have:

// const [selectedIds, setSelectedIds] = useState<string[]>([]);
// const [elements, setElements] = useState<CanvasElement[]>([]);

// Computed values for backward compatibility:
// const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
// const selectedElement = selectedId ? elements.find(el => el.id === selectedId) : null;

// ==================== STEP 2: Import Required Modules ====================

import { AlignmentToolbar } from '../components/AlignmentToolbar';
import * as alignmentService from '../services/alignmentService';

// ==================== STEP 3: Update Element Click Handler ====================

// Find your element click handler and update it to support multi-select:

const handleElementClick = (e: React.MouseEvent, elementId: string) => {
  e.stopPropagation();
  
  if (e.shiftKey) {
    // Shift+Click: Toggle element in selection
    setSelectedIds(prev =>
      prev.includes(elementId)
        ? prev.filter(id => id !== elementId)
        : [...prev, elementId]
    );
  } else if (e.ctrlKey || e.metaKey) {
    // Ctrl/Cmd+Click: Add/remove from selection
    setSelectedIds(prev => {
      if (prev.includes(elementId)) {
        return prev.filter(id => id !== elementId);
      } else {
        return [...prev, elementId];
      }
    });
  } else {
    // Regular click: Single selection
    setSelectedIds([elementId]);
  }
};

// ==================== STEP 4: Add Canvas Click Handler ====================

// Add a handler for clicking on empty canvas area to deselect all:

const handleCanvasClick = (e: React.MouseEvent) => {
  if (e.target === e.currentTarget) {
    setSelectedIds([]);
  }
};

// ==================== STEP 5: Add Alignment Toolbar to UI ====================

// In your render/JSX, add the AlignmentToolbar when multiple elements are selected.
// Suggested location: Right sidebar, above or below properties panel

{selectedIds.length > 1 && (
  <div className="mb-4">
    <AlignmentToolbar
      selectedElements={elements.filter(el => selectedIds.includes(el.id))}
      onElementsUpdate={(updatedElements) => {
        setElements(updatedElements);
        // Also add to undo/redo history if you have it
        if (history && setHistory && setHistoryIndex) {
          setHistory([...history.slice(0, historyIndex + 1), updatedElements]);
          setHistoryIndex(historyIndex + 1);
        }
      }}
      canvasWidth={canvasSize.width}
      canvasHeight={canvasSize.height}
    />
  </div>
)}

// ==================== STEP 6: Update Visual Selection Styling ====================

// When rendering elements on canvas, add visual feedback for selection:

const isSelected = selectedIds.includes(element.id);
const isMultiSelected = selectedIds.length > 1;

<div
  onClick={(e) => handleElementClick(e, element.id)}
  style={{
    // ... existing styles
    border: isSelected 
      ? isMultiSelected 
        ? '3px solid #3b82f6' // Blue for multi-select
        : '2px solid #10b981' // Green for single select
      : 'none',
    boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none',
  }}
>
  {/* Element content */}
</div>

// ==================== STEP 7: Add Keyboard Shortcuts (Optional) ====================

// Add this to your Editor component's useEffect:

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedIds.length < 2) return;

    const selectedEls = elements.filter(el => selectedIds.includes(el.id));

    // Example shortcuts
    if (e.shiftKey && e.key === 'h') {
      // Shift+H: Distribute Horizontally
      e.preventDefault();
      const updates = alignmentService.distributeHorizontally(selectedEls);
      const updated = alignmentService.applyAlignmentUpdates(selectedEls, updates);
      setElements(elements.map(el => updated.find(u => u.id === el.id) || el));
    }

    if (e.shiftKey && e.key === 'v') {
      // Shift+V: Distribute Vertically
      e.preventDefault();
      const updates = alignmentService.distributeVertically(selectedEls);
      const updated = alignmentService.applyAlignmentUpdates(selectedEls, updates);
      setElements(elements.map(el => updated.find(u => u.id === el.id) || el));
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      // Delete: Remove selected elements
      e.preventDefault();
      setElements(elements.filter(el => !selectedIds.includes(el.id)));
      setSelectedIds([]);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedIds, elements]);

// ==================== STEP 8: Test Multi-Select Workflow ====================

/*
Testing Checklist:
1. ✓ Click element -> Single selection (green border)
2. ✓ Shift+Click elements -> Add/remove from selection (blue border)
3. ✓ Ctrl+Click elements -> Toggle in selection
4. ✓ Click empty space -> Deselect all
5. ✓ With 2+ elements selected, AlignmentToolbar appears
6. ✓ Align Left moves all to leftmost position
7. ✓ Align Center aligns vertically along center line
8. ✓ Distribute Horizontally spaces evenly
9. ✓ Grid Arrange reorganizes in grid pattern
10. ✓ Make Same Size equalizes dimensions
*/

// ==================== COMMON ISSUES & SOLUTIONS ====================

/*
Issue: Multi-select not working
Solution: Ensure selectedIds state is properly initialized and handleElementClick is attached

Issue: AlignmentToolbar doesn't appear
Solution: Check that selectedIds.length > 1 and elements are properly filtered

Issue: Alignment changes don't persist
Solution: Ensure state updates call setElements() with new array

Issue: Undo/Redo not working with alignment
Solution: Add alignment updates to your history tracking:
  setHistory([...history.slice(0, historyIndex + 1), updatedElements]);

Issue: Performance slow with many elements
Solution: Consider virtualizing element list if > 100 elements
*/

// ==================== HELPFUL UTILITY FUNCTIONS ====================

// Select all elements
const selectAll = () => {
  setSelectedIds(elements.map(el => el.id));
};

// Deselect all
const deselectAll = () => {
  setSelectedIds([]);
};

// Invert selection
const invertSelection = () => {
  const selectedSet = new Set(selectedIds);
  setSelectedIds(
    elements
      .map(el => el.id)
      .filter(id => !selectedSet.has(id))
  );
};

// Select by type
const selectByType = (type: ElementType) => {
  setSelectedIds(
    elements
      .filter(el => el.type === type)
      .map(el => el.id)
  );
};

// Delete selected
const deleteSelected = () => {
  setElements(elements.filter(el => !selectedIds.includes(el.id)));
  setSelectedIds([]);
};

// Duplicate selected
const duplicateSelected = () => {
  const selectedEls = elements.filter(el => selectedIds.includes(el.id));
  const duplicates = selectedEls.map(el => ({
    ...el,
    id: `${el.type}-${Date.now()}-${Math.random()}`,
    x: el.x + 20,
    y: el.y + 20,
  }));
  setElements([...elements, ...duplicates]);
  setSelectedIds(duplicates.map(el => el.id));
};

// Export these as methods in your Editor component
export {
  selectAll,
  deselectAll,
  invertSelection,
  selectByType,
  deleteSelected,
  duplicateSelected,
};
