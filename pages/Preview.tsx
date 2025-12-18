import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
          <svg
            key={element.id}
            viewBox="0 0 100 100"
            style={{
              ...baseStyle,
              overflow: 'visible',
            }}
          >
            <polygon
              points="50,10 90,85 10,85"
              fill={element.fillColor || '#ffffff'}
              stroke={element.strokeColor}
              strokeWidth={element.strokeWidth || 0}
            />
          </svg>
        );

      case 'star':
        return (
          <svg
            key={element.id}
            viewBox="0 0 100 100"
            style={{
              ...baseStyle,
              overflow: 'visible',
            }}
          >
            <polygon
              points="50,10 61,40 91,40 67,60 78,90 50,70 22,90 33,60 9,40 39,40"
              fill={element.fillColor || '#ffffff'}
              stroke={element.strokeColor}
              strokeWidth={element.strokeWidth || 0}
            />
          </svg>
        );

      case 'heart':
        return (
          <svg
            key={element.id}
            viewBox="0 0 100 100"
            style={{
              ...baseStyle,
              overflow: 'visible',
            }}
          >
            <path
              d="M50,85 C25,70 10,55 10,40 C10,25 20,15 30,15 C40,15 50,25 50,25 C50,25 60,15 70,15 C80,15 90,25 90,40 C90,55 75,70 50,85 Z"
              fill={element.fillColor || '#ffffff'}
              stroke={element.strokeColor}
              strokeWidth={element.strokeWidth || 0}
            />
          </svg>
        );

      case 'pentagon':
        return (
          <svg
            key={element.id}
            viewBox="0 0 100 100"
            style={{
              ...baseStyle,
              overflow: 'visible',
            }}
          >
            <polygon
              points="50,10 90,35 75,85 25,85 10,35"
              fill={element.fillColor || '#ffffff'}
              stroke={element.strokeColor}
              strokeWidth={element.strokeWidth || 0}
            />
          </svg>
        );

      case 'hexagon':
        return (
          <svg
            key={element.id}
            viewBox="0 0 100 100"
            style={{
              ...baseStyle,
              overflow: 'visible',
            }}
          >
            <polygon
              points="50,10 85,30 85,70 50,90 15,70 15,30"
              fill={element.fillColor || '#ffffff'}
              stroke={element.strokeColor}
              strokeWidth={element.strokeWidth || 0}
            />
          </svg>
        );

      case 'octagon':
        return (
          <svg
            key={element.id}
            viewBox="0 0 100 100"
            style={{
              ...baseStyle,
              overflow: 'visible',
            }}
          >
            <polygon
              points="30,10 70,10 90,30 90,70 70,90 30,90 10,70 10,30"
              fill={element.fillColor || '#ffffff'}
              stroke={element.strokeColor}
              strokeWidth={element.strokeWidth || 0}
            />
          </svg>
        );

      case 'diamond':
        return (
          <svg
            key={element.id}
            viewBox="0 0 100 100"
            style={{
              ...baseStyle,
              overflow: 'visible',
            }}
          >
            <polygon
              points="50,10 90,50 50,90 10,50"
              fill={element.fillColor || '#ffffff'}
              stroke={element.strokeColor}
              strokeWidth={element.strokeWidth || 0}
            />
          </svg>
        );

      case 'trapezoid':
        return (
          <svg
            key={element.id}
            viewBox="0 0 100 100"
            style={{
              ...baseStyle,
              overflow: 'visible',
            }}
          >
            <polygon
              points="25,20 75,20 85,80 15,80"
              fill={element.fillColor || '#ffffff'}
              stroke={element.strokeColor}
              strokeWidth={element.strokeWidth || 0}
            />
          </svg>
        );

      case 'crescent':
        return (
          <svg
            key={element.id}
            viewBox="0 0 100 100"
            style={{
              ...baseStyle,
              overflow: 'visible',
            }}
          >
            <path
              d="M 50 20 A 30 30 0 0 1 50 80 A 24 24 0 0 0 50 26 A 24 24 0 0 0 50 20 Z"
              fill={element.fillColor || '#ffffff'}
              stroke={element.strokeColor}
              strokeWidth={element.strokeWidth || 0}
            />
          </svg>
        );

      case 'cross':
        return (
          <svg
            key={element.id}
            viewBox="0 0 100 100"
            style={{
              ...baseStyle,
              overflow: 'visible',
            }}
          >
            <rect x="40" y="10" width="20" height="80" fill={element.fillColor || '#ffffff'} stroke={element.strokeColor} strokeWidth={element.strokeWidth || 0} />
            <rect x="10" y="40" width="80" height="20" fill={element.fillColor || '#ffffff'} stroke={element.strokeColor} strokeWidth={element.strokeWidth || 0} />
          </svg>
        );

      case 'line':
        return (
          <svg
            key={element.id}
            viewBox="0 0 100 4"
            preserveAspectRatio="none"
            style={{
              ...baseStyle,
              overflow: 'visible',
            }}
          >
            <line x1="0" y1="2" x2="100" y2="2" stroke={element.fillColor || '#000000'} strokeWidth="4" />
          </svg>
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
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top Control Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={20} />
            Exit Preview
          </button>
          
          <div className="text-white text-center">
            <h2 className="text-xl font-bold">{design.metadata.title}</h2>
            <p className="text-sm text-gray-300">{design.metadata.description}</p>
          </div>

          <div className="text-white text-sm">
            {design.metadata.canvasWidth} × {design.metadata.canvasHeight}px
          </div>
        </div>
      </div>

      {/* Canvas Display */}
      <div className="flex-1 flex items-center justify-center">
        <div
          style={{
            width: `${design.metadata.canvasWidth}px`,
            height: `${design.metadata.canvasHeight}px`,
            backgroundColor: design.metadata.canvasColor,
            position: 'relative',
            maxWidth: '100vw',
            maxHeight: '100vh',
            objectFit: 'contain',
          }}
        >
          {/* Render all elements */}
          {design.designJSON.elements.map(element => renderElement(element))}
        </div>
      </div>
    </div>
  );
};

export default Preview;
