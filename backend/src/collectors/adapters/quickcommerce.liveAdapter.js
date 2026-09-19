/**
 * QuickCommerce Live API Adapter
 * 
 * Production-ready live data connector for the QuickCommerce API (api.quickcommerceapi.com).
 * Supports real-time product search across Indian quick commerce & marketplace platforms
 * (Blinkit, Zepto, Swiggy Instamart, BigBasket, DMart, JioMart, Flipkart Minutes, Amazon, Flipkart, etc.).
 * 
 * Adheres to LiveSourceAdapter contract with zero secret exposure, strict non-fabrication,
 * and per-source fault isolation.
 */

import { LiveSourceAdapter, SOURCE_TYPES, SOURCE_STATUS } from './liveSource.adapter.js';
import { liveNormalizer, isValidUrl } from '../liveNormalizer.js';

export const QUICKCOMMERCE_SUPPORTED_PLATFORMS = [
  'BlinkIt',
  'Zepto',
  'Swiggy',
  'BigBasket',
  'DMart',
  'JioMart',
  'Minutes',
  'Amazon',
  'Flipkart',
  'Nykaa',
  'Myntra',
];

export class QuickCommerceLiveAdapter extends LiveSourceAdapter {
  /**
   * @param {Object} config Custom configuration overrides
   */
  constructor(config = {}) {
    super('quickcommerce', 'QuickCommerce', SOURCE_TYPES.API);

    this.configApiKey = config.apiKey !== undefined ? config.apiKey : null;
    this.hasExplicitConfig = config.apiKey !== undefined;
    this.apiBaseUrl = config.apiBaseUrl || process.env.QUICKCOMMERCE_API_BASE_URL || 'https://api.quickcommerceapi.com';
    this.timeoutMs = Number(config.timeoutMs || process.env.QUICKCOMMERCE_TIMEOUT_MS || 25000);
    this.defaultPlatforms = config.defaultPlatforms || ['BlinkIt', 'Zepto', 'Swiggy', 'Flipkart', 'Amazon'];
  }

  /**
   * Dynamically retrieves the current API key from config or environment
   * @returns {string|null}
   */
  getApiKey() {
    if (this.hasExplicitConfig) {
      return this.configApiKey;
    }
    return process.env.QUICKCOMMERCE_API_KEY || null;
  }

  /**
   * Check whether the QuickCommerce API key is configured
   * @returns {boolean}
   */
  isConfigured() {
    const key = this.getApiKey();
    return Boolean(key && String(key).trim().length > 0);
  }

  /**
   * Health check for QuickCommerce API
   * Fast verification of configuration state without burning search credits.
   * @returns {Promise<Object>}
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
   * Search QuickCommerce API for live listings across platforms
   * 
   * @param {string} query Search keyword
   * @param {Object} options Search options { lat, lon, pincode, platforms, limit }
   * @returns {Promise<Object>} Structured source result
   */
  async search(query, options = {}) {
    const timestamp = new Date().toISOString();
    const cleanQuery = String(query || '').trim();

    if (!cleanQuery) {
      return {
        source: this.sourceName,
        platform: this.platformName,
        sourceType: this.sourceType,
        status: SOURCE_STATUS.READY,
        collectedAt: timestamp,
        results: [],
        error: null,
      };
    }

    if (!this.isConfigured()) {
      return {
        source: this.sourceName,
        platform: this.platformName,
        sourceType: this.sourceType,
        status: SOURCE_STATUS.NOT_CONFIGURED,
        collectedAt: timestamp,
        results: [],
        error: 'QuickCommerce live adapter is not configured. Missing required QUICKCOMMERCE_API_KEY.',
      };
    }

    // Validate location: QuickCommerce API requires geographic coordinates
    const lat = options.lat !== undefined ? Number(options.lat) : null;
    const lon = options.lon !== undefined ? Number(options.lon) : null;

    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
      return {
        source: this.sourceName,
        platform: this.platformName,
        sourceType: this.sourceType,
        status: SOURCE_STATUS.ERROR,
        collectedAt: timestamp,
        results: [],
        error: 'Latitude (lat) and longitude (lon) coordinates are required for QuickCommerce live search.',
      };
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return {
        source: this.sourceName,
        platform: this.platformName,
        sourceType: this.sourceType,
        status: SOURCE_STATUS.ERROR,
        collectedAt: timestamp,
        results: [],
        error: `Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180. (Received: lat=${lat}, lon=${lon})`,
      };
    }

    // Parse target platforms
    let targetPlatforms = this.defaultPlatforms;
    if (options.platforms && Array.isArray(options.platforms) && options.platforms.length > 0) {
      targetPlatforms = options.platforms;
    } else if (typeof options.platforms === 'string' && options.platforms.trim()) {
      targetPlatforms = options.platforms.split(',').map((p) => p.trim()).filter(Boolean);
    }

    // Map platform names to provider-compatible casing
    const validProviderPlatforms = this._resolveProviderPlatforms(targetPlatforms);
    if (validProviderPlatforms.length === 0) {
      return {
        source: this.sourceName,
        platform: this.platformName,
        sourceType: this.sourceType,
        status: SOURCE_STATUS.READY,
        collectedAt: timestamp,
        results: [],
        error: null,
      };
    }

    try {
      let rawNormalizedListings = [];

      // If a single platform is requested, use /v1/search
      if (validProviderPlatforms.length === 1) {
        const platformName = validProviderPlatforms[0];
        const searchUrl = new URL(`${this.apiBaseUrl}/v1/search`);
        searchUrl.searchParams.set('q', cleanQuery);
        searchUrl.searchParams.set('lat', String(lat));
        searchUrl.searchParams.set('lon', String(lon));
        searchUrl.searchParams.set('platform', platformName);
        if (options.pincode) searchUrl.searchParams.set('pincode', String(options.pincode));

        const responseData = await this._makeRequest(searchUrl.toString());
        const products = responseData?.data?.products || responseData?.products || [];
        rawNormalizedListings = this.normalizeSinglePlatform(products, platformName, timestamp);
      } else {
        // Multi-platform search via /v1/groupsearch
        const groupUrl = new URL(`${this.apiBaseUrl}/v1/groupsearch`);
        groupUrl.searchParams.set('q', cleanQuery);
        groupUrl.searchParams.set('lat', String(lat));
        groupUrl.searchParams.set('lon', String(lon));
        groupUrl.searchParams.set('platforms', validProviderPlatforms.join(','));
        if (options.pincode) groupUrl.searchParams.set('pincode', String(options.pincode));

        const responseData = await this._makeRequest(groupUrl.toString());
        const resultsMap = responseData?.data?.results || responseData?.results || {};
        rawNormalizedListings = this.normalizeGroupResults(resultsMap, timestamp);
      }

      return {
        source: this.sourceName,
        platform: this.platformName,
        sourceType: this.sourceType,
        status: SOURCE_STATUS.READY,
        collectedAt: timestamp,
        results: rawNormalizedListings,
        error: null,
      };
    } catch (err) {
      const isAbort = err.name === 'AbortError';
      const status = isAbort
        ? SOURCE_STATUS.NETWORK_ERROR
        : (err.statusCode === 429
            ? SOURCE_STATUS.RATE_LIMITED
            : (err.statusCode === 401 || err.statusCode === 403
                ? SOURCE_STATUS.AUTH_FAILED
                : (err.statusCode >= 500
                    ? SOURCE_STATUS.ERROR
                    : SOURCE_STATUS.NETWORK_ERROR)));

      const safeErrorMessage = isAbort
        ? 'QuickCommerce API request timed out.'
        : this._sanitizeError(err.message);

      return {
        source: this.sourceName,
        platform: this.platformName,
        sourceType: this.sourceType,
        status,
        collectedAt: timestamp,
        results: [],
        error: safeErrorMessage,
      };
    }
  }

  /**
   * Helper to perform HTTP GET request with X-API-Key header and timeout
   * @private
   */
  async _makeRequest(urlStr) {
    const apiKey = this.getApiKey();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(urlStr, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(`QuickCommerce API responded with HTTP status ${response.status}`);
        error.statusCode = response.status;
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /**
   * Normalizes single platform product array
   * @param {Array<Object>} products
   * @param {string} platformName
   * @param {string} timestamp
   * @returns {Array<Object>}
   */
  normalizeSinglePlatform(products, platformName, timestamp = new Date().toISOString()) {
    if (!Array.isArray(products)) return [];

    const mapped = products.map((item) => this._mapRawItem(item, platformName, timestamp)).filter(Boolean);
    return liveNormalizer.normalizeBatch(mapped, {
      platform: platformName,
      sourceType: SOURCE_TYPES.API,
      sourceId: 'quickcommerce',
      collectedAt: timestamp,
    });
  }

  /**
   * Normalizes multi-platform groupsearch results map { PlatformName: [products] }
   * @param {Object} resultsMap
   * @param {string} timestamp
   * @returns {Array<Object>}
   */
  normalizeGroupResults(resultsMap, timestamp = new Date().toISOString()) {
    if (!resultsMap || typeof resultsMap !== 'object') return [];

    const allMapped = [];

    for (const [platformName, products] of Object.entries(resultsMap)) {
      if (!Array.isArray(products)) continue;
      for (const item of products) {
        const mapped = this._mapRawItem(item, platformName, timestamp);
        if (mapped) allMapped.push(mapped);
      }
    }

    return liveNormalizer.normalizeBatch(allMapped, {
      sourceType: SOURCE_TYPES.API,
      sourceId: 'quickcommerce',
      collectedAt: timestamp,
    });
  }

  /**
   * Map a single provider product object to candidate listing shape
   * @private
   */
  _mapRawItem(item, platformName, timestamp) {
    if (!item || typeof item !== 'object') return null;

    const title = item.name || item.title || item.product_name || null;
    if (!title) return null;

    // Selling price
    const priceVal = item.offer_price !== undefined
      ? item.offer_price
      : (item.price !== undefined ? item.price : (item.selling_price !== undefined ? item.selling_price : null));

    if (priceVal === null || priceVal === undefined) return null;

    // Original MRP / List Price
    const mrpVal = item.mrp !== undefined
      ? item.mrp
      : (item.original_price !== undefined ? item.original_price : null);

    // Product URL / Deeplink
    const rawUrl = item.deeplink || item.url || item.product_url || item.link || null;
    const productUrl = isValidUrl(rawUrl) ? rawUrl : null;

    // Availability / Inventory
    let inStock = null;
    if (item.in_stock !== undefined && item.in_stock !== null) {
      inStock = Boolean(item.in_stock);
    } else if (item.inventory !== undefined && item.inventory !== null) {
      const inv = Number(item.inventory);
      inStock = !isNaN(inv) ? inv > 0 : null;
    } else if (item.is_available !== undefined && item.is_available !== null) {
      inStock = Boolean(item.is_available);
    }

    // Delivery time / SLA
    const deliveryText = item.platform_sla || item.sla || item.delivery_time || item.deliveryText || null;

    // Seller / Brand
    const sellerName = item.merchant || item.seller || item.brand || platformName || null;

    // Rating
    let sellerRating = null;
    if (item.ratings !== undefined && item.ratings !== null) {
      const parsed = Number(item.ratings?.average !== undefined ? item.ratings.average : item.ratings);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 5) {
        sellerRating = parsed;
      }
    } else if (item.rating !== undefined && item.rating !== null) {
      const parsed = Number(item.rating);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 5) {
        sellerRating = parsed;
      }
    }

    return {
      platform: platformName,
      sourceType: SOURCE_TYPES.API,
      sourceId: 'quickcommerce',
      listingTitle: title,
      productUrl: productUrl || 'https://www.google.com/search?q=' + encodeURIComponent(`${platformName} ${title}`),
      price: priceVal,
      originalPrice: mrpVal,
      currency: 'INR',
      inStock,
      deliveryText,
      sellerName,
      sellerRating,
      collectedAt: timestamp,
    };
  }

  /**
   * Resolves requested platforms to known QuickCommerce platform names
   * @private
   */
  _resolveProviderPlatforms(requested) {
    if (!requested || !Array.isArray(requested)) return [];

    const resolved = [];
    for (const req of requested) {
      const cleanReq = String(req).toLowerCase().trim();
      const match = QUICKCOMMERCE_SUPPORTED_PLATFORMS.find(
        (p) => p.toLowerCase() === cleanReq
      );
      if (match && !resolved.includes(match)) {
        resolved.push(match);
      }
    }
    return resolved;
  }

  /**
   * Redacts API keys and sensitive tokens from error messages
   * @private
   */
  _sanitizeError(msg) {
    if (!msg || typeof msg !== 'string') return 'Unknown error occurred.';
    let sanitized = msg;
    const apiKey = this.getApiKey();
    if (apiKey) {
      sanitized = sanitized.replaceAll(apiKey, '[REDACTED_API_KEY]');
    }
    return sanitized;
  }
}
