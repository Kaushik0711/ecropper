import { PdfCropBoundingBox } from '../pdf/types';

export type DetectionMethod =
  | 'text-layout'
  | 'marketplace-rules'
  | 'manual';

export type LabelCandidateStatus = 'suggested' | 'accepted' | 'rejected';

/**
 * Individual detected label candidate
 */
export interface DetectedLabel {
  id: string; // e.g. "p1-label-1"
  pageNumber: number; // 1-indexed source page
  bounds: PdfCropBoundingBox; // Standard PDF user-space points (origin bottom-left, y up)
  confidence: number; // 0.0 to 1.0
  method: DetectionMethod;
  status: LabelCandidateStatus;
  reasons: string[];
  warnings: string[];
  labelIndex: number; // 1-indexed label index on the source page
  isManual?: boolean;
}

/**
 * Result returned by the automatic detection engine for a document
 */
export interface DetectionResult {
  marketplaceId: string;
  isVerified: boolean;
  detectedLabels: DetectedLabel[];
  warnings: string[];
  automaticDetectionSupported: boolean;
  totalPagesAnalyzed: number;
  textLayerAvailable: boolean;
}

/**
 * Geometric and text data extracted from an individual PDF.js page
 */
export interface TextItemInfo {
  text: string;
  x: number; // left in PDF points
  y: number; // bottom in PDF points
  width: number;
  height: number;
  right: number;
  top: number;
}

export interface PageTextLayoutInfo {
  pageNumber: number; // 1-indexed
  pageWidth: number; // pt
  pageHeight: number; // pt
  rotation: number;
  textItems: TextItemInfo[];
  hasTextLayer: boolean;
}

/**
 * Extensible marketplace adapter interface
 */
export interface MarketplaceAdapter {
  id: string;
  name: string;
  isVerified: boolean;
  rulesVersion: string;
  supportedDetectionMethods: DetectionMethod[];
  supportedOutputFormats: ('thermal-4x6' | 'a4-single')[];
  requiredRegressionFixtures: string[];
  knownLimitations: string[];
  minConfidenceThreshold: number;
  detectLabels: (
    pageInfo: PageTextLayoutInfo,
    pageIndex?: number
  ) => Promise<DetectedLabel[]>;
}
