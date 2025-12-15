import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { getDesignById } from '../services/designService';

interface CanvasElement {
  id: string;
  type: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity: number;
  rotation: number;
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  textStyle?: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    fontFamily: string;
    letterSpacing: number;
    lineHeight: number;
  };
  borderRadius?: number;
}

interface DesignData {
  id: string;
  metadata: {
    title: string;
    description: string;
    canvasWidth: number;
    canvasHeight: number;
    canvasColor: string;
  };
  designJSON: {
    elements: CanvasElement[];
  };
}

const Preview: React.FC = () => {
  const { designId } = useParams<{ designId: string }>();
  const navigate = useNavigate();
  const [design, setDesign] = useState<DesignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const loadDesign = async () => {
      try {
        if (!designId) {
          setError('No design ID provided');
          return;
        }
        console.log('Loading design for preview:', designId);
        const loadedDesign = await getDesignById(designId);
        if (loadedDesign) {
          setDesign(loadedDesign as DesignData);
          console.log('Design loaded:', loadedDesign);
        } else {
          setError('Design not found');
        }
      } catch (err) {
        console.error('Failed to load design:', err);
        setError(`Failed to load design: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadDesign();
  }, [designId]);

  const renderElement = (element: CanvasElement) => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      opacity: element.opacity ?? 1,
      transform: `rotate(${element.rotation}deg)`,
      zIndex: element.zIndex ?? 1,
      visibility: element.visible === false ? 'hidden' : 'visible',
    };

    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              color: element.color || '#000000',
              fontSize: element.fontSize || 16,
              fontWeight: element.textStyle?.bold ? 'bold' : 'normal',
              fontStyle: element.textStyle?.italic ? 'italic' : 'normal',
              textDecoration: element.textStyle?.underline ? 'underline' : 'none',
              textAlign: element.textStyle?.textAlign || 'left',
              fontFamily: element.textStyle?.fontFamily || 'Arial',
              letterSpacing: `${element.textStyle?.letterSpacing || 0}px`,
              lineHeight: `${element.textStyle?.lineHeight || 1.2}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: element.textStyle?.textAlign || 'left',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {element.content}
          </div>
        );

      case 'rect':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.fillColor || element.backgroundColor || '#ffffff',
              borderRadius: element.borderRadius || 0,
              border: element.strokeColor ? `${element.strokeWidth || 1}px solid ${element.strokeColor}` : 'none',
            }}
          />
        );

      case 'circle':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.fillColor || element.backgroundColor || '#ffffff',
              borderRadius: '50%',
              border: element.strokeColor ? `${element.strokeWidth || 1}px solid ${element.strokeColor}` : 'none',
            }}
          />
        );

      case 'image':
        return (
          <img
            key={element.id}
            src={element.content}
            alt="Design element"
            style={{
              ...baseStyle,
              objectFit: 'cover',
              borderRadius: element.borderRadius || 0,
            }}
          />
        );

      case 'triangle':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              width: 0,
              height: 0,
              borderLeft: `${element.width / 2}px solid transparent`,
              borderRight: `${element.width / 2}px solid transparent`,
              borderBottom: `${element.height}px solid ${element.fillColor || '#ffffff'}`,
            }}
          />
        );

      default:
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.fillColor || '#cccccc',
            }}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <h3 className="text-2xl font-semibold text-white mb-2">Loading Preview</h3>
          <p className="text-gray-400">Loading your design...</p>
        </div>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-white mb-2">Error</h3>
          <p className="text-gray-400 mb-6">{error || 'Design not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{design.metadata.title}</h1>
            <p className="text-gray-400 text-sm">{design.metadata.description}</p>
          </div>
        </div>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>

      {/* Canvas Display */}
      <div className={`flex-1 flex items-center justify-center ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'p-8 bg-gray-950'}`}>
        <div
          style={{
            width: `${design.metadata.canvasWidth}px`,
            height: `${design.metadata.canvasHeight}px`,
            backgroundColor: design.metadata.canvasColor,
            position: 'relative',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Render all elements */}
          {design.designJSON.elements.map(element => renderElement(element))}
        </div>
      </div>

      {/* Footer Info */}
      {!isFullscreen && (
        <div className="bg-gray-900 border-t border-gray-700 px-6 py-4 text-gray-400 text-sm">
          <p>Canvas Size: {design.metadata.canvasWidth} x {design.metadata.canvasHeight}px</p>
        </div>
      )}
    </div>
  );
};

export default Preview;
