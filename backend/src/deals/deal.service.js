/**
 * Phase 8.1 Deal Service
 * Coordinates MongoDB data retrieval, feature extraction, scoring, deterministic ranking, and best deal selection.
 */

import { productRepository } from '../database/repositories/product.repository.js';
import { listingRepository } from '../database/repositories/listing.repository.js';
import { priceHistoryRepository } from '../database/repositories/priceHistory.repository.js';
import { trendAnalysisService } from '../trends/trend.service.js';
import { dealValidator } from './deal.validator.js';
import { dealFeatureExtractor } from './deal.features.js';
import { dealScorer } from './deal.scorer.js';
import { dealReasonGenerator } from './deal.reasons.js';
import {
  DEAL_SCORING_TYPE,
  DEAL_WEIGHTS,
  DEAL_LIMITATIONS,
} from './deal.constants.js';

export const dealService = {
  /**
   * Evaluates all current listings for a canonical product, assigns Deal Scores, and determines the best deal.
   * 
   * @param {string} productId Canonical product ID
   * @param {Object} options Optional { from, to }
   * @returns {Promise<Object>} Comprehensive deal ranking response
   */
  async getProductDeals(productId, options = {}) {
    const { from, to } = options;

    // 1. Validate product ID
    const idValidation = dealValidator.validateProductId(productId);
    if (!idValidation.valid) {
      const err = new Error(idValidation.error);
      err.code = 'INVALID_PRODUCT_ID';
      err.statusCode = 400;
      throw err;
    }

    // 2. Validate date range parameters
    const dateValidation = dealValidator.validateDateRange(from, to);
    if (!dateValidation.valid) {
      const err = new Error(dateValidation.error);
      err.code = 'INVALID_DATE_RANGE';
      err.statusCode = 400;
      throw err;
    }

    // 3. Verify product exists in catalog
    const product = await productRepository.findByCanonicalId(idValidation.productId);
    if (!product) {
      const err = new Error(`Product with ID "${idValidation.productId}" was not found in catalog.`);
      err.code = 'PRODUCT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // 4. Retrieve historical trend baseline, latest platform prices, and listing metadata
    const [trendReport, latestPriceObservations, listingMetadata] = await Promise.all([
      trendAnalysisService.getHistoricalTrend(idValidation.productId, { from, to }),
      priceHistoryRepository.getLatestPricesByProductId(idValidation.productId),
      listingRepository.findByProductId(idValidation.productId),
    ]);

    // 5. Extract deal features
    const { marketOverview, listingFeatures } = dealFeatureExtractor.extractFeatures(
      latestPriceObservations,
      listingMetadata,
      trendReport
    );

    // 6. Score and evaluate each listing
    const evaluatedListings = listingFeatures.map((feat) => {
      const scoreResult = dealScorer.calculateScore(feat);
      const reasons = dealReasonGenerator.generateReasons(feat, scoreResult, marketOverview);

      return {
        listingId: feat.listingId,
        platform: feat.platform,
        productUrl: feat.productUrl,
        storeId: feat.storeId,
        sellerName: feat.sellerName,
        sellerRating: feat.sellerRating,
        price: feat.price,
        originalPrice: feat.originalPrice,
        discount: feat.discount,
        deliveryCharge: feat.deliveryCharge,
        effectivePrice: feat.effectivePrice,
        currency: feat.currency,
        inStock: feat.inStock,
        deliveryText: feat.deliveryText,
        dealScore: scoreResult.dealScore,
        componentScores: scoreResult.componentScores,
        overriddenBy: scoreResult.overriddenBy,
        reasons,
      };
    });

    // 7. Sort listings with deterministic tie-breaking:
    // Primary: dealScore descending
    // Tie-breaker 1: effectivePrice ascending (lower price wins)
    // Tie-breaker 2: sellerRating descending (higher rating wins)
    // Tie-breaker 3: platform alphabetical ascending
    evaluatedListings.sort((a, b) => {
      if (b.dealScore !== a.dealScore) {
        return b.dealScore - a.dealScore;
      }
      if (a.effectivePrice !== b.effectivePrice) {
        return a.effectivePrice - b.effectivePrice;
      }
      const ratingA = a.sellerRating != null ? a.sellerRating : 0;
      const ratingB = b.sellerRating != null ? b.sellerRating : 0;
      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }
      return String(a.platform).localeCompare(String(b.platform));
    });

    // 8. Assign integer ranks
    const rankedListings = evaluatedListings.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    // 9. Select bestDeal (Top-ranked in-stock listing)
    const bestInStockListing = rankedListings.find((item) => item.inStock === true);
    const bestDeal = bestInStockListing
      ? {
          rank: bestInStockListing.rank,
          listingId: bestInStockListing.listingId,
          platform: bestInStockListing.platform,
          price: bestInStockListing.price,
          deliveryCharge: bestInStockListing.deliveryCharge,
          effectivePrice: bestInStockListing.effectivePrice,
          dealScore: bestInStockListing.dealScore,
          inStock: bestInStockListing.inStock,
          sellerName: bestInStockListing.sellerName,
          sellerRating: bestInStockListing.sellerRating,
          reasons: bestInStockListing.reasons,
        }
      : null;

    // 10. Assemble and return standard response payload
    return {
      product: {
        productId: product.canonicalId,
        canonicalTitle: product.canonicalTitle,
        brand: product.brand,
        model: product.model,
      },
      bestDeal,
      rankedListings,
      market: {
        lowestPrice: marketOverview.lowestPrice,
        highestPrice: marketOverview.highestPrice,
        priceSpread: marketOverview.priceSpread,
        platformCount: marketOverview.platformCount,
        inStockCount: marketOverview.inStockCount,
      },
      scoring: {
        type: DEAL_SCORING_TYPE,
        weights: {
          pricePosition: DEAL_WEIGHTS.PRICE_POSITION,
          platformAdvantage: DEAL_WEIGHTS.PLATFORM_ADVANTAGE,
          discount: DEAL_WEIGHTS.DISCOUNT,
          delivery: DEAL_WEIGHTS.DELIVERY,
          sellerRating: DEAL_WEIGHTS.SELLER_RATING,
        },
      },
      filter: {
        from: from || null,
        to: to || null,
      },
      limitations: [...DEAL_LIMITATIONS],
    };
  }
};
