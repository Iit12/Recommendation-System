import { trendService } from '../services/trend.service.js';
import { trendAnalysisService } from '../trends/trend.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const trendController = {
  /**
   * Phase 6: GET /api/v1/trends/products/:productId?from=YYYY-MM-DD&to=YYYY-MM-DD
   * Computes overall statistical trend analysis from MongoDB historical observations.
   */
  async getProductTrendAnalysis(req, res, next) {
    try {
      const { productId } = req.params;
      const { from, to } = req.query;

      if (!productId || typeof productId !== 'string' || !productId.trim()) {
        return sendError(
          res,
          'INVALID_PRODUCT_ID',
          'Product ID parameter is required.',
          400
        );
      }

      const trendReport = await trendAnalysisService.getHistoricalTrend(productId.trim(), { from, to });
      return sendSuccess(res, trendReport);
    } catch (error) {
      if (error.code && error.statusCode) {
        return sendError(res, error.code, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * Phase 6: GET /api/v1/trends/products/:productId/platforms?from=YYYY-MM-DD&to=YYYY-MM-DD
   * Computes platform-segmented statistical trend analysis from MongoDB historical observations.
   */
  async getPlatformTrendAnalysis(req, res, next) {
    try {
      const { productId } = req.params;
      const { from, to } = req.query;

      if (!productId || typeof productId !== 'string' || !productId.trim()) {
        return sendError(
          res,
          'INVALID_PRODUCT_ID',
          'Product ID parameter is required.',
          400
        );
      }

      const platformReport = await trendAnalysisService.getPlatformTrends(productId.trim(), { from, to });
      return sendSuccess(res, platformReport.platforms, {
        productId: platformReport.productId,
        canonicalTitle: platformReport.canonicalTitle,
        filter: platformReport.filter,
        platformsCount: platformReport.platformsCount,
      });
    } catch (error) {
      if (error.code && error.statusCode) {
        return sendError(res, error.code, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * Phase 2: GET /api/v1/products/:id/trends?period=30D or /api/v1/trends/:id
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
   * Phase 2: GET /api/v1/trends
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
