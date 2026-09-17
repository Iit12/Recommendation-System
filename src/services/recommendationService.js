import { api } from './api';

/**
 * Phase 7.2 Frontend Recommendation Service
 * Interfaces with the Phase 7.1 Deterministic Heuristic Recommendation Engine REST API.
 */
export const recommendationService = {
  /**
   * Fetch heuristic purchase recommendation for a canonical product.
   * GET /api/v1/recommendations/products/:productId?from=YYYY-MM-DD&to=YYYY-MM-DD
   * 
   * @param {string} productId Canonical product ID
   * @param {Object} filters Optional { from, to }
   * @returns {Promise<Object>} Recommendation data payload from backend
   */
  async getProductRecommendation(productId, filters = {}) {
    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      throw new Error('Valid Product ID is required to fetch recommendation.');
    }

    const response = await api.getProductRecommendation(productId.trim(), filters);
    return response.data;
  }
};
