import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Type, ImageIcon, Square, Video, Clock, CloudSun,
  ChevronRight, ChevronDown, Search, ArrowLeft,
  Copy, Trash2, Undo, Redo, Save,
  AlignCenter, AlignLeft, AlignRight,
  Circle, Download, Eye, EyeOff,
  Triangle, Star, Heart, Menu, Plus, Minus, Lock, Unlock,
  Layers, Palette, Settings, Grid3x3, Layout, Maximize2,
  Sparkles, Image, Shapes, FileText, MousePointer2, RectangleHorizontal, Sidebar, Zap
} from 'lucide-react';
import { SaveDesignModal, SaveDesignModalData } from '../components/SaveDesignModal';
import { useDesignSave } from '../hooks/useDesignSave';
import { downloadDesignAsJSON } from '../services/canvasExportService';
import { getDesignById, updateDesignInFirestore } from '../services/designService';

enum ElementType {
  TEXT = 'text',
  IMAGE = 'image',
  RECT = 'rect',
  CIRCLE = 'circle',
  TRIANGLE = 'triangle',
  STAR = 'star',
  HEART = 'heart',
  LINE = 'line',
  VIDEO = 'video',
  PENTAGON = 'pentagon',
  HEXAGON = 'hexagon',
  OCTAGON = 'octagon',
  DIAMOND = 'diamond',
  TRAPEZOID = 'trapezoid',
  CRESCENT = 'crescent',
  CROSS = 'cross',
  SLIDESHOW = 'slideshow',
  TICKER = 'ticker',
  RSS = 'rss',
  WEATHER = 'weather',
  GIF = 'gif',
  MEDIA_RSS = 'media-rss',
  YOUTUBE = 'youtube',
  USTREAM = 'ustream',
  FTP = 'ftp',
  INSTAGRAM = 'instagram',
  STREAMING = 'streaming',
  LABEL = 'label',
  CLOCK = 'clock',
  TIMER = 'timer',
  TOUCH = 'touch',
  WEATHER_2 = 'weather-2',
  AD_SERVING = 'ad-serving',
  CALENDAR = 'calendar',
  DASHBOARDS = 'dashboards',
  TABLE = 'table',
  SMART_SWITCH = 'smart-switch',
  WEB_IMAGE = 'web-image',
  WEB_VIDEO = 'web-video',
  SUB_CREATIVE = 'sub-creative',
  EMBED = 'embed',
  HTML = 'html',
}

interface CanvasElement {
  id: string;
  type: ElementType;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  fillColor?: string;
  opacity: number;
  rotation: number;
  zIndex: number;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  locked: boolean;
  visible: boolean;
  animation?: string;
  widgetSettings?: any;
  textStyle?: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    textAlign: 'left' | 'center' | 'right';
    fontFamily: string;
    letterSpacing: number;
    lineHeight: number;
  };
}

const TEMPLATES = [
  { name: 'Billboard', width: 1920, height: 480, icon: <RectangleHorizontal size={16} /> },
  { name: 'Android Phone (Portrait)', width: 1080, height: 1920, icon: <Layout size={16} /> },
  { name: 'Android Phone (Landscape)', width: 1920, height: 1080, icon: <RectangleHorizontal size={16} /> },
];

const WIDGET_CATEGORIES = [
  { 
    id: 'essential', 
    label: '🔹 Essential', 
    icon: <Sparkles size={18} />,
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
  const { designId } = useParams<{ designId?: string }>();
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(100);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<'design' | 'templates' | 'uploads'>('design');
  const [activeRightTab, setActiveRightTab] = useState<'properties' | 'layers' | 'animation'>('properties');
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
  const [canvasColor, setCanvasColor] = useState('#FDFBF7');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [designTitle, setDesignTitle] = useState('My Design');
  const [designData, setDesignData] = useState<any>(null);
  
  // Design save hook
  const { saveDesign, isLoading: isSavingDesign, error: saveError, successMessage } = useDesignSave();
  
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

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
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
    const isShape = [ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.LINE, ElementType.PENTAGON, ElementType.HEXAGON, ElementType.OCTAGON, ElementType.DIAMOND, ElementType.TRAPEZOID, ElementType.CRESCENT, ElementType.CROSS].includes(type);
    
    // Define dimensions first to calculate boundary checks
    const width = type === ElementType.TEXT ? 300 : type === ElementType.LINE ? 200 : 150;
    const height = type === ElementType.TEXT ? 60 : type === ElementType.LINE ? 4 : 150;

    // Ensure the element is placed within the canvas boundaries
    // Clamping the drop coordinates ensures "it cannot be out" immediately upon creation
    const safeX = Math.max(0, Math.min(canvasSize.width - width, x));
    const safeY = Math.max(0, Math.min(canvasSize.height - height, y));

    const newElement: CanvasElement = {
      id: Math.random().toString(36).substring(2, 11),
      type,
      content: customContent || getDefaultContent(type),
      x: safeX,
      y: safeY,
      width,
      height,
      fontSize: customFontSize || (type === ElementType.TEXT ? 24 : undefined),
      color: type === ElementType.TEXT ? '#0F172A' : undefined,
      backgroundColor: 'transparent',
      fillColor: isShape ? '#0F172A' : undefined,
      opacity: 1,
      rotation: 0,
      zIndex: elements.length + 1,
      visible: true,
      locked: false,
      textStyle: type === ElementType.TEXT ? {
        textAlign: 'center',
        bold: false,
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
    setRightSidebarOpen(true);
  };

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

  const getDefaultContent = (type: ElementType) => {
    switch (type) {
      case ElementType.TEXT: return 'Double click to edit';
      case ElementType.IMAGE: return 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400';
      case ElementType.VIDEO: return 'Video Source URL';
      case ElementType.SLIDESHOW: return 'Slideshow';
      case ElementType.TICKER: return 'Breaking News • Latest Updates • Important Information';
      case ElementType.RSS: return 'RSS Feed URL';
      case ElementType.WEATHER: return 'Weather Widget';
      case ElementType.GIF: return 'GIF URL';
      case ElementType.MEDIA_RSS: return 'Media RSS URL';
      case ElementType.YOUTUBE: return 'YouTube Video ID';
      case ElementType.USTREAM: return 'Ustream Channel';
      case ElementType.FTP: return 'FTP Path';
      case ElementType.INSTAGRAM: return 'Instagram URL';
      case ElementType.STREAMING: return 'Stream URL';
      case ElementType.LABEL: return 'Label Text';
      case ElementType.CLOCK: return 'Clock';
      case ElementType.TIMER: return 'Timer';
      case ElementType.TOUCH: return 'Touch';
      case ElementType.WEATHER_2: return 'Weather 2.0';
      case ElementType.AD_SERVING: return 'Ad';
      case ElementType.CALENDAR: return 'Calendar';
      case ElementType.DASHBOARDS: return 'Dashboard';
      case ElementType.TABLE: return 'Table';
      case ElementType.SMART_SWITCH: return 'Smart Switch';
      case ElementType.WEB_IMAGE: return 'Web Image URL';
      case ElementType.WEB_VIDEO: return 'Web Video URL';
      case ElementType.SUB_CREATIVE: return 'Sub Creative';
      case ElementType.EMBED: return 'Embed Code';
      case ElementType.HTML: return '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;">HTML Content</div>';
      default: return '';
    }
  };

  const renderShape = (shapeType: ElementType, fillColor: string, strokeColor?: string, strokeWidth?: number) => {
    const svgStrokeProps = strokeWidth && strokeWidth > 0 ? { 
      stroke: strokeColor || '#000000', 
      strokeWidth,
      fill: fillColor 
    } : { fill: fillColor };

    switch (shapeType) {
      case ElementType.RECT:
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
            <rect x="40" y="10" width="20" height="80" {...svgStrokeProps} />
            <rect x="10" y="40" width="80" height="20" {...svgStrokeProps} />
          </svg>
        );
      case ElementType.LINE:
        return (
          <svg viewBox="0 0 100 4" className="w-full h-full" preserveAspectRatio="none">
            <line x1="0" y1="2" x2="100" y2="2" stroke={fillColor} strokeWidth="4" />
          </svg>
        );
      default:
        return null;
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
    if (dragInfo || resizing) {
      updateHistory(elements);
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
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    if (element?.locked) return;
    
    const newElements = elements.filter(el => el.id !== selectedId);
    setElements(newElements);
    updateHistory(newElements);
    setSelectedIds([]);
  };

  const duplicateSelected = () => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    if (element) {
      const newElement = {
        ...element,
        id: Math.random().toString(36).substring(2, 11),
        x: Math.min(element.x + 20, canvasSize.width - element.width),
        y: Math.min(element.y + 20, canvasSize.height - element.height),
        zIndex: elements.length + 1,
        locked: false,
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
      updateHistory(newElements);
      setSelectedIds([newElement.id]);
      setRightSidebarOpen(true);
    }
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
  };

  const updateSelectedElementImmediate = (key: keyof CanvasElement, value: any) => {
    updateSelectedElement(key, value);
    updateHistory(elements);
  };

  const bringToFront = () => {
    if (!selectedId) return;
    const maxZ = Math.max(...elements.map(e => e.zIndex || 0));
    updateSelectedElementImmediate('zIndex', maxZ + 1);
  };

  const sendToBack = () => {
    if (!selectedId) return;
    const minZ = Math.min(...elements.map(e => e.zIndex || 0));
    updateSelectedElementImmediate('zIndex', minZ - 1);
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
    
    if (element && element.type === ElementType.TEXT) {
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

  // Save design - opens modal for metadata entry
  const openSaveModal = () => {
    setShowSaveModal(true);
  };

  // Handle saving design with metadata
  const handleSaveDesign = async (data: SaveDesignModalData) => {
    try {
      // Ensure all elements have required fields with proper defaults
      const elementsWithDefaults = elements.map(el => {
        const defaultTextStyle = {
          bold: false,
          italic: false,
          underline: false,
          textAlign: 'left' as const,
          fontFamily: 'Arial',
          letterSpacing: 0,
          lineHeight: 1.2,
        };

        // Use spread operator to preserve ALL properties (animation, widgetSettings, etc.)
        return {
          ...el,
          content: el.content || '',
          visible: el.visible !== undefined ? el.visible : true,
          textStyle: el.textStyle || defaultTextStyle,
        };
      });

      // Use Firebase design name when modifying, fallback to provided title for new designs
      const designTitle = designData?.metadata?.title || data.title || 'Untitled';

      const exportedDesign = {
        metadata: {
          title: designTitle,
          description: data.description || '',
          canvasWidth: canvasSize.width || 1280,
          canvasHeight: canvasSize.height || 720,
          canvasColor: canvasColor || '#ffffff',
          createdAt: designData?.metadata?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: designData?.metadata?.createdBy || 'current-user',
          tags: data.tags || [],
          version: (designData?.metadata?.version || 0) + 1,
        },
        designJSON: {
          elements: elementsWithDefaults,
          totalElements: elementsWithDefaults.length,
          version: '1.0.0',
        },
      };

      // Always modify existing design in ModifyEditor
      if (!designId) {
        console.error('Design ID is required for ModifyEditor');
        throw new Error('Cannot modify design without ID');
      }

      console.log('Modifying design in Firebase:', designId);
      console.log('Exporting design data:', exportedDesign);
      
      const result = await updateDesignInFirestore(designId, exportedDesign);

      if (result.success) {
        setDesignTitle(data.title);
        console.log('✅ Design modified successfully in Firebase:', designId);
        console.log('Updated design:', result);
        
        // Update local design data state
        setDesignData({
          ...designData,
          metadata: exportedDesign.metadata,
          designJSON: exportedDesign.designJSON,
        });
        
        // Close modal after successful save
        setTimeout(() => {
          setShowSaveModal(false);
        }, 1000);
      } else {
        console.error('❌ Failed to modify design:', result.error);
        throw new Error(result.error || 'Failed to modify design in Firebase');
      }
    } catch (error) {
      console.error('❌ Error modifying design in Firebase:', error);
      alert(`Error modifying design: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Export design as local JSON file (for future use)
  const _exportDesignAsJSON = () => {
    // Ensure all elements have required fields with proper defaults
    const elementsWithDefaults = elements.map(el => {
      const defaultTextStyle = {
        bold: false,
        italic: false,
        underline: false,
        textAlign: 'left' as const,
        fontFamily: 'Arial',
        letterSpacing: 0,
        lineHeight: 1.2,
      };

      return {
        ...el,
        content: el.content || '',
        visible: el.visible !== undefined ? el.visible : true,
        textStyle: el.textStyle || defaultTextStyle,
      };
    });

    const exportData = {
      metadata: {
        title: designTitle,
        description: '',
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
        canvasColor: canvasColor,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user',
        tags: [],
        version: 1,
      },
      designJSON: {
        elements: elementsWithDefaults,
        totalElements: elementsWithDefaults.length,
        version: '1.0',
      },
    };
    downloadDesignAsJSON(exportData, `${designTitle}-${Date.now()}.json`);
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
        if ([ElementType.TRIANGLE, ElementType.DIAMOND, ElementType.PENTAGON, ElementType.HEXAGON, ElementType.OCTAGON, ElementType.TRAPEZOID, ElementType.STAR, ElementType.HEART, ElementType.CRESCENT, ElementType.CROSS, ElementType.LINE].includes(el.type)) {
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

        } else if ([ElementType.TRIANGLE, ElementType.DIAMOND, ElementType.PENTAGON, ElementType.HEXAGON, ElementType.OCTAGON, ElementType.TRAPEZOID, ElementType.STAR, ElementType.HEART, ElementType.CRESCENT, ElementType.CROSS, ElementType.LINE].includes(el.type)) {
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
  };

  // Load design from Firebase if designId is provided
  useEffect(() => {
    if (designId) {
      const loadDesign = async () => {
        try {
          console.log('Loading design:', designId);
          const design = await getDesignById(designId);
          if (design) {
            console.log('Design loaded:', design);
            setDesignData(design);
            setDesignTitle(design.metadata.title);
            setCanvasSize({ width: design.metadata.canvasWidth, height: design.metadata.canvasHeight });
            setCanvasColor(design.metadata.canvasColor);
            
            // Map the design elements to CanvasElement format
            const loadedElements = design.designJSON.elements.map(el => ({
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
              opacity: el.opacity,
              rotation: el.rotation,
              zIndex: el.zIndex,
              locked: el.locked,
              visible: el.visible,
            } as CanvasElement));
            
            setElements(loadedElements);
            setHistory([loadedElements]);
            setHistoryIndex(0);
          }
        } catch (error) {
          console.error('Failed to load design:', error);
        }
      };
      loadDesign();
    }
  }, [designId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z': e.preventDefault(); undo(); break;
          case 'y': e.preventDefault(); redo(); break;
          case 'd': e.preventDefault(); duplicateSelected(); break;
          case 's': e.preventDefault(); openSaveModal(); break;
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
            e.preventDefault();
            deleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingTextId, historyIndex]);

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
            className={`p-2 rounded-lg transition-all ${leftSidebarOpen ? 'bg-slate-100 text-slate-900' : 'hover:bg-gray-100 text-gray-600'}`}
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
              className="p-2 rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all" 
              title="Undo (Ctrl+Z)"
            >
              <Undo size={18} />
            </button>
            <button 
              onClick={redo} 
              disabled={historyIndex >= history.length - 1} 
              className="p-2 rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all" 
              title="Redo (Ctrl+Y)"
            >
              <Redo size={18} />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200 mx-2"></div>

          <button 
            onClick={() => setShowGrid(!showGrid)} 
            className={`p-2 rounded-lg transition-all ${showGrid ? 'bg-slate-100 text-slate-900' : 'hover:bg-gray-100'}`}
            title="Toggle Grid"
          >
            {showGrid ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button 
            onClick={() => setShowSafeZone(!showSafeZone)} 
            className={`p-2 rounded-lg transition-all ${showSafeZone ? 'bg-slate-100 text-slate-900' : 'hover:bg-gray-100'}`}
            title="Toggle Safe Zone"
          >
            <Maximize2 size={18} />
          </button>

          <button 
            onClick={() => setSnapToGrid(!snapToGrid)} 
            className={`p-2 rounded-lg transition-all ${snapToGrid ? 'bg-slate-100 text-slate-900' : 'hover:bg-gray-100'}`}
            title="Snap to Grid"
          >
            <Grid3x3 size={18} />
          </button>

          <div className="w-px h-6 bg-gray-200 mx-2"></div>

          <button 
            onClick={duplicateSelected} 
            disabled={!selectedId} 
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all" 
            title="Duplicate (Ctrl+D)"
          >
            <Copy size={18} />
          </button>

          <button 
            onClick={deleteSelected} 
            disabled={!selectedId} 
            className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all" 
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className={`p-2 rounded-lg transition-all ${rightSidebarOpen ? 'bg-slate-100 text-slate-900' : 'hover:bg-gray-100 text-gray-600'}`}
            title="Toggle Right Sidebar"
          >
            <Sidebar size={20} className="transform rotate-180" />
          </button>

          <button 
            onClick={() => setShowTemplateModal(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium flex items-center gap-2"
          >
            <Layout size={18} />
            Templates
          </button>
          
          <button 
            onClick={exportAsImage}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-all font-medium flex items-center gap-2 shadow-lg shadow-slate-500/30"
          >
            <Download size={18} />
            Export
          </button>

          <button 
            onClick={openSaveModal}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-all font-medium flex items-center gap-2 shadow-lg shadow-slate-900/30"
          >
            <Save size={18} />
            Modify
          </button>
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-2xl w-full mx-4">
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
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-slate-500 hover:bg-slate-50 transition-all group text-left"
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
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden shadow-lg z-20">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button 
                onClick={() => setActiveLeftTab('design')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  activeLeftTab === 'design' 
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
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  activeLeftTab === 'templates' 
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
                          <div className="p-4 pt-0 grid grid-cols-2 gap-3">
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
                                className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-move bg-gradient-to-br from-gray-50 to-white hover:from-slate-50 hover:to-gray-50 hover:shadow-md border-2 border-gray-100 hover:border-slate-200 transition-all group active:scale-95 active:shadow-inner"
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
                      className="p-4 border-2 border-gray-200 rounded-xl hover:border-slate-500 hover:bg-slate-50 transition-all group text-left"
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
            className={`flex-1 overflow-auto p-12 flex items-center justify-center transition-all ${draggingFromSidebar ? 'bg-blue-50' : ''}`}
            onClick={() => setSelectedIds([])}
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
          >
            <div 
              ref={canvasRef}
              className="shadow-2xl relative"
              style={{ 
                width: `${canvasSize.width}px`, 
                height: `${canvasSize.height}px`,
                backgroundColor: canvasColor,
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out',
              }}
            >
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

              {/* Safe Zone - 5% margin from edges */}
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
                .map(el => (
                  <div
                    key={el.id}
                    className={`absolute group select-none transition-all ${
                      selectedIds.includes(el.id) 
                        ? 'ring-2 ring-slate-900 shadow-lg animate-glow' 
                        : 'hover:ring-2 hover:ring-slate-300 hover:shadow-md'
                    } ${el.locked ? 'cursor-not-allowed' : ''} ${
                      dragInfo?.initialPositions.has(el.id) ? 'opacity-75 ring-2 ring-blue-500 shadow-xl' : ''
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
                    }}
                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                    onClick={(e) => e.stopPropagation()} 
                    onDoubleClick={(e) => handleDoubleClick(e, el.id)}
                  >
                    {editingTextId === el.id && el.type === ElementType.TEXT ? (
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
                    ) : el.type === ElementType.TEXT ? (
                      <div 
                        className="w-full h-full p-2 flex items-center justify-center overflow-hidden break-words whitespace-pre-wrap"
                        style={{
                          fontSize: el.fontSize,
                          color: el.color,
                          fontWeight: el.textStyle?.bold ? 'bold' : 'normal',
                          fontStyle: el.textStyle?.italic ? 'italic' : 'normal',
                          textDecoration: el.textStyle?.underline ? 'underline' : 'none',
                          textAlign: el.textStyle?.textAlign || 'center',
                          fontFamily: el.textStyle?.fontFamily || 'Inter, sans-serif',
                        }}
                      >
                        {el.content}
                      </div>
                    ) : el.type === ElementType.IMAGE ? (
                      <img 
                        src={el.content} 
                        alt="" 
                        className="w-full h-full object-cover pointer-events-none" 
                        style={{ borderRadius: el.borderRadius }} 
                      />
                    ) : el.type === ElementType.HTML ? (
                      <iframe
                        srcDoc={el.content || '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#666;">Add HTML code in properties</div>'}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin"
                        style={{ pointerEvents: 'none' }}
                      />
                    ) : el.type === ElementType.VIDEO ? (
                      el.content && (el.content.startsWith('http') || el.content.startsWith('blob:')) ? (
                        <video 
                          src={el.content} 
                          className="w-full h-full object-cover"
                          style={{ pointerEvents: 'none' }}
                          muted
                          loop
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-sm">
                          <Video className="mr-2" size={20} />
                          Video (Add URL)
                        </div>
                      )
                    ) : el.type === ElementType.SLIDESHOW ? (
                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-slate-700 text-sm">
                        <Layout className="mr-2" size={20} />
                        Slideshow
                      </div>
                    ) : el.type === ElementType.TICKER ? (
                      <div className="w-full h-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold overflow-hidden">
                        <div className="animate-marquee whitespace-nowrap">{el.content || 'Ticker Text'}</div>
                      </div>
                    ) : el.type === ElementType.RSS ? (
                      <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-700 text-sm">
                        <FileText className="mr-2" size={20} />
                        RSS Feed
                      </div>
                    ) : el.type === ElementType.WEATHER ? (
                      <div className="w-full h-full bg-sky-100 flex items-center justify-center text-sky-700 text-sm">
                        <CloudSun className="mr-2" size={20} />
                        Weather
                      </div>
                    ) : el.type === ElementType.GIF ? (
                      el.content && el.content.startsWith('http') ? (
                        <img 
                          src={el.content} 
                          alt="GIF" 
                          className="w-full h-full object-cover"
                          style={{ pointerEvents: 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-700 text-sm">
                          <Image className="mr-2" size={20} />
                          GIF (Add URL)
                        </div>
                      )
                    ) : el.type === ElementType.MEDIA_RSS ? (
                      <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm">
                        <FileText className="mr-2" size={20} />
                        Media RSS
                      </div>
                    ) : el.type === ElementType.YOUTUBE ? (
                      getYouTubeEmbedUrl(el.content) ? (
                        <iframe
                          src={getYouTubeEmbedUrl(el.content) || ''}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ pointerEvents: 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full bg-red-600 flex items-center justify-center text-white text-sm">
                          <Video className="mr-2" size={20} />
                          YouTube (Add URL in properties)
                        </div>
                      )
                    ) : el.type === ElementType.USTREAM ? (
                      el.content && el.content.startsWith('http') ? (
                        <iframe
                          src={el.content}
                          className="w-full h-full border-0"
                          style={{ pointerEvents: 'none' }}
                          allow="autoplay; fullscreen"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-sm">
                          <Video className="mr-2" size={20} />
                          Ustream (Add URL)
                        </div>
                      )
                    ) : el.type === ElementType.FTP ? (
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-sm">
                        <FileText className="mr-2" size={20} />
                        FTP
                      </div>
                    ) : el.type === ElementType.INSTAGRAM ? (
                      el.widgetSettings?.embedCode ? (
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
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center text-white text-sm">
                          <Image className="mr-2" size={20} />
                          Instagram (Add URL)
                        </div>
                      )
                    ) : el.type === ElementType.STREAMING ? (
                      el.content && el.content.startsWith('http') ? (
                        <iframe
                          src={el.content}
                          className="w-full h-full border-0"
                          style={{ pointerEvents: 'none' }}
                          allow="autoplay"
                        />
                      ) : (
                        <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white text-sm">
                          <Video className="mr-2" size={20} />
                          Streaming (Add URL)
                        </div>
                      )
                    ) : el.type === ElementType.LABEL ? (
                      <div 
                        className="w-full h-full flex items-center justify-center p-2"
                        style={{
                          backgroundColor: el.backgroundColor || '#fef3c7',
                          color: el.color || '#92400e',
                          fontSize: el.fontSize || 16,
                          fontWeight: el.textStyle?.bold ? 'bold' : 600,
                          fontStyle: el.textStyle?.italic ? 'italic' : 'normal',
                          textAlign: el.textStyle?.textAlign || 'center',
                        }}
                      >
                        {el.content || 'Label'}
                      </div>
                    ) : el.type === ElementType.CLOCK ? (
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
                          {new Date().toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: el.widgetSettings?.timeFormat !== '24'
                          })}
                        </div>
                      </div>
                    ) : el.type === ElementType.TIMER ? (
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
                    ) : el.type === ElementType.TOUCH ? (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-300 opacity-20 animate-pulse"></div>
                        <div className="z-10 flex flex-col items-center gap-3 text-white">
                          <MousePointer2 size={32} className="animate-bounce" />
                          <span className="text-sm font-semibold">{el.content || 'Touch Zone'}</span>
                        </div>
                      </div>
                    ) : el.type === ElementType.WEATHER_2 ? (
                      <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-500 p-4 text-white flex flex-col items-center justify-center gap-2">
                        <CloudSun size={48} className="mb-2" />
                        <div className="text-3xl font-bold">{el.widgetSettings?.temperature || '72'}°{el.widgetSettings?.temperatureUnit || 'F'}</div>
                        <div className="text-lg">{el.widgetSettings?.condition || 'Sunny'}</div>
                        <div className="text-sm opacity-90">{el.widgetSettings?.location || 'New York, NY'}</div>
                      </div>
                    ) : el.type === ElementType.AD_SERVING ? (
                      el.content && el.content.startsWith('http') ? (
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
                    ) : el.type === ElementType.CALENDAR ? (
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
                              className={`text-center p-1 rounded ${
                                i === new Date().getDate() - 1 
                                  ? 'bg-green-500 text-white font-bold' 
                                  : 'text-gray-700'
                              }`}
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : el.type === ElementType.DASHBOARDS ? (
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
                    ) : el.type === ElementType.TABLE ? (
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
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    i === 0 ? 'bg-green-100 text-green-700' : 
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
                    ) : el.type === ElementType.SMART_SWITCH ? (
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
                    ) : el.type === ElementType.WEB_IMAGE ? (
                      el.content && el.content.startsWith('http') ? (
                        <img 
                          src={el.content} 
                          alt="Web Image" 
                          className="w-full h-full object-cover"
                          style={{ pointerEvents: 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full bg-pink-100 flex items-center justify-center text-pink-700 text-sm">
                          <ImageIcon className="mr-2" size={20} />
                          Web Image (Add URL)
                        </div>
                      )
                    ) : el.type === ElementType.WEB_VIDEO ? (
                      el.content && el.content.startsWith('http') ? (
                        <video 
                          src={el.content} 
                          className="w-full h-full object-cover"
                          style={{ pointerEvents: 'none' }}
                          muted
                          loop
                        />
                      ) : (
                        <div className="w-full h-full bg-rose-100 flex items-center justify-center text-rose-700 text-sm">
                          <Video className="mr-2" size={20} />
                          Web Video (Add URL)
                        </div>
                      )
                    ) : el.type === ElementType.SUB_CREATIVE ? (
                      <div className="w-full h-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm">
                        <Layout className="mr-2" size={20} />
                        Sub Creative
                      </div>
                    ) : el.type === ElementType.EMBED ? (
                      el.widgetSettings?.embedCode ? (
                        <iframe
                          srcDoc={el.widgetSettings.embedCode}
                          className="w-full h-full border-0"
                          sandbox="allow-scripts allow-same-origin"
                          style={{ pointerEvents: 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm">
                          <Layout className="mr-2" size={20} />
                          Embed (Add code in properties)
                        </div>
                      )
                    ) : [ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.LINE, ElementType.PENTAGON, ElementType.HEXAGON, ElementType.OCTAGON, ElementType.DIAMOND, ElementType.TRAPEZOID, ElementType.CRESCENT, ElementType.CROSS].includes(el.type) ? (
                      <div style={{ borderRadius: el.borderRadius, width: '100%', height: '100%' }}>
                        {renderShape(el.type, el.fillColor || '#0F172A', el.strokeColor, el.strokeWidth)}
                      </div>
                    ) : null}

                    {selectedIds.includes(el.id) && selectedIds.length === 1 && !el.locked && (
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
                  </div>
                ))}
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
              >
                <Minus size={16} />
              </button>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm min-w-[100px] justify-center">
                <span className="text-sm font-semibold">{zoom}%</span>
              </div>
              <button 
                onClick={() => setZoom(Math.min(200, zoom + 25))} 
                className="p-2 hover:bg-white rounded-lg transition-all shadow-sm"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {elements.length} element{elements.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        {rightSidebarOpen && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden shadow-lg z-20">
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
                  className={`flex-1 px-2 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeRightTab === 'properties' 
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
                  className={`flex-1 px-2 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeRightTab === 'animation' 
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
                  className={`flex-1 px-2 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeRightTab === 'layers' 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Layers size={14} />
                    <span className="hidden sm:inline">Layers</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeRightTab === 'properties' ? (
                <div className="space-y-6">
                  {!selectedElement ? (
                    // Canvas Properties
                    <div className="space-y-6">
                      <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                          <Maximize2 size={14} />
                          Dimensions
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-600 mb-1.5 block font-medium">Width (px)</label>
                            <input 
                              type="number" 
                              value={canvasSize.width} 
                              onChange={(e) => setCanvasSize(prev => ({ ...prev, width: Number(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 mb-1.5 block font-medium">Height (px)</label>
                            <input 
                              type="number" 
                              value={canvasSize.height} 
                              onChange={(e) => setCanvasSize(prev => ({ ...prev, height: Number(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>
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

                        {([ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.LINE].includes(selectedElement.type) || selectedElement.type === ElementType.IMAGE) && (
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
                      {(selectedElement.type === ElementType.TEXT || [ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.LINE].includes(selectedElement.type)) && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Palette size={14} />
                            Colors
                          </h4>
                          
                          {selectedElement.type === ElementType.TEXT && (
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
                          )}
                          
                          {[ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.LINE].includes(selectedElement.type) && (
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
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs text-gray-600 font-medium">Palette</label>
                              <select 
                                value={selectedPalette}
                                onChange={(e) => setSelectedPalette(e.target.value as keyof typeof COLOR_PALETTES)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-500"
                              >
                                {Object.keys(COLOR_PALETTES).map(key => (
                                  <option key={key} value={key}>{key}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {COLOR_PALETTES[selectedPalette].map(color => (
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
                                  className="w-8 h-8 rounded-lg border-2 hover:scale-110 transition-transform shadow-sm" 
                                  style={{
                                    backgroundColor: color, 
                                    borderColor: (selectedElement.type === ElementType.TEXT ? selectedElement.color : selectedElement.fillColor) === color ? '#0F172A' : '#E5E7EB'
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

                      {/* Text Options */}
                      {selectedElement.type === ElementType.TEXT && (
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
                                  updateSelectedElement('textStyle', {...selectedElement.textStyle, bold: !selectedElement.textStyle?.bold});
                                  updateHistory(elements);
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg font-bold border-2 transition-all ${
                                  selectedElement.textStyle?.bold 
                                    ? 'bg-slate-900 text-white border-slate-900' 
                                    : 'border-gray-200 text-gray-600 hover:border-slate-300'
                                }`}
                              >
                                B
                              </button>
                              <button 
                                onClick={() => {
                                  updateSelectedElement('textStyle', {...selectedElement.textStyle, italic: !selectedElement.textStyle?.italic});
                                  updateHistory(elements);
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg italic border-2 transition-all ${
                                  selectedElement.textStyle?.italic 
                                    ? 'bg-slate-900 text-white border-slate-900' 
                                    : 'border-gray-200 text-gray-600 hover:border-slate-300'
                                }`}
                              >
                                I
                              </button>
                              <button 
                                onClick={() => {
                                  updateSelectedElement('textStyle', {...selectedElement.textStyle, underline: !selectedElement.textStyle?.underline});
                                  updateHistory(elements);
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg underline border-2 transition-all ${
                                  selectedElement.textStyle?.underline 
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
                                  updateSelectedElement('textStyle', {...selectedElement.textStyle, textAlign: 'left'});
                                  updateHistory(elements);
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                                  selectedElement.textStyle?.textAlign === 'left' 
                                    ? 'bg-slate-900 text-white border-slate-900' 
                                    : 'border-gray-200 text-gray-600 hover:border-slate-300'
                                }`}
                              >
                                <AlignLeft size={16} className="mx-auto" />
                              </button>
                              <button 
                                onClick={() => {
                                  updateSelectedElement('textStyle', {...selectedElement.textStyle, textAlign: 'center'});
                                  updateHistory(elements);
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                                  selectedElement.textStyle?.textAlign === 'center' 
                                    ? 'bg-slate-900 text-white border-slate-900' 
                                    : 'border-gray-200 text-gray-600 hover:border-slate-300'
                                }`}
                              >
                                <AlignCenter size={16} className="mx-auto" />
                              </button>
                              <button 
                                onClick={() => {
                                  updateSelectedElement('textStyle', {...selectedElement.textStyle, textAlign: 'right'});
                                  updateHistory(elements);
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                                  selectedElement.textStyle?.textAlign === 'right' 
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
                      {[ElementType.IMAGE, ElementType.GIF, ElementType.WEB_IMAGE].includes(selectedElement.type) && (
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
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Fit Mode</label>
                            <select 
                              value={selectedElement.widgetSettings?.fitMode || 'cover'}
                              onChange={(e) => updateSelectedElement('widgetSettings', { 
                                ...selectedElement.widgetSettings, 
                                fitMode: e.target.value 
                              })}
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
                                id="modify-gif-autoplay" 
                                className="rounded"
                                checked={selectedElement.widgetSettings?.autoplay ?? true}
                                onChange={(e) => updateSelectedElement('widgetSettings', { 
                                  ...selectedElement.widgetSettings, 
                                  autoplay: e.target.checked 
                                })}
                              />
                              <label htmlFor="modify-gif-autoplay" className="text-xs text-gray-600">Auto-play GIF</label>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Video & Streaming Properties */}
                      {[ElementType.VIDEO, ElementType.YOUTUBE, ElementType.WEB_VIDEO, ElementType.USTREAM, ElementType.STREAMING].includes(selectedElement.type) && (
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
                              value={selectedElement.content}
                              onChange={(e) => updateSelectedElement('content', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder={selectedElement.type === ElementType.YOUTUBE ? 'https://youtube.com/watch?v=...' : 'https://example.com/video.mp4'}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                          </div>

                          {[ElementType.VIDEO, ElementType.YOUTUBE, ElementType.WEB_VIDEO, ElementType.USTREAM, ElementType.STREAMING].includes(selectedElement.type) && (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                  <input 
                                    type="checkbox" 
                                    id="modify-autoplay" 
                                    className="rounded"
                                    checked={selectedElement.widgetSettings?.autoplay || false}
                                    onChange={(e) => updateSelectedElement('widgetSettings', { 
                                      ...selectedElement.widgetSettings, 
                                      autoplay: e.target.checked 
                                    })}
                                  />
                                  <label htmlFor="modify-autoplay" className="text-xs text-gray-600">Autoplay</label>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                  <input 
                                    type="checkbox" 
                                    id="modify-loop" 
                                    className="rounded"
                                    checked={selectedElement.widgetSettings?.loop ?? true}
                                    onChange={(e) => updateSelectedElement('widgetSettings', { 
                                      ...selectedElement.widgetSettings, 
                                      loop: e.target.checked 
                                    })}
                                  />
                                  <label htmlFor="modify-loop" className="text-xs text-gray-600">Loop</label>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                  <input 
                                    type="checkbox" 
                                    id="modify-mute" 
                                    className="rounded"
                                    checked={selectedElement.widgetSettings?.mute ?? false}
                                    onChange={(e) => updateSelectedElement('widgetSettings', { 
                                      ...selectedElement.widgetSettings, 
                                      mute: e.target.checked 
                                    })}
                                  />
                                  <label htmlFor="modify-mute" className="text-xs text-gray-600">Mute</label>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                  <input 
                                    type="checkbox" 
                                    id="modify-controls" 
                                    className="rounded"
                                    checked={selectedElement.widgetSettings?.controls ?? true}
                                    onChange={(e) => updateSelectedElement('widgetSettings', { 
                                      ...selectedElement.widgetSettings, 
                                      controls: e.target.checked 
                                    })}
                                  />
                                  <label htmlFor="modify-controls" className="text-xs text-gray-600">Controls</label>
                                </div>
                              </div>

                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Playback Speed</label>
                                <select 
                                  value={selectedElement.widgetSettings?.playbackSpeed || '1'}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    playbackSpeed: e.target.value 
                                  })}
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
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    volume: Number(e.target.value) 
                                  })}
                                  className="w-full"
                                />
                                <div className="text-xs text-gray-500 text-center mt-1">{selectedElement.widgetSettings?.volume || 100}%</div>
                              </div>
                            </>
                          )}

                          {[ElementType.IMAGE, ElementType.GIF, ElementType.WEB_IMAGE].includes(selectedElement.type) && (
                            <>
                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Fit Mode</label>
                                <select 
                                  value={selectedElement.widgetSettings?.fitMode || 'cover'}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    fitMode: e.target.value 
                                  })}
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
                                    id="modify-gif-autoplay" 
                                    className="rounded"
                                    checked={selectedElement.widgetSettings?.autoplay ?? true}
                                    onChange={(e) => updateSelectedElement('widgetSettings', { 
                                      ...selectedElement.widgetSettings, 
                                      autoplay: e.target.checked 
                                    })}
                                  />
                                  <label htmlFor="modify-gif-autoplay" className="text-xs text-gray-600">Auto-play GIF</label>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Feed Widget Properties - RSS, TICKER, SLIDESHOW */}
                      {[ElementType.RSS, ElementType.MEDIA_RSS, ElementType.TICKER, ElementType.SLIDESHOW].includes(selectedElement.type) && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            {selectedElement.type === ElementType.SLIDESHOW ? <Layout size={14} /> : <FileText size={14} />}
                            {selectedElement.type === ElementType.TICKER ? 'Ticker Settings' : (selectedElement.type === ElementType.SLIDESHOW ? 'Slideshow Settings' : 'RSS Feed Settings')}
                          </h4>
                          
                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">
                              {selectedElement.type === ElementType.TICKER ? 'Ticker Text' : (selectedElement.type === ElementType.SLIDESHOW ? 'Image URLs (one per line)' : 'Feed URL')}
                            </label>
                            <textarea
                              value={selectedElement.content}
                              onChange={(e) => updateSelectedElement('content', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder={selectedElement.type === ElementType.TICKER ? 'Breaking News • Latest Updates' : (selectedElement.type === ElementType.SLIDESHOW ? 'https://example.com/image1.jpg&#10;https://example.com/image2.jpg' : 'https://example.com/rss')}
                              className="w-full h-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all resize-none"
                            />
                          </div>

                          {selectedElement.type === ElementType.TICKER && (
                            <>
                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Scroll Speed</label>
                                <select 
                                  value={selectedElement.widgetSettings?.scrollSpeed || 'medium'}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    scrollSpeed: e.target.value 
                                  })}
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
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    direction: e.target.value 
                                  })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                                >
                                  <option value="left">Left to Right</option>
                                  <option value="right">Right to Left</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                <input 
                                  type="checkbox" 
                                  id="modify-ticker-loop" 
                                  className="rounded"
                                  checked={selectedElement.widgetSettings?.loop ?? true}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    loop: e.target.checked 
                                  })}
                                />
                                <label htmlFor="modify-ticker-loop" className="text-xs text-gray-600">Continuous loop</label>
                              </div>
                            </>
                          )}

                          {[ElementType.RSS, ElementType.MEDIA_RSS].includes(selectedElement.type) && (
                            <>
                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Update Interval (minutes)</label>
                                <input
                                  type="number"
                                  value={selectedElement.widgetSettings?.updateInterval || 15}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    updateInterval: Number(e.target.value) 
                                  })}
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
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    maxItems: Number(e.target.value) 
                                  })}
                                  min={1}
                                  max={50}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                                />
                              </div>

                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Display Mode</label>
                                <select 
                                  value={selectedElement.widgetSettings?.displayMode || 'scroll'}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    displayMode: e.target.value 
                                  })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                                >
                                  <option value="scroll">Scrolling List</option>
                                  <option value="static">Static List</option>
                                  <option value="fade">Fade In/Out</option>
                                  <option value="ticker">Ticker Style</option>
                                </select>
                              </div>
                            </>
                          )}

                          {selectedElement.type === ElementType.SLIDESHOW && (
                            <>
                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Transition Duration (seconds)</label>
                                <input
                                  type="number"
                                  value={selectedElement.widgetSettings?.transitionDuration || 5}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    transitionDuration: Number(e.target.value) 
                                  })}
                                  min={1}
                                  max={60}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                                />
                              </div>

                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Transition Effect</label>
                                <select 
                                  value={selectedElement.widgetSettings?.transitionEffect || 'fade'}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    transitionEffect: e.target.value 
                                  })}
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
                                  id="modify-slideshow-autoplay" 
                                  className="rounded"
                                  checked={selectedElement.widgetSettings?.autoplay ?? true}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    autoplay: e.target.checked 
                                  })}
                                />
                                <label htmlFor="modify-slideshow-autoplay" className="text-xs text-gray-600">Auto-play slideshow</label>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Streaming Widgets Properties */}
                      {[ElementType.USTREAM, ElementType.STREAMING].includes(selectedElement.type) && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Video size={14} />
                            Streaming Settings
                          </h4>
                          
                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Stream URL</label>
                            <textarea
                              value={selectedElement.content}
                              onChange={(e) => updateSelectedElement('content', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="Enter stream embed URL"
                              className="w-full h-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Instagram Widget Properties */}
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
                              onChange={(e) => updateSelectedElement('widgetSettings', { 
                                ...selectedElement.widgetSettings, 
                                embedCode: e.target.value 
                              })}
                              onBlur={() => updateHistory(elements)}
                              placeholder="<iframe src='...'></iframe>"
                              className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Label Widget Properties */}
                      {selectedElement.type === ElementType.LABEL && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Type size={14} />
                            Label Content
                          </h4>
                          
                          <div>
                            <label className="text-xs text-gray-600 mb-2 block font-medium">Label Text</label>
                            <textarea
                              value={selectedElement.content}
                              onChange={(e) => updateSelectedElement('content', e.target.value)}
                              onBlur={() => updateHistory(elements)}
                              placeholder="Enter label text"
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
                              onChange={(e) => updateSelectedElement('widgetSettings', { 
                                ...selectedElement.widgetSettings, 
                                embedCode: e.target.value 
                              })}
                              onBlur={() => updateHistory(elements)}
                              placeholder="<iframe src='...'></iframe>"
                              className="w-full h-48 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-2">Paste iframe or embed code here.</p>
                          </div>
                        </div>
                      )}

                      {/* General Widget Properties - CLOCK, TIMER, WEATHER */}
                      {[ElementType.CLOCK, ElementType.TIMER, ElementType.WEATHER, ElementType.WEATHER_2].includes(selectedElement.type) && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            {[ElementType.WEATHER, ElementType.WEATHER_2].includes(selectedElement.type) ? <CloudSun size={14} /> : <Clock size={14} />}
                            {selectedElement.type === ElementType.CLOCK ? 'Clock Settings' : (selectedElement.type === ElementType.TIMER ? 'Timer Settings' : 'Weather Settings')}
                          </h4>
                          
                          {selectedElement.type === ElementType.CLOCK && (
                            <>
                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Time Format</label>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => updateSelectedElement('widgetSettings', { 
                                      ...selectedElement.widgetSettings, 
                                      timeFormat: '12' 
                                    })}
                                    className={`flex-1 px-3 py-2 rounded-lg border-2 ${selectedElement.widgetSettings?.timeFormat === '12' ? 'bg-slate-900 text-white border-slate-900' : 'border-gray-200 text-gray-600 hover:border-slate-300'}`}
                                  >
                                    12 Hour
                                  </button>
                                  <button 
                                    onClick={() => updateSelectedElement('widgetSettings', { 
                                      ...selectedElement.widgetSettings, 
                                      timeFormat: '24' 
                                    })}
                                    className={`flex-1 px-3 py-2 rounded-lg border-2 ${selectedElement.widgetSettings?.timeFormat === '24' ? 'bg-slate-900 text-white border-slate-900' : 'border-gray-200 text-gray-600 hover:border-slate-300'}`}
                                  >
                                    24 Hour
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Display Style</label>
                                <select 
                                  value={selectedElement.widgetSettings?.displayStyle || 'digital'}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    displayStyle: e.target.value 
                                  })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                                >
                                  <option value="digital">Digital</option>
                                  <option value="analog">Analog</option>
                                  <option value="text">Text Format</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                <input 
                                  type="checkbox" 
                                  id="modify-clock-showSeconds" 
                                  className="rounded"
                                  checked={selectedElement.widgetSettings?.showSeconds ?? true}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    showSeconds: e.target.checked 
                                  })}
                                />
                                <label htmlFor="modify-clock-showSeconds" className="text-xs text-gray-600">Show seconds</label>
                              </div>
                            </>
                          )}

                          {selectedElement.type === ElementType.TIMER && (
                            <>
                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Timer Type</label>
                                <select 
                                  value={selectedElement.widgetSettings?.timerType || 'countdown'}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    timerType: e.target.value 
                                  })}
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
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    countdownTo: e.target.value 
                                  })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                                />
                              </div>

                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Display Format</label>
                                <select 
                                  value={selectedElement.widgetSettings?.displayFormat || 'HH:MM:SS'}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    displayFormat: e.target.value 
                                  })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                                >
                                  <option value="HH:MM:SS">HH:MM:SS</option>
                                  <option value="DD:HH:MM:SS">DD:HH:MM:SS</option>
                                  <option value="Days, Hours, Minutes">Days, Hours, Minutes</option>
                                  <option value="Seconds">Seconds Only</option>
                                </select>
                              </div>
                            </>
                          )}

                          {[ElementType.WEATHER, ElementType.WEATHER_2].includes(selectedElement.type) && (
                            <>
                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Location</label>
                                <input
                                  type="text"
                                  value={selectedElement.widgetSettings?.location || 'New York, NY'}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    location: e.target.value 
                                  })}
                                  placeholder="New York, NY"
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                                />
                              </div>

                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Temperature Unit</label>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => updateSelectedElement('widgetSettings', { 
                                      ...selectedElement.widgetSettings, 
                                      temperatureUnit: 'F' 
                                    })}
                                    className={`flex-1 px-3 py-2 rounded-lg border-2 ${selectedElement.widgetSettings?.temperatureUnit === 'F' ? 'bg-slate-900 text-white border-slate-900' : 'border-gray-200 text-gray-600 hover:border-slate-300'}`}
                                  >
                                    °F
                                  </button>
                                  <button 
                                    onClick={() => updateSelectedElement('widgetSettings', { 
                                      ...selectedElement.widgetSettings, 
                                      temperatureUnit: 'C' 
                                    })}
                                    className={`flex-1 px-3 py-2 rounded-lg border-2 ${selectedElement.widgetSettings?.temperatureUnit === 'C' ? 'bg-slate-900 text-white border-slate-900' : 'border-gray-200 text-gray-600 hover:border-slate-300'}`}
                                  >
                                    °C
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Display Style</label>
                                <select 
                                  value={selectedElement.widgetSettings?.displayStyle || 'current'}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    displayStyle: e.target.value 
                                  })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                                >
                                  <option value="current">Current Conditions</option>
                                  <option value="forecast">5-Day Forecast</option>
                                  <option value="hourly">Hourly Forecast</option>
                                  <option value="detailed">Detailed View</option>
                                </select>
                              </div>
                            </>
                          )}

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
                        </div>
                      )}

                      {/* Advanced Widget Properties - TABLE, CALENDAR, DASHBOARDS */}
                      {[ElementType.TABLE, ElementType.CALENDAR, ElementType.DASHBOARDS].includes(selectedElement.type) && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Grid3x3 size={14} />
                            {selectedElement.type === ElementType.TABLE ? 'Table Settings' : (selectedElement.type === ElementType.CALENDAR ? 'Calendar Settings' : 'Dashboard Settings')}
                          </h4>
                          
                          {selectedElement.type === ElementType.TABLE && (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-gray-600 mb-2 block font-medium">Rows</label>
                                  <input
                                    type="number"
                                    value={selectedElement.widgetSettings?.rows || 5}
                                    onChange={(e) => updateSelectedElement('widgetSettings', { 
                                      ...selectedElement.widgetSettings, 
                                      rows: Number(e.target.value) 
                                    })}
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
                                    onChange={(e) => updateSelectedElement('widgetSettings', { 
                                      ...selectedElement.widgetSettings, 
                                      columns: Number(e.target.value) 
                                    })}
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
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    dataSource: e.target.value 
                                  })}
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
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Table Style</label>
                                <select 
                                  value={selectedElement.widgetSettings?.tableStyle || 'default'}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    tableStyle: e.target.value 
                                  })}
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
                                  id="modify-table-showHeader" 
                                  className="rounded"
                                  checked={selectedElement.widgetSettings?.showHeader ?? true}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    showHeader: e.target.checked 
                                  })}
                                />
                                <label htmlFor="modify-table-showHeader" className="text-xs text-gray-600">Show header row</label>
                              </div>
                            </>
                          )}

                          {selectedElement.type === ElementType.CALENDAR && (
                            <>
                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Calendar Source</label>
                                <select 
                                  value={selectedElement.widgetSettings?.calendarSource || 'google'}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    calendarSource: e.target.value 
                                  })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                                >
                                  <option value="google">Google Calendar</option>
                                  <option value="outlook">Outlook Calendar</option>
                                  <option value="ical">Custom iCal URL</option>
                                  <option value="local">Local Events</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">View Mode</label>
                                <select 
                                  value={selectedElement.widgetSettings?.viewMode || 'monthly'}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    viewMode: e.target.value 
                                  })}
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
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    colorScheme: e.target.value 
                                  })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                                >
                                  <option value="default">Default</option>
                                  <option value="blue">Blue</option>
                                  <option value="green">Green</option>
                                  <option value="purple">Purple</option>
                                  <option value="dark">Dark Mode</option>
                                </select>
                              </div>
                            </>
                          )}

                          {selectedElement.type === ElementType.DASHBOARDS && (
                            <>
                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Dashboard Type</label>
                                <select 
                                  value={selectedElement.widgetSettings?.dashboardType || 'metrics'}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    dashboardType: e.target.value 
                                  })}
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
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    dataUrl: e.target.value 
                                  })}
                                  placeholder="API Endpoint URL"
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                                />
                              </div>

                              <div>
                                <label className="text-xs text-gray-600 mb-2 block font-medium">Refresh Rate (seconds)</label>
                                <input
                                  type="number"
                                  value={selectedElement.widgetSettings?.refreshRate || 30}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    refreshRate: Number(e.target.value) 
                                  })}
                                  min={5}
                                  max={3600}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                                />
                              </div>

                              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                <input 
                                  type="checkbox" 
                                  id="modify-dashboard-autoRefresh" 
                                  className="rounded"
                                  checked={selectedElement.widgetSettings?.autoRefresh ?? true}
                                  onChange={(e) => updateSelectedElement('widgetSettings', { 
                                    ...selectedElement.widgetSettings, 
                                    autoRefresh: e.target.checked 
                                  })}
                                />
                                <label htmlFor="modify-dashboard-autoRefresh" className="text-xs text-gray-600">Auto-refresh data</label>
                              </div>
                            </>
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

                      {/* Layer Actions */}
                      <div className="space-y-2 pt-4 border-t border-gray-200">
                        <button 
                          onClick={() => {
                            updateSelectedElement('locked', !selectedElement.locked);
                            updateHistory(elements);
                          }}
                          className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                            selectedElement.locked
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
                            if (selectedElement) {
                              updateSelectedElement('animation', anim);
                            }
                          }}
                          className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            selectedElement?.animation === anim
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
                            if (selectedElement) {
                              updateSelectedElement('animation', anim);
                            }
                          }}
                          className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            selectedElement?.animation === anim
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
                            if (selectedElement) {
                              updateSelectedElement('animation', anim);
                            }
                          }}
                          className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            selectedElement?.animation === anim
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
                            if (selectedElement) {
                              updateSelectedElement('animation', anim);
                            }
                          }}
                          className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            selectedElement?.animation === anim
                              ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {anim}
                        </button>
                      ))}
                    </div>
                  </div>

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
                            updateSelectedElement('animation', undefined);
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
                        // Multi-selection with Ctrl/Cmd key
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
                      className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                        selectedIds.includes(el.id)
                          ? 'bg-slate-900 text-white shadow-lg' 
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className={selectedIds.includes(el.id) ? 'text-white' : 'text-gray-400'}>
                        {el.type === ElementType.TEXT && <Type size={16} />}
                        {el.type === ElementType.IMAGE && <ImageIcon size={16} />}
                        {el.type === ElementType.VIDEO && <Video size={16} />}
                        {el.type === ElementType.SLIDESHOW && <Layout size={16} />}
                        {el.type === ElementType.TICKER && <Type size={16} />}
                        {el.type === ElementType.RSS && <FileText size={16} />}
                        {el.type === ElementType.WEATHER && <CloudSun size={16} />}
                        {el.type === ElementType.GIF && <Image size={16} />}
                        {el.type === ElementType.MEDIA_RSS && <FileText size={16} />}
                        {el.type === ElementType.YOUTUBE && <Video size={16} />}
                        {el.type === ElementType.USTREAM && <Video size={16} />}
                        {el.type === ElementType.FTP && <FileText size={16} />}
                        {el.type === ElementType.INSTAGRAM && <Image size={16} />}
                        {el.type === ElementType.STREAMING && <Video size={16} />}
                        {el.type === ElementType.LABEL && <Type size={16} />}
                        {el.type === ElementType.CLOCK && <Clock size={16} />}
                        {el.type === ElementType.TIMER && <Clock size={16} />}
                        {el.type === ElementType.TOUCH && <MousePointer2 size={16} />}
                        {el.type === ElementType.WEATHER_2 && <CloudSun size={16} />}
                        {el.type === ElementType.AD_SERVING && <ImageIcon size={16} />}
                        {el.type === ElementType.CALENDAR && <Grid3x3 size={16} />}
                        {el.type === ElementType.DASHBOARDS && <Layout size={16} />}
                        {el.type === ElementType.TABLE && <Grid3x3 size={16} />}
                        {el.type === ElementType.SMART_SWITCH && <Settings size={16} />}
                        {el.type === ElementType.WEB_IMAGE && <ImageIcon size={16} />}
                        {el.type === ElementType.WEB_VIDEO && <Video size={16} />}
                        {el.type === ElementType.SUB_CREATIVE && <Layout size={16} />}
                        {el.type === ElementType.EMBED && <Layout size={16} />}
                        {el.type === ElementType.HTML && <FileText size={16} />}
                        {[ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.LINE, ElementType.PENTAGON, ElementType.HEXAGON, ElementType.OCTAGON, ElementType.DIAMOND, ElementType.TRAPEZOID, ElementType.CRESCENT, ElementType.CROSS].includes(el.type) && <Shapes size={16} />}
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

        {/* Save Design Modal */}
        <SaveDesignModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveDesign}
          isLoading={isSavingDesign}
          error={saveError}
          successMessage={successMessage}
          defaultTitle={designTitle}
          isModifying={true}
        />
      </div>
    </div>
  );
};

export default Editor;