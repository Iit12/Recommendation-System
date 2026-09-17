/**
 * Phase 5 Database Index Definitions & Management
 * Ensures high-performance queries for historical lookups, aggregation, and unique constraints.
 */

export const indexManager = {
  /**
   * Initializes all required database indexes.
   * 
   * @param {Db} db MongoDB database instance
   */
  async ensureIndexes(db) {
    console.log('[MongoDB] Ensuring database indexes...');

    const productsCollection = db.collection('products');
    const listingsCollection = db.collection('listings');
    const priceHistoryCollection = db.collection('price_history');

    // 1. Products Indexes
    // - Unique canonicalId prevents duplicate canonical product records
    await productsCollection.createIndex(
      { canonicalId: 1 },
      { unique: true, name: 'idx_products_canonicalId_unique' }
    );
    await productsCollection.createIndex(
      { brand: 1, model: 1 },
      { name: 'idx_products_brand_model' }
    );

    // 2. Listings Indexes
    // - Unique compound index on (platform, productUrl) prevents duplicate listing records
    await listingsCollection.createIndex(
      { platform: 1, productUrl: 1 },
      { unique: true, name: 'idx_listings_platform_url_unique' }
    );
    // - Unique listingId
    await listingsCollection.createIndex(
      { listingId: 1 },
      { unique: true, name: 'idx_listings_listingId_unique' }
    );
    // - productId index to fast-fetch all retailer listings belonging to a canonical product
    await listingsCollection.createIndex(
      { productId: 1 },
      { name: 'idx_listings_productId' }
    );

    // 3. Price History Indexes
    // - Compound (productId, collectedAt) for timeline retrieval and date range filtering
    await priceHistoryCollection.createIndex(
      { productId: 1, collectedAt: -1 },
      { name: 'idx_price_history_productId_collectedAt' }
    );
    // - Compound (platform, productId, collectedAt) for platform-specific price history & latest pricing
    await priceHistoryCollection.createIndex(
      { platform: 1, productId: 1, collectedAt: -1 },
      { name: 'idx_price_history_platform_productId_collectedAt' }
    );
    // - Compound (listingId, collectedAt) for tracking listing-specific price movements
    await priceHistoryCollection.createIndex(
      { listingId: 1, collectedAt: -1 },
      { name: 'idx_price_history_listingId_collectedAt' }
    );
    // - Unique sparse index on observationHash to prevent exact duplicate writes during the same collection event
    await priceHistoryCollection.createIndex(
      { observationHash: 1 },
      { unique: true, sparse: true, name: 'idx_price_history_observationHash_unique' }
    );

    console.log('[MongoDB] All database indexes verified successfully.');
  }
};
