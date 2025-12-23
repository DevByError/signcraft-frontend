# CapCut-Style Animation System Documentation

## Architecture Overview

This system implements a **deterministic, JSON-friendly, export-safe** animation engine following CapCut's principles.

## Core Principles

### 1. Time Model ✅

- **Global Timeline Time**: `timelineTimeMs` - absolute time from timeline start
- **Clip-Local Time**: `clipLocalTimeMs = timelineTimeMs - clip.startMs`
- **Animations NEVER use global timeline time** - only clip-local time

```typescript
// CORRECT ✅
const clipLocalTime = timelineTimeMs - clip.startMs;
evaluateAnimation(animation, clipLocalTime);

// WRONG ❌
evaluateAnimation(animation, timelineTimeMs);
```

### 2. Clip Activation Rules ✅

Clips are **only rendered** when:
```
timelineTimeMs >= clip.startMs AND timelineTimeMs <= clip.startMs + clip.durationMs
```

Outside this window:
- Clip does not render
- Opacity = 0
- No animation evaluation

### 3. JSON Animation Schema ✅

All animations defined in pure JSON:

```json
{
  "type": "opacity",
  "delayMs": 0,
  "keyframes": [
    { "timeMs": 0, "value": 0, "easing": "easeOut" },
    { "timeMs": 500, "value": 1, "easing": "linear" }
  ]
}
```

**Supported Animation Types:**
- `opacity` - Fade effects (0-1)
- `position` - Movement (x, y in pixels)
- `scale` - Size changes (x, y multipliers, 1 = 100%)
- `rotation` - Rotation (degrees)

**Easing Functions:**
- `linear` - No easing
- `easeIn` / `easeOut` / `easeInOut` - Quadratic
- `easeInCubic` / `easeOutCubic` / `easeInOutCubic` - Cubic
- `easeInQuad` / `easeOutQuad` / `easeInOutQuad` - Quadratic (aliases)

### 4. Keyframe Evaluation ✅

**Rules:**
1. Keyframes use **clip-local time** starting at 0
2. Linear interpolation between keyframes
3. **Clamp** before first keyframe (return first value)
4. **Clamp** after last keyframe (return last value)
5. Animation time = `clipLocalTimeMs - delayMs`
6. Negative animation time → first keyframe value

```typescript
// Example keyframe evaluation
const keyframes = [
  { timeMs: 0, value: 0 },
  { timeMs: 1000, value: 1 }
];

// At clipLocalTime = -100ms → value = 0 (clamp to first)
// At clipLocalTime = 500ms → value = 0.5 (interpolate)
// At clipLocalTime = 1500ms → value = 1 (clamp to last)
```

### 5. Stateless Rendering ✅

**Every frame** calculated purely from:
1. `timelineTimeMs` - current timeline position
2. Clip JSON data
3. Animation JSON data

**NO state stored between frames**

```typescript
// Pure function - same inputs = same outputs
function renderFrame(timelineTimeMs: number, clip: Clip): RenderResult {
  if (!isClipActive(clip.startMs, clip.durationMs, timelineTimeMs)) {
    return null; // Don't render
  }
  
  const clipLocalTime = timelineTimeMs - clip.startMs;
  return evaluateAnimations(clip.animations, clipLocalTime, clip.baseValues);
}
```

### 6. Playback Engine ✅

Uses **requestAnimationFrame** (not setTimeout/setInterval):

```typescript
useEffect(() => {
  if (timeline.isPlaying) {
    let lastFrameTime = performance.now();
    let currentTimeRef = timeline.currentTime;

    const playbackLoop = (currentFrameTime: number) => {
      const deltaMs = (currentFrameTime - lastFrameTime) * timeline.playbackSpeed;
      lastFrameTime = currentFrameTime;
      currentTimeRef += deltaMs;
      
      updateTimeline(currentTimeRef);
      requestAnimationFrame(playbackLoop);
    };

    requestAnimationFrame(playbackLoop);
  }
}, [timeline.isPlaying]);
```

### 7. Export Compatibility ✅

**Same JSON + Same Logic = Same Output**

Works identically for:
- ✅ Live preview in editor
- ✅ Frame-by-frame export
- ✅ Server-side rendering
- ✅ Video export

No UI-specific code in rendering pipeline.

## API Reference

### Animation Engine (`services/animationEngine.ts`)

#### Core Functions

```typescript
/**
 * Evaluate all animations at clip-local time
 */
evaluateAnimations(
  animations: Animation[],
  clipLocalTimeMs: number,
  baseValues: {
    opacity: number;
    position: { x: number; y: number };
    scale: { x: number; y: number };
    rotation: number;
  }
): EvaluatedAnimations

/**
 * Check if clip is active at timeline time
 */
isClipActive(
  clipStartMs: number,
  clipDurationMs: number,
  timelineTimeMs: number
): boolean

/**
 * Convert global timeline time to clip-local time
 */
getClipLocalTime(
  clipStartMs: number,
  timelineTimeMs: number
): number

/**
 * Complete frame evaluation for a clip
 */
evaluateClipAtTime(
  clip: {
    startMs: number;
    durationMs: number;
    animations: Animation[];
    baseValues: { ... };
  },
  timelineTimeMs: number
): EvaluatedAnimations | null
```

#### Preset Animation Builders

```typescript
createFadeInAnimation(durationMs: number = 500): OpacityAnimation
createFadeOutAnimation(startTimeMs: number, durationMs: number = 500): OpacityAnimation
createSlideInAnimation(from: {x, y}, to: {x, y}, durationMs: number = 800): PositionAnimation
createScaleAnimation(fromScale: {x, y}, toScale: {x, y}, durationMs: number = 600): ScaleAnimation
```

### Property Playback Service (`services/propertyPlaybackService.ts`)

```typescript
/**
 * Apply timeline state to all elements (stateless renderer)
 */
applyTimelineToElements(
  elements: CanvasElement[],
  timeline: Timeline
): CanvasElement[]
```

## Example Usage

### Creating a Clip with Animations

```json
{
  "id": "clip-1",
  "elementId": "element-123",
  "startTime": 0,
  "duration": 3000,
  "animations": [
    {
      "type": "opacity",
      "delayMs": 0,
      "keyframes": [
        { "timeMs": 0, "value": 0, "easing": "easeOut" },
        { "timeMs": 500, "value": 1 }
      ]
    },
    {
      "type": "position",
      "delayMs": 200,
      "keyframes": [
        { "timeMs": 0, "value": { "x": 0, "y": 0 }, "easing": "easeInOut" },
        { "timeMs": 1000, "value": { "x": 100, "y": 50 } }
      ]
    },
    {
      "type": "scale",
      "delayMs": 0,
      "keyframes": [
        { "timeMs": 0, "value": { "x": 0.5, "y": 0.5 }, "easing": "easeOut" },
        { "timeMs": 600, "value": { "x": 1, "y": 1 } }
      ]
    }
  ]
}
```

### Frame Render Pipeline

```typescript
// 1. Get timeline time
const timelineTimeMs = 1500; // 1.5 seconds

// 2. Find active clips
const activeClips = clips.filter(clip => 
  isClipActive(clip.startMs, clip.durationMs, timelineTimeMs)
);

// 3. For each active clip
for (const clip of activeClips) {
  // 4. Convert to clip-local time
  const clipLocalTimeMs = getClipLocalTime(clip.startMs, timelineTimeMs);
  
  // 5. Evaluate animations
  const result = evaluateAnimations(
    clip.animations,
    clipLocalTimeMs,
    clip.baseValues
  );
  
  // 6. Apply to element
  element.opacity = result.opacity;
  element.x = result.position.x;
  element.y = result.position.y;
  element.rotation = result.rotation;
  element.width *= result.scale.x;
  element.height *= result.scale.y;
}
```

## CapCut Behavior Matching

### ✅ Fade-in starts exactly at clip start
- Keyframe at `timeMs: 0` (clip-local) ensures this

### ✅ Animations do not trigger after clip ends
- `isClipActive()` check prevents rendering outside bounds

### ✅ Timeline zoom does not affect timing
- All calculations use milliseconds, not pixels
- UI zoom only affects visual representation

### ✅ Snapping and trimming preserve clip-local keyframes
- Keyframes stored relative to clip start (0)
- Moving clip doesn't change keyframe times

## Migration Guide

### Old System (Legacy)
```typescript
// ❌ Old transition system
{
  transition: {
    fadeIn: 300,
    fadeOut: 300,
    type: 'fade'
  }
}
```

### New System (CapCut Style)
```typescript
// ✅ New keyframe-based animations
{
  animations: [
    {
      type: 'opacity',
      delayMs: 0,
      keyframes: [
        { timeMs: 0, value: 0, easing: 'easeOut' },
        { timeMs: 300, value: 1 }
      ]
    }
  ]
}
```

## Testing

To verify deterministic behavior:

```typescript
// Test 1: Same time = same result
const result1 = evaluateClipAtTime(clip, 1000);
const result2 = evaluateClipAtTime(clip, 1000);
expect(result1).toEqual(result2); // ✅

// Test 2: Clip not active = null
const result3 = evaluateClipAtTime(clip, -100);
expect(result3).toBeNull(); // ✅

// Test 3: Export same as preview
const previewFrame = renderPreview(1000);
const exportFrame = renderExport(1000);
expect(previewFrame).toEqual(exportFrame); // ✅
```

## Benefits

1. **Deterministic** - Same input always produces same output
2. **JSON-Friendly** - All data serializable, no functions
3. **Export-Safe** - Preview = Export guaranteed
4. **Performant** - Pure functions, no state management overhead
5. **Debuggable** - Easy to trace time → result
6. **Testable** - Pure functions easy to unit test
7. **CapCut-Compatible** - Matches professional video editor behavior

## Summary

This system provides a **production-ready, CapCut-style animation engine** with:
- ✅ Clip-local time model
- ✅ JSON-based keyframe animations
- ✅ Stateless rendering
- ✅ RequestAnimationFrame playback
- ✅ Export compatibility
- ✅ Professional video editor behavior

**Timeline is truth. JSON is contract. Renderer is pure math.**
