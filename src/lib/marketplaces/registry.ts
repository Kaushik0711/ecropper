import { MarketplaceAdapter } from './types';
import { meeshoAdapter } from './meesho';

// Generic fallback adapter for marketplaces without an automatic detector implementation
function createManualOnlyAdapter(id: string, name: string): MarketplaceAdapter {
  return {
    id,
    name,
    isVerified: false,
    rulesVersion: '0.1.0-manual-only',
    supportedDetectionMethods: ['manual'],
    supportedOutputFormats: ['thermal-4x6', 'a4-single'],
    requiredRegressionFixtures: [],
    minConfidenceThreshold: 1.0,
    knownLimitations: [
      `Automatic detection for ${name} is not yet implemented. Manual crop selection is fully supported.`,
    ],
    detectLabels: async () => [],
  };
}

const ADAPTER_REGISTRY: Record<string, MarketplaceAdapter> = {
  meesho: meeshoAdapter,
  flipkart: createManualOnlyAdapter('flipkart', 'Flipkart'),
  amazon: createManualOnlyAdapter('amazon', 'Amazon'),
  ajio: createManualOnlyAdapter('ajio', 'Ajio'),
  myntra: createManualOnlyAdapter('myntra', 'Myntra'),
  snapdeal: createManualOnlyAdapter('snapdeal', 'Snapdeal'),
};

/**
 * Returns the registered adapter for a given marketplace ID.
 */
export function getMarketplaceAdapter(marketplaceId: string): MarketplaceAdapter | undefined {
  if (!marketplaceId) return undefined;
  return ADAPTER_REGISTRY[marketplaceId.toLowerCase()];
}

/**
 * Returns whether automatic detection is supported by an adapter for the given marketplace.
 */
export function isAutomaticDetectionSupported(marketplaceId: string): boolean {
  const adapter = getMarketplaceAdapter(marketplaceId);
  if (!adapter) return false;
  return adapter.supportedDetectionMethods.includes('marketplace-rules') ||
    adapter.supportedDetectionMethods.includes('text-layout');
}

/**
 * Returns whether a marketplace adapter has been verified against live seller PDF manifests.
 */
export function isMarketplaceVerified(marketplaceId: string): boolean {
  const adapter = getMarketplaceAdapter(marketplaceId);
  return adapter?.isVerified ?? false;
}

/**
 * Returns all registered adapters.
 */
export function getAllAdapters(): MarketplaceAdapter[] {
  return Object.values(ADAPTER_REGISTRY);
}
