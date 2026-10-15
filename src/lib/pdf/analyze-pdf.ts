import { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfDocumentMetadata, PdfPageInfo } from './types';

const PT_TO_MM = 25.4 / 72;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Analyzes a loaded PDF document to extract real page geometries, dimensions, and rotation.
 */
export async function analyzePdfDocument(
  pdfDoc: PDFDocumentProxy,
  fileName: string,
  fileSizeBytes: number
): Promise<PdfDocumentMetadata> {
  const pageCount = pdfDoc.numPages;
  const pages: PdfPageInfo[] = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    const page = await pdfDoc.getPage(pageNumber);
    // Use unscaled viewport (scale: 1.0) with page's inherent rotation
    const viewport = page.getViewport({ scale: 1.0 });

    const widthPt = viewport.width;
    const heightPt = viewport.height;
    const rawRotation = page.rotate % 360;
    const rotation = (rawRotation < 0 ? rawRotation + 360 : rawRotation) as 0 | 90 | 180 | 270;

    pages.push({
      pageNumber,
      dimensions: {
        widthPt,
        heightPt,
        widthMm: parseFloat((widthPt * PT_TO_MM).toFixed(1)),
        heightMm: parseFloat((heightPt * PT_TO_MM).toFixed(1)),
        rotation,
      },
      aspectRatio: widthPt / (heightPt || 1),
    });
  }

  return {
    fileName,
    fileSizeBytes,
    formattedSize: formatBytes(fileSizeBytes),
    pageCount,
    pages,
    isEncrypted: false,
    fingerprint: pdfDoc.fingerprints?.[0] ?? undefined,
  };
}
