/**
 * Responsive Coordinate Utilities
 * Convert between pixel coordinates and normalized ratios (0-1)
 * Virtual canvas: 1000 × 500
 */

import {
  VIRTUAL_CANVAS,
  PixelCoordinates,
  NormalizedCoordinates,
  ResponsiveCanvasElement,
  ResponsiveStyle,
} from '../types-responsive';

/**
 * Convert pixel values to normalized ratios (0-1)
 * @param pixels - Value in pixels
 * @param isHeight - Whether this is a height value (use canvas height for normalization)
 * @returns Normalized ratio (0-1)
 */
export const pixelToNormalized = (
  pixels: number,
  isHeight: boolean = false
): number => {
  const reference = isHeight ? VIRTUAL_CANVAS.HEIGHT : VIRTUAL_CANVAS.WIDTH;
  const normalized = pixels / reference;
  // Clamp to 0-1 range
  return Math.max(0, Math.min(1, normalized));
};

/**
 * Convert normalized ratio (0-1) to pixel values
 * @param normalized - Ratio between 0-1
 * @param screenWidth - Actual screen width in pixels
 * @param screenHeight - Actual screen height in pixels (optional, auto-calculated if not provided)
 * @param isHeight - Whether this is a height value
 * @returns Pixel value for the given screen
 */
export const normalizedToPixels = (
  normalized: number,
  screenWidth: number,
  screenHeight?: number,
  isHeight: boolean = false
): number => {
  // If height not provided, calculate based on aspect ratio
  const height = screenHeight || screenWidth / 2; // 2:1 aspect ratio
  const reference = isHeight ? height : screenWidth;
  return normalized * reference;
};

/**
 * Normalize all position and size coordinates
 * @param coords - Pixel coordinates
 * @returns Normalized coordinates
 */
export const normalizeCoordinates = (
  coords: PixelCoordinates
): NormalizedCoordinates => {
  return {
    x: pixelToNormalized(coords.x, false),
    y: pixelToNormalized(coords.y, true),
    width: pixelToNormalized(coords.width, false),
    height: pixelToNormalized(coords.height, true),
  };
};

/**
 * Denormalize coordinates back to pixels
 * @param coords - Normalized coordinates
 * @param screenWidth - Actual screen width
 * @param screenHeight - Actual screen height (optional)
 * @returns Pixel coordinates
 */
export const denormalizeCoordinates = (
  coords: NormalizedCoordinates,
  screenWidth: number,
  screenHeight?: number
): PixelCoordinates => {
  const height = screenHeight || screenWidth / 2;
  return {
    x: normalizedToPixels(coords.x, screenWidth, height, false),
    y: normalizedToPixels(coords.y, screenWidth, height, true),
    width: normalizedToPixels(coords.width, screenWidth, height, false),
    height: normalizedToPixels(coords.height, screenWidth, height, true),
  };
};

/**
 * Normalize a canvas element's position and size
 * @param element - Element with pixel coordinates
 * @returns Element with normalized coordinates
 */
export const normalizeElement = (element: any): ResponsiveCanvasElement => {
  const normalized = normalizeCoordinates({
    x: element.x || 0,
    y: element.y || 0,
    width: element.width || 100,
    height: element.height || 100,
  });

  const style = normalizeStyle(element);

  return {
    id: String(element.id || ''),
    type: element.type || 'rectangle',
    x: normalized.x,
    y: normalized.y,
    width: normalized.width,
    height: normalized.height,
    rotation: Number(element.rotation || 0),
    zIndex: Number(element.zIndex || 0),
    opacity: Number(element.opacity ?? 1),
    style,
    content: element.content ? String(element.content) : undefined,
    visible: Boolean(element.visible ?? true),
    locked: Boolean(element.locked ?? false),
    createdAt: element.createdAt || new Date().toISOString(),
    updatedAt: element.updatedAt || new Date().toISOString(),
  };
};

/**
 * Normalize style properties
 * - Colors remain as hex
 * - Sizes become ratios (0-1)
 * - Absolute values (px) remain as numbers
 */
const normalizeStyle = (element: any): ResponsiveStyle => {
  const style: ResponsiveStyle = {};

  // Colors - keep as-is
  if (element.color) style.color = String(element.color);
  if (element.backgroundColor) style.backgroundColor = String(element.backgroundColor);
  if (element.fillColor) style.fillColor = String(element.fillColor);
  if (element.strokeColor) style.strokeColor = String(element.strokeColor);

  // Absolute pixel values
  if (element.strokeWidth !== undefined) style.strokeWidth = Number(element.strokeWidth);
  if (element.borderRadius !== undefined) style.borderRadius = Number(element.borderRadius);

  // Font sizing - normalize relative to canvas
  if (element.fontSize !== undefined) {
    // If fontSize is in pixels, normalize it
    if (typeof element.fontSize === 'number' && element.fontSize > 0) {
      // Assume default 24px font = 24/500 = 0.048 normalized
      style.fontSize = pixelToNormalized(element.fontSize, true);
    } else {
      style.fontSize = element.fontSize;
    }
  }

  // Font properties
  if (element.fontFamily) style.fontFamily = String(element.fontFamily);
  if (element.fontWeight !== undefined) style.fontWeight = Number(element.fontWeight);
  if (element.fontStyle) style.fontStyle = element.fontStyle;
  if (element.textAlign) style.textAlign = element.textAlign;
  if (element.lineHeight !== undefined) style.lineHeight = Number(element.lineHeight);

  // Letter spacing - normalize
  if (element.letterSpacing !== undefined) {
    style.letterSpacing = pixelToNormalized(element.letterSpacing, false);
  }

  // Text decoration
  if (element.textDecoration) style.textDecoration = element.textDecoration;

  // Shadow
  if (element.shadow) {
    style.shadow = {
      offsetX: pixelToNormalized(element.shadow.offsetX || 0, false),
      offsetY: pixelToNormalized(element.shadow.offsetY || 0, true),
      blur: pixelToNormalized(element.shadow.blur || 0, false),
      color: String(element.shadow.color || '#000000'),
      opacity: Number(element.shadow.opacity ?? 1),
    };
  }

  return style;
};

/**
 * Denormalize an element's coordinates back to pixels
 * @param element - Normalized element
 * @param screenWidth - Actual screen width
 * @param screenHeight - Actual screen height
 * @returns Element with pixel coordinates
 */
export const denormalizeElement = (
  element: ResponsiveCanvasElement,
  screenWidth: number,
  screenHeight: number
): any => {
  const pixelCoords = denormalizeCoordinates(
    { x: element.x, y: element.y, width: element.width, height: element.height },
    screenWidth,
    screenHeight
  );

  return {
    id: element.id,
    type: element.type,
    x: pixelCoords.x,
    y: pixelCoords.y,
    width: pixelCoords.width,
    height: pixelCoords.height,
    rotation: element.rotation,
    zIndex: element.zIndex,
    opacity: element.opacity,
    content: element.content,
    visible: element.visible,
    locked: element.locked,
    ...denormalizeStyle(element.style, screenWidth, screenHeight),
  };
};

/**
 * Denormalize style properties back to pixel values
 */
const denormalizeStyle = (
  style: ResponsiveStyle,
  screenWidth: number,
  screenHeight: number
): any => {
  const result: any = {};

  // Colors - keep as-is
  if (style.color) result.color = style.color;
  if (style.backgroundColor) result.backgroundColor = style.backgroundColor;
  if (style.fillColor) result.fillColor = style.fillColor;
  if (style.strokeColor) result.strokeColor = style.strokeColor;

  // Absolute pixel values - keep as-is
  if (style.strokeWidth) result.strokeWidth = style.strokeWidth;
  if (style.borderRadius) result.borderRadius = style.borderRadius;

  // Font sizing - denormalize
  if (style.fontSize !== undefined) {
    result.fontSize = normalizedToPixels(style.fontSize, screenWidth, screenHeight, true);
  }

  // Font properties
  if (style.fontFamily) result.fontFamily = style.fontFamily;
  if (style.fontWeight) result.fontWeight = style.fontWeight;
  if (style.fontStyle) result.fontStyle = style.fontStyle;
  if (style.textAlign) result.textAlign = style.textAlign;
  if (style.lineHeight) result.lineHeight = style.lineHeight;

  // Letter spacing - denormalize
  if (style.letterSpacing !== undefined) {
    result.letterSpacing = normalizedToPixels(style.letterSpacing, screenWidth, screenHeight, false);
  }

  // Text decoration
  if (style.textDecoration) result.textDecoration = style.textDecoration;

  // Shadow
  if (style.shadow) {
    result.shadow = {
      offsetX: normalizedToPixels(style.shadow.offsetX, screenWidth, screenHeight, false),
      offsetY: normalizedToPixels(style.shadow.offsetY, screenWidth, screenHeight, true),
      blur: normalizedToPixels(style.shadow.blur, screenWidth, screenHeight, false),
      color: style.shadow.color,
      opacity: style.shadow.opacity,
    };
  }

  return result;
};

/**
 * Ensure all values are clean (no undefined, proper types)
 * @param obj - Object to clean
 * @returns Cleaned object with only defined values
 */
export const cleanObject = (obj: any): any => {
  if (obj === null || obj === undefined) return undefined;

  if (Array.isArray(obj)) {
    return obj
      .map(item => cleanObject(item))
      .filter(item => item !== undefined);
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          const nestedCleaned = cleanObject(value);
          if (nestedCleaned !== undefined) {
            cleaned[key] = nestedCleaned;
          }
        } else {
          cleaned[key] = value;
        }
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }

  return obj;
};

/**
 * Calculate aspect ratio from canvas dimensions
 */
export const getAspectRatio = (): number => {
  return VIRTUAL_CANVAS.WIDTH / VIRTUAL_CANVAS.HEIGHT;
};

/**
 * Get the virtual canvas dimensions
 */
export const getVirtualCanvasDimensions = () => {
  return {
    width: VIRTUAL_CANVAS.WIDTH,
    height: VIRTUAL_CANVAS.HEIGHT,
  };
};

/**
 * Validate that coordinates are within 0-1 range
 */
export const areCoordinatesValid = (coords: NormalizedCoordinates): boolean => {
  return (
    coords.x >= 0 && coords.x <= 1 &&
    coords.y >= 0 && coords.y <= 1 &&
    coords.width > 0 && coords.width <= 1 &&
    coords.height > 0 && coords.height <= 1
  );
};
