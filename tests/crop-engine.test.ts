import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  calculateAspectFit,
  cropPdfDocument,
  THERMAL_4X6_WIDTH_PT,
  THERMAL_4X6_HEIGHT_PT,
} from '../src/lib/pdf/crop-pdf';
import { validateGeneratedPdf } from '../src/lib/pdf/validate-output';
import { PdfCropBoundingBox, CropRegionItem } from '../src/lib/pdf/types';

describe('PDF Vector Cropping & Thermal Export Engine', () => {
  const fixturePath = path.resolve(process.cwd(), 'tests/fixtures/synthetic-test-labels.pdf');
  const syntheticPdfBytes = new Uint8Array(fs.readFileSync(fixturePath));

  describe('calculateAspectFit', () => {
    it('should scale and center a portrait label uniformly within 4x6 inch thermal page', () => {
      // Source crop: 280 x 390 pt (aspect ratio ~0.718)
      // Target page: 288 x 432 pt (aspect ratio ~0.667)
      const fit = calculateAspectFit(280, 390, 288, 432, 0);

      assert.ok(fit.width <= 288);
      assert.ok(fit.height <= 432);
      assert.equal(fit.width, 288);
      // Centered vertically
      assert.equal(fit.x, 0);
      assert.ok(fit.y > 0);
    });

    it('should apply margins correctly', () => {
      const marginPt = 10;
      const fit = calculateAspectFit(200, 300, 288, 432, marginPt);

      assert.ok(fit.x >= marginPt);
      assert.ok(fit.y >= marginPt);
      assert.ok(fit.x + fit.width <= 288 - marginPt);
      assert.ok(fit.y + fit.height <= 432 - marginPt);
    });

    it('should preserve aspect ratio without non-uniform stretching', () => {
      const srcW = 100;
      const srcH = 200;
      const fit = calculateAspectFit(srcW, srcH, 288, 432, 0);

      const srcRatio = srcW / srcH;
      const fitRatio = fit.width / fit.height;
      assert.ok(Math.abs(srcRatio - fitRatio) < 0.01);
    });
  });

  describe('cropPdfDocument (Real Vector Embedding & Multi-Region Support)', () => {
    const validCropBox: PdfCropBoundingBox = {
      left: 40,
      bottom: 371.89,
      right: 320,
      top: 761.89,
    };

    it('should generate a valid 4x6" thermal PDF containing all pages (manual mode)', async () => {
      const outputBytes = await cropPdfDocument(syntheticPdfBytes, {
        targetFormat: 'thermal-4x6',
        marginMm: 0,
        targetDpi: 203,
        cropBox: validCropBox,
      });

      assert.ok(outputBytes instanceof Uint8Array);
      assert.ok(outputBytes.byteLength > 1000);

      const validation = await validateGeneratedPdf(outputBytes, 2, 'thermal-4x6');
      assert.equal(validation.isValid, true);
      assert.equal(validation.pageCount, 2);
      assert.equal(validation.actualWidthPt, THERMAL_4X6_WIDTH_PT);
      assert.equal(validation.actualHeightPt, THERMAL_4X6_HEIGHT_PT);
    });

    it('should support selective single-page processing in manual mode', async () => {
      const outputBytes = await cropPdfDocument(syntheticPdfBytes, {
        targetFormat: 'thermal-4x6',
        marginMm: 0,
        targetDpi: 203,
        cropBox: validCropBox,
        selectedPages: [1],
      });

      const validation = await validateGeneratedPdf(outputBytes, 1, 'thermal-4x6');
      assert.equal(validation.isValid, true);
      assert.equal(validation.pageCount, 1);
      assert.equal(validation.actualWidthPt, THERMAL_4X6_WIDTH_PT);
      assert.equal(validation.actualHeightPt, THERMAL_4X6_HEIGHT_PT);
    });

    it('should support multi-region cropping producing 1 output page per accepted crop region', async () => {
      // 2 regions on page 1 + 1 region on page 2 = 3 output pages
      const regions: CropRegionItem[] = [
        { pageNumber: 1, cropBox: { left: 40, bottom: 440, right: 320, top: 800 }, labelId: 'p1-l1' },
        { pageNumber: 1, cropBox: { left: 40, bottom: 50, right: 320, top: 410 }, labelId: 'p1-l2' },
        { pageNumber: 2, cropBox: { left: 40, bottom: 440, right: 320, top: 800 }, labelId: 'p2-l1' },
      ];

      const outputBytes = await cropPdfDocument(syntheticPdfBytes, {
        targetFormat: 'thermal-4x6',
        marginMm: 0,
        targetDpi: 203,
        cropRegions: regions,
      });

      const validation = await validateGeneratedPdf(outputBytes, 3, 'thermal-4x6');
      assert.equal(validation.isValid, true);
      assert.equal(validation.pageCount, 3);
      assert.equal(validation.actualWidthPt, THERMAL_4X6_WIDTH_PT);
      assert.equal(validation.actualHeightPt, THERMAL_4X6_HEIGHT_PT);
    });

    it('should exclude rejected candidates when filtering cropRegions', async () => {
      // Simulating user rejecting label 2: only accepted label 1 is passed
      const acceptedRegions: CropRegionItem[] = [
        { pageNumber: 1, cropBox: { left: 40, bottom: 440, right: 320, top: 800 }, labelId: 'p1-l1' },
      ];

      const outputBytes = await cropPdfDocument(syntheticPdfBytes, {
        targetFormat: 'thermal-4x6',
        marginMm: 0,
        targetDpi: 203,
        cropRegions: acceptedRegions,
      });

      const validation = await validateGeneratedPdf(outputBytes, 1, 'thermal-4x6');
      assert.equal(validation.isValid, true);
      assert.equal(validation.pageCount, 1);
    });

    it('should reject invalid crop bounding boxes before processing', async () => {
      const invalidCrop: PdfCropBoundingBox = {
        left: 300,
        bottom: 100,
        right: 200, // right < left
        top: 200,
      };

      await assert.rejects(
        async () => {
          await cropPdfDocument(syntheticPdfBytes, {
            targetFormat: 'thermal-4x6',
            marginMm: 0,
            targetDpi: 203,
            cropBox: invalidCrop,
          });
        },
        /width must be greater than zero/i
      );
    });

    it('should support landscape crop orientation by adjusting target dimensions', async () => {
      const landscapeCrop: PdfCropBoundingBox = {
        left: 50,
        bottom: 200,
        right: 450,
        top: 400,
      };

      const outputBytes = await cropPdfDocument(syntheticPdfBytes, {
        targetFormat: 'thermal-4x6',
        marginMm: 0,
        targetDpi: 203,
        cropBox: landscapeCrop,
        selectedPages: [1],
      });

      const validation = await validateGeneratedPdf(outputBytes, 1, 'thermal-4x6');
      assert.equal(validation.isValid, true);
      assert.equal(validation.actualWidthPt, THERMAL_4X6_HEIGHT_PT);
      assert.equal(validation.actualHeightPt, THERMAL_4X6_WIDTH_PT);
    });
  });

  describe('validateGeneratedPdf', () => {
    it('should reject empty byte buffers', async () => {
      const empty = new Uint8Array(0);
      const res = await validateGeneratedPdf(empty);
      assert.equal(res.isValid, false);
      assert.match(res.error || '', /empty/i);
    });

    it('should reject corrupted or incomplete PDF headers', async () => {
      const corrupted = new Uint8Array(Buffer.from('NOT A PDF FILE DATA'));
      const res = await validateGeneratedPdf(corrupted);
      assert.equal(res.isValid, false);
      assert.match(res.error || '', /unexpectedly small|missing PDF signature/i);
    });

    it('should detect when page count does not meet minimum requirement', async () => {
      const outputBytes = await cropPdfDocument(syntheticPdfBytes, {
        targetFormat: 'thermal-4x6',
        marginMm: 0,
        targetDpi: 203,
        cropBox: { left: 40, bottom: 371.89, right: 320, top: 761.89 },
        selectedPages: [1],
      });

      const res = await validateGeneratedPdf(outputBytes, 5);
      assert.equal(res.isValid, false);
      assert.match(res.error || '', /expected at least 5/i);
    });

    it('should validate thermal-4x6 format conformance (both portrait 288x432 and landscape 432x288)', async () => {
      // Portrait thermal page (288x432)
      const portraitBytes = await cropPdfDocument(syntheticPdfBytes, {
        targetFormat: 'thermal-4x6',
        marginMm: 0,
        targetDpi: 203,
        cropBox: { left: 40, bottom: 371.89, right: 320, top: 761.89 },
        selectedPages: [1],
      });
      const pRes = await validateGeneratedPdf(portraitBytes, 1, 'thermal-4x6');
      assert.equal(pRes.isValid, true);

      // Landscape thermal page (432x288)
      const landscapeBytes = await cropPdfDocument(syntheticPdfBytes, {
        targetFormat: 'thermal-4x6',
        marginMm: 0,
        targetDpi: 203,
        cropBox: { left: 40, bottom: 200, right: 440, top: 400 }, // width 400 > height 200
        selectedPages: [1],
      });
      const lRes = await validateGeneratedPdf(landscapeBytes, 1, 'thermal-4x6');
      assert.equal(lRes.isValid, true);
    });
  });
});
