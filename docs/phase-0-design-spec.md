# Phase 0 Design Specification — ShipCrop Studio

## 1. Product Vision
**ShipCrop Studio** is a privacy-first, professional SaaS web utility engineered specifically for Indian e-commerce sellers. It solves a daily friction point for sellers operating on platforms such as Meesho, Flipkart, Amazon India, Ajio, Snapdeal, and Myntra: transforming unwieldy, mixed-format multi-order PDF manifests into print-ready **4×6" direct thermal stickers** and organized **A4 multi-label sheets**.

Unlike generic online PDF tools that upload customer data to external servers or require cumbersome desktop installation, ShipCrop Studio is architected as an **in-browser, zero-upload tool** with specialized presets for courier barcodes, invoice splitting, and warehouse SKU sorting.

---

## 2. Target Users
1. **Active E-Commerce Sellers & Warehouse Dispatchers**: Packing 20 to 500+ parcels per day across multiple marketplaces, seeking to eliminate physical scissors, adhesive tape, and paper waste.
2. **Thermal Printer Owners**: Sellers utilizing TVS, Zebra, TSC, Xprinter, Rollo, or similar 203/300 DPI direct thermal printers requiring exact 4×6" (100×150mm) single-sticker rolls.
3. **Small Office / Home Office (SOHO) Sellers**: Sellers utilizing standard A4 laser or inkjet printers who need 4-in-1 or 2-in-1 consolidated label grids to minimize paper and toner usage.
4. **Operations & Finance Managers**: Teams needing clean separation between packaging slips/customer tax invoices for accounting archives and courier shipping stickers for parcel boxes.

---

## 3. Core User Journeys
1. **Discovery & Onboarding**:
   - Seller lands on homepage (`/`), understands immediate value proposition and zero-upload privacy guarantee, and selects their marketplace or clicks "Start Cropping".
2. **Tool Selection**:
   - In `/tools`, seller searches or filters platforms (Meesho, Flipkart, Amazon, Ajio, Myntra, Snapdeal) and launches the dedicated workspace.
3. **Document Ingestion & Preview**:
   - Seller drops an unedited marketplace dispatch PDF into the uploader or tests the layout using the pre-loaded sample PDF.
   - Seller navigates through pages, zooms into barcode sections, and toggles the crop boundary overlay.
4. **Output Configuration**:
   - Seller selects 4×6" Thermal or A4 layout, configures invoice separation, enables SKU sorting, and adjusts calibration margins.
5. **Simulated Processing & Output Acquisition**:
   - Seller triggers the crop action, observes the multi-stage progress indicator, and downloads the formatted PDF package and warehouse picklist.

---

## 4. Information Architecture
```
/
├── / (Landing Page: Hero, Feature Pillars, Marketplace Quick Pick, 3-Step Flow, FAQ, CTAs)
├── /tools (Directory: Search, Category Filters, Responsive Marketplace Cards, Preset Info)
│   └── /tools/[marketplace] (Dedicated Cropper Workspace:
│       ├── Header & Breadcrumbs
│       ├── File Dropzone & Queue
│       ├── Layout & Manifest Settings
│       ├── Real-time Document Preview Canvas (Zoom, Navigation, Overlays)
│       ├── Multi-stage Processing Simulator
│       └── Results Panel & Simulated Downloads)
├── /how-it-works (Detailed 5-Step Workflow, Thermal vs A4 Equipment Guides)
├── /faq (Searchable, Accessible Accordion FAQ covering Security, DPI, Sizing)
└── /privacy (Zero-upload Client-Side Architecture & Network Verification Guide)
```

---

## 5. Design Principles
- **Utilitarian Speed & Reliability**: A tool built for repetitive daily warehouse operations. Clean layouts, zero visual fluff, high-contrast text, and minimal steps between file drop and print.
- **Privacy Transparency**: Prominent visual badges and technical explanation confirming that document data remains exclusively inside local browser memory.
- **Defensive Error Handling**: Clear validation messages when files are missing or formats don't match, with straightforward reset and retry options.
- **Predictable Feedback**: Every interactive control provides immediate visual confirmation (hover, active, focus, disabled, loading).

---

## 6. Visual Design Decisions
- **Color Palette**:
  - *Background*: Soft neutral canvas (`#f8fafc` / `slate-50`) paired with crisp white cards (`#ffffff`).
  - *Text*: Deep slate navy (`#0f172a` / `slate-900`) for headers and readable muted navy (`#475569` / `slate-600`) for body copy.
  - *Primary Accent*: Trustworthy enterprise royal blue (`#2563eb` / `blue-600`), hover (`#1d4ed8`), light background tint (`#eff6ff` / `blue-50`).
  - *Semantic Accents*:
    - Emerald (`#10b981`) for completed status and privacy security guarantees.
    - Amber (`#f59e0b`) for prototype disclaimers and warnings.
    - Rose (`#ef4444`) for errors and destructive queue removal actions.
- **Typography**: Clean system-backed font stack with Geist Sans for high legibility at 11px–14px operational table sizes, and Geist Mono for AWB numbers, SKU codes, and barcodes.
- **Surfaces & Borders**: Subtle borders (`border-slate-200`) and restrained shadows (`shadow-xs` / `shadow-2xs`) to prevent visual clutter in dense warehouse workspaces.

---

## 7. Responsive Behavior
- **Desktop (>= 1024px / ~1440px target)**:
  - Two-column workspace: 5-column left panel (Uploader, Queue, Settings, Actions) and 7-column right panel (PDF Canvas, Zoom Controls, Results).
- **Tablet (768px – 1023px)**:
  - Balanced stacking, expanded touch targets, responsive card grids (2-column).
- **Mobile (375px – 430px)**:
  - Logical single-column vertical stack (Breadcrumbs → Uploader & Queue → Preview Canvas → Settings → Action CTA).
  - Navigation menu converts into an accessible drawer with full touch support.
  - Preview canvas remains scrollable and zoomable with touch friendly buttons.

---

## 8. Accessibility Requirements
- Semantic HTML tags (`<header>`, `<main>`, `<footer>`, `<section>`, `<nav>`, `<button>`, `<label>`).
- Visible `:focus-visible` ring on all interactive elements (`ring-2 ring-blue-600 ring-offset-2`).
- Contrast ratio meeting WCAG 2.1 AA standards (minimum 4.5:1 for body copy).
- Proper ARIA attributes for custom controls (`role="switch"`, `aria-checked`, `role="dialog"`, `aria-modal`, `aria-expanded`).
- Keyboard dismissability (Escape key closes modals; Enter/Space activates toggles).

---

## 9. Features Simulated in Phase 0
- **PDF Upload & Queue Management**: Drag & drop and native file picker simulation with file name, byte size formatting, and queue removal.
- **Interactive Document Canvas**: Real-time canvas simulation showing shipping label headers, simulated 1D barcodes, customer address blocks, and 4×6" dashed crop boundary lines.
- **Layout Selection**: Switching between 4×6" Thermal, A4 4-in-1, and A4 2-in-1 options.
- **Setting Toggles**: Enable/disable label-only crop, invoice separation, SKU sorting, and thermal barcode sharpening.
- **Multi-Stage Processing Flow**: Animated progress bar advancing through 4 realistic operational phases.
- **Results & Download Simulation**: Processed summary reporting label count and page yield with mock download triggers.
