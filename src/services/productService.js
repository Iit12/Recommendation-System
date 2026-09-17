import { PRODUCTS, POPULAR_SEARCHES, CATEGORIES } from '../data/products';
import { PRICE_TRENDS } from '../data/trends';
import { RECOMMENDATIONS } from '../data/recommendations';

/**
 * Phase 1 Mock Product Service Layer
 * Returns realistic mock data synchronously or with immediate Promise resolution.
 * Completely self-contained for Phase 1 without external network calls.
 */

export const productService = {
  /**
   * Search products by text query, category or brand
   */
  async searchProducts(query = '', category = 'all') {
    const cleanQuery = query.toLowerCase().trim();
    
    return PRODUCTS.filter((product) => {
      const matchesCategory = category === 'all' || product.category.toLowerCase() === category.toLowerCase();
      if (!cleanQuery) return matchesCategory;

      const matchesQuery = 
        product.name.toLowerCase().includes(cleanQuery) ||
        product.brand.toLowerCase().includes(cleanQuery) ||
        product.shortTitle.toLowerCase().includes(cleanQuery) ||
        product.category.toLowerCase().includes(cleanQuery);

      return matchesCategory && matchesQuery;
    });
  },

  /**
   * Fetch a single product by ID or slug with safe default fallback
   */
  async getProductById(id) {
    if (!id) return PRODUCTS[0];
    const cleanId = String(id).toLowerCase().trim();
    const product = PRODUCTS.find((p) => p.id.toLowerCase() === cleanId);
    return product || PRODUCTS[0];
  },

  /**
   * Get store price comparison for a product
   */
  async getPriceComparison(productId) {
    const cleanId = productId ? String(productId).toLowerCase().trim() : 'iphone-16';
    const product = PRODUCTS.find((p) => p.id.toLowerCase() === cleanId) || PRODUCTS[0];
    return {
      productId: product.id,
      productName: product.name,
      variant: product.variant,
      currentLowestPrice: product.currentLowestPrice,
      lowestStore: product.lowestStore,
      savingsMax: product.savingsMax,
      listings: product.listings || [],
      updatedAt: 'Just now',
      totalStores: product.listings?.length || 0,
    };
  },

  /**
   * Get historical price trend series and statistics
   */
  async getPriceHistory(productId, timeframe = '30D') {
    const cleanId = productId ? String(productId).toLowerCase().trim() : 'iphone-16';
    const trendData = PRICE_TRENDS[cleanId] || PRICE_TRENDS['iphone-16'];
    const validTimeframe = ['7D', '30D', '3M', '6M'].includes(timeframe) ? timeframe : '30D';
    return {
      timeframe: validTimeframe,
      stats: trendData?.stats || {
        currentPrice: 68999,
        average30D: 71450,
        lowestRecorded: 67999,
        highestRecorded: 75999,
        changePercent30D: -4.2,
        trendDirection: 'falling',
        trendLabel: 'Falling',
        volatility: 'Low',
      },
      data: trendData?.[validTimeframe] || trendData?.['30D'] || [],
    };
  },

  /**
   * Get AI Buy Now / Wait recommendation
   */
  async getRecommendation(productId) {
    const cleanId = productId ? String(productId).toLowerCase().trim() : 'iphone-16';
    const rec = RECOMMENDATIONS[cleanId] || RECOMMENDATIONS['iphone-16'];
    return rec;
  },

  /**
   * Get trending products for homepage
   */
  async getTrendingProducts() {
    return PRODUCTS;
  },

  /**
   * Get popular search suggestions
   */
  async getPopularSearches() {
    return POPULAR_SEARCHES;
  },

  /**
   * Get available categories
   */
  async getCategories() {
    return CATEGORIES;
  },

  /**
   * Get all products with their trend summaries for /trends page
   */
  async getAllTrends(category = 'all') {
    const filtered = category === 'all' 
      ? PRODUCTS 
      : PRODUCTS.filter((p) => p.category.toLowerCase() === category.toLowerCase());

    return filtered.map((product) => {
      const trend = PRICE_TRENDS[product.id] || PRICE_TRENDS['iphone-16'];
      const rec = RECOMMENDATIONS[product.id] || RECOMMENDATIONS['iphone-16'];
      return {
        ...product,
        trendStats: trend.stats,
        miniHistory: trend['7D'] || [],
        recommendationVerdict: rec.verdict,
        recommendationType: rec.type,
      };
    });
  }
};
