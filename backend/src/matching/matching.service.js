/**
 * Phase 4 Matching Service
 * Coordinates multi-platform listing collection and NLP matching/grouping pipeline.
 */

import { collectionService } from '../collectors/collection.service.js';
import { productGrouper } from './productGrouper.js';

export const matchingService = {
  /**
   * Executes the full pipeline:
   * Query -> Phase 3 Multi-Platform Collection -> Phase 4 Attribute Extraction & Matching -> Canonical Product Groups
   * 
   * @param {string} query Search query
   * @param {Array<string>} platformFilter Optional list of platform IDs
   * @returns {Promise<Object>} Grouped matching result
   */
  async searchAndGroup(query, platformFilter = []) {
    const startTime = Date.now();

    // Step 1: Collect normalized listings from Phase 3 collection service
    const collectionResult = await collectionService.collectListings(query, platformFilter);

    // Step 2: Group normalized listings using explainable attribute-aware matching
    const groups = productGrouper.groupListings(collectionResult.listings);

    const duration = Date.now() - startTime;
    console.log(
      `[MatchingService] Completed grouping for "${collectionResult.query}": ${collectionResult.totalListings} listings -> ${groups.length} canonical groups in ${duration}ms`
    );

    return {
      query: collectionResult.query,
      collectedAt: collectionResult.collectedAt,
      platformsRequested: collectionResult.platformsRequested,
      platformsSuccessful: collectionResult.platformsSuccessful,
      totalListings: collectionResult.totalListings,
      totalProductGroups: groups.length,
      groups,
    };
  }
};
