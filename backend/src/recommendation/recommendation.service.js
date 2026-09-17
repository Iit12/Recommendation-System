/**
 * Phase 7.1 Recommendation Service
 * Coordinates database retrieval, trend integration, feature extraction, scoring, and reason generation.
 */

import { productRepository } from '../database/repositories/product.repository.js';
import { priceHistoryRepository } from '../database/repositories/priceHistory.repository.js';
import { trendAnalysisService } from '../trends/trend.service.js';
import { recommendationValidator } from './recommendation.validator.js';
import { recommendationFeatureExtractor } from './recommendation.features.js';
import { recommendationScorer } from './recommendation.scorer.js';
import { recommendationReasonGenerator } from './recommendation.reasons.js';
import {
  RECOMMENDATION_TYPE,
  RECOMMENDATION_LIMITATIONS,
} from './recommendation.constants.js';

export const recommendationService = {
  /**
   * Generates a deterministic heuristic price recommendation for a canonical product.
   * 
   * @param {string} productId Canonical product ID
   * @param {Object} options { from, to }
   * @returns {Promise<Object>} Standardized recommendation report
   */
  async getRecommendation(productId, options = {}) {
    const { from, to } = options;

    // 1. Validate product ID
    const idValidation = recommendationValidator.validateProductId(productId);
    if (!idValidation.valid) {
      const err = new Error(idValidation.error);
      err.code = 'INVALID_PRODUCT_ID';
      err.statusCode = 400;
      throw err;
    }

    // 2. Validate date range
    const dateValidation = recommendationValidator.validateDateRange(from, to);
    if (!dateValidation.valid) {
      const err = new Error(dateValidation.error);
      err.code = 'INVALID_DATE_RANGE';
      err.statusCode = 400;
      throw err;
    }

    // 3. Verify product exists in MongoDB catalog
    const product = await productRepository.findByCanonicalId(idValidation.productId);
    if (!product) {
      const err = new Error(`Product with ID "${idValidation.productId}" was not found in catalog.`);
      err.code = 'PRODUCT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // 4. Retrieve Phase 6 trend statistics and MongoDB platform snapshot
    const [trendReport, latestPlatformPrices] = await Promise.all([
      trendAnalysisService.getHistoricalTrend(idValidation.productId, { from, to }),
      priceHistoryRepository.getLatestPricesByProductId(idValidation.productId),
    ]);

    // 5. Extract normalized recommendation features
    const features = recommendationFeatureExtractor.extractFeatures(trendReport, latestPlatformPrices);

    // 6. Compute heuristic score and action decision
    const scoreResult = recommendationScorer.calculateScore(features);

    // 7. Generate explainable reason bullets
    const reasons = recommendationReasonGenerator.generateReasons(features, scoreResult);

    // 8. Return clean standard response contract
    return {
      product: {
        productId: product.canonicalId,
        canonicalTitle: product.canonicalTitle,
        brand: product.brand,
        model: product.model,
      },
      recommendation: {
        action: scoreResult.action,
        score: scoreResult.score,
        type: RECOMMENDATION_TYPE,
        componentScores: scoreResult.componentScores,
      },
      reasons,
      evidence: {
        currentPrice: features.currentPrice,
        historicalAverage: features.historicalAverage,
        historicalLow: features.historicalLow,
        historicalHigh: features.historicalHigh,
        priceChange: features.priceChange,
        priceChangePercent: features.priceChangePercent,
        trend: features.trend,
        standardDeviation: features.standardDeviation,
        coefficientOfVariation: features.coefficientOfVariation,
        observations: features.observationCount,
        latestInStock: features.latestInStock,
      },
      platform: {
        bestPlatform: features.bestPlatform,
        bestPrice: features.bestPrice,
        priceSpread: features.priceSpread,
        platformSpreadPercent: features.platformSpreadPercent,
      },
      filter: {
        from: from || null,
        to: to || null,
      },
      limitations: [...RECOMMENDATION_LIMITATIONS],
    };
  }
};
