import { PRODUCTS_DATA } from '../data/products.data.js';

export const searchService = {
  /**
   * Search products by text query and optional category filter
   */
  async search(query = '', category = 'all') {
    const cleanQuery = query.toLowerCase().trim();

    if (!cleanQuery) {
      return {
        query: '',
        count: 0,
        data: []
      };
    }

    const matches = PRODUCTS_DATA.filter((product) => {
      const matchesCategory = category === 'all' || product.category.toLowerCase() === category.toLowerCase();
      
      const matchesQuery =
        product.name.toLowerCase().includes(cleanQuery) ||
        product.brand.toLowerCase().includes(cleanQuery) ||
        product.model.toLowerCase().includes(cleanQuery) ||
        product.shortTitle.toLowerCase().includes(cleanQuery) ||
        product.category.toLowerCase().includes(cleanQuery) ||
        product.id.toLowerCase().includes(cleanQuery.replace(/\s+/g, '-'));

      return matchesCategory && matchesQuery;
    });

    const formattedResults = matches.map((item) => ({
      id: item.id,
      name: item.name,
      shortTitle: item.shortTitle,
      brand: item.brand,
      variant: item.variant,
      color: item.color,
      category: item.category,
      image: item.image,
      lowestPrice: item.currentLowestPrice,
      originalPrice: item.originalPrice,
      discountPercent: item.discountPercent,
      lowestStore: item.lowestStore,
      rating: item.rating,
      reviewCount: item.reviewCount
    }));

    return {
      query,
      count: formattedResults.length,
      data: formattedResults
    };
  }
};
