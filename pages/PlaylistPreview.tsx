
// export default PlaylistPreview;
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, RotateCcw, RefreshCw, AlertCircle,
  SkipForward, SkipBack, CloudSun, Clock as ClockIcon
} from 'lucide-react';
import { getPlaylistDetailsFromBackend } from '../services/playlistService';
import { getAllDesigns, convertBackendToLocal } from '../services/designService';

// ==========================================
// 1. HELPERS & SYNCED COMPONENTS
// ==========================================

const getAnimationClass = (animation?: string) => {
  if (!animation) return '';
  const animationMap: Record<string, string> = {
    'Shake Zoom': 'animate-shake-zoom', 'Whip Slide': 'animate-whip-slide', 'Old TV': 'animate-old-tv', 'Chroma Wave': 'animate-chroma-wave',
    'Brush': 'animate-brush', 'Ink': 'animate-ink', 'Digital': 'animate-digital', 'Spray Paint': 'animate-spray-paint', 'Sketch': 'animate-sketch', 'Gradient': 'animate-gradient',
    'Rise': 'animate-rise', 'Pan': 'animate-pan', 'Fade': 'animate-fade', 'Pop': 'animate-pop', 'Wipe': 'animate-wipe', 'Blur': 'animate-blur',
    'Succession': 'animate-succession', 'Breathe': 'animate-breathe', 'Baseline': 'animate-baseline', 'Drift': 'animate-drift', 'Tectonic': 'animate-tectonic',
    'Tumble': 'animate-tumble', 'Neon': 'animate-neon', 'Scrapbook': 'animate-scrapbook', 'Stomp': 'animate-stomp',
    'Rotate': 'animate-rotate-effect', 'Flicker': 'animate-flicker', 'Pulse': 'animate-pulse-effect', 'Wiggle': 'animate-wiggle-effect',
  };
  return animationMap[animation] || '';
};

const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/, /youtube\.com\/embed\/([^&\s]+)/, /^([a-zA-Z0-9_-]{11})$/];
  const match = patterns.reduce<RegExpMatchArray | null>((acc, pattern) => acc || url.match(pattern), null);
  return match && match[1] ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&controls=0&loop=1&playlist=${match[1]}` : null;
};

const SyncedPreviewVideo = ({ src, currentTime, isPlaying, startTime, duration, inPoint = 0, style, className }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    const relativeTimeMs = currentTime - startTime + inPoint;
    const relativeTimeSec = relativeTimeMs / 1000;
    const isInsideClip = relativeTimeMs >= 0 && relativeTimeMs < duration;

    if (isInsideClip) {
      if (Math.abs(video.currentTime - relativeTimeSec) > 0.15) video.currentTime = relativeTimeSec;
      if (isPlaying) { if (video.paused) video.play().catch(() => { }); } else { video.pause(); }
      video.style.opacity = '1';
    } else {
      video.pause();
      if (relativeTimeMs < 0) video.currentTime = inPoint / 1000;
      video.style.opacity = '0';
    }
  }, [currentTime, isPlaying, startTime, duration, inPoint, src]);
  return <video ref={videoRef} src={src} className={className} style={style} muted={false} playsInline />;
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
const PlaylistPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isRecording = new URLSearchParams(location.search).get('recording') === 'true';

  // Playlist State
  const [playlistName, setPlaylistName] = useState('');
  const [schedule, setSchedule] = useState<any[]>([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Playback State
  const [globalTime, setGlobalTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Scaling
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 1. Load Data ---
  useEffect(() => {
    const init = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const designsRes = await getAllDesigns();
        const allDesigns = designsRes.success ? designsRes.data?.map(convertBackendToLocal) || [] : [];
        const plRes = await getPlaylistDetailsFromBackend(id);

        if (plRes.success && plRes.data) {
          setPlaylistName(plRes.data.name);
          const rawItems = plRes.data.tblplaylistitems || [];
          let cursor = 0;
          const builtSchedule = rawItems.map((item: any) => {
            const matchedDesign = allDesigns.find((d: any) => d.id === item.designId);
            if (!matchedDesign) return null;
            const durationMs = item.duration * 1000;
            const start = cursor;
            cursor += durationMs;
            return { ...item, designData: matchedDesign, globalStart: start, globalEnd: cursor, durationMs };
          }).filter(Boolean);

          setSchedule(builtSchedule);
          setTotalDuration(cursor);
          setTimeout(() => setIsReady(true), 1500);
        } else {
          setError("Failed to load playlist data");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  // --- 2. Animation Loop ---
  useEffect(() => {
    if (!isPlaying || totalDuration === 0) return;
    let lastTime = performance.now();
    const loop = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      setGlobalTime(prev => {
        let next = prev + delta;
        return next >= totalDuration ? 0 : next;
      });
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPlaying, totalDuration]);

  // --- 3. Controls ---
  const handleTogglePlay = () => setIsPlaying(!isPlaying);
  const handleRestart = () => { setGlobalTime(0); setIsPlaying(true); };
  const handleNext = () => {
    const activeIdx = schedule.findIndex(i => globalTime >= i.globalStart && globalTime < i.globalEnd);
    if (activeIdx !== -1 && activeIdx < schedule.length - 1) setGlobalTime(schedule[activeIdx + 1].globalStart);
    else setGlobalTime(0);
  };
  const handlePrev = () => {
    const activeIdx = schedule.findIndex(i => globalTime >= i.globalStart && globalTime < i.globalEnd);
    if (activeIdx > 0) setGlobalTime(schedule[activeIdx - 1].globalStart);
    else setGlobalTime(0);
  };

  // --- 4. Logic & Scaling ---
  const activeItem = schedule.find(item => globalTime >= item.globalStart && globalTime < item.globalEnd);
  const localDesignTime = activeItem ? (globalTime - activeItem.globalStart) : 0;

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!activeItem) return;
      if (isRecording) { setScale(1); return; }

      const paddingX = 40;
      const paddingY = 180;
      const availableWidth = window.innerWidth - paddingX;
      const availableHeight = window.innerHeight - paddingY;
      const { canvasWidth, canvasHeight } = activeItem.designData.metadata;
      setScale(Math.min(availableWidth / canvasWidth, availableHeight / canvasHeight));
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [activeItem, isRecording]);

  // --- 5. Interpolation Engine ---
  const getElementAtTime = (element: any, designData: any): any | null => {
    const timeline = designData.designJSON.timeline;
    if (!timeline?.tracks) return element;

    let timelineItem: any = null;
    for (const track of timeline.tracks || []) {
      for (const item of track.items) {
        if (item.elementId === element.id) {
          if (localDesignTime >= item.startTime && localDesignTime < item.startTime + item.duration) {
            timelineItem = item;
            break;
          }
        }
      }
      if (timelineItem) break;
    }

    if (!timelineItem) return null;

    const progress = Math.min(1, Math.max(0, (localDesignTime - timelineItem.startTime) / timelineItem.duration));
    const sState = timelineItem.initialState || {};
    const eState = timelineItem.properties || {};
    const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

    const newEl = { ...element };
    newEl._syncData = { startTime: timelineItem.startTime, duration: timelineItem.duration, inPoint: timelineItem.inPoint || 0 };

    ['x', 'y', 'width', 'height', 'rotation', 'opacity', 'fontSize', 'borderRadius'].forEach(prop => {
      const startVal = sState[prop] ?? element[prop] ?? 0;
      const endVal = eState[prop] ?? element[prop] ?? startVal;
      if (typeof startVal === 'number' && typeof endVal === 'number') newEl[prop] = lerp(startVal, endVal, progress);
    });

    if (eState.color) newEl.color = eState.color;
    if (eState.backgroundColor) newEl.backgroundColor = eState.backgroundColor;
    if (eState.fillColor) newEl.fillColor = eState.fillColor;

    return newEl;
  };

  // --- 6. Full Type Renderer ---
  const renderElement = (originalEl: any) => {
    if (!activeItem) return null;
    const el = getElementAtTime(originalEl, activeItem.designData);
    if (!el) return null;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${el.x}px`, top: `${el.y}px`, width: `${el.width}px`, height: `${el.height}px`,
      opacity: el.opacity, transform: `rotate(${el.rotation}deg)`, zIndex: el.zIndex,
      borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
      overflow: 'hidden', willChange: 'transform, opacity'
    };

    const animClass = getAnimationClass(el.animation);

    switch (el.type) {
      case 'text':
      case 'label':
        return (
          <div key={el.id} className={animClass} style={{
            ...style, color: el.color, backgroundColor: el.backgroundColor, fontSize: el.fontSize,
            fontWeight: el.textStyle?.bold ? 'bold' : 'normal', textAlign: el.textStyle?.textAlign || 'center',
            fontFamily: el.textStyle?.fontFamily || 'Arial', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'pre-wrap'
          }}>{el.content}</div>
        );
      case 'image':
      case 'gif':
      case 'web_image':
        return <img key={el.id} src={el.content} className={animClass} style={{ ...style, objectFit: el.widgetSettings?.fitMode || 'cover' }} alt="" />;
      case 'video':
      case 'web_video':
        return el._syncData ? (
          <SyncedPreviewVideo key={el.id} src={el.content} currentTime={localDesignTime} isPlaying={isPlaying} startTime={el._syncData.startTime} duration={el._syncData.duration} inPoint={el._syncData.inPoint} className={animClass} style={{ ...style, objectFit: 'cover' }} />
        ) : <video key={el.id} src={el.content} style={{ ...style, objectFit: 'cover' }} autoPlay muted loop />;
      case 'youtube':
        const ytUrl = getYouTubeEmbedUrl(el.content);
        return ytUrl ? <iframe key={el.id} src={ytUrl} className={animClass} style={{ ...style, border: 'none' }} allow="autoplay" /> : null;
      case 'rect': return <div key={el.id} className={animClass} style={{ ...style, backgroundColor: el.fillColor, border: `${el.strokeWidth}px solid ${el.strokeColor}` }} />;
      case 'circle': return <div key={el.id} className={animClass} style={{ ...style, backgroundColor: el.fillColor, borderRadius: '50%', border: `${el.strokeWidth}px solid ${el.strokeColor}` }} />;
      case 'triangle': return <svg key={el.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="50,10 90,85 10,85" fill={el.fillColor} /></svg>;
      case 'star': return <svg key={el.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="50,10 61,40 91,40 67,60 78,90 50,70 22,90 33,60 9,40 39,40" fill={el.fillColor} /></svg>;
      case 'heart': return <svg key={el.id} viewBox="0 0 100 100" style={style} className={animClass}><path d="M50,85 C25,70 10,55 10,40 C10,25 20,15 30,15 C40,15 50,25 50,25 C50,25 60,15 70,15 C80,15 90,25 90,40 C90,55 75,70 50,85 Z" fill={el.fillColor} /></svg>;
      case 'ticker':
        return (
          <div key={el.id} className={animClass} style={{ ...style, background: el.backgroundColor || '#1e293b', color: el.color || '#fff', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <div className="animate-marquee px-4" style={{ fontSize: el.fontSize }}>{el.content}</div>
          </div>
        );
      case 'weather':
        return (
          <div key={el.id} style={{ ...style, background: 'linear-gradient(to bottom right, #38bdf8, #3b82f6)', color: 'white', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <CloudSun size={48} className="mb-2" />
            <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{el.widgetSettings?.temperature || '72'}°F</div>
            <div style={{ opacity: 0.8 }}>{el.widgetSettings?.location || 'New York'}</div>
          </div>
        );
      case 'clock':
        return (
          <div key={el.id} style={{ ...style, background: el.backgroundColor || '#1e293b', color: el.color || 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <ClockIcon size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
            <div style={{ fontSize: el.fontSize, fontFamily: 'monospace', fontWeight: 'bold' }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        );
      default:
        return <div key={el.id} style={{ ...style, backgroundColor: el.fillColor || '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{el.content}</div>;
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><RefreshCw className="animate-spin mr-2" /> Loading Playlist...</div>;
  if (error) return <div className="min-h-screen bg-black flex items-center justify-center text-white text-center"><div><AlertCircle size={48} className="mx-auto mb-4" /><p>{error}</p><button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-white/10 rounded-full">Back</button></div></div>;

  return (
    <div className={`fixed inset-0 bg-[#050505] flex flex-col overflow-hidden ${isReady ? 'design-canvas-ready' : ''}`}>
      {/* 1. Header Overlay */}
      {!isRecording && (
        <div className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-center text-white bg-gradient-to-b from-black/90 to-transparent">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 hover:bg-white/10 px-6 py-2 rounded-full backdrop-blur-xl transition-all border border-white/5">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="text-center drop-shadow-2xl">
            <h2 className="font-bold text-xl tracking-tight">{playlistName}</h2>
            {activeItem && <p className="text-[10px] text-blue-400 font-mono uppercase tracking-[0.2em]">{activeItem.designData.metadata.title}</p>}
          </div>
          <div className="w-32" />
        </div>
      )}

      {/* 2. Main Canvas Area (Zero-Size Centering Fix) */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]">
        {activeItem && (
          <div style={{ width: 0, height: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              className={`${isRecording ? '' : 'shadow-[0_0_150px_rgba(0,0,0,0.8)]'} flex-shrink-0`}
              style={{
                width: `${activeItem.designData.metadata.canvasWidth}px`,
                height: `${activeItem.designData.metadata.canvasHeight}px`,
                backgroundColor: activeItem.designData.metadata.canvasColor,
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {activeItem.designData.designJSON.elements.map((el: any) => renderElement(el))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Playback Controls Overlay (Preview Style) */}
      {!isRecording && (
        <div className="absolute bottom-8 left-0 right-0 z-50 flex flex-col items-center gap-4 px-8 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-xl rounded-full px-8 py-3 border border-white/10 flex items-center gap-6 text-white shadow-2xl pointer-events-auto transition-transform hover:scale-105">
            <button onClick={handlePrev} className="hover:text-blue-400 transition-colors"><SkipBack size={20} /></button>
            <button onClick={handleTogglePlay} className="hover:text-green-400 transition-colors">
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>
            <div className="text-xs font-mono tracking-widest min-w-[140px] text-center border-x border-white/10 px-4">
              {(globalTime / 1000).toFixed(1)}s / {(totalDuration / 1000).toFixed(1)}s
            </div>
            <button onClick={handleRestart} className="hover:text-yellow-400 transition-colors"><RotateCcw size={20} /></button>
            <button onClick={handleNext} className="hover:text-blue-400 transition-colors"><SkipForward size={20} /></button>
          </div>

          <div className="w-full max-w-2xl bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/5 pointer-events-auto">
            <div
              className="relative h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setGlobalTime(((e.clientX - rect.left) / rect.width) * totalDuration);
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-100 ease-linear"
                style={{ width: `${(globalTime / (totalDuration || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistPreview;