/**
 * Animation Playback Manager
 * Handles animation playback in preview/presentation mode (like Canva)
 * Animations do NOT play during editing - only in preview mode
 */

import { animationEngine } from '../services/animationService';
import { CanvasElement } from '../types/canvas';

interface PlaybackOptions {
  /** Loop the animation sequence */
  loop?: boolean;
  /** Delay between loops (ms) */
  loopDelay?: number;
  /** Callback when playback completes */
  onComplete?: () => void;
  /** Callback for each element animation */
  onElementStart?: (elementId: string) => void;
}

class AnimationPlaybackManager {
  private isPlaying = false;
  private isPaused = false;
  private currentLoopTimeout?: NodeJS.Timeout;

  /**
   * Enter preview mode and play all animations
   * This is like Canva's "Play" button
   */
  async playDesign(
    elements: CanvasElement[],
    elementRefs: Map<string, any>,
    options: PlaybackOptions = {}
  ): Promise<void> {
    if (this.isPlaying) {
      console.warn('Playback already in progress');
      return;
    }

    this.isPlaying = true;
    this.isPaused = false;

    await this.playSequence(elements, elementRefs, options);

    // Handle looping
    if (options.loop && !this.isPaused) {
      this.currentLoopTimeout = setTimeout(() => {
        this.playDesign(elements, elementRefs, options);
      }, options.loopDelay || 1000);
    } else {
      this.isPlaying = false;
      options.onComplete?.();
    }
  }

  /**
   * Play animations in sequence
   */
  private async playSequence(
    elements: CanvasElement[],
    elementRefs: Map<string, any>,
    options: PlaybackOptions
  ): Promise<void> {
    // Get elements with animations, sorted by delay
    const animatedElements = elements
      .filter(el => el.animation?.enabled && el.animation.enter)
      .sort((a, b) => {
        const delayA = a.animation?.enter?.delay || 0;
        const delayB = b.animation?.enter?.delay || 0;
        return delayA - delayB;
      });

    // Play all animations (they handle their own delays)
    const promises = animatedElements.map(async element => {
      const ref = elementRefs.get(element.id);
      if (!ref || !element.animation?.enter) return;

      options.onElementStart?.(element.id);

      await animationEngine.runAnimation(
        element.id,
        ref,
        element.animation.enter
      );
    });

    await Promise.all(promises);
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    
    if (this.currentLoopTimeout) {
      clearTimeout(this.currentLoopTimeout);
      this.currentLoopTimeout = undefined;
    }

    animationEngine.stopAll();
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.isPlaying) return;
    
    this.isPaused = true;
    // Note: Individual element pausing would need element IDs tracked
  }

  /**
   * Resume playback
   */
  resume(): void {
    if (!this.isPaused) return;
    
    this.isPaused = false;
    // Note: Individual element resuming would need element IDs tracked
  }

  /**
   * Check if currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Check if paused
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Reset all elements to initial state
   */
  resetElements(elements: CanvasElement[], elementRefs: Map<string, any>): void {
    elements.forEach(element => {
      const ref = elementRefs.get(element.id);
      if (!ref) return;

      // Reset to original position/state
      // This depends on your Konva/canvas implementation
      ref.clearCache?.();
    });
  }
}

export const playbackManager = new AnimationPlaybackManager();

/**
 * Hook for managing preview mode
 */
import { useState, useCallback, useRef } from 'react';

export function usePreviewMode(elements: CanvasElement[]) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const elementRefsMap = useRef<Map<string, any>>(new Map());

  /**
   * Register element ref for animation playback
   */
  const registerElementRef = useCallback((id: string, ref: any) => {
    if (ref) {
      elementRefsMap.current.set(id, ref);
    }
  }, []);

  /**
   * Enter preview mode (like Canva's present mode)
   */
  const enterPreviewMode = useCallback(() => {
    setIsPreviewMode(true);
  }, []);

  /**
   * Exit preview mode
   */
  const exitPreviewMode = useCallback(() => {
    setIsPreviewMode(false);
    setIsPlaying(false);
    playbackManager.stop();
  }, []);

  /**
   * Play animations in preview mode
   */
  const playAnimations = useCallback(async () => {
    if (!isPreviewMode) {
      console.warn('Must be in preview mode to play animations');
      return;
    }

    setIsPlaying(true);

    await playbackManager.playDesign(elements, elementRefsMap.current, {
      loop: false,
      onComplete: () => {
        setIsPlaying(false);
      },
    });
  }, [isPreviewMode, elements]);

  /**
   * Stop animations
   */
  const stopAnimations = useCallback(() => {
    playbackManager.stop();
    setIsPlaying(false);
  }, []);

  /**
   * Toggle play/pause
   */
  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopAnimations();
    } else {
      playAnimations();
    }
  }, [isPlaying, playAnimations, stopAnimations]);

  return {
    // State
    isPreviewMode,
    isPlaying,
    
    // Mode control
    enterPreviewMode,
    exitPreviewMode,
    
    // Playback control
    playAnimations,
    stopAnimations,
    togglePlayback,
    
    // Ref management
    registerElementRef,
  };
}
