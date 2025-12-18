/**
 * Animation Hook
 * React hook for managing element animations
 * 
 * NOTE: Animations should ONLY play in preview mode, not during editing.
 * Use usePreviewMode hook to manage preview/edit mode switching.
 */

import { useCallback, useRef, useEffect } from 'react';
import { animationEngine } from '../services/animationService';
import { ElementAnimation, AnimationConfig } from '../types/animation';

interface UseAnimationOptions {
  /** Auto-play entrance animation on mount (ONLY in preview mode) */
  autoPlay?: boolean;
  /** Element ID */
  elementId: string;
  /** Animation configuration */
  animation?: ElementAnimation;
  /** Callback when animation completes */
  onComplete?: () => void;
}

export function useAnimation({
  autoPlay = false,
  elementId,
  animation,
  onComplete,
}: UseAnimationOptions) {
  const elementRef = useRef<any>(null);
  const hasPlayedEnter = useRef(false);

  /**
   * Play entrance animation
   */
  const playEnter = useCallback(async () => {
    if (!animation?.enabled || !animation.enter || !elementRef.current) {
      return;
    }

    await animationEngine.runAnimation(
      elementId,
      elementRef.current,
      animation.enter,
      onComplete
    );
  }, [elementId, animation, onComplete]);

  /**
   * Play exit animation
   */
  const playExit = useCallback(async () => {
    if (!animation?.enabled || !animation.exit || !elementRef.current) {
      return;
    }

    await animationEngine.runAnimation(
      elementId,
      elementRef.current,
      animation.exit,
      onComplete
    );
  }, [elementId, animation, onComplete]);

  /**
   * Preview animation
   */
  const preview = useCallback(async (config: AnimationConfig) => {
    if (!elementRef.current) return;

    await animationEngine.previewAnimation(elementRef.current, config);
  }, []);

  /**
   * Stop current animation
   */
  const stop = useCallback(() => {
    animationEngine.stopAnimation(elementId);
  }, [elementId]);

  /**
   * Pause current animation
   */
  const pause = useCallback(() => {
    animationEngine.pauseAnimation(elementId);
  }, [elementId]);

  /**
   * Resume paused animation
   */
  const resume = useCallback(() => {
    animationEngine.resumeAnimation(elementId);
  }, [elementId]);

  /**
   * Get current animation state
   */
  const getState = useCallback(() => {
    return animationEngine.getState(elementId);
  }, [elementId]);

  // Auto-play entrance animation on mount
  useEffect(() => {
    if (autoPlay && animation?.enabled && !hasPlayedEnter.current) {
      hasPlayedEnter.current = true;
      playEnter();
    }
  }, [autoPlay, animation?.enabled, playEnter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      animationEngine.stopAnimation(elementId);
    };
  }, [elementId]);

  return {
    elementRef,
    playEnter,
    playExit,
    preview,
    stop,
    pause,
    resume,
    getState,
  };
}

/**
 * Hook for managing animation while dragging
 * Disables animations during drag to prevent conflicts
 */
export function useDragAnimation(elementId: string) {
  const isDragging = useRef(false);

  const onDragStart = useCallback(() => {
    isDragging.current = true;
    animationEngine.stopAnimation(elementId);
  }, [elementId]);

  const onDragEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  return {
    isDragging: isDragging.current,
    onDragStart,
    onDragEnd,
  };
}

/**
 * Hook for batch/group animations
 */
export function useGroupAnimation(groupId: string) {
  const play = useCallback(
    (elements: Array<{ id: string; ref: any }>, config: AnimationConfig, stagger = 100) => {
      const group = {
        id: groupId,
        name: 'Group Animation',
        elementIds: elements.map(e => e.id),
        stagger,
        animation: config,
      };

      animationEngine.runGroupAnimation(
        group,
        elements.map(e => e.ref)
      );
    },
    [groupId]
  );

  const stop = useCallback(() => {
    animationEngine.stopAnimation(groupId);
  }, [groupId]);

  return { play, stop };
}
