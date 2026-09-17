import { recommendationService as legacyRecommendationService } from '../services/recommendation.service.js';
import { recommendationService as recommendationEngineService } from '../recommendation/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const recommendationController = {
  /**
   * Phase 7.1: GET /api/v1/recommendations/products/:productId?from=YYYY-MM-DD&to=YYYY-MM-DD
   * Computes deterministic heuristic price recommendation from MongoDB historical price observations.
   */
  async getProductRecommendation(req, res, next) {
    try {
      const { productId } = req.params;
      const { from, to } = req.query;

      if (!productId || typeof productId !== 'string' || !productId.trim()) {
        return sendError(
          res,
          'INVALID_PRODUCT_ID',
          'Product ID parameter is required and must be a non-empty string.',
          400
        );
      }

      const recommendation = await recommendationEngineService.getRecommendation(productId.trim(), { from, to });
      return sendSuccess(res, recommendation);
    } catch (error) {
      if (error.code && error.statusCode) {
        return sendError(res, error.code, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * Phase 2 Backward Compatibility: GET /api/v1/products/:id/recommendation or /api/v1/recommendations/:id
   */
  async getRecommendation(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || !id.trim()) {
        return sendError(
          res,
          'INVALID_PRODUCT_ID',
          'Product ID parameter is required.',
          400
        );
      }

      const recommendation = await legacyRecommendationService.getRecommendation(id);

      if (!recommendation) {
        return sendError(
          res,
          'RECOMMENDATION_NOT_FOUND',
          `No recommendation model output found for product '${id}'.`,
          404
        );
      }

      return sendSuccess(res, recommendation, {
        productId: recommendation.productId,
      });
    } catch (error) {
      next(error);
    }
  }
};
