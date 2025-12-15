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
  RotateCw, Sparkles, Image, Shapes, FileText, MousePointer2, RectangleHorizontal, Sidebar
} from 'lucide-react';
import { SaveDesignModal, SaveDesignModalData } from '../components/SaveDesignModal';
import { useDesignSave } from '../hooks/useDesignSave';
import { downloadDesignAsJSON } from '../services/canvasExportService';
import { getDesignById, updateDesignInFirestore, saveDesignToFirestore } from '../services/designService';

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
  { name: 'Instagram Post', width: 1080, height: 1080, icon: <Grid3x3 size={16} /> },
  { name: 'Instagram Story', width: 1080, height: 1920, icon: <Layout size={16} /> },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, icon: <Maximize2 size={16} /> },
  { name: 'Facebook Cover', width: 1640, height: 924, icon: <Layout size={16} /> },
  { name: 'Billboard', width: 1920, height: 480, icon: <RectangleHorizontal size={16} /> },
];

const WIDGET_CATEGORIES = [
  { 
    id: 'text', 
    label: 'Text', 
    icon: <FileText size={18} />,
    items: [
      { type: ElementType.TEXT, label: 'Heading', icon: <Type size={18} />, fontSize: 48 },
      { type: ElementType.TEXT, label: 'Subheading', icon: <Type size={18} />, fontSize: 32 },
      { type: ElementType.TEXT, label: 'Body Text', icon: <Type size={18} />, fontSize: 16 },
    ] 
  },
  { 
    id: 'shapes', 
    label: 'Shapes', 
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
    id: 'media', 
    label: 'Media', 
    icon: <Image size={18} />,
    items: [
      { type: ElementType.IMAGE, label: 'Image', icon: <ImageIcon size={18} /> },
      { type: ElementType.VIDEO, label: 'Video', icon: <Video size={18} /> },
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [activeLeftTab, setActiveLeftTab] = useState<'design' | 'templates' | 'uploads'>('design');
  const [activeRightTab, setActiveRightTab] = useState<'properties' | 'layers'>('properties');
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
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
  const { saveDesign: saveDesignToFirebase, isLoading: isSavingDesign, error: saveError, successMessage } = useDesignSave();
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    widgets_text: true,
    widgets_shapes: false,
    widgets_media: false,
  });

  const [dragInfo, setDragInfo] = useState<{ 
    id: string; 
    startX: number; 
    startY: number; 
    initialX: number; 
    initialY: number 
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
      id: Math.random().toString(36).substr(2, 9),
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
    setSelectedId(newElement.id);
    setRightSidebarOpen(true);
  };

  const getDefaultContent = (type: ElementType) => {
    switch (type) {
      case ElementType.TEXT: return 'Double click to edit';
      case ElementType.IMAGE: return 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400';
      case ElementType.VIDEO: return 'Video';
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

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === id);
    
    setSelectedId(id);
    setRightSidebarOpen(true);
    
    if (element && !element.locked && !editingTextId) {
      setDragInfo({
        id,
        startX: e.clientX,
        startY: e.clientY,
        initialX: element.x,
        initialY: element.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragInfo && !resizing) {
      const scale = zoom / 100;
      const dx = (e.clientX - dragInfo.startX) / scale;
      const dy = (e.clientY - dragInfo.startY) / scale;

      setElements(prev => prev.map(el => {
        if (el.id === dragInfo.id) {
          // Calculate proposed snapped position first
          const rawX = dragInfo.initialX + dx;
          const rawY = dragInfo.initialY + dy;
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
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    if (element) {
      const newElement = {
        ...element,
        id: Math.random().toString(36).substr(2, 9),
        x: Math.min(element.x + 20, canvasSize.width - element.width),
        y: Math.min(element.y + 20, canvasSize.height - element.height),
        zIndex: elements.length + 1,
        locked: false,
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
      updateHistory(newElements);
      setSelectedId(newElement.id);
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
      setSelectedId(id);
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
  const saveDesign = () => {
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

        return {
          id: el.id || '',
          type: el.type || ElementType.RECT,
          content: el.content || '',
          x: el.x ?? 0,
          y: el.y ?? 0,
          width: el.width ?? 100,
          height: el.height ?? 100,
          fontSize: el.fontSize ?? 16,
          color: el.color || '#000000',
          backgroundColor: el.backgroundColor || '#ffffff',
          fillColor: el.fillColor || '#cccccc',
          opacity: el.opacity ?? 100,
          rotation: el.rotation ?? 0,
          zIndex: el.zIndex ?? 0,
          strokeColor: el.strokeColor || '#000000',
          strokeWidth: el.strokeWidth ?? 1,
          borderRadius: el.borderRadius ?? 0,
          locked: el.locked ?? false,
          visible: el.visible ?? true,
          textStyle: el.textStyle || defaultTextStyle,
        };
      });

      const exportedDesign = {
        metadata: {
          title: data.title || 'Untitled',
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

  // Export design as local JSON file
  const exportDesignAsJSON = () => {
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
      setSelectedId(previousSelectedId);

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

  const selectedElement = elements.find(el => el.id === selectedId);

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
          case 's': e.preventDefault(); saveDesign(); break;
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
            onClick={saveDesign}
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
            onClick={() => setSelectedId(null)}
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

              {elements
                .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                .map(el => (
                  <div
                    key={el.id}
                    className={`absolute group select-none transition-all ${
                      selectedId === el.id 
                        ? 'ring-2 ring-slate-900 shadow-lg' 
                        : 'hover:ring-2 hover:ring-slate-300'
                    } ${el.locked ? 'cursor-not-allowed' : ''} ${
                      dragInfo?.id === el.id ? 'opacity-75 ring-2 ring-blue-500 shadow-xl' : ''
                    }`}
                    style={{
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      opacity: dragInfo?.id === el.id ? 0.75 : el.opacity,
                      zIndex: dragInfo?.id === el.id ? 1000 : el.zIndex,
                      transform: `rotate(${el.rotation || 0}deg) ${dragInfo?.id === el.id ? 'scale(1.05)' : ''}`,
                      cursor: el.locked ? 'not-allowed' : (dragInfo?.id === el.id ? 'grabbing' : 'grab'),
                      transition: dragInfo?.id === el.id ? 'none' : 'all 0.2s ease',
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
                    ) : [ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.LINE, ElementType.PENTAGON, ElementType.HEXAGON, ElementType.OCTAGON, ElementType.DIAMOND, ElementType.TRAPEZOID, ElementType.CRESCENT, ElementType.CROSS].includes(el.type) ? (
                      <div style={{ borderRadius: el.borderRadius, width: '100%', height: '100%' }}>
                        {renderShape(el.type, el.fillColor || '#0F172A', el.strokeColor, el.strokeWidth)}
                      </div>
                    ) : null}

                    {selectedId === el.id && !el.locked && (
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
              
              <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm">
                <button 
                  onClick={() => setActiveRightTab('properties')} 
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeRightTab === 'properties' 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Settings size={14} />
                    {selectedElement ? 'Design' : 'Canvas'}
                  </div>
                </button>
                <button 
                  onClick={() => setActiveRightTab('layers')} 
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeRightTab === 'layers' 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Layers size={14} />
                    Layers
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
              ) : (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Layers size={14} />
                    All Layers ({elements.length})
                  </h4>
                  {[...elements].reverse().map((el, i) => (
                    <div 
                      key={el.id} 
                      onClick={() => {
                        setSelectedId(el.id);
                        setRightSidebarOpen(true);
                      }}
                      className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                        selectedId === el.id 
                          ? 'bg-slate-900 text-white shadow-lg' 
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className={selectedId === el.id ? 'text-white' : 'text-gray-400'}>
                        {el.type === ElementType.TEXT && <Type size={16} />}
                        {el.type === ElementType.IMAGE && <ImageIcon size={16} />}
                        {[ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.LINE].includes(el.type) && <Shapes size={16} />}
                      </div>
                      <span className={`text-sm flex-1 font-medium ${selectedId === el.id ? 'text-white' : 'text-gray-700'}`}>
                        {el.type.charAt(0).toUpperCase() + el.type.slice(1)} {elements.length - i}
                      </span>
                      {el.locked && (
                        <Lock size={14} className={selectedId === el.id ? 'text-white/80' : 'text-gray-400'} />
                      )}
                      <span className={`text-xs ${selectedId === el.id ? 'text-white/80' : 'text-gray-400'}`}>z:{el.zIndex}</span>
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
        />
      </div>
    </div>
  );
};

export default Editor;