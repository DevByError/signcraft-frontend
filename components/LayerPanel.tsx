/**
 * LayerPanel Component
 * Visual layer management with forward/backward controls
 */

import React, { useState } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Trash2,
  Copy,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { CanvasElement } from '../types';
import * as timelineService from '../services/timelineService';

interface LayerPanelProps {
  elements: CanvasElement[];
  selectedElementIds: string[];
  onElementsChange: (elements: CanvasElement[]) => void;
  onElementSelect: (elementId: string, addToSelection?: boolean) => void;
  onElementDelete: (elementId: string) => void;
  onElementDuplicate: (elementId: string) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  elements,
  selectedElementIds,
  onElementsChange,
  onElementSelect,
  onElementDelete,
  onElementDuplicate,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // Get sorted layers
  const layers = timelineService.getLayers(elements);

  // Layer ordering actions
  const handleBringToFront = (elementId: string) => {
    const updated = timelineService.bringToFront(elements, elementId);
    onElementsChange(updated);
  };

  const handleSendToBack = (elementId: string) => {
    const updated = timelineService.sendToBack(elements, elementId);
    onElementsChange(updated);
  };

  const handleBringForward = (elementId: string) => {
    const updated = timelineService.bringForward(elements, elementId);
    onElementsChange(updated);
  };

  const handleSendBackward = (elementId: string) => {
    const updated = timelineService.sendBackward(elements, elementId);
    onElementsChange(updated);
  };

  // Toggle visibility
  const handleToggleVisibility = (elementId: string) => {
    const updated = elements.map(el =>
      el.id === elementId ? { ...el, visible: !el.visible } : el
    );
    onElementsChange(updated);
  };

  // Toggle lock
  const handleToggleLock = (elementId: string) => {
    const updated = elements.map(el =>
      el.id === elementId ? { ...el, locked: !el.locked } : el
    );
    onElementsChange(updated);
  };

  // Get element name for display
  const getElementName = (element: CanvasElement): string => {
    if (element.content && element.content.length > 0) {
      return element.content.substring(0, 20);
    }
    return element.type.toString();
  };

  // Get element icon
  const getElementIcon = (type: string): string => {
    const iconMap: { [key: string]: string } = {
      TEXT: '📝',
      IMAGE: '🖼️',
      VIDEO: '🎬',
      RECT: '▭',
      CIRCLE: '⚪',
      TRIANGLE: '▲',
      STAR: '⭐',
      HEART: '❤️',
      LINE: '━',
    };
    return iconMap[type] || '📦';
  };

  if (collapsed) {
    return (
      <div className="w-12 bg-gray-50 border-l border-gray-300 flex flex-col items-center py-2">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 hover:bg-gray-200 rounded"
          title="Expand Layers Panel"
        >
          <Layers size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-300 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 bg-gray-50">
        <div className="flex items-center gap-2">
          <Layers size={20} />
          <h3 className="font-semibold">Layers</h3>
          <span className="text-xs text-gray-500">({layers.length})</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 hover:bg-gray-200 rounded"
          title="Collapse Panel"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Layer controls header */}
      <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs text-gray-600 flex items-center gap-2">
        <div className="w-8"></div>
        <div className="flex-1">Element</div>
        <div className="flex gap-1">
          <span title="Visibility">👁</span>
          <span title="Lock">🔒</span>
        </div>
      </div>

      {/* Layers list */}
      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Layers size={48} className="mx-auto mb-2 opacity-20" />
              <p>No elements yet</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {layers.map((layer, index) => {
              const element = elements.find(el => el.id === layer.elementId);
              if (!element) return null;

              const isSelected = selectedElementIds.includes(layer.elementId);

              return (
                <div
                  key={layer.elementId}
                  className={`group px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => onElementSelect(layer.elementId)}
                >
                  {/* Layer info row */}
                  <div className="flex items-center gap-2">
                    {/* Icon */}
                    <div className="text-lg">
                      {getElementIcon(layer.elementType.toString())}
                    </div>

                    {/* Name and type */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {getElementName(element)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {layer.elementType} • Layer {layer.layer}
                      </div>
                    </div>

                    {/* Quick controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisibility(layer.elementId);
                        }}
                        className="p-1 hover:bg-gray-200 rounded opacity-60 group-hover:opacity-100"
                        title={layer.visible ? 'Hide' : 'Show'}
                      >
                        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLock(layer.elementId);
                        }}
                        className="p-1 hover:bg-gray-200 rounded opacity-60 group-hover:opacity-100"
                        title={layer.locked ? 'Unlock' : 'Lock'}
                      >
                        {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Layer ordering controls (shown on hover or selection) */}
                  {(isSelected || false) && (
                    <div className="mt-2 flex items-center gap-1 border-t border-gray-200 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBringToFront(layer.elementId);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                        title="Bring to Front"
                        disabled={index === 0}
                      >
                        <ChevronsUp size={12} />
                        Front
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBringForward(layer.elementId);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                        title="Bring Forward"
                        disabled={index === 0}
                      >
                        <ArrowUp size={12} />
                        Forward
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendBackward(layer.elementId);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                        title="Send Backward"
                        disabled={index === layers.length - 1}
                      >
                        <ArrowDown size={12} />
                        Backward
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendToBack(layer.elementId);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                        title="Send to Back"
                        disabled={index === layers.length - 1}
                      >
                        <ChevronsDown size={12} />
                        Back
                      </button>

                      <div className="flex-1" />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onElementDuplicate(layer.elementId);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Duplicate"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onElementDelete(layer.elementId);
                        }}
                        className="p-1 hover:bg-red-100 text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions footer */}
      {selectedElementIds.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-300">
          <div className="text-xs text-gray-600 mb-2">
            {selectedElementIds.length} selected
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleBringToFront(selectedElementIds[0])}
              className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm flex items-center justify-center gap-1"
            >
              <ChevronsUp size={14} />
              To Front
            </button>
            <button
              onClick={() => handleSendToBack(selectedElementIds[0])}
              className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm flex items-center justify-center gap-1"
            >
              <ChevronsDown size={14} />
              To Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerPanel;
