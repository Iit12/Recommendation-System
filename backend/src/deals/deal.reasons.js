/**
 * Phase 8.1 Deal Reason Generator
 * Generates transparent, human-readable explanations from actual listing features and scores.
 */

// Format INR currency
const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

export const dealReasonGenerator = {
  /**
   * Generates explainable reason bullets for a single evaluated listing.
   * 
   * @param {Object} listingFeatures Listing feature dictionary
   * @param {Object} scoreResult Scorer output { dealScore, componentScores, overriddenBy }
   * @param {Object} marketOverview Overview metrics of the entire marketplace for this product
   * @returns {Array<string>} List of human-readable explanation strings
   */
  generateReasons(listingFeatures, scoreResult, marketOverview = {}) {
    const {
      platform,
      effectivePrice,
      originalPrice,
      discount,
      deliveryCharge,
      inStock,
      sellerName,
      sellerRating,
      discountFromAveragePercent,
      premiumOverLowPercent,
      priceDifferenceVsCheapest,
      percentageOverCheapest,
    } = listingFeatures;

    const {
      historicalAverage,
      historicalLow,
      marketLowestPrice,
      priceSpread,
      platformCount,
    } = marketOverview;

    const reasons = [];

    // 1. Out-of-Stock Notice
    if (inStock === false) {
      reasons.push('Listing is currently out of stock and excluded from best deal selection.');
    }

    // 2. Price Position vs Historical Average
    if (historicalAverage > 0) {
      if (discountFromAveragePercent > 1.0) {
        reasons.push(
          `Current price of ${formatINR(effectivePrice)} is ${discountFromAveragePercent.toFixed(1)}% below the historical average of ${formatINR(historicalAverage)}.`
        );
      } else if (discountFromAveragePercent < -1.0) {
        const premium = Math.abs(discountFromAveragePercent);
        reasons.push(
          `Current price of ${formatINR(effectivePrice)} is ${premium.toFixed(1)}% above the historical average of ${formatINR(historicalAverage)}.`
        );
      } else {
        reasons.push(
          `Current price of ${formatINR(effectivePrice)} matches the historical average of ${formatINR(historicalAverage)}.`
        );
      }
    }

    // 3. Price Position vs Historical Low Floor
    if (historicalLow > 0) {
      if (premiumOverLowPercent <= 0) {
        reasons.push(
          `Current price matches the all-time recorded floor of ${formatINR(historicalLow)}.`
        );
      } else if (premiumOverLowPercent <= 3.0) {
        reasons.push(
          `Current price is within ${premiumOverLowPercent.toFixed(1)}% of the historical low (${formatINR(historicalLow)}).`
        );
      }
    }

    // 4. Platform Comparison & Savings vs Competitors
    if (platformCount <= 1) {
      reasons.push('Only one retailer currently tracks this product; cross-platform comparison is evaluated neutrally.');
    } else if (priceDifferenceVsCheapest === 0 && inStock) {
      if (priceSpread > 0) {
        reasons.push(
          `Offers the lowest price across all ${platformCount} tracked stores, saving up to ${formatINR(priceSpread)}.`
        );
      } else {
        reasons.push(`Priced identically with other tracked retailers at ${formatINR(effectivePrice)}.`);
      }
    } else if (priceDifferenceVsCheapest > 0) {
      reasons.push(
        `Priced ${formatINR(priceDifferenceVsCheapest)} (${percentageOverCheapest.toFixed(1)}%) higher than the lowest market offer (${formatINR(marketLowestPrice)}).`
      );
    }

    // 5. Authentic Stated Discount off MRP
    if (originalPrice && discount && discount > 0) {
      reasons.push(`${discount}% discount off original list price (${formatINR(originalPrice)}).`);
    }

    // 6. Delivery Surcharge Impact
    if (deliveryCharge <= 0) {
      reasons.push('Free delivery included with no extra shipping surcharge.');
    } else {
      reasons.push(`Delivery charge of ${formatINR(deliveryCharge)} increases the effective purchase cost to ${formatINR(effectivePrice)}.`);
    }

    // 7. Seller Rating
    if (sellerName && sellerRating != null) {
      reasons.push(`Fulfilled by ${sellerName} with a ${sellerRating.toFixed(1)}/5.0 seller rating.`);
    }

    return reasons;
  }
};
