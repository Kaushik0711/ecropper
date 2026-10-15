import { DetectionResult, DetectedLabel } from './types';
import { getMarketplaceAdapter, isAutomaticDetectionSupported } from './registry';
import { extractPageTextLayout } from './text-layout';
import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Master detection orchestrator:
 * Analyzes a loaded PDF document using the appropriate marketplace adapter,
 * extracting text geometry, grouping candidate label clusters, and returning
 * verified or suggested crop candidates with confidence ratings.
 */
export async function detectShippingLabels(
  pdfDocument: PDFDocumentProxy,
  marketplaceId: string
): Promise<DetectionResult> {
  const adapter = getMarketplaceAdapter(marketplaceId);

  // If marketplace has no automated adapter registered
  if (!adapter || !isAutomaticDetectionSupported(marketplaceId)) {
    return {
      marketplaceId,
      isVerified: false,
      detectedLabels: [],
      warnings: [
        `Automatic detection is not yet implemented for ${adapter?.name || marketplaceId}. Manual crop adjustment is active.`,
      ],
      automaticDetectionSupported: false,
      totalPagesAnalyzed: 0,
      textLayerAvailable: false,
    };
  }

  const numPages = pdfDocument.numPages;
  const allDetectedLabels: DetectedLabel[] = [];
  const globalWarnings: string[] = [];
  let pagesWithText = 0;

  if (!adapter.isVerified) {
    globalWarnings.push(
      `Experimental ${adapter.name} detection rules active (rules v${adapter.rulesVersion}). Candidate regions require user verification.`
    );
  }

  // Iterate through all document pages
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    try {
      const page = await pdfDocument.getPage(pageNum);
      const layoutInfo = await extractPageTextLayout(page, pageNum);

      if (layoutInfo.hasTextLayer) {
        pagesWithText++;
      } else {
        globalWarnings.push(
          `Page ${pageNum} has no extractable text layer (possible scanned or rasterized document). Automatic detection unavailable for this page.`
        );
        continue;
      }

      // Execute adapter-specific candidate detection
      const pageCandidates = await adapter.detectLabels(layoutInfo, pageNum - 1);
      allDetectedLabels.push(...pageCandidates);
    } catch (err) {
      globalWarnings.push(
        `Failed to analyze text geometry on page ${pageNum}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  if (allDetectedLabels.length === 0) {
    if (pagesWithText === 0) {
      globalWarnings.push(
        'The document contains no selectable text streams. OCR is not implemented in this phase. Please define crop boundaries manually.'
      );
    } else {
      globalWarnings.push(
        `No shipping label regions matching ${adapter.name} layout patterns were identified. Please adjust the crop boundaries manually.`
      );
    }
  }

  return {
    marketplaceId,
    isVerified: adapter.isVerified,
    detectedLabels: allDetectedLabels,
    warnings: globalWarnings,
    automaticDetectionSupported: true,
    totalPagesAnalyzed: numPages,
    textLayerAvailable: pagesWithText > 0,
  };
}
