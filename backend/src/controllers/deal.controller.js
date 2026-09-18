import { dealService } from '../deals/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const dealController = {
  /**
   * Phase 8.1: GET /api/v1/deals/products/:productId?from=YYYY-MM-DD&to=YYYY-MM-DD
   * Evaluates current retailer listings, computes Deal Scores, and returns ranked deals with the best deal.
   */
  async getProductDeals(req, res, next) {
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

      const dealReport = await dealService.getProductDeals(productId.trim(), { from, to });
      return sendSuccess(res, dealReport);
    } catch (error) {
      if (error.code && error.statusCode) {
        return sendError(res, error.code, error.message, error.statusCode);
      }
      next(error);
    }
  }
};
