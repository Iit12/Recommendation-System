import { PRODUCTS_DATA, CATEGORIES_DATA, POPULAR_SEARCHES_DATA } from '../data/products.data.js';

export const productService = {
  /**
   * Get all products with optional category filter
   */
  async getAllProducts(category = 'all') {
    if (category === 'all') {
      return PRODUCTS_DATA;
    }
    return PRODUCTS_DATA.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  },

  /**
   * Get single product by id
   */
  async getProductById(id) {
    if (!id) return null;
    const cleanId = id.toLowerCase().trim();
    const product = PRODUCTS_DATA.find((p) => p.id.toLowerCase() === cleanId);
    return product || null;
  },

  /**
   * Get available categories
   */
  async getCategories() {
    return CATEGORIES_DATA;
  },

  /**
   * Get popular search terms
   */
  async getPopularSearches() {
    return POPULAR_SEARCHES_DATA;
  }
};
