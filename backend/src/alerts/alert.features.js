/**
 * Phase 8.4 Alert Feature Extractor
 * Extracts factual metrics from current listings and historical observations.
 */

export const alertFeatureExtractor = {
  /**
   * Identifies the best purchasable in-stock listing and effective current price.
   * Excludes out-of-stock, null, zero, NaN, or non-finite priced listings.
   * 
   * @param {Array<Object>} listings Current listings from repository
   * @param {Array<Object>} latestPriceObservations Latest price observations per platform
   * @returns {{ currentListing: Object|null, currentPrice: number|null, allCurrentListings: Array<Object> }}
   */
  extractCurrentListingFeatures(listings = [], latestPriceObservations = []) {
    // Merge listing metadata with latest price observations
    const observationMap = new Map();
    for (const obs of latestPriceObservations) {
      if (obs && obs.platform) {
        observationMap.set(String(obs.platform).toLowerCase(), obs);
      }
    }

    const mergedListings = listings.map((listing) => {
      const platformKey = String(listing.platform || '').toLowerCase();
      const obs = observationMap.get(platformKey);

      const price = obs && obs.price !== undefined ? Number(obs.price) : Number(listing.price || 0);
      const effectivePrice = obs && obs.effectivePrice !== undefined ? Number(obs.effectivePrice) : (listing.effectivePrice !== undefined ? Number(listing.effectivePrice) : price);
      const inStock = obs && obs.inStock !== undefined ? Boolean(obs.inStock) : Boolean(listing.inStock !== false);

      return {
        listingId: listing.listingId,
        platform: listing.platform,
        productUrl: listing.productUrl,
        storeId: listing.storeId,
        sellerName: listing.sellerName,
        sellerRating: listing.sellerRating,
        price,
        effectivePrice,
        inStock,
        deliveryCharge: obs ? (obs.deliveryCharge || 0) : (listing.deliveryCharge || 0),
        discount: obs ? (obs.discount || 0) : (listing.discount || 0),
        collectedAt: obs ? obs.collectedAt : listing.updatedAt,
      };
    });

    // Filter valid in-stock listings with valid positive finite effective price
    const validInStockListings = mergedListings.filter((l) => {
      return (
        l.inStock === true &&
        Number.isFinite(l.effectivePrice) &&
        l.effectivePrice > 0
      );
    });

    if (validInStockListings.length === 0) {
      return {
        currentListing: null,
        currentPrice: null,
        allCurrentListings: mergedListings,
      };
    }

    // Sort ascending by effective price, then platform alphabetically
    validInStockListings.sort((a, b) => {
      if (a.effectivePrice !== b.effectivePrice) {
        return a.effectivePrice - b.effectivePrice;
      }
      return String(a.platform).localeCompare(String(b.platform));
    });

    const cheapestListing = validInStockListings[0];

    return {
      currentListing: cheapestListing,
      currentPrice: cheapestListing.effectivePrice,
      allCurrentListings: mergedListings,
    };
  },

  /**
   * Filters and analyzes historical price observations for alert condition evaluation.
   * 
   * @param {Array<Object>} rawObservations Chronologically sorted observations
   * @returns {Object} Extracted historical features
   */
  extractHistoricalFeatures(rawObservations = []) {
    if (!Array.isArray(rawObservations) || rawObservations.length === 0) {
      return {
        validObservations: [],
        historicalLow: null,
        historicalHigh: null,
        previousObservation: null,
        previousPrice: null,
        previousInStock: null,
        observationCount: 0,
      };
    }

    // Filter valid observations
    const validObservations = rawObservations.filter((obs) => {
      if (!obs) return false;
      const price = Number(obs.effectivePrice !== undefined ? obs.effectivePrice : obs.price);
      if (!Number.isFinite(price) || price <= 0) return false;
      if (!obs.collectedAt || isNaN(new Date(obs.collectedAt).getTime())) return false;
      return true;
    });

    if (validObservations.length === 0) {
      return {
        validObservations: [],
        historicalLow: null,
        historicalHigh: null,
        previousObservation: null,
        previousPrice: null,
        previousInStock: null,
        observationCount: 0,
      };
    }

    // Compute historical min and max
    let historicalLow = Infinity;
    let historicalHigh = -Infinity;

    for (const obs of validObservations) {
      const price = Number(obs.effectivePrice !== undefined ? obs.effectivePrice : obs.price);
      if (price < historicalLow) historicalLow = price;
      if (price > historicalHigh) historicalHigh = price;
    }

    // Identify the immediately previous observation
    // When multiple observations exist, previous observation is the one right before the most recent one
    let previousObservation = null;
    let previousPrice = null;
    let previousInStock = null;

    if (validObservations.length >= 2) {
      previousObservation = validObservations[validObservations.length - 2];
      previousPrice = Number(previousObservation.effectivePrice !== undefined ? previousObservation.effectivePrice : previousObservation.price);
      previousInStock = previousObservation.inStock !== false;
    } else {
      // Also check if rawObservations has an earlier stock state even if price was invalid or out-of-stock
      const previousRaw = rawObservations.length >= 2 ? rawObservations[rawObservations.length - 2] : null;
      if (previousRaw) {
        previousInStock = previousRaw.inStock !== false;
      }
    }

    // Also extract raw stock history for restock detection
    const stockHistory = rawObservations.map((obs) => ({
      inStock: Boolean(obs.inStock !== false),
      collectedAt: obs.collectedAt,
      platform: obs.platform,
    }));

    return {
      validObservations,
      historicalLow: historicalLow === Infinity ? null : historicalLow,
      historicalHigh: historicalHigh === -Infinity ? null : historicalHigh,
      previousObservation,
      previousPrice,
      previousInStock,
      stockHistory,
      observationCount: validObservations.length,
    };
  },
};
