import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { getPlaylistById } from '../services/playlistService';
import { getDesignById } from '../services/designService';
import type { PlaylistDocument } from '../services/playlistService';
import type { FirestoreDesignDocument } from '../services/designService';

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
    // Featured
    'Shake Zoom': 'animate-shake-zoom',
    'Whip Slide': 'animate-whip-slide',
    'Old TV': 'animate-old-tv',
    'Chroma Wave': 'animate-chroma-wave',
    // Reveal
    'Brush': 'animate-brush',
    'Ink': 'animate-ink',
    'Digital': 'animate-digital',
    'Spray Paint': 'animate-spray-paint',
    'Sketch': 'animate-sketch',
    'Gradient': 'animate-gradient',
    // General
    'Rise': 'animate-rise',
    'Pan': 'animate-pan',
    'Fade': 'animate-fade',
    'Pop': 'animate-pop',
    'Wipe': 'animate-wipe',
    'Blur': 'animate-blur',
    'Succession': 'animate-succession',
    'Breathe': 'animate-breathe',
    'Baseline': 'animate-baseline',
    'Drift': 'animate-drift',
    'Tectonic': 'animate-tectonic',
    'Tumble': 'animate-tumble',
    'Neon': 'animate-neon',
    'Scrapbook': 'animate-scrapbook',
    'Stomp': 'animate-stomp',
    // Add-on Effects
    'Rotate': 'animate-rotate-effect',
    'Flicker': 'animate-flicker',
    'Pulse': 'animate-pulse-effect',
    'Wiggle': 'animate-wiggle-effect',
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

const PlaylistPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [playlist, setPlaylist] = useState<PlaylistDocument | null>(null);
  const [designs, setDesigns] = useState<FirestoreDesignDocument[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Load playlist and all designs
  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        if (!id) {
          setError('No playlist ID provided');
          return;
        }

        const playlistDoc = await getPlaylistById(id);
        if (!playlistDoc) {
          setError('Playlist not found');
          return;
        }

        setPlaylist(playlistDoc);

        // Load all designs referenced in the playlist
        const loadedDesigns: FirestoreDesignDocument[] = [];
        for (const ref of playlistDoc.designReferences) {
          const design = await getDesignById(ref.designId);
          if (design) {
            loadedDesigns.push(design);
          }
        }

        setDesigns(loadedDesigns);
        
        if (loadedDesigns.length > 0 && playlistDoc.designReferences.length > 0) {
          setTimeRemaining(playlistDoc.designReferences[0].duration);
        }

        console.log('✅ Playlist loaded:', playlistDoc.name, 'with', loadedDesigns.length, 'designs');
      } catch (err) {
        console.error('❌ Error loading playlist:', err);
        setError(`Failed to load playlist: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadPlaylist();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [id]);

  // Slideshow auto-advance
  useEffect(() => {
    if (!isPlaying || !playlist || designs.length === 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    const currentDesignRef = playlist.designReferences[currentIndex];
    if (!currentDesignRef) return;

    const duration = currentDesignRef.duration * 1000; // Convert to milliseconds
    setTimeRemaining(currentDesignRef.duration);

    // Countdown timer (updates every second)
    countdownRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        return newTime < 0 ? 0 : newTime;
      });
    }, 1000);

    // Auto-advance timer
    timerRef.current = setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % playlist.designReferences.length);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [currentIndex, isPlaying, playlist, designs]);

  const handleNext = () => {
    if (!playlist) return;
    setCurrentIndex(prev => (prev + 1) % playlist.designReferences.length);
  };

  const handlePrevious = () => {
    if (!playlist) return;
    setCurrentIndex(prev => (prev - 1 + playlist.designReferences.length) % playlist.designReferences.length);
  };

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
      borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
      overflow: 'hidden',
    };

    const animationClass = getAnimationClass(element.animation);

    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id}
            className={animationClass}
            style={{
              ...baseStyle,
              fontSize: `${element.fontSize}px`,
              color: element.color,
              backgroundColor: element.backgroundColor,
              fontWeight: element.textStyle?.bold ? 'bold' : 'normal',
              fontStyle: element.textStyle?.italic ? 'italic' : 'normal',
              textDecoration: element.textStyle?.underline ? 'underline' : 'none',
              textAlign: element.textStyle?.textAlign || 'left',
              fontFamily: element.textStyle?.fontFamily || 'Arial',
              letterSpacing: `${element.textStyle?.letterSpacing || 0}px`,
              lineHeight: element.textStyle?.lineHeight || 1.2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {element.content}
          </div>
        );
      case 'html':
        return (
          <iframe
            key={element.id}
            srcDoc={element.content || '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#666;">No HTML content</div>'}
            className={animationClass}
            style={{
              ...baseStyle,
              border: 'none',
            }}
            sandbox="allow-scripts allow-same-origin"
          />
        );

      case 'video':
      case 'web-video':
        return element.content && (element.content.startsWith('http') || element.content.startsWith('blob:')) ? (
          <video 
            key={element.id}
            className={animationClass}
            src={element.content}
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
        return element.content && element.content.startsWith('http') ? (
          <img
            key={element.id}
            className={animationClass}
            src={element.content}
            alt="Media"
            style={{
              ...baseStyle,
              objectFit: 'cover',
            }}
          />
        ) : null;

      case 'instagram':
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
      case 'rectangle':
      case 'rect':
        return (
          <div
            key={element.id}
            className={animationClass}
            style={{
              ...baseStyle,
              backgroundColor: element.fillColor,
              borderRadius: `${element.borderRadius || 0}px`,
              border: element.strokeWidth ? `${element.strokeWidth}px solid ${element.strokeColor}` : 'none',
            }}
          />
        );
      case 'triangle':
        return (
          <svg
            key={element.id}
            viewBox="0 0 100 100"
            className={animationClass}
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
            className={animationClass}
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
            className={animationClass}
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
            className={animationClass}
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
            className={animationClass}
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
            className={animationClass}
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
            className={animationClass}
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
            className={animationClass}
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
            className={animationClass}
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
            className={animationClass}
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
            className={animationClass}
            style={{
              ...baseStyle,
              overflow: 'visible',
            }}
          >
            <line x1="0" y1="2" x2="100" y2="2" stroke={element.fillColor || '#000000'} strokeWidth="4" />
          </svg>
        );
        return (
          <img
            key={element.id}
            className={animationClass}
            src={element.content}
            alt="Design element"
            style={{
              ...baseStyle,
              objectFit: 'cover',
              borderRadius: `${element.borderRadius || 0}px`,
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
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <h3 className="text-2xl font-semibold text-white mb-2">Loading Playlist</h3>
          <p className="text-gray-400">Preparing your slideshow...</p>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-white mb-2">Error</h3>
          <p className="text-gray-400 mb-6">{error || 'Playlist not found'}</p>
          <button
            onClick={() => navigate('/playlist')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
          >
            Back to Playlists
          </button>
        </div>
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-white mb-2">Empty Playlist</h3>
          <p className="text-gray-400 mb-6">This playlist has no designs</p>
          <button
            onClick={() => navigate(`/playlist/edit/${id}`)}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
          >
            Add Designs
          </button>
        </div>
      </div>
    );
  }

  const currentDesign = designs[currentIndex];
  const currentDuration = playlist.designReferences[currentIndex]?.duration || 5;

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top Control Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/playlist')}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={20} />
            Exit Preview
          </button>
          
          <div className="text-white text-center">
            <h2 className="text-xl font-bold">{playlist.name}</h2>
            <p className="text-sm text-gray-300">
              {currentIndex + 1} / {playlist.designReferences.length}
            </p>
          </div>

          <div className="text-white text-right">
            <p className="text-sm text-gray-300">Next in</p>
            <p className="text-2xl font-bold">{timeRemaining}s</p>
          </div>
        </div>
      </div>

      {/* Canvas Display */}
      <div className="flex-1 flex items-center justify-center">
        {currentDesign && (
          <div
            style={{
              width: `${currentDesign.metadata.canvasWidth}px`,
              height: `${currentDesign.metadata.canvasHeight}px`,
              backgroundColor: currentDesign.metadata.canvasColor,
              position: 'relative',
              maxWidth: '100vw',
              maxHeight: '100vh',
              objectFit: 'contain',
            }}
          >
            {currentDesign.designJSON.elements.map(element => renderElement(element))}
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-10">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrevious}
            className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
          >
            <SkipBack size={24} />
          </button>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-4 bg-primary hover:bg-primaryLight text-white rounded-full transition-colors"
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>
          
          <button
            onClick={handleNext}
            className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
          >
            <SkipForward size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-white/20 rounded-full h-1 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-1000 ease-linear"
            style={{
              width: `${((currentDuration - timeRemaining) / currentDuration) * 100}%`
            }}
          />
        </div>

        {/* Current Design Info */}
        <div className="mt-3 text-center text-white">
          <p className="text-sm opacity-80">{currentDesign?.metadata.title}</p>
        </div>
      </div>
    </div>
  );
};

export default PlaylistPreview;
