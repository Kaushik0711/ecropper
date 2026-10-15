import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  viewportToPdfCrop,
  pdfCropToViewport,
  validateCropBoundingBox,
  clampViewportRect,
  TransformableViewport,
} from '../src/lib/pdf/coordinates';
import { PdfCropBoundingBox, ViewportCropRect } from '../src/lib/pdf/types';

describe('PDF Coordinate Transformation & Crop Box Engine', () => {
  describe('validateCropBoundingBox', () => {
    it('should validate a normal positive crop rectangle', () => {
      const crop: PdfCropBoundingBox = {
        left: 40,
        bottom: 370,
        right: 320,
        top: 760,
      };
      const res = validateCropBoundingBox(crop);
      assert.equal(res.isValid, true);
      assert.equal(res.error, undefined);
    });

    it('should reject a crop box with zero or negative width', () => {
      const cropZeroW: PdfCropBoundingBox = {
        left: 100,
        bottom: 100,
        right: 100,
        top: 200,
      };
      const resZeroW = validateCropBoundingBox(cropZeroW);
      assert.equal(resZeroW.isValid, false);
      assert.match(resZeroW.error || '', /width must be greater than zero/i);

      const cropNegativeW: PdfCropBoundingBox = {
        left: 200,
        bottom: 100,
        right: 100,
        top: 200,
      };
      const resNegW = validateCropBoundingBox(cropNegativeW);
      assert.equal(resNegW.isValid, false);
    });

    it('should reject a crop box with zero or negative height', () => {
      const cropZeroH: PdfCropBoundingBox = {
        left: 100,
        bottom: 200,
        right: 200,
        top: 200,
      };
      const resZeroH = validateCropBoundingBox(cropZeroH);
      assert.equal(resZeroH.isValid, false);
      assert.match(resZeroH.error || '', /height must be greater than zero/i);
    });

    it('should reject sub-minimum practical crop sizes (< 20 pt)', () => {
      const tinyCrop: PdfCropBoundingBox = {
        left: 50,
        bottom: 50,
        right: 60, // 10pt width
        top: 100,
      };
      const res = validateCropBoundingBox(tinyCrop);
      assert.equal(res.isValid, false);
      assert.match(res.error || '', /too small/i);
    });

    it('should check against page bounds if provided', () => {
      const crop: PdfCropBoundingBox = {
        left: 10,
        bottom: 10,
        right: 500,
        top: 700,
      };
      const bounds = { width: 595.28, height: 841.89 };
      const res = validateCropBoundingBox(crop, bounds);
      assert.equal(res.isValid, true);

      const outOfBoundsCrop: PdfCropBoundingBox = {
        left: -100,
        bottom: 10,
        right: 500,
        top: 700,
      };
      const badRes = validateCropBoundingBox(outOfBoundsCrop, bounds);
      assert.equal(badRes.isValid, false);
      assert.match(badRes.error || '', /beyond page boundaries/i);
    });
  });

  describe('clampViewportRect', () => {
    const canvasW = 600;
    const canvasH = 800;

    it('should leave an in-bounds rectangle unchanged', () => {
      const rect: ViewportCropRect = { x: 50, y: 50, width: 200, height: 300 };
      const clamped = clampViewportRect(rect, canvasW, canvasH);
      assert.deepEqual(clamped, rect);
    });

    it('should enforce minimum dimension constraint', () => {
      const rect: ViewportCropRect = { x: 50, y: 50, width: 10, height: 15 };
      const clamped = clampViewportRect(rect, canvasW, canvasH, 30);
      assert.equal(clamped.width, 30);
      assert.equal(clamped.height, 30);
    });

    it('should clamp out-of-bounds positions back within canvas', () => {
      const rect: ViewportCropRect = { x: 550, y: 750, width: 200, height: 200 };
      const clamped = clampViewportRect(rect, canvasW, canvasH);
      assert.equal(clamped.x + clamped.width <= canvasW, true);
      assert.equal(clamped.y + clamped.height <= canvasH, true);
      assert.equal(clamped.x, 400);
      assert.equal(clamped.y, 600);
    });

    it('should clamp negative coordinates', () => {
      const rect: ViewportCropRect = { x: -50, y: -20, width: 100, height: 100 };
      const clamped = clampViewportRect(rect, canvasW, canvasH);
      assert.equal(clamped.x, 0);
      assert.equal(clamped.y, 0);
    });
  });

  describe('viewportToPdfCrop and pdfCropToViewport', () => {
    // Mock viewport for 595.28 x 841.89 pt page rendered at 1.0 scale (0 deg rotation)
    // In PDF: origin (0,0) at bottom-left, y up
    // In Viewport: origin (0,0) at top-left, y down
    const createMockViewport = (
      pageW: number = 595.28,
      pageH: number = 841.89,
      scale: number = 1.0,
      rotation: number = 0
    ): TransformableViewport => {
      const vpW = (rotation === 90 || rotation === 270 ? pageH : pageW) * scale;
      const vpH = (rotation === 90 || rotation === 270 ? pageW : pageH) * scale;

      return {
        width: vpW,
        height: vpH,
        convertToPdfPoint: (vx: number, vy: number): [number, number] => {
          if (rotation === 0) {
            // vx -> pdfX = vx / scale
            // vy -> pdfY = pageH - (vy / scale)
            return [vx / scale, pageH - vy / scale];
          } else if (rotation === 90) {
            // 90 deg clockwise
            return [vy / scale, vx / scale];
          } else if (rotation === 180) {
            return [pageW - vx / scale, vy / scale];
          } else {
            // 270 deg
            return [pageW - vy / scale, pageH - vx / scale];
          }
        },
        convertToViewportPoint: (px: number, py: number): [number, number] => {
          if (rotation === 0) {
            return [px * scale, (pageH - py) * scale];
          } else if (rotation === 90) {
            return [py * scale, px * scale];
          } else if (rotation === 180) {
            return [(pageW - px) * scale, py * scale];
          } else {
            return [(pageH - py) * scale, (pageW - px) * scale];
          }
        },
      };
    };

    it('should correctly convert viewport coordinates to PDF user space (0 deg)', () => {
      const vp = createMockViewport(595.28, 841.89, 1.0, 0);
      const visualRect: ViewportCropRect = {
        x: 40,
        y: 50, // 50 pt from top -> in PDF y = 841.89 - 50 = 791.89
        width: 280,
        height: 390, // bottom is 50 + 390 = 440 -> in PDF y = 841.89 - 440 = 401.89
      };

      const pdfCrop = viewportToPdfCrop(visualRect, vp);
      assert.equal(pdfCrop.left, 40);
      assert.equal(pdfCrop.right, 320);
      assert.equal(pdfCrop.top, 791.89);
      assert.equal(pdfCrop.bottom, 401.89);
    });

    it('should correctly round-trip between viewport and PDF space', () => {
      const vp = createMockViewport(595.28, 841.89, 1.25, 0);
      const originalRect: ViewportCropRect = {
        x: 100,
        y: 150,
        width: 300,
        height: 400,
      };

      const pdfCrop = viewportToPdfCrop(originalRect, vp);
      const roundTripRect = pdfCropToViewport(pdfCrop, vp);

      assert.ok(Math.abs(roundTripRect.x - originalRect.x) < 0.1);
      assert.ok(Math.abs(roundTripRect.y - originalRect.y) < 0.1);
      assert.ok(Math.abs(roundTripRect.width - originalRect.width) < 0.1);
      assert.ok(Math.abs(roundTripRect.height - originalRect.height) < 0.1);
    });

    it('should handle 90-degree rotated viewports correctly', () => {
      const vp90 = createMockViewport(595.28, 841.89, 1.0, 90);
      const visualRect: ViewportCropRect = {
        x: 50,
        y: 60,
        width: 200,
        height: 300,
      };

      const pdfCrop = viewportToPdfCrop(visualRect, vp90);
      assert.ok(pdfCrop.right > pdfCrop.left);
      assert.ok(pdfCrop.top > pdfCrop.bottom);

      const roundTrip = pdfCropToViewport(pdfCrop, vp90);
      assert.ok(Math.abs(roundTrip.x - visualRect.x) < 0.2);
      assert.ok(Math.abs(roundTrip.y - visualRect.y) < 0.2);
    });

    it('should reject non-positive viewport rects in viewportToPdfCrop', () => {
      const vp = createMockViewport();
      assert.throws(() => {
        viewportToPdfCrop({ x: 10, y: 10, width: 0, height: 100 }, vp);
      }, /positive width and height/i);

      assert.throws(() => {
        viewportToPdfCrop({ x: 10, y: 10, width: 100, height: -50 }, vp);
      }, /positive width and height/i);
    });
  });
});
