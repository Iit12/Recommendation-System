import { priceService } from '../services/price.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const priceController = {
  /**
   * GET /api/v1/products/:id/prices
   */
  async getProductPrices(req, res, next) {
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

      const priceData = await priceService.getProductPrices(id);

      if (!priceData) {
        return sendError(
          res,
          'PRICES_NOT_FOUND',
          `No price comparison listings found for product '${id}'.`,
          404
        );
      }

      return sendSuccess(res, priceData.data, {
        productId: priceData.productId,
        productName: priceData.productName,
        variant: priceData.variant,
        lowestPrice: priceData.lowestPrice,
        savingsMax: priceData.savingsMax,
        totalStores: priceData.totalStores,
        updatedAt: priceData.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }
};
