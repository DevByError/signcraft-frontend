/**
 * Canvas Export Service
 * Handles serialization of canvas designs to JSON format with strict type validation
 * Compatible with: Konva.js, Fabric.js, HTML5 Canvas, Flutter
 */

export interface TextStyleData {
  bold: boolean; // Required
  italic: boolean; // Required
  underline: boolean; // Required
  textAlign: 'left' | 'center' | 'right' | 'justify'; // Required
  fontFamily: string; // Required, e.g., 'Arial', 'Times New Roman'
  letterSpacing: number; // In pixels, required
  lineHeight: number; // Multiplier or in pixels, required
}

export interface ShadowData {
  offsetX: number; // In pixels
  offsetY: number; // In pixels
  blur: number; // In pixels
  color: string; // Hex format (#RRGGBBAA)
  opacity: number; // 0-1
}

export interface CanvasElementData {
  id: string; // UUID
  type: string; // Must match ElementType enum
  content: string; // Text or image URL (may be empty)
  
  // Position & Size (pixels)
  x: number; // Exact position
  y: number; // Exact position
  width: number; // > 0
  height: number; // > 0
  radius?: number; // For circles
  
  // Appearance (precise values)
  opacity: number; // 0-1, required
  rotation: number; // 0-360 degrees, required
  zIndex: number; // Integer for layer ordering, required
  
  // Colors (hex format)
  color?: string; // Text color #RRGGBB
  backgroundColor?: string; // #RRGGBB
  fillColor?: string; // Shape fill #RRGGBB
  strokeColor?: string; // Shape stroke #RRGGBB
  strokeWidth?: number; // Pixels
  borderRadius?: number; // Pixels
  
  // Text styling
  fontSize?: number; // Pixels
  textStyle?: TextStyleData;
  
  // Widget-specific settings
  widgetSettings?: any; // Widget configuration object
  
  // Animation
  animation?: string; // Animation name
  
  // Effects
  shadow?: ShadowData;
  
  // State flags
  visible: boolean; // Required
  locked: boolean; // Required
}

export interface DesignMetadataData {
  title: string; // Required, non-empty
  description: string; // May be empty
  canvasWidth: number; // Pixels, > 0, required
  canvasHeight: number; // Pixels, > 0, required
  canvasColor: string; // Hex format (#RRGGBB), required
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  createdBy: string; // User ID/email
  tags: string[]; // Array of tags
  version: number; // Schema version
}

export interface ExportedDesignData {
  metadata: DesignMetadataData;
  designJSON: {
    elements: CanvasElementData[];
    totalElements: number; // Must match elements.length
    version: string; // Semantic versioning
  };
}

/**
 * Validates hex color format
 * @param color - Color string to validate
 * @returns true if valid hex color
 */
export const isValidHexColor = (color: string): boolean => {
  if (!color || typeof color !== 'string') return false;
  // Allow #RGB, #RRGGBB, #RRGGBBAA formats
  return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(color);
};

/**
 * Normalizes color to #RRGGBB or #RRGGBBAA format
 * @param color - Color in any format
 * @returns Normalized hex color or default white
 */
const normalizeColor = (color: any): string => {
  if (!color) return '#FFFFFF';
  
  const colorStr = String(color).trim();
  
  // Already valid hex format
  if (isValidHexColor(colorStr)) {
    // Expand #RGB to #RRGGBB
    if (colorStr.length === 4) {
      return '#' + colorStr[1] + colorStr[1] + colorStr[2] + colorStr[2] + colorStr[3] + colorStr[3];
    }
    return colorStr;
  }
  
  // Handle rgb/rgba formats: rgb(255, 0, 0) or rgba(255, 0, 0, 1)
  const rgbMatch = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    const a = rgbMatch[4] ? Math.round(parseFloat(rgbMatch[4]) * 255).toString(16).padStart(2, '0') : 'FF';
    return `#${r}${g}${b}${a}`.toUpperCase();
  }
  
  // Handle named colors (basic set)
  const namedColors: { [key: string]: string } = {
    'white': '#FFFFFF',
    'black': '#000000',
    'red': '#FF0000',
    'green': '#008000',
    'blue': '#0000FF',
    'yellow': '#FFFF00',
    'cyan': '#00FFFF',
    'magenta': '#FF00FF',
    'gray': '#808080',
    'grey': '#808080',
    'transparent': '#00000000',
  };
  
  const lowerColor = colorStr.toLowerCase();
  if (namedColors[lowerColor]) {
    return namedColors[lowerColor];
  }
  
  // Default to white if unable to parse
  return '#FFFFFF';
};

/**
 * Normalizes position and size values to exact numbers
 * @param value - Number value to normalize
 * @returns Normalized number (2 decimal places max)
 */
const normalizeNumericValue = (value: number): number => {
  return Math.round(value * 100) / 100;
};

/**
 * Validates a canvas element's structure and values
 * @param element - Element to validate
 * @returns Object with { isValid: boolean; errors: string[] }
 */
export const validateCanvasElement = (element: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields validation
  if (!element.id || typeof element.id !== 'string') errors.push('Element ID is required and must be string');
  if (!element.type || typeof element.type !== 'string') errors.push('Element type is required and must be string');
  
  // Numeric validations - check type but be lenient with values
  if (typeof element.x !== 'number') {
    if (element.x !== undefined) errors.push('Element X position must be a number');
  }
  if (typeof element.y !== 'number') {
    if (element.y !== undefined) errors.push('Element Y position must be a number');
  }
  if (typeof element.width !== 'number') {
    if (element.width !== undefined) errors.push('Element width must be a number');
  } else if (element.width !== undefined && element.width <= 0) {
    errors.push('Element width must be positive');
  }
  
  if (typeof element.height !== 'number') {
    if (element.height !== undefined) errors.push('Element height must be a number');
  } else if (element.height !== undefined && element.height <= 0) {
    errors.push('Element height must be positive');
  }
  
  // Opacity validation - must be 0-1
  if (element.opacity !== undefined) {
    if (typeof element.opacity !== 'number' || element.opacity < 0 || element.opacity > 1) {
      errors.push('Element opacity must be between 0 and 1');
    }
  }
  
  // Rotation validation - must be 0-360
  if (element.rotation !== undefined) {
    if (typeof element.rotation !== 'number' || element.rotation < 0 || element.rotation > 360) {
      errors.push('Element rotation must be between 0 and 360');
    }
  }
  
  // zIndex must be integer
  if (element.zIndex !== undefined && !Number.isInteger(element.zIndex)) {
    errors.push('Element zIndex must be integer');
  }
  
  // Boolean validations
  if (element.visible !== undefined && typeof element.visible !== 'boolean') {
    errors.push('Element visible must be boolean');
  }
  if (element.locked !== undefined && typeof element.locked !== 'boolean') {
    errors.push('Element locked must be boolean');
  }

  // Color validation is lenient - will normalize invalid colors instead of failing
  // This allows flexibility in color formats from different sources

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Serializes canvas elements to a strict JSON structure
 * Ensures all values are exact and Firestore-compatible
 * @param elements - Array of canvas elements
 * @param metadata - Design metadata
 * @returns Structured design object ready for Firestore storage
 */
export const serializeCanvasDesign = (
  elements: any[],
  metadata: any
): ExportedDesignData => {
  // Sort elements by zIndex for consistent layer ordering
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  // DEBUG: Log all elements before serialization

  // Strict serialization with exact values - capture ALL properties
  const cleanElements: CanvasElementData[] = sortedElements.map((el) => {
    // Ensure all properties are captured with defaults
    const textStyle = el.textStyle ? {
      bold: Boolean(el.textStyle.bold ?? false),
      italic: Boolean(el.textStyle.italic ?? false),
      underline: Boolean(el.textStyle.underline ?? false),
      textAlign: (el.textStyle.textAlign || 'left') as 'left' | 'center' | 'right' | 'justify',
      fontFamily: String(el.textStyle.fontFamily || 'Arial'),
      letterSpacing: normalizeNumericValue(el.textStyle.letterSpacing ?? 0),
      lineHeight: normalizeNumericValue(el.textStyle.lineHeight ?? 1.2),
    } : undefined;

    const shadow = el.shadow ? {
      offsetX: normalizeNumericValue(el.shadow.offsetX ?? 0),
      offsetY: normalizeNumericValue(el.shadow.offsetY ?? 0),
      blur: normalizeNumericValue(el.shadow.blur ?? 0),
      color: normalizeColor(el.shadow.color || '#000000FF'),
      opacity: normalizeNumericValue(el.shadow.opacity ?? 1),
    } : undefined;

    // Build element with ALL fields, even optional ones with default values
    const element: CanvasElementData = {
      // Required fields
      id: String(el.id || ''),
      type: String(el.type || 'RECT'),
      content: String(el.content || ''),
      x: normalizeNumericValue(el.x ?? 0),
      y: normalizeNumericValue(el.y ?? 0),
      width: normalizeNumericValue(el.width ?? 100),
      height: normalizeNumericValue(el.height ?? 100),
      opacity: normalizeNumericValue(el.opacity ?? 1),
      rotation: normalizeNumericValue(el.rotation ?? 0),
      zIndex: Number.isInteger(el.zIndex) ? el.zIndex : 0,
      visible: Boolean(el.visible ?? true),
      locked: Boolean(el.locked ?? false),
    };

    // Add optional radius (for circles)
    if (el.radius !== undefined && el.radius !== null) {
      element.radius = normalizeNumericValue(el.radius);
    }

    // Add color properties - always capture if they exist OR have values
    if (el.color !== undefined && el.color !== null && el.color !== '') {
      element.color = normalizeColor(el.color);
    }
    
    if (el.backgroundColor !== undefined && el.backgroundColor !== null && el.backgroundColor !== '') {
      element.backgroundColor = normalizeColor(el.backgroundColor);
    }
    
    if (el.fillColor !== undefined && el.fillColor !== null && el.fillColor !== '') {
      element.fillColor = normalizeColor(el.fillColor);
    }
    
    if (el.strokeColor !== undefined && el.strokeColor !== null && el.strokeColor !== '') {
      element.strokeColor = normalizeColor(el.strokeColor);
    }

    // Add stroke and border properties
    if (el.strokeWidth !== undefined && el.strokeWidth !== null) {
      element.strokeWidth = normalizeNumericValue(el.strokeWidth);
    }
    
    if (el.borderRadius !== undefined && el.borderRadius !== null) {
      element.borderRadius = normalizeNumericValue(el.borderRadius);
    }

    // Add font size for text elements
    if (el.fontSize !== undefined && el.fontSize !== null) {
      element.fontSize = Number(el.fontSize);
    }

    // Add text styling
    if (textStyle) {
      element.textStyle = textStyle;
    }

    // Add widget settings
    if (el.widgetSettings !== undefined && el.widgetSettings !== null) {
      element.widgetSettings = el.widgetSettings;
    }

    // Add animation
    if (el.animation !== undefined && el.animation !== null && el.animation !== '') {
      element.animation = String(el.animation);
    }

    // Add shadow effects
    if (shadow) {
      element.shadow = shadow;
    }

    // DEBUG: Log each serialized text element
    if (el.type === 'TEXT') {
    }

    return element;
  });

  // DEBUG: Log serialized elements

  const now = new Date().toISOString();

  return {
    metadata: {
      title: String(metadata.title || 'Untitled Design').trim() || 'Untitled Design',
      description: String(metadata.description || '').trim(),
      canvasWidth: Math.max(1, Number(metadata.canvasWidth) || 1920),
      canvasHeight: Math.max(1, Number(metadata.canvasHeight) || 1080),
      canvasColor: normalizeColor(metadata.canvasColor || '#FFFFFF'),
      createdAt: String(metadata.createdAt || now),
      updatedAt: now,
      createdBy: String(metadata.createdBy || 'system'),
      tags: Array.isArray(metadata.tags) ? metadata.tags.map(String).filter(tag => tag.length > 0) : [],
      version: 1,
    },
    designJSON: {
      elements: cleanElements,
      totalElements: cleanElements.length,
      version: '1.0.0',
    },
  };
};

/**
 * Comprehensive validation of the entire design structure
 * @param design - The exported design object
 * @returns Object with { isValid: boolean; errors: string[] }
 */
export const validateExportedDesign = (design: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate metadata
  if (!design.metadata) {
    errors.push('Missing metadata');
  } else {
    if (!design.metadata.title || design.metadata.title.trim() === '') {
      errors.push('Design title is required and non-empty');
    }
    if (!Number.isFinite(design.metadata.canvasWidth) || design.metadata.canvasWidth <= 0) {
      errors.push('Canvas width must be positive number');
    }
    if (!Number.isFinite(design.metadata.canvasHeight) || design.metadata.canvasHeight <= 0) {
      errors.push('Canvas height must be positive number');
    }
    if (!design.metadata.createdAt) {
      errors.push('Creation timestamp is required');
    }
    if (design.metadata.canvasColor && !isValidHexColor(design.metadata.canvasColor)) {
      errors.push('Canvas color must be valid hex format');
    }
  }

  // Validate designJSON
  if (!design.designJSON) {
    errors.push('Missing designJSON');
  } else {
    if (!Array.isArray(design.designJSON.elements)) {
      errors.push('Elements must be array');
    } else {
      design.designJSON.elements.forEach((el, idx) => {
        const validation = validateCanvasElement(el);
        if (!validation.isValid) {
          errors.push(`Element ${idx} (${el.id}): ${validation.errors.join('; ')}`);
        }
      });
    }
    if (design.designJSON.totalElements !== design.designJSON.elements.length) {
      errors.push('Element count mismatch');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Generates a lightweight preview object for design listings
 * @param design - The exported design
 * @returns Preview object with essential metadata
 */
export const generateDesignPreview = (design: ExportedDesignData) => {
  return {
    title: design.metadata.title,
    description: design.metadata.description,
    dimensions: {
      width: design.metadata.canvasWidth,
      height: design.metadata.canvasHeight,
      aspectRatio: (design.metadata.canvasWidth / design.metadata.canvasHeight).toFixed(2),
    },
    elementCount: design.designJSON.totalElements,
    createdAt: design.metadata.createdAt,
    updatedAt: design.metadata.updatedAt,
    createdBy: design.metadata.createdBy,
    canvasColor: design.metadata.canvasColor,
    tags: design.metadata.tags,
  };
};

/**
 * Exports design as downloadable JSON file
 * @param design - The exported design
 * @param filename - Output filename
 */
export const downloadDesignAsJSON = (design: ExportedDesignData, filename: string = 'design.json') => {
  const dataStr = JSON.stringify(design, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Imports and validates a previously exported design from JSON
 * @param jsonString - JSON string of the design
 * @returns { success: boolean; design?: ExportedDesignData; errors?: string[] }
 */
export const importDesignFromJSON = (jsonString: string): { success: boolean; design?: ExportedDesignData; errors?: string[] } => {
  try {
    const design = JSON.parse(jsonString);
    const validation = validateExportedDesign(design);
    
    if (validation.isValid) {
      return { success: true, design };
    } else {
      return { success: false, errors: validation.errors };
    }
  } catch (error: any) {
    return { success: false, errors: [`Failed to parse JSON: ${error.message}`] };
  }
};