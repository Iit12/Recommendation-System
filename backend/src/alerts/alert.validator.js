/**
 * Phase 8.4 Alert Validator
 * Validates request payload structures, constraints, and rule parameters.
 */

import { ALERT_LIMITS } from './alert.constants.js';

export const alertValidator = {
  /**
   * Validates canonical product ID string.
   * 
   * @param {any} productId 
   * @returns {{ valid: boolean, error?: string, productId?: string }}
   */
  validateProductId(productId) {
    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      return {
        valid: false,
        error: 'A valid, non-empty productId string is required in the request payload.',
      };
    }
    return {
      valid: true,
      productId: productId.trim(),
    };
  },

  /**
   * Validates alert rules payload.
   * 
   * @param {any} alerts 
   * @returns {{ valid: boolean, error?: string, rules?: Object }}
   */
  validateAlerts(alerts) {
    if (!alerts || typeof alerts !== 'object' || Array.isArray(alerts)) {
      return {
        valid: false,
        error: 'The "alerts" field must be a valid JSON object containing at least one alert rule.',
      };
    }

    const rules = {};
    let recognizedRulesCount = 0;

    // 1. targetPrice (optional, must be finite number > 0)
    if (alerts.targetPrice !== undefined && alerts.targetPrice !== null) {
      const tp = Number(alerts.targetPrice);
      if (!Number.isFinite(tp) || tp <= 0) {
        return {
          valid: false,
          error: 'Alert rule "targetPrice" must be a positive finite number greater than 0.',
        };
      }
      rules.targetPrice = tp;
      recognizedRulesCount++;
    }

    // 2. priceDropPercent (optional, must be finite number >= 0 and <= 100)
    if (alerts.priceDropPercent !== undefined && alerts.priceDropPercent !== null) {
      const pdp = Number(alerts.priceDropPercent);
      if (!Number.isFinite(pdp) || pdp < ALERT_LIMITS.MIN_PERCENT_THRESHOLD || pdp > ALERT_LIMITS.MAX_PERCENT_THRESHOLD) {
        return {
          valid: false,
          error: `Alert rule "priceDropPercent" must be a finite number between ${ALERT_LIMITS.MIN_PERCENT_THRESHOLD} and ${ALERT_LIMITS.MAX_PERCENT_THRESHOLD}.`,
        };
      }
      rules.priceDropPercent = pdp;
      recognizedRulesCount++;
    }

    // 3. nearHistoricalLowPercent (optional, must be finite number >= 0 and <= 100)
    if (alerts.nearHistoricalLowPercent !== undefined && alerts.nearHistoricalLowPercent !== null) {
      const nhlp = Number(alerts.nearHistoricalLowPercent);
      if (!Number.isFinite(nhlp) || nhlp < ALERT_LIMITS.MIN_PERCENT_THRESHOLD || nhlp > ALERT_LIMITS.MAX_PERCENT_THRESHOLD) {
        return {
          valid: false,
          error: `Alert rule "nearHistoricalLowPercent" must be a finite number between ${ALERT_LIMITS.MIN_PERCENT_THRESHOLD} and ${ALERT_LIMITS.MAX_PERCENT_THRESHOLD}.`,
        };
      }
      rules.nearHistoricalLowPercent = nhlp;
      recognizedRulesCount++;
    }

    // 4. restock (optional, must be boolean)
    if (alerts.restock !== undefined && alerts.restock !== null) {
      if (typeof alerts.restock !== 'boolean') {
        return {
          valid: false,
          error: 'Alert rule "restock" must be a boolean (true or false).',
        };
      }
      rules.restock = alerts.restock;
      recognizedRulesCount++;
    }

    if (recognizedRulesCount === 0) {
      return {
        valid: false,
        error: 'At least one valid alert rule must be provided ("targetPrice", "priceDropPercent", "nearHistoricalLowPercent", or "restock").',
      };
    }

    return {
      valid: true,
      rules,
    };
  },
};
