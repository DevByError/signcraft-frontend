import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Type, Image as ImageIcon, Square, Video, Clock, CloudSun,
  ChevronRight, ChevronDown, Search, ArrowLeft,
  LayoutGrid, Maximize, Copy, Scissors, Clipboard, Trash2, 
  Layers, Undo, Redo, ZoomIn, ZoomOut, Save, Share2, 
  PanelLeftClose, AlignCenter, AlignLeft, AlignRight, Lock, 
  Circle, Edit2, Download, Eye, EyeOff, Bold, Italic, 
  Underline, Palette, Sparkles, FileDown, Smartphone, Monitor,
  Triangle, Star, Heart, ArrowUp, ArrowDown, FlipHorizontal2, 
  FlipVertical2, Settings, Menu, Filter, Upload, Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { generateMarketingCopy } from '../services/geminiService';
import { uploadMedia } from '../services/mediaService';
import { saveDesign, shareDesign, getCollaborators } from '../services/collaborationService';
import { ElementType, CanvasElement, MediaUpload, Design } from '../types';
import ShapeEditor from '../components/ShapeEditor';
import MediaUploader from '../components/MediaUploader';

// Widget Categories & Items configuration
const WIDGET_CATEGORIES = [
  { 
    id: 'essential', 
    label: 'Essential', 
    items: [
      { type: ElementType.TEXT, label: 'Text', icon: <Type size={18} /> },
      { type: ElementType.IMAGE, label: 'Image', icon: <ImageIcon size={18} /> },
      { type: ElementType.RECT, label: 'Rectangle', icon: <Square size={18} />, data: 'rectangle' },
      { type: ElementType.CIRCLE, label: 'Circle', icon: <Circle size={18} />, data: 'circle' },
    ] 
  },
  { 
    id: 'shapes', 
    label: 'Shapes', 
    items: [
      { type: ElementType.TRIANGLE, label: 'Triangle', icon: <Triangle size={18} />, data: 'triangle' },
      { type: ElementType.STAR, label: 'Star', icon: <Star size={18} />, data: 'star' },
      { type: ElementType.HEART, label: 'Heart', icon: <Heart size={18} />, data: 'heart' },
      { type: ElementType.LINE, label: 'Line', icon: <Square size={18} />, data: 'line' },
    ] 
  },
  { 
    id: 'media', 
    label: 'Media', 
    items: [
      { type: ElementType.VIDEO, label: 'Video', icon: <Video size={18} /> },
      { type: ElementType.IMAGE, label: 'Slideshow', icon: <ImageIcon size={18} /> },
    ] 
  },
  { 
    id: 'general', 
    label: 'General', 
    items: [
      { type: ElementType.CLOCK, label: 'Clock', icon: <Clock size={18} /> },
      { type: ElementType.WEATHER, label: 'Weather', icon: <CloudSun size={18} /> },
    ] 
  },
  { 
    id: 'advanced', 
    label: 'Advanced', 
    items: [
      { type: ElementType.TEXT, label: 'Ticker', icon: <AlignLeft size={18} /> },
      { type: ElementType.RECT, label: 'QR Code', icon: <LayoutGrid size={18} /> },
    ] 
  },
];

const Editor: React.FC = () => {
  const { user } = useAuth(); // Auth is now bypassed/mocked
  const navigate = useNavigate();
  
  // -- State --
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [activeRightTab, setActiveRightTab] = useState<'canvas' | 'layers'>('canvas');
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [history, setHistory] = useState<CanvasElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [clipboard, setClipboard] = useState<CanvasElement | null>(null);
  const [resizing, setResizing] = useState<{ id: string, handle: string, startX: number, startY: number, initialWidth: number, initialHeight: number } | null>(null);
  const [designTab, setDesignTab] = useState<'color' | 'effects' | 'text' | 'shapes'>('color');
  const [colorPalette, setColorPalette] = useState<string[]>(['#1B263B', '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#FFFFFF', '#000000']);
  const [selectedFontFamily, setSelectedFontFamily] = useState('Inter');
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [presetSize, setPresetSize] = useState<'mobile' | 'tablet' | 'desktop' | '1080p'>('desktop');
  const [searchWidget, setSearchWidget] = useState<string>('');
  
  // Auto-save and collaboration state
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaveTime, setLastSaveTime] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<string>('');
  
  // Sidebar accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    widgets_essential: true,
    widgets_media: false,
    widgets_general: false,
    widgets_advanced: false,
    props_info: true,
    props_settings: true,
    props_design: true,
    props_audit: false,
  });

  // Drag & Drop State
  const [dragInfo, setDragInfo] = useState<{ id: string, startX: number, startY: number, initialX: number, initialY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // -- Handlers --

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // History Management
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

  const handleDragStartWidget = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('widgetType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('widgetType') as ElementType;
    if (!type) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate position relative to canvas
    const scale = zoom / 100;
    const x = snapValue((e.clientX - rect.left) / scale);
    const y = snapValue((e.clientY - rect.top) / scale);

    addElement(type, x, y);
  };

  const addElement = (type: ElementType, x: number = 50, y: number = 50) => {
    const newElement: CanvasElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: getDefaultContent(type),
      x: x,
      y: y,
      width: type === ElementType.TEXT ? 300 : 200,
      height: type === ElementType.TEXT ? 60 : 200,
      fontSize: 24,
      color: '#000000',
      backgroundColor: [ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.DIAMOND, ElementType.PENTAGON, ElementType.HEXAGON, ElementType.LINE].includes(type) ? '#1B263B' : 'transparent',
      opacity: 1,
      rotation: 0,
      zIndex: elements.length + 1,
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    updateHistory(newElements);
    setSelectedId(newElement.id);
    setActiveRightTab('canvas');
  };

  const getDefaultContent = (type: ElementType) => {
    switch (type) {
      case ElementType.TEXT: return 'Double click to edit text';
      case ElementType.IMAGE: return 'https://picsum.photos/400/300';
      case ElementType.VIDEO: return 'Video Placeholder';
      case ElementType.RECT:
      case ElementType.CIRCLE:
      case ElementType.TRIANGLE:
      case ElementType.STAR:
      case ElementType.HEART:
      case ElementType.DIAMOND:
      case ElementType.PENTAGON:
      case ElementType.HEXAGON:
      case ElementType.LINE: return 'rectangle';
      default: return '';
    }
  };

  const renderShape = (shapeType: string, bgColor: string, strokeColor?: string, strokeWidth?: number) => {
    const borderStyle = strokeWidth && strokeWidth > 0 ? `${strokeWidth}px solid ${strokeColor || '#000000'}` : 'none';
    const svgStrokeProps = strokeWidth && strokeWidth > 0 ? { stroke: strokeColor || '#000000', strokeWidth } : {};

    switch (shapeType) {
      case 'rectangle':
        return <div className="w-full h-full" style={{backgroundColor: bgColor, border: borderStyle}}></div>;
      case 'rounded-rectangle':
        return <div className="w-full h-full rounded-lg" style={{backgroundColor: bgColor, border: borderStyle}}></div>;
      case 'circle':
        return <div className="w-full h-full rounded-full" style={{backgroundColor: bgColor, border: borderStyle}}></div>;
      case 'oval':
        return <div className="w-full h-full rounded-full" style={{backgroundColor: bgColor, border: borderStyle, borderRadius: '50%'}}></div>;
      case 'triangle':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,10 90,85 10,85" fill={bgColor} {...svgStrokeProps}/>
          </svg>
        );
      case 'diamond':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,10 90,50 50,90 10,50" fill={bgColor} {...svgStrokeProps}/>
          </svg>
        );
      case 'pentagon':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,10 90,35 75,85 25,85 10,35" fill={bgColor} {...svgStrokeProps}/>
          </svg>
        );
      case 'hexagon':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,10 93,25 93,75 50,90 7,75 7,25" fill={bgColor} {...svgStrokeProps}/>
          </svg>
        );
      case 'octagon':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="30,10 70,10 90,30 90,70 70,90 30,90 10,70 10,30" fill={bgColor} {...svgStrokeProps}/>
          </svg>
        );
      case 'star':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,10 61,40 91,40 67,60 78,90 50,70 22,90 33,60 9,40 39,40" fill={bgColor} {...svgStrokeProps}/>
          </svg>
        );
      case 'heart':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M50,85 C25,70 10,55 10,40 C10,25 20,15 30,15 C40,15 50,25 50,25 C50,25 60,15 70,15 C80,15 90,25 90,40 C90,55 75,70 50,85 Z" fill={bgColor} {...svgStrokeProps}/>
          </svg>
        );
      case 'trapezoid':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="30,20 70,20 90,80 10,80" fill={bgColor} {...svgStrokeProps}/>
          </svg>
        );
      case 'line':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <line x1="0" y1="50" x2="100" y2="50" stroke={strokeColor || bgColor} strokeWidth={strokeWidth || 2}/>
          </svg>
        );
      case 'cross':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <line x1="50" y1="10" x2="50" y2="90" stroke={strokeColor || bgColor} strokeWidth={strokeWidth || 2}/>
            <line x1="10" y1="50" x2="90" y2="50" stroke={strokeColor || bgColor} strokeWidth={strokeWidth || 2}/>
          </svg>
        );
      case 'crescent':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="40" fill={bgColor} {...svgStrokeProps}/>
            <circle cx="60" cy="50" r="40" fill="white"/>
          </svg>
        );
      default:
        return <div className="w-full h-full" style={{backgroundColor: bgColor, border: borderStyle}}></div>;
    }
  };

  // Canvas Item Moving Logic
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    const element = elements.find(el => el.id === id);
    if (element && !editingTextId) {
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
    if (dragInfo) {
        const scale = zoom / 100;
        const dx = (e.clientX - dragInfo.startX) / scale;
        const dy = (e.clientY - dragInfo.startY) / scale;

        setElements(prev => prev.map(el => {
            if (el.id === dragInfo.id) {
                return { ...el, x: snapValue(dragInfo.initialX + dx), y: snapValue(dragInfo.initialY + dy) };
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

                if (resizing.handle.includes('e')) newWidth = Math.max(20, resizing.initialWidth + dx);
                if (resizing.handle.includes('s')) newHeight = Math.max(20, resizing.initialHeight + dy);
                if (resizing.handle.includes('w')) newWidth = Math.max(20, resizing.initialWidth - dx);
                if (resizing.handle.includes('n')) newHeight = Math.max(20, resizing.initialHeight - dy);

                return { ...el, width: newWidth, height: newHeight };
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
    if (element) {
        setResizing({
            id,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            initialWidth: element.width,
            initialHeight: element.height
        });
    }
  };

  const deleteSelected = () => {
    if(!selectedId) return;
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
        x: element.x + 20,
        y: element.y + 20,
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
      updateHistory(newElements);
      setSelectedId(newElement.id);
    }
  };

  const copySelected = () => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    if (element) {
      setClipboard(element);
    }
  };

  const pasteElement = () => {
    if (!clipboard) return;
    const newElement = {
      ...clipboard,
      id: Math.random().toString(36).substr(2, 9),
      x: clipboard.x + 30,
      y: clipboard.y + 30,
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    updateHistory(newElements);
    setSelectedId(newElement.id);
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
    updateHistory(newElements);
  };

  const bringToFront = () => {
    if (!selectedId) return;
    const maxZ = Math.max(...elements.map(e => e.zIndex || 0));
    updateSelectedElement('zIndex', maxZ + 1);
  };

  const sendToBack = () => {
    if (!selectedId) return;
    const minZ = Math.min(...elements.map(e => e.zIndex || 0));
    const newElements = elements.map(el => ({
      ...el,
      zIndex: (el.zIndex || 0) === minZ ? (el.id === selectedId ? minZ - 1 : el.zIndex) : el.zIndex
    }));
    setElements(newElements);
    updateHistory(newElements);
  };

  const alignElement = (direction: 'left' | 'center' | 'right') => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    if (!element) return;

    let newX = element.x;
    const canvasWidth = 1280;

    if (direction === 'left') {
      newX = 0;
    } else if (direction === 'center') {
      newX = (canvasWidth - element.width) / 2;
    } else if (direction === 'right') {
      newX = canvasWidth - element.width;
    }

    updateSelectedElement('x', newX);
  };

  const startEditingText = () => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    if (element && element.type === ElementType.TEXT) {
      setEditingTextId(element.id);
      setEditingText(element.content);
      setTimeout(() => textInputRef.current?.focus(), 0);
    }
  };

  const finishEditingText = () => {
    if (editingTextId) {
      updateSelectedElement('content', editingText);
      setEditingTextId(null);
      setEditingText('');
    }
  };

  const handleDoubleClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === id);
    if (element && element.type === ElementType.TEXT) {
      setSelectedId(id);
      startEditingText();
    }
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  const exportDesign = async () => {
    // Create a canvas to export as PNG
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1280, 720);

    // Export as image
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'design.png';
    link.click();
  };

  const saveDesignToServer = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const designData: Design = {
        id: 'current-design',
        name: 'My Design',
        elements: elements,
        lastModified: new Date().toISOString(),
        resolution: { id: 'res-1', name: '1080p', width: 1920, height: 1080, aspectRatio: '16:9' },
      };
      await saveDesign(designData, user?.id || 'anonymous');
      setLastSaveTime(new Date().toLocaleTimeString());
      
      // Optional: Show brief notification
      console.log('Design auto-saved at', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveDesignLocally = () => {
    const designData = {
      name: 'My Design',
      elements: elements,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('signcraft-design', JSON.stringify(designData));
    setLastSaveTime(new Date().toLocaleTimeString());
    alert('Design saved successfully!');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'c':
            e.preventDefault();
            copySelected();
            break;
          case 'v':
            e.preventDefault();
            pasteElement();
            break;
          case 'd':
            e.preventDefault();
            duplicateSelected();
            break;
        }
      }
      if (e.key === 'Delete') {
        e.preventDefault();
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingTextId, clipboard]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDesignLocally();
    }, 30000); // Auto-save every 30 seconds

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [elements, autoSaveEnabled]);

  // Load collaborators on mount
  useEffect(() => {
    const loadCollaborators = async () => {
      try {
        const collabs = await getCollaborators('current-design');
        setCollaborators(collabs);
      } catch (error) {
        console.error('Failed to load collaborators:', error);
      }
    };
    loadCollaborators();
  }, []);

  const handleMediaUploaded = (media: MediaUpload) => {
    const newElement: CanvasElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: media.fileType.startsWith('image/') ? ElementType.IMAGE : ElementType.VIDEO,
      content: media.serverUrl,
      x: 50,
      y: 50,
      width: media.fileType.startsWith('image/') ? 300 : 400,
      height: media.fileType.startsWith('image/') ? 300 : 300,
      opacity: 1,
      rotation: 0,
      zIndex: elements.length + 1,
      uploadedAt: media.uploadedAt,
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    updateHistory(newElements);
    setSelectedId(newElement.id);
  };

  const handleShareDesign = async () => {
    if (!sharedUsers.trim()) return;
    try {
      const userIds = sharedUsers.split(',').map(u => u.trim());
      await shareDesign('current-design', userIds);
      setSharedUsers('');
      setShowShareDialog(false);
      alert('Design shared successfully!');
    } catch (error) {
      console.error('Share failed:', error);
      alert('Failed to share design');
    }
  };

  return (
    <div 
      className="flex flex-col h-screen bg-ivory overflow-hidden font-sans text-gray-800"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      
      {/* --- Top Toolbar (Navy) --- */}
      <div className="h-14 bg-primary border-b border-gray-800 flex items-center justify-between px-2 shadow-md z-30 text-white">
         {/* Left: Back & Widgets Toggle (Visual) */}
         <div className="flex items-center gap-2 w-72 pl-2">
             <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-primaryLight rounded text-gray-200 hover:text-white">
               <ArrowLeft size={18} />
             </button>
             <span className="font-semibold text-white ml-2 tracking-wide">Studio</span>
             <div className="ml-auto">
                <PanelLeftClose size={18} className="text-gray-400 cursor-pointer hover:text-white" />
             </div>
         </div>

         {/* Center: Canvas Tools */}
         <div className="flex-1 flex justify-center gap-2">
            <div className="flex items-center gap-1 bg-primaryLight/30 p-1 rounded-lg border border-primaryLight/50 overflow-x-auto">
                <ToolbarBtn icon={showGrid ? <Eye size={18} /> : <EyeOff size={18} />} onClick={() => setShowGrid(!showGrid)} tooltip="Toggle Grid" />
                <ToolbarBtn icon={<LayoutGrid size={18} />} onClick={() => setSnapToGrid(!snapToGrid)} tooltip={`Snap to Grid ${snapToGrid ? 'ON' : 'OFF'}`} />
                <div className="w-px h-5 bg-gray-600 mx-1"></div>
                <ToolbarBtn icon={<Copy size={18} />} onClick={copySelected} tooltip="Copy (Ctrl+C)" />
                <ToolbarBtn icon={<Scissors size={18} />} onClick={copySelected} tooltip="Cut" />
                <ToolbarBtn icon={<Clipboard size={18} />} onClick={pasteElement} tooltip="Paste (Ctrl+V)" />
                <ToolbarBtn icon={<Trash2 size={18} />} onClick={deleteSelected} tooltip="Delete" />
                <div className="w-px h-5 bg-gray-600 mx-1"></div>
                <ToolbarBtn icon={<Edit2 size={18} />} onClick={startEditingText} tooltip="Edit Text (E)" />
                <ToolbarBtn icon={<FlipHorizontal2 size={18} />} onClick={() => updateSelectedElement('rotation', ((selectedElement?.rotation || 0) + 180) % 360)} tooltip="Flip" />
                <div className="w-px h-5 bg-gray-600 mx-1"></div>
                <ToolbarBtn icon={<AlignLeft size={18} />} onClick={() => alignElement('left')} tooltip="Align Left" />
                <ToolbarBtn icon={<AlignCenter size={18} />} onClick={() => alignElement('center')} tooltip="Align Center" />
                <ToolbarBtn icon={<AlignRight size={18} />} onClick={() => alignElement('right')} tooltip="Align Right" />
                <div className="w-px h-5 bg-gray-600 mx-1"></div>
                <ToolbarBtn icon={<ArrowUp size={18} />} onClick={bringToFront} tooltip="Bring to Front" />
                <ToolbarBtn icon={<ArrowDown size={18} />} onClick={sendToBack} tooltip="Send to Back" />
                <div className="w-px h-5 bg-gray-600 mx-1"></div>
                <ToolbarBtn icon={<Undo size={18} />} onClick={undo} tooltip="Undo (Ctrl+Z)" />
                <ToolbarBtn icon={<Redo size={18} />} onClick={redo} tooltip="Redo (Ctrl+Y)" />
            </div>
         </div>

         {/* Right: Tabs */}
         <div className="w-80 flex bg-primary h-full items-end border-l border-gray-700 gap-2 px-2">
             <button 
               onClick={saveDesignLocally}
               className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded text-white hover:bg-primaryLight/30 transition-colors"
               title="Save Design"
             >
               <Save size={16} />
               <span className="hidden sm:inline">Save</span>
             </button>
             <button 
               onClick={exportDesign}
               className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded text-white hover:bg-primaryLight/30 transition-colors"
               title="Export as PNG"
             >
               <FileDown size={16} />
               <span className="hidden sm:inline">Export</span>
             </button>
             <button 
               onClick={() => setShowShareDialog(!showShareDialog)}
               className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded text-white hover:bg-primaryLight/30 transition-colors relative"
               title="Share Design"
             >
               <Users size={16} />
               <span className="hidden sm:inline">Share</span>
               {collaborators.length > 0 && (
                 <span className="absolute -top-2 -right-2 bg-vanilla text-primary text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                   {collaborators.length}
                 </span>
               )}
             </button>
             <div className="flex-1"></div>
             <button 
               onClick={() => setActiveRightTab('canvas')}
               className={`flex-1 h-full flex items-center justify-center text-sm font-medium border-b-4 transition-colors ${activeRightTab === 'canvas' ? 'border-vanilla text-vanilla bg-primaryLight/20' : 'border-transparent text-gray-400 hover:text-white'}`}
             >
               Design
             </button>
             <button 
               onClick={() => setActiveRightTab('layers')}
               className={`flex-1 h-full flex items-center justify-center text-sm font-medium border-b-4 transition-colors ${activeRightTab === 'layers' ? 'border-vanilla text-vanilla bg-primaryLight/20' : 'border-transparent text-gray-400 hover:text-white'}`}
             >
               Layers
             </button>
         </div>
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Design</h3>
            <input
              type="text"
              placeholder="Enter user IDs (comma-separated)"
              value={sharedUsers}
              onChange={(e) => setSharedUsers(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              <button
                onClick={handleShareDesign}
                className="flex-1 px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primaryLight transition-colors"
              >
                Share
              </button>
              <button
                onClick={() => setShowShareDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        
        {/* --- Left Sidebar: Widgets (Ivory) --- */}
        <div className="w-72 bg-ivory border-r border-gray-200 flex flex-col z-20">
           {/* Search */}
           <div className="p-3 bg-ivory border-b border-gray-200">
             <div className="relative">
               <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Search widget..." 
                 value={searchWidget}
                 onChange={(e) => setSearchWidget(e.target.value)}
                 className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
               />
             </div>
           </div>

           {/* Categories */}
           <div className="flex-1 overflow-y-auto custom-scrollbar">
             {WIDGET_CATEGORIES.map(category => {
               const filteredItems = searchWidget ? category.items.filter(item => item.label.toLowerCase().includes(searchWidget.toLowerCase())) : category.items;
               if (searchWidget && filteredItems.length === 0) return null;
               
               return (
                 <div key={category.id} className="border-b border-gray-200">
                   <button 
                     onClick={() => toggleSection(`widgets_${category.id}`)}
                     className="w-full flex items-center justify-between p-3 text-sm font-medium text-primary hover:bg-vanilla/30 transition-colors"
                   >
                     <div className="flex items-center gap-2">
                       {openSections[`widgets_${category.id}`] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                       {category.label}
                     </div>
                   </button>
                   
                   {openSections[`widgets_${category.id}`] && (
                     <div className="px-4 pb-4 grid grid-cols-1 gap-1">
                       {filteredItems.map((item, idx) => (
                         <div 
                           key={idx}
                           draggable
                           onDragStart={(e) => handleDragStartWidget(e, item.type)}
                           className="flex items-center gap-3 p-2 rounded cursor-grab active:cursor-grabbing hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all group"
                         >
                           <div className="text-primary/70 group-hover:text-primary">{item.icon}</div>
                           <span className="text-sm text-gray-600 group-hover:text-primary">{item.label}</span>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
        </div>

        {/* --- Center: Canvas Workspace --- */}
        <div className="flex-1 bg-gray-200/80 relative overflow-hidden flex flex-col">
            
            {/* Visual Ruler Bar (Top) */}
            <div className="h-6 bg-gray-300 border-b border-gray-400 flex items-center overflow-hidden select-none">
               <div className="flex-1 flex justify-between px-4 text-[10px] text-gray-600 font-mono">
                  {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200].map(n => (
                      <span key={n}>| {n}</span>
                  ))}
               </div>
            </div>
            
            <div 
              className="flex-1 relative overflow-auto p-12 flex items-center justify-center bg-[#E5E5E5]"
              onClick={() => setSelectedId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropOnCanvas}
            >
               {/* The Canvas */}
               <div 
                 ref={canvasRef}
                 className="bg-white shadow-2xl relative transition-transform duration-200 origin-center ring-1 ring-gray-300"
                 style={{ 
                   width: '1280px', 
                   height: '720px',
                   transform: `scale(${zoom / 100})`
                 }}
               >
                  {/* Grid Background Pattern */}
                  {showGrid && (
                    <div className="absolute inset-0 pointer-events-none opacity-20" 
                         style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
                    </div>
                  )}

                  {/* Elements */}
                  {elements.map(el => (
                    <div
                      key={el.id}
                      className={`absolute group select-none transition-all ${selectedId === el.id ? 'ring-2 ring-primary shadow-lg' : 'hover:ring-1 hover:ring-primary/50'}`}
                      style={{
                          left: el.x,
                          top: el.y,
                          width: el.width,
                          height: el.height,
                          backgroundColor: el.backgroundColor,
                          color: el.color,
                          fontSize: el.fontSize,
                          opacity: el.opacity,
                          zIndex: el.zIndex,
                          transform: `rotate(${el.rotation || 0}deg)`,
                          cursor: 'move',
                      }}
                      onMouseDown={(e) => handleMouseDown(e, el.id)}
                      onDoubleClick={(e) => handleDoubleClick(e, el.id)}
                    >
                        {editingTextId === el.id && el.type === ElementType.TEXT ? (
                          <textarea
                            ref={textInputRef}
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onBlur={finishEditingText}
                            onKeyDown={(e) => {
                              if (e.ctrlKey && e.key === 'Enter') finishEditingText();
                            }}
                            className="w-full h-full p-2 font-sans text-inherit border-2 border-primary outline-none resize-none"
                            style={{fontSize: el.fontSize}}
                          />
                        ) : el.type === ElementType.TEXT ? (
                           <div className="w-full h-full p-2 flex items-center justify-center text-center overflow-hidden whitespace-pre-wrap break-words" 
                             style={{
                               fontSize: el.fontSize, 
                               fontFamily: el.textStyle?.fontFamily || 'sans-serif',
                               fontWeight: el.textStyle?.bold ? 'bold' : 'normal',
                               fontStyle: el.textStyle?.italic ? 'italic' : 'normal',
                               textDecoration: el.textStyle?.underline ? 'underline' : 'none',
                               textAlign: el.textStyle?.textAlign || 'center',
                               letterSpacing: el.textStyle?.letterSpacing || 0,
                               lineHeight: el.textStyle?.lineHeight || 1.4,
                             }}>
                              {el.content}
                           </div>
                        ) : el.type === ElementType.IMAGE ? (
                           <img src={el.content} alt="" className="w-full h-full object-cover pointer-events-none"/>
                        ) : [ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.DIAMOND, ElementType.PENTAGON, ElementType.HEXAGON, ElementType.LINE].includes(el.type) ? (
                           <div className="w-full h-full" style={{borderRadius: el.borderRadius}}>
                             {renderShape(el.type.toString(), el.fillColor || '#1B263B', el.strokeColor, el.strokeWidth)}
                           </div>
                        ) : el.type === ElementType.VIDEO ? (
                           <div className="w-full h-full bg-black flex items-center justify-center text-white">
                              <Video size={48} opacity={0.5}/>
                           </div>
                        ) : el.type === ElementType.CLOCK ? (
                            <div className="w-full h-full bg-primary text-white flex items-center justify-center font-mono text-2xl border-4 border-primaryLight rounded">
                                12:45 PM
                            </div>
                        ) : el.type === ElementType.WEATHER ? (
                            <div className="w-full h-full bg-blue-400 text-white flex flex-col items-center justify-center p-2 rounded">
                                <CloudSun size={32} />
                                <span className="text-xl font-bold mt-1">72°F</span>
                            </div>
                        ) : null}

                        {/* Selection Handles */}
                        {selectedId === el.id && (
                           <>
                             <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border border-primary rounded-full shadow-sm cursor-nw-resize hover:w-3.5 hover:h-3.5" onMouseDown={(e) => handleResizeStart(e, el.id, 'nw')}></div>
                             <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border border-primary rounded-full shadow-sm cursor-n-resize hover:w-3.5 hover:h-3.5" onMouseDown={(e) => handleResizeStart(e, el.id, 'n')}></div>
                             <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border border-primary rounded-full shadow-sm cursor-ne-resize hover:w-3.5 hover:h-3.5" onMouseDown={(e) => handleResizeStart(e, el.id, 'ne')}></div>
                             <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2.5 h-2.5 bg-white border border-primary rounded-full shadow-sm cursor-w-resize hover:w-3.5 hover:h-3.5" onMouseDown={(e) => handleResizeStart(e, el.id, 'w')}></div>
                             <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2.5 h-2.5 bg-white border border-primary rounded-full shadow-sm cursor-e-resize hover:w-3.5 hover:h-3.5" onMouseDown={(e) => handleResizeStart(e, el.id, 'e')}></div>
                             <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border border-primary rounded-full shadow-sm cursor-sw-resize hover:w-3.5 hover:h-3.5" onMouseDown={(e) => handleResizeStart(e, el.id, 'sw')}></div>
                             <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border border-primary rounded-full shadow-sm cursor-s-resize hover:w-3.5 hover:h-3.5" onMouseDown={(e) => handleResizeStart(e, el.id, 's')}></div>
                             <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border border-primary rounded-full shadow-sm cursor-se-resize hover:w-3.5 hover:h-3.5" onMouseDown={(e) => handleResizeStart(e, el.id, 'se')}></div>
                           </>
                        )}
                    </div>
                  ))}
               </div>
            </div>

            {/* Bottom Zoom Bar */}
            <div className="h-10 bg-ivory border-t border-gray-300 flex items-center justify-end px-6">
                <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-2 py-0.5 shadow-sm">
                   <button onClick={() => setZoom(z => Math.max(25, z - 10))} className="p-1 hover:text-primary"><ZoomOut size={14}/></button>
                   <span className="text-xs font-medium w-8 text-center text-gray-700">{zoom}%</span>
                   <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1 hover:text-primary"><ZoomIn size={14}/></button>
                </div>
            </div>
        </div>

        {/* --- Right Sidebar: Properties (Ivory) --- */}
        <div className="w-80 bg-ivory border-l border-gray-200 flex flex-col z-20">
           
           <div className="flex-1 overflow-y-auto custom-scrollbar">
             {activeRightTab === 'layers' ? (
                // Layers Tab Content
                <div className="p-2 space-y-1">
                   {[...elements].reverse().map((el, i) => (
                     <div 
                       key={el.id} 
                       onClick={() => setSelectedId(el.id)}
                       className={`p-3 rounded-md flex items-center gap-3 cursor-pointer transition-all ${selectedId === el.id ? 'bg-white shadow-sm border border-primary' : 'bg-transparent border border-transparent hover:bg-white hover:shadow-sm'}`}
                     >
                        <div className="text-gray-400">
                            {el.type === ElementType.TEXT && <Type size={14}/>}
                            {el.type === ElementType.IMAGE && <ImageIcon size={14}/>}
                            {[ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.DIAMOND, ElementType.PENTAGON, ElementType.HEXAGON, ElementType.LINE].includes(el.type) && <Square size={14}/>}
                            {el.type === ElementType.VIDEO && <Video size={14}/>}
                        </div>
                        <span className="text-sm text-gray-700 flex-1 font-medium">{el.type} {elements.length - i}</span>
                        <div className="text-xs text-gray-400">z-{el.zIndex}</div>
                     </div>
                   ))}
                   {elements.length === 0 && <div className="text-center text-gray-400 text-sm mt-10 p-4">Drag widgets here to create layers</div>}
                </div>
             ) : (
                // Canvas/Properties Tab Content
                <div className="pb-10">
                   
                   {/* 1. Information */}
                   <Accordion title="Information" isOpen={openSections['props_info']} toggle={() => toggleSection('props_info')}>
                       {selectedElement ? (
                           <div className="grid grid-cols-2 gap-4">
                               <PropInput label="X Position" value={Math.round(selectedElement.x)} onChange={(v) => updateSelectedElement('x', Number(v))} />
                               <PropInput label="Y Position" value={Math.round(selectedElement.y)} onChange={(v) => updateSelectedElement('y', Number(v))} />
                               <PropInput label="Width" value={Math.round(selectedElement.width)} onChange={(v) => updateSelectedElement('width', Number(v))} />
                               <PropInput label="Height" value={Math.round(selectedElement.height)} onChange={(v) => updateSelectedElement('height', Number(v))} />
                           </div>
                       ) : (
                           <div className="text-sm text-gray-500 italic">Select an element to view position info.</div>
                       )}
                   </Accordion>

                   {/* 2. Settings */}
                   <Accordion title="Settings" isOpen={openSections['props_settings']} toggle={() => toggleSection('props_settings')}>
                        {selectedElement ? (
                             <div className="space-y-3">
                                <div className="text-xs text-primary font-semibold uppercase">General</div>
                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-gray-700">Lock Aspect Ratio</label>
                                    <input type="checkbox" className="accent-primary" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-gray-700">Visible</label>
                                    <input type="checkbox" defaultChecked className="accent-primary" />
                                </div>
                             </div>
                        ) : (
                            <div className="space-y-3">
                                <PropInput label="Playlist Duration (sec)" value={15} onChange={() => {}} />
                                <div className="flex items-center justify-between mt-2">
                                    <label className="text-sm text-gray-700">Loop Playlist</label>
                                    <input type="checkbox" defaultChecked className="accent-primary" />
                                </div>
                            </div>
                        )}
                   </Accordion>

                   {/* 3. Design */}
                   <Accordion title="Design" isOpen={openSections['props_design']} toggle={() => toggleSection('props_design')}>
                       {selectedElement ? (
                           <div className="space-y-4">
                               {/* Design Tabs */}
                               <div className="flex gap-1 bg-gray-100 p-1 rounded overflow-x-auto">
                                 <button onClick={() => setDesignTab('color')} className={`px-2 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap ${designTab === 'color' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}>Color</button>
                                 <button onClick={() => setDesignTab('text')} className={`px-2 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap ${designTab === 'text' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}>Text</button>
                                 <button onClick={() => setDesignTab('effects')} className={`px-2 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap ${designTab === 'effects' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}>Effects</button>
                                 {[ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.DIAMOND, ElementType.PENTAGON, ElementType.HEXAGON, ElementType.LINE].includes(selectedElement.type) && (
                                   <button onClick={() => setDesignTab('shapes')} className={`px-2 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap ${designTab === 'shapes' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}>Shape</button>
                                 )}
                               </div>

                               {/* Color Tab */}
                               {designTab === 'color' && (
                                 <div className="space-y-3">
                                   {selectedElement.type === ElementType.TEXT && (
                                     <div>
                                       <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Text Color</label>
                                       <div className="flex gap-2 items-center mb-2">
                                         <input 
                                           type="color" 
                                           value={selectedElement.color} 
                                           onChange={(e) => updateSelectedElement('color', e.target.value)}
                                           className="h-10 w-10 rounded cursor-pointer border-2 border-gray-300"
                                         />
                                         <span className="text-xs text-gray-600 flex-1">{selectedElement.color}</span>
                                       </div>
                                       <div className="flex gap-1 flex-wrap">
                                         {colorPalette.map(color => (
                                           <button key={color} onClick={() => updateSelectedElement('color', color)} className="w-6 h-6 rounded border-2 hover:border-primary" style={{backgroundColor: color, borderColor: selectedElement.color === color ? '#1B263B' : '#ccc'}}></button>
                                         ))}
                                       </div>
                                     </div>
                                   )}
                                   
                                   <div>
                                     <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Fill Color</label>
                                     <div className="flex gap-2 items-center mb-2">
                                       <input 
                                         type="color" 
                                         value={selectedElement.backgroundColor || '#ffffff'} 
                                         onChange={(e) => updateSelectedElement('backgroundColor', e.target.value)}
                                         className="h-10 w-10 rounded cursor-pointer border-2 border-gray-300"
                                       />
                                       <span className="text-xs text-gray-600 flex-1">{selectedElement.backgroundColor}</span>
                                     </div>
                                     <div className="flex gap-1 flex-wrap">
                                       {colorPalette.map(color => (
                                         <button key={color} onClick={() => updateSelectedElement('backgroundColor', color)} className="w-6 h-6 rounded border-2 hover:border-primary" style={{backgroundColor: color, borderColor: selectedElement.backgroundColor === color ? '#1B263B' : '#ccc'}}></button>
                                       ))}
                                     </div>
                                   </div>
                                 </div>
                               )}

                               {/* Text Tab */}
                               {designTab === 'text' && selectedElement.type === ElementType.TEXT && (
                                 <div className="space-y-3">
                                   <div>
                                     <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Text Content</label>
                                     <textarea 
                                       value={selectedElement.content} 
                                       onChange={(e) => updateSelectedElement('content', e.target.value)}
                                       className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                                       rows={3}
                                     />
                                   </div>
                                   
                                   <PropInput label="Font Size" value={selectedElement.fontSize || 24} onChange={(v) => updateSelectedElement('fontSize', Number(v))} />
                                   
                                   <div>
                                     <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Font Weight</label>
                                     <div className="flex gap-2">
                                       <button onClick={() => updateSelectedElement('textStyle', {...selectedElement.textStyle, bold: !selectedElement.textStyle?.bold})} className={`flex-1 px-2 py-2 rounded text-sm font-bold border-2 transition-colors ${selectedElement.textStyle?.bold ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}>B</button>
                                       <button onClick={() => updateSelectedElement('textStyle', {...selectedElement.textStyle, italic: !selectedElement.textStyle?.italic})} className={`flex-1 px-2 py-2 rounded text-sm italic border-2 transition-colors ${selectedElement.textStyle?.italic ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}>I</button>
                                       <button onClick={() => updateSelectedElement('textStyle', {...selectedElement.textStyle, underline: !selectedElement.textStyle?.underline})} className={`flex-1 px-2 py-2 rounded text-sm underline border-2 transition-colors ${selectedElement.textStyle?.underline ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}>U</button>
                                     </div>
                                   </div>

                                   <div>
                                     <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Alignment</label>
                                     <div className="flex gap-2">
                                       <button onClick={() => updateSelectedElement('textStyle', {...selectedElement.textStyle, textAlign: 'left'})} className={`flex-1 px-2 py-2 rounded text-sm border-2 transition-colors ${selectedElement.textStyle?.textAlign === 'left' ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}>Left</button>
                                       <button onClick={() => updateSelectedElement('textStyle', {...selectedElement.textStyle, textAlign: 'center'})} className={`flex-1 px-2 py-2 rounded text-sm border-2 transition-colors ${selectedElement.textStyle?.textAlign === 'center' ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}>Center</button>
                                       <button onClick={() => updateSelectedElement('textStyle', {...selectedElement.textStyle, textAlign: 'right'})} className={`flex-1 px-2 py-2 rounded text-sm border-2 transition-colors ${selectedElement.textStyle?.textAlign === 'right' ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}>Right</button>
                                     </div>
                                   </div>
                                 </div>
                               )}

                               {/* Effects Tab */}
                               {designTab === 'effects' && (
                                 <div className="space-y-3">
                                   <div>
                                     <div className="flex justify-between mb-1">
                                       <label className="text-xs font-semibold text-gray-500 uppercase">Opacity</label>
                                       <span className="text-xs text-gray-500">{Math.round((selectedElement.opacity || 1) * 100)}%</span>
                                     </div>
                                     <input 
                                       type="range" min="0" max="1" step="0.01" 
                                       value={selectedElement.opacity || 1} 
                                       onChange={(e) => updateSelectedElement('opacity', Number(e.target.value))}
                                       className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary"
                                     />
                                   </div>

                                   <div>
                                     <div className="flex justify-between mb-1">
                                       <label className="text-xs font-semibold text-gray-500 uppercase">Rotation</label>
                                       <span className="text-xs text-gray-500">{Math.round(selectedElement.rotation || 0)}°</span>
                                     </div>
                                     <input 
                                       type="range" min="0" max="360" step="1" 
                                       value={selectedElement.rotation || 0} 
                                       onChange={(e) => updateSelectedElement('rotation', Number(e.target.value))}
                                       className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary"
                                     />
                                   </div>

                                   {([ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.DIAMOND, ElementType.PENTAGON, ElementType.HEXAGON, ElementType.LINE].includes(selectedElement.type) || selectedElement.type === ElementType.IMAGE) && (
                                     <>
                                       <div>
                                         <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Stroke Width</label>
                                         <PropInput label="Pixels" value={selectedElement.strokeWidth || 0} onChange={(v) => updateSelectedElement('strokeWidth', Number(v))} />
                                       </div>
                                       {selectedElement.strokeWidth && selectedElement.strokeWidth > 0 && (
                                         <div>
                                           <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Stroke Color</label>
                                           <div className="flex gap-2 items-center">
                                             <input 
                                               type="color" 
                                               value={selectedElement.strokeColor || '#000000'} 
                                               onChange={(e) => updateSelectedElement('strokeColor', e.target.value)}
                                               className="h-8 w-8 rounded cursor-pointer border-2 border-gray-300"
                                             />
                                             <span className="text-xs text-gray-600">{selectedElement.strokeColor}</span>
                                           </div>
                                         </div>
                                       )}
                                       <div>
                                         <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Border Radius</label>
                                         <PropInput label="Pixels" value={selectedElement.borderRadius || 0} onChange={(v) => updateSelectedElement('borderRadius', Number(v))} />
                                       </div>
                                     </>
                                   )}
                                 </div>
                               )}

                               {/* Shape Editor Tab */}
                               {designTab === 'shapes' && [ElementType.RECT, ElementType.CIRCLE, ElementType.TRIANGLE, ElementType.STAR, ElementType.HEART, ElementType.DIAMOND, ElementType.PENTAGON, ElementType.HEXAGON, ElementType.LINE].includes(selectedElement.type) && (
                                 <ShapeEditor
                                   shapeType={selectedElement.type}
                                   color={selectedElement.color || '#000000'}
                                   backgroundColor={selectedElement.fillColor || '#1B263B'}
                                   strokeColor={selectedElement.strokeColor || '#000000'}
                                   strokeWidth={selectedElement.strokeWidth || 0}
                                   borderRadius={selectedElement.borderRadius || 0}
                                   onShapeChange={(type) => updateSelectedElement('type', type as ElementType)}
                                   onColorChange={(color) => updateSelectedElement('color', color)}
                                   onBackgroundChange={(color) => updateSelectedElement('fillColor', color)}
                                   onStrokeColorChange={(color) => updateSelectedElement('strokeColor', color)}
                                   onStrokeWidthChange={(width) => updateSelectedElement('strokeWidth', width)}
                                   onBorderRadiusChange={(radius) => updateSelectedElement('borderRadius', radius)}
                                 />
                               )}

                               <div className="flex gap-2 pt-2 border-t border-gray-200">
                                 <button 
                                   onClick={bringToFront}
                                   className="flex-1 px-3 py-2 text-xs font-semibold bg-primary text-white rounded hover:bg-primaryLight transition-colors"
                                 >
                                   Front
                                 </button>
                                 <button 
                                   onClick={sendToBack}
                                   className="flex-1 px-3 py-2 text-xs font-semibold bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                                 >
                                   Back
                                 </button>
                                 <button 
                                   onClick={duplicateSelected}
                                   className="flex-1 px-3 py-2 text-xs font-semibold bg-vanilla text-primary rounded hover:bg-vanilla/80 transition-colors"
                                 >
                                   Duplicate
                                 </button>
                               </div>
                           </div>
                       ) : (
                           <div className="space-y-4">
                               <div className="p-3 bg-white rounded border border-gray-200 shadow-sm">
                                   <div className="text-xs text-gray-500 uppercase mb-3 font-semibold">Upload Media</div>
                                   <MediaUploader
                                     userId={user?.id || 'anonymous'}
                                     onMediaUploaded={handleMediaUploaded}
                                     maxFileSize={50}
                                   />
                               </div>
                               <div className="p-3 bg-white rounded border border-gray-200 shadow-sm">
                                   <div className="text-xs text-gray-500 uppercase mb-2 font-semibold">Canvas Background</div>
                                   <div className="flex items-center gap-2">
                                       <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 shadow-sm"></div>
                                       <span className="text-sm text-gray-700">Solid White</span>
                                   </div>
                               </div>
                           </div>
                       )}
                   </Accordion>

                   {/* 5. Preview */}
                   <div 
                        className="border-b border-gray-200 bg-ivory"
                   >
                       <button className="w-full flex items-center justify-between p-3 bg-ivory hover:bg-white transition-colors">
                            <span className="text-sm font-semibold text-primary">Preview</span>
                            <ChevronRight size={14} className="text-primary" />
                       </button>
                   </div>

                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Subcomponents ---

const ToolbarBtn: React.FC<{ icon: React.ReactNode, tooltip?: string, onClick?: () => void }> = ({ icon, tooltip, onClick }) => (
  <button 
    onClick={onClick} 
    title={tooltip} 
    className="p-1.5 text-gray-200 hover:text-white hover:bg-white/10 rounded transition-all duration-200"
  >
    {icon}
  </button>
);

const Accordion: React.FC<{ title: string, isOpen: boolean, toggle: () => void, children: React.ReactNode }> = ({ title, isOpen, toggle, children }) => (
  <div className="border-b border-gray-200 bg-ivory">
    <button 
      onClick={toggle}
      className="w-full flex items-center justify-between p-3 bg-ivory hover:bg-white transition-colors"
    >
      <span className="text-sm font-semibold text-primary">{title}</span>
      {isOpen ? <ChevronDown size={14} className="text-primary" /> : <ChevronRight size={14} className="text-primary" />}
    </button>
    {isOpen && (
      <div className="p-4 bg-white/50 border-t border-gray-100">
        {children}
      </div>
    )}
  </div>
);

const PropInput: React.FC<{ label: string, value: string | number, onChange: (val: string | number) => void }> = ({ label, value, onChange }) => (
    <div>
        <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider block mb-1">{label}</label>
        <input 
            type="number" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
        />
    </div>
);

export default Editor;