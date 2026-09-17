/**
 * Phase 5 Price History Repository
 * Immutable, append-only time-series data access layer for the `price_history` collection.
 */

import crypto from 'crypto';
import { database } from '../connection.js';

export const priceHistoryRepository = {
  getCollection() {
    return database.getDb().collection('price_history');
  },

  /**
   * Generates a deterministic deduplication hash for an observation in a specific collection event.
   */
  generateObservationHash(productId, listingId, collectedAt) {
    const raw = `${productId}:${listingId}:${collectedAt}`;
    return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
  },

  /**
   * Validates price observation data fields.
   * Throws Error if malformed.
   */
  validateObservation(doc) {
    if (!doc) {
      throw new Error('[PriceHistoryRepository] Price observation document cannot be null or undefined.');
    }

    if (!doc.productId || typeof doc.productId !== 'string' || !doc.productId.trim()) {
      throw new Error('[PriceHistoryRepository] Valid productId is required.');
    }

    if (!doc.platform || typeof doc.platform !== 'string' || !doc.platform.trim()) {
      throw new Error('[PriceHistoryRepository] Valid platform is required.');
    }

    const price = Number(doc.price);
    if (isNaN(price) || price < 0) {
      throw new Error(`[PriceHistoryRepository] Price must be a non-negative number. Received: ${doc.price}`);
    }

    const effectivePrice = Number(doc.effectivePrice !== undefined ? doc.effectivePrice : price);
    if (isNaN(effectivePrice) || effectivePrice < 0) {
      throw new Error(`[PriceHistoryRepository] Effective price must be a non-negative number. Received: ${doc.effectivePrice}`);
    }

    if (!doc.collectedAt || isNaN(new Date(doc.collectedAt).getTime())) {
      throw new Error(`[PriceHistoryRepository] Valid ISO date string is required for collectedAt. Received: ${doc.collectedAt}`);
    }

    return {
      productId: String(doc.productId).trim(),
      listingId: String(doc.listingId || '').trim(),
      platform: String(doc.platform).trim(),
      price,
      originalPrice: Number(doc.originalPrice || price),
      discount: Number(doc.discount || 0),
      deliveryCharge: Number(doc.deliveryCharge || 0),
      effectivePrice,
      currency: String(doc.currency || 'INR').toUpperCase(),
      inStock: Boolean(doc.inStock !== false),
      deliveryText: String(doc.deliveryText || ''),
      collectedAt: new Date(doc.collectedAt).toISOString(),
    };
  },

  /**
   * Inserts an immutable single price observation.
   * Silently ignores duplicate collection event inserts via observationHash.
   * 
   * @param {Object} rawDoc 
   * @returns {Promise<Object|null>} Inserted document or null if duplicate
   */
  async insertObservation(rawDoc) {
    const valid = this.validateObservation(rawDoc);
    const observationHash = this.generateObservationHash(valid.productId, valid.listingId, valid.collectedAt);

    const documentToInsert = {
      ...valid,
      observationHash,
      createdAt: new Date().toISOString(),
    };

    try {
      const result = await this.getCollection().insertOne(documentToInsert);
      return { ...documentToInsert, _id: result.insertedId };
    } catch (err) {
      // Catch MongoDB duplicate key error (code 11000) for identical observationHash in same collection event
      if (err.code === 11000 || err.message.includes('E11000')) {
        console.log(`[PriceHistoryRepository] Skipped duplicate observation (${observationHash}) for collection event.`);
        return null;
      }
      throw err;
    }
  },

  /**
   * Inserts an array of price observations.
   * 
   * @param {Array<Object>} docsArray 
   * @returns {Promise<number>} Count of inserted observations
   */
  async insertBatch(docsArray = []) {
    if (!Array.isArray(docsArray) || docsArray.length === 0) return 0;

    let insertedCount = 0;
    for (const raw of docsArray) {
      const res = await this.insertObservation(raw);
      if (res) insertedCount++;
    }
    return insertedCount;
  },

  /**
   * Retrieves historical price observation timeline for a canonical product.
   * 
   * @param {string} productId Canonical product ID
   * @param {Object} options { fromDate, toDate, limit, sort }
   * @returns {Promise<Array<Object>>}
   */
  async findByProductId(productId, options = {}) {
    if (!productId) return [];

    const filter = { productId: String(productId) };

    if (options.fromDate || options.toDate) {
      filter.collectedAt = {};
      if (options.fromDate) {
        const fromIso = new Date(options.fromDate).toISOString();
        filter.collectedAt.$gte = fromIso;
      }
      if (options.toDate) {
        // If date-only string like '2026-09-17', set to end of day
        const toDateObj = new Date(options.toDate);
        if (options.toDate.length <= 10) {
          toDateObj.setUTCHours(23, 59, 59, 999);
        }
        filter.collectedAt.$lte = toDateObj.toISOString();
      }
    }

    const sortOrder = options.sort === 'asc' || options.sort === 1 ? 1 : -1;
    const limit = Math.min(Number(options.limit) || 200, 1000);

    return await this.getCollection()
      .find(filter)
      .sort({ collectedAt: sortOrder })
      .limit(limit)
      .toArray();
  },

  /**
   * Returns the latest price observation for each platform tracking the product.
   * 
   * @param {string} productId 
   * @returns {Promise<Array<Object>>}
   */
  async getLatestPricesByProductId(productId) {
    if (!productId) return [];

    const pipeline = [
      { $match: { productId: String(productId) } },
      { $sort: { collectedAt: -1 } },
      {
        $group: {
          _id: '$platform',
          latestObservation: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$latestObservation' } },
      { $sort: { effectivePrice: 1 } },
    ];

    return await this.getCollection().aggregate(pipeline).toArray();
  },

  /**
   * Computes basic historical summary statistics for a canonical product.
   * 
   * @param {string} productId 
   * @returns {Promise<Object|null>}
   */
  async getProductSummary(productId) {
    if (!productId) return null;

    const observations = await this.getCollection()
      .find({ productId: String(productId) })
      .sort({ collectedAt: 1 })
      .toArray();

    if (observations.length === 0) {
      return null;
    }

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let sumEffectivePrice = 0;
    const platforms = new Set();

    for (const obs of observations) {
      const price = obs.effectivePrice || obs.price;
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;
      sumEffectivePrice += price;
      if (obs.platform) platforms.add(obs.platform);
    }

    // Latest observation overall
    const latestObs = observations[observations.length - 1];
    const firstObs = observations[0];

    return {
      productId: String(productId),
      currentPrice: latestObs.effectivePrice || latestObs.price,
      lowestPrice: minPrice,
      highestPrice: maxPrice,
      averagePrice: Math.round(sumEffectivePrice / observations.length),
      observationCount: observations.length,
      platformsTracked: Array.from(platforms),
      firstObservedAt: firstObs.collectedAt,
      lastObservedAt: latestObs.collectedAt,
    };
  },

  /**
   * Counts total price observations in database.
   */
  async count() {
    return await this.getCollection().countDocuments();
  }
};
