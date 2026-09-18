/**
 * Phase 8.2 Alternative Recommendation Validator
 * Validates request parameters for alternative product queries.
 */

import { ALTERNATIVE_LIMITS } from './alternative.constants.js';

export const alternativeValidator = {
  /**
   * Validates product ID string parameter.
   * 
   * @param {string} productId 
   * @returns {Object} { valid: boolean, productId?: string, error?: string }
   */
  validateProductId(productId) {
    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      return {
        valid: false,
        error: 'Product ID parameter is required and must be a non-empty string.',
      };
    }
    return {
      valid: true,
      productId: productId.trim(),
    };
  },

  /**
   * Validates limit query parameter.
   * 
   * @param {any} limit 
   * @returns {Object} { valid: boolean, limit: number, error?: string }
   */
  validateLimit(limit) {
    if (limit === undefined || limit === null || limit === '') {
      return {
        valid: true,
        limit: ALTERNATIVE_LIMITS.DEFAULT_LIMIT,
      };
    }

    const parsed = Number(limit);
    if (
      isNaN(parsed) ||
      !Number.isInteger(parsed) ||
      parsed < ALTERNATIVE_LIMITS.MIN_LIMIT ||
      parsed > ALTERNATIVE_LIMITS.MAX_LIMIT
    ) {
      return {
        valid: false,
        limit: ALTERNATIVE_LIMITS.DEFAULT_LIMIT,
        error: `Invalid limit: "${limit}". Must be an integer between ${ALTERNATIVE_LIMITS.MIN_LIMIT} and ${ALTERNATIVE_LIMITS.MAX_LIMIT}.`,
      };
    }

    return {
      valid: true,
      limit: parsed,
    };
  }
};
