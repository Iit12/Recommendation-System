/**
 * Phase 5 Price Persistence Service
 * Coordinates Phase 3 collection, Phase 4 matching, and MongoDB database persistence.
 */

import { matchingService } from '../matching/matching.service.js';
import { productRepository } from '../database/repositories/product.repository.js';
import { listingRepository } from '../database/repositories/listing.repository.js';
import { priceHistoryRepository } from '../database/repositories/priceHistory.repository.js';

export const pricePersistenceService = {
  /**
   * Executes the full pipeline:
   * Query -> Phase 3 Collect -> Phase 4 Match & Group -> Phase 5 MongoDB Upsert & Insert Observations.
   * 
   * @param {string} query Search query
   * @param {Array<string>} platforms Optional list of platform IDs
   * @returns {Promise<Object>} Persistence execution summary
   */
  async collectAndPersist(query, platforms = []) {
    const startTime = Date.now();

    // 1. Run Phase 3 Collection + Phase 4 Matching & Grouping
    const matchingResult = await matchingService.searchAndGroup(query, platforms);
    const { groups, collectedAt, platformsSuccessful, platformsRequested, totalListings } = matchingResult;

    let totalProductsUpserted = 0;
    let totalListingsUpserted = 0;
    let totalObservationsSaved = 0;
    const savedProductsSummary = [];

    // 2. Persist each canonical product group and its observations
    for (const group of groups) {
      const canonicalAttrs = group.canonicalProduct || {};
      const canonicalId = group.groupId;

      // A. Upsert Canonical Product Document
      const upsertedProduct = await productRepository.upsertProduct({
        canonicalId,
        canonicalTitle: canonicalAttrs.title,
        brand: canonicalAttrs.brand,
        model: canonicalAttrs.model,
        storage: canonicalAttrs.storage,
        ram: canonicalAttrs.ram,
        color: canonicalAttrs.color,
        variant: canonicalAttrs.variant,
      });
      totalProductsUpserted++;

      let groupListingsUpserted = 0;
      let groupObservationsSaved = 0;

      // B. Upsert Retailer Listings & Insert Price Observations
      for (const item of group.listings) {
        // Upsert listing record referencing canonical productId
        const upsertedListing = await listingRepository.upsertListing({
          productId: canonicalId,
          platform: item.platform,
          storeId: item.storeId || item.platform,
          listingTitle: item.listingTitle,
          productUrl: item.productUrl,
          sellerName: item.sellerName,
          sellerRating: item.sellerRating,
        });
        groupListingsUpserted++;
        totalListingsUpserted++;

        // Create immutable append-only price observation
        const observationDoc = {
          productId: canonicalId,
          listingId: upsertedListing.listingId,
          platform: item.platform,
          price: item.price,
          originalPrice: item.originalPrice,
          discount: item.discount,
          deliveryCharge: item.deliveryCharge,
          effectivePrice: item.effectivePrice,
          currency: item.currency || 'INR',
          inStock: item.inStock,
          deliveryText: item.deliveryText,
          collectedAt: item.collectedAt || collectedAt,
        };

        const insertedObs = await priceHistoryRepository.insertObservation(observationDoc);
        if (insertedObs) {
          groupObservationsSaved++;
          totalObservationsSaved++;
        }
      }

      savedProductsSummary.push({
        canonicalId,
        canonicalTitle: canonicalAttrs.title,
        listingsCount: groupListingsUpserted,
        observationsSaved: groupObservationsSaved,
      });
    }

    const duration = Date.now() - startTime;
    console.log(
      `[PricePersistenceService] Successfully persisted query "${query}": ${totalProductsUpserted} products, ${totalListingsUpserted} listings, ${totalObservationsSaved} price observations in ${duration}ms`
    );

    return {
      query,
      collectedAt,
      platformsRequested,
      platformsSuccessful,
      totalListings,
      totalCanonicalProducts: groups.length,
      productsUpserted: totalProductsUpserted,
      listingsUpserted: totalListingsUpserted,
      observationsSaved: totalObservationsSaved,
      savedProducts: savedProductsSummary,
    };
  }
};
