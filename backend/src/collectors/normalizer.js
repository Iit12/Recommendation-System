/**
 * Phase 3 Listing Normalizer
 * Transforms heterogeneous platform outputs into standardized, canonical listing objects.
 */

export const normalizer = {
  /**
   * Normalize a single raw platform listing
   * @param {Object} raw Raw item from adapter
   * @param {string} timestamp Collection timestamp
   * @returns {Object} Standardized normalized listing
   */
  normalize(raw, timestamp = new Date().toISOString()) {
    const price = Number(raw.price) || 0;
    const deliveryCharge = Number(raw.shippingCost !== undefined ? raw.shippingCost : raw.deliveryCharge || 0);
    const originalPrice = Number(raw.mrp !== undefined ? raw.mrp : raw.originalPrice || price);
    const discount = Number(raw.discountPct !== undefined ? raw.discountPct : raw.discount || 0);
    const effectivePrice = price + deliveryCharge;
    const inStock = Boolean(raw.stockStatus !== undefined ? raw.stockStatus : raw.inStock !== false);

    return {
      platform: String(raw.platform || 'Unknown Platform'),
      storeId: String(raw.storeId || 'unknown').toLowerCase(),
      listingTitle: String(raw.title || raw.listingTitle || 'Untitled Product Listing'),
      productUrl: String(raw.url || raw.productUrl || '#'),
      price,
      originalPrice,
      discount,
      deliveryCharge,
      effectivePrice,
      currency: 'INR',
      inStock,
      deliveryText: String(raw.shippingEstimate || raw.deliveryText || (deliveryCharge === 0 ? 'Free Delivery' : `Delivery: ₹${deliveryCharge}`)),
      sellerName: String(raw.merchant || raw.sellerName || raw.platform || 'Verified Merchant'),
      sellerRating: Number(raw.ratingScore !== undefined ? raw.ratingScore : raw.sellerRating || 4.8),
      collectedAt: timestamp,
    };
  },

  /**
   * Normalize and deduplicate an array of raw listings
   * Deduplication key: `${storeId}:${productUrl}`
   * @param {Array<Object>} rawListings Array of raw platform items
   * @param {string} timestamp Collection timestamp
   * @returns {Array<Object>} Array of normalized, deduplicated listings
   */
  normalizeBatch(rawListings = [], timestamp = new Date().toISOString()) {
    const seen = new Set();
    const normalized = [];

    for (const raw of rawListings) {
      if (!raw) continue;
      const item = this.normalize(raw, timestamp);
      const dedupeKey = `${item.storeId}:${item.productUrl}`;

      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        normalized.push(item);
      }
    }

    return normalized;
  }
};
