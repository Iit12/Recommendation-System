/**
 * Phase 5 Product Repository
 * Data access layer for the canonical `products` collection.
 */

import { database } from '../connection.js';

export const productRepository = {
  getCollection() {
    return database.getDb().collection('products');
  },

  /**
   * Finds a canonical product by its canonicalId.
   * 
   * @param {string} canonicalId 
   * @returns {Promise<Object|null>}
   */
  async findByCanonicalId(canonicalId) {
    if (!canonicalId) return null;
    return await this.getCollection().findOne({ canonicalId: String(canonicalId) });
  },

  /**
   * Upserts a canonical product record.
   * 
   * @param {Object} product 
   * @returns {Promise<Object>} Upserted product document
   */
  async upsertProduct(product) {
    if (!product || !product.canonicalId) {
      throw new Error('[ProductRepository] Valid product with canonicalId is required for upsert.');
    }

    const now = new Date().toISOString();
    const filter = { canonicalId: String(product.canonicalId) };

    const updateDoc = {
      $set: {
        canonicalTitle: product.canonicalTitle || product.title || 'Untitled Product',
        brand: product.brand || null,
        model: product.model || null,
        storage: product.storage || null,
        ram: product.ram || null,
        color: product.color || null,
        variant: product.variant || null,
        updatedAt: now,
      },
      $setOnInsert: {
        canonicalId: String(product.canonicalId),
        createdAt: product.createdAt || now,
      },
    };

    await this.getCollection().updateOne(filter, updateDoc, { upsert: true });
    return await this.findByCanonicalId(product.canonicalId);
  },

  /**
   * Retrieves all canonical products.
   */
  async findAll({ limit = 50, skip = 0 } = {}) {
    return await this.getCollection()
      .find({})
      .sort({ updatedAt: -1 })
      .skip(Number(skip) || 0)
      .limit(Number(limit) || 50)
      .toArray();
  },

  /**
   * Counts total canonical products in database.
   */
  async count() {
    return await this.getCollection().countDocuments();
  }
};
