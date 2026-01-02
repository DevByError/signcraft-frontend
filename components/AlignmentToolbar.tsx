/**
 * Alignment Toolbar Component
 * Provides UI controls for aligning and distributing multiple elements
 */

import React from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignEndVertical,
  Grid3x3,
  ArrowDownUp,
  ArrowRightLeft,
  Copy,
  Maximize,
  Minimize,
  Layout,
} from 'lucide-react';
import {
  alignHorizontally,
  alignVertically,
  distributeHorizontally,
  distributeVertically,
  arrangeGrid,
  stackVertically,
  stackHorizontally,
  makeSameSize,
  applyAlignmentUpdates,
  type AlignmentType,
} from '../services/alignmentService';
import type { CanvasElement } from '../types/canvas';

interface AlignmentToolbarProps {
  selectedElements: CanvasElement[];
  onElementsUpdate: (elements: CanvasElement[]) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export const AlignmentToolbar: React.FC<AlignmentToolbarProps> = ({
  selectedElements,
  onElementsUpdate,
  canvasWidth,
  canvasHeight,
}) => {
  if (selectedElements.length < 2) {
    return null; // Only show for multiple selections
  }

  const handleAlign = (alignment: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom') => {
    let updates;

    if (['left', 'center-x', 'right'].includes(alignment)) {
      updates = alignHorizontally(selectedElements, alignment as 'left' | 'center-x' | 'right');
    } else {
      updates = alignVertically(selectedElements, alignment as 'top' | 'center-y' | 'bottom');
    }

    const updated = applyAlignmentUpdates(selectedElements, updates);
    onElementsUpdate(updated);
  };

  const handleDistribute = (axis: 'x' | 'y') => {
    const updates = axis === 'x' 
      ? distributeHorizontally(selectedElements)
      : distributeVertically(selectedElements);

    const updated = applyAlignmentUpdates(selectedElements, updates);
    onElementsUpdate(updated);
  };

  const handleArrange = (type: 'grid' | 'stack-v' | 'stack-h') => {
    let updates;

    switch (type) {
      case 'grid':
        const cols = Math.ceil(Math.sqrt(selectedElements.length));
        updates = arrangeGrid(selectedElements, cols, 20, 100, 100);
        break;
      case 'stack-v':
        updates = stackVertically(selectedElements, 20, 100, 100);
        break;
      case 'stack-h':
        updates = stackHorizontally(selectedElements, 20, 100, 100);
        break;
    }

    const updated = applyAlignmentUpdates(selectedElements, updates);
    onElementsUpdate(updated);
  };

  const handleMakeSize = (dimension: 'width' | 'height' | 'both') => {
    const updates = makeSameSize(selectedElements, dimension);
    const updated = applyAlignmentUpdates(selectedElements, updates);
    onElementsUpdate(updated);
  };

  const tooltips: Record<string, string> = {
    'align-left': 'Align Left',
    'align-center-h': 'Align Center (H)',
    'align-right': 'Align Right',
    'align-top': 'Align Top',
    'align-center-v': 'Align Center (V)',
    'align-bottom': 'Align Bottom',
    'distribute-h': 'Distribute Horizontally',
    'distribute-v': 'Distribute Vertically',
    'same-width': 'Make Same Width',
    'same-height': 'Make Same Height',
    'same-size': 'Make Same Size',
    'grid': 'Arrange in Grid',
    'stack-v': 'Stack Vertically',
    'stack-h': 'Stack Horizontally',
  };

  const Button: React.FC<{
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    variant?: 'default' | 'secondary';
  }> = ({ onClick, title, children, variant = 'default' }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded transition-colors ${
        variant === 'default'
          ? 'hover:bg-blue-100 text-gray-700 hover:text-blue-700'
          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
      <div className="text-sm font-semibold text-gray-700">
        ✓ {selectedElements.length} Elements Selected
      </div>

      {/* Horizontal Alignment */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-2 px-1">Align Horizontal</div>
        <div className="flex gap-1 flex-wrap">
          <Button
            onClick={() => handleAlign('left')}
            title={tooltips['align-left']}
          >
            <AlignLeft size={18} />
          </Button>
          <Button
            onClick={() => handleAlign('center-x')}
            title={tooltips['align-center-h']}
          >
            <AlignCenter size={18} />
          </Button>
          <Button
            onClick={() => handleAlign('right')}
            title={tooltips['align-right']}
          >
            <AlignRight size={18} />
          </Button>
        </div>
      </div>

      {/* Vertical Alignment */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-2 px-1">Align Vertical</div>
        <div className="flex gap-1 flex-wrap">
          <Button
            onClick={() => handleAlign('top')}
            title={tooltips['align-top']}
          >
            <AlignStartVertical size={18} />
          </Button>
          <Button
            onClick={() => handleAlign('center-y')}
            title={tooltips['align-center-v']}
          >
            <Grid3x3 size={18} />
          </Button>
          <Button
            onClick={() => handleAlign('bottom')}
            title={tooltips['align-bottom']}
          >
            <AlignEndVertical size={18} />
          </Button>
        </div>
      </div>

      {/* Distribution */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-2 px-1">Distribute</div>
        <div className="flex gap-1 flex-wrap">
          <Button
            onClick={() => handleDistribute('x')}
            title={tooltips['distribute-h']}
            variant="secondary"
          >
            <ArrowRightLeft size={18} />
          </Button>
          <Button
            onClick={() => handleDistribute('y')}
            title={tooltips['distribute-v']}
            variant="secondary"
          >
            <ArrowDownUp size={18} />
          </Button>
        </div>
      </div>

      {/* Sizing */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-2 px-1">Make Same Size</div>
        <div className="flex gap-1 flex-wrap">
          <Button
            onClick={() => handleMakeSize('width')}
            title={tooltips['same-width']}
            variant="secondary"
          >
            <ArrowRightLeft size={16} className="text-blue-600" />
          </Button>
          <Button
            onClick={() => handleMakeSize('height')}
            title={tooltips['same-height']}
            variant="secondary"
          >
            <ArrowDownUp size={16} className="text-blue-600" />
          </Button>
          <Button
            onClick={() => handleMakeSize('both')}
            title={tooltips['same-size']}
            variant="secondary"
          >
            <Maximize size={16} className="text-blue-600" />
          </Button>
        </div>
      </div>

      {/* Arrangement */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-2 px-1">Arrange</div>
        <div className="flex gap-1 flex-wrap">
          <Button
            onClick={() => handleArrange('grid')}
            title={tooltips['grid']}
            variant="secondary"
          >
            <Grid3x3 size={18} className="text-green-600" />
          </Button>
          <Button
            onClick={() => handleArrange('stack-v')}
            title={tooltips['stack-v']}
            variant="secondary"
          >
            <Layout size={16} className="text-green-600" style={{ transform: 'rotate(90deg)' }} />
          </Button>
          <Button
            onClick={() => handleArrange('stack-h')}
            title={tooltips['stack-h']}
            variant="secondary"
          >
            <Layout size={16} className="text-green-600" />
          </Button>
        </div>
      </div>

      <div className="text-xs text-gray-500 px-1 pt-2 border-t">
        💡 Tip: Select multiple elements with Shift+Click to use these tools
      </div>
    </div>
  );
};
