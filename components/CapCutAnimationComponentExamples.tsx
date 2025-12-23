/**
 * CapCut Animation System - React Component Examples
 * 
 * Demonstrates how to integrate the animation system with React UI components
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  evaluateClipAtTime,
  isClipActive,
  getClipLocalTime,
} from '../services/CapCutAnimationEngine';
import {
  getInAnimationBuilder,
  getOutAnimationBuilder,
} from '../services/CapCutAnimationPresetBuilder';
import {
  IN_ANIMATION_LIST,
  OUT_ANIMATION_LIST,
} from '../constants/CapCutAnimationPresets';
import type { Animation } from '../types/animation';

// ==================== ANIMATION SELECTOR COMPONENT ====================

/**
 * UI Component: Dropdown selectors for IN and OUT animations
 * 
 * Responsibilities:
 * - Display UI dropdowns
 * - Call preset builders when selection changes
 * - Emit animation updates to parent
 * 
 * Does NOT evaluate animations (that's the engine's job)
 */
interface AnimationSelectorProps {
  clipDurationMs: number;
  inAnimationDuration?: number;
  outAnimationDuration?: number;
  onInAnimationChange: (animation: Animation | null) => void;
  onOutAnimationChange: (animation: Animation | null) => void;
  defaultInAnimation?: string;
  defaultOutAnimation?: string;
}

export function AnimationSelector({
  clipDurationMs,
  inAnimationDuration = 500,
  outAnimationDuration = 400,
  onInAnimationChange,
  onOutAnimationChange,
  defaultInAnimation = 'Fade In',
  defaultOutAnimation = 'Fade Out',
}: AnimationSelectorProps) {
  const [selectedIn, setSelectedIn] = useState(defaultInAnimation);
  const [selectedOut, setSelectedOut] = useState(defaultOutAnimation);

  const handleInChange = (presetName: string) => {
    setSelectedIn(presetName);
    const animation = getInAnimationBuilder(presetName, inAnimationDuration);
    onInAnimationChange(animation);
  };

  const handleOutChange = (presetName: string) => {
    setSelectedOut(presetName);
    let animation = getOutAnimationBuilder(presetName, outAnimationDuration);
    
    // CRITICAL: Configure OUT animation timing
    if (animation) {
      animation = {
        ...animation,
        delayMs: clipDurationMs - outAnimationDuration,
      };
    }
    
    onOutAnimationChange(animation);
  };

  return (
    <div className="animation-selector">
      <div className="animation-group">
        <label htmlFor="in-animation">IN Animation:</label>
        <select
          id="in-animation"
          value={selectedIn}
          onChange={(e) => handleInChange(e.target.value)}
        >
          <option value="">None</option>
          {IN_ANIMATION_LIST.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="animation-group">
        <label htmlFor="out-animation">OUT Animation:</label>
        <select
          id="out-animation"
          value={selectedOut}
          onChange={(e) => handleOutChange(e.target.value)}
        >
          <option value="">None</option>
          {OUT_ANIMATION_LIST.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <style>{`
        .animation-selector {
          display: flex;
          gap: 20px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        
        .animation-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .animation-group label {
          font-weight: 600;
          font-size: 14px;
        }
        
        .animation-group select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

// ==================== ANIMATED CLIP RENDERER ====================

/**
 * UI Component: Renders a clip with animations applied
 * 
 * Responsibilities:
 * - Accept clip data and timeline time
 * - Call evaluateClipAtTime() to get animation values
 * - Apply transforms to DOM element
 * - Handle visibility based on clip active state
 * 
 * Does NOT store animation state (pure rendering)
 */
interface AnimatedClipProps {
  clip: {
    id: string;
    startMs: number;
    durationMs: number;
    animations: Animation[];
    baseValues: {
      opacity: number;
      position: { x: number; y: number };
      scale: { x: number; y: number };
      rotation: number;
    };
  };
  timelineTimeMs: number;
  children?: React.ReactNode;
  className?: string;
}

export function AnimatedClip({
  clip,
  timelineTimeMs,
  children,
  className = '',
}: AnimatedClipProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Evaluate animations at current timeline time
    const result = evaluateClipAtTime(clip, timelineTimeMs);

    if (result === null) {
      // Clip is not active
      ref.current.style.display = 'none';
    } else {
      // Clip is active - apply animation values
      ref.current.style.display = 'block';
      ref.current.style.opacity = String(Math.max(0, Math.min(1, result.opacity)));

      // Build CSS transform
      const transforms = [
        `translate(${result.position.x}px, ${result.position.y}px)`,
        `scale(${result.scale.x}, ${result.scale.y})`,
        `rotate(${result.rotation}deg)`,
      ];

      ref.current.style.transform = transforms.join(' ');
      ref.current.style.transformOrigin = 'center center';
      ref.current.style.willChange = 'transform, opacity';
    }
  }, [clip, timelineTimeMs]);

  return (
    <div
      ref={ref}
      className={`animated-clip ${className}`}
      data-clip-id={clip.id}
    >
      {children}
    </div>
  );
}

// ==================== TIMELINE PLAYBACK COMPONENT ====================

/**
 * UI Component: Timeline player with animation preview
 * 
 * Manages:
 * - Timeline playback (play/pause/seek)
 * - Frame rate (60 FPS via requestAnimationFrame)
 * - Clip rendering with animations
 */
interface TimelinePlayerProps {
  clips: Parameters<typeof AnimatedClip>[0]['clip'][];
  durationMs: number;
  onTimeChange?: (timeMs: number) => void;
}

export function TimelinePlayer({
  clips,
  durationMs,
  onTimeChange,
}: TimelinePlayerProps) {
  const [timelineTimeMs, setTimelineTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number>(0);

  // Playback loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const playbackLoop = (currentFrameTime: number) => {
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = currentFrameTime;
      }

      const deltaMs = currentFrameTime - lastFrameTimeRef.current;
      lastFrameTimeRef.current = currentFrameTime;

      setTimelineTimeMs((prev) => {
        const newTime = prev + deltaMs;
        return newTime >= durationMs ? 0 : newTime; // Loop at end
      });

      animationFrameRef.current = requestAnimationFrame(playbackLoop);
    };

    animationFrameRef.current = requestAnimationFrame(playbackLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastFrameTimeRef.current = 0;
    };
  }, [isPlaying, durationMs]);

  // Notify parent of time changes
  useEffect(() => {
    onTimeChange?.(timelineTimeMs);
  }, [timelineTimeMs, onTimeChange]);

  return (
    <div className="timeline-player">
      <div className="timeline-controls">
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <div className="timeline-info">
          <span>{(timelineTimeMs / 1000).toFixed(2)}s</span>
          <span> / {(durationMs / 1000).toFixed(2)}s</span>
        </div>

        <input
          type="range"
          min="0"
          max={durationMs}
          value={timelineTimeMs}
          onChange={(e) => {
            setTimelineTimeMs(Number(e.target.value));
            setIsPlaying(false);
          }}
          style={{ flex: 1 }}
        />
      </div>

      <div className="timeline-preview">
        <div className="clip-container">
          {clips.map((clip) => (
            <AnimatedClip
              key={clip.id}
              clip={clip}
              timelineTimeMs={timelineTimeMs}
              className="preview-clip"
            >
              <div className="clip-label">{clip.id}</div>
            </AnimatedClip>
          ))}
        </div>
      </div>

      <style>{`
        .timeline-player {
          padding: 20px;
          background: #fafafa;
          border-radius: 8px;
          border: 1px solid #ddd;
        }

        .timeline-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          align-items: center;
        }

        .timeline-controls button {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .timeline-controls button:hover {
          background: #0056b3;
        }

        .timeline-info {
          font-size: 14px;
          font-weight: 600;
          min-width: 120px;
        }

        .timeline-controls input[type='range'] {
          height: 6px;
          border-radius: 3px;
          cursor: pointer;
        }

        .timeline-preview {
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 20px;
          min-height: 200px;
          position: relative;
        }

        .clip-container {
          position: relative;
          width: 100%;
          height: 150px;
        }

        .animated-clip {
          position: absolute;
          width: 100px;
          height: 100px;
          background: #007bff;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 12px;
          transition: none; /* Important: don't animate with CSS */
        }

        .preview-clip {
          opacity: 0;
        }

        .clip-label {
          font-size: 10px;
          white-space: nowrap;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

// ==================== COMPLETE EXAMPLE ====================

/**
 * Full example: Editor with animations
 */
export function AnimationEditor() {
  const [clips, setClips] = useState([
    {
      id: 'clip-1',
      startMs: 0,
      durationMs: 3000,
      animations: [] as Animation[],
      baseValues: {
        opacity: 1,
        position: { x: 0, y: 0 },
        scale: { x: 1, y: 1 },
        rotation: 0,
      },
    },
  ]);

  const [selectedClipId, setSelectedClipId] = useState('clip-1');

  const selectedClip = clips.find((c) => c.id === selectedClipId);

  const handleInAnimationChange = (animation: Animation | null) => {
    setClips((prev) =>
      prev.map((clip) =>
        clip.id === selectedClipId
          ? {
              ...clip,
              animations: animation
                ? [animation, ...clip.animations.filter((a) => a.type !== 'opacity' && a.type !== 'scale')]
                : clip.animations.filter((a) => a.type !== 'opacity' && a.type !== 'scale'),
            }
          : clip
      )
    );
  };

  const handleOutAnimationChange = (animation: Animation | null) => {
    setClips((prev) =>
      prev.map((clip) =>
        clip.id === selectedClipId
          ? {
              ...clip,
              animations: animation
                ? [...clip.animations.filter((a) => !(a.delayMs > clip.durationMs / 2)), animation]
                : clip.animations,
            }
          : clip
      )
    );
  };

  return (
    <div className="animation-editor">
      <h1>CapCut Animation Editor</h1>

      {selectedClip && (
        <>
          <AnimationSelector
            clipDurationMs={selectedClip.durationMs}
            inAnimationDuration={500}
            outAnimationDuration={400}
            onInAnimationChange={handleInAnimationChange}
            onOutAnimationChange={handleOutAnimationChange}
          />

          <TimelinePlayer clips={clips} durationMs={5000} />
        </>
      )}

      <style>{`
        .animation-editor {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .animation-editor h1 {
          color: #333;
          margin-bottom: 30px;
        }
      `}</style>
    </div>
  );
}

// ==================== EXPORT EXAMPLES ====================

/**
 * Example: Save clip to JSON
 */
export function saveClipToJSON(clip: Parameters<typeof AnimatedClip>[0]['clip']) {
  const json = JSON.stringify(clip, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${clip.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Example: Load clip from JSON
 */
export async function loadClipFromJSON(
  file: File
): Promise<Parameters<typeof AnimatedClip>[0]['clip'] | null> {
  try {
    const text = await file.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to load clip:', error);
    return null;
  }
}

// ==================== DEBUGGING COMPONENT ====================

/**
 * Component to visualize animation evaluation in real-time
 */
interface AnimationDebuggerProps {
  clip: Parameters<typeof AnimatedClip>[0]['clip'];
  timelineTimeMs: number;
}

export function AnimationDebugger({
  clip,
  timelineTimeMs,
}: AnimationDebuggerProps) {
  const result = evaluateClipAtTime(clip, timelineTimeMs);
  const clipLocalTime = getClipLocalTime(clip.startMs, timelineTimeMs);
  const isActive = result !== null;

  return (
    <div className="animation-debugger">
      <h3>Animation Debug Info</h3>

      <div className="debug-grid">
        <div className="debug-item">
          <label>Timeline Time:</label>
          <code>{timelineTimeMs.toFixed(0)}ms</code>
        </div>

        <div className="debug-item">
          <label>Clip Local Time:</label>
          <code>{clipLocalTime.toFixed(0)}ms</code>
        </div>

        <div className="debug-item">
          <label>Clip Active:</label>
          <code>{isActive ? '✓ Yes' : '✗ No'}</code>
        </div>

        {isActive && result && (
          <>
            <div className="debug-item">
              <label>Opacity:</label>
              <code>{result.opacity.toFixed(3)}</code>
            </div>

            <div className="debug-item">
              <label>Position:</label>
              <code>
                x: {result.position.x.toFixed(1)}, y: {result.position.y.toFixed(1)}
              </code>
            </div>

            <div className="debug-item">
              <label>Scale:</label>
              <code>
                x: {result.scale.x.toFixed(2)}, y: {result.scale.y.toFixed(2)}
              </code>
            </div>

            <div className="debug-item">
              <label>Rotation:</label>
              <code>{result.rotation.toFixed(1)}°</code>
            </div>
          </>
        )}
      </div>

      <style>{`
        .animation-debugger {
          background: #f0f0f0;
          border: 1px solid #999;
          border-radius: 4px;
          padding: 15px;
          font-family: monospace;
          font-size: 12px;
        }

        .animation-debugger h3 {
          margin: 0 0 15px 0;
          font-family: sans-serif;
        }

        .debug-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .debug-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .debug-item label {
          font-weight: 600;
          font-family: sans-serif;
        }

        .debug-item code {
          background: white;
          padding: 4px 8px;
          border-radius: 2px;
          border: 1px solid #ccc;
        }
      `}</style>
    </div>
  );
}
