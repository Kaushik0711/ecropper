import { MarketplaceAdapter, PageTextLayoutInfo, DetectedLabel, TextItemInfo } from './types';
import {
  computeBoundingBox,
  findTextMatches,
} from './text-layout';
import { padAndClampBoundingBox, filterAndScoreCandidates } from './detection-validation';

export const MEESHO_ADAPTER_RULES_VERSION = '0.2.0-unverified';

// Anchor regex patterns
const PATTERN_MEESHO = /meesho/i;
const PATTERN_AWB = /awb[:\s#]|tracking[:\s#]|pkg-ref/i;
const PATTERN_COURIER = /courier|express|shadowfax|delhivery|ecom express|xpressbees/i;
const PATTERN_DELIVERY = /ship to|deliver to|consignee|customer order/i;
const PATTERN_RETURN = /return if undelivered|return address|seller logistics/i;
const PATTERN_INVOICE = /tax invoice|customer tax invoice|packing slip|invoice no|gstin|hsn/i;

export const meeshoAdapter: MarketplaceAdapter = {
  id: 'meesho',
  name: 'Meesho',
  isVerified: false, // Explicitly unverified until genuine seller PDF manifests are tested
  rulesVersion: MEESHO_ADAPTER_RULES_VERSION,
  supportedDetectionMethods: ['text-layout', 'marketplace-rules', 'manual'],
  supportedOutputFormats: ['thermal-4x6', 'a4-single'],
  requiredRegressionFixtures: ['synthetic-meesho-manifest.pdf'],
  minConfidenceThreshold: 0.7,
  knownLimitations: [
    'Unverified experimental adapter calibrated against synthetic Meesho layouts; pending genuine seller manifest sample calibration.',
    'Scanned image-only PDFs lack extractable text and require manual crop selection.',
    'Customer invoice stripping is supported via bounding exclusion; separate invoice PDF download is scheduled for Phase 3.',
  ],

  async detectLabels(
    pageInfo: PageTextLayoutInfo
  ): Promise<DetectedLabel[]> {
    const { textItems, pageWidth, pageHeight, pageNumber } = pageInfo;

    if (!pageInfo.hasTextLayer || textItems.length === 0) {
      return [];
    }

    const candidates: DetectedLabel[] = [];

    // 1. Identify invoice items (to establish lower boundary exclusion)
    const invoiceItems = findTextMatches(textItems, PATTERN_INVOICE);
    let invoiceTopBoundary = 0;

    if (invoiceItems.length > 0) {
      const invoiceBox = computeBoundingBox(invoiceItems);
      if (invoiceBox) {
        invoiceTopBoundary = invoiceBox.top;
      }
    }

    // 2. Separate shipping label items from invoice items
    // In Meesho manifests, the shipping label is placed above the invoice
    const labelItems = invoiceTopBoundary > 0
      ? textItems.filter((it) => it.y > invoiceTopBoundary - 10)
      : textItems;

    if (labelItems.length === 0) {
      return [];
    }

    // 3. Group label items into distinct shipping label blocks by detecting sequential label headers
    const sorted = [...labelItems].sort((a, b) => b.y - a.y);
    const clusters: TextItemInfo[][] = [];
    let currentCluster: TextItemInfo[] = [];
    let currentHeaderY: number | null = null;

    for (const item of sorted) {
      const isHeader = PATTERN_AWB.test(item.text) || PATTERN_COURIER.test(item.text) || PATTERN_MEESHO.test(item.text);

      if (isHeader) {
        if (currentHeaderY === null) {
          currentHeaderY = item.y;
          currentCluster.push(item);
        } else if (currentHeaderY - item.y > 150) {
          // This header is at least 150pt below the start of the previous label -> start of a new label!
          if (currentCluster.length > 0) {
            clusters.push(currentCluster);
          }
          currentCluster = [item];
          currentHeaderY = item.y;
        } else {
          // Sub-header or adjacent header within the same label block
          currentCluster.push(item);
        }
      } else {
        currentCluster.push(item);
      }
    }

    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    let clusterIndex = 1;
    for (const cluster of clusters) {
      // Must contain at least 2 text items to be considered a label candidate
      if (cluster.length < 2) continue;

      const clusterBox = computeBoundingBox(cluster);
      if (!clusterBox) continue;

      // Match anchors inside this cluster
      const hasMeesho = cluster.some((it) => PATTERN_MEESHO.test(it.text));
      const hasAwb = cluster.some((it) => PATTERN_AWB.test(it.text));
      const hasCourier = cluster.some((it) => PATTERN_COURIER.test(it.text));
      const hasDelivery = cluster.some((it) => PATTERN_DELIVERY.test(it.text));
      const hasReturn = cluster.some((it) => PATTERN_RETURN.test(it.text));

      // Calculate confidence
      let confidence = 0.2;
      const reasons: string[] = [];

      if (hasMeesho) {
        confidence += 0.35;
        reasons.push('Matched Meesho brand/order anchor');
      }
      if (hasAwb) {
        confidence += 0.25;
        reasons.push('Matched AWB/Tracking code anchor');
      }
      if (hasCourier) {
        confidence += 0.15;
        reasons.push('Matched Courier dispatch routing header');
      }
      if (hasDelivery) {
        confidence += 0.15;
        reasons.push('Matched Consignee/Delivery address block');
      }
      if (hasReturn) {
        confidence += 0.05;
        reasons.push('Matched Seller return address anchor');
      }
      if (invoiceTopBoundary > 0) {
        confidence += 0.05;
        reasons.push('Successfully excluded customer tax invoice portion');
      }

      // If neither AWB nor Delivery address nor Meesho anchor is found, reject cluster
      if (!hasAwb && !hasDelivery && !hasMeesho) {
        continue;
      }

      confidence = Math.min(0.95, parseFloat(confidence.toFixed(2)));

      // Add safety padding (12 pt) around text items for barcode and borders
      const paddedBounds = padAndClampBoundingBox(clusterBox, 12, pageWidth, pageHeight);

      // Warning indicators
      const warnings: string[] = [];
      if (!meeshoAdapter.isVerified) {
        warnings.push('Unverified experimental detection — please verify crop boundaries.');
      }
      if (!hasAwb) {
        warnings.push('No explicit AWB barcode text anchor identified.');
      }
      if (confidence < meeshoAdapter.minConfidenceThreshold) {
        warnings.push('Low confidence score; candidate requires manual confirmation.');
      }

      const status = confidence >= meeshoAdapter.minConfidenceThreshold ? 'accepted' : 'suggested';

      candidates.push({
        id: `p${pageNumber}-label-${clusterIndex}`,
        pageNumber,
        bounds: paddedBounds,
        confidence,
        method: 'marketplace-rules',
        status,
        reasons,
        warnings,
        labelIndex: clusterIndex,
      });

      clusterIndex++;
    }

    return filterAndScoreCandidates(candidates, pageWidth, pageHeight);
  },
};
