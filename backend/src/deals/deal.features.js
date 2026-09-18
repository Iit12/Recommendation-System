/**
 * Phase 8.1 Deal Feature Extractor
 * Derives normalized feature vectors for each active retailer listing.
 */

export const dealFeatureExtractor = {
  /**
   * Extracts deal features for all active retailer listings of a canonical product.
   * 
   * @param {Array<Object>} latestPriceObservations Latest price observation per platform
   * @param {Array<Object>} listingMetadata Listing records from MongoDB listings collection
   * @param {Object} trendReport Phase 6 historical trend report
   * @returns {Object} { marketOverview, listingFeatures: Array<Object> }
   */
  extractFeatures(latestPriceObservations = [], listingMetadata = [], trendReport = {}) {
    // Map listing metadata by listingId or platform
    const metadataMap = new Map();
    for (const meta of listingMetadata) {
      if (meta.listingId) metadataMap.set(meta.listingId, meta);
      if (meta.platform) metadataMap.set(meta.platform.toLowerCase(), meta);
    }

    const historicalAverage = Number(trendReport.averagePrice || 0);
    const historicalLow = Number(trendReport.lowestPrice || 0);
    const historicalHigh = Number(trendReport.highestPrice || 0);

    // Filter valid observations with non-negative prices
    const validObservations = latestPriceObservations.filter((obs) => {
      const price = Number(obs.effectivePrice !== undefined ? obs.effectivePrice : obs.price);
      return !isNaN(price) && price >= 0;
    });

    const prices = validObservations.map((obs) =>
      Number(obs.effectivePrice !== undefined ? obs.effectivePrice : obs.price)
    );

    const inStockObservations = validObservations.filter((obs) => obs.inStock !== false);
    const inStockPrices = inStockObservations.map((obs) =>
      Number(obs.effectivePrice !== undefined ? obs.effectivePrice : obs.price)
    );

    // Compute market-wide price statistics
    const marketLowestPrice = inStockPrices.length > 0
      ? Math.min(...inStockPrices)
      : (prices.length > 0 ? Math.min(...prices) : 0);

    const marketHighestPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const marketPriceSpread = Math.max(0, marketHighestPrice - marketLowestPrice);
    const platformCount = validObservations.length;
    const inStockCount = inStockObservations.length;

    const marketOverview = {
      lowestPrice: marketLowestPrice,
      highestPrice: marketHighestPrice,
      priceSpread: marketPriceSpread,
      platformCount,
      inStockCount,
      historicalAverage,
      historicalLow,
      historicalHigh,
    };

    // Build features for each individual listing
    const listingFeatures = validObservations.map((obs) => {
      const meta = metadataMap.get(obs.listingId) || metadataMap.get(String(obs.platform || '').toLowerCase()) || {};

      const price = Number(obs.price || 0);
      const deliveryCharge = Number(obs.deliveryCharge || 0);
      const effectivePrice = Number(obs.effectivePrice !== undefined ? obs.effectivePrice : price + deliveryCharge);
      
      const originalPrice = obs.originalPrice && Number(obs.originalPrice) > effectivePrice
        ? Number(obs.originalPrice)
        : null;

      let discount = null;
      if (originalPrice && originalPrice > effectivePrice) {
        discount = Number((((originalPrice - effectivePrice) / originalPrice) * 100).toFixed(1));
      } else if (obs.discount && Number(obs.discount) > 0) {
        discount = Number(obs.discount);
      }

      const inStock = Boolean(obs.inStock !== false);
      const sellerRating = meta.sellerRating != null ? Number(meta.sellerRating) : null;
      const sellerName = meta.sellerName || obs.sellerName || obs.platform || 'Verified Seller';
      const productUrl = meta.productUrl || obs.productUrl || null;

      // 1. Discount vs Historical Average: positive means cheaper than historical average
      const discountFromAveragePercent = historicalAverage > 0
        ? Number((((historicalAverage - effectivePrice) / historicalAverage) * 100).toFixed(2))
        : 0;

      // 2. Premium over Historical Low: 0% means at or below historical low floor
      const premiumOverLowPercent = historicalLow > 0
        ? Number((((effectivePrice - historicalLow) / historicalLow) * 100).toFixed(2))
        : 0;

      // 3. Current Price Difference vs Market Cheapest (among current stores)
      const priceDifferenceVsCheapest = Math.max(0, effectivePrice - marketLowestPrice);
      const percentageOverCheapest = marketLowestPrice > 0
        ? Number(((priceDifferenceVsCheapest / marketLowestPrice) * 100).toFixed(2))
        : 0;

      return {
        listingId: obs.listingId || meta.listingId || `listing-${obs.platform}`,
        platform: obs.platform || 'Unknown Store',
        productId: obs.productId || trendReport.productId,
        productUrl,
        storeId: meta.storeId || String(obs.platform || '').toLowerCase(),
        sellerName,
        sellerRating,
        price,
        originalPrice,
        discount,
        deliveryCharge,
        effectivePrice,
        currency: String(obs.currency || 'INR').toUpperCase(),
        inStock,
        deliveryText: obs.deliveryText || (deliveryCharge === 0 ? 'Free Delivery' : `₹${deliveryCharge} Delivery`),
        collectedAt: obs.collectedAt,
        // Computed relative metrics
        discountFromAveragePercent,
        premiumOverLowPercent,
        priceDifferenceVsCheapest,
        percentageOverCheapest,
        marketLowestPrice,
        marketHighestPrice,
        marketPriceSpread,
        platformCount,
      };
    });

    return {
      marketOverview,
      listingFeatures,
    };
  }
};
