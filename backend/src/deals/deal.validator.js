/**
 * Phase 8.1 Deal Validator
 * Validates request parameters and listing data fields.
 */

export const dealValidator = {
  /**
   * Validates product ID string parameter.
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
   * Validates optional date range filters (from, to).
   */
  validateDateRange(from, to) {
    if (!from && !to) {
      return { valid: true, fromIso: null, toIso: null };
    }

    let fromIso = null;
    let toIso = null;

    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        return {
          valid: false,
          error: `Invalid "from" date format: "${from}". Expected ISO date string (e.g. YYYY-MM-DD).`,
        };
      }
      fromIso = fromDate.toISOString();
    }

    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        return {
          valid: false,
          error: `Invalid "to" date format: "${to}". Expected ISO date string (e.g. YYYY-MM-DD).`,
        };
      }
      if (to.length <= 10) {
        toDate.setUTCHours(23, 59, 59, 999);
      }
      toIso = toDate.toISOString();
    }

    if (fromIso && toIso && new Date(fromIso) > new Date(toIso)) {
      return {
        valid: false,
        error: `Date range error: "from" date (${from}) cannot be later than "to" date (${to}).`,
      };
    }

    return {
      valid: true,
      fromIso,
      toIso,
    };
  }
};
