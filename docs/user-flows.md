# User Flows Documentation — ShipCrop Studio

## Overview
This document outlines the user interaction paths, decision points, state transitions, and recovery mechanisms across ShipCrop Studio's Phase 0 interactive prototype.

---

## 1. Landing Page to Marketplace Journey
```mermaid
graph TD
    A["User lands on / (Homepage)"] --> B{"User Intent"}
    B -->|Wants quick start| C["Clicks 'Start Cropping Now' or 'Quick Crop: Meesho'"]
    B -->|Wants to learn workflow| D["Navigates to /how-it-works"]
    B -->|Wants platform options| E["Scrolls to Marketplace Grid"]
    
    C --> F["Navigates to /tools or /tools/meesho"]
    E -->|Selects specific card| G["Navigates to /tools/[marketplace]"]
    D -->|Reviews 5 steps| F
```

### Key UI Touchpoints:
- Primary CTA in Hero section ("Start Cropping Now").
- Top header direct link ("Quick Crop: Meesho").
- Responsive Marketplace Cards with direct "Open Tool" links.

---

## 2. PDF Selection Journey
```mermaid
graph TD
    A["Workspace /tools/[marketplace] Loaded"] --> B{"Input Method"}
    B -->|User drags & drops PDF| C["FileDropzone triggers validateAndAddFiles"]
    B -->|User clicks Browse files| D["Native file input opens (.pdf filter)"]
    B -->|User clicks 'Use Sample'| E["Loads pre-packaged marketplace sample document"]
    
    C --> F{"Validation Check"}
    D --> F
    
    F -->|Non-PDF dropped| G["Display inline error: 'Only PDF documents are supported'"]
    F -->|File > 50MB| H["Display error: 'File exceeds prototype limit of 50MB'"]
    F -->|Valid PDF| I["Append to Selected Files Queue"]
    
    I --> J["Update active document preview on Canvas"]
    I --> K["Enable primary 'Crop & Prepare' CTA button"]
    
    I -->|User clicks trash icon on file row| L["Remove file from queue"]
    L -->|Queue becomes empty| M["Disable primary CTA & reset canvas to empty guide"]
```

---

## 3. Settings & Simulated Processing Journey
```mermaid
graph TD
    A["Document in Queue"] --> B["Review / Adjust Processing Settings"]
    B --> C["Select Output Layout (4x6 Thermal / A4 4-in-1 / A4 2-in-1)"]
    B --> D["Toggle Invoices Separation (On/Off)"]
    B --> E["Toggle SKU Order Sorting (On/Off)"]
    B --> F["Toggle Barcode Sharpening (On/Off)"]
    B --> G["Configure Advanced Margins (0mm, 2mm, 4mm) and DPI (203/300)"]
    
    B --> H["Click 'Crop & Prepare [N] Shipping Labels'"]
    
    H --> I["Start Simulated Processing (Progress Bar Renders)"]
    I --> J["Stage 1 (10%): Reading document structure..."]
    J --> K["Stage 2 (35%): Detecting label boundaries & carrier barcodes..."]
    K --> L["Stage 3 (70%): Cropping 4x6 thermal dimensions..."]
    L --> M["Stage 4 (95%): Finalizing print-ready vector PDF stream..."]
    M --> N["Complete (100%): Render ResultsPanel"]
```

---

## 4. Success, Validation, Failure, and Reset States

### A. Success State:
- Triggered when progress reaches 100%.
- Displays:
  - Green completion badge: "Ready to Print".
  - Metric cards: Total labels count, output layout, invoice split status, SKU picklist status.
  - Primary Action: `Download Cropped Labels (PDF)` (triggers informative toast notification).
  - Secondary Action (if invoice separation enabled): `Download Tax Invoices (PDF)`.
  - Tertiary Action (if SKU sorting enabled): `Download Warehouse Picklist (PDF)`.

### B. Missing File Validation State:
- If user clicks the processing CTA while no file is loaded, an alert banner appears:
  `"Please select or upload at least one shipping label PDF to start cropping."`
- The CTA button is visibly disabled and displays: `"Select a PDF File to Crop"`.

### C. Simulated Failure & Recovery State:
- The ResultsPanel includes a testing trigger: `"Test Failure State"`.
- When clicked, it renders the `ProcessingStatus` error state:
  - Red warning icon.
  - Informative error message: `"Simulated Error: The PDF header was malformed or password-protected."`
  - Recovery button: `"Retry Simulation"` which re-runs the process seamlessly.

### D. Workspace Reset State:
- Triggered by clicking `"Reset Workspace"` in the header, `"Clear All"` in the file queue, or `"Process Another Batch"` in the results panel.
- Action clears:
  - File queue items and active file pointer.
  - Processing progress bar and results panel.
  - Validation and error messages.
  - Restores default marketplace settings (output format, margins, DPI).
