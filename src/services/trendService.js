import { api } from './api';

/**
 * Phase 6 Frontend Trend Service Layer
 * Connects React UI components to MongoDB-backed Phase 6 Trend and Phase 5 History APIs.
 */
export const trendService = {
  /**
   * Fetch statistical trend report for a canonical product from MongoDB
   * GET /api/v1/trends/products/:productId?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  async getProductTrend(productId, filters = {}) {
    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      throw new Error('Product ID is required to fetch trend data.');
    }
    const response = await api.getProductTrend(productId.trim(), filters);
    return response.data;
  },

  /**
   * Fetch platform-segmented trend analysis for a canonical product
   * GET /api/v1/trends/products/:productId/platforms?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  async getPlatformTrends(productId, filters = {}) {
    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      throw new Error('Product ID is required to fetch platform trend data.');
    }
    const response = await api.getPlatformTrends(productId.trim(), filters);
    return {
      productId: response.productId || productId,
      canonicalTitle: response.canonicalTitle,
      filter: response.filter,
      platformsCount: response.platformsCount || Object.keys(response.data || {}).length,
      platforms: response.data || {},
    };
  },

  /**
   * Fetch raw chronological price observations for chart visualization
   * GET /api/v1/history/products/:productId?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  async getProductHistory(productId, filters = {}) {
    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      throw new Error('Product ID is required to fetch price history.');
    }
    const response = await api.getProductHistory(productId.trim(), filters);
    return {
      productId: response.productId || productId,
      canonicalTitle: response.canonicalTitle,
      brand: response.brand,
      model: response.model,
      totalObservations: response.totalObservations || (response.data ? response.data.length : 0),
      observations: response.data || [],
    };
  }
};
