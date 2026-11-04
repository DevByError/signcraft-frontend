import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, RotateCcw, RefreshCw
} from 'lucide-react';
import { getDesignLocalById } from '../services/localDesignStore';
import { getDesignById, convertBackendToLocal } from '../services/designService';
import { CanvasElement, ElementTypeValue } from '../types/canvas';
// IMPORT SHARED RENDERER
import { ElementRenderer } from '../components/ElementRenderer';

// ==========================================
// 1. INTERFACES
// ==========================================
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
// 2. HELPER COMPONENTS
// ==========================================

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

        const urlParams = new URLSearchParams(window.location.search);
        const previewKey = urlParams.get('previewKey');

        if (previewKey) {
          const storedData = localStorage.getItem(previewKey);
          if (storedData) {
            try {
              const parsedData = JSON.parse(storedData);
              const safeDesign = safeMapToDesignData(parsedData);
              setDesign(safeDesign);
              setIsLivePreview(true);
              const timelineExists = !!safeDesign.designJSON?.timeline?.tracks?.length;
              setHasTimeline(timelineExists);
              if (timelineExists) setIsPlaying(true);
              setLoading(false);
              return;
            } catch (e) {
              console.error('Failed to parse localStorage data:', e);
            }
          }
        }

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

        const backendResponse = await getDesignById(designId).catch(() => null);
        if (backendResponse?.success) {
          const converted = convertBackendToLocal(backendResponse.data);
          setDesign(safeMapToDesignData(converted));
          setHasTimeline(!!converted.designJSON?.timeline?.tracks?.length);
          setIsPlaying(true);
          setLoading(false);
          return;
        }

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

  // --- Effect 2: Live Sync ---
  useEffect(() => {
    if (!isLivePreview) return;
    const urlParams = new URLSearchParams(window.location.search);
    const previewKey = urlParams.get('previewKey');

    const handleLivePreviewUpdate = (event: MessageEvent) => {
      if (event.data.type === 'LIVE_PREVIEW_UPDATE') {
        const updatedData = event.data.payload;
        const safeDesign = safeMapToDesignData(updatedData);
        setDesign(safeDesign);
        const timelineExists = !!safeDesign.designJSON?.timeline?.tracks?.length;
        setHasTimeline(timelineExists);
        if (timelineExists && !isPlaying) setIsPlaying(true);
      }
    };

    window.addEventListener('message', handleLivePreviewUpdate);

    const handleStorageChange = (event: StorageEvent) => {
      if (previewKey && event.key === previewKey && event.newValue) {
        try {
          const updatedData = JSON.parse(event.newValue);
          const safeDesign = safeMapToDesignData(updatedData);
          setDesign(safeDesign);
          const timelineExists = !!safeDesign.designJSON?.timeline?.tracks?.length;
          setHasTimeline(timelineExists);
          if (timelineExists && !isPlaying) setIsPlaying(true);
        } catch (e) {
          console.error('Failed to parse storage update:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('message', handleLivePreviewUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isLivePreview, isPlaying]);

  // --- Effect 3: Auto-Scale ---
  useEffect(() => {
    if (!design) return;
    const handleResize = () => {
      const paddingX = 40;
      const paddingY = 160;
      const availableWidth = window.innerWidth - paddingX;
      const availableHeight = window.innerHeight - paddingY;
      const { canvasWidth, canvasHeight } = design.metadata;
      const scaleX = availableWidth / canvasWidth;
      const scaleY = availableHeight / canvasHeight;
      setScale(Math.min(scaleX, scaleY));
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [design]);

  // --- Effect 4: Animation Loop ---
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
        if (accTime >= totalDuration) accTime = 0;
        setCurrentTime(accTime);
        lastTime = now;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPlaying, design, hasTimeline, playbackKey]);

  // --- Controls ---
  const togglePlayback = () => setIsPlaying(!isPlaying);
  const restartPlayback = () => {
    setCurrentTime(0);
    setPlaybackKey(k => k + 1);
    setIsPlaying(true);
  };

  // --- Interpolation Logic ---
  const getElementAtTime = (element: CanvasElement): CanvasElement | null => {
    if (!hasTimeline || !design?.designJSON.timeline) return element;
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

    if (!timelineItem) return null;

    const localTime = currentTime - timelineItem.startTime;
    const progress = Math.min(1, Math.max(0, localTime / timelineItem.duration));
    const startState = timelineItem.initialState || {};
    const endState = timelineItem.properties || {};
    const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

    const newEl = { ...element };
    (newEl as any)._syncData = {
      startTime: timelineItem.startTime,
      duration: timelineItem.duration,
      inPoint: timelineItem.inPoint || 0
    };

    ['x', 'y', 'width', 'height', 'rotation', 'opacity', 'fontSize', 'borderRadius'].forEach(prop => {
      const startVal = startState[prop as keyof typeof startState] ?? element[prop as keyof CanvasElement] ?? 0;
      const endVal = endState[prop as keyof typeof endState] ?? element[prop as keyof CanvasElement] ?? startVal;
      if (typeof startVal === 'number' && typeof endVal === 'number') {
        (newEl as any)[prop] = lerp(startVal, endVal, progress);
      }
    });

    if (endState.color) newEl.color = endState.color;
    if (endState.backgroundColor) newEl.backgroundColor = endState.backgroundColor;
    if (endState.fillColor) newEl.fillColor = endState.fillColor;

    return newEl;
  };

  const renderElement = (element: CanvasElement) => {
    const activeElement = getElementAtTime(element);
    if (!activeElement) return null;

    // RENDER USING SHARED COMPONENT
    return (
      <ElementRenderer
        key={activeElement.id}
        element={activeElement}
        currentTime={currentTime}
        isPlaying={isPlaying}
      />
    );
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Preview...</div>;
  if (error || !design) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-center"><div><h3>Error</h3><p>{error}</p><button onClick={() => navigate(-1)}>Back</button></div></div>;

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-center items-center text-white bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-center drop-shadow-md">
          <h2 className="font-bold text-lg">
            {design.metadata.title}
          </h2>
          <div className="text-xs opacity-70">
            {design.metadata.canvasWidth} × {design.metadata.canvasHeight}
            {isLivePreview && (
              <span className="ml-2 text-red-400 font-bold">• LIVE</span>
            )}
          </div>
        </div>
      </div>



      {/* Playback Controls */}
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

      {/* Main Canvas */}
      <div
        className="relative shadow-2xl"
        style={{
          width: design.metadata.canvasWidth,
          height: design.metadata.canvasHeight,
          backgroundColor: design.metadata.canvasColor,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.1s ease-out',
        }}
      >
        {design.designJSON.elements.map(el => renderElement(el))}
      </div>
    </div>
  );
};

export default Preview;