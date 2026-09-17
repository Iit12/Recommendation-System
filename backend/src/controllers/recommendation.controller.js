import { recommendationService } from '../services/recommendation.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const recommendationController = {
  /**
   * GET /api/v1/products/:id/recommendation
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

      const recommendation = await recommendationService.getRecommendation(id);

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
