/**
 * Phase 8.3 Preference-Aware Recommendation Service
 * Orchestrates candidate retrieval, preference evaluation, scoring, and deterministic ranking.
 */

import { productRepository } from '../database/repositories/product.repository.js';
import { priceHistoryRepository } from '../database/repositories/priceHistory.repository.js';
import { dealService } from '../deals/deal.service.js';
import { alternativeFeatureExtractor } from '../alternatives/alternative.features.js';
import { personalizedValidator } from './personalized.validator.js';
import { personalizedFeatureExtractor } from './personalized.features.js';
import { personalizedScorer } from './personalized.scorer.js';
import { personalizedReasonGenerator } from './personalized.reasons.js';
import {
  PERSONALIZED_SCORING_TYPE,
  PERSONALIZED_WEIGHTS,
  PERSONALIZED_LIMITATIONS,
} from './personalized.constants.js';

function computeMinEffectivePrice(latestObservations = []) {
  if (!Array.isArray(latestObservations) || latestObservations.length === 0) {
    return null;
  }
  const validPrices = latestObservations
    .map((obs) => Number(obs.effectivePrice !== undefined ? obs.effectivePrice : obs.price))
    .filter((p) => !isNaN(p) && p > 0);

  return validPrices.length > 0 ? Math.min(...validPrices) : null;
}

export const personalizedService = {
  /**
   * Generates preference-aware alternative product recommendations.
   * 
   * @param {string} productId Target canonical product ID
   * @param {Object} preferences Optional user preferences
   * @returns {Promise<Object>} Formatted recommendations payload
   */
  async getPersonalizedRecommendations(productId, preferences = {}) {
    // 1. Validate product ID
    const idValidation = personalizedValidator.validateProductId(productId);
    if (!idValidation.valid) {
      const err = new Error(idValidation.error);
      err.code = idValidation.code;
      err.statusCode = 400;
      throw err;
    }

    // 2. Validate preferences payload
    const prefValidation = personalizedValidator.validatePreferences(preferences);
    if (!prefValidation.valid) {
      const err = new Error(prefValidation.error);
      err.code = prefValidation.code;
      err.statusCode = 400;
      throw err;
    }
    const normPreferences = prefValidation.normalizedPreferences;

    // 3. Retrieve target product from database
    const targetProduct = await productRepository.findByCanonicalId(idValidation.productId);
    if (!targetProduct) {
      const err = new Error(`Product with ID "${idValidation.productId}" was not found in catalog.`);
      err.code = 'PRODUCT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // 4. Retrieve target product latest prices & features
    const targetLatestPrices = await priceHistoryRepository.getLatestPricesByProductId(
      idValidation.productId
    );
    const targetEffectivePrice = computeMinEffectivePrice(targetLatestPrices);
    const targetFeatures = alternativeFeatureExtractor.extractProductFeatures(
      targetProduct,
      targetEffectivePrice
    );

    // 5. Retrieve all candidates from database (Read-only)
    const allCandidates = await productRepository.findAll({ limit: 100 });

    // 6. Filter candidates:
    // - Exclude target product itself
    // - Exclude incompatible categories
    const eligibleCandidates = allCandidates.filter((cand) => {
      if (!cand.canonicalId || cand.canonicalId === targetFeatures.canonicalId) {
        return false;
      }
      return true;
    });

    // 7. Evaluate each candidate against preferences
    const evaluatedCandidates = await Promise.all(
      eligibleCandidates.map(async (candidate) => {
        const candLatestPrices = await priceHistoryRepository.getLatestPricesByProductId(
          candidate.canonicalId
        );
        const candEffectivePrice = computeMinEffectivePrice(candLatestPrices);

        // Fetch Phase 8.1 deal score if available
        let dealScore = null;
        try {
          const dealReport = await dealService.getProductDeals(candidate.canonicalId);
          if (dealReport && dealReport.bestDeal) {
            dealScore = dealReport.bestDeal.dealScore;
          }
        } catch {
          // If deal scoring fails or no listings, dealScore defaults to null (neutral 5/10)
          dealScore = null;
        }

        const candFeatures = personalizedFeatureExtractor.extractCandidateFeatures(
          candidate,
          candEffectivePrice,
          dealScore
        );

        // Check category compatibility
        const compCategory = alternativeFeatureExtractor.compareCategory(
          targetFeatures,
          candFeatures
        );
        if (compCategory.compatible === false) {
          return null; // Exclude incompatible categories
        }

        // Evaluate user preferences
        const evaluation = personalizedFeatureExtractor.evaluatePreferences(
          candFeatures,
          normPreferences,
          targetFeatures
        );

        const scoreResult = personalizedScorer.calculateScore(evaluation);
        const reasons = personalizedReasonGenerator.generateReasons(
          candFeatures,
          normPreferences,
          evaluation,
          scoreResult
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
          personalizedScore: scoreResult.personalizedScore,
          breakdown: scoreResult.breakdown,
          reasons,
        };
      })
    );

    const validRecommendations = evaluatedCandidates.filter(Boolean);

    // 8. Deterministic sorting:
    // 1. personalizedScore descending
    // 2. currentPrice ascending (lower price among tied scores)
    // 3. canonicalId alphabetical ascending
    validRecommendations.sort((a, b) => {
      if (b.personalizedScore !== a.personalizedScore) {
        return b.personalizedScore - a.personalizedScore;
      }
      const priceA = a.currentPrice !== null ? a.currentPrice : Infinity;
      const priceB = b.currentPrice !== null ? b.currentPrice : Infinity;
      if (priceA !== priceB) {
        return priceA - priceB;
      }
      return String(a.canonicalId).localeCompare(String(b.canonicalId));
    });

    // 9. Assign integer ranks (1..N)
    const rankedRecommendations = validRecommendations.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    // 10. Return standard JSON payload
    return {
      targetProduct: {
        canonicalId: targetFeatures.canonicalId,
        canonicalTitle: targetFeatures.canonicalTitle,
        brand: targetFeatures.brand,
        model: targetFeatures.model,
        category: targetFeatures.category,
        currentPrice: targetFeatures.effectivePrice,
      },
      preferences: normPreferences,
      recommendations: rankedRecommendations,
      metadata: {
        algorithm: 'preference-aware-content-ranking',
        scoringType: PERSONALIZED_SCORING_TYPE,
        weights: {
          budgetCompatibility: PERSONALIZED_WEIGHTS.BUDGET_COMPATIBILITY,
          specificationMatch: PERSONALIZED_WEIGHTS.SPECIFICATION_MATCH,
          featurePriorityMatch: PERSONALIZED_WEIGHTS.FEATURE_PRIORITY_MATCH,
          brandPreference: PERSONALIZED_WEIGHTS.BRAND_PREFERENCE,
          dealQuality: PERSONALIZED_WEIGHTS.DEAL_QUALITY,
        },
        candidateCount: eligibleCandidates.length,
        recommendationCount: rankedRecommendations.length,
        deterministic: true,
      },
      limitations: [...PERSONALIZED_LIMITATIONS],
    };
  }
};
