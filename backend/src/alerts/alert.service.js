/**
 * Phase 8.4 Alert Service
 * Coordinates validation, MongoDB data retrieval, feature extraction, rule evaluation, and response formulation.
 */

import { productRepository } from '../database/repositories/product.repository.js';
import { listingRepository } from '../database/repositories/listing.repository.js';
import { priceHistoryRepository } from '../database/repositories/priceHistory.repository.js';
import { alertValidator } from './alert.validator.js';
import { alertFeatureExtractor } from './alert.features.js';
import { alertRulesEngine } from './alert.rules.js';
import { alertReasonGenerator } from './alert.reasons.js';
import { ALERT_RULE_STATUS, ALERT_SUMMARY_STATUS } from './alert.constants.js';

export const alertService = {
  /**
   * Evaluates user-defined alert rules for a canonical product against real database listings & history.
   * 
   * @param {string} productId Canonical product ID
   * @param {Object} rawAlerts User alert rule definitions
   * @returns {Promise<Object>} Formatted evaluation report
   */
  async evaluateAlerts(productId, rawAlerts) {
    // 1. Validate product ID
    const idValidation = alertValidator.validateProductId(productId);
    if (!idValidation.valid) {
      const err = new Error(idValidation.error);
      err.code = 'INVALID_PRODUCT_ID';
      err.statusCode = 400;
      throw err;
    }

    // 2. Validate alert rules payload
    const alertsValidation = alertValidator.validateAlerts(rawAlerts);
    if (!alertsValidation.valid) {
      const err = new Error(alertsValidation.error);
      err.code = 'INVALID_ALERT_RULES';
      err.statusCode = 400;
      throw err;
    }

    const { rules } = alertsValidation;

    // 3. Verify product exists in catalog
    const product = await productRepository.findByCanonicalId(idValidation.productId);
    if (!product) {
      const err = new Error(`Product with ID "${idValidation.productId}" was not found in catalog.`);
      err.code = 'PRODUCT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // 4. Retrieve current listings and historical observations concurrently (Read-only)
    const [listings, latestPriceObservations, rawHistoricalObservations] = await Promise.all([
      listingRepository.findByProductId(idValidation.productId),
      priceHistoryRepository.getLatestPricesByProductId(idValidation.productId),
      priceHistoryRepository.findByProductId(idValidation.productId, { sort: 'asc', limit: 1000 }),
    ]);

    // 5. Extract current listing and historical features
    const { currentListing, currentPrice } = alertFeatureExtractor.extractCurrentListingFeatures(
      listings,
      latestPriceObservations
    );

    const historicalFeatures = alertFeatureExtractor.extractHistoricalFeatures(rawHistoricalObservations);

    // 6. Evaluate each supplied rule in deterministic order
    const evaluatedAlerts = [];

    // Rule 1: Target Price
    if (rules.targetPrice !== undefined) {
      const result = alertRulesEngine.evaluateTargetPrice(currentPrice, rules.targetPrice);
      const message = alertReasonGenerator.generateMessage(result);
      evaluatedAlerts.push({
        type: result.type,
        status: result.status,
        threshold: result.threshold,
        currentValue: result.currentValue,
        message,
      });
    }

    // Rule 2: Price Drop Percentage
    if (rules.priceDropPercent !== undefined) {
      const result = alertRulesEngine.evaluatePriceDrop(
        currentPrice,
        historicalFeatures.previousPrice,
        rules.priceDropPercent
      );
      const message = alertReasonGenerator.generateMessage(result);
      evaluatedAlerts.push({
        type: result.type,
        status: result.status,
        threshold: result.threshold,
        currentValue: result.currentValue,
        message,
      });
    }

    // Rule 3: Near Historical Low
    if (rules.nearHistoricalLowPercent !== undefined) {
      const result = alertRulesEngine.evaluateNearHistoricalLow(
        currentPrice,
        historicalFeatures.historicalLow,
        rules.nearHistoricalLowPercent
      );
      const message = alertReasonGenerator.generateMessage(result);
      evaluatedAlerts.push({
        type: result.type,
        status: result.status,
        threshold: result.threshold,
        currentValue: result.currentValue,
        message,
      });
    }

    // Rule 4: Restock
    if (rules.restock !== undefined) {
      const result = alertRulesEngine.evaluateRestock(
        currentListing,
        historicalFeatures.stockHistory
      );
      const message = alertReasonGenerator.generateMessage(result);
      evaluatedAlerts.push({
        type: result.type,
        status: result.status,
        threshold: result.threshold,
        currentValue: result.currentValue,
        message,
      });
    }

    // 7. Aggregate overall evaluation summary
    let triggeredCount = 0;
    let notEvaluableCount = 0;

    for (const a of evaluatedAlerts) {
      if (a.status === ALERT_RULE_STATUS.TRIGGERED) {
        triggeredCount++;
      } else if (a.status === ALERT_RULE_STATUS.NOT_EVALUABLE) {
        notEvaluableCount++;
      }
    }

    let overallStatus = ALERT_SUMMARY_STATUS.NOT_TRIGGERED;
    if (triggeredCount > 0) {
      overallStatus = ALERT_SUMMARY_STATUS.TRIGGERED;
    } else if (notEvaluableCount > 0) {
      overallStatus = ALERT_SUMMARY_STATUS.INSUFFICIENT_DATA;
    }

    return {
      product: {
        canonicalId: product.canonicalId,
        title: product.canonicalTitle,
      },
      currentListing: currentListing
        ? {
            platform: currentListing.platform,
            price: currentListing.price,
            effectivePrice: currentListing.effectivePrice,
            inStock: currentListing.inStock,
            productUrl: currentListing.productUrl,
            sellerName: currentListing.sellerName,
          }
        : null,
      alerts: evaluatedAlerts,
      summary: {
        status: overallStatus,
        triggered: triggeredCount > 0,
        triggeredCount,
        evaluatedCount: evaluatedAlerts.length,
        notEvaluableCount,
      },
      metadata: {
        evaluatedAt: new Date().toISOString(),
        historicalObservationsUsed: historicalFeatures.observationCount,
      },
    };
  },
};
