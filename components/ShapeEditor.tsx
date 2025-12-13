import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ShapeEditorProps {
  shapeType: string;
  color: string;
  backgroundColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius: number;
  onShapeChange: (type: string) => void;
  onColorChange: (color: string) => void;
  onBackgroundChange: (color: string) => void;
  onStrokeColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onBorderRadiusChange: (radius: number) => void;
}

const AVAILABLE_SHAPES = [
  'rectangle',
  'rounded-rectangle',
  'circle',
  'oval',
  'triangle',
  'star',
  'heart',
  'diamond',
  'pentagon',
  'hexagon',
  'octagon',
  'trapezoid',
  'line',
  'cross',
  'crescent',
];

export const ShapeEditor: React.FC<ShapeEditorProps> = ({
  shapeType,
  color,
  backgroundColor,
  strokeColor,
  strokeWidth,
  borderRadius,
  onShapeChange,
  onColorChange,
  onBackgroundChange,
  onStrokeColorChange,
  onStrokeWidthChange,
  onBorderRadiusChange,
}) => {
  return (
    <div className="space-y-4 p-3 bg-white rounded-lg border border-gray-200">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
          Shape Type
        </label>
        <select
          value={shapeType}
          onChange={(e) => onShapeChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary focus:outline-none"
        >
          {AVAILABLE_SHAPES.map((shape) => (
            <option key={shape} value={shape}>
              {shape.charAt(0).toUpperCase() + shape.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
          Fill Color
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => onBackgroundChange(e.target.value)}
            className="h-10 w-10 rounded cursor-pointer border-2 border-gray-300"
          />
          <span className="text-xs text-gray-600 flex-1">{backgroundColor}</span>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
          Stroke Color
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => onStrokeColorChange(e.target.value)}
            className="h-10 w-10 rounded cursor-pointer border-2 border-gray-300"
          />
          <span className="text-xs text-gray-600 flex-1">{strokeColor}</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">
            Stroke Width
          </label>
          <span className="text-xs text-gray-500">{strokeWidth}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={strokeWidth}
          onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
          className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      {['rectangle', 'rounded-rectangle', 'circle', 'oval'].includes(shapeType) && (
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Border Radius
            </label>
            <span className="text-xs text-gray-500">{borderRadius}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={borderRadius}
            onChange={(e) => onBorderRadiusChange(Number(e.target.value))}
            className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      )}
    </div>
  );
};

export default ShapeEditor;
