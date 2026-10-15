import { cropPdfDocument } from './crop-pdf';
import { validateGeneratedPdf } from './validate-output';
import { PdfProcessOptions, PdfProcessResult } from './types';

const PT_TO_MM = 25.4 / 72;

/**
 * End-to-end processing pipeline:
 * 1. Executes vector-preserving crop with aspect-ratio-fit layout.
 * 2. Validates generated output bytes.
 * 3. Builds a browser Blob and downloadable object URL.
 * 4. Measures processing duration.
 */
export async function generateCroppedPdf(
  sourceBytes: Uint8Array,
  sourceFileName: string,
  options: PdfProcessOptions
): Promise<PdfProcessResult> {
  const startTime = performance.now();

  try {
    // 1. Crop document
    const outputBytes = await cropPdfDocument(sourceBytes, options);

    const expectedMinPages = options.cropRegions && options.cropRegions.length > 0
      ? options.cropRegions.length
      : (options.selectedPages?.length || 1);

    // 2. Validate generated document
    const validation = await validateGeneratedPdf(outputBytes, expectedMinPages);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Output PDF validation failed.');
    }

    const duration = Math.round(performance.now() - startTime);

    // 3. Format output file name
    const baseName = sourceFileName.replace(/\.pdf$/i, '');
    const formatTag = options.targetFormat === 'thermal-4x6' ? 'Thermal_4x6' : 'A4_Cropped';
    const outputFileName = `${baseName}_${formatTag}.pdf`;

    // 4. Create Blob and Object URL in browser environment
    let outputBlob: Blob | undefined;
    let outputUrl: string | undefined;

    if (typeof Blob !== 'undefined') {
      outputBlob = new Blob([outputBytes as unknown as BlobPart], { type: 'application/pdf' });
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        outputUrl = URL.createObjectURL(outputBlob);
      }
    }

    const widthPt = validation.actualWidthPt;
    const heightPt = validation.actualHeightPt;

    const sourcePageCount = options.cropRegions && options.cropRegions.length > 0
      ? new Set(options.cropRegions.map((r) => r.pageNumber)).size
      : (options.selectedPages?.length || validation.pageCount);

    return {
      success: true,
      sourceFileName,
      outputFileName,
      sourcePageCount,
      outputPageCount: validation.pageCount,
      acceptedCount: options.cropRegions?.length,
      outputDimensions: {
        widthPt,
        heightPt,
        widthMm: parseFloat((widthPt * PT_TO_MM).toFixed(1)),
        heightMm: parseFloat((heightPt * PT_TO_MM).toFixed(1)),
      },
      outputBytes,
      outputBlob,
      outputUrl,
      processingTimeMs: duration,
    };
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    return {
      success: false,
      sourceFileName,
      outputFileName: '',
      sourcePageCount: 0,
      outputPageCount: 0,
      outputDimensions: { widthPt: 0, heightPt: 0, widthMm: 0, heightMm: 0 },
      processingTimeMs: duration,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
