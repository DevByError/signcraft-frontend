
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, RotateCcw, RefreshCw, AlertCircle,
  SkipForward, SkipBack
} from 'lucide-react';
import { getPlaylistDetailsFromBackend } from '../services/playlistService';
import { getAllDesigns, convertBackendToLocal } from '../services/designService';
import { ElementRenderer } from '../components/ElementRenderer';

const PlaylistPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isRecording = new URLSearchParams(location.search).get('recording') === 'true';

  const [playlistName, setPlaylistName] = useState('');
  const [schedule, setSchedule] = useState<any[]>([]);
  const [totalPlaylistDuration, setTotalPlaylistDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [globalTime, setGlobalTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'single' | 'all'>('all');
  const animationRef = useRef<number | null>(null);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. LOAD DATA
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

            const slotDurationMs = (item.duration || 10) * 1000;
            const start = cursor;
            cursor += slotDurationMs;

            return {
              ...item,
              designData: matchedDesign,
              globalStart: start,
              globalEnd: cursor,
              slotDurationMs,
              designLoopDuration: matchedDesign.designJSON?.timeline?.totalDuration || 10000
            };
          }).filter(Boolean);

          setSchedule(builtSchedule);
          setTotalPlaylistDuration(cursor);
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

  // 2. ANIMATION LOOP
  useEffect(() => {
    if (!isPlaying || totalPlaylistDuration === 0) return;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      setGlobalTime(prev => {
        let next = prev + delta;
        if (next >= totalPlaylistDuration) {
          if (repeatMode === 'all' || repeatMode === 'single') {
            return 0;
          } else {
            return totalPlaylistDuration;
          }
        }
        return next;
      });
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPlaying, totalPlaylistDuration, repeatMode]);

  // 3. CONTROLS
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

  const handleToggleRepeat = () => {
    const modes: Array<'off' | 'single' | 'all'> = ['all', 'single', 'off'];
    const currentIdx = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIdx + 1) % modes.length]);
  };

  // 4. FIND ACTIVE SLOT & INTERPOLATE
  const activeItem = schedule.find(item => globalTime >= item.globalStart && globalTime < item.globalEnd);
  const timeElapsedInSlot = activeItem ? (globalTime - activeItem.globalStart) : 0;
  const localDesignTime = activeItem ? (timeElapsedInSlot % activeItem.designLoopDuration) : 0;

  // 5. SCALING
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

  // 6. INTERPOLATION ENGINE
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

  const renderElement = (originalEl: any) => {
    if (!activeItem) return null;
    // Calculate position based on time
    const interpolatedEl = getElementAtTime(originalEl, activeItem.designData);
    if (!interpolatedEl) return null;

    // ✅ RENDER USING SHARED COMPONENT
    return (
      <ElementRenderer
        key={interpolatedEl.id}
        element={interpolatedEl}
        currentTime={localDesignTime}
        isPlaying={isPlaying}
      />
    );
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><RefreshCw className="animate-spin mr-2" /> Loading Playlist...</div>;
  if (error) return <div className="min-h-screen bg-black flex items-center justify-center text-white text-center"><div><AlertCircle size={48} className="mx-auto mb-4" /><p>{error}</p><button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-white/10 rounded-full">Back</button></div></div>;

  return (
    <div className={`fixed inset-0 bg-[#050505] flex flex-col overflow-hidden ${isReady ? 'design-canvas-ready' : ''}`}>
      {/* HEADER */}
      {!isRecording && (
        <div className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-center text-white bg-gradient-to-b from-black/90 to-transparent">

          {/* Left spacer (same width as old Back button) */}
          <div className="w-32" />

          {/* Center content */}
          <div className="text-center drop-shadow-2xl">
            <h2 className="font-bold text-xl tracking-tight">
              {playlistName}
            </h2>

            {activeItem && (
              <div className="text-[10px] text-blue-400 font-mono uppercase tracking-[0.2em] mt-1">
                Now Playing: {activeItem.designData.metadata.title} (
                {Math.ceil((activeItem.globalEnd - globalTime) / 1000)}s left)
              </div>
            )}
          </div>

          {/* Right spacer */}
          <div className="w-32" />

        </div>
      )}


      {/* CANVAS */}
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

      {/* CONTROLS */}
      {!isRecording && (
        <div className="absolute bottom-8 left-0 right-0 z-50 flex flex-col items-center gap-4 px-8 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-xl rounded-full px-8 py-3 border border-white/10 flex items-center gap-6 text-white shadow-2xl pointer-events-auto transition-transform hover:scale-105">
            <button onClick={handlePrev} className="hover:text-blue-400 transition-colors"><SkipBack size={20} /></button>
            <button onClick={handleTogglePlay} className="hover:text-green-400 transition-colors">
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>
            <div className="text-xs font-mono tracking-widest min-w-[140px] text-center border-x border-white/10 px-4">
              {Math.floor(globalTime / 60000)}:{(Math.floor(globalTime / 1000) % 60).toString().padStart(2, '0')} /
              {Math.floor(totalPlaylistDuration / 60000)}:{(Math.floor(totalPlaylistDuration / 1000) % 60).toString().padStart(2, '0')}
            </div>
            <button onClick={handleRestart} className="hover:text-yellow-400 transition-colors"><RotateCcw size={20} /></button>
            <button onClick={handleNext} className="hover:text-blue-400 transition-colors"><SkipForward size={20} /></button>
          </div>

          <div className="w-full max-w-2xl bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/5 pointer-events-auto">
            <div
              className="relative h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer"
              onPointerDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const seekTime =
                  ((e.clientX - rect.left) / rect.width) * totalPlaylistDuration;

                setGlobalTime(seekTime);

                // OPTIONAL: if you control a media ref
                // mediaRef.current.currentTime = seekTime;

                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (e.buttons !== 1) return;

                const rect = e.currentTarget.getBoundingClientRect();
                const seekTime =
                  ((e.clientX - rect.left) / rect.width) * totalPlaylistDuration;

                setGlobalTime(seekTime);

                // OPTIONAL:
                // mediaRef.current.currentTime = seekTime;
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-none"
                style={{
                  width: `${(globalTime / (totalPlaylistDuration || 1)) * 100}%`,
                }}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default PlaylistPreview;