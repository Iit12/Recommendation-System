import { BaseAdapter } from './base.adapter.js';
import { MOCK_RAW_LISTINGS } from '../mock/mockListings.js';

export class AmazonAdapter extends BaseAdapter {
  constructor() {
    super('Amazon', 'amazon');
  }

  /**
   * Search Amazon listings (Phase 3 Controlled Mock Adapter)
   * Designed to be replaced with live API / connector in future phases.
   */
  async search(query) {
    const cleanQuery = query.toLowerCase().trim();
    const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);
    const platformListings = MOCK_RAW_LISTINGS.amazon || [];

    // Filter listings matching any of the query tokens or canonicalId
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
