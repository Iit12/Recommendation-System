import { alertService } from '../alerts/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const alertController = {
  /**
   * Phase 8.4: POST /api/v1/alerts/evaluate
   * Evaluates user-defined alert conditions against live database listings and historical trends.
   */
  async evaluateAlerts(req, res, next) {
    try {
      const { productId, alerts } = req.body || {};

      if (!productId || typeof productId !== 'string' || !productId.trim()) {
        return sendError(
          res,
          'INVALID_PRODUCT_ID',
          'Product ID is required in request body and must be a non-empty string.',
          400
        );
      }

      const result = await alertService.evaluateAlerts(productId.trim(), alerts);
      return sendSuccess(res, result);
    } catch (error) {
      if (error.code && error.statusCode) {
        return sendError(res, error.code, error.message, error.statusCode);
      }
      next(error);
    }
  }
};
