/**
 * Smart Shopping REST API Client Layer
 * Connects React UI to Express Backend endpoints
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1';

/**
 * Universal fetch wrapper with JSON parsing and standardized error handling
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const error = new Error(
        data.error?.message || `Request failed with status ${response.status}`
      );
      error.status = response.status;
      error.code = data.error?.code || 'API_ERROR';
      error.details = data.error?.details;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      console.warn(`[API Connection] Unable to reach backend at ${url}.`);
      const networkError = new Error('Could not connect to the Smart Shopping API server.');
      networkError.code = 'NETWORK_ERROR';
      throw networkError;
    }
    throw err;
  }
}

export const api = {
  /**
   * GET /api/v1/search?q=<query>&category=<category>
   */
  async searchProducts(query, category = 'all') {
    if (!query || !query.trim()) {
      return { success: true, count: 0, data: [] };
    }
    const params = new URLSearchParams({ q: query.trim() });
    if (category && category !== 'all') {
      params.append('category', category);
    }
    return request(`/search?${params.toString()}`);
  },

  /**
   * GET /api/v1/products/:id
   */
  async getProduct(productId) {
    return request(`/products/${encodeURIComponent(productId)}`);
  },

  /**
   * GET /api/v1/products (all products)
   */
  async getAllProducts(category = 'all') {
    const params = category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/products${params}`);
  },

  /**
   * GET /api/v1/products/:id/prices
   */
  async getPrices(productId) {
    return request(`/products/${encodeURIComponent(productId)}/prices`);
  },

  /**
   * GET /api/v1/products/:id/trends?period=30D
   */
  async getPriceTrends(productId, period = '30D') {
    return request(`/products/${encodeURIComponent(productId)}/trends?period=${encodeURIComponent(period)}`);
  },

  /**
   * GET /api/v1/products/:id/recommendation
   */
  async getRecommendation(productId) {
    return request(`/products/${encodeURIComponent(productId)}/recommendation`);
  },

  /**
   * GET /api/v1/trends (all trends radar)
   */
  async getAllTrends(category = 'all') {
    const params = category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/trends${params}`);
  },

  /**
   * Phase 6: GET /api/v1/trends/products/:productId?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  async getProductTrend(productId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/trends/products/${encodeURIComponent(productId)}${queryString}`);
  },

  /**
   * Phase 6: GET /api/v1/trends/products/:productId/platforms?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  async getPlatformTrends(productId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/trends/products/${encodeURIComponent(productId)}/platforms${queryString}`);
  },

  /**
   * Phase 7.1: GET /api/v1/recommendations/products/:productId?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  async getProductRecommendation(productId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/recommendations/products/${encodeURIComponent(productId)}${queryString}`);
  },

  /**
   * Phase 5: GET /api/v1/history/products/:productId?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  async getProductHistory(productId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.limit) params.append('limit', filters.limit);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/history/products/${encodeURIComponent(productId)}${queryString}`);
  },

  /**
   * GET /api/v1/products/meta/categories
   */
  async getCategories() {
    return request('/products/meta/categories');
  },

  /**
   * GET /api/v1/products/meta/popular-searches
   */
  async getPopularSearches() {
    return request('/products/meta/popular-searches');
  }
};
