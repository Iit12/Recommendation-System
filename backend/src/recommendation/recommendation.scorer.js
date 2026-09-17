/**
 * Phase 7.1 Recommendation Scorer Engine
 * Pure mathematical heuristic scoring algorithm computing a 0–100 score and action classification.
 */

import {
  RECOMMENDATION_ACTIONS,
  RECOMMENDATION_THRESHOLDS,
  HEURISTIC_WEIGHTS,
  OBSERVATION_THRESHOLDS,
  AVAILABILITY_RULES,
  VOLATILITY_RULES,
} from './recommendation.constants.js';

export const recommendationScorer = {
  /**
   * Computes component score for Current Price vs Historical Average (Weight: 35).
   * 
   * @param {number} discountPercent ((Avg - Current) / Avg) * 100
   * @returns {number} Score component in [0, 35]
   */
  scorePriceVsAverage(discountPercent) {
    const maxWeight = HEURISTIC_WEIGHTS.PRICE_VS_AVERAGE;
    const baseScore = maxWeight / 2; // 17.5 for price exactly equal to average

    // Each 1% discount adds 3.5 points; each 1% premium subtracts 3.5 points
    const componentScore = baseScore + (discountPercent * 3.5);
    return Math.max(0, Math.min(maxWeight, componentScore));
  },

  /**
   * Computes component score for Current Price vs Historical Low Floor (Weight: 25).
   * 
   * @param {number} premiumOverLowPercent ((Current - Low) / Low) * 100
   * @returns {number} Score component in [0, 25]
   */
  scorePriceVsLow(premiumOverLowPercent) {
    const maxWeight = HEURISTIC_WEIGHTS.PRICE_VS_LOW;

    // If at historical low (0% premium), award full 25 points
    // For every 1% above low, deduct 2.5 points
    const componentScore = maxWeight - (premiumOverLowPercent * 2.5);
    return Math.max(0, Math.min(maxWeight, componentScore));
  },

  /**
   * Computes component score for Trend Momentum (Weight: 20).
   * 
   * @param {string} trend 'INCREASING' | 'DECREASING' | 'STABLE' | 'INSUFFICIENT_DATA' | 'NO_DATA'
   * @param {number} discountPercent
   * @returns {number} Score component in [0, 20]
   */
  scoreTrendMomentum(trend, discountPercent) {
    const maxWeight = HEURISTIC_WEIGHTS.TREND_MOMENTUM;

    switch (trend) {
      case 'DECREASING':
        // Downward price movement suggests waiting for lower future prices
        return 5;

      case 'INCREASING':
        // If current price is already attractive (< average), buying now locks in the price before further rises
        if (discountPercent > 0) {
          return 18;
        }
        // If price is rising and already expensive, score is lower
        return 7;

      case 'STABLE':
        // Stable trend is evaluated neutrally (10 out of 20)
        return 10;

      case 'INSUFFICIENT_DATA':
      case 'NO_DATA':
      default:
        return 10;
    }
  },

  /**
   * Computes component score for Cross-Platform Deal Advantage (Weight: 10).
   * 
   * @param {number} platformSpreadPercent Percentage difference between highest and lowest store
   * @returns {number} Score component in [0, 10]
   */
  scorePlatformAdvantage(platformSpreadPercent) {
    const maxWeight = HEURISTIC_WEIGHTS.PLATFORM_ADVANTAGE;
    if (platformSpreadPercent <= 0) return 5;

    // Up to 10 points for spread >= 5%
    const score = 5 + (platformSpreadPercent * 1.0);
    return Math.max(0, Math.min(maxWeight, score));
  },

  /**
   * Computes component score for Price Volatility (Weight: 10).
   * 
   * @param {number} coefficientOfVariation CV percentage
   * @returns {number} Score component in [0, 10]
   */
  scoreVolatility(coefficientOfVariation) {
    const maxWeight = HEURISTIC_WEIGHTS.VOLATILITY_FACTOR;

    // Low volatility (<= 2%) is rewarded; high volatility (> 8%) receives reduced confidence score
    if (coefficientOfVariation <= 2.0) return 10;
    if (coefficientOfVariation <= 5.0) return 8;
    if (coefficientOfVariation <= 8.0) return 5;
    return 3;
  },

  /**
   * Classifies a numerical heuristic score into a concrete action.
   * 
   * @param {number} score 0 to 100
   * @returns {string} One of RECOMMENDATION_ACTIONS
   */
  classifyScore(score) {
    if (score >= RECOMMENDATION_THRESHOLDS.BUY_NOW_MIN_SCORE) {
      return RECOMMENDATION_ACTIONS.BUY_NOW;
    }
    if (score <= RECOMMENDATION_THRESHOLDS.WAIT_MAX_SCORE) {
      return RECOMMENDATION_ACTIONS.WAIT;
    }
    return RECOMMENDATION_ACTIONS.NEUTRAL;
  },

  /**
   * Calculates the final heuristic recommendation score and decision.
   * 
   * @param {Object} features Normalized recommendation features
   * @returns {Object} { action, score, componentScores, overriddenBy }
   */
  calculateScore(features) {
    const {
      discountFromAveragePercent,
      premiumOverLowPercent,
      trend,
      platformSpreadPercent,
      coefficientOfVariation,
      observationCount,
      latestInStock,
    } = features;

    // Special Condition 1: Insufficient observations (< 3) or No Data
    if (observationCount < OBSERVATION_THRESHOLDS.MIN_FOR_RELIABLE_TREND || trend === 'NO_DATA') {
      return {
        action: RECOMMENDATION_ACTIONS.NEUTRAL,
        score: OBSERVATION_THRESHOLDS.INSUFFICIENT_DATA_SCORE,
        componentScores: {
          priceVsAverage: 17.5,
          priceVsLow: 12.5,
          trendMomentum: 10,
          platformAdvantage: 5,
          volatility: 5,
        },
        overriddenBy: observationCount === 0 ? 'NO_DATA' : 'INSUFFICIENT_OBSERVATIONS',
      };
    }

    // Calculate individual components
    const sAvg = this.scorePriceVsAverage(discountFromAveragePercent);
    const sLow = this.scorePriceVsLow(premiumOverLowPercent);
    const sTrend = this.scoreTrendMomentum(trend, discountFromAveragePercent);
    const sPlat = this.scorePlatformAdvantage(platformSpreadPercent);
    const sVol = this.scoreVolatility(coefficientOfVariation);

    let rawScore = sAvg + sLow + sTrend + sPlat + sVol;

    // Special Condition 2: High Volatility Damping
    // High CV (> 8%) dampens extreme scores toward 50 (NEUTRAL)
    if (coefficientOfVariation >= VOLATILITY_RULES.HIGH_CV_THRESHOLD) {
      rawScore = rawScore + (50 - rawScore) * VOLATILITY_RULES.DAMPING_FACTOR_TO_NEUTRAL;
    }

    // Special Condition 3: Out-of-stock item constraint
    let overriddenBy = null;
    if (latestInStock === false) {
      if (rawScore > AVAILABILITY_RULES.OUT_OF_STOCK_MAX_SCORE) {
        rawScore = AVAILABILITY_RULES.OUT_OF_STOCK_MAX_SCORE;
        overriddenBy = 'OUT_OF_STOCK';
      }
    }

    // Clamp score within [0, 100]
    const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));
    const action = this.classifyScore(finalScore);

    return {
      action,
      score: finalScore,
      componentScores: {
        priceVsAverage: Number(sAvg.toFixed(2)),
        priceVsLow: Number(sLow.toFixed(2)),
        trendMomentum: Number(sTrend.toFixed(2)),
        platformAdvantage: Number(sPlat.toFixed(2)),
        volatility: Number(sVol.toFixed(2)),
      },
      overriddenBy,
    };
  }
};
