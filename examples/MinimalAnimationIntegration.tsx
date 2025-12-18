/**
 * Minimal Animation Integration Example
 * 
 * This shows how to add animations that play in PREVIEW MODE ONLY.
 * Animations do NOT play on click or during editing - just like Canva!
 * 
 * Key Concept:
 * - Edit Mode: Configure animations (no playback)
 * - Preview Mode: Play animations (no editing)
 */

import React, { useState } from 'react';
import { applyPreset } from '../constants/animationPresets';
import { quickFadeIn, quickSlide, quickPulse } from '../animation';
import { usePreviewMode } from '../hooks/usePreviewMode';
import { PreviewModeControls } from '../components/PreviewMode';

// ==================== Option 1: Using Presets (Easiest) ====================

export function MinimalPresetExample() {
  const [elements, setElements] = useState<any[]>([
    {
      id: '1',
      type: 'text',
      content: 'Hello World',
      x: 100,
      y: 100,
      animation: applyPreset('fade-in-out'), // ✨ Configure animation
    },
  ]);

  const {
    isPreviewMode,
    isPlaying,
    enterPreviewMode,
    exitPreviewMode,
    playAnimations,
    stopAnimations,
    registerElementRef,
  } = usePreviewMode(elements as any);

  return (
    <div>
      {/* Edit Mode: Add Preview button */}
      {!isPreviewMode && (
        <button onClick={enterPreviewMode}>Preview</button>
      )}

      {/* Canvas - register refs for animation playback */}
      {/* 
      <Text
        ref={(ref) => registerElementRef(element.id, ref)}
        onClick={onSelect} // ✅ Click selects, does NOT animate
        draggable={!isPreviewMode}
      />
      */}

      {/* Preview Mode: Show controls */}
      {isPreviewMode && (
        <PreviewModeControls
          isPlaying={isPlaying}
          onPlay={playAnimations}
          onPause={stopAnimations}
          onStop={stopAnimations}
          onExit={exitPreviewMode}
        />
      )}
    </div>
  );
}

// ==================== Option 2: Using Quick Helpers ====================

export function MinimalQuickHelperExample() {
  const [elements, setElements] = useState([
    {
      id: '1',
      type: 'text',
      content: 'Fade In',
      animation: quickFadeIn(500), // Simple fade
    },
    {
      id: '2',
      type: 'rect',
      content: 'Slide In',
      animation: quickSlide('left', 600), // Slide from left
    },
    {
      id: '3',
      type: 'circle',
      content: 'Pulse',
      animation: quickPulse(1000), // Looping pulse
    },
  ]);

  return <div>{/* Your canvas rendering here */}</div>;
}

// ==================== Option 3: Manual Configuration ====================

export function MinimalManualExample() {
  const [elements, setElements] = useState([
    {
      id: '1',
      type: 'text',
      content: 'Custom Animation',
      animation: {
        enabled: true,
        enter: {
          type: 'fadeIn',
          duration: 500,
          delay: 0,
          easing: 'ease-out',
          repeat: 1,
        },
      },
    },
  ]);

  return <div>{/* Your canvas rendering here */}</div>;
}

// ==================== Option 4: Add Animation Panel (Recommended) ====================

import { AnimationPanel } from '../components/AnimationPanel';

export function MinimalWithPanel() {
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedElement = elements.find(el => el.id === selectedId);

  const updateElement = (id: string, updates: any) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* Your canvas */}
      <div style={{ flex: 1 }}>
        {/* Canvas rendering */}
      </div>

      {/* Animation Panel */}
      <div style={{ width: 320, borderLeft: '1px solid #e5e7eb' }}>
        <AnimationPanel
          elementId={selectedId}
          elementAnimation={selectedElement?.animation}
          onAnimationChange={(animation) => {
            if (selectedId) {
              updateElement(selectedId, { animation });
            }
          }}
        />
      </div>
    </div>
  );
}

// ==================== Option 5: Add Quick Preset Buttons ====================

export function MinimalWithPresetButtons() {
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const applyQuickAnimation = (presetId: string) => {
    if (!selectedId) return;
    
    const animation = applyPreset(presetId);
    setElements(prev =>
      prev.map(el => (el.id === selectedId ? { ...el, animation } : el))
    );
  };

  return (
    <div>
      {/* Quick Preset Buttons */}
      <div style={{ padding: 10, background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => applyQuickAnimation('fade-in-out')}>
          Fade
        </button>
        <button onClick={() => applyQuickAnimation('slide-from-left')}>
          Slide
        </button>
        <button onClick={() => applyQuickAnimation('scale-pop')}>
          Pop
        </button>
        <button onClick={() => applyQuickAnimation('pulse-continuous')}>
          Pulse
        </button>
      </div>

      {/* Your canvas */}
      <div>{/* Canvas rendering */}</div>
    </div>
  );
}

// ==================== Integration into Your Existing Editor ====================

/**
 * To integrate into your existing Editor.tsx or Creative.tsx:
 * 
 * IMPORTANT: Animations do NOT play on click - they play in Preview Mode only!
 * 
 * 1. Add animation property to your element state:
 *    ✅ Already done in types.ts
 * 
 * 2. Choose ONE of these options:
 *    - Option A: Add AnimationPanel to sidebar (recommended)
 *    - Option B: Add preset buttons to toolbar (quick wins)
 * 
 * 3. Add Preview Mode:
 *    - Import usePreviewMode hook
 *    - Add "Preview" button to toolbar
 *    - Register element refs with registerElementRef
 *    - Add PreviewModeControls component
 * 
 * 4. Disable interactions in preview:
 *    <Element
 *      draggable={!isPreviewMode}
 *      onClick={() => !isPreviewMode && onSelect()}
 *    />
 * 
 * 5. Save/Load: Animations automatically save with element data
 *    await saveDesignToFirestore({ elements }); // animation included!
 * 
 * SEE: examples/EditorWithPreviewMode.tsx for complete example
 * SEE: ANIMATION_PREVIEW_MODE.md for full documentation
 */

// ==================== Copy-Paste Ready: Add to Your Editor ====================

export const COPY_PASTE_INTEGRATION = `
// 1. Import at top of your file
import { AnimationPanel } from '../components/AnimationPanel';
import { usePreviewMode } from '../hooks/usePreviewMode';
import { PreviewModeControls } from '../components/PreviewMode';
import { Eye } from 'lucide-react';

// 2. Add preview mode hook
const {
  isPreviewMode,
  isPlaying,
  enterPreviewMode,
  exitPreviewMode,
  playAnimations,
  stopAnimations,
  registerElementRef,
} = usePreviewMode(elements);

// 3. Add preview button to toolbar
{!isPreviewMode && (
  <button onClick={enterPreviewMode}>
    <Eye size={18} />
    Preview
  </button>
)}

// 4. Register element refs for animation
<Text
  ref={(ref) => registerElementRef(element.id, ref)}
  onClick={() => !isPreviewMode && onSelectElement(element.id)}
  draggable={!isPreviewMode}
  // ... other props
/>

// 5. Add preview controls
{isPreviewMode && (
  <PreviewModeControls
    isPlaying={isPlaying}
    onPlay={playAnimations}
    onStop={stopAnimations}
    onExit={exitPreviewMode}
  />
)}

// 6. Add AnimationPanel to sidebar (only in edit mode)
{!isPreviewMode && (
  <AnimationPanel
    elementId={selectedElement?.id || null}
  elementAnimation={selectedElement?.animation}
  onAnimationChange={(animation) => {
    if (selectedElement) {
      updateElement(selectedElement.id, { animation });
    }
  }}
/>

// 4. Optional: Add quick preset button
<button onClick={() => {
  const animation = applyPreset('fade-in-out');
  updateElement(selectedElement.id, { animation });
}}>
  Add Fade Animation
</button>

// That's it! 🎉
`;

// ==================== 10-Second Integration ====================

/**
 * The absolute fastest way to see animations working:
 */

export function TenSecondIntegration() {
  const [element] = useState({
    id: '1',
    type: 'text',
    content: 'I fade in!',
    animation: quickFadeIn(), // ← ADD THIS LINE
  });

  // That's literally it. The element will fade in when rendered.
  return <div>{/* Your existing rendering code */}</div>;
}
