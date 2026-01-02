/**
 * Alignment & Distribution Service
 * Provides alignment and distribution utilities for multiple canvas elements
 */

import { CanvasElement } from '../types/canvas';

export type AlignmentType = 
  | 'left' | 'center-x' | 'right'  // Horizontal
  | 'top' | 'center-y' | 'bottom'   // Vertical
  | 'distribute-x'                   // Horizontal distribution
  | 'distribute-y';                  // Vertical distribution

export interface BoundingBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Calculate bounding box for a single element
 */
export function getElementBoundingBox(element: CanvasElement): BoundingBox {
  return {
    left: element.x,
    right: element.x + element.width,
    top: element.y,
    bottom: element.y + element.height,
    width: element.width,
    height: element.height,
    centerX: element.x + element.width / 2,
    centerY: element.y + element.height / 2,
  };
}

/**
 * Calculate collective bounding box for multiple elements
 */
export function getCollectiveBoundingBox(elements: CanvasElement[]): BoundingBox {
  if (elements.length === 0) {
    return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }

  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;

  for (const el of elements) {
    left = Math.min(left, el.x);
    right = Math.max(right, el.x + el.width);
    top = Math.min(top, el.y);
    bottom = Math.max(bottom, el.y + el.height);
  }

  const width = right - left;
  const height = bottom - top;

  return {
    left,
    right,
    top,
    bottom,
    width,
    height,
    centerX: left + width / 2,
    centerY: top + height / 2,
  };
}

/**
 * Align elements horizontally
 */
export function alignHorizontally(
  elements: CanvasElement[],
  alignment: 'left' | 'center-x' | 'right'
): Partial<CanvasElement>[] {
  if (elements.length < 2) return [];

  const collective = getCollectiveBoundingBox(elements);
  const updates: Partial<CanvasElement>[] = [];

  for (const el of elements) {
    let newX: number;

    switch (alignment) {
      case 'left':
        newX = collective.left;
        break;
      case 'center-x':
        newX = collective.centerX - el.width / 2;
        break;
      case 'right':
        newX = collective.right - el.width;
        break;
    }

    updates.push({ id: el.id, x: newX });
  }

  return updates;
}

/**
 * Align elements vertically
 */
export function alignVertically(
  elements: CanvasElement[],
  alignment: 'top' | 'center-y' | 'bottom'
): Partial<CanvasElement>[] {
  if (elements.length < 2) return [];

  const collective = getCollectiveBoundingBox(elements);
  const updates: Partial<CanvasElement>[] = [];

  for (const el of elements) {
    let newY: number;

    switch (alignment) {
      case 'top':
        newY = collective.top;
        break;
      case 'center-y':
        newY = collective.centerY - el.height / 2;
        break;
      case 'bottom':
        newY = collective.bottom - el.height;
        break;
    }

    updates.push({ id: el.id, y: newY });
  }

  return updates;
}

/**
 * Distribute elements horizontally with equal spacing
 */
export function distributeHorizontally(elements: CanvasElement[]): Partial<CanvasElement>[] {
  if (elements.length < 3) return [];

  // Sort by x position
  const sorted = [...elements].sort((a, b) => a.x - b.x);
  const collective = getCollectiveBoundingBox(sorted);

  // Calculate total width used by elements
  const totalElementWidth = sorted.reduce((sum, el) => sum + el.width, 0);
  const totalSpacing = collective.width - totalElementWidth;
  const spacing = totalSpacing / (sorted.length - 1);

  const updates: Partial<CanvasElement>[] = [];
  let currentX = collective.left;

  for (const el of sorted) {
    updates.push({ id: el.id, x: currentX });
    currentX += el.width + spacing;
  }

  return updates;
}

/**
 * Distribute elements vertically with equal spacing
 */
export function distributeVertically(elements: CanvasElement[]): Partial<CanvasElement>[] {
  if (elements.length < 3) return [];

  // Sort by y position
  const sorted = [...elements].sort((a, b) => a.y - b.y);
  const collective = getCollectiveBoundingBox(sorted);

  // Calculate total height used by elements
  const totalElementHeight = sorted.reduce((sum, el) => sum + el.height, 0);
  const totalSpacing = collective.height - totalElementHeight;
  const spacing = totalSpacing / (sorted.length - 1);

  const updates: Partial<CanvasElement>[] = [];
  let currentY = collective.top;

  for (const el of sorted) {
    updates.push({ id: el.id, y: currentY });
    currentY += el.height + spacing;
  }

  return updates;
}

/**
 * Align to parent canvas (assuming canvas is the viewport)
 */
export function alignToCanvas(
  elements: CanvasElement[],
  canvasWidth: number,
  canvasHeight: number,
  alignment: AlignmentType
): Partial<CanvasElement>[] {
  if (elements.length === 0) return [];

  const updates: Partial<CanvasElement>[] = [];

  for (const el of elements) {
    let newX = el.x;
    let newY = el.y;

    switch (alignment) {
      case 'left':
        newX = 0;
        break;
      case 'center-x':
        newX = (canvasWidth - el.width) / 2;
        break;
      case 'right':
        newX = canvasWidth - el.width;
        break;
      case 'top':
        newY = 0;
        break;
      case 'center-y':
        newY = (canvasHeight - el.height) / 2;
        break;
      case 'bottom':
        newY = canvasHeight - el.height;
        break;
    }

    updates.push({ id: el.id, x: newX, y: newY });
  }

  return updates;
}

/**
 * Arrange elements in a grid pattern
 */
export function arrangeGrid(
  elements: CanvasElement[],
  columns: number,
  spacing: number = 10,
  startX: number = 0,
  startY: number = 0
): Partial<CanvasElement>[] {
  if (elements.length === 0) return [];

  // Sort by y then x to maintain reading order
  const sorted = [...elements].sort((a, b) => 
    a.y - b.y !== 0 ? a.y - b.y : a.x - b.x
  );

  // Calculate column width (use max width among elements)
  const maxWidth = Math.max(...sorted.map(el => el.width));
  const colWidth = maxWidth + spacing;

  const updates: Partial<CanvasElement>[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const el = sorted[i];
    const col = i % columns;
    const row = Math.floor(i / columns);

    updates.push({
      id: el.id,
      x: startX + col * colWidth,
      y: startY + row * (Math.max(...sorted.map(e => e.height)) + spacing),
    });
  }

  return updates;
}

/**
 * Stack elements vertically
 */
export function stackVertically(
  elements: CanvasElement[],
  spacing: number = 10,
  startX: number = 0,
  startY: number = 0
): Partial<CanvasElement>[] {
  if (elements.length === 0) return [];

  // Sort by y position
  const sorted = [...elements].sort((a, b) => a.y - b.y);

  const updates: Partial<CanvasElement>[] = [];
  let currentY = startY;
  let maxWidth = 0;

  for (const el of sorted) {
    updates.push({
      id: el.id,
      x: startX,
      y: currentY,
    });
    currentY += el.height + spacing;
    maxWidth = Math.max(maxWidth, el.width);
  }

  return updates;
}

/**
 * Stack elements horizontally
 */
export function stackHorizontally(
  elements: CanvasElement[],
  spacing: number = 10,
  startX: number = 0,
  startY: number = 0
): Partial<CanvasElement>[] {
  if (elements.length === 0) return [];

  // Sort by x position
  const sorted = [...elements].sort((a, b) => a.x - b.x);

  const updates: Partial<CanvasElement>[] = [];
  let currentX = startX;
  let maxHeight = 0;

  for (const el of sorted) {
    updates.push({
      id: el.id,
      x: currentX,
      y: startY,
    });
    currentX += el.width + spacing;
    maxHeight = Math.max(maxHeight, el.height);
  }

  return updates;
}

/**
 * Make elements the same size (width and/or height)
 */
export function makeSameSize(
  elements: CanvasElement[],
  dimension: 'width' | 'height' | 'both'
): Partial<CanvasElement>[] {
  if (elements.length < 2) return [];

  const updates: Partial<CanvasElement>[] = [];
  const collective = getCollectiveBoundingBox(elements);

  for (const el of elements) {
    const update: Partial<CanvasElement> = { id: el.id };

    switch (dimension) {
      case 'width':
        update.width = collective.width;
        break;
      case 'height':
        update.height = collective.height;
        break;
      case 'both':
        update.width = collective.width;
        update.height = collective.height;
        break;
    }

    updates.push(update);
  }

  return updates;
}

/**
 * Apply alignment updates to elements
 */
export function applyAlignmentUpdates(
  elements: CanvasElement[],
  updates: Partial<CanvasElement>[]
): CanvasElement[] {
  const updateMap = new Map(updates.map(u => [u.id, u]));

  return elements.map(el => {
    const update = updateMap.get(el.id);
    if (!update) return el;
    return { ...el, ...update };
  });
}
