import { alternativeService } from '../alternatives/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const alternativeController = {
  /**
   * Phase 8.2: GET /api/v1/alternatives/products/:productId?limit=N
   * Retrieves content-based alternative product recommendations for a target product.
   */
  async getAlternativeProducts(req, res, next) {
    try {
      const { productId } = req.params;
      const { limit } = req.query;

      if (!productId || typeof productId !== 'string' || !productId.trim()) {
        return sendError(
          res,
          'INVALID_PRODUCT_ID',
          'Product ID parameter is required and must be a non-empty string.',
          400
        );
      }

      const alternativesReport = await alternativeService.getAlternativeProducts(productId.trim(), {
        limit,
      });

      return sendSuccess(res, alternativesReport);
    } catch (error) {
      if (error.code && error.statusCode) {
        return sendError(res, error.code, error.message, error.statusCode);
      }
      next(error);
    }
  }
};
