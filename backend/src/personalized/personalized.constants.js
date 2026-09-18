/**
 * Phase 8.3 Preference-Aware Recommendation Constants
 * Centralized heuristic weights, neutral baselines, bounds, and limitations.
 */

// Scoring Metadata
export const PERSONALIZED_SCORING_TYPE = 'PREFERENCE_AWARE_HEURISTIC';

// Base Recommendation Scoring Weights (Total: 100 points)
export const PERSONALIZED_WEIGHTS = Object.freeze({
  // 1. Budget Compatibility (Max 30 points)
  BUDGET_COMPATIBILITY: 30,

  // 2. Specification Match (Max 30 points)
  // Subdivided into Storage (18 pts) and RAM (12 pts)
  SPECIFICATION_MATCH: 30,
  SPEC_SUBWEIGHTS: Object.freeze({
    STORAGE: 18,
    RAM: 12,
  }),

  // 3. Feature Priority Match (Max 20 points)
  // Evaluates alignment against user-provided priority weights (price, storage, performance, brand)
  FEATURE_PRIORITY_MATCH: 20,

  // 4. Brand Preference (Max 10 points)
  BRAND_PREFERENCE: 10,

  // 5. Marketplace Deal Quality (Max 10 points)
  // Uses Phase 8.1 Deal Score scaled from [0, 100] -> [0, 10]
  DEAL_QUALITY: 10,
});

// Neutral Baselines (Used when user omits optional preferences or data is unavailable)
export const PERSONALIZED_NEUTRAL_BASELINES = Object.freeze({
  BUDGET_NEUTRAL: 15.0,           // Midpoint (15 / 30) when maxBudget is omitted
  STORAGE_NEUTRAL: 9.0,           // Midpoint (9 / 18) when minStorage is omitted
  RAM_NEUTRAL: 6.0,               // Midpoint (6 / 12) when minRam is omitted
  PRIORITY_NEUTRAL: 10.0,         // Midpoint (10 / 20) when priorities are omitted
  BRAND_NEUTRAL: 5.0,             // Midpoint (5 / 10) when preferredBrands is omitted or not preferred
  DEAL_QUALITY_NEUTRAL: 5.0,      // Midpoint (5 / 10) when deal quality info is unavailable
});

// Score Boundaries
export const PERSONALIZED_SCORE_BOUNDS = Object.freeze({
  MIN: 0,
  MAX: 100,
});

// Supported Priority Dimensions
export const SUPPORTED_PRIORITY_KEYS = Object.freeze([
  'price',
  'storage',
  'performance',
  'brand',
]);

// Standard Limitations Disclaimers
export const PERSONALIZED_LIMITATIONS = Object.freeze([
  'Personalized recommendation scores are calculated via a deterministic preference-aware content-ranking algorithm, not a trained machine-learning model or collaborative filtering.',
  'Recommendations re-rank content-based alternative candidates based on explicitly supplied user constraints and preferences.',
  'Marketplace prices, stock levels, and promotional discounts may fluctuate in real time on retailer websites.'
]);
