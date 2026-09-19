/**
 * Live Listing Normalizer
 * 
 * Enforces strict live data normalization rules for authorized sources (APIs, Feeds, Scrapes).
 * Guarantees zero fabrication of prices, ratings, discounts, or delivery fees.
 */

/**
 * Validates whether a URL is a valid absolute http(s) URL
 * @param {string} urlStr
 * @returns {boolean}
 */
export function isValidUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Safely parses a numerical price value
 * @param {*} value
 * @returns {number|null}
 */
export function parseNumericPrice(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (isNaN(num) || !isFinite(num) || num < 0) return null;
  return Math.round(num * 100) / 100;
}

export const liveNormalizer = {
  /**
   * Normalizes a single raw live source listing
   * 
   * @param {Object} raw Raw item from live adapter
   * @param {Object} context Metadata context (platform, sourceType, sourceId, timestamp)
   * @returns {Object|null} Standardized normalized listing or null if invalid
   */
  normalize(raw, context = {}) {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const platform = String(raw.platform || context.platform || 'Unknown');
    const sourceType = String(raw.sourceType || context.sourceType || 'API');
    const sourceId = String(raw.sourceId || context.sourceId || platform.toLowerCase());
    const listingTitle = String(raw.listingTitle || raw.title || '').trim();

    if (!listingTitle) {
      return null;
    }

    // Safe URL validation
    const rawUrl = String(raw.productUrl || raw.url || '').trim();
    const productUrl = isValidUrl(rawUrl) ? rawUrl : null;
    if (!productUrl) {
      return null;
    }

    // Price validation: must be a positive numeric value
    const price = parseNumericPrice(raw.price);
    if (price === null || price <= 0) {
      return null;
    }

    // Original Price (MRP / list price)
    const rawOriginalPrice = parseNumericPrice(raw.originalPrice !== undefined ? raw.originalPrice : raw.mrp);
    const originalPrice = rawOriginalPrice && rawOriginalPrice >= price ? rawOriginalPrice : price;

    // Discount: calculated or provided, NEVER fabricated
    let discount = null;
    if (raw.discount !== undefined && raw.discount !== null) {
      const parsedDisc = parseNumericPrice(raw.discount);
      discount = parsedDisc !== null ? parsedDisc : null;
    } else if (originalPrice && originalPrice > price) {
      discount = Math.round(((originalPrice - price) / originalPrice) * 10000) / 100;
    }

    // Delivery charge: NEVER invent. null if unknown.
    let deliveryCharge = null;
    if (raw.deliveryCharge !== undefined && raw.deliveryCharge !== null) {
      deliveryCharge = parseNumericPrice(raw.deliveryCharge);
    } else if (raw.shippingCost !== undefined && raw.shippingCost !== null) {
      deliveryCharge = parseNumericPrice(raw.shippingCost);
    }

    // Effective price
    const effectivePrice = price + (deliveryCharge || 0);

    // Currency
    const currency = String(raw.currency || 'INR').toUpperCase();

    // In Stock boolean state
    let inStock = true;
    if (raw.inStock !== undefined && raw.inStock !== null) {
      inStock = Boolean(raw.inStock);
    } else if (raw.stockStatus !== undefined && raw.stockStatus !== null) {
      inStock = Boolean(raw.stockStatus);
    } else if (raw.availability !== undefined && raw.availability !== null) {
      const avail = String(raw.availability).toLowerCase();
      inStock = avail.includes('in_stock') || avail.includes('available') || avail === 'true';
    }

    // Delivery text
    const deliveryText = raw.deliveryText || raw.shippingEstimate || (deliveryCharge === 0 ? 'Free Delivery' : null);

    // Seller information: NEVER infer or fabricate
    const sellerName = raw.sellerName || raw.merchant || null;
    let sellerRating = null;
    if (raw.sellerRating !== undefined && raw.sellerRating !== null) {
      const parsedRating = Number(raw.sellerRating);
      if (!isNaN(parsedRating) && isFinite(parsedRating) && parsedRating >= 0 && parsedRating <= 5) {
        sellerRating = Math.round(parsedRating * 10) / 10;
      }
    } else if (raw.ratingScore !== undefined && raw.ratingScore !== null) {
      const parsedRating = Number(raw.ratingScore);
      if (!isNaN(parsedRating) && isFinite(parsedRating) && parsedRating >= 0 && parsedRating <= 5) {
        sellerRating = Math.round(parsedRating * 10) / 10;
      }
    }

    // Timestamp: must be provided by backend when observation was collected
    const collectedAt = context.collectedAt || raw.collectedAt || new Date().toISOString();

    return {
      platform,
      sourceType,
      sourceId,
      listingTitle,
      productUrl,
      price,
      originalPrice,
      discount,
      deliveryCharge,
      effectivePrice,
      currency,
      inStock,
      deliveryText,
      sellerName,
      sellerRating,
      collectedAt,
    };
  },

  /**
   * Normalizes and deduplicates a batch of raw listings
   * @param {Array<Object>} rawListings
   * @param {Object} context
   * @returns {Array<Object>}
   */
  normalizeBatch(rawListings = [], context = {}) {
    if (!Array.isArray(rawListings)) return [];

    const seen = new Set();
    const normalized = [];

    for (const raw of rawListings) {
      const item = this.normalize(raw, context);
      if (!item) continue;

      const dedupeKey = `${item.sourceId}:${item.productUrl}`;
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        normalized.push(item);
      }
    }

    return normalized;
  }
};
