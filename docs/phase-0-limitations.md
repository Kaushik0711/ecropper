# Phase 0 Limitations & Boundary Constraints — ShipCrop Studio

This document explicitly defines the technical boundaries and intentional limitations of **Phase 0** (UI/UX Design & Interactive Prototype), along with its transition status following **Phase 1** and **Phase 2 Implementation**.

> [!NOTE]
> **Phase 2 Update**: An extensible automatic shipping-label detection engine has been implemented for Meesho as an unverified prototype (`src/lib/marketplaces/`). Capabilities 1, 2, and 4 below have transitioned from simulated mocks to client-side automated algorithms. Limitations 3 and 5 remain active for future phases.

---

## Technical Limitations & Implementation Status

### 1. Real PDF Parsing: Transitioned in Phase 1
- **Phase 0 Status**: Selected files were read only for basic browser file metadata (`file.name`, `file.size`). The preview canvas displayed a simulated mock.
- **Phase 1 & 2 Reality**: Implemented. Real PDF files are validated locally using file signature `%PDF-` inspection, parsed via `pdfjs-dist` using a local worker (`/pdf.worker.min.mjs`), and rendered dynamically to HTML5 `<canvas>` elements with zoom and multi-page navigation.

### 2. Actual PDF Cropping & Thermal Generation: Transitioned in Phase 1 & 2
- **Phase 0 Status**: No PDF manipulation libraries were active. Download actions were simulated via UI toasts.
- **Phase 1 & 2 Reality**: Implemented. Real 4×6" (288×432 pt portrait or 432×288 pt landscape) thermal PDF documents are created in memory via `pdf-lib` using vector page embedding (`destDoc.embedPage()`). In Phase 2, this supports multi-region crops (`CropRegionItem[]`), generating 1 discrete output page per accepted label candidate across multiple pages.

### 3. SKU Extraction and OCR: Unchanged (Strictly Out of Scope)
- The application does NOT perform Optical Character Recognition (OCR) or font glyph mapping.
- Scanned, textless image PDFs cannot be automatically detected and require manual cropping.
- SKU codes, order numbers, and recipient addresses are not extracted from text streams.
- Multi-item invoice tables and automatic label detection remain scheduled for subsequent marketplace-specific phases.

### 4. Marketplace Automatic Detection: Transitioned in Phase 2 (Meesho Prototype)
- **Phase 0 & 1 Status**: Automatic label boundary detection was not implemented. Users adjusted crop boxes manually.
- **Phase 2 Reality**: Implemented as an extensible adapter framework (`src/lib/marketplaces/`). Meesho detection rules use text layout analysis, sequential header partitioning, and anchor matching to identify candidate shipping labels and exclude customer invoices.
- **Verification Status**: Explicitly unverified (`0.2.0-unverified`) pending calibration against genuine seller PDF manifests. Other marketplaces (Flipkart, Amazon, etc.) gracefully fall back to manual cropping.

### 5. Zero Backend, Database, or Authentication Infrastructure: Retained & Strictly Verified
- There is no remote backend API, serverless processing endpoint, database, or cloud storage bucket.
- No user credentials, session tokens, or payment gateways exist.
- In accordance with our client-side privacy architecture, all document bytes remain strictly in browser RAM and are revoked upon resetting or unmounting.

---

## Detailed Engine Documentation
For complete technical details on the implemented engines, refer to:
- [`docs/phase-1-pdf-engine.md`](file:///Users/jarvis/MySites/ecropper/docs/phase-1-pdf-engine.md)
- [`docs/phase-2-label-detection.md`](file:///Users/jarvis/MySites/ecropper/docs/phase-2-label-detection.md)
- [`docs/component-inventory.md`](file:///Users/jarvis/MySites/ecropper/docs/component-inventory.md)
