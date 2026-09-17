import { productService } from '../services/product.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const productController = {
  /**
   * GET /api/v1/products
   */
  async getAllProducts(req, res, next) {
    try {
      const { category = 'all' } = req.query;
      const products = await productService.getAllProducts(category);

      return sendSuccess(res, products, {
        count: products.length,
        category,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/products/:id
   */
  async getProductById(req, res, next) {
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

      const product = await productService.getProductById(id);

      if (!product) {
        return sendError(
          res,
          'PRODUCT_NOT_FOUND',
          `Product with ID '${id}' was not found.`,
          404
        );
      }

      return sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/products/meta/categories
   */
  async getCategories(req, res, next) {
    try {
      const categories = await productService.getCategories();
      return sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/products/meta/popular-searches
   */
  async getPopularSearches(req, res, next) {
    try {
      const searches = await productService.getPopularSearches();
      return sendSuccess(res, searches);
    } catch (error) {
      next(error);
    }
  }
};
