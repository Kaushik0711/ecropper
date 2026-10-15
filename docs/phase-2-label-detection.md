# Phase 2: Automatic Shipping-Label Detection Engine (Meesho First) — ShipCrop Studio

This document provides a comprehensive technical reference for the **Phase 2** automatic shipping-label detection engine in ShipCrop Studio. It details the marketplace adapter architecture, text layout and geometric analysis, confidence scoring, candidate review interactions, multi-region vector thermal crop generation, and browser privacy guarantees.

---

## 1. Architectural Overview & Design Philosophy

Phase 2 introduces an extensible, client-side label detection subsystem (`src/lib/marketplaces/`) without breaking or altering the established Phase 1 manual cropping workflow.

```
Source PDF Document
       │
       ▼
[loadPdfDocument] (PDF.js in Web Worker)
       │
       ▼
[detectShippingLabels] (Detection Engine Orchestrator)
       │
       ├─► Check Marketplace Adapter in Registry (`src/lib/marketplaces/registry.ts`)
       │    ├─ If unsupported/uncalibrated: return empty candidates + manual fallback warning
       │    └─ If supported (e.g. `meesho`): proceed with extraction
       │
       ├─► Extract Page Text Layout (`src/lib/marketplaces/text-layout.ts`)
       │    ├─ Retrieve `page.getTextContent()` via PDF.js
       │    ├─ Compute PDF user-space item bounding boxes [x, y, right, top]
       │    └─ Check text layer availability (`hasTextLayer`)
       │
       ├─► Run Marketplace Adapter (`src/lib/marketplaces/meesho.ts`)
       │    ├─ Scan for customer tax invoice / packing slip anchors (exclusion boundary)
       │    ├─ Scan for shipping label header anchors (`Meesho`, `AWB:`, courier marks)
       │    ├─ Sequential partition: group items into distinct label candidates
       │    ├─ Compute candidate bounding boxes with padding & page clamping
       │    └─ Calculate confidence score based on anchor density & layout geometry
       │
       ├─► Validate & Deduplicate (`src/lib/marketplaces/detection-validation.ts`)
       │    ├─ Reject sub-minimum sizes (<100x120 pt) and inverted coordinates
       │    ├─ Compute Intersection-over-Union (IoU) overlap matrix
       │    └─ Deduplicate heavily overlapping candidates; flag ambiguous overlaps
       │
       ▼
[Candidate Review in UI] (`CropSelectionOverlay.tsx` & `CropperWorkspace.tsx`)
       ├─ Render all candidates with status badges (`accepted`, `suggested`, `rejected`)
       ├─ Interactive 8-handle drag/resize for active candidate
       ├─ Actions: Accept / Reject / Delete / Add Manual Box / Accept All / Reject All
       │
       ▼
[generateCroppedPdf] (Vector Embedding via `pdf-lib`)
       ├─ Iterate over all accepted candidates across all pages (`CropRegionItem[]`)
       ├─ Embed each source region as Form XObject on a dedicated 4×6" (288×432 pt) page
       ├─ Validate output page count and physical dimensions (`validate-output.ts`)
       └─ Produce Blob URL for instant browser download
```

---

## 2. Marketplace Adapter Architecture & Contract

The adapter registry pattern isolates marketplace-specific heuristic logic while presenting a uniform interface to the UI and processing pipelines.

### The `MarketplaceAdapter` Contract (`src/lib/marketplaces/types.ts`)

```typescript
export interface MarketplaceAdapter {
  id: string; // Unique identifier (e.g. 'meesho')
  name: string; // Display name
  isVerified: boolean; // Production calibration flag
  rulesVersion: string; // Versioned heuristic specification
  supportedDetectionMethods: DetectionMethod[]; // 'text-layout' | 'marketplace-rules' | 'manual'
  supportedOutputFormats: ('thermal-4x6' | 'a4-single')[];
  requiredRegressionFixtures: string[]; // Fixture PDFs required for verification
  knownLimitations: string[];
  minConfidenceThreshold: number; // e.g. 0.70
  detectLabels: (
    pageInfo: PageTextLayoutInfo,
    pageIndex?: number
  ) => Promise<DetectedLabel[]>;
}
```

### Verified vs. Unverified Status
A critical architectural constraint in ShipCrop Studio:
- **`isVerified: true`**: Reserved exclusively for adapters that have undergone regression validation against authentic, authorized seller PDF manifests from live marketplace portals.
- **`isVerified: false`**: The adapter represents an implemented algorithmic prototype calibrated against synthetic test documents. The UI explicitly presents an "Unverified Prototype" warning banner, advises manual review of all bounding boxes, and prevents uncalibrated adapters from claiming production accuracy.
- **Unregistered Marketplaces**: Any marketplace route without an implemented adapter (e.g. Flipkart, Amazon, Ajio) automatically returns `automaticDetectionSupported: false` and seamlessly guides the seller to the working manual crop tool.

---

## 3. PDF Text Layout & Geometric Analysis

### 3.1 PDF.js Text Item Extraction
Text analysis executes in `src/lib/marketplaces/text-layout.ts`:
1. `page.getTextContent({ includeMarkedContent: false })` retrieves all text items on the page.
2. For each item, the PDF.js transformation matrix `[a, b, c, d, e, f]` yields the item's baseline coordinates `(e, f)`.
3. The bounding box is constructed in standard PDF user-space points:
   $$\text{left} = e, \quad \text{bottom} = f, \quad \text{right} = e + \text{width}, \quad \text{top} = f + \text{height}$$
4. If a page has 0 text items (e.g. scanned flat image or vector paths only), `hasTextLayer` is flagged as `false`.

### 3.2 Anchor Recognition & Regex Patterns
Heuristic detection matches semantic shipping-label tokens:
- **Marketplace / Brand Anchors**: `/meesho/i`
- **Air Waybill / Tracking**: `/awb[:\s#]|tracking[:\s#]|pkg-ref/i`
- **Courier Logistics**: `/courier|express|shadowfax|delhivery|ecom express|xpressbees/i`
- **Consignee / Delivery**: `/ship to|deliver to|consignee|customer order/i`
- **Return / Undelivered**: `/return if undelivered|return address|seller logistics/i`
- **Customer Invoice Exclusion Anchors**: `/tax invoice|customer tax invoice|packing slip|invoice no|gstin|hsn/i`

### 3.3 Multi-Label Sequential Partitioning
Earlier naive clustering based on arbitrary vertical gap thresholds fails when a single shipping label has large vertical whitespace gaps (e.g. between the barcode area and delivery address).

ShipCrop Studio implements **Sequential Header Partitioning**:
1. All text items on the page are sorted top-to-bottom ($y$ descending).
2. The page is scanned for invoice markers. If invoice markers are present, any text items falling within the invoice vertical zone are excluded from label candidate bounding boxes.
3. The remaining text items are scanned for label header anchors (e.g. `Meesho`, `AWB:`, courier logos).
4. When a new label header anchor is detected separated vertically by at least 150 pt from the previous header, a new label candidate partition is initialized.
5. All intermediate text items (AWB barcode text, delivery address, SKU lines, return details) are bound to their respective label candidate partition.
6. This cleanly resolves multi-label documents (such as 2-up A4 manifests) into discrete, non-overlapping label candidates.

---

## 4. Confidence Scoring & Validation

### 4.1 Scoring Formula
Candidate confidence is calculated deterministically between 0.0 and 1.0:
- **Base Score**: 0.35 (assigned when valid physical dimensions and layout geometry are established).
- **Marketplace Name Anchor (`Meesho`)**: +0.25
- **AWB / Tracking Anchor**: +0.20
- **Courier Logistics Mark**: +0.10
- **Delivery / Return Address Block**: +0.10
- **Dimension Penalty**: If the candidate height is abnormally small (<150 pt) or large (>650 pt), a penalty of -0.15 is applied.

### 4.2 Candidate Status Classification
- **`accepted`**: Confidence $\ge 0.70$, geometry valid, no critical overlap. Ready for one-click export.
- **`suggested`**: Confidence between 0.40 and 0.69, or candidate has non-fatal overlap warning. Highlighted in amber; requires user inspection.
- **`rejected`**: Discarded or manually toggled off by the user. Excluded from PDF export.

### 4.3 Geometric Validation & Clamping (`src/lib/marketplaces/detection-validation.ts`)
1. **Safety Padding**: 8 pt padding is applied symmetrically to prevent clipping barcodes or border lines.
2. **Page Clamping**: Clamped strictly to `[0, 0, pageWidth, pageHeight]`.
3. **Minimum Practical Threshold**: Must be $\ge 100 \times 120\text{ pt}$ (preventing accidental grouping of lone page footers or page numbers).
4. **IoU Overlap Analysis**:
   $$\text{IoU} = \frac{\text{Area}(\text{Box}_A \cap \text{Box}_B)}{\text{Area}(\text{Box}_A \cup \text{Box}_B)}$$
   - If $\text{IoU} > 0.60$: The candidate with lower confidence is deduplicated.
   - If $0.15 \le \text{IoU} \le 0.60$: Both candidates are retained with an ambiguous overlap warning flag.

---

## 5. User Review & Interactive Candidate Overlay

The crop overlay (`CropSelectionOverlay.tsx`) was upgraded from single-box editing to full multi-candidate management:

| Capability | Behavior |
| :--- | :--- |
| **Visual State Encoding** | Emerald ring for `accepted`, Amber for `suggested`, Gray/Strikethrough for `rejected`, Violet highlight for the actively selected candidate. |
| **8-Handle Resize & Drag** | The actively selected candidate provides 8 SVG handles (corners + midpoints) and drag-to-move capabilities clamped to canvas boundaries. |
| **Candidate Controls** | Each candidate features an inline badge showing its index (#1, #2), status toggle button (Accept / Reject), and Delete button. |
| **Quick Actions Toolbar** | "Accept All", "Reject All", "Add Manual Box" (creates a new candidate at current page center), and "Reset to Manual Mode". |
| **Non-Destructive** | Canvas rendering is completely non-destructive; the underlying PDF rendering is never modified. |

---

## 6. Multi-Region Vector Thermal Generation

The PDF generation pipeline (`src/lib/pdf/crop-pdf.ts` & `src/lib/pdf/generate-pdf.ts`) was extended to support multi-region thermal output:

1. **Input**: Accepts an ordered array of accepted regions across all document pages:
   ```typescript
   export interface CropRegionItem {
     id: string;
     pageNumber: number; // 1-indexed source page
     cropBox: PdfCropBoundingBox;
   }
   ```
2. **Page-by-Page Embedding**:
   - `pdf-lib` creates a blank thermal document (`288 × 432 pt` portrait, or `432 × 288 pt` landscape).
   - For each accepted candidate, the source page is embedded as a vector Form XObject via `destDoc.embedPage(sourcePage, boundingBox)`.
   - `calculateAspectFit` scales the cropped region uniformly to fill the printable thermal area while respecting safety margins (0–5 mm) without non-uniform stretching.
3. **Deterministic Page Count**:
   - Output page count equals `acceptedCandidates.length`.
   - If a 1-page A4 document contains 2 accepted labels, the generated PDF contains exactly 2 individual 4×6" thermal pages.
4. **Manual Mode Fallback**:
   - If no candidate regions are provided, the engine seamlessly falls back to Phase 1 single-box cropping across all pages.
5. **Output Validation (`validate-output.ts`)**:
   - Verifies PDF binary header (`%PDF-`).
   - Verifies exact output page count.
   - Verifies physical dimensions: supports both 288×432 pt portrait and 432×288 pt landscape.

---

## 7. Supported vs. Unsupported Document Types

| Document Type | Detection Support | Behavior & Recommended Workflow |
| :--- | :--- | :--- |
| **Text-based Meesho Manifest** | Supported (Prototype) | Automatically extracts label regions, excludes bottom invoice block. |
| **2-Up Multi-Label A4 Page** | Supported | Detects multiple labels sequentially; generates 2 individual 4×6" output pages. |
| **Scanned / Image-Only PDF** | Unsupported for Auto | Reports `hasTextLayer: false`. UI prompts seller to use manual crop selection. |
| **Encrypted / Password PDF** | Rejected at Ingestion | Validated and rejected at file dropzone before processing. |
| **Other Marketplaces (Flipkart, Amazon)** | Fallback Only | Detection adapter marked uncalibrated; user uses standard manual crop box. |

---

## 8. Required Production Test Fixtures

Before the Meesho adapter can be promoted from `isVerified: false` to `isVerified: true`, the following genuine seller sample manifests are required:

1. **`meesho-seller-manifest-single.pdf`**: Single-order standard label with attached customer tax invoice.
2. **`meesho-seller-manifest-2up.pdf`**: 2 orders per A4 sheet with adjacent or stacked labels.
3. **`meesho-multi-courier-manifest.pdf`**: Multi-page document featuring different logistics partners (Shadowfax, Delhivery, Xpressbees, Ecom Express).
4. **`meesho-return-rto-label.pdf`**: Return-to-origin label layout.

> [!IMPORTANT]
> The application never silently treats synthetic fixtures as genuine marketplace manifests. The adapter version string is explicitly flagged `0.2.0-unverified` until genuine sample regression tests are executed.

---

## 9. Zero-Transmission Client Privacy

ShipCrop Studio executes 100% of PDF processing in the user's browser:
- No network requests transmit PDF bytes, images, or extracted text.
- No remote OCR or serverless endpoints are invoked.
- All PDF.js and `pdf-lib` instances exist solely in local client memory.
- Generated Blob URLs (`URL.createObjectURL`) are explicitly tracked and revoked (`URL.revokeObjectURL`) on document unmount or reset to prevent memory leaks.
