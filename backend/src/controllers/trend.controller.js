import { trendService } from '../services/trend.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const trendController = {
  /**
   * GET /api/v1/products/:id/trends?period=30D
   */
  async getProductTrends(req, res, next) {
    try {
      const { id } = req.params;
      const { period = '30D' } = req.query;

      if (!id || !id.trim()) {
        return sendError(
          res,
          'INVALID_PRODUCT_ID',
          'Product ID parameter is required.',
          400
        );
      }

      const trendData = await trendService.getProductTrends(id, period);

      if (!trendData) {
        return sendError(
          res,
          'TRENDS_NOT_FOUND',
          `No price history trends found for product '${id}'.`,
          404
        );
      }

      return sendSuccess(res, trendData.data, {
        productId: trendData.productId,
        period: trendData.period,
        stats: trendData.stats,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/trends
   */
  async getAllTrends(req, res, next) {
    try {
      const { category = 'all' } = req.query;
      const trends = await trendService.getAllTrends(category);

      return sendSuccess(res, trends, {
        count: trends.length,
        category,
      });
    } catch (error) {
      next(error);
    }
  }
};
