import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, RefreshCw, CloudSun, Clock, ImageIcon, Layout, FileText, Settings, Grid3x3, MousePointer2 } from 'lucide-react';
import { getDesignLocalById } from '../services/localDesignStore';
import { getDesignById, convertBackendToLocal } from '../services/designService';

// --- Interfaces ---
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

// --- Helpers ---

// Animation class helper
const getAnimationClass = (animation?: string) => {
  if (!animation) return '';
  const animationMap: Record<string, string> = {
    'Shake Zoom': 'animate-shake-zoom', 'Whip Slide': 'animate-whip-slide', 'Old TV': 'animate-old-tv', 'Chroma Wave': 'animate-chroma-wave',
    'Brush': 'animate-brush', 'Ink': 'animate-ink', 'Digital': 'animate-digital', 'Spray Paint': 'animate-spray-paint', 'Sketch': 'animate-sketch', 'Gradient': 'animate-gradient',
    'Rise': 'animate-rise', 'Pan': 'animate-pan', 'Fade': 'animate-fade', 'Pop': 'animate-pop', 'Wipe': 'animate-wipe', 'Blur': 'animate-blur', 'Succession': 'animate-succession', 'Breathe': 'animate-breathe', 'Baseline': 'animate-baseline', 'Drift': 'animate-drift', 'Tectonic': 'animate-tectonic', 'Tumble': 'animate-tumble', 'Neon': 'animate-neon', 'Scrapbook': 'animate-scrapbook', 'Stomp': 'animate-stomp',
    'Rotate': 'animate-rotate-effect', 'Flicker': 'animate-flicker', 'Pulse': 'animate-pulse-effect', 'Wiggle': 'animate-wiggle-effect',
  };
  return animationMap[animation] || '';
};

// YouTube URL Converter
const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}`;
    }
  }
  return null;
};

// ✅ HELPER: Safely convert any object to DesignData structure
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

  // ✅ FIXED: Initialize useRef with null to satisfy TypeScript
  const animationRef = useRef<number | null>(null);

  // --- 1. Load Design Logic ---
  useEffect(() => {
    const loadDesign = async () => {
      try {
        setLoading(true);

        // A. Live Preview (Passed from Editor)
        if (locationState?.livePreview && locationState?.designData) {
          console.log('🔴 [PREVIEW] Live preview mode');
          const safeDesign = safeMapToDesignData(locationState.designData);
          setDesign(safeDesign);
          setIsLivePreview(true);
          setIsOnlineMode(false);
          const timelineExists = !!safeDesign.designJSON?.timeline?.tracks?.length;
          setHasTimeline(timelineExists);
          if (timelineExists) setIsPlaying(true);
          setLoading(false);
          return;
        }

        if (!designId) {
          setError('No design ID provided');
          setLoading(false);
          return;
        }

        // B. Fetch from Backend
        try {
          const backendResponse = await getDesignById(designId);
          if (backendResponse.success && backendResponse.data) {
            console.log('✅ [PREVIEW] Loaded from backend');
            const converted = convertBackendToLocal(backendResponse.data);
            const safeDesign = safeMapToDesignData(converted);

            setDesign(safeDesign);
            setIsOnlineMode(true);
            const timelineExists = !!safeDesign.designJSON?.timeline?.tracks?.length;
            setHasTimeline(timelineExists);
            if (timelineExists) setIsPlaying(true);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('⚠️ [PREVIEW] Backend load failed, trying local...', err);
        }

        // C. Fallback to Local Storage
        const localDesign = await getDesignLocalById(designId);

        if (localDesign) {
          console.log('📂 [PREVIEW] Loaded from local storage');
          const safeDesign = safeMapToDesignData(localDesign);

          setDesign(safeDesign);
          setIsOnlineMode(false);
          const timelineExists = !!safeDesign.designJSON?.timeline?.tracks?.length;
          setHasTimeline(timelineExists);
          if (timelineExists) setIsPlaying(true);
          setLoading(false);
          return;
        }

        throw new Error('Design not found');

      } catch (err) {
        console.error('❌ [PREVIEW] Error:', err);
        setError(`Failed to load: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
      }
    };

    loadDesign();
  }, [designId, locationState]);

  // --- 2. Animation Loop (60 FPS) ---
  useEffect(() => {
    if (!isPlaying || !design || !hasTimeline) return;

    const timeline = design.designJSON.timeline;
    const totalDuration = timeline?.totalDuration || 5000;
    const fps = 60;
    const frameInterval = 1000 / fps;

    let lastFrameTime = Date.now();
    let accumulatedTime = currentTime;

    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastFrameTime;

      if (deltaTime >= frameInterval) {
        accumulatedTime += deltaTime;
        if (accumulatedTime >= totalDuration) accumulatedTime = 0; // Loop
        setCurrentTime(accumulatedTime);
        lastFrameTime = now;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, design, hasTimeline]);

  const togglePlayback = () => setIsPlaying(!isPlaying);
  const restartPlayback = () => { setCurrentTime(0); setIsPlaying(true); };

  // --- 3. Property Interpolation Logic ---
  const getElementAtTime = (element: CanvasElement): CanvasElement | null => {
    if (!hasTimeline || !design?.designJSON.timeline) return element;

    const timeline = design.designJSON.timeline;
    let timelineItem: any = null;

    // Find active timeline item
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

    if (!timelineItem) return null; // Hide if not in timeline segment

    // Interpolation math
    const localTime = currentTime - timelineItem.startTime;
    const progress = Math.min(1, Math.max(0, localTime / timelineItem.duration));
    const startState = timelineItem.initialState || {};
    const endState = timelineItem.properties || {};

    const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

    const newEl = { ...element };

    // Numeric properties to interpolate
    const props = ['x', 'y', 'width', 'height', 'rotation', 'opacity', 'fontSize', 'borderRadius'];

    props.forEach(prop => {
      const startVal = startState[prop] ?? element[prop as keyof CanvasElement] ?? 0;
      const endVal = endState[prop] ?? element[prop as keyof CanvasElement] ?? startVal;

      if (typeof startVal === 'number' && typeof endVal === 'number') {
        (newEl as any)[prop] = lerp(startVal, endVal, progress);
      }
    });

    // Color properties (non-interpolated for now, just switch)
    if (endState.color) newEl.color = endState.color;
    if (endState.backgroundColor) newEl.backgroundColor = endState.backgroundColor;
    if (endState.fillColor) newEl.fillColor = endState.fillColor;

    return newEl;
  };

  // --- 4. Renderers ---
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
      willChange: hasTimeline ? 'transform, opacity, left, top' : 'auto',
    };

    const animClass = getAnimationClass(activeElement.animation);

    switch (activeElement.type) {
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

      case 'image':
      case 'gif':
      case 'web_image':
        return (
          <img key={activeElement.id} src={activeElement.content} className={animClass} style={{ ...style, objectFit: activeElement.widgetSettings?.fitMode || 'cover' }} alt="" />
        );

      case 'video':
      case 'web_video':
        return (
          <video key={activeElement.id} src={activeElement.content} className={animClass} style={{ ...style, objectFit: 'cover' }} muted loop autoPlay playsInline />
        );

      case 'youtube':
        const ytUrl = getYouTubeEmbedUrl(activeElement.content);
        return ytUrl ? (
          <iframe key={activeElement.id} src={ytUrl} className={animClass} style={{ ...style, border: 'none' }} allow="autoplay; encrypted-media" />
        ) : null;

      case 'rect':
        return <div key={activeElement.id} className={animClass} style={{ ...style, backgroundColor: activeElement.fillColor || '#4ECDC4', border: `${activeElement.strokeWidth || 0}px solid ${activeElement.strokeColor || 'transparent'}` }} />;

      case 'circle':
        return <div key={activeElement.id} className={animClass} style={{ ...style, backgroundColor: activeElement.fillColor || '#4ECDC4', borderRadius: '50%', border: `${activeElement.strokeWidth || 0}px solid ${activeElement.strokeColor || 'transparent'}` }} />;

      case 'ticker':
        return (
          <div key={activeElement.id} className={animClass} style={{ ...style, backgroundColor: activeElement.backgroundColor || '#1e293b', color: activeElement.color || '#fff', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <div className="animate-marquee px-4" style={{ fontSize: activeElement.fontSize }}>{activeElement.content}</div>
          </div>
        );

      // Shape Renderers (SVG)
      case 'triangle':
        return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="50,10 90,85 10,85" fill={activeElement.fillColor} stroke={activeElement.strokeColor} strokeWidth={activeElement.strokeWidth} /></svg>;

      case 'star':
        return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="50,10 61,40 91,40 67,60 78,90 50,70 22,90 33,60 9,40 39,40" fill={activeElement.fillColor} /></svg>;

      case 'heart':
        return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><path d="M50,85 C25,70 10,55 10,40 C10,25 20,15 30,15 C40,15 50,25 50,25 C50,25 60,15 70,15 C80,15 90,25 90,40 C90,55 75,70 50,85 Z" fill={activeElement.fillColor} /></svg>;

      case 'pentagon':
        return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="50,10 90,35 75,85 25,85 10,35" fill={activeElement.fillColor} /></svg>;

      case 'hexagon':
        return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill={activeElement.fillColor} /></svg>;

      case 'octagon':
        return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="30,10 70,10 90,30 90,70 70,90 30,90 10,70 10,30" fill={activeElement.fillColor} /></svg>;

      case 'diamond':
        return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="50,10 90,50 50,90 10,50" fill={activeElement.fillColor} /></svg>;

      case 'trapezoid':
        return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="25,20 75,20 85,80 15,80" fill={activeElement.fillColor} /></svg>;

      case 'crescent':
        return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><path d="M 50 20 A 30 30 0 0 1 50 80 A 24 24 0 0 0 50 26 A 24 24 0 0 0 50 20 Z" fill={activeElement.fillColor} /></svg>;

      case 'cross':
        return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="40,10 60,10 60,40 90,40 90,60 60,60 60,90 40,90 40,60 10,60 10,40 40,40" fill={activeElement.fillColor} /></svg>;

      case 'line':
        return <div key={activeElement.id} style={{ ...style, backgroundColor: activeElement.fillColor, height: '4px' }} className={animClass} />;

      // --- Advanced Widgets (Visual Representations) ---
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

      case 'timer':
        return (
          <div key={activeElement.id} style={{ ...style, background: activeElement.backgroundColor || '#dc2626', color: activeElement.color || 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
            <div style={{ fontSize: activeElement.fontSize || 32, fontFamily: 'monospace', fontWeight: 'bold' }}>00:00:00</div>
          </div>
        );

      case 'rss':
      case 'media_rss':
        return (
          <div key={activeElement.id} style={{ ...style, background: '#fff7ed', border: '1px solid #fdba74', padding: '12px', overflow: 'hidden' }}>
            <div style={{ fontWeight: 'bold', color: '#9a3412', marginBottom: '8px' }}>{activeElement.content || 'RSS Feed'}</div>
            <div style={{ fontSize: '0.9em', color: '#4b5563' }}>
              • Breaking News Item 1<br />
              • Latest update regarding market<br />
              • Weather forecast for tomorrow
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div key={activeElement.id} style={{ ...style, background: 'white', display: 'flex', flexDirection: 'column', padding: '12px' }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', fontSize: '0.8em', textAlign: 'center' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} style={{ color: '#888' }}>{d}</div>)}
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} style={{ padding: '2px', background: i === 14 ? '#22c55e' : 'transparent', color: i === 14 ? 'white' : '#333', borderRadius: '4px' }}>{i + 1}</div>
              ))}
            </div>
          </div>
        );

      case 'table':
        return (
          <div key={activeElement.id} style={{ ...style, background: 'white', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#f59e0b', color: 'white', padding: '8px', fontWeight: 'bold', fontSize: '0.8em' }}>
              <div>Name</div><div>Status</div><div>Value</div>
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '8px', borderBottom: '1px solid #f3f4f6', fontSize: '0.8em', color: '#374151' }}>
                <div>Item {i}</div>
                <div>{i === 1 ? 'Active' : 'Pending'}</div>
                <div>${(i * 120).toFixed(2)}</div>
              </div>
            ))}
          </div>
        );

      case 'dashboards':
        return (
          <div key={activeElement.id} style={{ ...style, background: '#1f2937', color: 'white', padding: '12px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #374151', paddingBottom: '5px' }}>{activeElement.content || 'Dashboard'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: '#0891b2', padding: '8px', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.7em', opacity: 0.8 }}>Views</div>
                <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>12.5K</div>
              </div>
              <div style={{ background: '#16a34a', padding: '8px', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.7em', opacity: 0.8 }}>Rev</div>
                <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>$8.2K</div>
              </div>
              <div style={{ background: '#9333ea', padding: '8px', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.7em', opacity: 0.8 }}>Users</div>
                <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>3.4K</div>
              </div>
              <div style={{ background: '#ea580c', padding: '8px', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.7em', opacity: 0.8 }}>Growth</div>
                <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>+24%</div>
              </div>
            </div>
          </div>
        );

      case 'ad_serving':
        return (
          <div key={activeElement.id} style={{ ...style, background: 'linear-gradient(to bottom right, #d946ef, #ec4899)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '10px' }}>
            <ImageIcon size={32} style={{ marginBottom: '8px' }} />
            <div style={{ fontWeight: 'bold' }}>Advertisement</div>
            <div style={{ fontSize: '0.8em', opacity: 0.8 }}>Space Available</div>
          </div>
        );

      case 'smart_switch':
        return (
          <div key={activeElement.id} style={{ ...style, background: 'linear-gradient(to bottom right, #a3e635, #22c55e)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8em' }}>A</span>
              <div style={{ width: '30px', height: '16px', background: 'rgba(255,255,255,0.3)', borderRadius: '10px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '2px', top: '2px', width: '12px', height: '12px', background: 'white', borderRadius: '50%' }} />
              </div>
              <span style={{ fontSize: '0.8em' }}>B</span>
            </div>
            <div style={{ fontSize: '0.8em', fontWeight: 'bold' }}>Smart Content</div>
          </div>
        );

      case 'touch':
        return (
          <div key={activeElement.id} style={{ ...style, background: 'linear-gradient(to bottom right, #60a5fa, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <MousePointer2 size={32} className="animate-bounce" />
            <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>Touch</span>
          </div>
        );

      case 'ftp':
        return (
          <div key={activeElement.id} style={{ ...style, background: '#f0fdfa', border: '1px solid #5eead4', padding: '10px', display: 'flex', alignItems: 'center', color: '#115e59' }}>
            <FileText size={20} style={{ marginRight: '8px' }} />
            <span style={{ fontSize: '0.9em' }}>{activeElement.content || 'FTP Source'}</span>
          </div>
        );

      case 'sub_creative':
        return (
          <div key={activeElement.id} style={{ ...style, background: 'linear-gradient(to bottom right, #06b6d4, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
            {activeElement.content || 'Sub Creative'}
          </div>
        );

      default:
        // Generic fallback for shapes or unknown types
        return <div key={activeElement.id} style={{ ...style, backgroundColor: activeElement.fillColor || activeElement.backgroundColor || '#ccc' }} />;
    }
  };

  // --- 5. Render UI ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
          <h3 className="text-xl">Loading Preview...</h3>
        </div>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-center">
        <div>
          <h3 className="text-2xl font-bold mb-2">Error Loading Design</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-50 flex justify-between items-center text-white pointer-events-none">
        <div className="pointer-events-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 hover:text-gray-300 bg-black/20 px-3 py-1 rounded-full backdrop-blur-md">
            <ArrowLeft size={18} /> Back
          </button>
        </div>
        <div className="text-center">
          <h2 className="font-bold text-lg drop-shadow-md">{design.metadata.title}</h2>
          <div className="text-xs opacity-70 flex items-center justify-center gap-2">
            {design.metadata.canvasWidth}x{design.metadata.canvasHeight}
            {isLivePreview ? <span className="text-red-400 font-bold">• LIVE</span> : <span className="text-green-400">• SAVED</span>}
          </div>
        </div>
        <div className="pointer-events-auto">
          {!isLivePreview && <button onClick={() => window.location.reload()} className="p-2 hover:bg-white/10 rounded-full"><RefreshCw size={18} /></button>}
        </div>
      </div>

      {/* Playback Controls */}
      {hasTimeline && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-md rounded-full px-6 py-3 border border-white/10 flex items-center gap-4 text-white shadow-2xl">
          <button onClick={togglePlayback} className="hover:text-green-400 transition-colors">
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>
          <div className="text-xs font-mono tracking-wider">
            {(currentTime / 1000).toFixed(1)}s / {((design.designJSON.timeline?.totalDuration || 5000) / 1000).toFixed(1)}s
          </div>
          <button onClick={restartPlayback} className="hover:text-blue-400 transition-colors">
            <RotateCcw size={20} />
          </button>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-900 w-full h-full relative">
        <div style={{
          width: design.metadata.canvasWidth,
          height: design.metadata.canvasHeight,
          backgroundColor: design.metadata.canvasColor,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 0 50px rgba(0,0,0,0.5)',
          // Scale to fit viewport
          transform: `scale(${Math.min(
            (window.innerWidth - 40) / design.metadata.canvasWidth,
            (window.innerHeight - 40) / design.metadata.canvasHeight
          )})`,
          transformOrigin: 'center center',
        }}>
          {design.designJSON.elements.map(el => renderElement(el))}
        </div>
      </div>
    </div>
  );
};

export default Preview;