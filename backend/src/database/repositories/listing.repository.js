/**
 * Phase 5 Listing Repository
 * Data access layer for the retailer-specific `listings` collection.
 */

import crypto from 'crypto';
import { database } from '../connection.js';

export const listingRepository = {
  getCollection() {
    return database.getDb().collection('listings');
  },

  /**
   * Generates a deterministic unique identifier for a platform listing.
   */
  generateListingId(platform, productUrl) {
    const cleanPlatform = String(platform || 'unknown').toLowerCase().trim();
    const cleanUrl = String(productUrl || '').trim();
    const hash = crypto.createHash('sha256').update(`${cleanPlatform}:${cleanUrl}`).digest('hex').slice(0, 12);
    return `${cleanPlatform}-${hash}`;
  },

  /**
   * Finds listing by deterministic listingId.
   */
  async findByListingId(listingId) {
    if (!listingId) return null;
    return await this.getCollection().findOne({ listingId: String(listingId) });
  },

  /**
   * Finds listing by platform and productUrl.
   */
  async findByPlatformAndUrl(platform, productUrl) {
    if (!platform || !productUrl) return null;
    return await this.getCollection().findOne({
      platform: String(platform),
      productUrl: String(productUrl),
    });
  },

  /**
   * Finds all retailer listings mapped to a canonical product.
   */
  async findByProductId(productId) {
    if (!productId) return [];
    return await this.getCollection()
      .find({ productId: String(productId) })
      .sort({ platform: 1 })
      .toArray();
  },

  /**
   * Upserts a retailer listing record referencing a canonical product.
   * 
   * @param {Object} listing 
   * @returns {Promise<Object>} Upserted listing document
   */
  async upsertListing(listing) {
    if (!listing || !listing.platform || !listing.productUrl || !listing.productId) {
      throw new Error('[ListingRepository] platform, productUrl, and productId are required.');
    }

    const listingId = listing.listingId || this.generateListingId(listing.platform, listing.productUrl);
    const now = new Date().toISOString();

    const filter = {
      platform: String(listing.platform),
      productUrl: String(listing.productUrl),
    };

    const updateDoc = {
      $set: {
        productId: String(listing.productId),
        storeId: String(listing.storeId || listing.platform).toLowerCase(),
        listingTitle: listing.listingTitle || listing.title || 'Untitled Listing',
        sellerName: listing.sellerName || listing.merchant || listing.platform || 'Verified Seller',
        sellerRating: Number(listing.sellerRating !== undefined ? listing.sellerRating : 4.8),
        updatedAt: now,
      },
      $setOnInsert: {
        listingId,
        createdAt: listing.createdAt || now,
      },
    };

    await this.getCollection().updateOne(filter, updateDoc, { upsert: true });
    return await this.findByPlatformAndUrl(listing.platform, listing.productUrl);
  },

  /**
   * Counts total listings in database.
   */
  async count() {
    return await this.getCollection().countDocuments();
  }
};
