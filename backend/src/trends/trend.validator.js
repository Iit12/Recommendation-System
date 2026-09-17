/**
 * Phase 6 Trend Data & Query Validator
 * Validates price observations and date-range query parameters.
 */

export const trendValidator = {
  /**
   * Validates a single price observation.
   * Returns true if valid, false if malformed.
   * 
   * Valid observation criteria:
   * - price is a finite number >= 0
   * - effectivePrice is a finite number >= 0
   * - collectedAt is a valid ISO date
   * 
   * @param {Object} obs 
   * @returns {boolean}
   */
  isValidObservation(obs) {
    if (!obs || typeof obs !== 'object') return false;

    const price = Number(obs.price);
    if (isNaN(price) || !isFinite(price) || price < 0) return false;

    const effectivePrice = Number(obs.effectivePrice !== undefined ? obs.effectivePrice : price);
    if (isNaN(effectivePrice) || !isFinite(effectivePrice) || effectivePrice < 0) return false;

    if (!obs.collectedAt) return false;
    const time = new Date(obs.collectedAt).getTime();
    if (isNaN(time)) return false;

    return true;
  },

  /**
   * Filters an array of observations into valid and invalid sets.
   * 
   * @param {Array<Object>} observations 
   * @returns {Object} { validObservations: Array, invalidCount: number }
   */
  filterObservations(observations = []) {
    if (!Array.isArray(observations)) {
      return { validObservations: [], invalidCount: 0 };
    }

    const validObservations = [];
    let invalidCount = 0;

    for (const obs of observations) {
      if (this.isValidObservation(obs)) {
        validObservations.push({
          ...obs,
          price: Number(obs.price),
          effectivePrice: Number(obs.effectivePrice !== undefined ? obs.effectivePrice : obs.price),
          collectedAt: new Date(obs.collectedAt).toISOString(),
          inStock: Boolean(obs.inStock !== false),
        });
      } else {
        invalidCount++;
      }
    }

    // Sort chronologically ascending (earliest to latest)
    validObservations.sort((a, b) => new Date(a.collectedAt).getTime() - new Date(b.collectedAt).getTime());

    return { validObservations, invalidCount };
  },

  /**
   * Validates 'from' and 'to' date range query parameters.
   * 
   * @param {string|undefined} fromDate 
   * @param {string|undefined} toDate 
   * @returns {Object} { valid: boolean, error?: string, fromIso?: string, toIso?: string }
   */
  validateDateRange(fromDate, toDate) {
    let fromTime = null;
    let toTime = null;
    let fromIso = null;
    let toIso = null;

    if (fromDate) {
      const parsedFrom = new Date(fromDate);
      if (isNaN(parsedFrom.getTime())) {
        return {
          valid: false,
          error: `Invalid "from" date: "${fromDate}". Must be a valid date format (e.g. YYYY-MM-DD).`,
        };
      }
      fromTime = parsedFrom.getTime();
      fromIso = parsedFrom.toISOString();
    }

    if (toDate) {
      const parsedTo = new Date(toDate);
      if (isNaN(parsedTo.getTime())) {
        return {
          valid: false,
          error: `Invalid "to" date: "${toDate}". Must be a valid date format (e.g. YYYY-MM-DD).`,
        };
      }
      // If date-only string (e.g. 2026-09-18), set to end of day
      if (typeof toDate === 'string' && toDate.length <= 10) {
        parsedTo.setUTCHours(23, 59, 59, 999);
      }
      toTime = parsedTo.getTime();
      toIso = parsedTo.toISOString();
    }

    if (fromTime !== null && toTime !== null && fromTime > toTime) {
      return {
        valid: false,
        error: `Date range error: "from" date (${fromDate}) cannot be later than "to" date (${toDate}).`,
      };
    }

    return { valid: true, fromIso, toIso };
  }
};
