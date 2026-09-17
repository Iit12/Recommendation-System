import { searchService } from '../services/search.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const searchController = {
  /**
   * GET /api/v1/search?q=<query>&category=<category>
   */
  async searchProducts(req, res, next) {
    try {
      const { q: query, category = 'all' } = req.query;

      // Handle missing or empty query
      if (!query || typeof query !== 'string' || !query.trim()) {
        return sendError(
          res,
          'MISSING_SEARCH_QUERY',
          'Search query parameter "q" is required and cannot be empty.',
          400
        );
      }

      const result = await searchService.search(query, category);

      return sendSuccess(res, result.data, {
        query: result.query,
        count: result.count,
      });
    } catch (error) {
      next(error);
    }
  }
};
