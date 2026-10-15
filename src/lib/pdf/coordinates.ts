import { PdfCropBoundingBox, ViewportCropRect } from './types';

/**
 * Interface representing a PDF.js PageViewport with coordinate transformation methods.
 */
export interface TransformableViewport {
  width: number;
  height: number;
  convertToPdfPoint: (x: number, y: number) => number[] | [number, number];
  convertToViewportPoint: (x: number, y: number) => number[] | [number, number];
}

/**
 * Converts a visual crop rectangle (in viewport/canvas CSS pixels, with (0,0) at top-left)
 * into standard PDF user-space coordinates (where origin is at bottom-left, y increases upward)
 * using the PDF.js viewport transformation matrix.
 *
 * This handles any scale, zoom, rotation (0, 90, 180, 270), and non-zero page box offsets.
 */
export function viewportToPdfCrop(
  viewportRect: ViewportCropRect,
  viewport: TransformableViewport
): PdfCropBoundingBox {
  const { x, y, width, height } = viewportRect;

  if (width <= 0 || height <= 0) {
    throw new Error('Crop rectangle must have positive width and height.');
  }

  // Sample all 4 corners of the viewport selection rectangle
  const p1 = viewport.convertToPdfPoint(x, y);
  const p2 = viewport.convertToPdfPoint(x + width, y);
  const p3 = viewport.convertToPdfPoint(x, y + height);
  const p4 = viewport.convertToPdfPoint(x + width, y + height);

  const xs = [p1[0], p2[0], p3[0], p4[0]];
  const ys = [p1[1], p2[1], p3[1], p4[1]];

  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const bottom = Math.min(...ys);
  const top = Math.max(...ys);

  return {
    left: parseFloat(left.toFixed(2)),
    bottom: parseFloat(bottom.toFixed(2)),
    right: parseFloat(right.toFixed(2)),
    top: parseFloat(top.toFixed(2)),
  };
}

/**
 * Converts a stored PDF user-space crop bounding box back into viewport/canvas pixels.
 * Useful when zooming or resizing the canvas so the visual crop box stays attached
 * to the exact same physical region on the document page.
 */
export function pdfCropToViewport(
  pdfCrop: PdfCropBoundingBox,
  viewport: TransformableViewport
): ViewportCropRect {
  const { left, bottom, right, top } = pdfCrop;

  const p1 = viewport.convertToViewportPoint(left, bottom);
  const p2 = viewport.convertToViewportPoint(left, top);
  const p3 = viewport.convertToViewportPoint(right, bottom);
  const p4 = viewport.convertToViewportPoint(right, top);

  const xs = [p1[0], p2[0], p3[0], p4[0]];
  const ys = [p1[1], p2[1], p3[1], p4[1]];

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: Math.max(0, parseFloat(minX.toFixed(1))),
    y: Math.max(0, parseFloat(minY.toFixed(1))),
    width: Math.min(viewport.width, parseFloat((maxX - minX).toFixed(1))),
    height: Math.min(viewport.height, parseFloat((maxY - minY).toFixed(1))),
  };
}

/**
 * Validates that a PDF crop bounding box has positive dimensions and valid bounds.
 */
export function validateCropBoundingBox(
  crop: PdfCropBoundingBox,
  pageBounds?: { width: number; height: number }
): { isValid: boolean; error?: string } {
  const width = crop.right - crop.left;
  const height = crop.top - crop.bottom;

  if (width <= 0) {
    return { isValid: false, error: 'Crop region width must be greater than zero.' };
  }
  if (height <= 0) {
    return { isValid: false, error: 'Crop region height must be greater than zero.' };
  }

  // Minimum practical crop dimensions (e.g. 20 pt ≈ 7mm)
  if (width < 20 || height < 20) {
    return { isValid: false, error: 'Crop region is too small. Minimum dimension is 20 pt.' };
  }

  if (pageBounds) {
    if (crop.left < -50 || crop.bottom < -50 || crop.right > pageBounds.width + 50 || crop.top > pageBounds.height + 50) {
      return { isValid: false, error: 'Crop region extends significantly beyond page boundaries.' };
    }
  }

  return { isValid: true };
}

/**
 * Clamps a viewport selection rectangle so it stays strictly within the visual canvas boundary.
 */
export function clampViewportRect(
  rect: ViewportCropRect,
  canvasWidth: number,
  canvasHeight: number,
  minDimension: number = 30
): ViewportCropRect {
  let { x, y, width, height } = rect;

  // Enforce minimum dimension
  width = Math.max(minDimension, width);
  height = Math.max(minDimension, height);

  // Clamp width and height to canvas
  width = Math.min(width, canvasWidth);
  height = Math.min(height, canvasHeight);

  // Clamp position
  x = Math.max(0, Math.min(x, canvasWidth - width));
  y = Math.max(0, Math.min(y, canvasHeight - height));

  return { x, y, width, height };
}
