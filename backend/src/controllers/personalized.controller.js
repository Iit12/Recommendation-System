import { personalizedService } from '../personalized/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const personalizedController = {
  /**
   * Phase 8.3: POST /api/v1/personalized/recommendations
   * Evaluates user preferences and returns ranked preference-aware recommendations.
   */
  async getPersonalizedRecommendations(req, res, next) {
    try {
      const { productId, preferences } = req.body || {};

      if (!productId || typeof productId !== 'string' || !productId.trim()) {
        return sendError(
          res,
          'INVALID_PRODUCT_ID',
          'Product ID is required in request body and must be a non-empty string.',
          400
        );
      }

      const result = await personalizedService.getPersonalizedRecommendations(
        productId.trim(),
        preferences
      );

      return sendSuccess(res, result);
    } catch (error) {
      if (error.code && error.statusCode) {
        return sendError(res, error.code, error.message, error.statusCode);
      }
      next(error);
    }
  }
};
