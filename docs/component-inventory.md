# Component & Engine Inventory — ShipCrop Studio

This document catalogues all reusable components, layout wrappers, and PDF processing engine modules implemented across **Phase 0**, **Phase 1**, and **Phase 2** of ShipCrop Studio.

---

## 1. Automatic Label Detection Engine Modules (`src/lib/marketplaces/`) — *Phase 2*

| Module | Responsibility | Key Exports | Primary Consumers |
| :--- | :--- | :--- | :--- |
| **`types.ts`** | Domain types for detection methods, label candidates, text layout info, and marketplace adapters. | `DetectedLabel`, `DetectionResult`, `MarketplaceAdapter`, `PageTextLayoutInfo`, `TextItemInfo` | Detection engine, adapters, cropper workspace, tests |
| **`text-layout.ts`** | PDF.js page text extraction, geometric bounding box calculations, regex pattern search, and vertical clustering. | `extractPageTextLayout`, `computeBoundingBox`, `findTextMatches`, `clusterItemsByVerticalGap` | Detection engine, marketplace adapters |
| **`detection-validation.ts`** | Bounding box clamping, padding, dimension validation, candidate scoring, and IoU-based deduplication. | `padAndClampBoundingBox`, `isValidCandidateBox`, `calculateIoU`, `filterAndScoreCandidates` | Marketplace adapters, detection engine |
| **`meesho.ts`** | Prototype adapter for Meesho manifests: customer invoice stripping, sequential header partitioning, and confidence scoring. | `meeshoAdapter`, `MEESHO_ADAPTER_RULES_VERSION` | Adapter registry, detection engine |
| **`registry.ts`** | Adapter registry managing supported marketplaces, feature flags, and calibration verification. | `marketplaceRegistry`, `getMarketplaceAdapter`, `isAutomaticDetectionSupported`, `isMarketplaceVerified` | `CropperWorkspace`, detection engine |
| **`detection-engine.ts`** | Master detection coordinator: iterates over document pages, runs adapter detection, and collects candidate lists. | `detectShippingLabels` | `CropperWorkspace`, integration tests |

---

## 2. Real PDF Processing Engine Modules (`src/lib/pdf/`)

| Module | Responsibility | Key Exports | Primary Consumers |
| :--- | :--- | :--- | :--- |
| **`types.ts`** | Core TypeScript domain contracts for job lifecycle, bounding boxes, options, multi-region crops, and results. | `JobStatus`, `PdfCropBoundingBox`, `ViewportCropRect`, `CropRegionItem`, `PdfMetadata`, `PdfProcessOptions`, `PdfProcessResult`, `ValidationResult` | All PDF engine modules and UI components |
| **`load-pdf.ts`** | Client-side file validation and PDF.js document loading with local worker configuration. | `validatePdfFile`, `loadPdfDocument`, `configurePdfJsWorker`, `MAX_PDF_SIZE_BYTES` | `CropperWorkspace`, `FileDropzone`, integration tests |
| **`analyze-pdf.ts`** | Extracts page dimensions (pt & mm), rotation, page count, and aspect ratio from PDF.js document handle. | `analyzePdfDocument` | `CropperWorkspace` |
| **`coordinates.ts`** | Bidirectional translation between CSS viewport pixels and PDF user-space points; handles rotation (0°, 90°, 180°, 270°) and scale. | `viewportToPdfCrop`, `pdfCropToViewport`, `clampViewportRect`, `validateCropBoundingBox` | `PdfPreviewPlaceholder`, `CropSelectionOverlay`, `crop-pdf.ts` |
| **`crop-pdf.ts`** | Vector-preserving page embedding via `pdf-lib` into 4×6" (288×432 pt portrait or 432×288 pt landscape) thermal pages with uniform aspect-ratio fit. Supports multi-region crops (`CropRegionItem[]`). | `cropPdfDocument`, `calculateAspectFit`, `THERMAL_4X6_WIDTH_PT`, `THERMAL_4X6_HEIGHT_PT` | `generate-pdf.ts`, integration tests |
| **`validate-output.ts`** | Post-generation byte verification checking file headers, page count, thermal dimensions, and parse integrity. | `validateGeneratedPdf`, `OutputValidationResult` | `generate-pdf.ts`, integration tests |
| **`generate-pdf.ts`** | Master orchestration pipeline: coordinates cropping, multi-region generation, output validation, Blob creation, and browser download URLs. | `generateCroppedPdf` | `CropperWorkspace` |

---

## 3. Cropper Workspace Features (`src/features/cropper/`)

| Component | Responsibility | Key Props | Phase 2 Integration |
| :--- | :--- | :--- | :--- |
| **`CropperWorkspace`** | Master orchestration container managing real PDF loading, automatic label detection, candidate review toolbar, manual fallback, vector generation, and resource disposal. | `marketplace: MarketplaceConfig` | Full automatic detection integration (`Wand2` button), multi-region generation, unverified prototype badges, and batch actions. |
| **`PdfPreviewPlaceholder`** | Live PDF `<canvas>` renderer utilizing `pdfjs-dist`. Supports page flipping, zoom scaling (60%–200%), fit-to-page, render task cancellation, and candidate overlays. | `pdfDocument`, `selectedPageNumber`, `candidates`, `activeCandidateId`, `onCandidatesChange`, `onActiveCandidateChange` | Visualizes all detected candidates on the active page with index tags and status colors. |
| **`CropSelectionOverlay`** | Interactive SVG/DOM multi-candidate overlay with 8 resize handles, pointer drag, bounding-box clamping, accept/reject toggles, and deletion. | `candidates`, `activeCandidateId`, `canvasWidth`, `canvasHeight`, `viewport`, `onCropChange`, `disabled` | Upgraded to multi-candidate management; active candidate editing with immediate PDF coordinate translation. |
| **`CropSettings`** | Settings panel configured for 4×6" thermal output (288×432 pt), safety margins (0–5 mm), and DPI calibration (203/300 DPI). | `marketplace`, `settings`, `onSettingsChange`, `onResetSettings`, `disabled` | Retained and preserved; respects selected orientation and safety margins. |
| **`ResultsPanel`** | Post-processing summary panel displaying real file metrics, page count, detected vs. accepted count, download button, and error test trigger. | `marketplace`, `result: PdfProcessResult`, `settings`, `onProcessAnother`, `onSimulateError` | Real browser download via generated Blob URL; shows accepted label count. |

---

## 4. Document Uploader Features (`src/features/uploader/`)

| Component | Responsibility | Key Props | Status |
| :--- | :--- | :--- | :--- |
| **`FileDropzone`** | Drag-and-drop zone with instant header validation (`%PDF-` signature) and 50MB size limit check before queueing. | `onFilesSelected`, `maxFiles`, `maxFileSizeMb`, `disabled` | Real binary signature validation via `validatePdfFile`. |
| **`FileRow`** | Single row showing file icon, file name, formatted size, verified page count, and status badge. | `item: FileItem`, `onRemove`, `disabled` | Displays real verified page count and engine status. |
| **`FileQueue`** | Container listing selected documents with total page count aggregator and "Clear All" action. | `files`, `onRemoveFile`, `onClearAll`, `disabled` | Cleans up engine resources on file removal. |

---

## 5. Processing Status (`src/features/processing/`)

| Component | Responsibility | Key Props | Status |
| :--- | :--- | :--- | :--- |
| **`ProcessingStatus`** | Multi-stage status indicator showing typed `JobStatus` (`validating`, `analyzing`, `preview-ready`, `detecting-labels`, `processing`, `validating-output`, `completed`, `failed`). | `status: JobStatus`, `stageMessage`, `errorMessage`, `onRetry` | Displays honest stage messaging without fake progress percentages. |

---

## 6. Layout & Base UI Components

| Directory | Components | Status |
| :--- | :--- | :--- |
| **`src/components/layout/`** | `Header`, `Footer`, `AppShell` | Fully preserved; visual styling and navigation unchanged. |
| **`src/components/ui/`** | `Button`, `Badge`, `Card`, `Switch`, `Modal`, `Tabs`, `Select`, `Progress`, `Alert`, `Skeleton` | Reusable design system primitives fully preserved. |
| **`src/features/marketplaces/`** | `MarketplaceCard`, `MarketplaceSearch`, `MarketplaceGrid` | Preserved; all marketplace routes functional. |
| **`src/features/faq/`** | `FAQAccordion` | Preserved. |
