import { AmazonAdapter } from './adapters/amazon.adapter.js';
import { FlipkartAdapter } from './adapters/flipkart.adapter.js';
import { CromaAdapter } from './adapters/croma.adapter.js';
import { BlinkitAdapter } from './adapters/blinkit.adapter.js';
import { ZeptoAdapter } from './adapters/zepto.adapter.js';
import { InstamartAdapter } from './adapters/instamart.adapter.js';

export { BaseAdapter } from './adapters/base.adapter.js';
export { AmazonAdapter } from './adapters/amazon.adapter.js';
export { FlipkartAdapter } from './adapters/flipkart.adapter.js';
export { CromaAdapter } from './adapters/croma.adapter.js';
export { BlinkitAdapter } from './adapters/blinkit.adapter.js';
export { ZeptoAdapter } from './adapters/zepto.adapter.js';
export { InstamartAdapter } from './adapters/instamart.adapter.js';
export { collectionService } from './collection.service.js';
export { normalizer } from './normalizer.js';

// Phase 8.5.1 & 8.5.2 Live Data Acquisition Exports
export { LiveSourceAdapter, SOURCE_TYPES, SOURCE_STATUS } from './adapters/liveSource.adapter.js';
export { AmazonLiveAdapter } from './adapters/amazon.liveAdapter.js';
export { QuickCommerceLiveAdapter, QUICKCOMMERCE_SUPPORTED_PLATFORMS } from './adapters/quickcommerce.liveAdapter.js';
export { liveNormalizer } from './liveNormalizer.js';
export { LiveSourceManager, liveSourceManager } from './liveSourceManager.js';

/**
 * Adapter Registry mapping storeId to adapter instances
 */
export const ADAPTER_REGISTRY = {
  amazon: new AmazonAdapter(),
  flipkart: new FlipkartAdapter(),
  croma: new CromaAdapter(),
  blinkit: new BlinkitAdapter(),
  zepto: new ZeptoAdapter(),
  instamart: new InstamartAdapter(),
};

export const SUPPORTED_PLATFORM_IDS = Object.keys(ADAPTER_REGISTRY);

/**
 * Get adapter instances for requested platform IDs
 * @param {Array<string>} requestedPlatforms Optional list of platform IDs
 * @returns {Array<BaseAdapter>}
 */
export const getAdapters = (requestedPlatforms = []) => {
  if (!requestedPlatforms || requestedPlatforms.length === 0) {
    return Object.values(ADAPTER_REGISTRY);
  }

  return requestedPlatforms
    .map((id) => ADAPTER_REGISTRY[id.toLowerCase().trim()])
    .filter(Boolean);
};
