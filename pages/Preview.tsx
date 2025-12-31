import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, RefreshCw } from 'lucide-react';
import { getDesignLocalById } from '../services/localDesignStore';
import { getDesignById, convertBackendToLocal } from '../services/designService';

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
  animation?: string;
  widgetSettings?: any;
}

// Animation helper function
const getAnimationClass = (animation?: string) => {
  if (!animation) return '';
  
  const animationMap: Record<string, string> = {
    'Shake Zoom': 'animate-shake-zoom', 'Whip Slide': 'animate-whip-slide', 'Old TV': 'animate-old-tv', 'Chroma Wave': 'animate-chroma-wave',
    'Brush': 'animate-brush', 'Ink': 'animate-ink', 'Digital': 'animate-digital', 'Spray Paint': 'animate-spray-paint', 'Sketch': 'animate-sketch', 'Gradient': 'animate-gradient',
    'Rise': 'animate-rise', 'Pan': 'animate-pan', 'Fade': 'animate-fade', 'Pop': 'animate-pop', 'Wipe': 'animate-wipe', 'Blur': 'animate-blur', 'Succession': 'animate-succession', 'Breathe': 'animate-breathe', 'Baseline': 'animate-baseline', 'Drift': 'animate-drift', 'Tectonic': 'animate-tectonic', 'Tumble': 'animate-tumble', 'Neon': 'animate-neon', 'Scrapbook': 'animate-scrapbook', 'Stomp': 'animate-stomp',
    'Rotate': 'animate-rotate-effect', 'Flicker': 'animate-flicker', 'Pulse': 'animate-pulse-effect', 'Wiggle': 'animate-wiggle-effect',
  };
  
  return animationMap[animation] || '';
}

// YouTube URL to embed URL converter
const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Extract video ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  return null;
};

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
    timeline?: {
      tracks?: Array<{
        items: Array<{
          elementId: string;
          startTime: number;
          duration: number;
          properties?: any;
        }>;
      }>;
      totalDuration?: number;
    };
  };
}

// Location state type for live preview from editor
interface PreviewLocationState {
  livePreview?: boolean;
  designData?: DesignData;
}

const Preview: React.FC = () => {
  const { designId } = useParams<{ designId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as PreviewLocationState;
  
  const [design, setDesign] = useState<DesignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasTimeline, setHasTimeline] = useState(false);
  const [isLivePreview, setIsLivePreview] = useState(false);
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const animationRef = useRef<number>();

  // Listen for live updates from editor
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'live-preview-update' && isLivePreview && designId) {
        console.log('🔴 [PREVIEW] Received live update from editor');
        const updatedDesign = getDesignLocalById(designId);
        if (updatedDesign) {
          setDesign(updatedDesign as DesignData);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isLivePreview, designId]);

  useEffect(() => {
    const loadDesign = async () => {
      try {
        // Check if this is a live preview from editor
        if (locationState?.livePreview && locationState?.designData) {
          console.log('🔴 [PREVIEW] Live preview mode - using editor data');
          setDesign(locationState.designData);
          setIsLivePreview(true);
          setIsOnlineMode(false);
          
          const timelineExists = !!locationState.designData.designJSON?.timeline?.tracks?.length;
          setHasTimeline(timelineExists);
          if (timelineExists) {
            setIsPlaying(true);
          }
          setLoading(false);
          return;
        }

        if (!designId) {
          setError('No design ID provided');
          setLoading(false);
          return;
        }

        console.log('📋 [PREVIEW] Loading saved design:', designId);
        
        // Try backend first
        const backendResponse = await getDesignById(designId);
        let loadedDesign: DesignData | null = null;
        
        if (backendResponse.success && backendResponse.data) {
          console.log('✅ [PREVIEW] Loaded from backend');
          loadedDesign = convertBackendToLocal(backendResponse.data) as DesignData;
          setIsOnlineMode(true);
        } else {
          // Fallback to localStorage
          console.log('⚠️ [PREVIEW] Backend unavailable, using localStorage...');
          const localDesign = await getDesignLocalById(designId);
          if (localDesign) {
            loadedDesign = localDesign as DesignData;
            setIsOnlineMode(false);
          }
        }

        if (loadedDesign) {
          setDesign(loadedDesign);
          console.log('✅ [PREVIEW] Design loaded:', loadedDesign.metadata.title);
          
          // Check if design has timeline data
          const timelineExists = !!loadedDesign.designJSON?.timeline?.tracks?.length;
          setHasTimeline(timelineExists);
          if (timelineExists) {
            setIsPlaying(true); // Auto-play timeline
          }
        } else {
          setError('Design not found');
        }
      } catch (err) {
        console.error('❌ [PREVIEW] Failed to load design:', err);
        setError(`Failed to load design: ${err instanceof Error ? err.message : 'Unknown error'}`);
        
        // Final fallback to localStorage
        if (designId) {
          try {
            const localDesign = await getDesignLocalById(designId);
            if (localDesign) {
              setDesign(localDesign as DesignData);
              setIsOnlineMode(false);
              const timelineExists = !!(localDesign as DesignData).designJSON?.timeline?.tracks?.length;
              setHasTimeline(timelineExists);
              if (timelineExists) setIsPlaying(true);
              setError(null);
            }
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    };

    loadDesign();
  }, [designId, locationState]);

  // Timeline playback effect - 60 FPS video-like rendering
  useEffect(() => {
    if (!isPlaying || !design || !hasTimeline) return;

    const timeline = design.designJSON.timeline;
    const totalDuration = timeline?.totalDuration || 5000; // Default 5 seconds
    const fps = 60;
    const frameInterval = 1000 / fps; // ~16.67ms per frame

    let lastFrameTime = Date.now();
    let accumulatedTime = currentTime;

    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastFrameTime;

      // Update only if enough time has passed for next frame
      if (deltaTime >= frameInterval) {
        accumulatedTime += deltaTime;
        
        // Loop back to start when reaching end
        if (accumulatedTime >= totalDuration) {
          accumulatedTime = 0;
        }

        setCurrentTime(accumulatedTime);
        lastFrameTime = now;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, design, hasTimeline]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const restartPlayback = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const getElementAtTime = (element: CanvasElement): CanvasElement | null => {
    if (!hasTimeline || !design?.designJSON.timeline) {
      return element; // Return static element if no timeline
    }

    const timeline = design.designJSON.timeline;
    let timelineItem: any = null;

    // Find timeline item for this element
    for (const track of timeline.tracks || []) {
      for (const item of track.items) {
        if (item.elementId === element.id) {
          const itemStart = item.startTime;
          const itemEnd = itemStart + item.duration;

          // Check if current time is within this item's range
          if (currentTime >= itemStart && currentTime < itemEnd) {
            timelineItem = item;
            break;
          }
        }
      }
      if (timelineItem) break;
    }

    if (!timelineItem) {
      // Element not visible at current time
      return null;
    }

    // Calculate interpolated properties based on time within item
    const localTime = currentTime - timelineItem.startTime;
    const progress = Math.min(1, localTime / timelineItem.duration);

    // Start with initial state from timeline
    const initialState = timelineItem.initialState || {};
    const targetProps = timelineItem.properties || {};

    // Interpolate numeric properties
    const interpolate = (start: number, end: number, progress: number) => {
      return start + (end - start) * progress;
    };

    // Build interpolated element state
    const interpolatedElement: CanvasElement = {
      ...element,
      // Use initial state as base
      x: initialState.x !== undefined ? initialState.x : element.x,
      y: initialState.y !== undefined ? initialState.y : element.y,
      width: initialState.width !== undefined ? initialState.width : element.width,
      height: initialState.height !== undefined ? initialState.height : element.height,
      rotation: initialState.rotation !== undefined ? initialState.rotation : element.rotation,
      opacity: initialState.opacity !== undefined ? initialState.opacity : element.opacity,
      fontSize: initialState.fontSize !== undefined ? initialState.fontSize : element.fontSize,
    };

    // Apply interpolation if properties are different
    if (targetProps.x !== undefined && initialState.x !== undefined) {
      interpolatedElement.x = interpolate(initialState.x, targetProps.x, progress);
    } else if (targetProps.x !== undefined) {
      interpolatedElement.x = targetProps.x;
    }

    if (targetProps.y !== undefined && initialState.y !== undefined) {
      interpolatedElement.y = interpolate(initialState.y, targetProps.y, progress);
    } else if (targetProps.y !== undefined) {
      interpolatedElement.y = targetProps.y;
    }

    if (targetProps.width !== undefined && initialState.width !== undefined) {
      interpolatedElement.width = interpolate(initialState.width, targetProps.width, progress);
    } else if (targetProps.width !== undefined) {
      interpolatedElement.width = targetProps.width;
    }

    if (targetProps.height !== undefined && initialState.height !== undefined) {
      interpolatedElement.height = interpolate(initialState.height, targetProps.height, progress);
    } else if (targetProps.height !== undefined) {
      interpolatedElement.height = targetProps.height;
    }

    if (targetProps.rotation !== undefined && initialState.rotation !== undefined) {
      interpolatedElement.rotation = interpolate(initialState.rotation, targetProps.rotation, progress);
    } else if (targetProps.rotation !== undefined) {
      interpolatedElement.rotation = targetProps.rotation;
    }

    if (targetProps.opacity !== undefined && initialState.opacity !== undefined) {
      interpolatedElement.opacity = interpolate(initialState.opacity, targetProps.opacity, progress);
    } else if (targetProps.opacity !== undefined) {
      interpolatedElement.opacity = targetProps.opacity;
    }

    if (targetProps.fontSize !== undefined && initialState.fontSize !== undefined) {
      interpolatedElement.fontSize = interpolate(initialState.fontSize, targetProps.fontSize, progress);
    } else if (targetProps.fontSize !== undefined) {
      interpolatedElement.fontSize = targetProps.fontSize;
    }

    // Apply non-interpolated properties
    if (targetProps.color) {
      interpolatedElement.color = targetProps.color;
    } else if (initialState.color) {
      interpolatedElement.color = initialState.color;
    }

    if (targetProps.backgroundColor) {
      interpolatedElement.backgroundColor = targetProps.backgroundColor;
    } else if (initialState.backgroundColor) {
      interpolatedElement.backgroundColor = initialState.backgroundColor;
    }

    if (targetProps.fillColor) {
      interpolatedElement.fillColor = targetProps.fillColor;
    } else if (initialState.fillColor) {
      interpolatedElement.fillColor = initialState.fillColor;
    }

    return interpolatedElement;
  };

  const renderElement = (element: CanvasElement) => {
    const activeElement = getElementAtTime(element);
    if (!activeElement) return null; // Don't render if not in timeline

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${activeElement.x}px`,
      top: `${activeElement.y}px`,
      width: `${activeElement.width}px`,
      height: `${activeElement.height}px`,
      opacity: activeElement.opacity ?? 1,
      transform: `rotate(${activeElement.rotation}deg)`,
      zIndex: activeElement.zIndex ?? 1,
      visibility: activeElement.visible === false ? 'hidden' : 'visible',
      borderRadius: activeElement.borderRadius ? `${activeElement.borderRadius}px` : undefined,
      overflow: 'hidden',
      // Smooth video-like transitions between frames
      transition: hasTimeline ? 'none' : 'none', // No CSS transition, rely on RAF
      willChange: hasTimeline ? 'transform, opacity, width, height' : 'auto', // GPU acceleration
    };

    const animationClass = getAnimationClass(activeElement.animation);

    switch (activeElement.type) {
      case 'text':
        return (
          <div
            key={activeElement.id}
            className={animationClass}
            style={{
              ...baseStyle,
              color: activeElement.color || '#000000',
              backgroundColor: activeElement.backgroundColor,
              fontSize: activeElement.fontSize || 16,
              fontWeight: activeElement.textStyle?.bold ? 'bold' : 'normal',
              fontStyle: activeElement.textStyle?.italic ? 'italic' : 'normal',
              textDecoration: activeElement.textStyle?.underline ? 'underline' : 'none',
              textAlign: activeElement.textStyle?.textAlign || 'left',
              fontFamily: activeElement.textStyle?.fontFamily || 'Arial',
              letterSpacing: `${activeElement.textStyle?.letterSpacing || 0}px`,
              lineHeight: `${activeElement.textStyle?.lineHeight || 1.2}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: activeElement.textStyle?.textAlign || 'left',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {activeElement.content}
          </div>
        );

      case 'html':
        return (
          <iframe
            key={activeElement.id}
            srcDoc={activeElement.content || '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#666;">No HTML content</div>'}
            className={animationClass}
            style={{
              ...baseStyle,
              border: 'none',
            }}
            sandbox="allow-scripts allow-same-origin"
          />
        );

      case 'rect':
        return (
          <div
            key={activeElement.id}
            className={animationClass}
            style={{
              ...baseStyle,
              backgroundColor: activeElement.fillColor || activeElement.backgroundColor || '#ffffff',
              borderRadius: activeElement.borderRadius || 0,
              border: activeElement.strokeColor ? `${activeElement.strokeWidth || 1}px solid ${activeElement.strokeColor}` : 'none',
            }}
          />
        );

      case 'circle':
        return (
          <div
            key={activeElement.id}
            className={animationClass}
            style={{
              ...baseStyle,
              backgroundColor: activeElement.fillColor || activeElement.backgroundColor || '#ffffff',
              borderRadius: '50%',
              border: activeElement.strokeColor ? `${activeElement.strokeWidth || 1}px solid ${activeElement.strokeColor}` : 'none',
            }}
          />
        );

      case 'video':
      case 'web-video':
        return activeElement.content && (activeElement.content.startsWith('http') || activeElement.content.startsWith('blob:')) ? (
          <video 
            key={activeElement.id}
            className={animationClass}
            src={activeElement.content}
            style={{
              ...baseStyle,
              objectFit: 'cover',
            }}
            muted
            loop
            autoPlay
          />
        ) : null;

      case 'gif':
      case 'web-image':
        return activeElement.content && activeElement.content.startsWith('http') ? (
          <img
            key={activeElement.id}
            className={animationClass}
            src={activeElement.content}
            alt="Media"
            style={{
              ...baseStyle,
              objectFit: 'cover',
            }}
          />
        ) : null;

      case 'instagram':
        return activeElement.widgetSettings?.embedCode ? (
          <iframe
            key={activeElement.id}
            srcDoc={activeElement.widgetSettings.embedCode}
            className={animationClass}
            style={{
              ...baseStyle,
              border: 'none',
            }}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : element.content && element.content.startsWith('http') ? (
          <img
            key={element.id}
            className={animationClass}
            src={element.content}
            alt="Instagram"
            style={{
              ...baseStyle,
              objectFit: 'cover',
            }}
          />
        ) : null;

      case 'ustream':
      case 'streaming':
        return element.content && element.content.startsWith('http') ? (
          <iframe
            key={element.id}
            src={element.content}
            className={animationClass}
            style={{
              ...baseStyle,
              border: 'none',
            }}
            allow="autoplay; fullscreen"
          />
        ) : null;

      case 'ticker':
        return (
          <div
            key={element.id}
            className={animationClass}
            style={{
              ...baseStyle,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: element.backgroundColor || '#1e293b',
              color: element.color || '#ffffff',
            }}
          >
            <div className="animate-marquee whitespace-nowrap" style={{ fontSize: element.fontSize }}>
              {element.content}
            </div>
          </div>
        );

      case 'embed':
        return element.widgetSettings?.embedCode ? (
          <iframe
            key={element.id}
            srcDoc={element.widgetSettings.embedCode}
            className={animationClass}
            style={{
              ...baseStyle,
              border: 'none',
            }}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : null;

      case 'youtube':
        const youtubeEmbedUrl = getYouTubeEmbedUrl(element.content);
        return youtubeEmbedUrl ? (
          <iframe
            key={element.id}
            className={animationClass}
            src={youtubeEmbedUrl}
            style={{
              ...baseStyle,
              border: 'none',
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div
            key={element.id}
            className={animationClass}
            style={{
              ...baseStyle,
              backgroundColor: '#000',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            YouTube
          </div>
        );

      case 'image':
        return (
          <img
            key={element.id}
            className={animationClass}
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
            <p className="text-sm text-gray-300">
              {design.metadata.description}
              {isLivePreview && (
                <span className="ml-2 text-red-400">● LIVE PREVIEW</span>
              )}
              {!isLivePreview && isOnlineMode && (
                <span className="ml-2 text-green-400">● Backend</span>
              )}
              {!isLivePreview && !isOnlineMode && (
                <span className="ml-2 text-yellow-400">● Local</span>
              )}
            </p>
          </div>

          <div className="text-white text-sm flex items-center gap-3">
            {!isLivePreview && (
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Reload preview"
              >
                <RefreshCw size={16} />
                Reload
              </button>
            )}
            <div>
              {design.metadata.canvasWidth} × {design.metadata.canvasHeight}px
              {hasTimeline && (
                <span className="ml-2 text-green-400">● Timeline</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Playback Controls (only show if timeline exists) */}
      {hasTimeline && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/90 rounded-full px-8 py-4 flex items-center gap-6 z-10 backdrop-blur-sm">
          <button
            onClick={togglePlayback}
            className="text-white hover:text-green-400 transition-colors p-2 hover:bg-white/10 rounded-full"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" />}
          </button>
          <button
            onClick={restartPlayback}
            className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-full"
            title="Restart"
          >
            <RotateCcw size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="text-white text-sm font-mono bg-white/10 px-3 py-1 rounded">
              {(currentTime / 1000).toFixed(2)}s
            </div>
            <div className="text-gray-400 text-xs">/</div>
            <div className="text-gray-300 text-sm font-mono">
              {((design.designJSON.timeline?.totalDuration || 5000) / 1000).toFixed(2)}s
            </div>
          </div>
          <div className="text-green-400 text-xs font-semibold bg-green-500/20 px-3 py-1 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            VIDEO MODE
          </div>
        </div>
      )}

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
