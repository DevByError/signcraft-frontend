import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Type, ImageIcon, Square, Video, Clock, CloudSun,
  ChevronRight, ChevronDown, ChevronUp, Search, ArrowLeft,
  Copy, Trash2, Undo, Redo, Save, X,
  AlignCenter, AlignLeft, AlignRight,
  Circle, Download, Eye, EyeOff,
  Triangle, Star, Heart, Menu, Plus, Minus, Lock, Unlock,
  Layers, Palette, Settings, Grid3x3, Layout, Maximize2,
  RotateCw, Sparkles, Image, Shapes, FileText, MousePointer2, RectangleHorizontal, Sidebar, Zap,
  CheckCircle, AlertCircle
} from 'lucide-react';
import { SaveDesignModal, SaveDesignModalData } from '../components/SaveDesignModal';
import { downloadDesignAsJSON } from '../services/canvasExportService';
// ✅ FIX: Use 'saveDesignAPI' to distinguish from local function
import { postsaveDesign as saveDesignAPI, getDesignById, convertBackendToLocal } from '../services/designService';
import authService from '../services/authService';
import TimelineCapCut from '../components/TimelineCapCut';
import { AlignmentToolbar } from '../components/AlignmentToolbar';
import { useTimeline } from '../hooks/useTimeline';
import * as timelineService from '../services/timelineService';
import * as propertyPlaybackService from '../services/propertyPlaybackService';
import { ElementType, ElementTypeValue, CanvasElement } from '../types/canvas';

// Templates
const TEMPLATES = [
  { name: 'Billboard', width: 1920, height: 480, icon: <RectangleHorizontal size={16} /> },
  { name: 'Android Phone (Portrait)', width: 1080, height: 1920, icon: <Layout size={16} /> },
  { name: 'Android Phone (Landscape)', width: 1920, height: 1080, icon: <RectangleHorizontal size={16} /> },
];

// Unit conversion constants (to pixels)
const UNIT_TO_PX = {
  px: 1,
  mm: 3.779527559,      // 96 DPI / 25.4 mm per inch
  cm: 37.79527559,      // 96 DPI / 2.54 cm per inch
  m: 3779.527559,       // 96 DPI / 0.0254 m per inch
  in: 96,               // 96 DPI
  ft: 1152,             // 96 DPI * 12 inches
} as const;

const WIDGET_CATEGORIES = [
  {
    id: 'essential',
    label: '🔹 Essential',
    icon: <Type size={18} />,
    items: [
      { type: ElementType.TEXT, label: 'Text', icon: <Type size={18} /> },
      { type: ElementType.IMAGE, label: 'Image', icon: <ImageIcon size={18} /> },
      { type: ElementType.SLIDESHOW, label: 'Slideshow', icon: <Layout size={18} /> },
      { type: ElementType.TICKER, label: 'Ticker', icon: <Type size={18} /> },
      { type: ElementType.RSS, label: 'RSS', icon: <FileText size={18} /> },
      { type: ElementType.WEATHER, label: 'Weather', icon: <CloudSun size={18} /> },
    ]
  },
  {
    id: 'media',
    label: '🔹 Media',
    icon: <Video size={18} />,
    items: [
      { type: ElementType.VIDEO, label: 'Video', icon: <Video size={18} /> },
      { type: ElementType.GIF, label: 'GIF', icon: <Image size={18} /> },
      { type: ElementType.MEDIA_RSS, label: 'Media RSS', icon: <FileText size={18} /> },
      { type: ElementType.YOUTUBE, label: 'YouTube', icon: <Video size={18} /> },
      { type: ElementType.USTREAM, label: 'Ustream', icon: <Video size={18} /> },
      { type: ElementType.FTP, label: 'FTP', icon: <FileText size={18} /> },
      { type: ElementType.INSTAGRAM, label: 'Instagram', icon: <Image size={18} /> },
      { type: ElementType.STREAMING, label: 'Streaming', icon: <Video size={18} /> },
    ]
  },
  {
    id: 'general',
    label: '🔹 General',
    icon: <Settings size={18} />,
    items: [
      { type: ElementType.LABEL, label: 'Label', icon: <Type size={18} /> },
      { type: ElementType.CLOCK, label: 'Clock', icon: <Clock size={18} /> },
      { type: ElementType.TIMER, label: 'Timer', icon: <Clock size={18} /> },
      { type: ElementType.TOUCH, label: 'Touch', icon: <MousePointer2 size={18} /> },
      { type: ElementType.WEATHER_2, label: 'Weather 2.0', icon: <CloudSun size={18} /> },
    ]
  },
  {
    id: 'shapes',
    label: '🔹 Shapes',
    icon: <Shapes size={18} />,
    items: [
      { type: ElementType.RECT, label: 'Rectangle', icon: <Square size={18} /> },
      { type: ElementType.CIRCLE, label: 'Circle', icon: <Circle size={18} /> },
      { type: ElementType.TRIANGLE, label: 'Triangle', icon: <Triangle size={18} /> },
      { type: ElementType.DIAMOND, label: 'Diamond', icon: <Square size={18} style={{ transform: 'rotate(45deg)' }} /> },
      { type: ElementType.PENTAGON, label: 'Pentagon', icon: <Star size={18} /> },
      { type: ElementType.HEXAGON, label: 'Hexagon', icon: <Shapes size={18} /> },
      { type: ElementType.OCTAGON, label: 'Octagon', icon: <Shapes size={18} /> },
      { type: ElementType.STAR, label: 'Star', icon: <Star size={18} /> },
      { type: ElementType.HEART, label: 'Heart', icon: <Heart size={18} /> },
      { type: ElementType.CRESCENT, label: 'Crescent', icon: <CloudSun size={18} /> },
      { type: ElementType.CROSS, label: 'Cross', icon: <Plus size={18} /> },
      { type: ElementType.LINE, label: 'Line', icon: <Minus size={18} /> },
    ]
  },
  {
    id: 'advanced',
    label: '🔹 Advanced',
    icon: <Grid3x3 size={18} />,
    items: [
      { type: ElementType.AD_SERVING, label: 'Ad Serving', icon: <ImageIcon size={18} /> },
      { type: ElementType.CALENDAR, label: 'Calendar', icon: <Grid3x3 size={18} /> },
      { type: ElementType.DASHBOARDS, label: 'Dashboards', icon: <Layout size={18} /> },
      { type: ElementType.TABLE, label: 'Table', icon: <Grid3x3 size={18} /> },
      { type: ElementType.SMART_SWITCH, label: 'Smart Switch', icon: <Settings size={18} /> },
    ]
  },
  {
    id: 'embed',
    label: '🔹 Embed',
    icon: <Layout size={18} />,
    items: [
      { type: ElementType.WEB_IMAGE, label: 'Web Image', icon: <ImageIcon size={18} /> },
      { type: ElementType.WEB_VIDEO, label: 'Web Video', icon: <Video size={18} /> },
      { type: ElementType.SUB_CREATIVE, label: 'Sub Creative', icon: <Layout size={18} /> },
      { type: ElementType.EMBED, label: 'Embed', icon: <Layout size={18} /> },
      { type: ElementType.HTML, label: 'HTML', icon: <FileText size={18} /> },
    ]
  },
];

const COLOR_PALETTES = {
  'Navy & Ivory': ['#0F172A', '#FFFFF0', '#000000', '#334155', '#E2E8F0', '#94A3B8', '#1E293B', '#CBD5E1'],
  'Elegant': ['#000000', '#FFFFFF', '#1A1A1A', '#333333', '#4D4D4D', '#666666', '#808080', '#999999'],
  'Vibrant': ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'],
  'Pastel': ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFD9BA', '#E0BBE4', '#C5E3F6', '#FFDFD3'],
  'Earth': ['#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8', '#4E342E', '#6D4C41', '#795548', '#5D4037'],
};

const GRADIENTS = [
  { name: 'Midnight', value: 'linear-gradient(135deg, #0F172A 0%, #000000 100%)' },
  { name: 'Slate', value: 'linear-gradient(135deg, #334155 0%, #0F172A 100%)' },
  { name: 'Ivory Gold', value: 'linear-gradient(135deg, #FFFFF0 0%, #E2E8F0 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%)' },
];

const Editor: React.FC = () => {
  const navigate = useNavigate();
  const { designId: urlDesignId } = useParams<{ designId?: string }>();

  // Design ID state (can be updated when saving new designs)
  const [designId, setDesignId] = useState<string | undefined>(urlDesignId);

  // Main state
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(50);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<'design' | 'templates' | 'uploads'>('design');
  const [activeRightTab, setActiveRightTab] = useState<'properties' | 'layers' | 'animation' | 'align'>('properties');
  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Computed values for backward compatibility
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const selectedElement = selectedId ? elements.find(el => el.id === selectedId) : null;
  const [history, setHistory] = useState<CanvasElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [searchWidget, setSearchWidget] = useState<string>('');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [selectedPalette, setSelectedPalette] = useState<keyof typeof COLOR_PALETTES>('Navy & Ivory');
  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 720 });
  const [canvasSizeUnit, setCanvasSizeUnit] = useState<'px' | 'mm' | 'cm' | 'm' | 'in' | 'ft'>('px');
  const [canvasColor, setCanvasColor] = useState('#FDFBF7');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(!designId); // Show size modal for new designs
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [designTitle, setDesignTitle] = useState('My Design');
  const [newElementIds, setNewElementIds] = useState<Set<string>>(new Set());

  // Local save state (UI-only)
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    widgets_essential: true,
    widgets_media: false,
    widgets_general: false,
    widgets_shapes: false,
    widgets_advanced: false,
    widgets_embed: false,
  });

  const [dragInfo, setDragInfo] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialPositions: Map<string, { x: number; y: number }>;
  } | null>(null);

  const [draggingFromSidebar, setDraggingFromSidebar] = useState(false);

  const [resizing, setResizing] = useState<{
    id: string;
    handle: string;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper functions for element rendering (must be defined before elementRenderers)
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
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}`;
      }
    }

    return null;
  };

  const renderShape = (shapeType: ElementTypeValue, fillColor: string, strokeColor?: string, strokeWidth?: number) => {
    const svgStrokeProps = strokeWidth && strokeWidth > 0 ? {
      stroke: strokeColor || '#000000',
      strokeWidth,
      fill: fillColor
    } : { fill: fillColor };

    switch (shapeType) {
      case ElementType.RECT:
      case ElementType.SHAPE:
        return <div className="w-full h-full" style={{ backgroundColor: fillColor, border: strokeWidth ? `${strokeWidth}px solid ${strokeColor}` : 'none' }}></div>;
      case ElementType.CIRCLE:
        return <div className="w-full h-full rounded-full" style={{ backgroundColor: fillColor, border: strokeWidth ? `${strokeWidth}px solid ${strokeColor}` : 'none' }}></div>;
      case ElementType.TRIANGLE:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,10 90,85 10,85" {...svgStrokeProps} />
          </svg>
        );
      case ElementType.DIAMOND:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,10 90,50 50,90 10,50" {...svgStrokeProps} />
          </svg>
        );
      case ElementType.PENTAGON:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,10 90,35 75,85 25,85 10,35" {...svgStrokeProps} />
          </svg>
        );
      case ElementType.HEXAGON:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" {...svgStrokeProps} />
          </svg>
        );
      case ElementType.OCTAGON:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="30,10 70,10 90,30 90,70 70,90 30,90 10,70 10,30" {...svgStrokeProps} />
          </svg>
        );
      case ElementType.TRAPEZOID:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="25,20 75,20 85,80 15,80" {...svgStrokeProps} />
          </svg>
        );
      case ElementType.STAR:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,10 61,40 91,40 67,60 78,90 50,70 22,90 33,60 9,40 39,40" {...svgStrokeProps} />
          </svg>
        );
      case ElementType.HEART:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M50,85 C25,70 10,55 10,40 C10,25 20,15 30,15 C40,15 50,25 50,25 C50,25 60,15 70,15 C80,15 90,25 90,40 C90,55 75,70 50,85 Z" {...svgStrokeProps} />
          </svg>
        );
      case ElementType.CRESCENT:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M 50 20 A 30 30 0 0 1 50 80 A 24 24 0 0 0 50 26 A 24 24 0 0 0 50 20 Z" {...svgStrokeProps} />
          </svg>
        );
      case ElementType.CROSS:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="40,10 60,10 60,40 90,40 90,60 60,60 60,90 40,90 40,60 10,60 10,40 40,40" {...svgStrokeProps} />
          </svg>
        );
      case ElementType.LINE:
        return <div className="w-full h-full" style={{ backgroundColor: fillColor }}></div>;
      default:
        return null;
    }
  };

  // Text element renderer function (to avoid circular reference)
  const renderTextElement = (el: CanvasElement) => (
    <div
      className="w-full h-full p-2 flex items-center justify-center overflow-hidden break-words whitespace-pre-wrap"
      style={{
        fontSize: el.fontSize,
        color: el.color,
        backgroundColor: el.backgroundColor,
        fontWeight: el.textStyle?.bold ? 'bold' : 'normal',
        fontStyle: el.textStyle?.italic ? 'italic' : 'normal',
        textDecoration: el.textStyle?.underline ? 'underline' : 'none',
        textAlign: el.textStyle?.textAlign || 'center',
        fontFamily: el.textStyle?.fontFamily || 'Inter, sans-serif',
      }}
    >
      {el.content}
    </div>
  );

  // Element Renderer Configuration - Data-Driven Approach
  type ElementRendererConfig = {
    component: (el: CanvasElement) => React.ReactNode;
    defaultContent?: string;
    placeholder?: string;
  };

  const elementRenderers: Record<ElementType, ElementRendererConfig> = {
    [ElementType.TEXT]: {
      component: (el) => renderTextElement(el)
    },
    [ElementType.LABEL]: {
      component: (el) => renderTextElement(el)
    },
    [ElementType.IMAGE]: {
      component: (el) => (
        <img
          src={el.content}
          alt=""
          className="w-full h-full object-cover pointer-events-none"
          style={{ borderRadius: el.borderRadius }}
        />
      )
    },
    [ElementType.GIF]: {
      component: (el) => elementRenderers[ElementType.IMAGE].component(el)
    },
    [ElementType.VIDEO]: {
      component: (el) => el.content && (el.content.startsWith('http') || el.content.startsWith('blob:')) ? (
        <video
          src={el.content}
          className="w-full h-full object-cover"
          style={{ pointerEvents: 'none' }}
          muted
          loop
          autoPlay={el.widgetSettings?.autoplay}
        />
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center text-white font-bold">
          Video (Add URL)
        </div>
      )
    },
    [ElementType.WEB_VIDEO]: {
      component: (el) => el.content && el.content.startsWith('http') ? (
        <iframe
          src={el.content}
          className="w-full h-full border-0"
          style={{ pointerEvents: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center text-white font-bold">
          Web Video (Add URL)
        </div>
      )
    },
    [ElementType.YOUTUBE]: {
      component: (el) => getYouTubeEmbedUrl(el.content) ? (
        <iframe
          src={getYouTubeEmbedUrl(el.content) || ''}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ pointerEvents: 'none' }}
        />
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center text-white font-bold">
          YouTube (Add URL)
        </div>
      )
    },
    [ElementType.TICKER]: {
      component: (el) => (
        <div className="w-full h-full overflow-hidden flex items-center bg-gradient-to-r from-gray-800 to-gray-900 px-3">
          <div className="animate-marquee whitespace-nowrap" style={{ fontSize: el.fontSize, color: el.color || '#FFFFFF', fontWeight: 'bold' }}>
            {el.content}
          </div>
        </div>
      )
    },
    [ElementType.SLIDESHOW]: {
      component: (el) => (
        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
          {el.content}
        </div>
      )
    },
    [ElementType.USTREAM]: {
      component: (el) => el.content && el.content.startsWith('http') ? (
        <iframe
          src={el.content}
          className="w-full h-full border-0"
          style={{ pointerEvents: 'none' }}
          allow="autoplay; fullscreen"
        />
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center text-white font-bold">
          Ustream (Add URL)
        </div>
      )
    },
    [ElementType.STREAMING]: {
      component: (el) => el.content && el.content.startsWith('http') ? (
        <iframe
          src={el.content}
          className="w-full h-full border-0"
          style={{ pointerEvents: 'none' }}
          allow="autoplay"
        />
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center text-white font-bold">
          Streaming (Add URL)
        </div>
      )
    },
    [ElementType.WEB_IMAGE]: {
      component: (el) => el.content && el.content.startsWith('http') ? (
        <img
          src={el.content}
          alt="Web Image"
          className="w-full h-full object-cover"
          style={{ pointerEvents: 'none' }}
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-600">
          Web Image (Add URL)
        </div>
      )
    },
    [ElementType.INSTAGRAM]: {
      component: (el) => el.widgetSettings?.embedCode ? (
        <iframe
          srcDoc={el.widgetSettings.embedCode}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          style={{ pointerEvents: 'none' }}
        />
      ) : el.content && el.content.startsWith('http') ? (
        <img
          src={el.content}
          alt="Instagram"
          className="w-full h-full object-cover"
          style={{ pointerEvents: 'none' }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center text-white font-bold">
          Instagram (Add URL)
        </div>
      )
    },
    [ElementType.RSS]: {
      component: (el) => (
        <div className="w-full h-full bg-orange-50 border border-orange-200 p-3 flex flex-col gap-2 overflow-hidden">
          <div className="text-xs font-bold text-orange-800">{el.content}</div>
          <div className="text-xs text-gray-600">Latest updates...</div>
        </div>
      )
    },
    [ElementType.MEDIA_RSS]: {
      component: (el) => elementRenderers[ElementType.RSS].component(el)
    },
    [ElementType.WEATHER]: {
      component: (el) => (
        <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-500 p-4 text-white flex flex-col items-center justify-center gap-2">
          <CloudSun size={48} className="mb-2" />
          <div className="text-3xl font-bold">{el.widgetSettings?.temperature || '72'}°{el.widgetSettings?.temperatureUnit || 'F'}</div>
          <div className="text-lg">{el.widgetSettings?.condition || 'Sunny'}</div>
          <div className="text-sm opacity-90">{el.widgetSettings?.location || el.content || 'New York, NY'}</div>
        </div>
      )
    },
    [ElementType.WEATHER_2]: {
      component: (el) => elementRenderers[ElementType.WEATHER].component(el)
    },
    [ElementType.CLOCK]: {
      component: (el) => (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-2"
          style={{
            backgroundColor: el.backgroundColor || '#1e293b',
            color: el.color || '#f1f5f9',
          }}
        >
          <Clock className="opacity-50" size={Math.min(el.fontSize || 24, 32)} />
          <div
            className="font-bold font-mono"
            style={{ fontSize: el.fontSize || 24 }}
          >
            {el.content || new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: el.widgetSettings?.timeFormat !== '24'
            })}
          </div>
        </div>
      )
    },
    [ElementType.TIMER]: {
      component: (el) => (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-2"
          style={{
            backgroundColor: el.backgroundColor || '#dc2626',
            color: el.color || '#ffffff',
          }}
        >
          <Clock className="opacity-75" size={Math.min(el.fontSize || 24, 32)} />
          <div
            className="font-bold font-mono"
            style={{ fontSize: el.fontSize || 32 }}
          >
            {el.content || '00:00:00'}
          </div>
        </div>
      )
    },
    [ElementType.CALENDAR]: {
      component: (el) => (
        <div className="w-full h-full bg-white p-3 flex flex-col">
          <div className="text-center font-bold text-gray-800 mb-2 pb-2 border-b border-gray-200">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <div className="grid grid-cols-7 gap-1 flex-1 text-xs">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center font-semibold text-gray-600">{day}</div>
            ))}
            {Array.from({ length: 28 }, (_, i) => (
              <div
                key={i}
                className={`text-center p-1 rounded ${i === new Date().getDate() - 1
                  ? 'bg-green-500 text-white font-bold'
                  : 'text-gray-700'
                  }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      )
    },
    [ElementType.TABLE]: {
      component: (el) => (
        <div className="w-full h-full bg-white overflow-hidden">
          <table className="w-full h-full text-xs border-collapse">
            <thead>
              <tr className="bg-amber-500 text-white">
                <th className="p-2 text-left border border-amber-600">Name</th>
                <th className="p-2 text-left border border-amber-600">Status</th>
                <th className="p-2 text-left border border-amber-600">Value</th>
              </tr>
            </thead>
            <tbody>
              {['Item 1', 'Item 2', 'Item 3'].map((item, i) => (
                <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-2 border border-gray-200">{item}</td>
                  <td className="p-2 border border-gray-200">
                    <span className={`px-2 py-1 rounded text-xs ${i === 0 ? 'bg-green-100 text-green-700' :
                      i === 1 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                      {i === 0 ? 'Active' : i === 1 ? 'Pending' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-2 border border-gray-200 font-mono">${(Math.random() * 1000).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
    [ElementType.DASHBOARDS]: {
      component: (el) => (
        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 p-3 text-white">
          <div className="font-bold text-sm mb-3 pb-2 border-b border-gray-700">
            {el.content || 'Dashboard'}
          </div>
          <div className="grid grid-cols-2 gap-2 h-3/4">
            <div className="bg-cyan-600 rounded-lg p-2 flex flex-col">
              <div className="text-xs opacity-75">Views</div>
              <div className="text-2xl font-bold mt-auto">12.5K</div>
            </div>
            <div className="bg-green-600 rounded-lg p-2 flex flex-col">
              <div className="text-xs opacity-75">Revenue</div>
              <div className="text-2xl font-bold mt-auto">$8.2K</div>
            </div>
            <div className="bg-purple-600 rounded-lg p-2 flex flex-col">
              <div className="text-xs opacity-75">Users</div>
              <div className="text-2xl font-bold mt-auto">3.4K</div>
            </div>
            <div className="bg-orange-600 rounded-lg p-2 flex flex-col">
              <div className="text-xs opacity-75">Growth</div>
              <div className="text-2xl font-bold mt-auto">+24%</div>
            </div>
          </div>
        </div>
      )
    },
    [ElementType.AD_SERVING]: {
      component: (el) => el.content && el.content.startsWith('http') ? (
        <img
          src={el.content}
          alt="Advertisement"
          className="w-full h-full object-cover"
          style={{ pointerEvents: 'none' }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex flex-col items-center justify-center gap-3 text-white p-4">
          <ImageIcon size={40} />
          <div className="text-center">
            <div className="font-bold text-lg">Advertisement</div>
            <div className="text-xs opacity-75 mt-1">{el.content || 'Add image URL in properties'}</div>
          </div>
        </div>
      )
    },
    [ElementType.SMART_SWITCH]: {
      component: (el) => (
        <div className="w-full h-full bg-gradient-to-br from-lime-400 to-green-500 flex flex-col items-center justify-center gap-4 p-4">
          <div className="flex items-center gap-4">
            <div className="text-white text-sm font-semibold">Option A</div>
            <div className="relative w-14 h-7 bg-white rounded-full shadow-inner">
              <div className="absolute top-1 left-1 w-5 h-5 bg-green-600 rounded-full transition-transform"></div>
            </div>
            <div className="text-white text-sm font-semibold">Option B</div>
          </div>
          <div className="text-white text-xs opacity-90">{el.content || 'Smart Switch'}</div>
          <Settings className="text-white opacity-50" size={20} />
        </div>
      )
    },
    [ElementType.TOUCH]: {
      component: (el) => (
        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-300 opacity-20 animate-pulse"></div>
          <div className="z-10 flex flex-col items-center gap-3 text-white">
            <MousePointer2 size={32} className="animate-bounce" />
            <span className="text-sm font-semibold">{el.content || 'Touch Zone'}</span>
          </div>
        </div>
      )
    },
    [ElementType.FTP]: {
      component: (el) => (
        <div className="w-full h-full bg-teal-50 border border-teal-300 p-3 flex items-center gap-2">
          <div className="text-teal-800 text-sm">{el.content}</div>
        </div>
      )
    },
    [ElementType.SUB_CREATIVE]: {
      component: (el) => (
        <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold">
          {el.content}
        </div>
      )
    },
    [ElementType.EMBED]: {
      component: (el) => el.widgetSettings?.embedCode ? (
        <iframe
          srcDoc={el.widgetSettings.embedCode}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          style={{ pointerEvents: 'none' }}
        />
      ) : (
        <div className="w-full h-full bg-gray-50 border-2 border-gray-300 flex items-center justify-center text-gray-700">
          {el.content || 'Add embed code in properties'}
        </div>
      )
    },
    [ElementType.HTML]: {
      component: (el) => (
        <iframe
          srcDoc={el.content || '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#666;">Add HTML code in properties</div>'}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          style={{ pointerEvents: 'none' }}
        />
      )
    },
    // Shape elements
    [ElementType.RECT]: {
      component: (el) => (
        <div style={{ borderRadius: el.borderRadius, width: '100%', height: '100%' }}>
          {renderShape(el.type, el.fillColor || '#0F172A', el.strokeColor, el.strokeWidth)}
        </div>
      )
    },
    [ElementType.CIRCLE]: {
      component: (el) => elementRenderers[ElementType.RECT].component(el)
    },
    [ElementType.TRIANGLE]: {
      component: (el) => elementRenderers[ElementType.RECT].component(el)
    },
    [ElementType.STAR]: {
      component: (el) => elementRenderers[ElementType.RECT].component(el)
    },
    [ElementType.HEART]: {
      component: (el) => elementRenderers[ElementType.RECT].component(el)
    },
    [ElementType.LINE]: {
      component: (el) => elementRenderers[ElementType.RECT].component(el)
    },
    [ElementType.PENTAGON]: {
      component: (el) => elementRenderers[ElementType.RECT].component(el)
    },
    [ElementType.HEXAGON]: {
      component: (el) => elementRenderers[ElementType.RECT].component(el)
    },
    [ElementType.OCTAGON]: {
      component: (el) => elementRenderers[ElementType.RECT].component(el)
    },
    [ElementType.DIAMOND]: {
      component: (el) => elementRenderers[ElementType.RECT].component(el)
    },
    [ElementType.TRAPEZOID]: {
      component: (el) => elementRenderers[ElementType.RECT].component(el)
    },
    [ElementType.CRESCENT]: {
      component: (el) => elementRenderers[ElementType.RECT].component(el)
    },
    [ElementType.CROSS]: {
      component: (el) => elementRenderers[ElementType.RECT].component(el)
    },
    [ElementType.SHAPE]: {
      component: (el) => elementRenderers[ElementType.RECT].component(el)
    },
  };

  // Data-driven element renderer
  const renderElement = (el: CanvasElement): React.ReactNode => {
    const renderer = elementRenderers[el.type];
    if (!renderer) {
      return (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-600">
          Unknown Element Type
        </div>
      );
    }
    return renderer.component(el);
  };

  // Timeline state (always visible like CapCut)
  const [showTimeline, setShowTimeline] = useState(true);
  const [timelineHeight, setTimelineHeight] = useState(350);

  // Canvas panning state
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  // Initialize timeline hook
  const {
    timeline,
    selectedItems,
    canUndo: canUndoTimeline,
    canRedo: canRedoTimeline,
    updateTimeline,
    undo: undoTimeline,
    redo: redoTimeline,
    addElementToTimeline,
    removeElementFromTimeline,
    play,
    pause,
    stop,
    seek,
    selectItem,
    syncElementsToTimeline,
    updateItem,
    removeItem,
    duplicateItem: duplicateTimelineItem,
    exportTimeline,
  } = useTimeline({
    designId: designId || 'editor-design',
    elements: elements as any, // Cast to avoid type mismatch with Editor's extended CanvasElement
    autoSave: false,
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Unit conversion helper functions
  const convertToPx = (value: number, unit: typeof canvasSizeUnit) => value * UNIT_TO_PX[unit as keyof typeof UNIT_TO_PX];
  const convertFromPx = (value: number, unit: typeof canvasSizeUnit) => value / UNIT_TO_PX[unit as keyof typeof UNIT_TO_PX];

  // Auto-fit canvas to viewport
  useEffect(() => {
    const calculateOptimalZoom = () => {
      if (!canvasRef.current) return;

      const container = canvasRef.current.parentElement;
      if (!container) return;

      const containerWidth = container.clientWidth - 96; // Account for padding
      const containerHeight = container.clientHeight - 200; // Account for padding and timeline

      const scaleWidth = containerWidth / canvasSize.width;
      const scaleHeight = containerHeight / canvasSize.height;

      const optimalScale = Math.min(scaleWidth, scaleHeight, 1); // Don't scale up beyond 100%
      const optimalZoom = Math.floor(optimalScale * 100);

      // Always auto-adjust zoom to fit the canvas
      setZoom(Math.max(10, Math.min(optimalZoom, 100))); // Between 10% and 100%
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(calculateOptimalZoom, 100);
    window.addEventListener('resize', calculateOptimalZoom);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateOptimalZoom);
    };
  }, [canvasSize, leftSidebarOpen, rightSidebarOpen, showTimeline]);

  const updateHistory = (newElements: CanvasElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      // Timeline will auto-sync via useEffect when elements change
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      // Timeline will auto-sync via useEffect when elements change
    }
  };

  const snapValue = (value: number): number => {
    if (!snapToGrid) return value;
    const gridSize = 10;
    return Math.round(value / gridSize) * gridSize;
  };

  const handleDragStartWidget = (e: React.DragEvent, type: ElementType, fontSize?: number) => {
    e.dataTransfer.setData('widgetType', type);
    if (fontSize) e.dataTransfer.setData('fontSize', fontSize.toString());
    e.dataTransfer.effectAllowed = 'copy';
    setDraggingFromSidebar(true);
  };

  const handleCanvasBackgroundMouseDown = (e: React.MouseEvent) => {
    // Start panning with Space + Click or Middle Mouse Button
    if (spacePressed || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasPan.x, y: e.clientY - canvasPan.y });
    }
  };

  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingFromSidebar(false);

    // Handle local file drop
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect || !event.target?.result) return;

          const scale = zoom / 100;
          const x = snapValue((e.clientX - rect.left) / scale);
          const y = snapValue((e.clientY - rect.top) / scale);

          addElement(ElementType.IMAGE, x, y, undefined, event.target.result as string);
        };
        reader.readAsDataURL(file);
      }
      return;
    }

    const type = e.dataTransfer.getData('widgetType') as ElementType;
    const fontSize = e.dataTransfer.getData('fontSize');
    if (!type) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scale = zoom / 100;
    const x = snapValue((e.clientX - rect.left) / scale);
    const y = snapValue((e.clientY - rect.top) / scale);

    addElement(type, x, y, fontSize ? Number(fontSize) : undefined);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          addElement(ElementType.IMAGE, 100, 100, undefined, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addElement = (type: ElementType, x: number = 100, y: number = 100, customFontSize?: number, customContent?: string) => {
    const isShape = [
      ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR,
      ElementType.HEART, ElementType.LINE, ElementType.PENTAGON, ElementType.HEXAGON,
      ElementType.OCTAGON, ElementType.DIAMOND, ElementType.TRAPEZOID, ElementType.CRESCENT,
      ElementType.CROSS, ElementType.SHAPE
    ].includes(type);

    const isTextBased = [
      ElementType.TEXT, ElementType.LABEL, ElementType.TICKER,
      ElementType.RSS, ElementType.MEDIA_RSS, ElementType.FTP
    ].includes(type);

    const isMediaWidget = [
      ElementType.IMAGE, ElementType.VIDEO, ElementType.GIF, ElementType.SLIDESHOW,
      ElementType.YOUTUBE, ElementType.USTREAM, ElementType.STREAMING,
      ElementType.INSTAGRAM, ElementType.WEB_IMAGE, ElementType.WEB_VIDEO
    ].includes(type);

    const isAdvancedWidget = [
      ElementType.WEATHER, ElementType.WEATHER_2, ElementType.CLOCK, ElementType.TIMER,
      ElementType.CALENDAR, ElementType.TABLE, ElementType.DASHBOARDS,
      ElementType.AD_SERVING, ElementType.SMART_SWITCH, ElementType.TOUCH,
      ElementType.SUB_CREATIVE, ElementType.EMBED
    ].includes(type);

    // Define dimensions based on widget type
    let width = 200;
    let height = 150;
    let fontSize = customFontSize || 24;

    if (isTextBased) {
      width = 300;
      height = type === ElementType.TICKER ? 60 : 80;
      fontSize = type === ElementType.TICKER ? 20 : 24;
    } else if (type === ElementType.LINE) {
      width = 200;
      height = 4;
    } else if (isMediaWidget) {
      width = 300;
      height = 200;
    } else if (type === ElementType.CLOCK || type === ElementType.TIMER) {
      width = 250;
      height = 100;
      fontSize = 48;
    } else if (type === ElementType.WEATHER || type === ElementType.WEATHER_2) {
      width = 280;
      height = 180;
    } else if (type === ElementType.CALENDAR) {
      width = 350;
      height = 300;
    } else if (type === ElementType.TABLE || type === ElementType.DASHBOARDS) {
      width = 400;
      height = 250;
    } else if (isShape) {
      width = 150;
      height = 150;
    }

    // Ensure the element is placed within the canvas boundaries
    const safeX = Math.max(0, Math.min(canvasSize.width - width, x));
    const safeY = Math.max(0, Math.min(canvasSize.height - height, y));

    // Initialize widget settings based on type
    const initWidgetSettings = () => {
      switch (type) {
        case ElementType.VIDEO:
        case ElementType.YOUTUBE:
        case ElementType.STREAMING:
          return { autoplay: false, loop: true };
        case ElementType.SLIDESHOW:
          return { transitionDuration: 5, transitionEffect: 'fade' as const };
        case ElementType.TICKER:
          return { scrollSpeed: 'medium' as const };
        case ElementType.RSS:
        case ElementType.MEDIA_RSS:
          return { updateInterval: 15, maxItems: 5 };
        case ElementType.WEATHER:
        case ElementType.WEATHER_2:
          return { location: 'New York, NY', temperatureUnit: 'F' as const };
        case ElementType.CLOCK:
          return { timeFormat: '12' as const, timezone: 'America/New_York' };
        case ElementType.TIMER:
          return { displayFormat: 'HH:MM:SS' as const };
        case ElementType.CALENDAR:
          return { calendarSource: 'google' as const, viewMode: 'monthly' as const };
        case ElementType.TABLE:
          return { rows: 5, columns: 3, dataSource: 'manual' as const };
        case ElementType.DASHBOARDS:
          return { refreshRate: 30 };
        case ElementType.INSTAGRAM:
          return { displayMode: 'grid' as const };
        case ElementType.TOUCH:
          return { actionType: 'url' as const };
        case ElementType.SMART_SWITCH:
          return { switchCondition: 'time' as const };
        default:
          return {};
      }
    };

    const newElement: CanvasElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: customContent || getDefaultContent(type),
      x: safeX,
      y: safeY,
      width,
      height,
      fontSize: isTextBased || type === ElementType.CLOCK || type === ElementType.TIMER ? fontSize : undefined,
      color: isTextBased || type === ElementType.CLOCK || type === ElementType.TIMER ? '#0F172A' : undefined,
      backgroundColor: isMediaWidget || isAdvancedWidget ? '#F8F9FA' : 'transparent',
      fillColor: isShape ? '#0F172A' : undefined,
      opacity: 1,
      rotation: 0,
      zIndex: elements.length + 1,
      visible: true,
      locked: false,
      animation: undefined,
      animationDuration: 1, // Default duration in seconds
      animationSpeed: 1, // Default speed multiplier
      widgetSettings: initWidgetSettings(),
      textStyle: isTextBased || type === ElementType.CLOCK || type === ElementType.TIMER ? {
        textAlign: 'center',
        bold: type === ElementType.LABEL || type === ElementType.CLOCK,
        italic: false,
        underline: false,
        fontFamily: 'Inter, sans-serif',
        letterSpacing: 0,
        lineHeight: 1.2,
      } : undefined
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    updateHistory(newElements);
    setSelectedIds([newElement.id]);
    setNewElementIds(prev => new Set([...prev, newElement.id]));

    // Timeline will auto-sync the new element via useEffect

    // Remove from new elements set after animation completes
    setTimeout(() => {
      setNewElementIds(prev => {
        const next = new Set(prev);
        next.delete(newElement.id);
        return next;
      });
    }, 400);
    setRightSidebarOpen(true);
  };

  const getDefaultContent = (type: ElementType) => {
    switch (type) {
      // Essential
      case ElementType.TEXT: return 'Double click to edit';
      case ElementType.IMAGE: return 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400';
      case ElementType.SLIDESHOW: return '🖼️ Slideshow';
      case ElementType.TICKER: return '📰 Breaking News • Latest Updates • Top Stories';
      case ElementType.RSS: return '📡 RSS Feed';
      case ElementType.WEATHER: return '☀️ Weather';

      // Media
      case ElementType.VIDEO: return '🎬 Video Player';
      case ElementType.GIF: return 'https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy.gif';
      case ElementType.MEDIA_RSS: return '📺 Media RSS';
      case ElementType.YOUTUBE: return '▶️ YouTube';
      case ElementType.USTREAM: return '📹 Ustream';
      case ElementType.FTP: return '📁 FTP';
      case ElementType.INSTAGRAM: return '📷 Instagram';
      case ElementType.STREAMING: return '📡 Live Stream';

      // General
      case ElementType.LABEL: return 'Label Text';
      case ElementType.CLOCK: return '🕐 12:00 PM';
      case ElementType.TIMER: return '⏱️ 00:00:00';
      case ElementType.SHAPE: return '';
      case ElementType.TOUCH: return '👆 Touch Zone';
      case ElementType.WEATHER_2: return '🌤️ Weather 2.0';

      // Advanced
      case ElementType.AD_SERVING: return '📊 Advertisement';
      case ElementType.CALENDAR: return '📅 Calendar';
      case ElementType.DASHBOARDS: return '📈 Dashboard';
      case ElementType.TABLE: return '📋 Data Table';
      case ElementType.SMART_SWITCH: return '🔄 Smart Switch';

      // Embed
      case ElementType.WEB_IMAGE: return '🌐 Web Image';
      case ElementType.WEB_VIDEO: return '🌐 Web Video';
      case ElementType.SUB_CREATIVE: return '🎨 Sub Creative';
      case ElementType.EMBED: return '📦 Embed Content';

      default: return '';
    }
  };

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
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === id);

    // Multi-selection with Ctrl/Cmd key
    if (e.ctrlKey || e.metaKey) {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      // If clicking on an already selected item, keep the selection
      if (!selectedIds.includes(id)) {
        setSelectedIds([id]);
      }
    }
    setRightSidebarOpen(true);

    if (element && !element.locked && !editingTextId) {
      // Store initial positions of all selected items
      const initialPositions = new Map<string, { x: number; y: number }>();
      const itemsToMove = selectedIds.includes(id) ? selectedIds : [id];

      itemsToMove.forEach(itemId => {
        const el = elements.find(e => e.id === itemId);
        if (el) {
          initialPositions.set(itemId, { x: el.x, y: el.y });
        }
      });

      setDragInfo({
        id,
        startX: e.clientX,
        startY: e.clientY,
        initialPositions
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Canvas panning
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setCanvasPan({ x: dx, y: dy });
      return;
    }

    if (dragInfo && !resizing) {
      const scale = zoom / 100;
      const dx = (e.clientX - dragInfo.startX) / scale;
      const dy = (e.clientY - dragInfo.startY) / scale;

      setElements(prev => prev.map(el => {
        // Move all items that were selected when drag started
        const initialPos = dragInfo.initialPositions.get(el.id);
        if (initialPos) {
          // Calculate proposed snapped position
          const rawX = initialPos.x + dx;
          const rawY = initialPos.y + dy;
          const snappedX = snapValue(rawX);
          const snappedY = snapValue(rawY);

          // Apply strict clamping AFTER snapping to ensure it doesn't snap outside bounds
          const safeX = Math.max(0, Math.min(canvasSize.width - el.width, snappedX));
          const safeY = Math.max(0, Math.min(canvasSize.height - el.height, snappedY));

          return {
            ...el,
            x: safeX,
            y: safeY
          };
        }
        return el;
      }));
    }

    if (resizing) {
      const scale = zoom / 100;
      const dx = (e.clientX - resizing.startX) / scale;
      const dy = (e.clientY - resizing.startY) / scale;

      setElements(prev => prev.map(el => {
        if (el.id === resizing.id) {
          let newWidth = resizing.initialWidth;
          let newHeight = resizing.initialHeight;
          let newX = resizing.initialX;
          let newY = resizing.initialY;

          if (resizing.handle.includes('e')) {
            newWidth = Math.max(30, resizing.initialWidth + dx);
            // Constrain width to canvas edge
            newWidth = Math.min(newWidth, canvasSize.width - resizing.initialX);
          }
          if (resizing.handle.includes('w')) {
            const widthChange = resizing.initialWidth - dx;
            if (widthChange >= 30) {
              const intendedX = resizing.initialX + dx;
              // Constrain left edge to 0
              if (intendedX >= 0) {
                newWidth = widthChange;
                newX = intendedX;
              }
            }
          }
          if (resizing.handle.includes('s')) {
            newHeight = Math.max(30, resizing.initialHeight + dy);
            // Constrain height to canvas edge
            newHeight = Math.min(newHeight, canvasSize.height - resizing.initialY);
          }
          if (resizing.handle.includes('n')) {
            const heightChange = resizing.initialHeight - dy;
            if (heightChange >= 30) {
              const intendedY = resizing.initialY + dy;
              // Constrain top edge to 0
              if (intendedY >= 0) {
                newHeight = heightChange;
                newY = intendedY;
              }
            }
          }

          return { ...el, width: newWidth, height: newHeight, x: newX, y: newY };
        }
        return el;
      }));
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (dragInfo || resizing) {
      updateHistory(elements);

      // Update timeline items for moved/resized elements
      if (dragInfo) {
        const movedElements = elements.filter(el => dragInfo.initialPositions.has(el.id));
        movedElements.forEach(el => {
          const timelineItems = timeline.tracks
            .flatMap(t => t.items)
            .filter(item => item.elementId === el.id);

          timelineItems.forEach(item => {
            updateItem(item.id, {
              properties: {
                ...item.properties,
                x: el.x,
                y: el.y
              }
            });
          });
        });
      }

      if (resizing) {
        const el = elements.find(e => e.id === resizing.id);
        if (el) {
          const timelineItems = timeline.tracks
            .flatMap(t => t.items)
            .filter(item => item.elementId === el.id);

          timelineItems.forEach(item => {
            updateItem(item.id, {
              properties: {
                ...item.properties,
                x: el.x,
                y: el.y,
                width: el.width,
                height: el.height
              }
            });
          });
        }
      }

      setDragInfo(null);
      setResizing(null);
    }
  };

  const handleResizeStart = (e: React.MouseEvent, id: string, handle: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === id);
    if (element?.locked) return;

    if (element) {
      setResizing({
        id,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        initialWidth: element.width,
        initialHeight: element.height,
        initialX: element.x,
        initialY: element.y,
      });
    }
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;

    // Check if any selected elements are locked
    const lockedElements = elements.filter(el => selectedIds.includes(el.id) && el.locked);
    if (lockedElements.length > 0) {
      // Only delete unlocked elements
      const unlockedIds = selectedIds.filter(id => !lockedElements.some(el => el.id === id));
      if (unlockedIds.length === 0) return;

      const newElements = elements.filter(el => !unlockedIds.includes(el.id));

      // Remove from timeline as well
      unlockedIds.forEach(id => {
        removeElementFromTimeline(id);
      });

      setElements(newElements);
      updateHistory(newElements);
      setSelectedIds([]);
    } else {
      const newElements = elements.filter(el => !selectedIds.includes(el.id));

      // Remove from timeline as well
      selectedIds.forEach(id => {
        removeElementFromTimeline(id);
      });

      setElements(newElements);
      updateHistory(newElements);
      setSelectedIds([]);
    }
  };

  const duplicateSelected = () => {
    if (selectedIds.length === 0) return;

    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    const newElements = [...elements];
    const newIds: string[] = [];

    selectedElements.forEach(element => {
      const newElement = {
        ...element,
        id: Math.random().toString(36).substr(2, 9),
        x: Math.min(element.x + 20, canvasSize.width - element.width),
        y: Math.min(element.y + 20, canvasSize.height - element.height),
        zIndex: newElements.length + newIds.length + 1,
        locked: false,
      };
      newElements.push(newElement);
      newIds.push(newElement.id);
    });

    setElements(newElements);
    updateHistory(newElements);
    setSelectedIds(newIds);
    setRightSidebarOpen(true);

    // Timeline will auto-sync via useEffect
  };

  const updateSelectedElement = (key: keyof CanvasElement, value: any) => {
    if (!selectedId) return;
    const newElements = elements.map(el => {
      if (el.id === selectedId) {
        return { ...el, [key]: value };
      }
      return el;
    });
    setElements(newElements);

    // Update timeline item properties for position, size, rotation, opacity, color
    const visualProps = ['x', 'y', 'width', 'height', 'rotation', 'opacity', 'zIndex', 'color', 'backgroundColor', 'fillColor', 'fontSize'];
    if (visualProps.includes(key as string)) {
      const timelineItems = timeline.tracks
        .flatMap(t => t.items)
        .filter(item => item.elementId === selectedId);

      timelineItems.forEach(item => {
        updateItem(item.id, {
          properties: {
            ...item.properties,
            [key]: value
          }
        });
      });
    }
  };

  const updateSelectedElementImmediate = (key: keyof CanvasElement, value: any) => {
    updateSelectedElement(key, value);
    updateHistory(elements);
  };

  const updateWidgetSettings = (key: string, value: any) => {
    if (!selectedId) return;
    const newElements = elements.map(el => {
      if (el.id === selectedId) {
        return { ...el, widgetSettings: { ...el.widgetSettings, [key]: value } };
      }
      return el;
    });
    setElements(newElements);
  };

  const updateWidgetSettingsImmediate = (key: string, value: any) => {
    updateWidgetSettings(key, value);
    setTimeout(() => updateHistory(elements), 0);
  };

  const bringToFront = () => {
    if (!selectedId) return;
    const maxZ = Math.max(...elements.map(e => e.zIndex || 0));
    updateSelectedElementImmediate('zIndex', maxZ + 1);

    // Update timeline item layer
    const timelineItems = timeline.tracks
      .flatMap(t => t.items)
      .filter(item => item.elementId === selectedId);

    timelineItems.forEach(item => {
      updateItem(item.id, { layer: maxZ + 1 });
    });
  };

  const sendToBack = () => {
    if (!selectedId) return;
    const minZ = Math.min(...elements.map(e => e.zIndex || 0));
    updateSelectedElementImmediate('zIndex', minZ - 1);

    // Update timeline item layer
    const timelineItems = timeline.tracks
      .flatMap(t => t.items)
      .filter(item => item.elementId === selectedId);

    timelineItems.forEach(item => {
      updateItem(item.id, { layer: minZ - 1 });
    });
  };

  const moveLayerForward = () => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    if (!element) return;
    updateSelectedElementImmediate('zIndex', element.zIndex + 1);

    // Update timeline item layer
    const timelineItems = timeline.tracks
      .flatMap(t => t.items)
      .filter(item => item.elementId === selectedId);

    timelineItems.forEach(item => {
      updateItem(item.id, { layer: element.zIndex + 1 });
    });
  };

  const moveLayerBackward = () => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    if (!element) return;
    updateSelectedElementImmediate('zIndex', element.zIndex - 1);

    // Update timeline item layer
    const timelineItems = timeline.tracks
      .flatMap(t => t.items)
      .filter(item => item.elementId === selectedId);

    timelineItems.forEach(item => {
      updateItem(item.id, { layer: element.zIndex - 1 });
    });
  };

  const alignElements = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    if (!element) return;

    let newX = element.x;
    let newY = element.y;

    switch (alignment) {
      case 'left': newX = 0; break;
      case 'center': newX = (canvasSize.width - element.width) / 2; break;
      case 'right': newX = canvasSize.width - element.width; break;
      case 'top': newY = 0; break;
      case 'middle': newY = (canvasSize.height - element.height) / 2; break;
      case 'bottom': newY = canvasSize.height - element.height; break;
    }

    updateSelectedElement('x', newX);
    updateSelectedElement('y', newY);
    updateHistory(elements);
  };

  const handleDoubleClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === id);
    if (element?.locked) return;

    // Allow editing for all text-based widgets
    const editableTypes = [
      ElementType.TEXT, ElementType.LABEL, ElementType.TICKER,
      ElementType.RSS, ElementType.MEDIA_RSS, ElementType.FTP
    ];

    if (element && editableTypes.includes(element.type as ElementType)) {
      setSelectedIds([id]);
      setEditingTextId(id);
      setEditingText(element.content);
      setTimeout(() => textInputRef.current?.focus(), 0);
    }
  };

  const finishEditingText = () => {
    if (editingTextId) {
      updateSelectedElement('content', editingText);
      updateHistory(elements);
      setEditingTextId(null);
      setEditingText('');
    }
  };

  // ✅ RENAME LOCAL FUNCTION to avoid conflict with import
  const openSaveModal = () => {
    setShowSaveModal(true);
  };

  // ✅ UPDATED: Use saveDesignAPI (imported), ignore 401/403, and remove duplicate manual UserID
  const handleSaveDesign = async (data: SaveDesignModalData) => {
    try {
      const elementsWithDefaults = elements.map(el => ({
        ...el,
        content: el.content || '',
        visible: el.visible ?? true,
        textStyle: el.textStyle || { bold: false, italic: false, underline: false, textAlign: 'left', fontFamily: 'Arial', letterSpacing: 0, lineHeight: 1.2 }
      }));

      const timelineVideoData = {
        tracks: timeline.tracks.map(track => ({
          id: track.id,
          name: track.name,
          type: track.type,
          items: track.items.map(item => ({
            id: item.id,
            elementId: item.elementId,
            startTime: item.startTime,
            duration: item.duration,
            layer: item.layer,
            properties: item.properties || {}
          })),
        })),
        totalDuration: timeline.totalDuration,
        fps: 60,
      };

      const payload = {
        id: designId || undefined,
        title: data.title,
        canvasData: elementsWithDefaults,
        timelineData: timelineVideoData,
        // Backend extracts user ID from cookie
      };

      console.log(designId ? '🔄 Updating...' : '💾 Creating...');

      // ✅ Use renamed API import
      const response = await saveDesignAPI(payload);

      if (response.success) {
        if (!designId && response.data?.id) {
          setDesignId(response.data.id);
          window.history.replaceState(null, '', `#/editor/${response.data.id}`);
        }
        setDesignTitle(data.title);
        setSuccessMessage('Design saved successfully');
        setTimeout(() => {
          setSuccessMessage(null);
          setShowSaveModal(false);
        }, 1500);
      } else {
        alert('Failed to save: ' + response.msg);
      }
    } catch (error: any) {
      // ✅ IGNORE 401/403 Errors - The Global Modal will handle them
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn('🔒 Auth error caught, waiting for global modal...');
        setSuccessMessage(null);
        return;
      }

      console.error('Error saving design:', error);
      alert(`❌ Error saving design: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSuccessMessage(null);
    }
  };

  // ✅ UPDATED: Added all missing properties for TypeScript interface compliance
  const exportDesignAsJSON = () => {
    const elementsWithDefaults = elements.map(el => ({
      ...el,
      content: el.content || '',
      visible: el.visible ?? true,
      textStyle: el.textStyle || { bold: false, italic: false, underline: false, textAlign: 'left', fontFamily: 'Arial', letterSpacing: 0, lineHeight: 1.2 }
    }));

    const exportData = {
      metadata: {
        title: designTitle,
        description: '', // Added
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
        canvasColor: canvasColor, // Added
        createdAt: new Date().toISOString(), // Added
        updatedAt: new Date().toISOString(), // Added
        createdBy: 'current-user', // Added
        version: 1, // Added
        tags: [] // Added
      },
      designJSON: {
        elements: elementsWithDefaults,
        timeline: exportTimeline(),
        totalElements: elementsWithDefaults.length, // Added
        version: '1.0.0' // Added
      }
    };
    // Force cast if types slightly mismatch but structure is correct
    downloadDesignAsJSON(exportData as any, `${designTitle}-${Date.now()}.json`);
  };

  const exportAsImage = async () => {
    try {
      // Store current user state
      const previousZoom = zoom;
      const previousSelectedId = selectedId;

      // High-resolution export: 2x pixel ratio for billboard/print quality
      const pixelRatio = 2;
      const exportWidth = canvasSize.width * pixelRatio;
      const exportHeight = canvasSize.height * pixelRatio;

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Scale for high DPI
      ctx.scale(pixelRatio, pixelRatio);

      // Fill background
      ctx.fillStyle = canvasColor;
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

      // Preload ALL images first before drawing anything
      const imageMap = new Map<string, HTMLImageElement>();
      const imageSrcs = new Set<string>();

      // Collect all unique image sources
      for (const el of elements) {
        if (el.type === ElementType.IMAGE) {
          imageSrcs.add(el.content);
        }
      }

      // Load all images in parallel
      const imageLoadPromises = Array.from(imageSrcs).map(src =>
        new Promise<[string, HTMLImageElement]>(resolve => {
          const img = document.createElement('img');
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve([src, img as HTMLImageElement]);
          img.onerror = () => {
            console.warn('Failed to load image:', src);
            resolve([src, img as HTMLImageElement]);
          };
          img.src = src;
        })
      );

      // Wait for ALL images to load
      const loadedImages = await Promise.all(imageLoadPromises);
      loadedImages.forEach(([src, img]) => {
        imageMap.set(src, img);
      });

      // Preload all SVG shapes as images
      const shapeImageMap = new Map<string, HTMLImageElement>();

      for (const el of elements) {
        if ([ElementType.TRIANGLE, ElementType.DIAMOND, ElementType.PENTAGON, ElementType.HEXAGON, ElementType.OCTAGON, ElementType.TRAPEZOID, ElementType.STAR, ElementType.HEART, ElementType.CRESCENT, ElementType.CROSS, ElementType.LINE].includes(el.type as ElementType)) {
          const shapeKey = `${el.type}-${el.fillColor}-${el.strokeColor}-${el.strokeWidth}`;

          if (!shapeImageMap.has(shapeKey)) {
            const svgNS = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(svgNS, 'svg');
            svg.setAttribute('viewBox', '0 0 100 100');
            svg.setAttribute('width', '200');
            svg.setAttribute('height', '200');

            const svgFill = el.fillColor || '#0F172A';
            const svgStroke = el.strokeWidth && el.strokeWidth > 0 ? el.strokeColor || '#000000' : 'none';

            let shapeElement: SVGElement | null = null;

            switch (el.type) {
              case ElementType.TRIANGLE:
                shapeElement = document.createElementNS(svgNS, 'polygon');
                shapeElement.setAttribute('points', '50,10 90,85 10,85');
                break;
              case ElementType.DIAMOND:
                shapeElement = document.createElementNS(svgNS, 'polygon');
                shapeElement.setAttribute('points', '50,10 90,50 50,90 10,50');
                break;
              case ElementType.PENTAGON:
                shapeElement = document.createElementNS(svgNS, 'polygon');
                shapeElement.setAttribute('points', '50,10 90,35 75,85 25,85 10,35');
                break;
              case ElementType.HEXAGON:
                shapeElement = document.createElementNS(svgNS, 'polygon');
                shapeElement.setAttribute('points', '50,10 85,30 85,70 50,90 15,70 15,30');
                break;
              case ElementType.OCTAGON:
                shapeElement = document.createElementNS(svgNS, 'polygon');
                shapeElement.setAttribute('points', '30,10 70,10 90,30 90,70 70,90 30,90 10,70 10,30');
                break;
              case ElementType.TRAPEZOID:
                shapeElement = document.createElementNS(svgNS, 'polygon');
                shapeElement.setAttribute('points', '25,20 75,20 85,80 15,80');
                break;
              case ElementType.STAR:
                shapeElement = document.createElementNS(svgNS, 'polygon');
                shapeElement.setAttribute('points', '50,10 61,40 91,40 67,60 78,90 50,70 22,90 33,60 9,40 39,40');
                break;
              case ElementType.HEART:
                shapeElement = document.createElementNS(svgNS, 'path');
                shapeElement.setAttribute('d', 'M50,85 C25,70 10,55 10,40 C10,25 20,15 30,15 C40,15 50,25 50,25 C50,25 60,15 70,15 C80,15 90,25 90,40 C90,55 75,70 50,85 Z');
                break;
              case ElementType.CRESCENT:
                shapeElement = document.createElementNS(svgNS, 'path');
                shapeElement.setAttribute('d', 'M 50 20 A 30 30 0 0 1 50 80 A 24 24 0 0 0 50 26 A 24 24 0 0 0 50 20 Z');
                break;
              case ElementType.CROSS:
                const g = document.createElementNS(svgNS, 'g');
                const rect1 = document.createElementNS(svgNS, 'rect');
                rect1.setAttribute('x', '40');
                rect1.setAttribute('y', '10');
                rect1.setAttribute('width', '20');
                rect1.setAttribute('height', '80');
                const rect2 = document.createElementNS(svgNS, 'rect');
                rect2.setAttribute('x', '10');
                rect2.setAttribute('y', '40');
                rect2.setAttribute('width', '80');
                rect2.setAttribute('height', '20');
                g.appendChild(rect1);
                g.appendChild(rect2);
                shapeElement = g;
                break;
              case ElementType.LINE:
                shapeElement = document.createElementNS(svgNS, 'line');
                shapeElement.setAttribute('x1', '0');
                shapeElement.setAttribute('y1', '50');
                shapeElement.setAttribute('x2', '100');
                shapeElement.setAttribute('y2', '50');
                shapeElement.setAttribute('stroke', svgFill);
                shapeElement.setAttribute('stroke-width', '4');
                svg.appendChild(shapeElement);
                break;
            }

            if (shapeElement && el.type !== ElementType.LINE) {
              if (shapeElement instanceof SVGGElement) {
                Array.from(shapeElement.children).forEach(child => {
                  (child as SVGElement).setAttribute('fill', svgFill);
                  (child as SVGElement).setAttribute('stroke', svgStroke);
                  if (el.strokeWidth) (child as SVGElement).setAttribute('stroke-width', el.strokeWidth.toString());
                });
              } else {
                shapeElement.setAttribute('fill', svgFill);
                shapeElement.setAttribute('stroke', svgStroke);
                if (el.strokeWidth) shapeElement.setAttribute('stroke-width', el.strokeWidth.toString());
              }
              svg.appendChild(shapeElement);
            }

            const svgData = new XMLSerializer().serializeToString(svg);
            const shapeImg = document.createElement('img');
            shapeImg.src = 'data:image/svg+xml;base64,' + btoa(svgData);

            await new Promise<void>(resolve => {
              shapeImg.onload = () => {
                shapeImageMap.set(shapeKey, shapeImg as HTMLImageElement);
                resolve();
              };
              shapeImg.onerror = () => {
                console.warn('Failed to render shape');
                resolve();
              };
            });
          }
        }
      }

      // Now that ALL images and shapes are loaded, draw everything
      for (const el of elements.sort((a, b) => a.zIndex - b.zIndex)) {
        ctx.save();
        ctx.globalAlpha = el.opacity;

        // Apply transformations
        ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
        ctx.rotate((el.rotation * Math.PI) / 180);

        if (el.type === ElementType.TEXT) {
          // Draw text
          ctx.fillStyle = el.color || '#000000';
          const fontWeight = el.textStyle?.bold ? 'bold' : 'normal';
          const fontStyle = el.textStyle?.italic ? 'italic' : 'normal';
          ctx.font = `${fontWeight} ${fontStyle} ${el.fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(el.content, 0, 0);

        } else if (el.type === ElementType.IMAGE) {
          // Draw preloaded image
          const img = imageMap.get(el.content);
          if (img && img.width > 0) {
            ctx.drawImage(img, -el.width / 2, -el.height / 2, el.width, el.height);
          }

        } else if (el.type === ElementType.RECT) {
          // Draw rectangle
          ctx.fillStyle = el.fillColor || '#4ECDC4';
          ctx.fillRect(-el.width / 2, -el.height / 2, el.width, el.height);
          if (el.strokeWidth && el.strokeWidth > 0) {
            ctx.strokeStyle = el.strokeColor || '#000000';
            ctx.lineWidth = el.strokeWidth;
            ctx.strokeRect(-el.width / 2, -el.height / 2, el.width, el.height);
          }

        } else if (el.type === ElementType.CIRCLE) {
          // Draw circle
          ctx.fillStyle = el.fillColor || '#4ECDC4';
          ctx.beginPath();
          ctx.arc(0, 0, el.width / 2, 0, Math.PI * 2);
          ctx.fill();
          if (el.strokeWidth && el.strokeWidth > 0) {
            ctx.strokeStyle = el.strokeColor || '#000000';
            ctx.lineWidth = el.strokeWidth;
            ctx.stroke();
          }

        } else if ([ElementType.TRIANGLE, ElementType.DIAMOND, ElementType.PENTAGON, ElementType.HEXAGON, ElementType.OCTAGON, ElementType.TRAPEZOID, ElementType.STAR, ElementType.HEART, ElementType.CRESCENT, ElementType.CROSS, ElementType.LINE].includes(el.type as ElementType)) {
          // Draw preloaded shape image
          const shapeKey = `${el.type}-${el.fillColor}-${el.strokeColor}-${el.strokeWidth}`;
          const shapeImg = shapeImageMap.get(shapeKey);
          if (shapeImg && shapeImg.width > 0) {
            ctx.drawImage(shapeImg, -el.width / 2, -el.height / 2, el.width, el.height);
          }
        }

        ctx.restore();
      }

      // Download the final image
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png', 1.0);
      link.download = `design-${Date.now()}-${canvasSize.width}x${canvasSize.height}.png`;
      link.click();

      // Restore user state
      setZoom(previousZoom);
      setSelectedIds(previousSelectedId ? [previousSelectedId] : []);

    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    const scaleX = template.width / canvasSize.width;
    const scaleY = template.height / canvasSize.height;

    // Use smaller scale to prevent elements from growing too large,
    // but scale relative positions by canvas dimensions to maintain layout.
    const scale = Math.min(scaleX, scaleY);

    const newElements = elements.map(el => {
      // Calculate relative center position (0 to 1)
      const relCenterX = (el.x + el.width / 2) / canvasSize.width;
      const relCenterY = (el.y + el.height / 2) / canvasSize.height;

      // Calculate new dimensions (maintain aspect ratio)
      const newWidth = el.width * scale;
      const newHeight = el.height * scale;

      // Calculate new position based on relative center
      const newX = (relCenterX * template.width) - (newWidth / 2);
      const newY = (relCenterY * template.height) - (newHeight / 2);

      return {
        ...el,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
        fontSize: el.fontSize ? el.fontSize * scale : undefined,
      };
    });

    setElements(newElements);
    updateHistory(newElements);
    setCanvasSize({ width: template.width, height: template.height });
    setShowTemplateModal(false);

    // Timeline will auto-sync all elements via useEffect
  };

  // Load design from backend or local store if designId is provided
  useEffect(() => {
    if (designId) {
      const loadDesign = async () => {
        try {
          console.log('Loading design:', designId);

          // Try to load from backend first
          const backendResult = await getDesignById(designId);
          let design = null;

          if (backendResult.success && backendResult.data) {
            console.log('Design loaded from backend:', backendResult.data);
            design = convertBackendToLocal(backendResult.data);
          } else {
            console.error('Failed to load design from backend:', backendResult.msg);
            return;
          }

          if (design) {
            console.log('Design loaded:', design);
            setDesignTitle(design.metadata.title);
            setCanvasSize({ width: design.metadata.canvasWidth, height: design.metadata.canvasHeight });
            setCanvasColor(design.metadata.canvasColor);

            // Map the design elements to CanvasElement format
            const loadedElements = design.designJSON.elements.map((el: any) => ({
              id: el.id,
              type: el.type as ElementType,
              content: el.content,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              fontSize: el.fontSize,
              color: el.color,
              backgroundColor: el.backgroundColor,
              fillColor: el.fillColor,
              strokeColor: el.strokeColor,
              strokeWidth: el.strokeWidth,
              borderRadius: el.borderRadius,
              opacity: el.opacity,
              rotation: el.rotation,
              zIndex: el.zIndex,
              locked: el.locked,
              visible: el.visible,
              textStyle: el.textStyle,
              widgetSettings: el.widgetSettings,
              animation: el.animation,
              animationDuration: el.animationDuration,
              animationSpeed: el.animationSpeed,
              shadow: el.shadow,
              radius: el.radius,
            } as CanvasElement));

            setElements(loadedElements);
            setHistory([loadedElements]);
            setHistoryIndex(0);

            // Restore timeline data if it exists
            if (design.designJSON.timeline) {
              console.log('Restoring timeline data:', design.designJSON.timeline);
              // Convert backend timeline format back to timeline state
              const restoredTimeline = design.designJSON.timeline;
              if (restoredTimeline.tracks && Array.isArray(restoredTimeline.tracks)) {
                const newTimeline: any = {
                  id: restoredTimeline.id || `timeline-${Date.now()}`,
                  designId: designId,
                  fps: restoredTimeline.fps || 30,
                  tracks: restoredTimeline.tracks.map((track: any) => ({
                    id: track.id,
                    name: track.name,
                    type: track.type,
                    items: (track.items || []).map((item: any) => ({
                      id: item.id,
                      elementId: item.elementId,
                      startTime: item.startTime,
                      duration: item.duration,
                      inPoint: item.inPoint || 0,
                      outPoint: item.outPoint || item.duration,
                      layer: item.layer,
                      properties: item.properties || {},
                      animations: item.animations || [],
                    })),
                  })),
                  totalDuration: restoredTimeline.totalDuration || 0,
                  currentTime: 0,
                  isPlaying: false,
                  loop: false,
                  playbackSpeed: 1.0,
                  snapInterval: 100,
                  zoom: 1,
                };
                updateTimeline(newTimeline);
              }
            }
          } else {
            console.error('Design not found:', designId);
          }
        } catch (error: any) {
          // ✅ IGNORE 401/403 Errors - The Global Modal will handle them
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            return;
          }
          console.error('Failed to load design:', error);
        }
      };
      loadDesign();
    }
  }, [designId]);

  // Timeline: Sync elements to timeline when they change
  useEffect(() => {
    if (elements.length > 0) {
      // Ensure all elements are in timeline
      const timelineElementIds = new Set(
        timeline.tracks.flatMap(t => t.items).map(item => item.elementId)
      );
      const hasUnsynced = elements.some(el => !timelineElementIds.has(el.id));

      if (hasUnsynced || timeline.tracks.flatMap(t => t.items).length === 0) {
        syncElementsToTimeline();
      }
    }
  }, [elements.length, elements.map(e => e.id).join(','), syncElementsToTimeline, timeline.tracks]);  // Sync when elements change

  // Timeline: Sync canvas selection to timeline selection
  useEffect(() => {
    if (selectedIds.length > 0) {
      // Find timeline items for selected elements
      const timelineItems = timeline.tracks
        .flatMap(t => t.items)
        .filter(item => selectedIds.includes(item.elementId));

      if (timelineItems.length > 0) {
        // Select the corresponding timeline items (without causing re-render)
        timelineItems.forEach(item => selectItem(item.id));
      }
    }
  }, [selectedIds.join(',')]); // Use string join to prevent array reference changes

  // Timeline: Apply property playback - show/hide elements based on timeline position
  useEffect(() => {
    // Only apply if we have timeline items
    const hasTimelineItems = timeline.tracks.some(t => t.items.length > 0);

    if (hasTimelineItems) {
      // Apply timeline playback (hybrid mode handles visibility automatically)
      const updatedElements = propertyPlaybackService.applyTimelineToElements(elements as any, timeline);
      setElements(updatedElements as any);
    } else if (elements.length > 0) {
      // Ensure all elements are visible when no timeline items yet
      const visibleElements = elements.map(el => ({ ...el, visible: true }));
      setElements(visibleElements);
    }
  }, [timeline.currentTime, timeline.isPlaying, timeline.tracks.flatMap(t => t.items).length]);

  // Timeline handlers
  const handleTimelineItemSelect = (itemId: string) => {
    selectItem(itemId);
    const item = timeline.tracks
      .flatMap(t => t.items)
      .find(i => i.id === itemId);
    if (item) {
      setSelectedIds([item.elementId]);
    }
  };

  const handleSplitItem = (itemId: string, splitTime: number) => {
    try {
      const updated = timelineService.splitItem(timeline, itemId, splitTime);
      updateTimeline(updated);
    } catch (error) {
      console.error('Split failed:', error);
    }
  };

  const handleArrangeSequential = () => {
    const updated = timelineService.autoArrangeAll(timeline, 500);
    updateTimeline(updated);
  };

  const handleTimelineResize = (e: React.MouseEvent) => {
    const startY = e.clientY;
    const startHeight = timelineHeight;

    const handleMouseMove = (moveE: MouseEvent) => {
      const deltaY = startY - moveE.clientY;
      setTimelineHeight(Math.max(200, Math.min(600, startHeight + deltaY)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return;

      // Handle space key for panning
      if (e.code === 'Space' && !spacePressed) {
        e.preventDefault();
        setSpacePressed(true);
        return;
      }

      // Don't handle keyboard shortcuts if user is typing in an input field
      const target = e.target as HTMLElement;
      const isTypingInInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.contentEditable === 'true');

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z': e.preventDefault(); undo(); break;
          case 'y': e.preventDefault(); redo(); break;
          case 'd': e.preventDefault(); duplicateSelected(); break;
          case 's': e.preventDefault(); openSaveModal(); break; // ✅ Use openSaveModal here
          case 'a':
            e.preventDefault();
            setSelectedIds(elements.map(el => el.id));
            break;
        }
      }
      // Only delete element if not typing in input field
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isTypingInInput) {
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteSelected();
        }
      }
      if (e.key === 'Escape') {
        setSelectedIds([]);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedIds, editingTextId, historyIndex, elements, spacePressed]);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden bg-gray-100"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Top Toolbar */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-30">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">DesignStudio</span>
          </div>

          <div className="h-8 w-px bg-gray-200"></div>

          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className={`p-2 rounded-lg transition-all button-hover-scale ${leftSidebarOpen ? 'bg-slate-100 text-slate-900' : 'hover:bg-gray-100 text-gray-600'}`}
            title="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={undo}
              disabled={historyIndex === 0}
              className="p-2 rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all button-hover-scale"
              title="Undo (Ctrl+Z)"
            >
              <Undo size={18} />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all button-hover-scale"
              title="Redo (Ctrl+Y)"
            >
              <Redo size={18} />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200 mx-2"></div>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-all button-hover-scale ${showGrid ? 'bg-slate-100 text-slate-900' : 'hover:bg-gray-100'}`}
            title="Toggle Grid"
          >
            {showGrid ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button
            onClick={() => setShowSafeZone(!showSafeZone)}
            className={`p-2 rounded-lg transition-all button-hover-scale ${showSafeZone ? 'bg-slate-100 text-slate-900' : 'hover:bg-gray-100'}`}
            title="Toggle Safe Zone"
          >
            <Maximize2 size={18} />
          </button>

          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-2 rounded-lg transition-all button-hover-scale ${snapToGrid ? 'bg-slate-100 text-slate-900' : 'hover:bg-gray-100'}`}
            title="Snap to Grid"
          >
            <Grid3x3 size={18} />
          </button>

          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className={`p-2 rounded-lg transition-all button-hover-scale ${showTimeline ? 'bg-slate-100 text-slate-900' : 'hover:bg-gray-100'}`}
            title="Toggle Timeline"
          >
            <Clock size={18} />
          </button>

          <div className="w-px h-6 bg-gray-200 mx-2"></div>

          <button
            onClick={duplicateSelected}
            disabled={!selectedId}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all button-hover-scale"
            title="Duplicate (Ctrl+D)"
          >
            <Copy size={18} />
          </button>

          <button
            onClick={deleteSelected}
            disabled={!selectedId}
            className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all button-hover-scale"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className={`p-2 rounded-lg transition-all button-hover-scale ${rightSidebarOpen ? 'bg-slate-100 text-slate-900' : 'hover:bg-gray-100 text-gray-600'}`}
            title="Toggle Right Sidebar"
          >
            <Sidebar size={20} className="transform rotate-180" />
          </button>

          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium flex items-center gap-2 button-hover-scale"
          >
            <Layout size={18} />
            Templates
          </button>

          <button
            onClick={() => {
              // Create a temporary design for live preview
              const previewDesign = {
                id: 'temp-preview-' + Date.now(),
                metadata: {
                  title: designTitle || 'Untitled Design',
                  description: '',
                  canvasWidth: canvasSize.width,
                  canvasHeight: canvasSize.height,
                  canvasColor: canvasColor,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                },
                designJSON: {
                  elements: elements,
                  timeline: {
                    tracks: timeline.tracks.map(track => ({
                      ...track,
                      items: track.items.map(item => ({
                        ...item,
                        properties: item.properties || {}
                      }))
                    })),
                    totalDuration: timeline.totalDuration
                  }
                }
              };

              // Navigate to preview with live data
              navigate(`/preview/live`, {
                state: {
                  livePreview: true,
                  designData: previewDesign
                }
              });
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium flex items-center gap-2 shadow-lg shadow-purple-500/30 button-hover-scale"
          >
            <Eye size={18} />
            Preview
          </button>

          <button
            onClick={exportAsImage}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-all font-medium flex items-center gap-2 shadow-lg shadow-slate-500/30 button-hover-scale"
          >
            <Download size={18} />
            Export
          </button>

          {/* ✅ Use openSaveModal instead of saveDesign */}
          <button
            onClick={openSaveModal}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-all font-medium flex items-center gap-2 shadow-lg shadow-slate-900/30 button-hover-scale"
          >
            <Save size={18} />
            Save
          </button>
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-2xl w-full mx-4 modal-content">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Choose a Template</h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {TEMPLATES.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => applyTemplate(template)}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-slate-500 hover:bg-slate-50 transition-all group text-left stagger-item button-hover-scale"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      {template.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-500">{template.width} × {template.height}px</div>
                    </div>
                  </div>
                  <div
                    className="w-full bg-gray-100 rounded-lg border border-gray-200"
                    style={{
                      aspectRatio: `${template.width}/${template.height}`,
                    }}
                  ></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        {leftSidebarOpen && (
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden shadow-lg z-20 sidebar-open">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setActiveLeftTab('design')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${activeLeftTab === 'design'
                  ? 'text-slate-900 border-b-2 border-slate-900 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles size={16} />
                  Design
                </div>
              </button>
              <button
                onClick={() => setActiveLeftTab('templates')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${activeLeftTab === 'templates'
                  ? 'text-slate-900 border-b-2 border-slate-900 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Layout size={16} />
                  Templates
                </div>
              </button>
            </div>

            {activeLeftTab === 'design' && (
              <>
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search elements..."
                      value={searchWidget}
                      onChange={(e) => setSearchWidget(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {WIDGET_CATEGORIES.map(category => {
                    const filteredItems = searchWidget
                      ? category.items.filter(item => item.label.toLowerCase().includes(searchWidget.toLowerCase()))
                      : category.items;

                    if (searchWidget && filteredItems.length === 0) return null;

                    return (
                      <div key={category.id} className="border-b border-gray-100">
                        <button
                          onClick={() => toggleSection(`widgets_${category.id}`)}
                          className="w-full flex items-center justify-between p-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-slate-900">
                              {category.icon}
                            </div>
                            <span>{category.label}</span>
                          </div>
                          {openSections[`widgets_${category.id}`] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        {openSections[`widgets_${category.id}`] && (
                          <div className="p-4 pt-0 grid grid-cols-2 gap-3 animate-fade-in">
                            {filteredItems.map((item, idx) => (
                              <div
                                key={idx}
                                draggable
                                onDragStart={(e) => handleDragStartWidget(e, item.type, (item as any).fontSize)}
                                onClick={() => {
                                  if (item.type === ElementType.IMAGE) {
                                    fileInputRef.current?.click();
                                  } else {
                                    addElement(item.type, 100, 100, (item as any).fontSize);
                                  }
                                }}
                                className="stagger-item flex flex-col items-center gap-2 p-4 rounded-xl cursor-move bg-gradient-to-br from-gray-50 to-white hover:from-slate-50 hover:to-gray-50 hover:shadow-md border-2 border-gray-100 hover:border-slate-200 transition-all group active:scale-95 active:shadow-inner"
                                style={{ animationDelay: `${idx * 0.05}s` }}
                              >
                                <div className="text-gray-600 group-hover:text-slate-900 group-hover:scale-110 transition-all">{item.icon}</div>
                                <span className="text-xs text-gray-600 group-hover:text-slate-900 font-medium text-center">{item.label}</span>
                                <span className="text-xs text-gray-400 group-hover:text-gray-500 font-light">drag to canvas</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {activeLeftTab === 'templates' && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 gap-3">
                  {TEMPLATES.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyTemplate(template)}
                      className="stagger-item p-4 border-2 border-gray-200 rounded-xl hover:border-slate-500 hover:bg-slate-50 transition-all group text-left active:scale-95 hover:shadow-md"
                      style={{ animationDelay: `${idx * 0.08}s` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                          {template.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{template.name}</div>
                          <div className="text-xs text-gray-500">{template.width} × {template.height}px</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          <div
            className={`flex-1 overflow-auto transition-all ${draggingFromSidebar ? 'bg-blue-50' : ''} ${spacePressed || isPanning ? 'cursor-grab' : ''} ${isPanning ? 'cursor-grabbing' : ''}`}
            onClick={() => setSelectedIds([])}
            onMouseDown={(e) => {
              // Start panning with Space + Click or Middle Mouse Button
              if (spacePressed || e.button === 1) {
                e.preventDefault();
                setIsPanning(true);
                setPanStart({ x: e.clientX - canvasPan.x, y: e.clientY - canvasPan.y });
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDraggingFromSidebar(true);
            }}
            onDragLeave={(e) => {
              if (e.target === e.currentTarget) {
                setDraggingFromSidebar(false);
              }
            }}
            onDrop={handleDropOnCanvas}
            onContextMenu={(e) => {
              // Prevent context menu on right click to allow potential future use
              if (e.button === 2) e.preventDefault();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px',
              userSelect: isPanning ? 'none' : 'auto',
            }}
          >
            <div
              ref={canvasRef}
              className="shadow-2xl relative"
              style={{
                width: `${canvasSize.width}px`,
                height: `${canvasSize.height}px`,
                backgroundColor: canvasColor,
                transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${zoom / 100})`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 0.2s ease-out',
              }}
            >
              {/* Timeline Position Indicator - CapCut Style */}
              {showTimeline && timeline.currentTime > 0 && (
                <div className="absolute top-4 left-4 z-50 bg-black/90 text-white px-4 py-2 rounded-lg font-mono text-sm backdrop-blur-sm shadow-2xl border border-white/20">
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{(timeline.currentTime / 1000).toFixed(2)}s / {(timeline.totalDuration / 1000).toFixed(2)}s</span>
                  </div>
                </div>
              )}

              {showGrid && (
                <>
                  <div
                    className="absolute inset-0 pointer-events-none opacity-5"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #0F172A 1.5px, transparent 1.5px)',
                      backgroundSize: '20px 20px'
                    }}
                  />
                  {/* Center Lines */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-400/50 pointer-events-none" style={{ transform: 'translateX(-0.5px)' }} />
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-red-400/50 pointer-events-none" style={{ transform: 'translateY(-0.5px)' }} />
                </>
              )}

              {/* Safe Zone - 10% margin from edges */}
              {showSafeZone && (
                <div
                  className="absolute pointer-events-none border-2 border-green-500 border-dashed"
                  style={{
                    left: '5%',
                    top: '5%',
                    width: '90%',
                    height: '90%',
                  }}
                >
                  <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded">Safe Zone (5%)</div>
                </div>
              )}

              {elements
                .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                .map(el => {
                  // Check if element is in timeline
                  const isInTimeline = timeline.tracks.flatMap(t => t.items).some(item => item.elementId === el.id);
                  const timelineItem = timeline.tracks.flatMap(t => t.items).find(item => item.elementId === el.id);
                  const isActive = timelineItem ?
                    timeline.currentTime >= timelineItem.startTime &&
                    timeline.currentTime < timelineItem.startTime + timelineItem.duration : false;

                  return (
                    <div
                      key={el.id}
                      className={`absolute group select-none transition-all ${newElementIds.has(el.id) ? 'animate-scale-in' : ''
                        } ${selectedIds.includes(el.id)
                          ? 'ring-2 ring-slate-900 shadow-lg animate-glow'
                          : 'hover:ring-2 hover:ring-slate-300 hover:shadow-md'
                        } ${el.locked ? 'cursor-not-allowed' : ''} ${dragInfo?.initialPositions.has(el.id) ? 'opacity-75 ring-2 ring-blue-500 shadow-xl' : ''
                        } ${getAnimationClass(el.animation)}`}
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.width,
                        height: el.height,
                        opacity: dragInfo?.initialPositions.has(el.id) ? 0.75 : el.opacity,
                        zIndex: dragInfo?.initialPositions.has(el.id) ? 1000 : el.zIndex,
                        transform: `rotate(${el.rotation || 0}deg) ${dragInfo?.initialPositions.has(el.id) ? 'scale(1.02)' : ''}`,
                        cursor: el.locked ? 'not-allowed' : (dragInfo?.initialPositions.has(el.id) ? 'grabbing' : 'grab'),
                        transition: dragInfo?.initialPositions.has(el.id) ? 'none' : 'all 0.2s ease',
                        borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                        overflow: 'hidden',
                        animationDuration: el.animation && el.animationDuration ? `${el.animationDuration}s` : undefined,
                        animationTimingFunction: el.animation && el.animationSpeed ? `cubic-bezier(${el.animationSpeed > 1 ? '0.5, 0, 0.5, 1' : '0.25, 0.1, 0.25, 1'})` : undefined,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, el.id)}
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => handleDoubleClick(e, el.id)}
                    >
                      {editingTextId === el.id && [ElementType.TEXT, ElementType.LABEL, ElementType.TICKER, ElementType.RSS, ElementType.MEDIA_RSS, ElementType.FTP].includes(el.type as ElementType) ? (
                        <textarea
                          ref={textInputRef}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={finishEditingText}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              finishEditingText();
                            }
                            if (e.key === 'Escape') finishEditingText();
                          }}
                          className="w-full h-full p-2 border-2 border-slate-900 outline-none resize-none bg-transparent rounded"
                          style={{
                            fontSize: el.fontSize,
                            color: el.color,
                            fontWeight: el.textStyle?.bold ? 'bold' : 'normal',
                            fontStyle: el.textStyle?.italic ? 'italic' : 'normal',
                            textDecoration: el.textStyle?.underline ? 'underline' : 'none',
                            textAlign: el.textStyle?.textAlign || 'center',
                            fontFamily: el.textStyle?.fontFamily || 'Inter, sans-serif',
                          }}
                        />
                      ) : (
                        renderElement(el)
                      )}

                      {selectedIds.includes(el.id) && !el.locked && selectedIds.length === 1 && (
                        <>
                          {/* Resize handles */}
                          <div className="absolute -top-2 -left-2 w-3 h-3 bg-white border-2 border-slate-900 rounded-full cursor-nw-resize shadow-lg hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, el.id, 'nw')}></div>
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-slate-900 rounded-full cursor-n-resize shadow-lg hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, el.id, 'n')}></div>
                          <div className="absolute -top-2 -right-2 w-3 h-3 bg-white border-2 border-slate-900 rounded-full cursor-ne-resize shadow-lg hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, el.id, 'ne')}></div>
                          <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-3 h-3 bg-white border-2 border-slate-900 rounded-full cursor-w-resize shadow-lg hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, el.id, 'w')}></div>
                          <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-3 h-3 bg-white border-2 border-slate-900 rounded-full cursor-e-resize shadow-lg hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, el.id, 'e')}></div>
                          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-white border-2 border-slate-900 rounded-full cursor-sw-resize shadow-lg hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, el.id, 'sw')}></div>
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-slate-900 rounded-full cursor-s-resize shadow-lg hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, el.id, 's')}></div>
                          <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-white border-2 border-slate-900 rounded-full cursor-se-resize shadow-lg hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, el.id, 'se')}></div>
                        </>
                      )}

                      {el.locked && (
                        <div className="absolute top-1 right-1 p-1 bg-gray-900/80 rounded text-white z-50">
                          <Lock size={12} />
                        </div>
                      )}

                      {/* Timeline Badge - CapCut Style with Partition Info */}
                      {isInTimeline && showTimeline && (
                        <div className={`absolute bottom-1 right-1 px-2 py-0.5 rounded text-xs font-medium transition-all ${isActive
                          ? 'bg-green-500 text-white shadow-lg animate-pulse'
                          : 'bg-blue-500/90 text-white opacity-70 hover:opacity-100'
                          }`}>
                          <div className="flex items-center gap-1">
                            <Clock size={10} />
                            <span>{(timelineItem!.startTime / 1000).toFixed(1)}s - {((timelineItem!.startTime + timelineItem!.duration) / 1000).toFixed(1)}s</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Multi-selection bounding box */}
              {selectedIds.length > 1 && (() => {
                const selectedElements = elements.filter(el => selectedIds.includes(el.id));
                if (selectedElements.length === 0) return null;

                const minX = Math.min(...selectedElements.map(el => el.x));
                const minY = Math.min(...selectedElements.map(el => el.y));
                const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
                const maxY = Math.max(...selectedElements.map(el => el.y + el.height));

                return (
                  <div
                    className="absolute border-2 border-dashed border-blue-500 pointer-events-none"
                    style={{
                      left: minX - 4,
                      top: minY - 4,
                      width: maxX - minX + 8,
                      height: maxY - minY + 8,
                    }}
                  >
                    <div className="absolute -top-7 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      {selectedIds.length} items
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="h-14 bg-white/80 backdrop-blur-sm border-t border-gray-200 flex items-center justify-between px-6 z-10">
            <div className="text-sm text-gray-600">
              Canvas: {canvasSize.width} × {canvasSize.height}px
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                className="p-2 hover:bg-white rounded-lg transition-all shadow-sm"
                title="Zoom Out"
              >
                <Minus size={16} />
              </button>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm min-w-[100px] justify-center">
                <span className="text-sm font-semibold">{zoom}%</span>
              </div>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                className="p-2 hover:bg-white rounded-lg transition-all shadow-sm"
                title="Zoom In"
              >
                <Plus size={16} />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <button
                onClick={() => setCanvasPan({ x: 0, y: 0 })}
                className="p-2 hover:bg-white rounded-lg transition-all shadow-sm text-gray-600 hover:text-gray-900"
                title="Reset Pan (Space + Drag to move canvas)"
              >
                <Maximize2 size={16} />
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {elements.length} element{elements.length !== 1 ? 's' : ''}
              {selectedIds.length > 0 && (
                <span className="ml-2 text-slate-900 font-semibold">
                  • {selectedIds.length} selected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        {rightSidebarOpen && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden shadow-lg z-20 sidebar-right-open">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">
                  {selectedElement ? 'Properties' : 'Canvas Settings'}
                </h3>
                <button
                  onClick={() => setRightSidebarOpen(false)}
                  className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-500 hover:text-slate-900"
                  title="Hide Properties"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-1 bg-white p-1 rounded-lg shadow-sm">
                <button
                  onClick={() => setActiveRightTab('properties')}
                  className={`flex-1 px-2 py-2 text-sm font-medium rounded-lg transition-all ${activeRightTab === 'properties'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Settings size={14} />
                    <span className="hidden sm:inline">{selectedElement ? 'Design' : 'Canvas'}</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveRightTab('animation')}
                  className={`flex-1 px-2 py-2 text-sm font-medium rounded-lg transition-all ${activeRightTab === 'animation'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Sparkles size={14} />
                    <span className="hidden sm:inline">Animate</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveRightTab('layers')}
                  className={`flex-1 px-2 py-2 text-sm font-medium rounded-lg transition-all ${activeRightTab === 'layers'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Layers size={14} />
                    <span className="hidden sm:inline">Layers</span>
                  </div>
                </button>
                {selectedIds.length >= 2 && (
                  <button
                    onClick={() => setActiveRightTab('align')}
                    className={`flex-1 px-2 py-2 text-sm font-medium rounded-lg transition-all ${activeRightTab === 'align'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    title="Align multiple selected elements"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Grid3x3 size={14} />
                      <span className="hidden sm:inline">Align</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeRightTab === 'align' ? (
                <div className="space-y-4">
                  <AlignmentToolbar
                    selectedElements={elements.filter(el => selectedIds.includes(el.id))}
                    onElementsUpdate={(updated) => {
                      const newElements = elements.map(el => {
                        const updated_el = updated.find(u => u.id === el.id);
                        return updated_el || el;
                      });
                      setElements(newElements);
                      updateHistory(newElements);
                    }}
                    canvasWidth={canvasSize.width}
                    canvasHeight={canvasSize.height}
                  />
                </div>
              ) : activeRightTab === 'properties' ? (
                <div className="space-y-6">
                  {!selectedElement ? (
                    // Canvas Properties
                    <div className="space-y-6">
                      <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                          <Maximize2 size={14} />
                          Dimensions
                        </h4>

                        {/* Unit Selector */}
                        <div>
                          <label className="text-xs text-gray-600 mb-1.5 block font-medium">Unit</label>
                          <select
                            value={canvasSizeUnit}
                            onChange={(e) => setCanvasSizeUnit(e.target.value as typeof canvasSizeUnit)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all bg-white"
                          >
                            <option value="px">Pixels (px)</option>
                            <option value="mm">Millimeters (mm)</option>
                            <option value="cm">Centimeters (cm)</option>
                            <option value="m">Meters (m)</option>
                            <option value="in">Inches (in)</option>
                            <option value="ft">Feet (ft)</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-600 mb-1.5 block font-medium">Width ({canvasSizeUnit})</label>
                            <input
                              type="number"
                              value={Math.round(convertFromPx(canvasSize.width, canvasSizeUnit) * 100) / 100}
                              onChange={(e) => {
                                const pxValue = convertToPx(Number(e.target.value), canvasSizeUnit);
                                setCanvasSize(prev => ({ ...prev, width: Math.round(pxValue) }));
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 mb-1.5 block font-medium">Height ({canvasSizeUnit})</label>
                            <input
                              type="number"
                              value={Math.round(convertFromPx(canvasSize.height, canvasSizeUnit) * 100) / 100}
                              onChange={(e) => {
                                const pxValue = convertToPx(Number(e.target.value), canvasSizeUnit);
                                setCanvasSize(prev => ({ ...prev, height: Math.round(pxValue) }));
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Pixel display for reference */}
                        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                          Reference: {canvasSize.width} × {canvasSize.height}px
                        </div>
                      </div>

                      <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                          <Palette size={14} />
                          Background
                        </h4>
                        <div>
                          <label className="text-xs text-gray-600 mb-2 block font-medium">Canvas Color</label>
                          <div className="flex gap-2 items-center mb-3">
                            <input
                              type="color"
                              value={canvasColor}
                              onChange={(e) => setCanvasColor(e.target.value)}
                              className="h-10 w-10 rounded-lg cursor-pointer border-2 border-gray-300 shadow-sm"
                            />
                            <input
                              type="text"
                              value={canvasColor}
                              onChange={(e) => setCanvasColor(e.target.value)}
                              className="flex-1 min-w-0 text-sm font-mono bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 uppercase"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Selected Element Properties (Existing Code)
                    <>
                      <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                          <MousePointer2 size={14} />
                          Position & Size
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-600 mb-1.5 block font-medium">X Position</label>
                            <input
                              type="number"
                              value={Math.round(selectedElement.x)}
                              onChange={(e) => updateSelectedElement('x', Number(e.target.value))}
                              onBlur={() => updateHistory(elements)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 mb-1.5 block font-medium">Y Position</label>
                            <input
                              type="number"
                              value={Math.round(selectedElement.y)}
                              onChange={(e) => updateSelectedElement('y', Number(e.target.value))}
                              onBlur={() => updateHistory(elements)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 mb-1.5 block font-medium">Width</label>
                            <input
                              type="number"
                              value={Math.round(selectedElement.width)}
                              onChange={(e) => updateSelectedElement('width', Number(e.target.value))}
                              onBlur={() => updateHistory(elements)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 mb-1.5 block font-medium">Height</label>
                            <input
                              type="number"
                              value={Math.round(selectedElement.height)}
                              onChange={(e) => updateSelectedElement('height', Number(e.target.value))}
                              onBlur={() => updateHistory(elements)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                            />
                          </div>
                        </div>

                        {/* Alignment */}
                        <div className="pt-3 border-t border-gray-100">
                          <label className="text-xs text-gray-600 mb-2 block font-medium">Quick Align</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => alignElements('left')} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all" title="Align Left">
                              <AlignLeft size={16} className="mx-auto" />
                            </button>
                            <button onClick={() => alignElements('center')} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all" title="Align Center">
                              <AlignCenter size={16} className="mx-auto" />
                            </button>
                            <button onClick={() => alignElements('right')} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all" title="Align Right">
                              <AlignRight size={16} className="mx-auto" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Effects */}
                      <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                          <Sparkles size={14} />
                          Effects
                        </h4>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-xs text-gray-600 font-medium">Opacity</label>
                            <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">{Math.round((selectedElement.opacity || 1) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={selectedElement.opacity || 1}
                            onChange={(e) => updateSelectedElement('opacity', Number(e.target.value))}
                            onMouseUp={() => updateHistory(elements)}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-xs text-gray-600 font-medium">Rotation</label>
                            <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">{Math.round(selectedElement.rotation || 0)}°</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="1"
                            value={selectedElement.rotation || 0}
                            onChange={(e) => updateSelectedElement('rotation', Number(e.target.value))}
                            onMouseUp={() => updateHistory(elements)}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                          />
                        </div>

                        {([ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.LINE].includes(selectedElement.type as ElementType) || selectedElement.type === ElementType.IMAGE) && (
                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Border Radius</label>
                            <input
                              type="number"
                              value={selectedElement.borderRadius || 0}
                              onChange={(e) => updateSelectedElement('borderRadius', Number(e.target.value))}
                              onBlur={() => updateHistory(elements)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>
                        )}
                      </div>

                      {/* Colors */}
                      {(selectedElement.type === ElementType.TEXT || [ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.LINE].includes(selectedElement.type as ElementType)) && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Palette size={14} />
                            Colors
                          </h4>

                          {selectedElement.type === ElementType.TEXT && (
                            <>
                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Text Color</label>
                                <div className="flex gap-2 items-center mb-3">
                                  <input
                                    type="color"
                                    value={selectedElement.color || '#000000'}
                                    onChange={(e) => {
                                      updateSelectedElement('color', e.target.value);
                                      updateHistory(elements);
                                    }}
                                    className="h-10 w-10 rounded-lg cursor-pointer border-2 border-gray-300 shadow-sm"
                                  />
                                  <input
                                    type="text"
                                    value={selectedElement.color || '#000000'}
                                    onChange={(e) => updateSelectedElement('color', e.target.value)}
                                    onBlur={() => updateHistory(elements)}
                                    className="flex-1 min-w-0 text-sm font-mono bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 uppercase"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Background Color</label>
                                <div className="flex gap-2 items-center mb-3">
                                  <input
                                    type="color"
                                    value={selectedElement.backgroundColor || '#FFFFFF'}
                                    onChange={(e) => {
                                      updateSelectedElement('backgroundColor', e.target.value);
                                      updateHistory(elements);
                                    }}
                                    className="h-10 w-10 rounded-lg cursor-pointer border-2 border-gray-300 shadow-sm"
                                  />
                                  <input
                                    type="text"
                                    value={selectedElement.backgroundColor || '#FFFFFF'}
                                    onChange={(e) => updateSelectedElement('backgroundColor', e.target.value)}
                                    onBlur={() => updateHistory(elements)}
                                    className="flex-1 min-w-0 text-sm font-mono bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 uppercase"
                                  />
                                  <button
                                    onClick={() => {
                                      updateSelectedElement('backgroundColor', undefined);
                                      updateHistory(elements);
                                    }}
                                    className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    title="Clear background"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                            </>
                          )}

                          {[ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.LINE].includes(selectedElement.type as ElementType) && (
                            <div>
                              <label className="text-xs text-gray-600 mb-2 block font-medium">Fill Color</label>
                              <div className="flex gap-2 items-center mb-3">
                                <input
                                  type="color"
                                  value={selectedElement.fillColor || '#4ECDC4'}
                                  onChange={(e) => {
                                    updateSelectedElement('fillColor', e.target.value);
                                    updateHistory(elements);
                                  }}
                                  className="h-10 w-10 rounded-lg cursor-pointer border-2 border-gray-300 shadow-sm"
                                />
                                <input
                                  type="text"
                                  value={selectedElement.fillColor || '#4ECDC4'}
                                  onChange={(e) => updateSelectedElement('fillColor', e.target.value)}
                                  onBlur={() => updateHistory(elements)}
                                  className="flex-1 min-w-0 text-sm font-mono bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 uppercase"
                                />
                              </div>
                            </div>
                          )}

                          {/* Color Palette */}
                          <div className="animate-fade-in">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs text-gray-600 font-medium">Palette</label>
                              <select
                                value={selectedPalette}
                                onChange={(e) => setSelectedPalette(e.target.value as keyof typeof COLOR_PALETTES)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors-smooth hover:border-slate-400 cursor-pointer"
                              >
                                {Object.keys(COLOR_PALETTES).map(key => (
                                  <option key={key} value={key}>{key}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-2 flex-wrap animate-fade-in">
                              {COLOR_PALETTES[selectedPalette].map((color, idx) => (
                                <button
                                  key={color}
                                  onClick={() => {
                                    if (selectedElement.type === ElementType.TEXT) {
                                      updateSelectedElement('color', color);
                                    } else {
                                      updateSelectedElement('fillColor', color);
                                    }
                                    updateHistory(elements);
                                  }}
                                  className="stagger-item w-8 h-8 rounded-lg border-2 hover:scale-125 transition-transform shadow-sm active:scale-95"
                                  style={{
                                    backgroundColor: color,
                                    borderColor: (selectedElement.type === ElementType.TEXT ? selectedElement.color : selectedElement.fillColor) === color ? '#0F172A' : '#E5E7EB',
                                    animationDelay: `${idx * 0.05}s`
                                  }}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Gradients */}
                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Gradients</label>
                            <div className="grid grid-cols-2 gap-2">
                              {GRADIENTS.map(gradient => (
                                <button
                                  key={gradient.name}
                                  onClick={() => {
                                    if (selectedElement.type === ElementType.TEXT) {
                                      updateSelectedElement('color', gradient.value);
                                    } else {
                                      updateSelectedElement('fillColor', gradient.value);
                                    }
                                    updateHistory(elements);
                                  }}
                                  className="h-10 rounded-lg border-2 border-gray-200 hover:border-slate-400 hover:scale-105 transition-all shadow-sm"
                                  style={{ background: gradient.value }}
                                  title={gradient.name}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Widget-Specific Properties */}

                      {/* Text & Label Typography */}
                      {[ElementType.TEXT, ElementType.LABEL].includes(selectedElement.type as ElementType) && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Type size={14} />
                            Typography
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Font Size</label>
                            <input
                              type="number"
                              value={selectedElement.fontSize || 24}
                              onChange={(e) => updateSelectedElement('fontSize', Number(e.target.value))}
                              onBlur={() => updateHistory(elements)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Text Style</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  updateSelectedElement('textStyle', { ...selectedElement.textStyle, bold: !selectedElement.textStyle?.bold });
                                  updateHistory(elements);
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg font-bold border-2 transition-all ${selectedElement.textStyle?.bold
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'border-gray-200 text-gray-600 hover:border-slate-300'
                                  }`}
                              >
                                B
                              </button>
                              <button
                                onClick={() => {
                                  updateSelectedElement('textStyle', { ...selectedElement.textStyle, italic: !selectedElement.textStyle?.italic });
                                  updateHistory(elements);
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg italic border-2 transition-all ${selectedElement.textStyle?.italic
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'border-gray-200 text-gray-600 hover:border-slate-300'
                                  }`}
                              >
                                I
                              </button>
                              <button
                                onClick={() => {
                                  updateSelectedElement('textStyle', { ...selectedElement.textStyle, underline: !selectedElement.textStyle?.underline });
                                  updateHistory(elements);
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg underline border-2 transition-all ${selectedElement.textStyle?.underline
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'border-gray-200 text-gray-600 hover:border-slate-300'
                                  }`}
                              >
                                U
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Text Align</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  updateSelectedElement('textStyle', { ...selectedElement.textStyle, textAlign: 'left' });
                                  updateHistory(elements);
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${selectedElement.textStyle?.textAlign === 'left'
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'border-gray-200 text-gray-600 hover:border-slate-300'
                                  }`}
                              >
                                <AlignLeft size={16} className="mx-auto" />
                              </button>
                              <button
                                onClick={() => {
                                  updateSelectedElement('textStyle', { ...selectedElement.textStyle, textAlign: 'center' });
                                  updateHistory(elements);
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${selectedElement.textStyle?.textAlign === 'center'
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'border-gray-200 text-gray-600 hover:border-slate-300'
                                  }`}
                              >
                                <AlignCenter size={16} className="mx-auto" />
                              </button>
                              <button
                                onClick={() => {
                                  updateSelectedElement('textStyle', { ...selectedElement.textStyle, textAlign: 'right' });
                                  updateHistory(elements);
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${selectedElement.textStyle?.textAlign === 'right'
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'border-gray-200 text-gray-600 hover:border-slate-300'
                                  }`}
                              >
                                <AlignRight size={16} className="mx-auto" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Content</label>
                            <textarea
                              value={selectedElement.content}
                              onChange={(e) => updateSelectedElement('content', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              className="w-full h-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Image & Media Properties */}
                      {[ElementType.IMAGE, ElementType.GIF, ElementType.WEB_IMAGE].includes(selectedElement.type as ElementType) && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <ImageIcon size={14} />
                            Image Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Image URL</label>
                            <input
                              type="text"
                              value={selectedElement.content}
                              onChange={(e) => updateSelectedElement('content', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="https://example.com/image.jpg"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Upload Image</label>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-medium"
                            >
                              Choose File
                            </button>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Fit Mode</label>
                            <select
                              value={selectedElement.widgetSettings?.fitMode || 'cover'}
                              onChange={(e) => updateWidgetSettingsImmediate('fitMode', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="cover">Cover (Fill)</option>
                              <option value="contain">Contain (Fit)</option>
                              <option value="fill">Stretch to Fill</option>
                              <option value="none">Original Size</option>
                            </select>
                          </div>

                          {selectedElement.type === ElementType.GIF && (
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <input
                                type="checkbox"
                                id="gif-autoplay"
                                className="rounded"
                                checked={selectedElement.widgetSettings?.autoplay ?? true}
                                onChange={(e) => updateWidgetSettingsImmediate('autoplay', e.target.checked)}
                              />
                              <label htmlFor="gif-autoplay" className="text-xs text-gray-600">Auto-play GIF</label>
                            </div>
                          )}
                        </div>
                      )}

                      {/* HTML Embed Properties */}
                      {selectedElement.type === ElementType.HTML && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <FileText size={14} />
                            HTML Code
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">HTML Content</label>
                            <textarea
                              value={selectedElement.content}
                              onChange={(e) => updateSelectedElement('content', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="<div>Your HTML here</div>"
                              className="w-full h-48 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-2">Enter HTML code. JavaScript is sandboxed for security.</p>
                          </div>
                        </div>
                      )}

                      {/* Video & Streaming Properties */}
                      {[ElementType.VIDEO, ElementType.WEB_VIDEO, ElementType.YOUTUBE, ElementType.USTREAM, ElementType.STREAMING].includes(selectedElement.type as ElementType) && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Video size={14} />
                            Video Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">
                              {selectedElement.type === ElementType.YOUTUBE ? 'YouTube URL/ID' : 'Video URL'}
                            </label>
                            <input
                              type="text"
                              value={selectedElement.widgetSettings?.videoUrl || selectedElement.content || ''}
                              onChange={(e) => {
                                updateSelectedElement('content', e.target.value);
                                updateWidgetSettings('videoUrl', e.target.value);
                              }}
                              onBlur={() => updateHistory(elements)}
                              placeholder={selectedElement.type === ElementType.YOUTUBE ? '...' : 'https://example.com/video.mp4'}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <input
                                type="checkbox"
                                id="autoplay"
                                className="rounded"
                                checked={selectedElement.widgetSettings?.autoplay || false}
                                onChange={(e) => updateWidgetSettingsImmediate('autoplay', e.target.checked)}
                              />
                              <label htmlFor="autoplay" className="text-xs text-gray-600">Autoplay</label>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <input
                                type="checkbox"
                                id="loop"
                                className="rounded"
                                checked={selectedElement.widgetSettings?.loop ?? true}
                                onChange={(e) => updateWidgetSettingsImmediate('loop', e.target.checked)}
                              />
                              <label htmlFor="loop" className="text-xs text-gray-600">Loop</label>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <input
                                type="checkbox"
                                id="mute"
                                className="rounded"
                                checked={selectedElement.widgetSettings?.mute ?? false}
                                onChange={(e) => updateWidgetSettingsImmediate('mute', e.target.checked)}
                              />
                              <label htmlFor="mute" className="text-xs text-gray-600">Mute</label>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <input
                                type="checkbox"
                                id="controls"
                                className="rounded"
                                checked={selectedElement.widgetSettings?.controls ?? true}
                                onChange={(e) => updateWidgetSettingsImmediate('controls', e.target.checked)}
                              />
                              <label htmlFor="controls" className="text-xs text-gray-600">Controls</label>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Playback Speed</label>
                            <select
                              value={selectedElement.widgetSettings?.playbackSpeed || '1'}
                              onChange={(e) => updateWidgetSettingsImmediate('playbackSpeed', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="0.5">0.5x (Half Speed)</option>
                              <option value="0.75">0.75x</option>
                              <option value="1">1x (Normal)</option>
                              <option value="1.25">1.25x</option>
                              <option value="1.5">1.5x</option>
                              <option value="2">2x (Double Speed)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Volume</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={selectedElement.widgetSettings?.volume || 100}
                              onChange={(e) => updateWidgetSettings('volume', Number(e.target.value))}
                              className="w-full"
                            />
                            <div className="text-xs text-gray-500 text-center mt-1">{selectedElement.widgetSettings?.volume || 100}%</div>
                          </div>
                        </div>
                      )}

                      {/* Slideshow Properties */}
                      {selectedElement.type === ElementType.SLIDESHOW && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Layout size={14} />
                            Slideshow Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Image URLs (one per line)</label>
                            <textarea
                              value={selectedElement.content}
                              onChange={(e) => updateSelectedElement('content', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                              className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all resize-none"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Transition Duration (seconds)</label>
                            <input
                              type="number"
                              value={selectedElement.widgetSettings?.transitionDuration || 5}
                              onChange={(e) => updateWidgetSettings('transitionDuration', Number(e.target.value))}
                              onBlur={() => updateHistory(elements)}
                              min={1}
                              max={60}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Transition Effect</label>
                            <select
                              value={selectedElement.widgetSettings?.transitionEffect || 'fade'}
                              onChange={(e) => updateWidgetSettingsImmediate('transitionEffect', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="fade">Fade</option>
                              <option value="slide">Slide</option>
                              <option value="zoom">Zoom</option>
                              <option value="flip">Flip</option>
                              <option value="cube">Cube</option>
                              <option value="dissolve">Dissolve</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <input
                              type="checkbox"
                              id="slideshow-autoplay"
                              className="rounded"
                              checked={selectedElement.widgetSettings?.autoplay ?? true}
                              onChange={(e) => updateWidgetSettingsImmediate('autoplay', e.target.checked)}
                            />
                            <label htmlFor="slideshow-autoplay" className="text-xs text-gray-600">Auto-play slideshow</label>
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <input
                              type="checkbox"
                              id="slideshow-loop"
                              className="rounded"
                              checked={selectedElement.widgetSettings?.loop ?? true}
                              onChange={(e) => updateWidgetSettingsImmediate('loop', e.target.checked)}
                            />
                            <label htmlFor="slideshow-loop" className="text-xs text-gray-600">Loop slideshow</label>
                          </div>
                        </div>
                      )}

                      {/* Ticker Properties */}
                      {selectedElement.type === ElementType.TICKER && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Type size={14} />
                            Ticker Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Ticker Text</label>
                            <textarea
                              value={selectedElement.content}
                              onChange={(e) => updateSelectedElement('content', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="Breaking News • Latest Updates • Top Stories"
                              className="w-full h-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all resize-none"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Scroll Speed</label>
                            <select
                              value={selectedElement.widgetSettings?.scrollSpeed || 'medium'}
                              onChange={(e) => updateWidgetSettingsImmediate('scrollSpeed', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="slow">Slow</option>
                              <option value="medium">Medium</option>
                              <option value="fast">Fast</option>
                              <option value="very-fast">Very Fast</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Direction</label>
                            <select
                              value={selectedElement.widgetSettings?.direction || 'left'}
                              onChange={(e) => updateWidgetSettingsImmediate('direction', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="left">Left to Right</option>
                              <option value="right">Right to Left</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Font Size</label>
                            <input
                              type="number"
                              value={selectedElement.fontSize || 20}
                              onChange={(e) => updateSelectedElement('fontSize', Number(e.target.value))}
                              onBlur={() => updateHistory(elements)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <input
                              type="checkbox"
                              id="ticker-loop"
                              className="rounded"
                              checked={selectedElement.widgetSettings?.loop ?? true}
                              onChange={(e) => updateWidgetSettingsImmediate('loop', e.target.checked)}
                            />
                            <label htmlFor="ticker-loop" className="text-xs text-gray-600">Continuous loop</label>
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <input
                              type="checkbox"
                              id="ticker-pauseOnHover"
                              className="rounded"
                              checked={selectedElement.widgetSettings?.pauseOnHover ?? false}
                              onChange={(e) => updateWidgetSettingsImmediate('pauseOnHover', e.target.checked)}
                            />
                            <label htmlFor="ticker-pauseOnHover" className="text-xs text-gray-600">Pause on hover</label>
                          </div>
                        </div>
                      )}

                      {/* RSS & Media RSS Properties */}
                      {[ElementType.RSS, ElementType.MEDIA_RSS].includes(selectedElement.type as ElementType) && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <FileText size={14} />
                            RSS Feed Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Feed URL</label>
                            <input
                              type="text"
                              value={selectedElement.content}
                              onChange={(e) => updateSelectedElement('content', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="https://example.com/rss"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Update Interval (minutes)</label>
                            <input
                              type="number"
                              value={selectedElement.widgetSettings?.updateInterval || 15}
                              onChange={(e) => updateWidgetSettings('updateInterval', Number(e.target.value))}
                              onBlur={() => updateHistory(elements)}
                              min={1}
                              max={1440}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Max Items to Display</label>
                            <input
                              type="number"
                              value={selectedElement.widgetSettings?.maxItems || 5}
                              onChange={(e) => updateWidgetSettings('maxItems', Number(e.target.value))}
                              onBlur={() => updateHistory(elements)}
                              min={1}
                              max={50}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Display Mode</label>
                            <select
                              value={selectedElement.widgetSettings?.displayMode || 'scroll'}
                              onChange={(e) => updateWidgetSettingsImmediate('displayMode', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="scroll">Scrolling List</option>
                              <option value="static">Static List</option>
                              <option value="fade">Fade In/Out</option>
                              <option value="ticker">Ticker Style</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <input
                              type="checkbox"
                              id="rss-showImages"
                              className="rounded"
                              checked={selectedElement.widgetSettings?.showImages ?? true}
                              onChange={(e) => updateWidgetSettingsImmediate('showImages', e.target.checked)}
                            />
                            <label htmlFor="rss-showImages" className="text-xs text-gray-600">Show images</label>
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <input
                              type="checkbox"
                              id="rss-showDate"
                              className="rounded"
                              checked={selectedElement.widgetSettings?.showDate ?? true}
                              onChange={(e) => updateWidgetSettingsImmediate('showDate', e.target.checked)}
                            />
                            <label htmlFor="rss-showDate" className="text-xs text-gray-600">Show publish date</label>
                          </div>
                        </div>
                      )}

                      {/* Weather Properties */}
                      {[ElementType.WEATHER, ElementType.WEATHER_2].includes(selectedElement.type as ElementType) && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <CloudSun size={14} />
                            Weather Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Location</label>
                            <input
                              type="text"
                              value={selectedElement.widgetSettings?.location || 'New York, NY'}
                              onChange={(e) => updateWidgetSettings('location', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="New York, NY"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Temperature Unit</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateWidgetSettingsImmediate('temperatureUnit', 'F')}
                                className={`flex-1 px-3 py-2 rounded-lg border-2 ${selectedElement.widgetSettings?.temperatureUnit === 'F' ? 'bg-slate-900 text-white border-slate-900' : 'border-gray-200 text-gray-600 hover:border-slate-300'}`}
                              >
                                °F
                              </button>
                              <button
                                onClick={() => updateWidgetSettingsImmediate('temperatureUnit', 'C')}
                                className={`flex-1 px-3 py-2 rounded-lg border-2 ${selectedElement.widgetSettings?.temperatureUnit === 'C' ? 'bg-slate-900 text-white border-slate-900' : 'border-gray-200 text-gray-600 hover:border-slate-300'}`}
                              >
                                °C
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Update Interval (minutes)</label>
                            <input
                              type="number"
                              value={selectedElement.widgetSettings?.updateInterval || 30}
                              onChange={(e) => updateWidgetSettings('updateInterval', Number(e.target.value))}
                              onBlur={() => updateHistory(elements)}
                              min={5}
                              max={1440}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Display Style</label>
                            <select
                              value={selectedElement.widgetSettings?.displayStyle || 'current'}
                              onChange={(e) => updateWidgetSettingsImmediate('displayStyle', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="current">Current Conditions</option>
                              <option value="forecast">5-Day Forecast</option>
                              <option value="hourly">Hourly Forecast</option>
                              <option value="detailed">Detailed View</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">API Key</label>
                            <input
                              type="password"
                              value={selectedElement.widgetSettings?.apiKey || ''}
                              onChange={(e) => updateWidgetSettings('apiKey', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="Enter weather API key"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <input
                              type="checkbox"
                              id="weather-showIcon"
                              className="rounded"
                              checked={selectedElement.widgetSettings?.showIcon ?? true}
                              onChange={(e) => updateWidgetSettingsImmediate('showIcon', e.target.checked)}
                            />
                            <label htmlFor="weather-showIcon" className="text-xs text-gray-600">Show weather icon</label>
                          </div>
                        </div>
                      )}

                      {/* Clock Properties */}
                      {selectedElement.type === ElementType.CLOCK && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Clock size={14} />
                            Clock Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Time Format</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateWidgetSettingsImmediate('timeFormat', '12')}
                                className={`flex-1 px-3 py-2 rounded-lg border-2 ${selectedElement.widgetSettings?.timeFormat === '12' ? 'bg-slate-900 text-white border-slate-900' : 'border-gray-200 text-gray-600 hover:border-slate-300'}`}
                              >
                                12 Hour
                              </button>
                              <button
                                onClick={() => updateWidgetSettingsImmediate('timeFormat', '24')}
                                className={`flex-1 px-3 py-2 rounded-lg border-2 ${selectedElement.widgetSettings?.timeFormat === '24' ? 'bg-slate-900 text-white border-slate-900' : 'border-gray-200 text-gray-600 hover:border-slate-300'}`}
                              >
                                24 Hour
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Timezone</label>
                            <select
                              value={selectedElement.widgetSettings?.timezone || 'America/New_York'}
                              onChange={(e) => updateWidgetSettingsImmediate('timezone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="America/New_York">America/New_York (EST)</option>
                              <option value="America/Chicago">America/Chicago (CST)</option>
                              <option value="America/Denver">America/Denver (MST)</option>
                              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                              <option value="Europe/London">Europe/London (GMT)</option>
                              <option value="Europe/Paris">Europe/Paris (CET)</option>
                              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                              <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Display Style</label>
                            <select
                              value={selectedElement.widgetSettings?.displayStyle || 'digital'}
                              onChange={(e) => updateWidgetSettingsImmediate('displayStyle', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="digital">Digital</option>
                              <option value="analog">Analog</option>
                              <option value="text">Text Format</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Font Size</label>
                            <input
                              type="number"
                              value={selectedElement.fontSize || 48}
                              onChange={(e) => updateSelectedElement('fontSize', Number(e.target.value))}
                              onBlur={() => updateHistory(elements)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <input
                              type="checkbox"
                              id="clock-showSeconds"
                              className="rounded"
                              checked={selectedElement.widgetSettings?.showSeconds ?? true}
                              onChange={(e) => updateWidgetSettingsImmediate('showSeconds', e.target.checked)}
                            />
                            <label htmlFor="clock-showSeconds" className="text-xs text-gray-600">Show seconds</label>
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <input
                              type="checkbox"
                              id="clock-showDate"
                              className="rounded"
                              checked={selectedElement.widgetSettings?.showDate ?? true}
                              onChange={(e) => updateWidgetSettingsImmediate('showDate', e.target.checked)}
                            />
                            <label htmlFor="clock-showDate" className="text-xs text-gray-600">Show date</label>
                          </div>
                        </div>
                      )}

                      {/* Timer Properties */}
                      {selectedElement.type === ElementType.TIMER && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Clock size={14} />
                            Timer Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Timer Type</label>
                            <select
                              value={selectedElement.widgetSettings?.timerType || 'countdown'}
                              onChange={(e) => updateWidgetSettingsImmediate('timerType', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="countdown">Countdown</option>
                              <option value="countup">Count Up</option>
                              <option value="stopwatch">Stopwatch</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Countdown To</label>
                            <input
                              type="datetime-local"
                              value={selectedElement.widgetSettings?.countdownTo || ''}
                              onChange={(e) => updateWidgetSettings('countdownTo', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Display Format</label>
                            <select
                              value={selectedElement.widgetSettings?.displayFormat || 'HH:MM:SS'}
                              onChange={(e) => updateWidgetSettingsImmediate('displayFormat', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="HH:MM:SS">HH:MM:SS</option>
                              <option value="DD:HH:MM:SS">DD:HH:MM:SS</option>
                              <option value="Days, Hours, Minutes">Days, Hours, Minutes</option>
                              <option value="Seconds">Seconds Only</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Label Text</label>
                            <input
                              type="text"
                              value={selectedElement.widgetSettings?.labelText || ''}
                              onChange={(e) => updateWidgetSettings('labelText', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="e.g., Time Until Launch"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <input
                              type="checkbox"
                              id="timer-autoStart"
                              className="rounded"
                              checked={selectedElement.widgetSettings?.autoStart ?? true}
                              onChange={(e) => updateWidgetSettingsImmediate('autoStart', e.target.checked)}
                            />
                            <label htmlFor="timer-autoStart" className="text-xs text-gray-600">Auto-start timer</label>
                          </div>
                        </div>
                      )}

                      {/* Calendar Properties */}
                      {selectedElement.type === ElementType.CALENDAR && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Grid3x3 size={14} />
                            Calendar Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Calendar Source</label>
                            <select
                              value={selectedElement.widgetSettings?.calendarSource || 'google'}
                              onChange={(e) => updateWidgetSettingsImmediate('calendarSource', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="google">Google Calendar</option>
                              <option value="outlook">Outlook Calendar</option>
                              <option value="ical">Custom iCal URL</option>
                              <option value="local">Local Events</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Calendar URL / API Key</label>
                            <input
                              type="text"
                              value={selectedElement.widgetSettings?.calendarUrl || ''}
                              onChange={(e) => updateWidgetSettings('calendarUrl', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="Calendar URL or API key"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">View Mode</label>
                            <select
                              value={selectedElement.widgetSettings?.viewMode || 'monthly'}
                              onChange={(e) => updateWidgetSettingsImmediate('viewMode', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="monthly">Monthly Grid</option>
                              <option value="weekly">Weekly View</option>
                              <option value="agenda">Agenda List</option>
                              <option value="day">Single Day</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Color Scheme</label>
                            <select
                              value={selectedElement.widgetSettings?.colorScheme || 'default'}
                              onChange={(e) => updateWidgetSettingsImmediate('colorScheme', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="default">Default</option>
                              <option value="blue">Blue</option>
                              <option value="green">Green</option>
                              <option value="purple">Purple</option>
                              <option value="dark">Dark Mode</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <input
                              type="checkbox"
                              id="calendar-showWeekends"
                              className="rounded"
                              checked={selectedElement.widgetSettings?.showWeekends ?? true}
                              onChange={(e) => updateWidgetSettingsImmediate('showWeekends', e.target.checked)}
                            />
                            <label htmlFor="calendar-showWeekends" className="text-xs text-gray-600">Show weekends</label>
                          </div>
                        </div>
                      )}

                      {/* Table Properties */}
                      {selectedElement.type === ElementType.TABLE && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Grid3x3 size={14} />
                            Table Settings
                          </h4>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600 mb-2 block font-medium">Rows</label>
                              <input
                                type="number"
                                value={selectedElement.widgetSettings?.rows || 5}
                                onChange={(e) => updateWidgetSettings('rows', Number(e.target.value))}
                                onBlur={() => updateHistory(elements)}
                                min={1}
                                max={100}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 mb-2 block font-medium">Columns</label>
                              <input
                                type="number"
                                value={selectedElement.widgetSettings?.columns || 3}
                                onChange={(e) => updateWidgetSettings('columns', Number(e.target.value))}
                                onBlur={() => updateHistory(elements)}
                                min={1}
                                max={20}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Data Source</label>
                            <select
                              value={selectedElement.widgetSettings?.dataSource || 'manual'}
                              onChange={(e) => updateWidgetSettingsImmediate('dataSource', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="manual">Manual Entry</option>
                              <option value="csv">CSV Import</option>
                              <option value="sheets">Google Sheets</option>
                              <option value="api">API Endpoint</option>
                              <option value="database">Database Query</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Data URL (for CSV/API/Sheets)</label>
                            <input
                              type="text"
                              value={selectedElement.widgetSettings?.dataUrl || ''}
                              onChange={(e) => updateWidgetSettings('dataUrl', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="https://example.com/data.csv"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Table Style</label>
                            <select
                              value={selectedElement.widgetSettings?.tableStyle || 'default'}
                              onChange={(e) => updateWidgetSettingsImmediate('tableStyle', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="default">Default</option>
                              <option value="striped">Striped Rows</option>
                              <option value="bordered">Bordered</option>
                              <option value="minimal">Minimal</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <input
                              type="checkbox"
                              id="table-showHeader"
                              className="rounded"
                              checked={selectedElement.widgetSettings?.showHeader ?? true}
                              onChange={(e) => updateWidgetSettingsImmediate('showHeader', e.target.checked)}
                            />
                            <label htmlFor="table-showHeader" className="text-xs text-gray-600">Show header row</label>
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <input
                              type="checkbox"
                              id="table-sortable"
                              className="rounded"
                              checked={selectedElement.widgetSettings?.sortable ?? false}
                              onChange={(e) => updateWidgetSettingsImmediate('sortable', e.target.checked)}
                            />
                            <label htmlFor="table-sortable" className="text-xs text-gray-600">Enable sorting</label>
                          </div>
                        </div>
                      )}

                      {/* Dashboards Properties */}
                      {selectedElement.type === ElementType.DASHBOARDS && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Layout size={14} />
                            Dashboard Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Dashboard Type</label>
                            <select
                              value={selectedElement.widgetSettings?.dashboardType || 'metrics'}
                              onChange={(e) => updateWidgetSettingsImmediate('dashboardType', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="metrics">Metrics Overview</option>
                              <option value="analytics">Analytics</option>
                              <option value="kpi">KPI Dashboard</option>
                              <option value="custom">Custom Widgets</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Data Source</label>
                            <input
                              type="text"
                              value={selectedElement.widgetSettings?.dataUrl || ''}
                              onChange={(e) => updateWidgetSettings('dataUrl', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="API Endpoint URL"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Refresh Rate (seconds)</label>
                            <input
                              type="number"
                              value={selectedElement.widgetSettings?.refreshRate || 30}
                              onChange={(e) => updateWidgetSettings('refreshRate', Number(e.target.value))}
                              onBlur={() => updateHistory(elements)}
                              min={5}
                              max={3600}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Layout</label>
                            <select
                              value={selectedElement.widgetSettings?.layout || 'grid'}
                              onChange={(e) => updateWidgetSettingsImmediate('layout', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="grid">Grid Layout</option>
                              <option value="list">List Layout</option>
                              <option value="compact">Compact View</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <input
                              type="checkbox"
                              id="dashboard-showCharts"
                              className="rounded"
                              checked={selectedElement.widgetSettings?.showCharts ?? true}
                              onChange={(e) => updateWidgetSettingsImmediate('showCharts', e.target.checked)}
                            />
                            <label htmlFor="dashboard-showCharts" className="text-xs text-gray-600">Show charts</label>
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <input
                              type="checkbox"
                              id="dashboard-autoRefresh"
                              className="rounded"
                              checked={selectedElement.widgetSettings?.autoRefresh ?? true}
                              onChange={(e) => updateWidgetSettingsImmediate('autoRefresh', e.target.checked)}
                            />
                            <label htmlFor="dashboard-autoRefresh" className="text-xs text-gray-600">Auto-refresh data</label>
                          </div>
                        </div>
                      )}

                      {/* Instagram Properties */}
                      {selectedElement.type === ElementType.INSTAGRAM && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <ImageIcon size={14} />
                            Instagram Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Username or Hashtag</label>
                            <input
                              type="text"
                              value={selectedElement.widgetSettings?.username || ''}
                              onChange={(e) => updateWidgetSettings('username', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="@username or #hashtag"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Display Mode</label>
                            <select
                              value={selectedElement.widgetSettings?.displayMode || 'grid'}
                              onChange={(e) => updateWidgetSettingsImmediate('displayMode', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="grid">Grid</option>
                              <option value="carousel">Carousel</option>
                              <option value="single">Single Post</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Embed Properties */}
                      {[ElementType.EMBED, ElementType.SUB_CREATIVE].includes(selectedElement.type as ElementType) && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Layout size={14} />
                            Embed Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Embed Code / URL</label>
                            <textarea
                              value={selectedElement.widgetSettings?.embedCode || ''}
                              onChange={(e) => updateWidgetSettings('embedCode', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="<iframe>...</iframe> or https://..."
                              className="w-full h-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Touch Zone Properties */}
                      {selectedElement.type === ElementType.TOUCH && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <MousePointer2 size={14} />
                            Touch Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Action Type</label>
                            <select
                              value={selectedElement.widgetSettings?.actionType || 'url'}
                              onChange={(e) => updateWidgetSettingsImmediate('actionType', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="url">Navigate to URL</option>
                              <option value="show">Show Layer</option>
                              <option value="hide">Hide Layer</option>
                              <option value="play">Play Video</option>
                              <option value="custom">Custom Event</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Target URL / Action</label>
                            <input
                              type="text"
                              value={selectedElement.widgetSettings?.targetAction || ''}
                              onChange={(e) => updateWidgetSettings('targetAction', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="https://example.com"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>
                        </div>
                      )}

                      {/* Smart Switch Properties */}
                      {selectedElement.type === ElementType.SMART_SWITCH && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Settings size={14} />
                            Smart Switch Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Switch Condition</label>
                            <select
                              value={selectedElement.widgetSettings?.switchCondition || 'time'}
                              onChange={(e) => updateWidgetSettingsImmediate('switchCondition', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="time">Time-based</option>
                              <option value="day">Day of Week</option>
                              <option value="weather">Weather Condition</option>
                              <option value="custom">Custom Rule</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Content A (Default)</label>
                            <input
                              type="text"
                              value={selectedElement.widgetSettings?.contentA || ''}
                              onChange={(e) => updateWidgetSettings('contentA', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="Content to show by default"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Content B (Alternative)</label>
                            <input
                              type="text"
                              value={selectedElement.widgetSettings?.contentB || ''}
                              onChange={(e) => updateWidgetSettings('contentB', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="Content to show when condition met"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>
                        </div>
                      )}

                      {/* Ad Serving Properties */}
                      {selectedElement.type === ElementType.AD_SERVING && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <ImageIcon size={14} />
                            Ad Serving Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Ad Network</label>
                            <select
                              value={selectedElement.widgetSettings?.adNetwork || 'google'}
                              onChange={(e) => updateWidgetSettingsImmediate('adNetwork', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="google">Google Ad Manager</option>
                              <option value="custom">Custom Ad Server</option>
                              <option value="direct">Direct Upload</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Ad Unit ID / Tag</label>
                            <input
                              type="text"
                              value={selectedElement.widgetSettings?.adUnitId || ''}
                              onChange={(e) => updateWidgetSettings('adUnitId', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="ca-pub-xxxxxxxxxxxxx"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>
                        </div>
                      )}

                      {/* FTP Properties */}
                      {selectedElement.type === ElementType.FTP && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <FileText size={14} />
                            FTP Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">FTP Server</label>
                            <input
                              type="text"
                              value={selectedElement.widgetSettings?.ftpServer || ''}
                              onChange={(e) => updateWidgetSettings('ftpServer', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="ftp://server.com"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600 mb-2 block font-medium">Username</label>
                              <input
                                type="text"
                                value={selectedElement.widgetSettings?.ftpUsername || ''}
                                onChange={(e) => updateWidgetSettings('ftpUsername', e.target.value)}
                                onBlur={() => updateHistory(elements)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 mb-2 block font-medium">Password</label>
                              <input
                                type="password"
                                value={selectedElement.widgetSettings?.ftpPassword || ''}
                                onChange={(e) => updateWidgetSettings('ftpPassword', e.target.value)}
                                onBlur={() => updateHistory(elements)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Instagram Properties */}
                      {selectedElement.type === ElementType.INSTAGRAM && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Image size={14} />
                            Instagram Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Image URL</label>
                            <textarea
                              value={selectedElement.content}
                              onChange={(e) => updateSelectedElement('content', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="Enter Instagram image URL"
                              className="w-full h-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all resize-none"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Or Embed Code (Optional)</label>
                            <textarea
                              value={selectedElement.widgetSettings?.embedCode || ''}
                              onChange={(e) => updateWidgetSettings('embedCode', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="<iframe src='...'></iframe>"
                              className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* GIF & Web Image Properties */}
                      {[ElementType.GIF, ElementType.WEB_IMAGE].includes(selectedElement.type as ElementType) && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Image size={14} />
                            Image Settings
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Image URL</label>
                            <textarea
                              value={selectedElement.content}
                              onChange={(e) => updateSelectedElement('content', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="https://example.com/image.gif"
                              className="w-full h-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* EMBED Widget Properties */}
                      {selectedElement.type === ElementType.EMBED && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Layout size={14} />
                            Embed Code
                          </h4>

                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Embed HTML/Code</label>
                            <textarea
                              value={selectedElement.widgetSettings?.embedCode || ''}
                              onChange={(e) => updateWidgetSettings('embedCode', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="<iframe src='...'></iframe>"
                              className="w-full h-48 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-2">Paste iframe or embed code here.</p>
                          </div>
                        </div>
                      )}

                      {/* Layer Actions */}
                      <div className="space-y-2 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            updateSelectedElement('locked', !selectedElement.locked);
                            updateHistory(elements);
                          }}
                          className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${selectedElement.locked
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                          {selectedElement.locked ? <Lock size={18} /> : <Unlock size={18} />}
                          {selectedElement.locked ? 'Unlock' : 'Lock'} Layer
                        </button>

                        <button
                          onClick={bringToFront}
                          className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium shadow-lg shadow-slate-900/30"
                        >
                          Bring to Front
                        </button>

                        <button
                          onClick={moveLayerForward}
                          className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium flex items-center justify-center gap-2"
                        >
                          <ChevronUp size={18} />
                          Move Forward
                        </button>

                        <button
                          onClick={moveLayerBackward}
                          className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium flex items-center justify-center gap-2"
                        >
                          <ChevronDown size={18} />
                          Move Backward
                        </button>

                        <button
                          onClick={sendToBack}
                          className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium"
                        >
                          Send to Back
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : activeRightTab === 'animation' ? (
                <div className="space-y-4">
                  {/* Featured Animations */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                      <Sparkles size={14} />
                      Featured
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['Shake Zoom', 'Whip Slide', 'Old TV', 'Chroma Wave'].map((anim) => (
                        <button
                          key={anim}
                          onClick={() => {
                            setSelectedAnimation(anim);
                            if (selectedElement) {
                              updateSelectedElement('animation', anim);
                            }
                          }}
                          className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${selectedElement?.animation === anim
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                          {anim}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reveal Animations */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                      <Eye size={14} />
                      Reveal
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['Brush', 'Ink', 'Digital', 'Spray Paint', 'Sketch', 'Gradient'].map((anim) => (
                        <button
                          key={anim}
                          onClick={() => {
                            setSelectedAnimation(anim);
                            if (selectedElement) {
                              updateSelectedElement('animation', anim);
                            }
                          }}
                          className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${selectedElement?.animation === anim
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                          {anim}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* General Animations */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                      <Zap size={14} />
                      General
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['Rise', 'Pan', 'Fade', 'Pop', 'Wipe', 'Blur', 'Succession', 'Breathe', 'Baseline', 'Drift', 'Tectonic', 'Tumble', 'Neon', 'Scrapbook', 'Stomp'].map((anim) => (
                        <button
                          key={anim}
                          onClick={() => {
                            setSelectedAnimation(anim);
                            if (selectedElement) {
                              updateSelectedElement('animation', anim);
                            }
                          }}
                          className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${selectedElement?.animation === anim
                            ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                          {anim}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Add-on Effects */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                      <Star size={14} />
                      Add-on Effects
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['Rotate', 'Flicker', 'Pulse', 'Wiggle'].map((anim) => (
                        <button
                          key={anim}
                          onClick={() => {
                            setSelectedAnimation(anim);
                            if (selectedElement) {
                              updateSelectedElement('animation', anim);
                            }
                          }}
                          className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${selectedElement?.animation === anim
                            ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                          {anim}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Animation Controls */}
                  {selectedElement && selectedElement.animation && (
                    <div className="space-y-3 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                        <Settings size={14} />
                        Animation Settings
                      </h4>

                      <div>
                        <label className="text-xs text-gray-600 mb-2 block font-medium">Duration (seconds)</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={selectedElement.animationDuration || 1}
                            onChange={(e) => updateSelectedElementImmediate('animationDuration', parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <input
                            type="number"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={selectedElement.animationDuration || 1}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value) && value >= 0.1 && value <= 10) {
                                updateSelectedElementImmediate('animationDuration', value);
                              }
                            }}
                            className="w-16 px-2 py-1 border border-indigo-300 rounded-lg text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>0.1s</span>
                          <span>10s</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-600 mb-2 block font-medium">Speed Multiplier</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.1"
                            value={selectedElement.animationSpeed || 1}
                            onChange={(e) => updateSelectedElementImmediate('animationSpeed', parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <input
                            type="number"
                            min="0.1"
                            max="3"
                            step="0.1"
                            value={selectedElement.animationSpeed || 1}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value) && value >= 0.1 && value <= 3) {
                                updateSelectedElementImmediate('animationSpeed', value);
                              }
                            }}
                            className="w-16 px-2 py-1 border border-purple-300 rounded-lg text-sm font-bold text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>0.1x (Slower)</span>
                          <span>3x (Faster)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Animation Info */}
                  {selectedElement && (
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                      <p className="text-xs text-gray-600 mb-2 font-medium">Selected Animation:</p>
                      <p className="text-sm font-bold text-gray-800">
                        {selectedElement.animation || 'None'}
                      </p>
                      {selectedElement.animation && (
                        <button
                          onClick={() => {
                            setSelectedAnimation(null);
                            updateSelectedElement('animation', undefined);
                            updateSelectedElement('animationDuration', undefined);
                            updateSelectedElement('animationSpeed', undefined);
                          }}
                          className="mt-3 w-full px-3 py-2 bg-white text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all border border-gray-200"
                        >
                          Remove Animation
                        </button>
                      )}
                    </div>
                  )}

                  {!selectedElement && (
                    <div className="text-center text-gray-400 text-sm py-8">
                      Select an element to apply animations
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Layers size={14} />
                    All Layers ({elements.length})
                  </h4>
                  {[...elements].reverse().map((el, i) => (
                    <div
                      key={el.id}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                          if (selectedIds.includes(el.id)) {
                            setSelectedIds(selectedIds.filter(id => id !== el.id));
                          } else {
                            setSelectedIds([...selectedIds, el.id]);
                          }
                        } else {
                          setSelectedIds([el.id]);
                        }
                        setRightSidebarOpen(true);
                      }}
                      className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${selectedIds.includes(el.id)
                        ? 'bg-slate-900 text-white shadow-lg'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                      <div className={selectedIds.includes(el.id) ? 'text-white' : 'text-gray-400'}>
                        {el.type === ElementType.TEXT && <Type size={16} />}
                        {el.type === ElementType.IMAGE && <ImageIcon size={16} />}
                        {[ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.LINE].includes(el.type as ElementType) && <Shapes size={16} />}
                      </div>
                      <span className={`text-sm flex-1 font-medium ${selectedIds.includes(el.id) ? 'text-white' : 'text-gray-700'}`}>
                        {el.type.charAt(0).toUpperCase() + el.type.slice(1)} {elements.length - i}
                      </span>
                      {el.locked && (
                        <Lock size={14} className={selectedIds.includes(el.id) ? 'text-white/80' : 'text-gray-400'} />
                      )}
                      <span className={`text-xs ${selectedIds.includes(el.id) ? 'text-white/80' : 'text-gray-400'}`}>z:{el.zIndex}</span>
                    </div>
                  ))}
                  {elements.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">
                      No layers yet. Add elements to start designing!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Property Toggle */}
        {selectedElement && !rightSidebarOpen && (
          <div className="absolute right-0 top-6 z-50">
            <button
              onClick={() => setRightSidebarOpen(true)}
              className="bg-white p-3 rounded-l-xl shadow-lg border-y border-l border-gray-200 text-blue-600 hover:bg-blue-50 transition-all transform hover:-translate-x-1"
              title="Open Properties"
            >
              <Settings size={24} />
            </button>
          </div>
        )}
      </div>

      {/* Timeline - CapCut style: Full width at bottom */}
      {showTimeline && (
        <div className="border-t-2 border-gray-700 relative bg-gray-900 flex-shrink-0" style={{ height: `${timelineHeight}px` }}>
          {/* Resize handle */}
          <div
            className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500 transition-colors z-30"
            onMouseDown={handleTimelineResize}
          />

          <div className="w-full h-full pt-1">
            <TimelineCapCut
              timeline={timeline}
              onTimelineChange={updateTimeline}
              onItemSelect={handleTimelineItemSelect}
              selectedItemIds={selectedItems}
              onSplitItem={handleSplitItem}
              onArrangeSequential={handleArrangeSequential}
            />
          </div>
        </div>
      )}

      {/* Save Design Modal */}
      <SaveDesignModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveDesign}
        isLoading={isSavingDesign}
        error={saveError}
        successMessage={successMessage}
        defaultTitle={designTitle}
      />

      {/* Canvas Size Selection Modal */}
      {showSizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Canvas Size</h2>
            <p className="text-gray-600 mb-8">Select a preset size or create a custom canvas</p>

            {/* Preset Templates */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preset Sizes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => {
                      setCanvasSize({ width: template.width, height: template.height });
                      setShowSizeModal(false);
                    }}
                    className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="text-primary group-hover:scale-110 transition-transform">
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{template.name}</p>
                      <p className="text-sm text-gray-500">{template.width} × {template.height}px</p>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-primary transition-colors" size={20} />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Size */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Size</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Width (px)</label>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    value={canvasSize.width}
                    onChange={(e) => setCanvasSize(prev => ({ ...prev, width: parseInt(e.target.value) || 1280 }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height (px)</label>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    value={canvasSize.height}
                    onChange={(e) => setCanvasSize(prev => ({ ...prev, height: parseInt(e.target.value) || 720 }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowSizeModal(false)}
                className="mt-4 w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
              >
                Start Designing
              </button>
            </div>

            {/* Common Sizes Reference */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-2 font-medium">Popular Display Sizes:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div>• Full HD: 1920 × 1080</div>
                <div>• 4K: 3840 × 2160</div>
                <div>• HD: 1280 × 720</div>
                <div>• Portrait HD: 1080 × 1920</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification for Save Status */}
      {successMessage && (
        <div className="fixed top-20 right-6 z-50 animate-slideIn">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]">
            <CheckCircle size={24} className="flex-shrink-0" />
            <div>
              <p className="font-semibold">{successMessage}</p>
              <p className="text-sm text-green-100">Your design has been saved</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;