/**
 * Phase 7.1 Recommendation Feature Extractor
 * Derives normalized numerical and categorical features from Phase 6 trends and platform observations.
 */

export const recommendationFeatureExtractor = {
  /**
   * Builds normalized recommendation features.
   * 
   * @param {Object} trendReport Output from Phase 6 trend calculation
   * @param {Array<Object>} latestPlatformPrices Latest snapshot from each tracked retailer
   * @returns {Object} Structured recommendation features
   */
  extractFeatures(trendReport = {}, latestPlatformPrices = []) {
    const currentPrice = Number(trendReport.currentPrice || 0);
    const historicalAverage = Number(trendReport.averagePrice || 0);
    const historicalLow = Number(trendReport.lowestPrice || currentPrice);
    const historicalHigh = Number(trendReport.highestPrice || currentPrice);
    const priceChange = Number(trendReport.priceChange || 0);
    const priceChangePercent = Number(trendReport.percentageChange || 0);
    const trend = trendReport.trend || 'NO_DATA';
    const standardDeviation = Number(trendReport.volatility?.standardDeviation || 0);
    const coefficientOfVariation = Number(trendReport.volatility?.coefficientOfVariation || 0);
    const observationCount = Number(trendReport.observationCount || 0);
    const latestInStock = Boolean(trendReport.latestInStock !== false);

    // Cross-platform metrics
    let bestPlatform = null;
    let bestPrice = currentPrice || null;
    let worstPrice = currentPrice || null;
    let priceSpread = 0;
    let platformSpreadPercent = 0;

    if (Array.isArray(latestPlatformPrices) && latestPlatformPrices.length > 0) {
      // Find in-stock platforms or all platforms
      const validPlatformObservations = latestPlatformPrices.filter(
        (p) => p && typeof (p.effectivePrice ?? p.price) === 'number' && (p.effectivePrice ?? p.price) > 0
      );

      if (validPlatformObservations.length > 0) {
        // Sort lowest to highest price
        const sorted = [...validPlatformObservations].sort(
          (a, b) => (a.effectivePrice ?? a.price) - (b.effectivePrice ?? b.price)
        );

        const best = sorted[0];
        const worst = sorted[sorted.length - 1];

        bestPlatform = best.platform || 'Unknown Store';
        bestPrice = Number(best.effectivePrice ?? best.price);
        worstPrice = Number(worst.effectivePrice ?? worst.price);
        priceSpread = Math.max(0, worstPrice - bestPrice);
        platformSpreadPercent = bestPrice > 0 ? Number(((priceSpread / bestPrice) * 100).toFixed(2)) : 0;
      }
    }

    // Relative price positions
    // 1. Discount from historical average: positive means current price is cheaper than average
    const discountFromAveragePercent = historicalAverage > 0
      ? Number((((historicalAverage - currentPrice) / historicalAverage) * 100).toFixed(2))
      : 0;

    // 2. Premium over historical low: 0% means at historical low, positive means higher than low
    const premiumOverLowPercent = historicalLow > 0
      ? Number((((currentPrice - historicalLow) / historicalLow) * 100).toFixed(2))
      : 0;

    // 3. Position in historical [Low, High] range: 0.0 (at low) to 1.0 (at high)
    const priceRangeSpan = historicalHigh - historicalLow;
    const rangePosition = priceRangeSpan > 0
      ? Number(((currentPrice - historicalLow) / priceRangeSpan).toFixed(4))
      : 0.5;

    return {
      currentPrice,
      historicalAverage,
      historicalLow,
      historicalHigh,
      priceChange,
      priceChangePercent,
      trend,
      standardDeviation,
      coefficientOfVariation,
      observationCount,
      latestInStock,
      bestPlatform,
      bestPrice,
      worstPrice,
      priceSpread,
      platformSpreadPercent,
      discountFromAveragePercent,
      premiumOverLowPercent,
      rangePosition,
    };
  }
};
