/**
 * Phase 6 Trend Analysis Service
 * Coordinates database retrieval and statistical price trend calculation.
 */

import { productRepository } from '../database/repositories/product.repository.js';
import { priceHistoryRepository } from '../database/repositories/priceHistory.repository.js';
import { trendValidator } from './trend.validator.js';
import { trendCalculator } from './trend.calculator.js';

export const trendAnalysisService = {
  /**
   * Retrieves overall historical trend statistics for a canonical product.
   * 
   * @param {string} productId Canonical product identifier
   * @param {Object} options { from, to }
   * @returns {Promise<Object>} Trend statistical analysis report
   */
  async getHistoricalTrend(productId, options = {}) {
    const { from, to } = options;

    // 1. Validate date range parameters
    const dateValidation = trendValidator.validateDateRange(from, to);
    if (!dateValidation.valid) {
      const err = new Error(dateValidation.error);
      err.code = 'INVALID_DATE_RANGE';
      err.statusCode = 400;
      throw err;
    }

    // 2. Fetch canonical product metadata
    const product = await productRepository.findByCanonicalId(productId);
    if (!product) {
      const err = new Error(`Product with ID "${productId}" was not found in catalog.`);
      err.code = 'PRODUCT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // 3. Fetch raw price observations from MongoDB
    const rawObservations = await priceHistoryRepository.findByProductId(productId, {
      fromDate: dateValidation.fromIso,
      toDate: dateValidation.toIso,
      sort: 'asc',
      limit: 1000,
    });

    // 4. Validate and filter observations
    const { validObservations, invalidCount } = trendValidator.filterObservations(rawObservations);

    // 5. Compute trend statistics
    const stats = trendCalculator.calculate(validObservations, invalidCount);

    return {
      productId: product.canonicalId,
      canonicalTitle: product.canonicalTitle,
      brand: product.brand,
      model: product.model,
      filter: {
        from: from || null,
        to: to || null,
      },
      ...stats,
    };
  },

  /**
   * Retrieves isolated platform-wise trend statistics for a canonical product.
   * 
   * @param {string} productId Canonical product identifier
   * @param {Object} options { from, to }
   * @returns {Promise<Object>} Platform-segmented trend report
   */
  async getPlatformTrends(productId, options = {}) {
    const { from, to } = options;

    // 1. Validate date range parameters
    const dateValidation = trendValidator.validateDateRange(from, to);
    if (!dateValidation.valid) {
      const err = new Error(dateValidation.error);
      err.code = 'INVALID_DATE_RANGE';
      err.statusCode = 400;
      throw err;
    }

    // 2. Fetch canonical product metadata
    const product = await productRepository.findByCanonicalId(productId);
    if (!product) {
      const err = new Error(`Product with ID "${productId}" was not found in catalog.`);
      err.code = 'PRODUCT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // 3. Fetch raw price observations from MongoDB
    const rawObservations = await priceHistoryRepository.findByProductId(productId, {
      fromDate: dateValidation.fromIso,
      toDate: dateValidation.toIso,
      sort: 'asc',
      limit: 1000,
    });

    // 4. Segment observations by platform
    const platformBuckets = {};
    for (const obs of rawObservations) {
      const platformName = obs.platform || 'Unknown Platform';
      if (!platformBuckets[platformName]) {
        platformBuckets[platformName] = [];
      }
      platformBuckets[platformName].push(obs);
    }

    // 5. Compute isolated trend statistics per platform
    const platformResults = {};
    for (const [platform, obsList] of Object.entries(platformBuckets)) {
      const { validObservations, invalidCount } = trendValidator.filterObservations(obsList);
      platformResults[platform] = trendCalculator.calculate(validObservations, invalidCount);
    }

    return {
      productId: product.canonicalId,
      canonicalTitle: product.canonicalTitle,
      filter: {
        from: from || null,
        to: to || null,
      },
      platformsCount: Object.keys(platformResults).length,
      platforms: platformResults,
    };
  }
};
