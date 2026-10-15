/**
 * Strong TypeScript definitions for ShipCrop Studio PDF Processing Engine (Phase 1)
 */

export type JobStatus =
  | 'queued'
  | 'validating'
  | 'analyzing'
  | 'preview-ready'
  | 'processing'
  | 'validating-output'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface PdfPageDimensions {
  widthPt: number;
  heightPt: number;
  widthMm: number;
  heightMm: number;
  rotation: 0 | 90 | 180 | 270;
}

export interface PdfPageInfo {
  pageNumber: number; // 1-indexed
  dimensions: PdfPageDimensions;
  aspectRatio: number; // width / height
}

export interface PdfDocumentMetadata {
  fileName: string;
  fileSizeBytes: number;
  formattedSize: string;
  pageCount: number;
  pages: PdfPageInfo[];
  isEncrypted: boolean;
  fingerprint?: string;
}

/**
 * Visual crop rectangle in rendered canvas / viewport pixels
 */
export interface ViewportCropRect {
  x: number; // Top-left x
  y: number; // Top-left y
  width: number;
  height: number;
}

/**
 * Standard PDF User Space coordinates (1 pt = 1/72 inch).
 * Standard PDF coordinates have origin (0, 0) at bottom-left of the page,
 * with y increasing upwards.
 */
export interface PdfCropBoundingBox {
  left: number;
  bottom: number;
  right: number;
  top: number;
}

export type OutputFormatOption = 'thermal-4x6' | 'a4-single';

/**
 * Individual region to crop from a specific source page.
 */
export interface CropRegionItem {
  id?: string;
  pageNumber: number; // 1-indexed source page
  cropBox: PdfCropBoundingBox;
  labelId?: string;
  labelTitle?: string;
}

export interface PdfProcessOptions {
  targetFormat: OutputFormatOption;
  marginMm: number;
  targetDpi: 203 | 300;
  /**
   * Single crop box applied uniformly across selected pages (Phase 1 manual fallback)
   */
  cropBox?: PdfCropBoundingBox;
  /**
   * Multi-region list of distinct crop regions across pages (Phase 2 multi-label detection)
   */
  cropRegions?: CropRegionItem[];
  /**
   * If omitted, all pages in document will be cropped using this crop region
   */
  selectedPages?: number[];
  customWidthPt?: number;
  customHeightPt?: number;
}

export interface PdfProcessResult {
  success: boolean;
  sourceFileName: string;
  outputFileName: string;
  sourcePageCount: number;
  outputPageCount: number;
  detectedCount?: number;
  acceptedCount?: number;
  outputDimensions: {
    widthPt: number;
    heightPt: number;
    widthMm: number;
    heightMm: number;
  };
  outputBytes?: Uint8Array;
  outputBlob?: Blob;
  outputUrl?: string;
  processingTimeMs: number;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  fileSizeBytes?: number;
}
