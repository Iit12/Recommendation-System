/**
 * Phase 8.4 Alert Rules Engine
 * Pure deterministic functions evaluating individual alert conditions against factual data.
 */

import { ALERT_RULE_TYPES, ALERT_RULE_STATUS } from './alert.constants.js';

export const alertRulesEngine = {
  /**
   * Rule 1: Target Price Evaluation
   * Triggered when currentPrice <= targetPrice.
   * 
   * @param {number|null} currentPrice 
   * @param {number} targetPrice 
   * @returns {Object}
   */
  evaluateTargetPrice(currentPrice, targetPrice) {
    if (currentPrice === null || !Number.isFinite(currentPrice) || currentPrice <= 0) {
      return {
        type: ALERT_RULE_TYPES.TARGET_PRICE,
        status: ALERT_RULE_STATUS.NOT_EVALUABLE,
        threshold: targetPrice,
        currentValue: null,
        reasonCode: 'NO_CURRENT_PRICE',
      };
    }

    const isTriggered = currentPrice <= targetPrice;

    return {
      type: ALERT_RULE_TYPES.TARGET_PRICE,
      status: isTriggered ? ALERT_RULE_STATUS.TRIGGERED : ALERT_RULE_STATUS.NOT_TRIGGERED,
      threshold: targetPrice,
      currentValue: currentPrice,
    };
  },

  /**
   * Rule 2: Price Drop Percentage Evaluation
   * Triggered when dropPercent >= priceDropPercent.
   * dropPercent = ((previousPrice - currentPrice) / previousPrice) * 100
   * 
   * @param {number|null} currentPrice 
   * @param {number|null} previousPrice 
   * @param {number} priceDropPercent 
   * @returns {Object}
   */
  evaluatePriceDrop(currentPrice, previousPrice, priceDropPercent) {
    if (currentPrice === null || !Number.isFinite(currentPrice) || currentPrice <= 0) {
      return {
        type: ALERT_RULE_TYPES.PRICE_DROP,
        status: ALERT_RULE_STATUS.NOT_EVALUABLE,
        threshold: priceDropPercent,
        currentValue: null,
        previousPrice: previousPrice || null,
        reasonCode: 'NO_CURRENT_PRICE',
      };
    }

    if (previousPrice === null || !Number.isFinite(previousPrice) || previousPrice <= 0) {
      return {
        type: ALERT_RULE_TYPES.PRICE_DROP,
        status: ALERT_RULE_STATUS.NOT_EVALUABLE,
        threshold: priceDropPercent,
        currentValue: null,
        previousPrice: null,
        reasonCode: 'NO_PREVIOUS_PRICE',
      };
    }

    const dropPercent = ((previousPrice - currentPrice) / previousPrice) * 100;
    const roundedDrop = Number(dropPercent.toFixed(4));
    const isTriggered = roundedDrop >= priceDropPercent;

    return {
      type: ALERT_RULE_TYPES.PRICE_DROP,
      status: isTriggered ? ALERT_RULE_STATUS.TRIGGERED : ALERT_RULE_STATUS.NOT_TRIGGERED,
      threshold: priceDropPercent,
      currentValue: roundedDrop,
      previousPrice,
      currentPrice,
    };
  },

  /**
   * Rule 3: Near Historical Low Evaluation
   * thresholdPrice = historicalLow * (1 + nearHistoricalLowPercent / 100)
   * Triggered when currentPrice <= thresholdPrice.
   * 
   * @param {number|null} currentPrice 
   * @param {number|null} historicalLow 
   * @param {number} nearHistoricalLowPercent 
   * @returns {Object}
   */
  evaluateNearHistoricalLow(currentPrice, historicalLow, nearHistoricalLowPercent) {
    if (currentPrice === null || !Number.isFinite(currentPrice) || currentPrice <= 0) {
      return {
        type: ALERT_RULE_TYPES.NEAR_HISTORICAL_LOW,
        status: ALERT_RULE_STATUS.NOT_EVALUABLE,
        threshold: nearHistoricalLowPercent,
        currentValue: null,
        historicalLow: historicalLow || null,
        thresholdPrice: null,
        reasonCode: 'NO_CURRENT_PRICE',
      };
    }

    if (historicalLow === null || !Number.isFinite(historicalLow) || historicalLow <= 0) {
      return {
        type: ALERT_RULE_TYPES.NEAR_HISTORICAL_LOW,
        status: ALERT_RULE_STATUS.NOT_EVALUABLE,
        threshold: nearHistoricalLowPercent,
        currentValue: null,
        historicalLow: null,
        thresholdPrice: null,
        reasonCode: 'INSUFFICIENT_HISTORICAL_DATA',
      };
    }

    const thresholdPrice = historicalLow * (1 + nearHistoricalLowPercent / 100);
    const roundedThresholdPrice = Number(thresholdPrice.toFixed(2));
    const isTriggered = currentPrice <= thresholdPrice;

    return {
      type: ALERT_RULE_TYPES.NEAR_HISTORICAL_LOW,
      status: isTriggered ? ALERT_RULE_STATUS.TRIGGERED : ALERT_RULE_STATUS.NOT_TRIGGERED,
      threshold: nearHistoricalLowPercent,
      currentValue: currentPrice,
      historicalLow,
      thresholdPrice: roundedThresholdPrice,
    };
  },

  /**
   * Rule 4: Restock Evaluation
   * Triggered when previous relevant observation was out of stock AND current listing is in stock.
   * 
   * @param {Object|null} currentListing 
   * @param {Array<Object>} stockHistory 
   * @returns {Object}
   */
  evaluateRestock(currentListing, stockHistory = []) {
    const isCurrentInStock = currentListing && currentListing.inStock === true;

    if (!Array.isArray(stockHistory) || stockHistory.length < 2) {
      return {
        type: ALERT_RULE_TYPES.RESTOCK,
        status: ALERT_RULE_STATUS.NOT_EVALUABLE,
        threshold: true,
        currentValue: isCurrentInStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
        reasonCode: 'INSUFFICIENT_STOCK_HISTORY',
      };
    }

    // Previous stock observation
    const previousObs = stockHistory[stockHistory.length - 2];
    const wasPreviousOutOfStock = previousObs && previousObs.inStock === false;

    if (wasPreviousOutOfStock && isCurrentInStock) {
      return {
        type: ALERT_RULE_TYPES.RESTOCK,
        status: ALERT_RULE_STATUS.TRIGGERED,
        threshold: true,
        currentValue: 'RESTOCKED',
        previousState: 'OUT_OF_STOCK',
        currentState: 'IN_STOCK',
      };
    }

    return {
      type: ALERT_RULE_TYPES.RESTOCK,
      status: ALERT_RULE_STATUS.NOT_TRIGGERED,
      threshold: true,
      currentValue: isCurrentInStock ? 'ALREADY_IN_STOCK' : 'OUT_OF_STOCK',
      previousState: previousObs && previousObs.inStock !== false ? 'IN_STOCK' : 'OUT_OF_STOCK',
      currentState: isCurrentInStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
    };
  },
};
