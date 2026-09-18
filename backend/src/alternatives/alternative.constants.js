/**
 * Phase 8.2 Alternative Product Recommendation Constants
 * Centralized heuristic weights, attribute comparison states, bounds, and limits.
 */

// Scoring Metadata
export const ALTERNATIVE_SCORING_TYPE = 'CONTENT_BASED_HEURISTIC';

// Base Recommendation Scoring Weights (Total: 100 points)
export const ALTERNATIVE_WEIGHTS = Object.freeze({
  // 1. Specification / Feature Similarity (Max 50 points)
  FEATURE_SIMILARITY: 50,
  FEATURE_SUBWEIGHTS: Object.freeze({
    MODEL_FAMILY: 20, // High importance (model lineage, product series, device type)
    STORAGE: 10,      // Medium importance (ROM capacity alignment)
    RAM: 8,           // Medium importance (RAM capacity alignment)
    VARIANT: 8,       // Form factor / audio tags (ANC, TWS, 5G, Over-Ear, etc.)
    COLOR: 4,         // Aesthetic preference (lower importance)
  }),

  // 2. Price Compatibility / Budget Proximity (Max 25 points)
  PRICE_COMPATIBILITY: 25,

  // 3. Product Category Compatibility (Max 15 points)
  CATEGORY_COMPATIBILITY: 15,

  // 4. Brand / Variant Compatibility (Max 10 points)
  BRAND_VARIANT: 10,
});

// Attribute Comparison States
export const ATTRIBUTE_COMPARISON_STATES = Object.freeze({
  MATCH: 'MATCH',
  PARTIAL: 'PARTIAL',
  MISMATCH: 'MISMATCH',
  MISSING_ONE: 'MISSING_ONE',
  MISSING_BOTH: 'MISSING_BOTH',
});

// Neutral Baselines (Used when price / brand / category data is partially unavailable)
export const ALTERNATIVE_NEUTRAL_BASELINES = Object.freeze({
  PRICE_COMPATIBILITY_NEUTRAL: 12.5,  // Midpoint (12.5 / 25) when price data is missing
  CATEGORY_COMPATIBILITY_NEUTRAL: 7.5, // Midpoint (7.5 / 15) when category is unknown
  BRAND_CROSS_BRAND: 5.0,              // 5 / 10 for cross-brand alternative (valid alternative)
  BRAND_MISSING: 5.0,                  // 5 / 10 when brand is unknown
  STORAGE_NEUTRAL: 5.0,                // 5 / 10 when storage is missing
  RAM_NEUTRAL: 4.0,                    // 4 / 8 when RAM is missing
  COLOR_NEUTRAL: 2.0,                  // 2 / 4 when color is missing
  VARIANT_NEUTRAL: 4.0,                // 4 / 8 when variant is missing
});

// Pagination / Limits Configuration
export const ALTERNATIVE_LIMITS = Object.freeze({
  DEFAULT_LIMIT: 5,
  MIN_LIMIT: 1,
  MAX_LIMIT: 50,
});

// Score Boundaries
export const ALTERNATIVE_SCORE_BOUNDS = Object.freeze({
  MIN: 0,
  MAX: 100,
});

// Limitations Disclaimers
export const ALTERNATIVE_LIMITATIONS = Object.freeze([
  'Alternative recommendations are calculated via a deterministic content-based heuristic algorithm, not machine learning or collaborative filtering.',
  'Recommendations reflect specification similarity and price proximity across canonical products currently in the database.',
  'Prices and product availability across retailers may change in real time.'
]);
