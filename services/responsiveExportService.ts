/**
 * Responsive Design Export Service
 * Converts editor elements (pixel-based) to responsive normalized format
 * All coordinates stored as ratios (0-1) for universal Flutter rendering
 */

import {
  ResponsiveCanvasElement,
  ResponsiveDesignDocument,
  ResponsiveDesignMetadata,
  SaveDesignResponse,
  VIRTUAL_CANVAS,
} from '../types-responsive';
import {
  normalizeElement,
  cleanObject,
  getAspectRatio,
} from './responsiveCoordinateService';

/**
 * Serialize design to responsive format
 * @param elements - Array of canvas elements (pixel-based)
 * @param metadata - Design metadata
 * @returns Responsive design document ready for Firestore
 */
export const serializeToResponsiveFormat = (
  elements: any[],
  metadata: any
): ResponsiveDesignDocument => {
  // Sort elements by zIndex for consistent ordering
  const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  // Normalize all elements
  const normalizedElements: ResponsiveCanvasElement[] = sortedElements.map(el =>
    normalizeElement(el)
  );

  // Create responsive metadata
  const responsiveMetadata: ResponsiveDesignMetadata = {
    title: String(metadata.title || 'Untitled Design').trim() || 'Untitled Design',
    description: String(metadata.description || '').trim(),
    virtualCanvasWidth: VIRTUAL_CANVAS.WIDTH,
    virtualCanvasHeight: VIRTUAL_CANVAS.HEIGHT,
    aspectRatio: getAspectRatio(),
    backgroundColor: normalizeColor(metadata.backgroundColor || '#FFFFFF'),
    createdAt: metadata.createdAt || new Date().toISOString(),
    updatedAt: metadata.updatedAt || new Date().toISOString(),
    createdBy: metadata.createdBy || 'unknown',
    tags: Array.isArray(metadata.tags)
      ? metadata.tags.filter((t: string) => t && typeof t === 'string')
      : [],
    version: 2, // Responsive schema version
  };

  // Create responsive document
  const document: ResponsiveDesignDocument = {
    id: '',
    userId: '',
    userEmail: '',
    isPublic: false,
    metadata: responsiveMetadata,
    elements: normalizedElements,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0,
    likes: 0,
  };

  // Log for debugging
  console.log('📐 [RESPONSIVE EXPORT] Serialized to normalized format:', {
    title: document.metadata.title,
    elementCount: normalizedElements.length,
    aspectRatio: getAspectRatio(),
    virtualCanvas: `${VIRTUAL_CANVAS.WIDTH}x${VIRTUAL_CANVAS.HEIGHT}`,
    elements: normalizedElements.map(el => ({
      id: el.id,
      type: el.type,
      position: `(${(el.x * 100).toFixed(1)}%, ${(el.y * 100).toFixed(1)}%)`,
      size: `${(el.width * 100).toFixed(1)}% x ${(el.height * 100).toFixed(1)}%`,
    })),
  });

  return document;
};

/**
 * Normalize color to hex format
 */
const normalizeColor = (color: any): string => {
  if (!color) return '#FFFFFF';

  const colorStr = String(color).trim();

  // Already valid hex
  if (/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(colorStr)) {
    // Expand #RGB to #RRGGBB
    if (colorStr.length === 4) {
      return '#' + colorStr[1] + colorStr[1] + colorStr[2] + colorStr[2] + colorStr[3] + colorStr[3];
    }
    return colorStr;
  }

  // Handle rgb/rgba
  const rgbMatch = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    const a = rgbMatch[4] ? Math.round(parseFloat(rgbMatch[4]) * 255).toString(16).padStart(2, '0') : 'FF';
    return `#${r}${g}${b}${a}`.toUpperCase();
  }

  // Named colors
  const namedColors: { [key: string]: string } = {
    'white': '#FFFFFF', 'black': '#000000', 'red': '#FF0000',
    'green': '#008000', 'blue': '#0000FF', 'yellow': '#FFFF00',
    'cyan': '#00FFFF', 'magenta': '#FF00FF', 'gray': '#808080',
  };

  const lowerColor = colorStr.toLowerCase();
  return namedColors[lowerColor] || '#FFFFFF';
};

/**
 * Validate responsive design structure
 */
export const validateResponsiveDesign = (
  design: ResponsiveDesignDocument
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate metadata
  if (!design.metadata.title || design.metadata.title.length === 0) {
    errors.push('Design title is required');
  }

  if (design.metadata.virtualCanvasWidth !== VIRTUAL_CANVAS.WIDTH) {
    errors.push(`Virtual canvas width must be ${VIRTUAL_CANVAS.WIDTH}`);
  }

  if (design.metadata.virtualCanvasHeight !== VIRTUAL_CANVAS.HEIGHT) {
    errors.push(`Virtual canvas height must be ${VIRTUAL_CANVAS.HEIGHT}`);
  }

  if (design.metadata.version !== 2) {
    errors.push('Schema version must be 2 (responsive)');
  }

  // Validate elements
  for (let i = 0; i < design.elements.length; i++) {
    const el = design.elements[i];

    if (!el.id) errors.push(`Element ${i}: Missing required field 'id'`);
    if (!el.type) errors.push(`Element ${i}: Missing required field 'type'`);

    // Validate coordinates are in 0-1 range
    if (el.x < 0 || el.x > 1) errors.push(`Element ${i}: X position must be 0-1, got ${el.x}`);
    if (el.y < 0 || el.y > 1) errors.push(`Element ${i}: Y position must be 0-1, got ${el.y}`);
    if (el.width <= 0 || el.width > 1) errors.push(`Element ${i}: Width must be 0-1, got ${el.width}`);
    if (el.height <= 0 || el.height > 1) errors.push(`Element ${i}: Height must be 0-1, got ${el.height}`);

    // Validate numeric ranges
    if (el.opacity < 0 || el.opacity > 1) errors.push(`Element ${i}: Opacity must be 0-1`);
    if (el.rotation < 0 || el.rotation > 360) errors.push(`Element ${i}: Rotation must be 0-360`);

    // Validate colors in style
    if (el.style.color && !isValidColor(el.style.color)) {
      errors.push(`Element ${i}: Invalid color format for 'color'`);
    }
    if (el.style.backgroundColor && !isValidColor(el.style.backgroundColor)) {
      errors.push(`Element ${i}: Invalid color format for 'backgroundColor'`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate color format
 */
const isValidColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(color);
};

/**
 * Remove all undefined values from design (Firestore safety)
 */
export const cleanDesignForFirestore = (design: ResponsiveDesignDocument): ResponsiveDesignDocument => {
  // Clean metadata
  const cleanedMetadata = cleanObject(design.metadata) as ResponsiveDesignMetadata;

  // Clean elements
  const cleanedElements = design.elements.map(el => cleanObject(el) as ResponsiveCanvasElement);

  return {
    ...design,
    metadata: cleanedMetadata,
    elements: cleanedElements,
  };
};

/**
 * Generate design export info
 */
export const generateDesignExportInfo = (design: ResponsiveDesignDocument) => {
  return {
    title: design.metadata.title,
    virtualCanvasSize: `${design.metadata.virtualCanvasWidth}x${design.metadata.virtualCanvasHeight}`,
    aspectRatio: design.metadata.aspectRatio.toFixed(2),
    elementCount: design.elements.length,
    backgroundColor: design.metadata.backgroundColor,
    elements: design.elements.map(el => ({
      id: el.id,
      type: el.type,
      x: (el.x * 100).toFixed(1) + '%',
      y: (el.y * 100).toFixed(1) + '%',
      width: (el.width * 100).toFixed(1) + '%',
      height: (el.height * 100).toFixed(1) + '%',
      rotation: el.rotation + '°',
      zIndex: el.zIndex,
    })),
    timestamp: new Date().toISOString(),
  };
};
