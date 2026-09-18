/**
 * Phase 8.2 Alternative Product Recommendation Service
 * Coordinates MongoDB candidate retrieval, specification comparison, heuristic scoring, deterministic ranking.
 */

import { productRepository } from '../database/repositories/product.repository.js';
import { priceHistoryRepository } from '../database/repositories/priceHistory.repository.js';
import { alternativeValidator } from './alternative.validator.js';
import { alternativeFeatureExtractor } from './alternative.features.js';
import { alternativeScorer } from './alternative.scorer.js';
import { alternativeReasonGenerator } from './alternative.reasons.js';
import {
  ALTERNATIVE_SCORING_TYPE,
  ALTERNATIVE_WEIGHTS,
  ALTERNATIVE_LIMITATIONS,
} from './alternative.constants.js';

// Helper to compute minimum effective price from latest platform observations
function computeMinEffectivePrice(latestObservations = []) {
  if (!Array.isArray(latestObservations) || latestObservations.length === 0) {
    return null;
  }
  const validPrices = latestObservations
    .map((obs) => Number(obs.effectivePrice !== undefined ? obs.effectivePrice : obs.price))
    .filter((p) => !isNaN(p) && p > 0);

  return validPrices.length > 0 ? Math.min(...validPrices) : null;
}

export const alternativeService = {
  /**
   * Retrieves content-based alternative product recommendations for a target product.
   * 
   * @param {string} productId Canonical product ID of the target product
   * @param {Object} options Optional query options { limit }
   * @returns {Promise<Object>} Formatted alternative recommendations payload
   */
  async getAlternativeProducts(productId, options = {}) {
    // 1. Validate product ID
    const idValidation = alternativeValidator.validateProductId(productId);
    if (!idValidation.valid) {
      const err = new Error(idValidation.error);
      err.code = 'INVALID_PRODUCT_ID';
      err.statusCode = 400;
      throw err;
    }

    // 2. Validate limit
    const limitValidation = alternativeValidator.validateLimit(options.limit);
    if (!limitValidation.valid) {
      const err = new Error(limitValidation.error);
      err.code = 'INVALID_LIMIT';
      err.statusCode = 400;
      throw err;
    }
    const limit = limitValidation.limit;

    // 3. Retrieve target product from database
    const targetProduct = await productRepository.findByCanonicalId(idValidation.productId);
    if (!targetProduct) {
      const err = new Error(`Product with ID "${idValidation.productId}" was not found in catalog.`);
      err.code = 'PRODUCT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // 4. Retrieve target product latest prices
    const targetLatestPrices = await priceHistoryRepository.getLatestPricesByProductId(
      idValidation.productId
    );
    const targetEffectivePrice = computeMinEffectivePrice(targetLatestPrices);
    const targetFeatures = alternativeFeatureExtractor.extractProductFeatures(
      targetProduct,
      targetEffectivePrice
    );

    // 5. Retrieve candidate products from database (Read-only)
    const allCandidates = await productRepository.findAll({ limit: 100 });

    // 6. Filter candidates:
    // - Exclude target product itself
    // - Exclude clearly incompatible categories if both are known
    const eligibleCandidates = allCandidates.filter((cand) => {
      if (!cand.canonicalId || cand.canonicalId === targetFeatures.canonicalId) {
        return false; // Prevent self-recommendation
      }
      return true;
    });

    // 7. For each candidate, fetch latest prices and evaluate similarity
    const evaluatedCandidates = await Promise.all(
      eligibleCandidates.map(async (candidate) => {
        const candLatestPrices = await priceHistoryRepository.getLatestPricesByProductId(
          candidate.canonicalId
        );
        const candEffectivePrice = computeMinEffectivePrice(candLatestPrices);
        const candFeatures = alternativeFeatureExtractor.extractProductFeatures(
          candidate,
          candEffectivePrice
        );

        // Compute comparisons and scores
        const comparisons = alternativeFeatureExtractor.compareFeatures(
          targetFeatures,
          candFeatures
        );

        // Filter out completely incompatible categories if both have known conflicting categories
        if (comparisons.category.compatible === false) {
          return null;
        }

        const scoreResult = alternativeScorer.calculateScore(comparisons);
        const reasons = alternativeReasonGenerator.generateReasons(
          targetFeatures,
          candFeatures,
          comparisons
        );

        return {
          canonicalId: candidate.canonicalId,
          title: candFeatures.canonicalTitle,
          brand: candFeatures.brand,
          model: candFeatures.model,
          storage: candFeatures.storage,
          ram: candFeatures.ram,
          color: candFeatures.color,
          variant: candFeatures.variant,
          category: candFeatures.category,
          currentPrice: candFeatures.effectivePrice,
          recommendationScore: scoreResult.recommendationScore,
          breakdown: scoreResult.breakdown,
          reasons,
        };
      })
    );

    // Filter out nulls from incompatible categories
    const validRecommendations = evaluatedCandidates.filter(Boolean);

    // 8. Deterministic sorting / ranking:
    // 1. recommendationScore descending
    // 2. currentPrice ascending (lower price preferred among tied scores)
    // 3. canonicalId alphabetical ascending
    validRecommendations.sort((a, b) => {
      if (b.recommendationScore !== a.recommendationScore) {
        return b.recommendationScore - a.recommendationScore;
      }
      const priceA = a.currentPrice !== null ? a.currentPrice : Infinity;
      const priceB = b.currentPrice !== null ? b.currentPrice : Infinity;
      if (priceA !== priceB) {
        return priceA - priceB;
      }
      return String(a.canonicalId).localeCompare(String(b.canonicalId));
    });

    // 9. Apply limit and assign integer ranks
    const rankedRecommendations = validRecommendations
      .slice(0, limit)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
      }));

    // 10. Assemble standard JSON response
    return {
      targetProduct: {
        canonicalId: targetFeatures.canonicalId,
        canonicalTitle: targetFeatures.canonicalTitle,
        brand: targetFeatures.brand,
        model: targetFeatures.model,
        category: targetFeatures.category,
        currentPrice: targetFeatures.effectivePrice,
      },
      recommendations: rankedRecommendations,
      metadata: {
        candidateCount: eligibleCandidates.length,
        recommendationCount: rankedRecommendations.length,
        limit,
        algorithm: ALTERNATIVE_SCORING_TYPE,
        weights: {
          featureSimilarity: ALTERNATIVE_WEIGHTS.FEATURE_SIMILARITY,
          priceCompatibility: ALTERNATIVE_WEIGHTS.PRICE_COMPATIBILITY,
          categoryCompatibility: ALTERNATIVE_WEIGHTS.CATEGORY_COMPATIBILITY,
          brandVariantCompatibility: ALTERNATIVE_WEIGHTS.BRAND_VARIANT,
        },
        deterministic: true,
      },
      limitations: [...ALTERNATIVE_LIMITATIONS],
    };
  }
};
