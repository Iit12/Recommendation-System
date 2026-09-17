/**
 * Phase 7.1 Recommendation Reason Generator
 * Generates transparent, human-readable explanations and highlights conflicting signals.
 */

// Format INR currency
const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

export const recommendationReasonGenerator = {
  /**
   * Generates explainable bullet points from computed features and scoring decision.
   * 
   * @param {Object} features Normalized feature dictionary
   * @param {Object} scoreResult Output from recommendationScorer.calculateScore
   * @returns {Array<string>} List of human-readable explanation strings
   */
  generateReasons(features, scoreResult) {
    const {
      currentPrice,
      historicalAverage,
      historicalLow,
      historicalHigh,
      priceChangePercent,
      trend,
      discountFromAveragePercent,
      premiumOverLowPercent,
      coefficientOfVariation,
      observationCount,
      latestInStock,
      bestPlatform,
      bestPrice,
      priceSpread,
      platformSpreadPercent,
    } = features;

    const { action, overriddenBy } = scoreResult;
    const reasons = [];

    // 1. Handle Out-of-Stock Override
    if (latestInStock === false || overriddenBy === 'OUT_OF_STOCK') {
      reasons.push('The product is currently out of stock or unavailable at the latest observation.');
      if (action === 'WAIT') {
        reasons.push('Recommendation is set to WAIT until fresh inventory is replenished.');
      }
      return reasons;
    }

    // 2. Handle Insufficient Data / No Data
    if (observationCount === 0 || trend === 'NO_DATA') {
      reasons.push('No historical price observations were found for this product.');
      reasons.push('Recommendation is set to NEUTRAL due to absence of historical pricing data.');
      return reasons;
    }

    if (observationCount < 3 || overriddenBy === 'INSUFFICIENT_OBSERVATIONS') {
      reasons.push(`Historical price history is limited to ${observationCount} observation${observationCount === 1 ? '' : 's'}.`);
      reasons.push('Recommendation is set to NEUTRAL until more price observations are recorded.');
      return reasons;
    }

    // 3. Current Price vs Historical Average
    if (discountFromAveragePercent > 1.0) {
      reasons.push(
        `Current price of ${formatINR(currentPrice)} is ${discountFromAveragePercent.toFixed(1)}% below the historical average of ${formatINR(historicalAverage)}.`
      );
    } else if (discountFromAveragePercent < -1.0) {
      const premium = Math.abs(discountFromAveragePercent);
      reasons.push(
        `Current price of ${formatINR(currentPrice)} is ${premium.toFixed(1)}% above the historical average of ${formatINR(historicalAverage)}.`
      );
    } else {
      reasons.push(
        `Current price of ${formatINR(currentPrice)} is closely aligned with the historical average of ${formatINR(historicalAverage)}.`
      );
    }

    // 4. Current Price vs Historical Low Floor
    if (premiumOverLowPercent <= 1.0) {
      reasons.push(
        `Current price is at or near the all-time recorded low of ${formatINR(historicalLow)}.`
      );
    } else if (premiumOverLowPercent <= 5.0) {
      reasons.push(
        `Current price is within ${premiumOverLowPercent.toFixed(1)}% of the historical low (${formatINR(historicalLow)}).`
      );
    } else {
      reasons.push(
        `Current price is ${premiumOverLowPercent.toFixed(1)}% higher than the lowest recorded price (${formatINR(historicalLow)}).`
      );
    }

    // 5. Trend Dynamics & Conflicting Signals
    if (trend === 'DECREASING') {
      if (discountFromAveragePercent > 0) {
        // CONFLICTING SIGNAL: Price is low, BUT trend is falling
        reasons.push(
          `Recent price momentum is downward (${priceChangePercent > 0 ? '+' : ''}${priceChangePercent.toFixed(1)}%), suggesting prices may drop further if you wait.`
        );
      } else {
        reasons.push(
          `Price trend is decreasing (${priceChangePercent.toFixed(1)}%), indicating potential for further discounts.`
        );
      }
    } else if (trend === 'INCREASING') {
      if (discountFromAveragePercent > 0) {
        // SUPPORTING BUY_NOW: Price is rising, and currently below average -> lock it in!
        reasons.push(
          `Prices have started trending upward (+${priceChangePercent.toFixed(1)}%); buying now locks in the current below-average rate.`
        );
      } else {
        reasons.push(
          `Prices are trending upward (+${priceChangePercent.toFixed(1)}%) from an already elevated baseline.`
        );
      }
    } else if (trend === 'STABLE') {
      reasons.push('Price trend has remained stable across recent observations.');
    }

    // 6. Cross-Platform Arbitrage Advantage
    if (bestPlatform && priceSpread > 0 && platformSpreadPercent >= 2.0) {
      reasons.push(
        `${bestPlatform} currently offers the best price at ${formatINR(bestPrice)} with a ${formatINR(priceSpread)} (${platformSpreadPercent.toFixed(1)}%) cross-retailer advantage.`
      );
    }

    // 7. Volatility Assessment & Conflict Handling
    if (coefficientOfVariation >= 8.0) {
      reasons.push(
        `Price volatility is elevated (CV: ${coefficientOfVariation.toFixed(1)}%), which adds uncertainty to short-term price movements.`
      );
    }

    // 8. Inventory Status
    if (latestInStock) {
      reasons.push('Product is confirmed in stock across tracked retailers.');
    }

    return reasons;
  }
};
