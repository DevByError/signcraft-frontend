/**
 * Animation Preset Gallery
 * Visual preset picker with animated thumbnails (like Canva)
 */

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface AnimationPresetGalleryProps {
  onSelectPreset: (presetId: string) => void;
  selectedPresetId?: string;
}

export const AnimationPresetGallery: React.FC<AnimationPresetGalleryProps> = ({
  onSelectPreset,
  selectedPresetId,
}) => {
  const [activeCategory, setActiveCategory] = useState<'featured' | 'reveal' | 'general' | 'effects' | 'addon'>('featured');

  const categories = [
    { id: 'featured', label: 'Featured', icon: '⭐' },
    { id: 'reveal', label: 'Reveal', icon: '🎭' },
    { id: 'general', label: 'General', icon: '📊' },
    { id: 'effects', label: 'Effects', icon: '✨' },
    { id: 'addon', label: 'Add-on effects', icon: '➕' },
  ];

  return (
    <div className="animation-gallery">
      {/* Category Tabs */}
      <div className="gallery-categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id as any)}
          >
            <span className="category-icon">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Preset Grid */}
      <div className="gallery-grid">
        {activeCategory === 'featured' && (
          <>
            <PresetCard
              id="shake-zoom"
              name="Shake Zoom"
              icon="shake-zoom"
              isSelected={selectedPresetId === 'shake-zoom'}
              onClick={onSelectPreset}
            />
            <PresetCard
              id="whip-slide"
              name="Whip Slide"
              icon="whip-slide"
              isSelected={selectedPresetId === 'whip-slide'}
              onClick={onSelectPreset}
            />
            <PresetCard
              id="old-tv"
              name="Old TV"
              icon="old-tv"
              isSelected={selectedPresetId === 'old-tv'}
              onClick={onSelectPreset}
            />
            <PresetCard
              id="chroma-wave"
              name="Chroma Wave"
              icon="chroma-wave"
              isSelected={selectedPresetId === 'chroma-wave'}
              onClick={onSelectPreset}
            />
          </>
        )}

        {activeCategory === 'reveal' && (
          <>
            <PresetCard id="brush" name="Brush" icon="brush" isSelected={selectedPresetId === 'brush'} onClick={onSelectPreset} />
            <PresetCard id="ink" name="Ink" icon="ink" isSelected={selectedPresetId === 'ink'} onClick={onSelectPreset} />
            <PresetCard id="digital" name="Digital" icon="digital" isSelected={selectedPresetId === 'digital'} onClick={onSelectPreset} />
            <PresetCard id="spray-paint" name="Spray Paint" icon="spray-paint" isSelected={selectedPresetId === 'spray-paint'} onClick={onSelectPreset} />
            <PresetCard id="sketch" name="Sketch" icon="sketch" isSelected={selectedPresetId === 'sketch'} onClick={onSelectPreset} />
            <PresetCard id="gradient" name="Gradient" icon="gradient" isSelected={selectedPresetId === 'gradient'} onClick={onSelectPreset} />
          </>
        )}

        {activeCategory === 'general' && (
          <>
            <PresetCard id="rise" name="Rise" icon="rise" isSelected={selectedPresetId === 'rise'} onClick={onSelectPreset} />
            <PresetCard id="pan" name="Pan" icon="pan" isSelected={selectedPresetId === 'pan'} onClick={onSelectPreset} />
            <PresetCard id="fade" name="Fade" icon="fade" isSelected={selectedPresetId === 'fade'} onClick={onSelectPreset} />
            <PresetCard id="pop" name="Pop" icon="pop" isSelected={selectedPresetId === 'pop'} onClick={onSelectPreset} />
            <PresetCard id="wipe" name="Wipe" icon="wipe" isSelected={selectedPresetId === 'wipe'} onClick={onSelectPreset} />
            <PresetCard id="blur" name="Blur" icon="blur" isSelected={selectedPresetId === 'blur'} onClick={onSelectPreset} />
          </>
        )}

        {activeCategory === 'effects' && (
          <>
            <PresetCard id="succession" name="Succession" icon="succession" isSelected={selectedPresetId === 'succession'} onClick={onSelectPreset} />
            <PresetCard id="breathe" name="Breathe" icon="breathe" isSelected={selectedPresetId === 'breathe'} onClick={onSelectPreset} />
            <PresetCard id="baseline" name="Baseline" icon="baseline" isSelected={selectedPresetId === 'baseline'} onClick={onSelectPreset} />
            <PresetCard id="drift" name="Drift" icon="drift" isSelected={selectedPresetId === 'drift'} onClick={onSelectPreset} />
            <PresetCard id="tectonic" name="Tectonic" icon="tectonic" isSelected={selectedPresetId === 'tectonic'} onClick={onSelectPreset} />
            <PresetCard id="tumble" name="Tumble" icon="tumble" isSelected={selectedPresetId === 'tumble'} onClick={onSelectPreset} />
            <PresetCard id="neon" name="Neon" icon="neon" isSelected={selectedPresetId === 'neon'} onClick={onSelectPreset} />
            <PresetCard id="scrapbook" name="Scrapbook" icon="scrapbook" isSelected={selectedPresetId === 'scrapbook'} onClick={onSelectPreset} />
            <PresetCard id="stomp" name="Stomp" icon="stomp" isSelected={selectedPresetId === 'stomp'} onClick={onSelectPreset} />
          </>
        )}

        {activeCategory === 'addon' && (
          <>
            <PresetCard id="rotate" name="Rotate" icon="rotate" isSelected={selectedPresetId === 'rotate'} onClick={onSelectPreset} />
            <PresetCard id="flicker" name="Flicker" icon="flicker" isSelected={selectedPresetId === 'flicker'} onClick={onSelectPreset} />
            <PresetCard id="pulse" name="Pulse" icon="pulse" isSelected={selectedPresetId === 'pulse'} onClick={onSelectPreset} />
            <PresetCard id="wiggle" name="Wiggle" icon="wiggle" isSelected={selectedPresetId === 'wiggle'} onClick={onSelectPreset} />
          </>
        )}
      </div>
    </div>
  );
};

// ==================== Preset Card Component ====================

interface PresetCardProps {
  id: string;
  name: string;
  icon: string;
  isSelected: boolean;
  onClick: (id: string) => void;
}

const PresetCard: React.FC<PresetCardProps> = ({ id, name, icon, isSelected, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={`preset-card ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      onClick={() => onClick(id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="preset-icon">
        <PresetIcon type={icon} isHovered={isHovered} />
      </div>
      <div className="preset-name">{name}</div>
    </button>
  );
};

// ==================== Preset Icon Component ====================

const PresetIcon: React.FC<{ type: string; isHovered: boolean }> = ({ type, isHovered }) => {
  const getIconClass = () => {
    if (isHovered) return 'preset-icon-animated';
    return 'preset-icon-static';
  };

  return (
    <div className={`preset-visual ${getIconClass()}`}>
      <svg width="60" height="60" viewBox="0 0 60 60">
        {/* Base shape */}
        <rect
          x="15"
          y="15"
          width="30"
          height="30"
          rx="4"
          fill="#8b5cf6"
          className={`icon-shape icon-${type}`}
        />
        
        {/* Animation indicators */}
        {type.includes('zoom') && (
          <>
            <circle cx="12" cy="12" r="2" fill="#8b5cf6" opacity="0.5" className="indicator-tl" />
            <circle cx="48" cy="12" r="2" fill="#8b5cf6" opacity="0.5" className="indicator-tr" />
            <circle cx="12" cy="48" r="2" fill="#8b5cf6" opacity="0.5" className="indicator-bl" />
            <circle cx="48" cy="48" r="2" fill="#8b5cf6" opacity="0.5" className="indicator-br" />
          </>
        )}
        
        {type === 'pop' && (
          <>
            <circle cx="12" cy="30" r="2" fill="#8b5cf6" opacity="0.3" className="wave-left" />
            <circle cx="48" cy="30" r="2" fill="#8b5cf6" opacity="0.3" className="wave-right" />
          </>
        )}
        
        {(type === 'rise' || type === 'baseline') && (
          <path d="M 30 40 L 30 20" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#arrow)" className="arrow-up" />
        )}
        
        {type === 'pan' && (
          <path d="M 20 30 L 40 30" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#arrow)" className="arrow-right" />
        )}
        
        {type === 'rotate' && (
          <path
            d="M 30 10 A 20 20 0 1 1 29.9 10"
            stroke="#8b5cf6"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrow)"
            className="rotate-arrow"
          />
        )}
        
        {type === 'pulse' && (
          <>
            <circle cx="30" cy="30" r="18" fill="none" stroke="#8b5cf6" strokeWidth="1" opacity="0.3" className="pulse-ring-1" />
            <circle cx="30" cy="30" r="22" fill="none" stroke="#8b5cf6" strokeWidth="1" opacity="0.2" className="pulse-ring-2" />
          </>
        )}
        
        {/* Arrow marker definition */}
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#8b5cf6" />
          </marker>
        </defs>
      </svg>
    </div>
  );
};

// ==================== Styles ====================

const styles = `
.animation-gallery {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
  color: white;
}

.gallery-categories {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid #333;
  overflow-x: auto;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #333;
  border-radius: 0.5rem;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  font-size: 0.875rem;
}

.category-tab:hover {
  background: #2a2a2a;
  border-color: #444;
  color: #ccc;
}

.category-tab.active {
  background: #8b5cf6;
  border-color: #8b5cf6;
  color: white;
}

.category-icon {
  font-size: 1rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
  overflow-y: auto;
}

.preset-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #2a2a2a;
  border: 2px solid transparent;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s;
}

.preset-card:hover {
  background: #333;
  border-color: #444;
  transform: translateY(-2px);
}

.preset-card.selected {
  background: #3a2a5a;
  border-color: #8b5cf6;
}

.preset-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.preset-visual {
  width: 100%;
  height: 100%;
}

.preset-name {
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  color: #ccc;
}

.preset-card:hover .preset-name {
  color: white;
}

/* Animation effects for icons */
@keyframes iconPop {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes iconWave {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

@keyframes iconFade {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes iconBlur {
  0%, 100% { filter: blur(0px); }
  50% { filter: blur(3px); }
}

@keyframes iconRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.7; }
}

@keyframes iconShake {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(-2px, -2px) rotate(-2deg); }
  50% { transform: translate(2px, 2px) rotate(2deg); }
  75% { transform: translate(-2px, 2px) rotate(-1deg); }
}

@keyframes iconSlide {
  0% { transform: translateX(-10px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes iconRise {
  0% { transform: translateY(10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes iconWiggle {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

@keyframes iconFlicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes pulseRing {
  0% { transform: scale(0.8); opacity: 0.5; }
  100% { transform: scale(1.3); opacity: 0; }
}

/* Apply animations on hover */
.preset-icon-animated .icon-pop { animation: iconPop 0.6s ease-in-out infinite; }
.preset-icon-animated .icon-wipe { animation: iconSlide 0.6s ease-out infinite; }
.preset-icon-animated .icon-blur { animation: iconBlur 1s ease-in-out infinite; }
.preset-icon-animated .icon-shake-zoom { animation: iconShake 0.5s ease-in-out infinite; }
.preset-icon-animated .icon-whip-slide { animation: iconSlide 0.4s ease-out infinite; }
.preset-icon-animated .icon-rotate { animation: iconRotate 2s linear infinite; }
.preset-icon-animated .icon-pulse { animation: iconPulse 1s ease-in-out infinite; }
.preset-icon-animated .icon-wiggle { animation: iconWiggle 0.5s ease-in-out infinite; }
.preset-icon-animated .icon-fade { animation: iconFade 1s ease-in-out infinite; }
.preset-icon-animated .icon-rise { animation: iconRise 0.6s ease-out infinite; }
.preset-icon-animated .icon-pan { animation: iconWave 0.8s ease-in-out infinite; }
.preset-icon-animated .icon-flicker { animation: iconFlicker 0.3s ease-in-out infinite; }
.preset-icon-animated .icon-breathe { animation: iconPulse 2s ease-in-out infinite; }
.preset-icon-animated .icon-tumble { animation: iconRotate 1s ease-in-out infinite; }

.preset-icon-animated .pulse-ring-1 { animation: pulseRing 1s ease-out infinite; }
.preset-icon-animated .pulse-ring-2 { animation: pulseRing 1s ease-out 0.3s infinite; }

/* Scroll styling */
.gallery-grid::-webkit-scrollbar {
  width: 8px;
}

.gallery-grid::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.gallery-grid::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

.gallery-grid::-webkit-scrollbar-thumb:hover {
  background: #555;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
