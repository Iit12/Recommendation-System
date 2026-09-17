/**
 * Phase 5 Database Module Index
 */

import { database } from './connection.js';
import { indexManager } from './indexes.js';
import { productRepository } from './repositories/product.repository.js';
import { listingRepository } from './repositories/listing.repository.js';
import { priceHistoryRepository } from './repositories/priceHistory.repository.js';

export {
  database,
  indexManager,
  productRepository,
  listingRepository,
  priceHistoryRepository,
};

/**
 * Initializes database connection and ensures all collections & indexes are created.
 */
export async function initDatabase() {
  try {
    const db = await database.connect();
    await indexManager.ensureIndexes(db);
    return db;
  } catch (error) {
    console.error('[Database] Initialization error:', error.message);
    throw error;
  }
}
