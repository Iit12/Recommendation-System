/**
 * Phase 8.4 Alert Reason Generator
 * Generates dynamic, factual, human-readable explanations from evaluated alert rules.
 */

import { ALERT_RULE_TYPES, ALERT_RULE_STATUS } from './alert.constants.js';

export const alertReasonGenerator = {
  /**
   * Generates a natural language message explaining the evaluation outcome of an alert rule.
   * 
   * @param {Object} ruleResult Evaluated rule object
   * @returns {string} Factual explanation
   */
  generateMessage(ruleResult) {
    if (!ruleResult || !ruleResult.type) {
      return 'Alert rule evaluated.';
    }

    const { type, status, threshold, currentValue, reasonCode } = ruleResult;

    switch (type) {
      case ALERT_RULE_TYPES.TARGET_PRICE: {
        if (status === ALERT_RULE_STATUS.TRIGGERED) {
          return `Current price of ₹${Number(currentValue).toLocaleString('en-IN')} is at or below your target price of ₹${Number(threshold).toLocaleString('en-IN')}.`;
        }
        if (status === ALERT_RULE_STATUS.NOT_TRIGGERED) {
          return `Current price of ₹${Number(currentValue).toLocaleString('en-IN')} is above your target price of ₹${Number(threshold).toLocaleString('en-IN')}.`;
        }
        return 'Cannot evaluate target price alert because no valid in-stock price observation exists.';
      }

      case ALERT_RULE_TYPES.PRICE_DROP: {
        if (status === ALERT_RULE_STATUS.TRIGGERED) {
          const prevPriceStr = ruleResult.previousPrice ? `from the previous recorded price of ₹${Number(ruleResult.previousPrice).toLocaleString('en-IN')} ` : '';
          return `Price dropped ${currentValue}% ${prevPriceStr}(Threshold: ${threshold}%).`;
        }
        if (status === ALERT_RULE_STATUS.NOT_TRIGGERED) {
          return `Price change of ${currentValue}% does not meet your required price drop threshold of ${threshold}%.`;
        }
        if (reasonCode === 'NO_PREVIOUS_PRICE') {
          return 'Cannot evaluate price drop alert because no previous valid price observation exists.';
        }
        return 'Cannot evaluate price drop alert because no current valid in-stock price exists.';
      }

      case ALERT_RULE_TYPES.NEAR_HISTORICAL_LOW: {
        if (status === ALERT_RULE_STATUS.TRIGGERED) {
          const histLowStr = ruleResult.historicalLow ? ` of the historical low of ₹${Number(ruleResult.historicalLow).toLocaleString('en-IN')}` : '';
          const threshStr = ruleResult.thresholdPrice ? ` (Threshold: ₹${Math.round(ruleResult.thresholdPrice).toLocaleString('en-IN')})` : '';
          return `Current price of ₹${Number(currentValue).toLocaleString('en-IN')} is within ${threshold}%${histLowStr}${threshStr}.`;
        }
        if (status === ALERT_RULE_STATUS.NOT_TRIGGERED) {
          const histLowStr = ruleResult.historicalLow ? ` of the historical low of ₹${Number(ruleResult.historicalLow).toLocaleString('en-IN')}` : '';
          const threshStr = ruleResult.thresholdPrice ? ` (Threshold: ₹${Math.round(ruleResult.thresholdPrice).toLocaleString('en-IN')})` : '';
          return `Current price of ₹${Number(currentValue).toLocaleString('en-IN')} exceeds ${threshold}% above${histLowStr}${threshStr}.`;
        }
        if (reasonCode === 'INSUFFICIENT_HISTORICAL_DATA') {
          return 'Cannot evaluate historical low alert because insufficient historical price records exist.';
        }
        return 'Cannot evaluate historical low alert because no current valid in-stock price exists.';
      }

      case ALERT_RULE_TYPES.RESTOCK: {
        if (status === ALERT_RULE_STATUS.TRIGGERED) {
          return 'Product was previously out of stock and is now available in stock.';
        }
        if (status === ALERT_RULE_STATUS.NOT_TRIGGERED) {
          return 'No restock event detected (product was already in stock or remains unavailable).';
        }
        return 'Cannot evaluate restock alert because previous stock state cannot be determined.';
      }

      default:
        return 'Alert rule evaluated.';
    }
  },
};
