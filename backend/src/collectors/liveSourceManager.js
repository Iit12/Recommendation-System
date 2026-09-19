/**
 * Live Source Manager
 * 
 * Coordinates multi-source live data acquisition across registered LiveSourceAdapter instances.
 * Guarantees per-source fault isolation, source attribution preservation,
 * and strict separation between live and mock modes.
 */

import { SOURCE_STATUS } from './adapters/liveSource.adapter.js';
import { AmazonLiveAdapter } from './adapters/amazon.liveAdapter.js';
import { QuickCommerceLiveAdapter } from './adapters/quickcommerce.liveAdapter.js';

export class LiveSourceManager {
  /**
   * @param {Object} options Configuration options
   */
  constructor(options = {}) {
    this.adapters = new Map();
    this.mode = options.mode || process.env.DATA_SOURCE_MODE || 'mock';

    // Auto-register default live adapters
    this.registerAdapter(new AmazonLiveAdapter());
    this.registerAdapter(new QuickCommerceLiveAdapter());
  }

  /**
   * Register a live source adapter
   * @param {LiveSourceAdapter} adapter
   */
  registerAdapter(adapter) {
    if (!adapter || typeof adapter.getSourceName !== 'function') {
      throw new Error('Adapter must implement LiveSourceAdapter interface.');
    }
    const sourceName = adapter.getSourceName();
    this.adapters.set(sourceName, adapter);
  }

  /**
   * Unregister an adapter by source name
   * @param {string} sourceName
   */
  unregisterAdapter(sourceName) {
    this.adapters.delete(sourceName.toLowerCase().trim());
  }

  /**
   * Get registered adapter by source name
   * @param {string} sourceName
   * @returns {LiveSourceAdapter|null}
   */
  getAdapter(sourceName) {
    return this.adapters.get(sourceName.toLowerCase().trim()) || null;
  }

  /**
   * Returns list of registered source names
   * @returns {Array<string>}
   */
  getRegisteredSourceNames() {
    return Array.from(this.adapters.keys());
  }

  /**
   * Executes a live search across requested sources with strict fault isolation
   * 
   * @param {string} query Search query string
   * @param {Object} options Options: { sources: Array<string>, limit: number }
   * @returns {Promise<Object>} Aggregated live search result
   */
  async search(query, options = {}) {
    const cleanQuery = String(query || '').trim();
    const timestamp = new Date().toISOString();

    // Determine target sources
    const requestedSources = (options.sources && Array.isArray(options.sources) && options.sources.length > 0)
      ? options.sources.map((s) => String(s).toLowerCase().trim())
      : this.getRegisteredSourceNames();

    const targetAdapters = requestedSources
      .map((name) => this.adapters.get(name))
      .filter(Boolean);

    const successfulSources = [];
    const failedSources = [];
    const sourcesSummary = {};
    const aggregatedResults = [];

    // If requested source is completely unknown
    for (const reqName of requestedSources) {
      if (!this.adapters.has(reqName)) {
        failedSources.push(reqName);
        sourcesSummary[reqName] = {
          source: reqName,
          platform: reqName,
          sourceType: 'UNKNOWN',
          status: SOURCE_STATUS.ERROR,
          collectedAt: timestamp,
          resultsCount: 0,
          results: [],
          error: `Source '${reqName}' is not registered in LiveSourceManager.`,
        };
      }
    }

    // Execute searches across all valid adapters in parallel with per-source isolation
    const searchTasks = targetAdapters.map(async (adapter) => {
      const sourceName = adapter.getSourceName();
      try {
        const sourceResult = await adapter.search(cleanQuery, options);
        const results = Array.isArray(sourceResult.results) ? sourceResult.results : [];

        sourcesSummary[sourceName] = {
          source: sourceName,
          platform: adapter.getPlatformName(),
          sourceType: adapter.getSourceType(),
          status: sourceResult.status || SOURCE_STATUS.READY,
          collectedAt: sourceResult.collectedAt || timestamp,
          resultsCount: results.length,
          results,
          error: sourceResult.error || null,
        };

        if (sourceResult.status === SOURCE_STATUS.READY) {
          successfulSources.push(sourceName);
          aggregatedResults.push(...results);
        } else {
          failedSources.push(sourceName);
        }
      } catch (unhandledErr) {
        // Prevent any adapter crash from affecting the entire search
        failedSources.push(sourceName);
        sourcesSummary[sourceName] = {
          source: sourceName,
          platform: adapter.getPlatformName(),
          sourceType: adapter.getSourceType(),
          status: SOURCE_STATUS.ERROR,
          collectedAt: timestamp,
          resultsCount: 0,
          results: [],
          error: `Source execution failed unexpectedly: ${unhandledErr.message}`,
        };
      }
    });

    await Promise.all(searchTasks);

    return {
      query: cleanQuery,
      mode: 'live',
      requestedSources,
      successfulSources,
      failedSources,
      totalListings: aggregatedResults.length,
      results: aggregatedResults,
      sources: sourcesSummary,
      collectedAt: timestamp,
    };
  }

  /**
   * Health check for all registered live sources
   * @returns {Promise<Object>}
   */
  async healthCheckAll() {
    const timestamp = new Date().toISOString();
    const sourcesHealth = {};
    let allConfigured = true;
    let anyConfigured = false;

    for (const [sourceName, adapter] of this.adapters.entries()) {
      try {
        const health = await adapter.healthCheck();
        sourcesHealth[sourceName] = health;
        if (health.configured) {
          anyConfigured = true;
        } else {
          allConfigured = false;
        }
      } catch (err) {
        sourcesHealth[sourceName] = {
          source: sourceName,
          platform: adapter.getPlatformName(),
          sourceType: adapter.getSourceType(),
          configured: false,
          available: false,
          status: SOURCE_STATUS.ERROR,
          error: 'Health check failed',
          lastCheckedAt: timestamp,
        };
        allConfigured = false;
      }
    }

    return {
      status: anyConfigured ? (allConfigured ? 'HEALTHY' : 'DEGRADED') : 'NOT_CONFIGURED',
      mode: this.mode,
      totalSources: this.adapters.size,
      configuredCount: Object.values(sourcesHealth).filter((s) => s.configured).length,
      sources: sourcesHealth,
      checkedAt: timestamp,
    };
  }
}

// Global Singleton Instance
export const liveSourceManager = new LiveSourceManager();
