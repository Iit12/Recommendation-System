import { getAdapters, SUPPORTED_PLATFORM_IDS } from './index.js';
import { normalizer } from './normalizer.js';

export const collectionService = {
  /**
   * Collects listings across requested platform adapters in parallel
   * 
   * @param {string} query Search query term
   * @param {Array<string>} platformFilter Optional list of platform IDs
   * @returns {Promise<Object>} Unified collection result
   */
  async collectListings(query, platformFilter = []) {
    const startTime = Date.now();
    const cleanQuery = String(query || '').trim();
    const timestamp = new Date().toISOString();

    const selectedPlatforms = platformFilter && platformFilter.length > 0
      ? platformFilter.map((p) => p.toLowerCase().trim())
      : SUPPORTED_PLATFORM_IDS;

    const adaptersToRun = getAdapters(selectedPlatforms);

    const platformsRequested = adaptersToRun.map((a) => a.getStoreId());
    const platformsSuccessful = [];
    const allRawListings = [];

    // Execute collection across all selected adapters in parallel with per-platform fault isolation
    const collectionTasks = adaptersToRun.map(async (adapter) => {
      const platformStart = Date.now();
      const storeId = adapter.getStoreId();
      const platformName = adapter.getPlatformName();

      try {
        const rawResults = await adapter.search(cleanQuery);
        const duration = Date.now() - platformStart;

        console.log(
          `[Collector] ${platformName} (${storeId}) -> SUCCESS (${rawResults.length} listings in ${duration}ms) for query: "${cleanQuery}"`
        );

        platformsSuccessful.push(storeId);
        return rawResults;
      } catch (adapterError) {
        const duration = Date.now() - platformStart;
        console.error(
          `[Collector] ${platformName} (${storeId}) -> FAILED in ${duration}ms:`,
          adapterError.message
        );
        // Do not throw; return empty list to allow remaining adapters to complete
        return [];
      }
    });

    const resultsByPlatform = await Promise.all(collectionTasks);

    for (const platformListings of resultsByPlatform) {
      if (Array.isArray(platformListings)) {
        allRawListings.push(...platformListings);
      }
    }

    // Normalize and deduplicate
    const normalizedListings = normalizer.normalizeBatch(allRawListings, timestamp);
    const totalDuration = Date.now() - startTime;

    console.log(
      `[CollectionService] Completed query: "${cleanQuery}" | Total: ${normalizedListings.length} listings from ${platformsSuccessful.length}/${platformsRequested.length} platforms in ${totalDuration}ms`
    );

    return {
      query: cleanQuery,
      collectedAt: timestamp,
      platformsRequested,
      platformsSuccessful,
      totalListings: normalizedListings.length,
      listings: normalizedListings,
    };
  }
};
