/**
 * Phase 7.1 Recommendation Constants
 * Centralized heuristic weights, classification thresholds, and decision parameters.
 * 
 * Note: These values represent transparent heuristic design choices, not statistically learned parameters.
 */

// Recommendation Actions
export const RECOMMENDATION_ACTIONS = Object.freeze({
  BUY_NOW: 'BUY_NOW',
  WAIT: 'WAIT',
  NEUTRAL: 'NEUTRAL',
});

// Recommendation Metadata
export const RECOMMENDATION_TYPE = 'HEURISTIC';

// Classification Score Thresholds (0 to 100 scale)
export const RECOMMENDATION_THRESHOLDS = Object.freeze({
  BUY_NOW_MIN_SCORE: 65,   // Scores >= 65 qualify as BUY_NOW
  WAIT_MAX_SCORE: 40,       // Scores <= 40 qualify as WAIT
  // Scores between 41 and 64 represent NEUTRAL (balanced or conflicting evidence)
});

// Heuristic Scoring Component Weights (Total: 100 points)
export const HEURISTIC_WEIGHTS = Object.freeze({
  // 1. Current Price vs Historical Average (Max 35 points)
  // Higher score when current price is significantly below arithmetic mean
  PRICE_VS_AVERAGE: 35,

  // 2. Current Price vs Historical Lowest Recorded Floor (Max 25 points)
  // Higher score when current price is close to the all-time floor
  PRICE_VS_LOW: 25,

  // 3. Price Directional Trend Momentum (Max 20 points)
  // Evaluates falling vs rising prices
  TREND_MOMENTUM: 20,

  // 4. Cross-Platform Pricing Spread & Deal Advantage (Max 10 points)
  // Evaluates whether current lowest platform beats other stores significantly
  PLATFORM_ADVANTAGE: 10,

  // 5. Price Volatility & Consistency (Max 10 points)
  // Evaluates price stability vs extreme variance
  VOLATILITY_FACTOR: 10,
});

// Observation Requirements
export const OBSERVATION_THRESHOLDS = Object.freeze({
  MIN_FOR_RELIABLE_TREND: 3,      // Minimum observations to compute confident decision
  MIN_FOR_BASIC_EVALUATION: 2,    // 2 observations allow basic price comparison
  INSUFFICIENT_DATA_SCORE: 50,    // Default score assigned when historical data is scarce
});

// Out-of-Stock Constraints
export const AVAILABILITY_RULES = Object.freeze({
  OUT_OF_STOCK_MAX_SCORE: 35,     // Hard cap: Out-of-stock items cannot receive BUY_NOW recommendation
});

// Volatility Damping Parameters
export const VOLATILITY_RULES = Object.freeze({
  HIGH_CV_THRESHOLD: 8.0,         // Coefficient of variation > 8% is considered volatile
  DAMPING_FACTOR_TO_NEUTRAL: 0.35, // Pulls score towards 50 when price signals conflict under high volatility
});

// Standard Limitations Disclaimers
export const RECOMMENDATION_LIMITATIONS = Object.freeze([
  'Recommendation is derived from a deterministic heuristic algorithm, not a trained machine-learning model.',
  'Historical observations reflect prices collected across tracked multi-platform listings in MongoDB.',
  'Marketplace prices, stock levels, and promotional discounts may fluctuate without prior notice.'
]);
