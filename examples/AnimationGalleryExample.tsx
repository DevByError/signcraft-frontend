/**
 * Example: Using Animation Preset Gallery
 * Canva-style visual preset picker
 */

import React, { useState } from 'react';
import { AnimationPresetGallery } from '../components/AnimationPresetGallery';
import { applyPreset } from '../constants/animationPresets';
import { CanvasElement, ElementType } from '../types';

export function AnimationGalleryExample() {
  const [elements, setElements] = useState<CanvasElement[]>([
    {
      id: '1',
      type: ElementType.TEXT,
      content: 'Hello World',
      x: 100,
      y: 100,
      fontSize: 48,
      color: '#000',
      width: 200,
      height: 60,
      opacity: 1,
      rotation: 0,
      zIndex: 1,
      locked: false,
      visible: true,
    },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>('1');
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>();

  const handleSelectPreset = (presetId: string) => {
    if (!selectedId) {
      alert('Please select an element first');
      return;
    }

    // Apply preset to selected element
    const animation = applyPreset(presetId);
    
    setElements(prev =>
      prev.map(el =>
        el.id === selectedId ? { ...el, animation } : el
      )
    );
    
    setSelectedPresetId(presetId);
    
    console.log(`Applied preset "${presetId}" to element "${selectedId}"`);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Main Canvas Area */}
      <div style={{ flex: 1, background: '#f5f5f5', padding: '2rem' }}>
        <h2>Your Canvas</h2>
        <p>Selected: {selectedId || 'None'}</p>
        <p>Current Animation: {selectedPresetId || 'None'}</p>
        
        {/* Your canvas elements would render here */}
        <div
          style={{
            marginTop: '2rem',
            padding: '2rem',
            background: 'white',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
          onClick={() => setSelectedId('1')}
        >
          <h1>Hello World</h1>
          <p>Click to select this element</p>
        </div>
      </div>

      {/* Right Sidebar - Animation Gallery */}
      <div style={{ width: '400px', borderLeft: '1px solid #333' }}>
        <AnimationPresetGallery
          onSelectPreset={handleSelectPreset}
          selectedPresetId={selectedPresetId}
        />
      </div>
    </div>
  );
}

// ==================== Integration Instructions ====================

/**
 * HOW TO ADD TO YOUR EDITOR:
 * 
 * 1. Import the gallery:
 */
/*
import { AnimationPresetGallery } from '../components/AnimationPresetGallery';
import { applyPreset } from '../constants/animationPresets';
*/

/**
 * 2. Add state for selected preset:
 */
/*
const [selectedPresetId, setSelectedPresetId] = useState<string>();
*/

/**
 * 3. Add handler function:
 */
/*
const handleSelectPreset = (presetId: string) => {
  if (!selectedElementId) return;
  
  const animation = applyPreset(presetId);
  updateElement(selectedElementId, { animation });
  setSelectedPresetId(presetId);
};
*/

/**
 * 4. Add gallery to sidebar:
 */
/*
<div className="sidebar">
  <AnimationPresetGallery
    onSelectPreset={handleSelectPreset}
    selectedPresetId={selectedPresetId}
  />
</div>
*/

/**
 * FEATURES:
 * - ✅ 5 categories: Featured, Reveal, General, Effects, Add-on
 * - ✅ 30+ animation presets
 * - ✅ Visual icons with hover animations
 * - ✅ Dark theme (like Canva)
 * - ✅ Click to apply preset
 * - ✅ Visual selection indicator
 */

export default AnimationGalleryExample;
