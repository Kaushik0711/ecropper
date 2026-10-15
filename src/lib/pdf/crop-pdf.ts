import { PDFDocument } from 'pdf-lib';
import { PdfProcessOptions } from './types';
import { validateCropBoundingBox } from './coordinates';

// Standard 4x6 inch dimensions in PDF points (1/72 inch)
export const THERMAL_4X6_WIDTH_PT = 288;
export const THERMAL_4X6_HEIGHT_PT = 432;

// Standard A4 dimensions in PDF points
export const A4_WIDTH_PT = 595.28;
export const A4_HEIGHT_PT = 841.89;

const MM_TO_PT = 72 / 25.4;

export interface FitCalculation {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

/**
 * Calculates uniform aspect-ratio-preserving placement of a cropped source box
 * onto a target page. Prevents non-uniform distortion or stretching.
 */
export function calculateAspectFit(
  sourceWidth: number,
  sourceHeight: number,
  pageWidth: number,
  pageHeight: number,
  marginPt: number = 0
): FitCalculation {
  const availW = Math.max(1, pageWidth - 2 * marginPt);
  const availH = Math.max(1, pageHeight - 2 * marginPt);

  // Scale factor: strictly uniform (minimum of horizontal and vertical scale)
  const scale = Math.min(availW / Math.max(1, sourceWidth), availH / Math.max(1, sourceHeight));
  const width = parseFloat((sourceWidth * scale).toFixed(2));
  const height = parseFloat((sourceHeight * scale).toFixed(2));

  // Center horizontally and vertically within the printable margin area
  const x = parseFloat((marginPt + (availW - width) / 2).toFixed(2));
  const y = parseFloat((marginPt + (availH - height) / 2).toFixed(2));

  return { x, y, width, height, scale };
}

/**
 * Crops a PDF document using vector-preserving PDF page embedding.
 *
 * For each source page:
 * 1. Embeds the user-selected crop bounding box as a vector form XObject.
 * 2. Creates a brand new output page with exact physical dimensions (e.g. 4x6" thermal: 288x432 pt).
 * 3. Draws the embedded vector region centered with uniform scaling.
 * 4. Preserves vector text, barcode lines, and courier formatting.
 */
export async function cropPdfDocument(
  sourceBytes: Uint8Array,
  options: PdfProcessOptions
): Promise<Uint8Array> {
  const hasRegions = options.cropRegions && options.cropRegions.length > 0;

  if (!hasRegions && !options.cropBox) {
    throw new Error('No crop bounding box or crop regions specified.');
  }

  // Load source document via pdf-lib
  const srcDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const totalSrcPages = srcDoc.getPageCount();

  if (totalSrcPages === 0) {
    throw new Error('Source PDF contains no pages.');
  }

  // Create clean target document
  const destDoc = await PDFDocument.create();
  const marginPt = (options.marginMm || 0) * MM_TO_PT;

  if (hasRegions) {
    // ==========================================
    // MULTI-REGION MODE (Phase 2 Detection)
    // ==========================================
    const regions = options.cropRegions!;

    for (const region of regions) {
      const validation = validateCropBoundingBox(region.cropBox);
      if (!validation.isValid) {
        throw new Error(validation.error || `Invalid crop bounding box for label ${region.labelId || region.pageNumber}.`);
      }

      if (region.pageNumber < 1 || region.pageNumber > totalSrcPages) {
        throw new Error(`Crop region references page ${region.pageNumber}, but document only has ${totalSrcPages} pages.`);
      }

      const pageIndex = region.pageNumber - 1;
      const srcPage = srcDoc.getPage(pageIndex);

      const cropW = region.cropBox.right - region.cropBox.left;
      const cropH = region.cropBox.top - region.cropBox.bottom;
      const isCropLandscape = cropW > cropH;

      let targetWidthPt: number;
      let targetHeightPt: number;

      if (options.targetFormat === 'thermal-4x6') {
        if (isCropLandscape) {
          targetWidthPt = THERMAL_4X6_HEIGHT_PT; // 432
          targetHeightPt = THERMAL_4X6_WIDTH_PT; // 288
        } else {
          targetWidthPt = THERMAL_4X6_WIDTH_PT; // 288
          targetHeightPt = THERMAL_4X6_HEIGHT_PT; // 432
        }
      } else {
        targetWidthPt = A4_WIDTH_PT;
        targetHeightPt = A4_HEIGHT_PT;
      }

      // Embed the specific crop bounding box as a vector XObject
      const embedded = await destDoc.embedPage(srcPage, {
        left: region.cropBox.left,
        bottom: region.cropBox.bottom,
        right: region.cropBox.right,
        top: region.cropBox.top,
      });

      // Create output page with exact physical dimensions
      const destPage = destDoc.addPage([targetWidthPt, targetHeightPt]);

      // Calculate uniform aspect-ratio fit placement
      const fit = calculateAspectFit(
        embedded.width,
        embedded.height,
        targetWidthPt,
        targetHeightPt,
        marginPt
      );

      destPage.drawPage(embedded, {
        x: fit.x,
        y: fit.y,
        width: fit.width,
        height: fit.height,
      });
    }
  } else {
    // ==========================================
    // SINGLE CROP BOX FALLBACK (Phase 1 Manual)
    // ==========================================
    const cropBox = options.cropBox!;
    const validation = validateCropBoundingBox(cropBox);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid crop bounding box.');
    }

    // Determine pages to process
    const pagesToProcess = options.selectedPages && options.selectedPages.length > 0
      ? options.selectedPages.filter((p) => p >= 1 && p <= totalSrcPages)
      : Array.from({ length: totalSrcPages }, (_, i) => i + 1);

    if (pagesToProcess.length === 0) {
      throw new Error('No valid pages selected for processing.');
    }

    const cropW = cropBox.right - cropBox.left;
    const cropH = cropBox.top - cropBox.bottom;
    const isCropLandscape = cropW > cropH;

    let targetWidthPt: number;
    let targetHeightPt: number;

    if (options.targetFormat === 'thermal-4x6') {
      if (isCropLandscape) {
        targetWidthPt = THERMAL_4X6_HEIGHT_PT; // 432
        targetHeightPt = THERMAL_4X6_WIDTH_PT; // 288
      } else {
        targetWidthPt = THERMAL_4X6_WIDTH_PT; // 288
        targetHeightPt = THERMAL_4X6_HEIGHT_PT; // 432
      }
    } else {
      targetWidthPt = A4_WIDTH_PT;
      targetHeightPt = A4_HEIGHT_PT;
    }

    for (const pageNum of pagesToProcess) {
      const pageIndex = pageNum - 1;
      const srcPage = srcDoc.getPage(pageIndex);

      const embedded = await destDoc.embedPage(srcPage, {
        left: cropBox.left,
        bottom: cropBox.bottom,
        right: cropBox.right,
        top: cropBox.top,
      });

      const destPage = destDoc.addPage([targetWidthPt, targetHeightPt]);

      const fit = calculateAspectFit(
        embedded.width,
        embedded.height,
        targetWidthPt,
        targetHeightPt,
        marginPt
      );

      destPage.drawPage(embedded, {
        x: fit.x,
        y: fit.y,
        width: fit.width,
        height: fit.height,
      });
    }
  }

  // Serialize target document
  const outputBytes = await destDoc.save();
  return outputBytes;
}
