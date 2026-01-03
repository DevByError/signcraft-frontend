import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, RotateCcw, RefreshCw,
  CloudSun, Clock, ImageIcon, FileText, MousePointer2
} from 'lucide-react';
import { getDesignLocalById } from '../services/localDesignStore';
import { getDesignById, convertBackendToLocal } from '../services/designService';

// ==========================================
// 1. INTERFACES
// ==========================================
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
  // Internal sync data for preview
  _syncData?: {
    startTime: number;
    duration: number;
    inPoint: number;
  };
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
    timeline?: {
      tracks?: Array<{
        items: Array<{
          elementId: string;
          startTime: number;
          duration: number;
          inPoint?: number;
          initialState?: Partial<CanvasElement>;
          properties?: Partial<CanvasElement>;
        }>;
      }>;
      totalDuration?: number;
    };
  };
}

interface PreviewLocationState {
  livePreview?: boolean;
  designData?: DesignData;
}

// ==========================================
// 2. HELPER COMPONENTS & FUNCTIONS
// ==========================================

// --- Synced Video Player (Timeline Aware) ---
const SyncedPreviewVideo = ({
  src,
  currentTime,
  isPlaying,
  startTime,
  duration,
  inPoint = 0,
  style,
  className
}: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Calculate relative time
    const relativeTimeMs = currentTime - startTime + inPoint;
    const relativeTimeSec = relativeTimeMs / 1000;
    const isInsideClip = relativeTimeMs >= 0 && relativeTimeMs < duration;

    if (isInsideClip) {
      // Seek if drifted > 0.15s
      if (Math.abs(video.currentTime - relativeTimeSec) > 0.15) {
        video.currentTime = relativeTimeSec;
      }
      if (isPlaying) {
        if (video.paused) video.play().catch(() => { });
      } else {
        video.pause();
      }
      video.style.opacity = '1';
    } else {
      video.pause();
      if (relativeTimeMs < 0) video.currentTime = inPoint / 1000;
      // Optional: Hide video if not active
      // video.style.opacity = '0'; 
    }
  }, [currentTime, isPlaying, startTime, duration, inPoint, src]);

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      style={style}
      muted={false} // Enable Audio
      playsInline
    />
  );
};

// --- CSS Animations Map ---
const getAnimationClass = (animation?: string) => {
  if (!animation) return '';
  const animationMap: Record<string, string> = {
    // Featured
    'Shake Zoom': 'animate-shake-zoom', 'Whip Slide': 'animate-whip-slide', 'Old TV': 'animate-old-tv', 'Chroma Wave': 'animate-chroma-wave',
    // Reveal
    'Brush': 'animate-brush', 'Ink': 'animate-ink', 'Digital': 'animate-digital', 'Spray Paint': 'animate-spray-paint', 'Sketch': 'animate-sketch', 'Gradient': 'animate-gradient',
    // General
    'Rise': 'animate-rise', 'Pan': 'animate-pan', 'Fade': 'animate-fade', 'Pop': 'animate-pop', 'Wipe': 'animate-wipe', 'Blur': 'animate-blur',
    'Succession': 'animate-succession', 'Breathe': 'animate-breathe', 'Baseline': 'animate-baseline', 'Drift': 'animate-drift', 'Tectonic': 'animate-tectonic',
    'Tumble': 'animate-tumble', 'Neon': 'animate-neon', 'Scrapbook': 'animate-scrapbook', 'Stomp': 'animate-stomp',
    // Effects
    'Rotate': 'animate-rotate-effect', 'Flicker': 'animate-flicker', 'Pulse': 'animate-pulse-effect', 'Wiggle': 'animate-wiggle-effect',
  };
  return animationMap[animation] || '';
};

const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/, /youtube\.com\/embed\/([^&\s]+)/, /^([a-zA-Z0-9_-]{11})$/];
  const match = patterns.reduce<RegExpMatchArray | null>((acc, pattern) => acc || url.match(pattern), null);
  return match && match[1] ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&controls=0&loop=1` : null;
};

const safeMapToDesignData = (source: any): DesignData => {
  const metadata = source.metadata || {};
  const designJSON = source.designJSON || {};
  return {
    id: source.id || 'unknown',
    metadata: {
      title: metadata.title || 'Untitled',
      description: metadata.description || '',
      canvasWidth: Number(metadata.canvasWidth) || 1920,
      canvasHeight: Number(metadata.canvasHeight) || 1080,
      canvasColor: metadata.canvasColor || '#ffffff',
    },
    designJSON: {
      elements: Array.isArray(designJSON.elements) ? designJSON.elements : [],
      timeline: designJSON.timeline
    }
  };
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
const Preview: React.FC = () => {
  const { designId } = useParams<{ designId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as PreviewLocationState;

  // State
  const [design, setDesign] = useState<DesignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timeline State
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackKey, setPlaybackKey] = useState(0); // For replay
  const [hasTimeline, setHasTimeline] = useState(false);

  // View State
  const [scale, setScale] = useState(1);
  const [isLivePreview, setIsLivePreview] = useState(false);

  const animationRef = useRef<number | null>(null);

  // --- Effect 1: Load Design ---
  useEffect(() => {
    const loadDesign = async () => {
      try {
        setLoading(true);

        // 1. Live Preview from Editor
        if (locationState?.livePreview && locationState?.designData) {
          const safeDesign = safeMapToDesignData(locationState.designData);
          setDesign(safeDesign);
          setIsLivePreview(true);
          const timelineExists = !!safeDesign.designJSON?.timeline?.tracks?.length;
          setHasTimeline(timelineExists);
          if (timelineExists) setIsPlaying(true);
          setLoading(false);
          return;
        }

        if (!designId) { setError('No ID'); setLoading(false); return; }

        // 2. Fetch from Backend
        const backendResponse = await getDesignById(designId).catch(() => null);
        if (backendResponse?.success) {
          const converted = convertBackendToLocal(backendResponse.data);
          setDesign(safeMapToDesignData(converted));
          setHasTimeline(!!converted.designJSON?.timeline?.tracks?.length);
          setIsPlaying(true);
          setLoading(false);
          return;
        }

        // 3. Fetch from Local Storage
        const localDesign = await getDesignLocalById(designId);
        if (localDesign) {
          setDesign(safeMapToDesignData(localDesign));
          setHasTimeline(!!localDesign.designJSON?.timeline?.tracks?.length);
          setIsPlaying(true);
          setLoading(false);
          return;
        }

        throw new Error('Design not found');
      } catch (err) {
        console.error(err);
        setError('Failed to load design');
        setLoading(false);
      }
    };
    loadDesign();
  }, [designId, locationState]);

  // --- Effect 2: Auto-Scale Canvas (Responsive) ---
  useEffect(() => {
    if (!design) return;

    const handleResize = () => {
      // Calculate available space (Window - UI Bars)
      const paddingX = 40; // 20px padding left/right
      const paddingY = 160; // Top bar + Bottom controls + padding

      const availableWidth = window.innerWidth - paddingX;
      const availableHeight = window.innerHeight - paddingY;

      const { canvasWidth, canvasHeight } = design.metadata;

      // Calculate scale to fit
      const scaleX = availableWidth / canvasWidth;
      const scaleY = availableHeight / canvasHeight;

      // Use the smaller scale to ensure it fits entirely
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial calc

    return () => window.removeEventListener('resize', handleResize);
  }, [design]);

  // --- Effect 3: Animation Loop ---
  useEffect(() => {
    if (!isPlaying || !design || !hasTimeline) return;

    const totalDuration = design.designJSON.timeline?.totalDuration || 5000;
    const fps = 60;
    const interval = 1000 / fps;
    let lastTime = Date.now();
    let accTime = currentTime;

    const animate = () => {
      const now = Date.now();
      const delta = now - lastTime;

      if (delta >= interval) {
        accTime += delta;
        if (accTime >= totalDuration) {
          // Loop or Stop? Let's Loop for preview
          accTime = 0;
        }
        setCurrentTime(accTime);
        lastTime = now;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, design, hasTimeline, playbackKey]);

  // --- Controls ---
  const togglePlayback = () => setIsPlaying(!isPlaying);
  const restartPlayback = () => {
    setCurrentTime(0);
    setPlaybackKey(k => k + 1); // Force restart loop
    setIsPlaying(true);
  };

  // --- Interpolation Logic ---
  const getElementAtTime = (element: CanvasElement): CanvasElement | null => {
    if (!hasTimeline || !design?.designJSON.timeline) return element;

    // Find timeline item
    const timeline = design.designJSON.timeline;
    let timelineItem: any = null;

    for (const track of timeline.tracks || []) {
      for (const item of track.items) {
        if (item.elementId === element.id) {
          if (currentTime >= item.startTime && currentTime < item.startTime + item.duration) {
            timelineItem = item;
            break;
          }
        }
      }
      if (timelineItem) break;
    }

    // Hide if not active in timeline
    if (!timelineItem) return null;

    // Interpolate Properties
    const localTime = currentTime - timelineItem.startTime;
    const progress = Math.min(1, Math.max(0, localTime / timelineItem.duration));
    const startState = timelineItem.initialState || {};
    const endState = timelineItem.properties || {};
    const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

    const newEl = { ...element };

    // Attach sync data for Video Renderer
    newEl._syncData = {
      startTime: timelineItem.startTime,
      duration: timelineItem.duration,
      inPoint: timelineItem.inPoint || 0
    };

    // Interpolate numeric props
    ['x', 'y', 'width', 'height', 'rotation', 'opacity', 'fontSize', 'borderRadius'].forEach(prop => {
      const startVal = startState[prop] ?? element[prop as keyof CanvasElement] ?? 0;
      const endVal = endState[prop] ?? element[prop as keyof CanvasElement] ?? startVal;
      if (typeof startVal === 'number' && typeof endVal === 'number') {
        (newEl as any)[prop] = lerp(startVal, endVal, progress);
      }
    });

    // Swap Colors (Step function)
    if (endState.color) newEl.color = endState.color;
    if (endState.backgroundColor) newEl.backgroundColor = endState.backgroundColor;
    if (endState.fillColor) newEl.fillColor = endState.fillColor;

    return newEl;
  };

  // --- RENDERER (Supports All Types) ---
  const renderElement = (element: CanvasElement) => {
    const activeElement = getElementAtTime(element);
    if (!activeElement) return null;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${activeElement.x}px`,
      top: `${activeElement.y}px`,
      width: `${activeElement.width}px`,
      height: `${activeElement.height}px`,
      opacity: activeElement.opacity,
      transform: `rotate(${activeElement.rotation}deg)`,
      zIndex: activeElement.zIndex,
      borderRadius: activeElement.borderRadius ? `${activeElement.borderRadius}px` : undefined,
      overflow: 'hidden',
      // Optimize performance during playback
      willChange: hasTimeline ? 'transform, opacity' : 'auto',
    };

    const animClass = getAnimationClass(activeElement.animation);

    // --- Switch Case for ALL Element Types ---
    switch (activeElement.type) {
      // 1. Text & Basic
      case 'text':
      case 'label':
        return (
          <div key={activeElement.id} className={animClass} style={{
            ...style,
            color: activeElement.color,
            backgroundColor: activeElement.backgroundColor,
            fontSize: activeElement.fontSize,
            fontWeight: activeElement.textStyle?.bold ? 'bold' : 'normal',
            fontStyle: activeElement.textStyle?.italic ? 'italic' : 'normal',
            textDecoration: activeElement.textStyle?.underline ? 'underline' : 'none',
            fontFamily: activeElement.textStyle?.fontFamily || 'Arial',
            textAlign: activeElement.textStyle?.textAlign || 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word'
          }}>
            {activeElement.content}
          </div>
        );

      // 2. Images
      case 'image':
      case 'gif':
      case 'web_image':
        return (
          <img key={activeElement.id} src={activeElement.content} className={animClass} style={{ ...style, objectFit: activeElement.widgetSettings?.fitMode || 'cover' }} alt="" />
        );

      // 3. Videos (Timeline Synced)
      case 'video':
      case 'web_video':
        if (activeElement._syncData) {
          return (
            <SyncedPreviewVideo
              key={activeElement.id}
              src={activeElement.content}
              currentTime={currentTime}
              isPlaying={isPlaying}
              startTime={activeElement._syncData.startTime}
              duration={activeElement._syncData.duration}
              inPoint={activeElement._syncData.inPoint}
              className={animClass}
              style={{ ...style, objectFit: 'cover' }}
            />
          );
        }
        return <video key={activeElement.id} src={activeElement.content} className={animClass} style={{ ...style, objectFit: 'cover' }} muted loop autoPlay playsInline />;

      case 'youtube':
        const ytUrl = getYouTubeEmbedUrl(activeElement.content);
        return ytUrl ? (
          <iframe key={activeElement.id} src={ytUrl} className={animClass} style={{ ...style, border: 'none' }} allow="autoplay; encrypted-media" />
        ) : <div style={{ ...style, background: 'black' }} />;

      // 4. Shapes (SVG)
      case 'rect': return <div key={activeElement.id} className={animClass} style={{ ...style, backgroundColor: activeElement.fillColor, border: `${activeElement.strokeWidth}px solid ${activeElement.strokeColor}` }} />;
      case 'circle': return <div key={activeElement.id} className={animClass} style={{ ...style, backgroundColor: activeElement.fillColor, borderRadius: '50%', border: `${activeElement.strokeWidth}px solid ${activeElement.strokeColor}` }} />;
      case 'line': return <div key={activeElement.id} style={{ ...style, backgroundColor: activeElement.fillColor, height: '4px' }} className={animClass} />;

      // Extended Shapes
      case 'triangle': return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="50,10 90,85 10,85" fill={activeElement.fillColor} /></svg>;
      case 'star': return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="50,10 61,40 91,40 67,60 78,90 50,70 22,90 33,60 9,40 39,40" fill={activeElement.fillColor} /></svg>;
      case 'heart': return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><path d="M50,85 C25,70 10,55 10,40 C10,25 20,15 30,15 C40,15 50,25 50,25 C50,25 60,15 70,15 C80,15 90,25 90,40 C90,55 75,70 50,85 Z" fill={activeElement.fillColor} /></svg>;
      // (Add other shapes like pentagon/hexagon here if needed using similar SVG pattern)

      // 5. Widgets
      case 'ticker':
        return (
          <div key={activeElement.id} className={animClass} style={{ ...style, backgroundColor: activeElement.backgroundColor || '#1e293b', color: activeElement.color || '#fff', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <div className="animate-marquee px-4" style={{ fontSize: activeElement.fontSize }}>{activeElement.content}</div>
          </div>
        );

      case 'weather':
      case 'weather_2':
        return (
          <div key={activeElement.id} style={{ ...style, background: 'linear-gradient(to bottom right, #38bdf8, #3b82f6)', color: 'white', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <CloudSun size={48} className="mb-2" />
            <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{activeElement.widgetSettings?.temperature || '72'}°{activeElement.widgetSettings?.temperatureUnit || 'F'}</div>
            <div style={{ fontSize: '1.2em' }}>{activeElement.widgetSettings?.condition || 'Sunny'}</div>
            <div style={{ opacity: 0.8 }}>{activeElement.widgetSettings?.location || 'New York, NY'}</div>
          </div>
        );

      case 'clock':
        return (
          <div key={activeElement.id} style={{ ...style, background: activeElement.backgroundColor || '#1e293b', color: activeElement.color || 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
            <div style={{ fontSize: activeElement.fontSize, fontFamily: 'monospace', fontWeight: 'bold' }}>12:45 PM</div>
          </div>
        );

      // Add other advanced widgets (RSS, Table, etc) as standard divs for now
      default:
        return <div key={activeElement.id} style={{ ...style, backgroundColor: activeElement.fillColor || activeElement.backgroundColor || '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeElement.content}</div>;
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Preview...</div>;
  if (error || !design) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-center"><div><h3>Error</h3><p>{error}</p><button onClick={() => navigate(-1)}>Back</button></div></div>;

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Top Bar (Overlay) */}
      <div className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-center text-white pointer-events-none bg-gradient-to-b from-black/80 to-transparent">
        <div className="pointer-events-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 hover:text-gray-300 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md transition-colors">
            <ArrowLeft size={18} /> Back
          </button>
        </div>
        <div className="text-center drop-shadow-md">
          <h2 className="font-bold text-lg">{design.metadata.title}</h2>
          <div className="text-xs opacity-70">
            {design.metadata.canvasWidth} × {design.metadata.canvasHeight}
            {isLivePreview && <span className="ml-2 text-red-400 font-bold">• LIVE</span>}
          </div>
        </div>
        <div className="pointer-events-auto">
          {!isLivePreview && <button onClick={() => window.location.reload()} className="p-2 hover:bg-white/10 rounded-full"><RefreshCw size={18} /></button>}
        </div>
      </div>

      {/* Playback Controls (Overlay) */}
      {hasTimeline && (
        <div className="absolute bottom-8 z-50 bg-black/80 backdrop-blur-md rounded-full px-6 py-3 border border-white/10 flex items-center gap-4 text-white shadow-2xl transition-transform hover:scale-105">
          <button onClick={togglePlayback} className="hover:text-green-400 transition-colors">
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>
          <div className="text-xs font-mono tracking-wider min-w-[120px] text-center">
            {(currentTime / 1000).toFixed(1)}s / {((design.designJSON.timeline?.totalDuration || 5000) / 1000).toFixed(1)}s
          </div>
          <button onClick={restartPlayback} className="hover:text-blue-400 transition-colors">
            <RotateCcw size={20} />
          </button>
        </div>
      )}

      {/* Main Canvas Area - CENTERED & SCALED */}
      {/* We use a wrapper to handle the scaling cleanly */}
      <div
        className="relative shadow-2xl"
        style={{
          width: design.metadata.canvasWidth,
          height: design.metadata.canvasHeight,
          backgroundColor: design.metadata.canvasColor,
          // THE KEY SCALING LOGIC:
          transform: `scale(${scale})`,
          transformOrigin: 'center center', // Scale from center
          transition: 'transform 0.1s ease-out', // Smooth resizea
        }}
      >
        {/* Render All Elements */}
        {design.designJSON.elements.map(el => renderElement(el))}
      </div>
    </div>
  );
};

export default Preview;