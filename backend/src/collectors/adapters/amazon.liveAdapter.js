/**
 * Amazon Creators API Live Adapter
 * 
 * Production-ready live data connector for Amazon Creators API (OAuth 2.0 Bearer).
 * Implements token caching, CONFIGURED / NOT_CONFIGURED state isolation,
 * and zero secret leakage.
 */

import { LiveSourceAdapter, SOURCE_TYPES, SOURCE_STATUS } from './liveSource.adapter.js';
import { liveNormalizer } from '../liveNormalizer.js';

export class AmazonLiveAdapter extends LiveSourceAdapter {
  /**
   * @param {Object} config Optional custom config (defaults to process.env)
   */
  constructor(config = {}) {
    super('amazon', 'Amazon', SOURCE_TYPES.API);

    this.clientId = config.clientId || process.env.AMAZON_CREATOR_CLIENT_ID || null;
    this.clientSecret = config.clientSecret || process.env.AMAZON_CREATOR_CLIENT_SECRET || null;
    this.partnerTag = config.partnerTag || process.env.AMAZON_PARTNER_TAG || null;
    this.marketplace = config.marketplace || process.env.AMAZON_MARKETPLACE || 'www.amazon.in';
    this.apiBaseUrl = config.apiBaseUrl || process.env.AMAZON_API_BASE_URL || 'https://creatorsapi.amazon';
    this.authUrl = config.authUrl || process.env.AMAZON_AUTH_URL || 'https://api.amazon.com/auth/o2/token';
    this.timeoutMs = Number(config.timeoutMs || process.env.AMAZON_TIMEOUT_MS || 8000);

    // In-memory OAuth 2.0 Bearer Token Cache
    this.tokenCache = {
      accessToken: null,
      expiresAt: 0,
    };
  }

  /**
   * Checks if required credentials are present
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(this.clientId && this.clientSecret && this.partnerTag);
  }

  /**
   * Obtains a valid Bearer token via OAuth 2.0 Client Credentials grant.
   * Reuses cached token if still unexpired.
   * @returns {Promise<string>} Bearer Access Token
   */
  async getAccessToken() {
    if (!this.isConfigured()) {
      throw new Error('Missing Amazon credentials.');
    }

    // Reuse cached token if valid with 60s buffer
    const now = Date.now();
    if (this.tokenCache.accessToken && this.tokenCache.expiresAt > now + 60000) {
      return this.tokenCache.accessToken;
    }

    try {
      const bodyParams = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'creators::catalog',
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(this.authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Amazon OAuth failed with HTTP status ${response.status}`);
      }

      const data = await response.json();
      if (!data || !data.access_token) {
        throw new Error('Amazon OAuth returned invalid token payload.');
      }

      const expiresInSec = Number(data.expires_in) || 3600;
      this.tokenCache = {
        accessToken: data.access_token,
        expiresAt: now + expiresInSec * 1000,
      };

      return this.tokenCache.accessToken;
    } catch (err) {
      const isAbort = err.name === 'AbortError';
      const cleanMessage = isAbort ? 'Amazon OAuth request timed out' : this._sanitizeError(err.message);
      const authErr = new Error(`Authentication failed: ${cleanMessage}`);
      authErr.code = 'AUTH_FAILED';
      throw authErr;
    }
  }

  /**
   * Search live Amazon catalog via Creators API /catalog/v1/searchItems
   * 
   * @param {string} query Search keyword
   * @param {Object} options Search options (itemCount, searchIndex)
   * @returns {Promise<Object>} Standard source result
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
        error: 'Amazon live adapter is not configured. Missing required credentials (AMAZON_CREATOR_CLIENT_ID, AMAZON_CREATOR_CLIENT_SECRET, AMAZON_PARTNER_TAG).',
      };
    }

    try {
      const accessToken = await this.getAccessToken();
      const itemCount = Math.min(Math.max(Number(options.limit || 10), 1), 20);

      const requestPayload = {
        keywords: cleanQuery,
        partnerTag: this.partnerTag,
        partnerType: 'Associates',
        marketplace: this.marketplace,
        itemCount,
        resources: [
          'itemInfo.title',
          'offersV2.listings.price',
          'offersV2.listings.savingBasis',
          'offersV2.listings.merchantInfo',
          'offersV2.listings.availability',
          'offersV2.listings.deliveryInfo',
        ],
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.apiBaseUrl}/catalog/v1/searchItems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'x-amz-target': 'com.amazon.creators.catalog.v1.SearchItems',
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        return {
          source: this.sourceName,
          platform: this.platformName,
          sourceType: this.sourceType,
          status: SOURCE_STATUS.RATE_LIMITED,
          collectedAt: timestamp,
          results: [],
          error: 'Amazon Creators API rate limit exceeded.',
        };
      }

      if (response.status === 401 || response.status === 403) {
        // Invalidate token cache on auth rejection
        this.tokenCache = { accessToken: null, expiresAt: 0 };
        return {
          source: this.sourceName,
          platform: this.platformName,
          sourceType: this.sourceType,
          status: SOURCE_STATUS.AUTH_FAILED,
          collectedAt: timestamp,
          results: [],
          error: 'Amazon API authentication or authorization rejected.',
        };
      }

      if (!response.ok) {
        return {
          source: this.sourceName,
          platform: this.platformName,
          sourceType: this.sourceType,
          status: SOURCE_STATUS.ERROR,
          collectedAt: timestamp,
          results: [],
          error: `Amazon API responded with HTTP status ${response.status}`,
        };
      }

      const data = await response.json();
      const rawItems = data?.searchResult?.items || data?.items || [];
      const normalizedListings = this.normalize(rawItems, timestamp);

      return {
        source: this.sourceName,
        platform: this.platformName,
        sourceType: this.sourceType,
        status: SOURCE_STATUS.READY,
        collectedAt: timestamp,
        results: normalizedListings,
        error: null,
      };
    } catch (err) {
      const isAbort = err.name === 'AbortError';
      const status = isAbort ? SOURCE_STATUS.NETWORK_ERROR : (err.code === 'AUTH_FAILED' ? SOURCE_STATUS.AUTH_FAILED : SOURCE_STATUS.NETWORK_ERROR);
      const safeError = isAbort ? 'Amazon API search request timed out.' : this._sanitizeError(err.message);

      return {
        source: this.sourceName,
        platform: this.platformName,
        sourceType: this.sourceType,
        status,
        collectedAt: timestamp,
        results: [],
        error: safeError,
      };
    }
  }

  /**
   * Parse Amazon Creators API items into standard normalized listings
   * @param {Array<Object>} rawItems
   * @param {string} timestamp
   * @returns {Array<Object>}
   */
  normalize(rawItems, timestamp = new Date().toISOString()) {
    if (!Array.isArray(rawItems)) return [];

    const mappedItems = rawItems.map((item) => {
      if (!item) return null;

      // Extract ASIN / ID
      const asin = item.asin || item.id || null;

      // Extract Title
      const title = item.itemInfo?.title?.displayValue || item.title || item.listingTitle || null;

      // Extract URL
      const url = item.detailPageUrl || item.url || (asin ? `https://${this.marketplace}/dp/${asin}` : null);

      // Extract Offer / Price
      const firstOffer = item.offersV2?.listings?.[0] || item.offers?.listings?.[0] || item.offer || {};
      const priceVal = firstOffer.price?.amount !== undefined ? firstOffer.price.amount : item.price;
      const currency = firstOffer.price?.currency || item.currency || 'INR';
      const mrpVal = firstOffer.savingBasis?.amount !== undefined ? firstOffer.savingBasis.amount : (item.mrp || item.originalPrice);

      // Availability / Stock
      let inStock = true;
      if (firstOffer.availability?.type) {
        inStock = String(firstOffer.availability.type).toUpperCase() === 'IN_STOCK';
      } else if (item.inStock !== undefined) {
        inStock = Boolean(item.inStock);
      }

      // Merchant
      const merchant = firstOffer.merchantInfo?.name || item.merchant || item.sellerName || 'Amazon Retail';

      // Delivery
      const deliveryText = firstOffer.deliveryInfo?.isFreeShippingEligible ? 'Free Prime Delivery' : item.deliveryText;

      return {
        platform: 'Amazon',
        sourceType: SOURCE_TYPES.API,
        sourceId: 'amazon',
        title,
        url,
        price: priceVal,
        originalPrice: mrpVal,
        currency,
        inStock,
        deliveryText,
        merchant,
      };
    }).filter(Boolean);

    return liveNormalizer.normalizeBatch(mappedItems, {
      platform: 'Amazon',
      sourceType: SOURCE_TYPES.API,
      sourceId: 'amazon',
      collectedAt: timestamp,
    });
  }

  /**
   * Redacts any potential secrets from error strings
   * @private
   */
  _sanitizeError(msg) {
    if (!msg || typeof msg !== 'string') return 'Unknown error occurred.';
    let sanitized = msg;
    if (this.clientId) sanitized = sanitized.replaceAll(this.clientId, '[REDACTED_CLIENT_ID]');
    if (this.clientSecret) sanitized = sanitized.replaceAll(this.clientSecret, '[REDACTED_SECRET]');
    if (this.tokenCache.accessToken) sanitized = sanitized.replaceAll(this.tokenCache.accessToken, '[REDACTED_TOKEN]');
    return sanitized;
  }
}
