// import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { ArrowLeft, Play, Pause, RotateCcw, RefreshCw, AlertCircle, SkipForward, SkipBack } from 'lucide-react';
// import { getPlaylistDetailsFromBackend } from '../services/playlistService';
// // ✅ Using getAllDesigns to match your working PlaylistEditor strategy
// import { getAllDesigns, convertBackendToLocal } from '../services/designService';

// // ==========================================
// // 1. SYNCED VIDEO ENGINE
// // ==========================================
// const SyncedVideo = ({ src, localTime, isPlaying, startTime, duration, inPoint = 0, style, className }: any) => {
//   const videoRef = useRef<HTMLVideoElement>(null);

//   useEffect(() => {
//     const video = videoRef.current;
//     if (!video || !src) return;

//     const videoCurrentTime = localTime - startTime + inPoint;
//     const videoTimeSec = videoCurrentTime / 1000;

//     const isInsideClip = videoCurrentTime >= 0 && videoCurrentTime < duration;

//     if (isInsideClip) {
//       if (Math.abs(video.currentTime - videoTimeSec) > 0.15) {
//         video.currentTime = videoTimeSec;
//       }

//       if (isPlaying) {
//         if (video.paused) video.play().catch(() => { });
//       } else {
//         video.pause();
//       }
//       video.style.opacity = '1';
//     } else {
//       video.pause();
//       if (videoCurrentTime < 0) video.currentTime = inPoint / 1000;
//     }
//   }, [localTime, isPlaying, startTime, duration, inPoint, src]);

//   return <video ref={videoRef} src={src} className={className} style={style} muted={false} playsInline />;
// };

// const getAnimationClass = (animation?: string) => {
//   if (!animation) return '';
//   const map: Record<string, string> = {
//     'Shake Zoom': 'animate-shake-zoom', 'Whip Slide': 'animate-whip-slide', 'Old TV': 'animate-old-tv',
//     'Rise': 'animate-rise', 'Pan': 'animate-pan', 'Fade': 'animate-fade', 'Pop': 'animate-pop',
//     'Rotate': 'animate-rotate-effect', 'Flicker': 'animate-flicker', 'Pulse': 'animate-pulse-effect',
//   };
//   return map[animation] || '';
// };

// // ==========================================
// // 2. MAIN COMPONENT
// // ==========================================
// const PlaylistPreview: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();

//   // Playlist Data
//   const [playlistName, setPlaylistName] = useState('');
//   const [schedule, setSchedule] = useState<any[]>([]);
//   const [totalDuration, setTotalDuration] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Playback Engine
//   const [globalTime, setGlobalTime] = useState(0);
//   const [isPlaying, setIsPlaying] = useState(true);

//   // ✅ FIX: "An argument for 'initialValue' was not provided" fixed here
//   const animationRef = useRef<number | null>(null);

//   // Viewport
//   const [scale, setScale] = useState(1);
//   const containerRef = useRef<HTMLDivElement>(null);

//   // --- 1. Load & Build Schedule ---
//   useEffect(() => {
//     const init = async () => {
//       if (!id) return;
//       setLoading(true);

//       try {
//         // 1. Fetch All Designs (Matching your PlaylistEditor logic)
//         const designsRes = await getAllDesigns();
//         const allDesigns = designsRes.success ? designsRes.data?.map(convertBackendToLocal) || [] : [];

//         // 2. Fetch Playlist Details
//         const plRes = await getPlaylistDetailsFromBackend(id);

//         if (plRes.success && plRes.data) {
//           setPlaylistName(plRes.data.name);
//           const rawItems = plRes.data.tblplaylistitems || [];

//           // 3. Match Items
//           let cursor = 0;
//           const builtSchedule = rawItems.map((item: any) => {
//             const matchedDesign = allDesigns.find((d: any) => d.id === item.designId);
//             if (!matchedDesign) return null;

//             const durationMs = item.duration * 1000;
//             const start = cursor;
//             const end = cursor + durationMs;
//             cursor += durationMs;

//             return {
//               ...item,
//               designData: matchedDesign,
//               globalStart: start,
//               globalEnd: end,
//               durationMs: durationMs
//             };
//           }).filter(Boolean);

//           setSchedule(builtSchedule);
//           setTotalDuration(cursor);
//         } else {
//           setError("Failed to load playlist data");
//         }
//       } catch (err: any) {
//         console.error(err);
//         setError(err.message || "An unexpected error occurred");
//       } finally {
//         setLoading(false);
//       }
//     };
//     init();
//   }, [id]);

//   // --- 2. The Global Animation Loop ---
//   useEffect(() => {
//     if (!isPlaying || totalDuration === 0) return;

//     let lastTime = Date.now();

//     const loop = () => {
//       const now = Date.now();
//       const delta = now - lastTime;

//       if (delta >= 16) {
//         setGlobalTime(prev => {
//           let next = prev + delta;
//           if (next >= totalDuration) next = 0;
//           return next;
//         });
//         lastTime = now;
//       }
//       animationRef.current = requestAnimationFrame(loop);
//     };

//     animationRef.current = requestAnimationFrame(loop);
//     return () => {
//       if (animationRef.current) cancelAnimationFrame(animationRef.current);
//     };
//   }, [isPlaying, totalDuration]);

//   // --- 3. Determine Active Design & Local Time ---
//   const activeItem = schedule.find(item =>
//     globalTime >= item.globalStart && globalTime < item.globalEnd
//   );

//   const localDesignTime = activeItem ? (globalTime - activeItem.globalStart) : 0;

//   // --- 4. Auto-Scale Logic ---
//   useLayoutEffect(() => {
//     if (!containerRef.current || !activeItem) return;
//     const parent = containerRef.current;
//     const { canvasWidth, canvasHeight } = activeItem.designData.metadata;
//     const scaleX = parent.clientWidth / canvasWidth;
//     const scaleY = parent.clientHeight / canvasHeight;
//     setScale(Math.min(scaleX, scaleY));
//   }, [activeItem, containerRef.current?.clientWidth, containerRef.current?.clientHeight]);

//   // --- 5. Controls ---
//   const handleTogglePlay = () => setIsPlaying(!isPlaying);
//   const handleRestart = () => { setGlobalTime(0); setIsPlaying(true); };
//   const handleNext = () => {
//     if (!activeItem) return;
//     const nextIdx = schedule.indexOf(activeItem) + 1;
//     setGlobalTime(nextIdx < schedule.length ? schedule[nextIdx].globalStart : 0);
//   };
//   const handlePrev = () => {
//     if (!activeItem) return;
//     const prevIdx = schedule.indexOf(activeItem) - 1;
//     setGlobalTime(prevIdx >= 0 ? schedule[prevIdx].globalStart : 0);
//   };

//   // --- 6. RENDER ELEMENTS ---
//   const renderDesignElements = () => {
//     if (!activeItem) return null;

//     const elements = activeItem.designData.designJSON.elements;
//     const timeline = activeItem.designData.designJSON.timeline;

//     return elements.map((el: any) => {
//       let displayEl = { ...el };
//       let isVisible = true;

//       if (timeline?.tracks) {
//         const trackItem = timeline.tracks
//           .flatMap((t: any) => t.items)
//           .find((i: any) => i.elementId === el.id);

//         if (trackItem) {
//           if (localDesignTime < trackItem.startTime || localDesignTime >= (trackItem.startTime + trackItem.duration)) {
//             isVisible = false;
//           } else {
//             const progress = (localDesignTime - trackItem.startTime) / trackItem.duration;
//             const sState = trackItem.initialState || {};
//             const eState = trackItem.properties || {};

//             ['x', 'y', 'width', 'height', 'rotation', 'opacity'].forEach(k => {
//               const v1 = sState[k] ?? el[k] ?? 0;
//               const v2 = eState[k] ?? el[k] ?? v1;
//               displayEl[k] = v1 + (v2 - v1) * progress;
//             });

//             displayEl._syncData = {
//               startTime: trackItem.startTime,
//               duration: trackItem.duration,
//               inPoint: trackItem.inPoint || 0
//             };
//           }
//         }
//       }

//       if (!isVisible) return null;

//       const style: React.CSSProperties = {
//         position: 'absolute',
//         left: displayEl.x, top: displayEl.y,
//         width: displayEl.width, height: displayEl.height,
//         transform: `rotate(${displayEl.rotation}deg)`,
//         opacity: displayEl.opacity,
//         zIndex: displayEl.zIndex,
//         borderRadius: displayEl.borderRadius ? `${displayEl.borderRadius}px` : undefined,
//         overflow: 'hidden'
//       };

//       const animClass = getAnimationClass(displayEl.animation);

//       if (displayEl.type === 'video' && displayEl._syncData) {
//         return (
//           <SyncedVideo
//             key={el.id}
//             src={displayEl.content}
//             localTime={localDesignTime}
//             isPlaying={isPlaying}
//             startTime={displayEl._syncData.startTime}
//             duration={displayEl._syncData.duration}
//             inPoint={displayEl._syncData.inPoint}
//             className={animClass}
//             style={{ ...style, objectFit: 'cover' }}
//           />
//         );
//       }

//       if (displayEl.type === 'text') {
//         return (
//           <div key={el.id} style={{
//             ...style,
//             fontSize: displayEl.fontSize, color: displayEl.color, backgroundColor: displayEl.backgroundColor,
//             display: 'flex', alignItems: 'center', justifyContent: displayEl.textStyle?.textAlign || 'center',
//             fontFamily: displayEl.textStyle?.fontFamily,
//             fontWeight: displayEl.textStyle?.bold ? 'bold' : 'normal'
//           }} className={animClass}>
//             {displayEl.content}
//           </div>
//         );
//       }

//       if (displayEl.type === 'image' || displayEl.type === 'gif') {
//         return <img key={el.id} src={displayEl.content} style={{ ...style, objectFit: 'cover' }} className={animClass} />;
//       }

//       if (displayEl.type === 'rect') return <div key={el.id} style={{ ...style, background: displayEl.fillColor, border: `${displayEl.strokeWidth}px solid ${displayEl.strokeColor}` }} className={animClass} />;

//       return <div key={el.id} style={{ ...style, background: displayEl.fillColor || '#ccc' }} />;
//     });
//   };

//   if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center"><RefreshCw className="animate-spin mr-2" /> Loading...</div>;
//   if (error) return <div className="h-screen bg-black text-white flex items-center justify-center"><AlertCircle className="mr-2" /> {error}</div>;

//   return (
//     <div className="fixed inset-0 bg-black flex flex-col">
//       <div className="absolute top-0 w-full p-4 z-50 flex justify-between text-white bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
//         <button onClick={() => window.close()} className="pointer-events-auto flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 backdrop-blur-md">
//           <ArrowLeft size={18} /> Close
//         </button>
//         <div className="text-center">
//           <div className="font-bold text-lg">{playlistName}</div>
//           {activeItem && (
//             <div className="text-xs text-gray-400">
//               {activeItem.designData.metadata.title} ({Math.round(localDesignTime / 1000)}s)
//             </div>
//           )}
//         </div>
//         <div className="w-20"></div>
//       </div>

//       <div ref={containerRef} className="flex-1 flex items-center justify-center bg-gray-950 overflow-hidden relative">
//         {activeItem && (
//           <div
//             style={{
//               width: activeItem.designData.metadata.canvasWidth,
//               height: activeItem.designData.metadata.canvasHeight,
//               backgroundColor: activeItem.designData.metadata.canvasColor,
//               transform: `scale(${scale})`,
//               transformOrigin: 'center center',
//               boxShadow: '0 0 100px rgba(0,0,0,0.5)',
//               position: 'relative',
//               overflow: 'hidden'
//             }}
//           >
//             {renderDesignElements()}
//           </div>
//         )}
//       </div>

//       <div className="absolute bottom-0 w-full p-6 flex flex-col items-center gap-4 bg-gradient-to-t from-black/90 to-transparent pointer-events-auto">
//         <div className="flex items-center gap-6">
//           <button onClick={handlePrev} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full"><SkipBack size={24} /></button>
//           <button onClick={handleTogglePlay} className="p-4 bg-white text-black rounded-full hover:bg-gray-200 transition shadow-lg transform hover:scale-105">
//             {isPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" />}
//           </button>
//           <button onClick={handleRestart} className="p-2 text-gray-300 hover:text-blue-400 hover:bg-white/10 rounded-full"><RotateCcw size={20} /></button>
//           <button onClick={handleNext} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full"><SkipForward size={24} /></button>
//         </div>

//         <div className="w-full max-w-2xl flex items-center gap-3 text-xs font-mono text-gray-400">
//           <span>{(globalTime / 1000).toFixed(0)}s</span>
//           <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden cursor-pointer"
//             onClick={(e) => {
//               const rect = e.currentTarget.getBoundingClientRect();
//               const percent = (e.clientX - rect.left) / rect.width;
//               setGlobalTime(percent * totalDuration);
//             }}
//           >
//             <div
//               className="h-full bg-blue-500 transition-all duration-100 ease-linear"
//               style={{ width: `${(globalTime / totalDuration) * 100}%` }}
//             />
//           </div>
//           <span>{(totalDuration / 1000).toFixed(0)}s</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PlaylistPreview;

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, RotateCcw, RefreshCw, AlertCircle,
  SkipForward, SkipBack, CloudSun, Clock
} from 'lucide-react';
import { getPlaylistDetailsFromBackend } from '../services/playlistService';
import { getAllDesigns, convertBackendToLocal } from '../services/designService';

// ==========================================
// 1. HELPERS & UTILS
// ==========================================

// --- Animation Map ---
const getAnimationClass = (animation?: string) => {
  if (!animation) return '';
  const map: Record<string, string> = {
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
  return map[animation] || '';
};

// --- YouTube Parser ---
const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/, /youtube\.com\/embed\/([^&\s]+)/, /^([a-zA-Z0-9_-]{11})$/];
  const match = patterns.reduce<RegExpMatchArray | null>((acc, pattern) => acc || url.match(pattern), null);
  return match && match[1] ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&controls=0&loop=1&playlist=${match[1]}` : null;
};

// --- Synced Video Component ---
const SyncedVideo = ({ src, localTime, isPlaying, startTime, duration, inPoint = 0, style, className }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Calculate time relative to THIS specific design's timeline
    const videoCurrentTime = localTime - startTime + inPoint;
    const videoTimeSec = videoCurrentTime / 1000;

    // Is the global cursor inside this video clip?
    const isInsideClip = videoCurrentTime >= 0 && videoCurrentTime < duration;

    if (isInsideClip) {
      // Sync Check: If video drifted > 0.15s, snap it back
      if (Math.abs(video.currentTime - videoTimeSec) > 0.15) {
        video.currentTime = videoTimeSec;
      }

      if (isPlaying) {
        if (video.paused) video.play().catch(() => { });
      } else {
        video.pause();
      }
      video.style.opacity = '1';
    } else {
      video.pause();
      // Reset if we rewound before the start
      if (videoCurrentTime < 0) video.currentTime = inPoint / 1000;
    }
  }, [localTime, isPlaying, startTime, duration, inPoint, src]);

  return <video ref={videoRef} src={src} className={className} style={style} muted={false} playsInline />;
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
const PlaylistPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Playlist Data
  const [playlistName, setPlaylistName] = useState('');
  const [schedule, setSchedule] = useState<any[]>([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Playback Engine
  const [globalTime, setGlobalTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const animationRef = useRef<number | null>(null);

  // Viewport
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 1. Load & Build Schedule ---
  useEffect(() => {
    const init = async () => {
      if (!id) return;
      setLoading(true);

      try {
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
            const end = cursor + durationMs;
            cursor += durationMs;

            return {
              ...item,
              designData: matchedDesign,
              globalStart: start,
              globalEnd: end,
              durationMs: durationMs
            };
          }).filter(Boolean);

          setSchedule(builtSchedule);
          setTotalDuration(cursor);
        } else {
          setError("Failed to load playlist data");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  // --- 2. The Global Animation Loop ---
  useEffect(() => {
    if (!isPlaying || totalDuration === 0) return;

    let lastTime = Date.now();
    const loop = () => {
      const now = Date.now();
      const delta = now - lastTime;
      if (delta >= 16) {
        setGlobalTime(prev => {
          let next = prev + delta;
          if (next >= totalDuration) next = 0;
          return next;
        });
        lastTime = now;
      }
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, totalDuration]);

  // --- 3. Determine Active Item & Local Time ---
  const activeItem = schedule.find(item =>
    globalTime >= item.globalStart && globalTime < item.globalEnd
  );

  const localDesignTime = activeItem ? (globalTime - activeItem.globalStart) : 0;

  // --- 4. Auto-Scale Logic ---
  useLayoutEffect(() => {
    if (!containerRef.current || !activeItem) return;
    const parent = containerRef.current;
    const { canvasWidth, canvasHeight } = activeItem.designData.metadata;
    const scaleX = parent.clientWidth / canvasWidth;
    const scaleY = parent.clientHeight / canvasHeight;
    setScale(Math.min(scaleX, scaleY));
  }, [activeItem, containerRef.current?.clientWidth, containerRef.current?.clientHeight]);

  // --- 5. Controls ---
  const handleTogglePlay = () => setIsPlaying(!isPlaying);
  const handleRestart = () => { setGlobalTime(0); setIsPlaying(true); };
  const handleNext = () => {
    if (!activeItem) return;
    const nextIdx = schedule.indexOf(activeItem) + 1;
    setGlobalTime(nextIdx < schedule.length ? schedule[nextIdx].globalStart : 0);
  };
  const handlePrev = () => {
    if (!activeItem) return;
    const prevIdx = schedule.indexOf(activeItem) - 1;
    setGlobalTime(prevIdx >= 0 ? schedule[prevIdx].globalStart : 0);
  };

  // --- 6. Helper: Interpolate Properties ---
  const getInterpolatedElement = (el: any, timeline: any) => {
    // If no timeline exists for this element, return as is
    if (!timeline?.tracks) return el;

    const trackItem = timeline.tracks
      .flatMap((t: any) => t.items)
      .find((i: any) => i.elementId === el.id);

    // If element exists in timeline but is currently not in its time window
    if (trackItem) {
      if (localDesignTime < trackItem.startTime || localDesignTime >= (trackItem.startTime + trackItem.duration)) {
        return null; // Should not be visible
      }

      // Calculation Interpolation
      const progress = (localDesignTime - trackItem.startTime) / trackItem.duration;
      const sState = trackItem.initialState || {};
      const eState = trackItem.properties || {};
      const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

      const newEl = { ...el };

      // Attach sync data for video
      newEl._syncData = {
        startTime: trackItem.startTime,
        duration: trackItem.duration,
        inPoint: trackItem.inPoint || 0
      };

      // Numeric properties
      ['x', 'y', 'width', 'height', 'rotation', 'opacity', 'fontSize', 'borderRadius'].forEach(k => {
        const v1 = sState[k] ?? el[k] ?? 0;
        const v2 = eState[k] ?? el[k] ?? v1;
        newEl[k] = lerp(v1, v2, progress);
      });

      // Color Switching (Step based)
      if (eState.color) newEl.color = eState.color;
      if (eState.backgroundColor) newEl.backgroundColor = eState.backgroundColor;
      if (eState.fillColor) newEl.fillColor = eState.fillColor;

      return newEl;
    }

    return el; // Fallback if no track found
  };

  // --- 7. RENDER ELEMENTS (Robust Switch Case) ---
  const renderDesignElements = () => {
    if (!activeItem) return null;

    const elements = activeItem.designData.designJSON.elements;
    const timeline = activeItem.designData.designJSON.timeline;

    return elements.map((originalEl: any) => {
      // 1. Interpolate Properties based on time
      const activeElement = getInterpolatedElement(originalEl, timeline);
      if (!activeElement) return null; // Element is hidden at this time

      // 2. Common Styles
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
        willChange: 'transform, opacity'
      };

      const animClass = getAnimationClass(activeElement.animation);

      // 3. Switch Case for ALL Element Types
      switch (activeElement.type) {
        // --- TEXT ---
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
              display: 'flex', alignItems: 'center', justifyContent: activeElement.textStyle?.textAlign === 'justify' ? 'center' : (activeElement.textStyle?.textAlign || 'center'),
              whiteSpace: 'pre-wrap', wordBreak: 'break-word'
            }}>
              {activeElement.content}
            </div>
          );

        // --- IMAGES ---
        case 'image':
        case 'gif':
        case 'web_image':
          return (
            <img
              key={activeElement.id}
              src={activeElement.content}
              className={animClass}
              style={{ ...style, objectFit: activeElement.widgetSettings?.fitMode || 'cover' }}
              alt=""
            />
          );

        // --- VIDEOS (Synced) ---
        case 'video':
        case 'web_video':
          if (activeElement._syncData) {
            return (
              <SyncedVideo
                key={activeElement.id}
                src={activeElement.content}
                localTime={localDesignTime}
                isPlaying={isPlaying}
                startTime={activeElement._syncData.startTime}
                duration={activeElement._syncData.duration}
                inPoint={activeElement._syncData.inPoint}
                className={animClass}
                style={{ ...style, objectFit: 'cover' }}
              />
            );
          }
          // Fallback if no timeline data
          return <video key={activeElement.id} src={activeElement.content} className={animClass} style={{ ...style, objectFit: 'cover' }} muted loop autoPlay playsInline />;

        // --- YOUTUBE ---
        case 'youtube':
          const ytUrl = getYouTubeEmbedUrl(activeElement.content);
          return ytUrl ? (
            <iframe key={activeElement.id} src={ytUrl} className={animClass} style={{ ...style, border: 'none', pointerEvents: 'none' }} allow="autoplay; encrypted-media" />
          ) : <div style={{ ...style, background: 'black' }} />;

        // --- BASIC SHAPES ---
        case 'rect': return <div key={activeElement.id} className={animClass} style={{ ...style, backgroundColor: activeElement.fillColor, border: `${activeElement.strokeWidth}px solid ${activeElement.strokeColor}` }} />;
        case 'circle': return <div key={activeElement.id} className={animClass} style={{ ...style, backgroundColor: activeElement.fillColor, borderRadius: '50%', border: `${activeElement.strokeWidth}px solid ${activeElement.strokeColor}` }} />;
        case 'line': return <div key={activeElement.id} style={{ ...style, backgroundColor: activeElement.fillColor, height: '4px' }} className={animClass} />;

        // --- COMPLEX SHAPES (SVG) ---
        case 'triangle': return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="50,10 90,85 10,85" fill={activeElement.fillColor} /></svg>;
        case 'star': return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="50,10 61,40 91,40 67,60 78,90 50,70 22,90 33,60 9,40 39,40" fill={activeElement.fillColor} /></svg>;
        case 'heart': return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><path d="M50,85 C25,70 10,55 10,40 C10,25 20,15 30,15 C40,15 50,25 50,25 C50,25 60,15 70,15 C80,15 90,25 90,40 C90,55 75,70 50,85 Z" fill={activeElement.fillColor} /></svg>;

        // --- WIDGETS ---
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

        // --- FALLBACK ---
        default:
          return <div key={activeElement.id} style={{ ...style, backgroundColor: activeElement.fillColor || '#ccc' }} />;
      }
    });
  };

  if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center"><RefreshCw className="animate-spin mr-2" /> Loading...</div>;
  if (error) return <div className="h-screen bg-black text-white flex items-center justify-center"><AlertCircle className="mr-2" /> {error}</div>;

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top Overlay */}
      <div className="absolute top-0 w-full p-4 z-50 flex justify-between text-white bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <button onClick={() => window.close()} className="pointer-events-auto flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 backdrop-blur-md">
          <ArrowLeft size={18} /> Close
        </button>
        <div className="text-center">
          <div className="font-bold text-lg">{playlistName}</div>
          {activeItem && (
            <div className="text-xs text-gray-400">
              {activeItem.designData.metadata.title} ({Math.round(localDesignTime / 1000)}s)
            </div>
          )}
        </div>
        <div className="w-20"></div>
      </div>

      {/* Main Canvas Area */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center bg-gray-950 overflow-hidden relative">
        {activeItem && (
          <div
            style={{
              width: activeItem.designData.metadata.canvasWidth,
              height: activeItem.designData.metadata.canvasHeight,
              backgroundColor: activeItem.designData.metadata.canvasColor,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              boxShadow: '0 0 100px rgba(0,0,0,0.5)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {renderDesignElements()}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 w-full p-6 flex flex-col items-center gap-4 bg-gradient-to-t from-black/90 to-transparent pointer-events-auto">
        <div className="flex items-center gap-6">
          <button onClick={handlePrev} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full"><SkipBack size={24} /></button>
          <button onClick={handleTogglePlay} className="p-4 bg-white text-black rounded-full hover:bg-gray-200 transition shadow-lg transform hover:scale-105">
            {isPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" />}
          </button>
          <button onClick={handleRestart} className="p-2 text-gray-300 hover:text-blue-400 hover:bg-white/10 rounded-full"><RotateCcw size={20} /></button>
          <button onClick={handleNext} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full"><SkipForward size={24} /></button>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full max-w-2xl flex items-center gap-3 text-xs font-mono text-gray-400">
          <span>{(globalTime / 1000).toFixed(0)}s</span>
          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              setGlobalTime(percent * totalDuration);
            }}
          >
            <div
              className="h-full bg-blue-500 transition-all duration-100 ease-linear"
              style={{ width: `${(globalTime / totalDuration) * 100}%` }}
            />
          </div>
          <span>{(totalDuration / 1000).toFixed(0)}s</span>
        </div>
      </div>
    </div>
  );
};

export default PlaylistPreview;
