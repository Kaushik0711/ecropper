# ShipCrop Studio (ecropper)

**ShipCrop Studio** is a privacy-first, browser-only shipping label processing and thermal cropping web application built for Indian e-commerce marketplace sellers (Meesho, Flipkart, Amazon, and more).

Inspired by ecropper.in, ShipCrop Studio automates the extraction and thermal-ready cropping of shipping labels into standardized **4 × 6-inch thermal printer pages (288 × 432 pt)** without transmitting any document bytes to remote servers.

---

## Key Features

- **100% Client-Side Processing**: Zero document transmission. All PDF rendering (PDF.js) and vector page embedding (`pdf-lib`) execute entirely in the user's browser.
- **Automatic Label Detection Engine (Phase 2 - Meesho Prototype)**:
  - Local text layout and geometric analysis.
  - Automatic invoice exclusion and stripping.
  - Sequential header partitioning for multi-label pages (e.g. 2-up A4 manifests).
  - Confidence scoring and candidate classification (`accepted`, `suggested`, `rejected`).
- **Interactive Multi-Candidate Crop Overlay**:
  - Drag and resize candidate crop boundaries with 8 SVG handles.
  - Candidate quick actions: Accept, Reject, Delete, Add Manual Box, Accept All, Reject All.
  - Preserved manual cropping mode for uncalibrated marketplace routes.
- **Vector-Preserving Thermal Export**:
  - Crops directly into crisp, vector-preserving 4×6" thermal PDF pages.
  - Supports both portrait (288×432 pt) and landscape (432×288 pt) outputs with uniform aspect-ratio fitting and adjustable safety margins (0–5 mm).
  - Post-generation byte verification checking PDF headers, exact page count, and physical dimensions.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **PDF Engine**: PDF.js (`pdfjs-dist`) with local Web Worker (`/pdf.worker.min.mjs`) & `pdf-lib`
- **Testing**: Node / TSX native test runner

---

## Getting Started

First, install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Running Tests & Verification

```bash
# Run unit and integration tests (45 tests across 16 suites)
npm test

# Run ESLint
npm run lint

# Run Next.js production build
npm run build
```

---

## Documentation

Detailed architectural specifications and engineering notes:
- [`docs/phase-0-design-spec.md`](docs/phase-0-design-spec.md) — Product UI/UX and visual system.
- [`docs/phase-1-pdf-engine.md`](docs/phase-1-pdf-engine.md) — Browser-based PDF rendering, coordinate translation, and vector cropping.
- [`docs/phase-2-label-detection.md`](docs/phase-2-label-detection.md) — Automatic label detection engine and Meesho adapter specifications.
- [`docs/component-inventory.md`](docs/component-inventory.md) — Reusable component and engine inventory.
- [`docs/phase-0-limitations.md`](docs/phase-0-limitations.md) — Technical constraints, boundaries, and transition status.

---

## License

MIT
