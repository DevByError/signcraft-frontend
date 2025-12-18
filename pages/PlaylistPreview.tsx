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
}

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
    };

    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              fontSize: `${element.fontSize}px`,
              color: element.color,
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
      case 'rectangle':
        return (
          <div
            key={element.id}
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
        return (
          <img
            key={element.id}
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
