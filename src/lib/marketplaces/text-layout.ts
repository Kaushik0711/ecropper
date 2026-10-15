import { TextItemInfo, PageTextLayoutInfo } from './types';
import { PdfCropBoundingBox } from '../pdf/types';

// PDF.js TextContent interfaces for typing without tight browser binding
interface PdfJsTextItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  hasEOL: boolean;
}

interface PdfJsTextContent {
  items: (PdfJsTextItem | unknown)[];
}

interface PageProxyLike {
  getViewport: (options: { scale: number }) => { width: number; height: number; rotation: number };
  getTextContent: () => Promise<PdfJsTextContent>;
}

/**
 * Extracts raw text items with precise PDF user-space coordinates from a PDF.js page.
 */
export async function extractPageTextLayout(
  page: PageProxyLike,
  pageNumber: number
): Promise<PageTextLayoutInfo> {
  const viewport = page.getViewport({ scale: 1.0 });
  const textContent = await page.getTextContent();

  const textItems: TextItemInfo[] = [];

  for (const rawItem of textContent.items) {
    const item = rawItem as PdfJsTextItem;
    if (!item || typeof item.str !== 'string') continue;

    const trimmed = item.str.trim();
    if (!trimmed) continue;

    // In PDF.js transform: [scaleX, skewY, skewX, scaleY, tx, ty]
    // tx = x origin (left), ty = y origin (baseline)
    const transform = item.transform || [1, 0, 0, 1, 0, 0];
    const x = transform[4];
    const y = transform[5];
    const width = Math.max(0, item.width || 0);
    const fontHeight = Math.abs(transform[3]) || item.height || 10;
    const height = Math.max(item.height || 0, fontHeight);

    textItems.push({
      text: item.str,
      x: parseFloat(x.toFixed(2)),
      y: parseFloat(y.toFixed(2)),
      width: parseFloat(width.toFixed(2)),
      height: parseFloat(height.toFixed(2)),
      right: parseFloat((x + width).toFixed(2)),
      top: parseFloat((y + height).toFixed(2)),
    });
  }

  return {
    pageNumber,
    pageWidth: viewport.width,
    pageHeight: viewport.height,
    rotation: viewport.rotation,
    textItems,
    hasTextLayer: textItems.length > 0,
  };
}

/**
 * Calculates the minimal bounding box enclosing an array of text items.
 */
export function computeBoundingBox(items: TextItemInfo[]): PdfCropBoundingBox | null {
  if (items.length === 0) return null;

  let left = Infinity;
  let bottom = Infinity;
  let right = -Infinity;
  let top = -Infinity;

  for (const it of items) {
    if (it.x < left) left = it.x;
    if (it.y < bottom) bottom = it.y;
    if (it.right > right) right = it.right;
    if (it.top > top) top = it.top;
  }

  return {
    left: parseFloat(left.toFixed(2)),
    bottom: parseFloat(bottom.toFixed(2)),
    right: parseFloat(right.toFixed(2)),
    top: parseFloat(top.toFixed(2)),
  };
}

/**
 * Finds text items that match a given regular expression.
 */
export function findTextMatches(items: TextItemInfo[], regex: RegExp): TextItemInfo[] {
  return items.filter((it) => regex.test(it.text));
}

/**
 * Groups text items into vertical bands based on gaps between consecutive items.
 */
export function clusterItemsByVerticalGap(
  items: TextItemInfo[],
  gapThresholdPt: number = 35
): TextItemInfo[][] {
  if (items.length === 0) return [];

  // Sort items from top of the page downward (PDF y decreases downward)
  const sorted = [...items].sort((a, b) => b.y - a.y);
  const clusters: TextItemInfo[][] = [];
  let currentCluster: TextItemInfo[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    // Gap between the bottom of previous item and top of current item
    const gap = prev.y - curr.top;

    if (gap > gapThresholdPt) {
      clusters.push(currentCluster);
      currentCluster = [curr];
    } else {
      currentCluster.push(curr);
    }
  }

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  return clusters;
}
