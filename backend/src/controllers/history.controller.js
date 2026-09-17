/**
 * Phase 5 History Controller
 * Handles historical product, listing, and price observation endpoints.
 */

import { pricePersistenceService } from '../services/pricePersistence.service.js';
import { productRepository } from '../database/repositories/product.repository.js';
import { listingRepository } from '../database/repositories/listing.repository.js';
import { priceHistoryRepository } from '../database/repositories/priceHistory.repository.js';
import { SUPPORTED_PLATFORM_IDS } from '../collectors/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const historyController = {
  /**
   * POST /api/v1/history/collect
   * Collects from Phase 3, matches via Phase 4, and persists to MongoDB.
   */
  async collectAndPersist(req, res, next) {
    try {
      const query = req.body?.query || req.body?.q || req.query?.q || req.query?.query;
      const platformsInput = req.body?.platforms || req.query?.platforms;

      // 1. Validate query
      if (!query || typeof query !== 'string' || !query.trim()) {
        return sendError(
          res,
          'MISSING_SEARCH_QUERY',
          'Search query is required in request body (e.g. { "query": "iphone 16" }) or query params.',
          400
        );
      }

      const cleanQuery = query.trim();
      if (cleanQuery.length < 2) {
        return sendError(
          res,
          'INVALID_QUERY',
          'Search query must be at least 2 characters long.',
          400
        );
      }

      // 2. Validate platforms filter if provided
      let requestedPlatforms = [];
      if (platformsInput) {
        if (Array.isArray(platformsInput)) {
          requestedPlatforms = platformsInput.map((p) => String(p).trim().toLowerCase()).filter(Boolean);
        } else if (typeof platformsInput === 'string') {
          requestedPlatforms = platformsInput.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);
        }

        const unsupported = requestedPlatforms.filter((p) => !SUPPORTED_PLATFORM_IDS.includes(p));
        if (unsupported.length > 0) {
          return sendError(
            res,
            'UNSUPPORTED_PLATFORM',
            `Unsupported platform(s): ${unsupported.join(', ')}. Supported platforms are: ${SUPPORTED_PLATFORM_IDS.join(', ')}.`,
            400,
            { supportedPlatforms: SUPPORTED_PLATFORM_IDS, unsupported }
          );
        }
      }

      // 3. Execute persistence pipeline
      const result = await pricePersistenceService.collectAndPersist(cleanQuery, requestedPlatforms);

      return sendSuccess(res, result.savedProducts, {
        query: result.query,
        collectedAt: result.collectedAt,
        platformsRequested: result.platformsRequested,
        platformsSuccessful: result.platformsSuccessful,
        totalListings: result.totalListings,
        totalCanonicalProducts: result.totalCanonicalProducts,
        productsUpserted: result.productsUpserted,
        listingsUpserted: result.listingsUpserted,
        observationsSaved: result.observationsSaved,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/history/products/:productId
   * Retrieves historical price observations for a canonical product with optional date range.
   */
  async getProductHistory(req, res, next) {
    try {
      const { productId } = req.params;
      const { from, to, limit } = req.query;

      if (!productId || typeof productId !== 'string' || !productId.trim()) {
        return sendError(res, 'INVALID_PRODUCT_ID', 'Product ID parameter is required.', 400);
      }

      // Validate date parameters if provided
      if (from && isNaN(new Date(from).getTime())) {
        return sendError(res, 'INVALID_DATE', `Invalid "from" date parameter: "${from}". Use ISO format (YYYY-MM-DD).`, 400);
      }
      if (to && isNaN(new Date(to).getTime())) {
        return sendError(res, 'INVALID_DATE', `Invalid "to" date parameter: "${to}". Use ISO format (YYYY-MM-DD).`, 400);
      }

      const product = await productRepository.findByCanonicalId(productId.trim());
      if (!product) {
        return sendError(
          res,
          'PRODUCT_NOT_FOUND',
          `No canonical product found in database with ID: "${productId}".`,
          404
        );
      }

      const observations = await priceHistoryRepository.findByProductId(productId.trim(), {
        fromDate: from,
        toDate: to,
        limit,
      });

      return sendSuccess(res, observations, {
        productId: product.canonicalId,
        canonicalTitle: product.canonicalTitle,
        brand: product.brand,
        model: product.model,
        totalObservations: observations.length,
        filter: { from: from || null, to: to || null },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/history/products/:productId/latest
   * Retrieves the latest known price per platform for a canonical product.
   */
  async getLatestProductPrices(req, res, next) {
    try {
      const { productId } = req.params;

      if (!productId || typeof productId !== 'string' || !productId.trim()) {
        return sendError(res, 'INVALID_PRODUCT_ID', 'Product ID parameter is required.', 400);
      }

      const product = await productRepository.findByCanonicalId(productId.trim());
      if (!product) {
        return sendError(
          res,
          'PRODUCT_NOT_FOUND',
          `No canonical product found in database with ID: "${productId}".`,
          404
        );
      }

      const latestPrices = await priceHistoryRepository.getLatestPricesByProductId(productId.trim());

      return sendSuccess(res, latestPrices, {
        productId: product.canonicalId,
        canonicalTitle: product.canonicalTitle,
        platformsCount: latestPrices.length,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/history/products/:productId/summary
   * Retrieves high-level historical statistics for a canonical product.
   */
  async getProductHistorySummary(req, res, next) {
    try {
      const { productId } = req.params;

      if (!productId || typeof productId !== 'string' || !productId.trim()) {
        return sendError(res, 'INVALID_PRODUCT_ID', 'Product ID parameter is required.', 400);
      }

      const product = await productRepository.findByCanonicalId(productId.trim());
      if (!product) {
        return sendError(
          res,
          'PRODUCT_NOT_FOUND',
          `No canonical product found in database with ID: "${productId}".`,
          404
        );
      }

      const summary = await priceHistoryRepository.getProductSummary(productId.trim());
      if (!summary) {
        return sendError(
          res,
          'PRICES_NOT_FOUND',
          `No historical price observations found for product "${productId}".`,
          404
        );
      }

      return sendSuccess(res, summary, {
        productId: product.canonicalId,
        canonicalTitle: product.canonicalTitle,
      });
    } catch (error) {
      next(error);
    }
  }
};
