/**
 * LiveSourceAdapter Abstract Base Class
 * 
 * Defines the common contract and standard lifecycle for all live data sources
 * (APIs, feeds, and permitted extraction mechanisms).
 * 
 * Downstream engines (matching, trend analysis, recommendations, deals, alerts)
 * rely on the normalized output produced by instances of this class.
 */

export const SOURCE_TYPES = {
  API: 'API',
  FEED: 'FEED',
  PERMITTED_SCRAPE: 'PERMITTED_SCRAPE',
};

export const SOURCE_STATUS = {
  CONFIGURED: 'CONFIGURED',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  READY: 'READY',
  RATE_LIMITED: 'RATE_LIMITED',
  AUTH_FAILED: 'AUTH_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  MALFORMED_RESPONSE: 'MALFORMED_RESPONSE',
  UNSUPPORTED_OPERATION: 'UNSUPPORTED_OPERATION',
  ERROR: 'ERROR',
};

export class LiveSourceAdapter {
  /**
   * @param {string} sourceName Identifier slug (e.g., 'amazon', 'flipkart')
   * @param {string} platformName Human-readable name (e.g., 'Amazon', 'Flipkart')
   * @param {string} sourceType One of SOURCE_TYPES ('API', 'FEED', 'PERMITTED_SCRAPE')
   */
  constructor(sourceName, platformName, sourceType = SOURCE_TYPES.API) {
    if (new.target === LiveSourceAdapter) {
      throw new TypeError('Cannot construct LiveSourceAdapter instances directly; must be extended.');
    }

    if (!sourceName || typeof sourceName !== 'string') {
      throw new Error('sourceName must be a non-empty string.');
    }

    if (!platformName || typeof platformName !== 'string') {
      throw new Error('platformName must be a non-empty string.');
    }

    if (!Object.values(SOURCE_TYPES).includes(sourceType)) {
      throw new Error(`Invalid sourceType: "${sourceType}". Allowed: ${Object.values(SOURCE_TYPES).join(', ')}`);
    }

    this.sourceName = sourceName.toLowerCase().trim();
    this.platformName = platformName.trim();
    this.sourceType = sourceType;
  }

  /**
   * Returns canonical source identifier (e.g. 'amazon')
   * @returns {string}
   */
  getSourceName() {
    return this.sourceName;
  }

  /**
   * Returns human-readable platform name (e.g. 'Amazon')
   * @returns {string}
   */
  getPlatformName() {
    return this.platformName;
  }

  /**
   * Returns data source type ('API', 'FEED', 'PERMITTED_SCRAPE')
   * @returns {string}
   */
  getSourceType() {
    return this.sourceType;
  }

  /**
   * Whether this adapter represents a live data connector
   * @returns {boolean}
   */
  supportsLiveData() {
    return true;
  }

  /**
   * Checks whether the adapter is properly configured with credentials / environment
   * @returns {boolean}
   */
  isConfigured() {
    throw new Error(`isConfigured() must be implemented by subclass '${this.constructor.name}'.`);
  }

  /**
   * Searches the live source for listings matching query
   * @param {string} query Search query string
   * @param {Object} options Options such as limit, category, etc.
   * @returns {Promise<Object>} Standard source result object { source, sourceType, status, collectedAt, results, error }
   */
  async search(query, options = {}) {
    throw new Error(`search(query, options) must be implemented by subclass '${this.constructor.name}'.`);
  }

  /**
   * Fetches single product / item details by ID where supported
   * @param {string} productId Source item identifier (e.g. ASIN)
   * @param {Object} options Additional options
   * @returns {Promise<Object>}
   */
  async getProduct(productId, options = {}) {
    return {
      source: this.sourceName,
      sourceType: this.sourceType,
      status: SOURCE_STATUS.UNSUPPORTED_OPERATION,
      collectedAt: new Date().toISOString(),
      results: [],
      error: `Single product lookup is not supported by source '${this.sourceName}'.`,
    };
  }

  /**
   * Quick, non-expensive health check verifying configuration and availability
   * @returns {Promise<Object>} Health check report
   */
  async healthCheck() {
    const configured = this.isConfigured();
    return {
      source: this.sourceName,
      platform: this.platformName,
      sourceType: this.sourceType,
      configured,
      available: configured,
      status: configured ? SOURCE_STATUS.READY : SOURCE_STATUS.NOT_CONFIGURED,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  /**
   * Normalizes raw source items into standard normalized listings
   * @param {Array<Object>|Object} rawResult
   * @param {string} timestamp
   * @returns {Array<Object>}
   */
  normalize(rawResult, timestamp = new Date().toISOString()) {
    throw new Error(`normalize(rawResult) must be implemented by subclass '${this.constructor.name}'.`);
  }
}
