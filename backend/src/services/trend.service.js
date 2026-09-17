import { TRENDS_DATA } from '../data/trends.data.js';
import { PRODUCTS_DATA } from '../data/products.data.js';
import { RECOMMENDATIONS_DATA } from '../data/recommendations.data.js';

export const trendService = {
  /**
   * Get price history series for a specific product and timeframe
   */
  async getProductTrends(productId, period = '30D') {
    if (!productId) return null;
    const cleanId = productId.toLowerCase().trim();

    const trend = TRENDS_DATA[cleanId];
    if (!trend) return null;

    const validPeriods = ['7D', '30D', '3M', '6M'];
    const selectedPeriod = validPeriods.includes(period.toUpperCase())
      ? period.toUpperCase()
      : '30D';

    return {
      productId: cleanId,
      period: selectedPeriod,
      stats: {
        currentPrice: trend.stats.currentPrice,
        averagePrice: trend.stats.average30D,
        lowestPrice: trend.stats.lowestRecorded,
        highestPrice: trend.stats.highestRecorded,
        changePercent30D: trend.stats.changePercent30D,
        trendDirection: trend.stats.trendDirection,
        trendLabel: trend.stats.trendLabel,
        volatility: trend.stats.volatility,
      },
      data: trend[selectedPeriod] || trend['30D'],
    };
  },

  /**
   * Get overall market trend radar for all catalog items
   */
  async getAllTrends(category = 'all') {
    const products = category === 'all'
      ? PRODUCTS_DATA
      : PRODUCTS_DATA.filter((p) => p.category.toLowerCase() === category.toLowerCase());

    return products.map((prod) => {
      const trend = TRENDS_DATA[prod.id] || TRENDS_DATA['iphone-16'];
      const rec = RECOMMENDATIONS_DATA[prod.id] || RECOMMENDATIONS_DATA['iphone-16'];

      return {
        ...prod,
        trendStats: trend.stats,
        miniHistory: trend['7D'],
        recommendationVerdict: rec.verdict,
        recommendationType: rec.type,
      };
    });
  }
};
