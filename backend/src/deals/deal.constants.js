/**
 * Phase 8.1 Deal Score & Ranking Constants
 * Centralized heuristic weights, scoring bounds, availability rules, and limitations.
 * 
 * Note: These weights reflect transparent heuristic design choices to measure LISTING QUALITY.
 */

// Scoring Metadata
export const DEAL_SCORING_TYPE = 'HEURISTIC';

// Heuristic Scoring Component Weights (Total: 100 points)
export const DEAL_WEIGHTS = Object.freeze({
  // 1. Price Position vs Historical Norms (Max 40 points)
  // Subdivided into vs Historical Average (25 pts) and vs Historical Floor (15 pts)
  PRICE_POSITION: 40,
  PRICE_VS_AVERAGE: 25,
  PRICE_VS_LOW: 15,

  // 2. Cross-Platform Relative Price Advantage (Max 30 points)
  // Evaluates current listing price vs competing retailer prices for the same product
  PLATFORM_ADVANTAGE: 30,

  // 3. Stated Retailer Discount off MRP (Max 15 points)
  // Rewards genuine discounts when authentic originalPrice is available
  DISCOUNT: 15,

  // 4. Delivery Charge Factor (Max 10 points)
  // Rewards free delivery and penalizes shipping surcharges
  DELIVERY: 10,

  // 5. Merchant / Seller Rating Factor (Max 5 points)
  // Minor trust factor that does NOT dominate price intelligence
  SELLER_RATING: 5,
});

// Neutral Baselines (Used when competitor/discount/seller data is unavailable)
export const DEAL_NEUTRAL_BASELINES = Object.freeze({
  PLATFORM_ADVANTAGE_NEUTRAL: 15, // Midpoint (15/30) when single platform or identical competitor prices
  DISCOUNT_NEUTRAL: 7.5,           // Midpoint (7.5/15) when originalPrice is unavailable
  SELLER_RATING_NEUTRAL: 3.5,      // Default (3.5/5) when seller rating is not provided
  DELIVERY_NEUTRAL: 7.0,           // Moderate baseline if delivery fee is unknown
});

// Availability Rules & Out-of-Stock Constraints
export const DEAL_AVAILABILITY_RULES = Object.freeze({
  OUT_OF_STOCK_MAX_SCORE: 25,      // Hard cap on dealScore for out-of-stock listings
  EXCLUDE_OUT_OF_STOCK_FROM_BEST_DEAL: true, // Unavailable listings cannot be chosen as bestDeal
});

// Score Boundaries
export const DEAL_SCORE_BOUNDS = Object.freeze({
  MIN: 0,
  MAX: 100,
});

// Standard Limitations Disclaimers
export const DEAL_LIMITATIONS = Object.freeze([
  'Deal Score is a deterministic heuristic ranking score, not a machine-learning prediction.',
  'Rankings and best-deal evaluations reflect currently tracked retailer listings in MongoDB.',
  'Marketplace prices, availability, delivery charges, and seller ratings may fluctuate in real time.'
]);
