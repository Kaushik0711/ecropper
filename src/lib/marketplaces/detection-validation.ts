import { DetectedLabel } from './types';
import { PdfCropBoundingBox } from '../pdf/types';

/**
 * Calculates Intersection over Union (IoU) of two PDF bounding boxes.
 */
export function calculateIoU(a: PdfCropBoundingBox, b: PdfCropBoundingBox): number {
  const interLeft = Math.max(a.left, b.left);
  const interRight = Math.min(a.right, b.right);
  const interBottom = Math.max(a.bottom, b.bottom);
  const interTop = Math.min(a.top, b.top);

  const interWidth = Math.max(0, interRight - interLeft);
  const interHeight = Math.max(0, interTop - interBottom);
  const interArea = interWidth * interHeight;

  if (interArea === 0) return 0;

  const areaA = (a.right - a.left) * (a.top - a.bottom);
  const areaB = (b.right - b.left) * (b.top - b.bottom);
  const unionArea = areaA + areaB - interArea;

  return unionArea > 0 ? interArea / unionArea : 0;
}

/**
 * Expands a bounding box by a given padding in points and clamps to page boundaries.
 */
export function padAndClampBoundingBox(
  box: PdfCropBoundingBox,
  paddingPt: number,
  pageWidth: number,
  pageHeight: number
): PdfCropBoundingBox {
  const left = Math.max(0, box.left - paddingPt);
  const bottom = Math.max(0, box.bottom - paddingPt);
  const right = Math.min(pageWidth, box.right + paddingPt);
  const top = Math.min(pageHeight, box.top + paddingPt);

  return {
    left: parseFloat(left.toFixed(2)),
    bottom: parseFloat(bottom.toFixed(2)),
    right: parseFloat(right.toFixed(2)),
    top: parseFloat(top.toFixed(2)),
  };
}

/**
 * Validates a detected label candidate's geometry against practical label constraints.
 */
export function validateCandidateGeometry(
  box: PdfCropBoundingBox,
  pageWidth: number,
  pageHeight: number,
  minWidthPt: number = 100,
  minHeightPt: number = 120
): { isValid: boolean; error?: string } {
  const width = box.right - box.left;
  const height = box.top - box.bottom;

  if (width <= 0 || height <= 0) {
    return { isValid: false, error: 'Candidate has zero or negative dimensions.' };
  }

  if (width < minWidthPt || height < minHeightPt) {
    return {
      isValid: false,
      error: `Candidate dimension (${width.toFixed(0)}x${height.toFixed(0)} pt) is below minimum shipping label threshold (${minWidthPt}x${minHeightPt} pt).`,
    };
  }

  if (box.left < 0 || box.bottom < 0 || box.right > pageWidth + 20 || box.top > pageHeight + 20) {
    return { isValid: false, error: 'Candidate extends significantly outside page boundaries.' };
  }

  return { isValid: true };
}

/**
 * Deduplicates overlapping candidates and checks for layout ambiguity.
 */
export function filterAndScoreCandidates(
  candidates: DetectedLabel[],
  pageWidth: number,
  pageHeight: number
): DetectedLabel[] {
  // 1. Filter out geometrically invalid candidates
  const validCandidates: DetectedLabel[] = [];

  for (const c of candidates) {
    const geo = validateCandidateGeometry(c.bounds, pageWidth, pageHeight);
    if (geo.isValid) {
      validCandidates.push(c);
    }
  }

  // 2. Sort by confidence descending
  validCandidates.sort((a, b) => b.confidence - a.confidence);

  // 3. Deduplicate candidates with IoU > 0.75
  const deduplicated: DetectedLabel[] = [];

  for (const cand of validCandidates) {
    const isDuplicate = deduplicated.some((existing) => calculateIoU(existing.bounds, cand.bounds) > 0.75);
    if (!isDuplicate) {
      deduplicated.push(cand);
    }
  }

  // 4. Check for moderate overlap between distinct candidates and add warnings
  for (let i = 0; i < deduplicated.length; i++) {
    for (let j = i + 1; j < deduplicated.length; j++) {
      const iou = calculateIoU(deduplicated[i].bounds, deduplicated[j].bounds);
      if (iou > 0.15) {
        deduplicated[i].warnings.push(
          `Overlaps partially (IoU ${(iou * 100).toFixed(0)}%) with candidate #${deduplicated[j].labelIndex}. Please inspect crop bounds.`
        );
        deduplicated[j].warnings.push(
          `Overlaps partially (IoU ${(iou * 100).toFixed(0)}%) with candidate #${deduplicated[i].labelIndex}. Please inspect crop bounds.`
        );
      }
    }
  }

  return deduplicated;
}
