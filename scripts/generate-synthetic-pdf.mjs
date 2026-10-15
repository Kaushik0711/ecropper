import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'node:fs';
import path from 'node:path';

async function generateSamplePdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4 pt
  const pageHeight = 841.89; // A4 pt

  // ========================================================
  // 1. Standard Synthetic Manifest (2 pages, 1 label per page)
  // ========================================================
  for (let pageNum = 1; pageNum <= 2; pageNum++) {
    const page = doc.addPage([pageWidth, pageHeight]);

    // Border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: pageWidth - 40,
      height: pageHeight - 40,
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 1,
    });

    // Marketplace Header
    page.drawText(`SAMPLE E-COMMERCE DISPATCH MANIFEST — BATCH #${pageNum}`, {
      x: 40,
      y: pageHeight - 50,
      size: 12,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.2),
    });

    page.drawText(`Page ${pageNum} of 2 — Non-sensitive Synthetic Test Document`, {
      x: 40,
      y: pageHeight - 65,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Label 1 box
    const labelX = 40;
    const labelY = pageHeight - 470;
    const labelW = 280;
    const labelH = 390;

    page.drawRectangle({
      x: labelX,
      y: labelY,
      width: labelW,
      height: labelH,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
      color: rgb(0.98, 0.98, 0.98),
    });

    // Label Header
    page.drawRectangle({
      x: labelX,
      y: labelY + labelH - 35,
      width: labelW,
      height: 35,
      color: rgb(0.1, 0.1, 0.2),
    });

    page.drawText('EXPRESS COURIER DISPATCH', {
      x: labelX + 15,
      y: labelY + labelH - 22,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(`PKG-REF-${pageNum}0942`, {
      x: labelX + labelW - 90,
      y: labelY + labelH - 22,
      size: 10,
      font: fontBold,
      color: rgb(1, 0.8, 0.2),
    });

    // Barcode line
    const barcodeY = labelY + labelH - 95;
    page.drawRectangle({
      x: labelX + 15,
      y: barcodeY,
      width: labelW - 30,
      height: 45,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });

    page.drawText(`AWB: 9840291048${pageNum} | ROUTE: DEL/NOIDA`, {
      x: labelX + 25,
      y: barcodeY - 12,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Consignee
    page.drawText('SHIP TO / DELIVER TO:', {
      x: labelX + 15,
      y: labelY + 220,
      size: 9,
      font: fontBold,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(`Customer Order #${1000 + pageNum}`, {
      x: labelX + 15,
      y: labelY + 205,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText('Sector 62, Commercial Corridor, Noida', {
      x: labelX + 15,
      y: labelY + 190,
      size: 9,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText('Uttar Pradesh - 201301, India', {
      x: labelX + 15,
      y: labelY + 175,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Return
    page.drawText('Return if undelivered to: Seller Logistics Hub, Warehouse 4B', {
      x: labelX + 15,
      y: labelY + 20,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Invoice section (lower)
    const invoiceY = labelY - 320;
    page.drawRectangle({
      x: labelX,
      y: invoiceY,
      width: labelW + 220,
      height: 290,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });

    page.drawText(`CUSTOMER TAX INVOICE & PACKING SLIP — ORDER #${1000 + pageNum}`, {
      x: labelX + 15,
      y: invoiceY + 270,
      size: 10,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText('This lower packing slip portion will be excluded when thermal cropping is applied.', {
      x: labelX + 15,
      y: invoiceY + 250,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const standardBytes = await doc.save();

  // ========================================================
  // 2. Synthetic Meesho Manifest (2 pages, with Meesho anchors)
  // ========================================================
  const meeshoDoc = await PDFDocument.create();
  const mFont = await meeshoDoc.embedFont(StandardFonts.Helvetica);
  const mFontBold = await meeshoDoc.embedFont(StandardFonts.HelveticaBold);

  for (let pageNum = 1; pageNum <= 2; pageNum++) {
    const page = meeshoDoc.addPage([pageWidth, pageHeight]);

    // Top shipping label box: x: 35, y: 440, w: 290, h: 360
    const lx = 35;
    const ly = 440;
    const lw = 290;
    const lh = 360;

    page.drawRectangle({
      x: lx,
      y: ly,
      width: lw,
      height: lh,
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 1.5,
    });

    page.drawText('MEESHO SHIPPING LABEL', {
      x: lx + 12,
      y: ly + lh - 25,
      size: 11,
      font: mFontBold,
      color: rgb(0.8, 0.1, 0.4),
    });

    page.drawText('Ordered through Meesho | Express Air', {
      x: lx + 12,
      y: ly + lh - 40,
      size: 8,
      font: mFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(`AWB: MSH-EXPRESS-99201${pageNum}`, {
      x: lx + 12,
      y: ly + lh - 65,
      size: 10,
      font: mFontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText('SHIP TO / DELIVER TO:', {
      x: lx + 12,
      y: ly + lh - 100,
      size: 8,
      font: mFontBold,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText(`Recipient Customer #${pageNum}`, {
      x: lx + 12,
      y: ly + lh - 118,
      size: 10,
      font: mFontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText('House 42, Green Park Avenue, Bangalore, Karnataka - 560001', {
      x: lx + 12,
      y: ly + lh - 135,
      size: 8,
      font: mFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`SKU: MSH-DRESS-BLUE-L (Qty: 1)`, {
      x: lx + 12,
      y: ly + lh - 170,
      size: 9,
      font: mFontBold,
      color: rgb(0.1, 0.3, 0.6),
    });

    page.drawText('Return Address: Fashion Hub, Plot 12, Ind Area, Surat, GJ', {
      x: lx + 12,
      y: ly + 15,
      size: 7.5,
      font: mFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Bottom Half: Customer Tax Invoice
    const ix = 35;
    const iy = 40;
    const iw = 525;
    const ih = 360;

    page.drawRectangle({
      x: ix,
      y: iy,
      width: iw,
      height: ih,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });

    page.drawText('CUSTOMER TAX INVOICE — MEESHO RESELLER ORDER', {
      x: ix + 15,
      y: iy + ih - 25,
      size: 10,
      font: mFontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Invoice No: INV-MSH-${202600 + pageNum} | Date: 15-Oct-2026`, {
      x: ix + 15,
      y: iy + ih - 45,
      size: 8,
      font: mFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText('HSN / SAC: 6204 | GSTIN: 24AAAAA0000A1Z5 | Total: INR 499.00', {
      x: ix + 15,
      y: iy + ih - 65,
      size: 8,
      font: mFont,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  const meeshoBytes = await meeshoDoc.save();

  // ========================================================
  // 3. Synthetic 2-Up Multi-Label Manifest (2 labels on 1 page)
  // ========================================================
  const multiDoc = await PDFDocument.create();
  const muFont = await multiDoc.embedFont(StandardFonts.Helvetica);
  const muFontBold = await multiDoc.embedFont(StandardFonts.HelveticaBold);

  const muPage = multiDoc.addPage([pageWidth, pageHeight]);

  // Top Label (Label 1): y: 440..800
  muPage.drawRectangle({
    x: 40,
    y: 440,
    width: 280,
    height: 360,
    borderColor: rgb(0.1, 0.1, 0.1),
    borderWidth: 1.5,
  });

  muPage.drawText('LABEL 1 - COURIER EXPRESS DISPATCH', {
    x: 55,
    y: 775,
    size: 10,
    font: muFontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  muPage.drawText('AWB: 111122223333 | Routing: BLR/NORTH', {
    x: 55,
    y: 750,
    size: 9,
    font: muFontBold,
    color: rgb(0, 0, 0),
  });

  muPage.drawText('SHIP TO: John Doe, 12 Elm Street, Bangalore', {
    x: 55,
    y: 700,
    size: 9,
    font: muFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  muPage.drawText('Return Address: Logistics Hub 1, Bengaluru', {
    x: 55,
    y: 455,
    size: 7.5,
    font: muFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Bottom Label (Label 2): y: 50..410
  muPage.drawRectangle({
    x: 40,
    y: 50,
    width: 280,
    height: 360,
    borderColor: rgb(0.1, 0.1, 0.1),
    borderWidth: 1.5,
  });

  muPage.drawText('LABEL 2 - COURIER EXPRESS DISPATCH', {
    x: 55,
    y: 385,
    size: 10,
    font: muFontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  muPage.drawText('AWB: 444455556666 | Routing: DEL/SOUTH', {
    x: 55,
    y: 360,
    size: 9,
    font: muFontBold,
    color: rgb(0, 0, 0),
  });

  muPage.drawText('SHIP TO: Jane Smith, 88 Pine Road, New Delhi', {
    x: 55,
    y: 310,
    size: 9,
    font: muFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  muPage.drawText('Return Address: Logistics Hub 2, Delhi', {
    x: 55,
    y: 65,
    size: 7.5,
    font: muFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  const multiBytes = await multiDoc.save();

  // ========================================================
  // 4. Scanned / Image-Only PDF (Zero Text Items)
  // ========================================================
  const scannedDoc = await PDFDocument.create();
  const scPage = scannedDoc.addPage([pageWidth, pageHeight]);
  // Draw only rectangles, no text
  scPage.drawRectangle({
    x: 50,
    y: 400,
    width: 280,
    height: 380,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(0.3, 0.3, 0.3),
    borderWidth: 1,
  });
  const scannedBytes = await scannedDoc.save();

  // Write files
  const publicSamplesDir = path.resolve('public/samples');
  const testsFixturesDir = path.resolve('tests/fixtures');
  fs.mkdirSync(publicSamplesDir, { recursive: true });
  fs.mkdirSync(testsFixturesDir, { recursive: true });

  fs.writeFileSync(path.join(publicSamplesDir, 'sample-shipping-manifest.pdf'), standardBytes);
  fs.writeFileSync(path.join(testsFixturesDir, 'synthetic-test-labels.pdf'), standardBytes);
  fs.writeFileSync(path.join(testsFixturesDir, 'synthetic-meesho-manifest.pdf'), meeshoBytes);
  fs.writeFileSync(path.join(testsFixturesDir, 'synthetic-2up-manifest.pdf'), multiBytes);
  fs.writeFileSync(path.join(testsFixturesDir, 'synthetic-scanned-manifest.pdf'), scannedBytes);

  console.log('Successfully generated all synthetic test PDF fixtures:');
  console.log(' - standard test labels (2 pages)');
  console.log(' - meesho manifest (2 pages with meesho anchors)');
  console.log(' - 2-up multi-label manifest (2 labels on 1 page)');
  console.log(' - scanned manifest (0 text items)');
}

generateSamplePdf().catch((err) => {
  console.error('Failed to generate sample PDFs:', err);
  process.exit(1);
});
