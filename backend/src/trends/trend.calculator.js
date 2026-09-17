/**
 * Phase 6 Trend Calculator Engine
 * Pure mathematical functions for price trends, volatility metrics, and deterministic classification.
 */

// Named configuration constants
export const TREND_THRESHOLD_PERCENT = 1.0;

export const TREND_CLASSIFICATIONS = Object.freeze({
  INCREASING: 'INCREASING',
  DECREASING: 'DECREASING',
  STABLE: 'STABLE',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  NO_DATA: 'NO_DATA',
});

export const trendCalculator = {
  /**
   * Computes population standard deviation of numeric values.
   * Population formula: sqrt( sum((x - mean)^2) / N )
   * 
   * @param {Array<number>} values Array of price numbers
   * @param {number} mean Arithmetic mean of values
   * @returns {number} Standard deviation
   */
  calculateStandardDeviation(values, mean) {
    if (!values || values.length <= 1) return 0;

    const sumSquaredDiffs = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
    const variance = sumSquaredDiffs / values.length;
    return Math.sqrt(variance);
  },

  /**
   * Computes price volatility metrics.
   * 
   * @param {Array<number>} prices 
   * @param {number} averagePrice 
   * @returns {Object} { standardDeviation, coefficientOfVariation }
   */
  calculateVolatility(prices, averagePrice) {
    if (!prices || prices.length <= 1) {
      return {
        standardDeviation: 0,
        coefficientOfVariation: 0,
      };
    }

    const stdDev = this.calculateStandardDeviation(prices, averagePrice);
    const cv = averagePrice > 0 ? (stdDev / averagePrice) * 100 : 0;

    return {
      standardDeviation: Number(stdDev.toFixed(2)),
      coefficientOfVariation: Number(cv.toFixed(4)),
    };
  },

  /**
   * Classifies directional trend based on percentage change and observation count.
   * 
   * @param {number} percentageChange 
   * @param {number} count 
   * @param {number} threshold Default 1.0%
   * @returns {string} One of TREND_CLASSIFICATIONS
   */
  classifyTrend(percentageChange, count, threshold = TREND_THRESHOLD_PERCENT) {
    if (count === 0) return TREND_CLASSIFICATIONS.NO_DATA;
    if (count === 1) return TREND_CLASSIFICATIONS.INSUFFICIENT_DATA;

    if (percentageChange < -threshold) {
      return TREND_CLASSIFICATIONS.DECREASING;
    }
    if (percentageChange > threshold) {
      return TREND_CLASSIFICATIONS.INCREASING;
    }
    return TREND_CLASSIFICATIONS.STABLE;
  },

  /**
   * Calculates comprehensive trend statistics from chronologically ordered valid observations.
   * 
   * @param {Array<Object>} validObservations Sorted chronologically (earliest -> latest)
   * @param {number} invalidCount Number of ignored malformed observations
   * @param {number} threshold Trend percentage threshold (default: 1.0%)
   * @returns {Object} Trend statistical report
   */
  calculate(validObservations = [], invalidCount = 0, threshold = TREND_THRESHOLD_PERCENT) {
    const count = validObservations.length;

    // Case 1: No valid observations
    if (count === 0) {
      return {
        currentPrice: null,
        firstPrice: null,
        lowestPrice: null,
        highestPrice: null,
        averagePrice: null,
        priceChange: 0,
        percentageChange: 0,
        trend: TREND_CLASSIFICATIONS.NO_DATA,
        volatility: {
          standardDeviation: 0,
          coefficientOfVariation: 0,
        },
        observationCount: 0,
        invalidObservationCount: invalidCount,
        firstObservedAt: null,
        lastObservedAt: null,
        latestInStock: null,
      };
    }

    const prices = validObservations.map((obs) => Number(obs.effectivePrice !== undefined ? obs.effectivePrice : obs.price));

    const firstObs = validObservations[0];
    const latestObs = validObservations[count - 1];

    const firstPrice = prices[0];
    const currentPrice = prices[count - 1];
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);

    const sumPrices = prices.reduce((acc, p) => acc + p, 0);
    const averagePrice = Number((sumPrices / count).toFixed(2));

    // Case 2: Exactly 1 observation (Cannot infer trend direction)
    if (count === 1) {
      return {
        currentPrice,
        firstPrice,
        lowestPrice,
        highestPrice,
        averagePrice,
        priceChange: 0,
        percentageChange: 0,
        trend: TREND_CLASSIFICATIONS.INSUFFICIENT_DATA,
        volatility: {
          standardDeviation: 0,
          coefficientOfVariation: 0,
        },
        observationCount: 1,
        invalidObservationCount: invalidCount,
        firstObservedAt: firstObs.collectedAt,
        lastObservedAt: latestObs.collectedAt,
        latestInStock: Boolean(latestObs.inStock !== false),
      };
    }

    // Case 3: 2 or more observations
    const priceChange = Number((currentPrice - firstPrice).toFixed(2));
    const percentageChange = firstPrice > 0
      ? Number((((currentPrice - firstPrice) / firstPrice) * 100).toFixed(4))
      : 0;

    const trend = this.classifyTrend(percentageChange, count, threshold);
    const volatility = this.calculateVolatility(prices, averagePrice);

    return {
      currentPrice,
      firstPrice,
      lowestPrice,
      highestPrice,
      averagePrice,
      priceChange,
      percentageChange,
      trend,
      volatility,
      observationCount: count,
      invalidObservationCount: invalidCount,
      firstObservedAt: firstObs.collectedAt,
      lastObservedAt: latestObs.collectedAt,
      latestInStock: Boolean(latestObs.inStock !== false),
    };
  }
};
