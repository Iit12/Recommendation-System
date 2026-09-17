import { BaseAdapter } from './base.adapter.js';
import { MOCK_RAW_LISTINGS } from '../mock/mockListings.js';

export class FlipkartAdapter extends BaseAdapter {
  constructor() {
    super('Flipkart', 'flipkart');
  }

  /**
   * Search Flipkart listings (Phase 3 Controlled Mock Adapter)
   * Designed to be replaced with live API / connector in future phases.
   */
  async search(query) {
    const cleanQuery = query.toLowerCase().trim();
    const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);
    const platformListings = MOCK_RAW_LISTINGS.flipkart || [];

    const matches = platformListings.filter((item) => {
      const titleLower = item.title.toLowerCase();
      const idLower = item.canonicalId.toLowerCase();
      return queryTokens.every((token) => titleLower.includes(token) || idLower.includes(token));
    });

    return matches.map((item) => ({
      ...item,
      platform: this.platformName,
      storeId: this.storeId,
    }));
  }
}
