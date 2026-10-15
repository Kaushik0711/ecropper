import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

import {
  extractPageTextLayout,
  computeBoundingBox,
  findTextMatches,
  clusterItemsByVerticalGap,
} from '../src/lib/marketplaces/text-layout';
import {
  calculateIoU,
  padAndClampBoundingBox,
  validateCandidateGeometry,
  filterAndScoreCandidates,
} from '../src/lib/marketplaces/detection-validation';
import { meeshoAdapter } from '../src/lib/marketplaces/meesho';
import { detectShippingLabels } from '../src/lib/marketplaces/detection-engine';
import {
  getMarketplaceAdapter,
  isAutomaticDetectionSupported,
  isMarketplaceVerified,
} from '../src/lib/marketplaces/registry';
import { DetectedLabel, TextItemInfo } from '../src/lib/marketplaces/types';

describe('Marketplace Shipping Label Detection Engine (Phase 2)', () => {
  const meeshoFixturePath = path.resolve(process.cwd(), 'tests/fixtures/synthetic-meesho-manifest.pdf');
  const twoUpFixturePath = path.resolve(process.cwd(), 'tests/fixtures/synthetic-2up-manifest.pdf');
  const scannedFixturePath = path.resolve(process.cwd(), 'tests/fixtures/synthetic-scanned-manifest.pdf');

  describe('Registry & Adapter Configuration', () => {
    it('should register Meesho adapter as unverified prototype', () => {
      const adapter = getMarketplaceAdapter('meesho');
      assert.ok(adapter);
      assert.equal(adapter.id, 'meesho');
      assert.equal(adapter.name, 'Meesho');
      assert.equal(adapter.isVerified, false); // Explicitly unverified until live seller samples tested
      assert.equal(isMarketplaceVerified('meesho'), false);
      assert.equal(isAutomaticDetectionSupported('meesho'), true);
      assert.ok(adapter.knownLimitations.length > 0);
    });

    it('should route uncalibrated marketplaces to manual-only fallback', () => {
      const flipkartAdapter = getMarketplaceAdapter('flipkart');
      assert.ok(flipkartAdapter);
      assert.equal(flipkartAdapter.isVerified, false);
      assert.equal(isAutomaticDetectionSupported('flipkart'), false);

      const amazonAdapter = getMarketplaceAdapter('amazon');
      assert.ok(amazonAdapter);
      assert.equal(isAutomaticDetectionSupported('amazon'), false);
    });
  });

  describe('Text Layout & Geometric Analysis', () => {
    it('should compute bounding box enclosing all text items', () => {
      const items: TextItemInfo[] = [
        { text: 'A', x: 50, y: 100, width: 20, height: 10, right: 70, top: 110 },
        { text: 'B', x: 80, y: 150, width: 30, height: 12, right: 110, top: 162 },
        { text: 'C', x: 40, y: 80, width: 10, height: 8, right: 50, top: 88 },
      ];

      const box = computeBoundingBox(items);
      assert.ok(box);
      assert.equal(box.left, 40);
      assert.equal(box.bottom, 80);
      assert.equal(box.right, 110);
      assert.equal(box.top, 162);
    });

    it('should return null bounding box for empty array', () => {
      assert.equal(computeBoundingBox([]), null);
    });

    it('should find regex pattern matches', () => {
      const items: TextItemInfo[] = [
        { text: 'AWB: 98402910481', x: 10, y: 10, width: 50, height: 10, right: 60, top: 20 },
        { text: 'Customer Address', x: 10, y: 30, width: 50, height: 10, right: 60, top: 40 },
        { text: 'DELIVERY COURIER', x: 10, y: 50, width: 50, height: 10, right: 60, top: 60 },
      ];

      const awbMatches = findTextMatches(items, /awb/i);
      assert.equal(awbMatches.length, 1);
      assert.equal(awbMatches[0].text, 'AWB: 98402910481');

      const courierMatches = findTextMatches(items, /courier/i);
      assert.equal(courierMatches.length, 1);
    });

    it('should cluster text items separated by vertical gaps', () => {
      // 2 blocks with a 100pt gap in between
      const items: TextItemInfo[] = [
        { text: 'Top 1', x: 10, y: 700, width: 50, height: 10, right: 60, top: 710 },
        { text: 'Top 2', x: 10, y: 680, width: 50, height: 10, right: 60, top: 690 },
        // gap > 35pt
        { text: 'Bottom 1', x: 10, y: 300, width: 50, height: 10, right: 60, top: 310 },
        { text: 'Bottom 2', x: 10, y: 280, width: 50, height: 10, right: 60, top: 290 },
      ];

      const clusters = clusterItemsByVerticalGap(items, 35);
      assert.equal(clusters.length, 2);
      assert.equal(clusters[0].length, 2);
      assert.equal(clusters[1].length, 2);
    });
  });

  describe('Validation & Deduplication Logic', () => {
    it('should calculate accurate IoU between two bounding boxes', () => {
      const a = { left: 0, bottom: 0, right: 100, top: 100 }; // area = 10000
      const b = { left: 50, bottom: 0, right: 150, top: 100 }; // area = 10000, inter = 50x100 = 5000
      // union = 10000 + 10000 - 5000 = 15000 -> IoU = 5000/15000 = 1/3 ~ 0.333
      const iou = calculateIoU(a, b);
      assert.ok(Math.abs(iou - 0.333) < 0.01);

      // Disjoint boxes
      const c = { left: 200, bottom: 200, right: 300, top: 300 };
      assert.equal(calculateIoU(a, c), 0);

      // Identical boxes
      assert.equal(calculateIoU(a, a), 1.0);
    });

    it('should pad and clamp bounding boxes strictly within page', () => {
      const box = { left: 5, bottom: 10, right: 590, top: 835 };
      const padded = padAndClampBoundingBox(box, 15, 595.28, 841.89);

      assert.equal(padded.left, 0); // clamped to 0
      assert.equal(padded.bottom, 0); // clamped to 0
      assert.equal(padded.right, 595.28); // clamped to page width
      assert.equal(padded.top, 841.89); // clamped to page height
    });

    it('should reject invalid or undersized candidate geometry', () => {
      const zeroW = { left: 100, bottom: 100, right: 100, top: 200 };
      assert.equal(validateCandidateGeometry(zeroW, 595, 842).isValid, false);

      const tiny = { left: 100, bottom: 100, right: 120, top: 120 }; // 20x20 pt
      assert.equal(validateCandidateGeometry(tiny, 595, 842).isValid, false);

      const normal = { left: 40, bottom: 440, right: 320, top: 800 }; // 280x360 pt
      assert.equal(validateCandidateGeometry(normal, 595, 842).isValid, true);
    });

    it('should deduplicate candidates with heavy overlap and warn on partial overlap', () => {
      const c1: DetectedLabel = {
        id: 'c1',
        pageNumber: 1,
        bounds: { left: 40, bottom: 440, right: 320, top: 800 },
        confidence: 0.9,
        method: 'marketplace-rules',
        status: 'accepted',
        reasons: [],
        warnings: [],
        labelIndex: 1,
      };

      // Almost identical to c1 (IoU > 0.85)
      const c2Duplicate: DetectedLabel = {
        id: 'c2',
        pageNumber: 1,
        bounds: { left: 42, bottom: 442, right: 318, top: 798 },
        confidence: 0.7,
        method: 'marketplace-rules',
        status: 'suggested',
        reasons: [],
        warnings: [],
        labelIndex: 2,
      };

      const filtered = filterAndScoreCandidates([c1, c2Duplicate], 595, 842);
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].id, 'c1');
    });
  });

  describe('Meesho Manifest Detection (synthetic-meesho-manifest.pdf)', () => {
    it('should detect Meesho shipping label and exclude invoice section', async () => {
      const bytes = new Uint8Array(fs.readFileSync(meeshoFixturePath));
      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const doc = await loadingTask.promise;

      const page1 = await doc.getPage(1);
      const layout = await extractPageTextLayout(page1, 1);
      assert.equal(layout.hasTextLayer, true);
      assert.ok(layout.textItems.length > 5);

      const candidates = await meeshoAdapter.detectLabels(layout);
      assert.equal(candidates.length, 1);

      const candidate = candidates[0];
      assert.equal(candidate.pageNumber, 1);
      assert.equal(candidate.status, 'accepted');
      assert.ok(candidate.confidence >= 0.70);
      assert.ok(candidate.reasons.some((r) => r.includes('Meesho')));
      assert.ok(candidate.reasons.some((r) => r.includes('AWB')));

      // In synthetic Meesho manifest, invoice is at y: 40..400, shipping label is at y: 440..800
      // Verify candidate bottom is above the invoice (bottom >= 420 pt)
      assert.ok(candidate.bounds.bottom >= 420);
      assert.ok(candidate.bounds.top <= 841.89);
    });

    it('should process multi-page Meesho document end-to-end via detectShippingLabels', async () => {
      const bytes = new Uint8Array(fs.readFileSync(meeshoFixturePath));
      const doc = await pdfjsLib.getDocument({ data: bytes }).promise;

      const result = await detectShippingLabels(doc, 'meesho');
      assert.equal(result.marketplaceId, 'meesho');
      assert.equal(result.automaticDetectionSupported, true);
      assert.equal(result.isVerified, false);
      assert.equal(result.totalPagesAnalyzed, 2);
      assert.equal(result.detectedLabels.length, 2); // 1 per page

      // Page 1 candidate
      assert.equal(result.detectedLabels[0].pageNumber, 1);
      assert.equal(result.detectedLabels[0].status, 'accepted');

      // Page 2 candidate
      assert.equal(result.detectedLabels[1].pageNumber, 2);
      assert.equal(result.detectedLabels[1].status, 'accepted');
    });
  });

  describe('Multi-Label 2-Up Manifest (synthetic-2up-manifest.pdf)', () => {
    it('should detect multiple shipping label candidates on a single A4 page', async () => {
      const bytes = new Uint8Array(fs.readFileSync(twoUpFixturePath));
      const doc = await pdfjsLib.getDocument({ data: bytes }).promise;

      const page1 = await doc.getPage(1);
      const layout = await extractPageTextLayout(page1, 1);

      const candidates = await meeshoAdapter.detectLabels(layout);
      // Both Label 1 (Top) and Label 2 (Bottom) should be detected!
      assert.equal(candidates.length, 2);

      const topLabel = candidates.find((c) => c.bounds.bottom > 400);
      const bottomLabel = candidates.find((c) => c.bounds.bottom < 400);

      assert.ok(topLabel, 'Top label candidate should be detected');
      assert.ok(bottomLabel, 'Bottom label candidate should be detected');

      // Both should have valid dimensions
      assert.ok(topLabel.bounds.right - topLabel.bounds.left > 150);
      assert.ok(bottomLabel.bounds.right - bottomLabel.bounds.left > 150);

      // Candidates must be non-overlapping
      const iou = calculateIoU(topLabel.bounds, bottomLabel.bounds);
      assert.ok(iou < 0.05, `Candidates should not overlap significantly (iou=${iou})`);
    });
  });

  describe('Scanned / Textless PDF Graceful Fallback (synthetic-scanned-manifest.pdf)', () => {
    it('should report 0 candidates with clear warning when text layer is missing', async () => {
      const bytes = new Uint8Array(fs.readFileSync(scannedFixturePath));
      const doc = await pdfjsLib.getDocument({ data: bytes }).promise;

      const result = await detectShippingLabels(doc, 'meesho');
      assert.equal(result.detectedLabels.length, 0);
      assert.equal(result.textLayerAvailable, false);
      assert.ok(result.warnings.some((w) => w.includes('no extractable text layer')));
    });
  });
});
