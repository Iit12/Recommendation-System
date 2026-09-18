/**
 * Phase 8.3 Preference-Aware Recommendation Validator
 * Validates request payload and user preferences.
 */

import { SUPPORTED_PRIORITY_KEYS } from './personalized.constants.js';

export const personalizedValidator = {
  /**
   * Validates product ID string parameter.
   */
  validateProductId(productId) {
    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      return {
        valid: false,
        error: 'Product ID parameter is required and must be a non-empty string.',
        code: 'INVALID_PRODUCT_ID',
      };
    }
    return {
      valid: true,
      productId: productId.trim(),
    };
  },

  /**
   * Validates user preferences object.
   * 
   * @param {any} preferences 
   * @returns {Object} { valid: boolean, normalizedPreferences?: Object, error?: string, code?: string }
   */
  validatePreferences(preferences) {
    if (preferences === undefined || preferences === null || preferences === '') {
      return {
        valid: true,
        normalizedPreferences: {},
      };
    }

    if (typeof preferences !== 'object' || Array.isArray(preferences)) {
      return {
        valid: false,
        error: 'Preferences must be an object.',
        code: 'INVALID_PREFERENCES',
      };
    }

    const norm = {};

    // 1. maxBudget
    if (preferences.maxBudget !== undefined && preferences.maxBudget !== null) {
      const budget = Number(preferences.maxBudget);
      if (isNaN(budget) || !isFinite(budget) || budget <= 0) {
        return {
          valid: false,
          error: `Invalid maxBudget: "${preferences.maxBudget}". Must be a positive finite number.`,
          code: 'INVALID_BUDGET',
        };
      }
      norm.maxBudget = budget;
    }

    // 2. preferredBrands
    if (preferences.preferredBrands !== undefined && preferences.preferredBrands !== null) {
      if (!Array.isArray(preferences.preferredBrands)) {
        return {
          valid: false,
          error: 'Invalid preferredBrands: Must be an array of brand strings.',
          code: 'INVALID_PREFERRED_BRANDS',
        };
      }
      norm.preferredBrands = preferences.preferredBrands
        .filter((b) => typeof b === 'string' && b.trim())
        .map((b) => b.trim().toLowerCase());
    }

    // 3. minStorage
    if (preferences.minStorage !== undefined && preferences.minStorage !== null) {
      const storage = Number(preferences.minStorage);
      if (isNaN(storage) || !isFinite(storage) || storage < 0) {
        return {
          valid: false,
          error: `Invalid minStorage: "${preferences.minStorage}". Must be a non-negative number.`,
          code: 'INVALID_MIN_STORAGE',
        };
      }
      norm.minStorage = storage;
    }

    // 4. minRam
    if (preferences.minRam !== undefined && preferences.minRam !== null) {
      const ram = Number(preferences.minRam);
      if (isNaN(ram) || !isFinite(ram) || ram < 0) {
        return {
          valid: false,
          error: `Invalid minRam: "${preferences.minRam}". Must be a non-negative number.`,
          code: 'INVALID_MIN_RAM',
        };
      }
      norm.minRam = ram;
    }

    // 5. priorities
    if (preferences.priorities !== undefined && preferences.priorities !== null) {
      if (typeof preferences.priorities !== 'object' || Array.isArray(preferences.priorities)) {
        return {
          valid: false,
          error: 'Invalid priorities: Must be an object with numeric weights.',
          code: 'INVALID_PRIORITIES',
        };
      }

      const rawP = preferences.priorities;
      const parsedP = {};
      let totalSum = 0;

      for (const key of Object.keys(rawP)) {
        const val = Number(rawP[key]);
        if (isNaN(val) || !isFinite(val) || val < 0) {
          return {
            valid: false,
            error: `Invalid priority value for "${key}": "${rawP[key]}". Must be a non-negative finite number.`,
            code: 'INVALID_PRIORITIES',
          };
        }
        if (SUPPORTED_PRIORITY_KEYS.includes(key.toLowerCase())) {
          parsedP[key.toLowerCase()] = val;
          totalSum += val;
        }
      }

      // If priorities provided and sum > 0, normalize them so they sum to 1.0
      if (totalSum > 0) {
        const normalizedPriorities = {};
        for (const [k, v] of Object.entries(parsedP)) {
          normalizedPriorities[k] = Number((v / totalSum).toFixed(4));
        }
        norm.priorities = normalizedPriorities;
      } else if (Object.keys(parsedP).length > 0) {
        norm.priorities = null; // Default to neutral if all 0
      }
    }

    return {
      valid: true,
      normalizedPreferences: norm,
    };
  }
};
