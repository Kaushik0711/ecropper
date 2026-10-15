import { PDFDocument } from 'pdf-lib';

export interface OutputValidationResult {
  isValid: boolean;
  pageCount: number;
  actualWidthPt: number;
  actualHeightPt: number;
  byteLength: number;
  error?: string;
}

/**
 * Validates generated output PDF bytes to guarantee integrity before reporting success.
 */
export async function validateGeneratedPdf(
  outputBytes: Uint8Array,
  expectedMinPages: number = 1,
  expectedFormat?: 'thermal-4x6' | 'a4-single'
): Promise<OutputValidationResult> {
  if (!outputBytes || outputBytes.byteLength === 0) {
    return {
      isValid: false,
      pageCount: 0,
      actualWidthPt: 0,
      actualHeightPt: 0,
      byteLength: 0,
      error: 'Generated PDF byte array is empty.',
    };
  }

  // Minimum valid PDF size is ~300 bytes
  if (outputBytes.byteLength < 300) {
    return {
      isValid: false,
      pageCount: 0,
      actualWidthPt: 0,
      actualHeightPt: 0,
      byteLength: outputBytes.byteLength,
      error: 'Generated PDF is unexpectedly small and likely corrupt.',
    };
  }

  // Check magic number
  const headerCheck = new TextDecoder('ascii').decode(outputBytes.slice(0, 8));
  if (!headerCheck.startsWith('%PDF-')) {
    return {
      isValid: false,
      pageCount: 0,
      actualWidthPt: 0,
      actualHeightPt: 0,
      byteLength: outputBytes.byteLength,
      error: 'Generated output missing PDF signature (%PDF-).',
    };
  }

  try {
    const loadedDoc = await PDFDocument.load(outputBytes, { ignoreEncryption: true });
    const pageCount = loadedDoc.getPageCount();

    if (pageCount < expectedMinPages) {
      return {
        isValid: false,
        pageCount,
        actualWidthPt: 0,
        actualHeightPt: 0,
        byteLength: outputBytes.byteLength,
        error: `Generated PDF has ${pageCount} pages; expected at least ${expectedMinPages}.`,
      };
    }

    const firstPage = loadedDoc.getPage(0);
    const { width: rawWidthPt, height: rawHeightPt } = firstPage.getSize();
    const actualWidthPt = parseFloat(rawWidthPt.toFixed(1));
    const actualHeightPt = parseFloat(rawHeightPt.toFixed(1));

    if (expectedFormat === 'thermal-4x6') {
      const isPortraitThermal = Math.abs(actualWidthPt - 288) < 1.0 && Math.abs(actualHeightPt - 432) < 1.0;
      const isLandscapeThermal = Math.abs(actualWidthPt - 432) < 1.0 && Math.abs(actualHeightPt - 288) < 1.0;

      if (!isPortraitThermal && !isLandscapeThermal) {
        return {
          isValid: false,
          pageCount,
          actualWidthPt,
          actualHeightPt,
          byteLength: outputBytes.byteLength,
          error: `Generated page dimensions (${actualWidthPt}x${actualHeightPt} pt) do not match expected 4x6" thermal dimensions (288x432 or 432x288 pt).`,
        };
      }
    }

    return {
      isValid: true,
      pageCount,
      actualWidthPt,
      actualHeightPt,
      byteLength: outputBytes.byteLength,
    };
  } catch (err) {
    return {
      isValid: false,
      pageCount: 0,
      actualWidthPt: 0,
      actualHeightPt: 0,
      byteLength: outputBytes.byteLength,
      error: `Failed to reload and verify generated PDF: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
