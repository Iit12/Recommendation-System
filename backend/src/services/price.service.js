import { PRICES_DATA } from '../data/prices.data.js';
import { PRODUCTS_DATA } from '../data/products.data.js';
import { calculateEffectivePrice } from '../utils/priceCalculator.js';

export const priceService = {
  /**
   * Get real-time price comparison across supported platforms
   */
  async getProductPrices(productId) {
    if (!productId) return null;
    const cleanId = productId.toLowerCase().trim();

    const rawListings = PRICES_DATA[cleanId];
    if (!rawListings) return null;

    const product = PRODUCTS_DATA.find((p) => p.id.toLowerCase() === cleanId);

    // Compute effective price for each listing
    const calculatedListings = rawListings.map((item) => {
      const effectivePrice = calculateEffectivePrice(
        item.price,
        item.discount,
        item.deliveryCharge
      );

      return {
        ...item,
        effectivePrice,
      };
    });

    // Find the minimum effective price
    const minEffectivePrice = Math.min(
      ...calculatedListings.map((l) => l.effectivePrice)
    );

    const maxEffectivePrice = Math.max(
      ...calculatedListings.map((l) => l.effectivePrice)
    );

    const listingsWithBestFlag = calculatedListings.map((l) => ({
      ...l,
      isLowest: l.effectivePrice === minEffectivePrice,
      badge: l.effectivePrice === minEffectivePrice ? 'Best Price' : l.badge || null,
    }));

    return {
      productId: cleanId,
      productName: product?.name || cleanId,
      variant: product?.variant || '',
      lowestPrice: minEffectivePrice,
      savingsMax: maxEffectivePrice - minEffectivePrice,
      totalStores: calculatedListings.length,
      updatedAt: new Date().toISOString(),
      data: listingsWithBestFlag,
    };
  }
};
