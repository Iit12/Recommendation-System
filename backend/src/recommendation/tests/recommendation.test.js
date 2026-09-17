/**
 * Phase 7.1 Recommendation Engine Comprehensive Test Suite
 * Validates deterministic heuristic scoring, edge cases, explainability, and database integration.
 */

import assert from 'assert';
import { database } from '../../database/connection.js';
import {
  recommendationValidator,
  recommendationFeatureExtractor,
  recommendationScorer,
  recommendationReasonGenerator,
  recommendationService,
  RECOMMENDATION_ACTIONS,
  RECOMMENDATION_THRESHOLDS,
  HEURISTIC_WEIGHTS,
} from '../index.js';

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

console.log('====================================================');
console.log('🚀 RUNNING PHASE 7.1 RECOMMENDATION TEST SUITE');
console.log('====================================================\n');

// ----------------------------------------------------
// A. Very Low Current Price -> BUY Evidence
// ----------------------------------------------------
console.log('--- A. Low Current Price vs Historical Average ---');
runTest('Current price 10% below average produces strong BUY_NOW score', () => {
  const features = {
    currentPrice: 65000,
    historicalAverage: 72000,
    historicalLow: 65000,
    historicalHigh: 75000,
    priceChange: 0,
    priceChangePercent: 0,
    trend: 'STABLE',
    standardDeviation: 1000,
    coefficientOfVariation: 1.38,
    observationCount: 10,
    latestInStock: true,
    discountFromAveragePercent: 9.72,
    premiumOverLowPercent: 0,
    platformSpreadPercent: 5.0,
  };

  const result = recommendationScorer.calculateScore(features);
  assert.strictEqual(result.action, RECOMMENDATION_ACTIONS.BUY_NOW);
  assert.ok(result.score >= RECOMMENDATION_THRESHOLDS.BUY_NOW_MIN_SCORE, `Score was ${result.score}`);
});

// ----------------------------------------------------
// B. Current Price Near Historical Minimum -> BUY Evidence
// ----------------------------------------------------
console.log('\n--- B. Proximity to Historical Low ---');
runTest('Price at historical low receives maximum priceVsLow score', () => {
  const scoreAtLow = recommendationScorer.scorePriceVsLow(0);
  assert.strictEqual(scoreAtLow, HEURISTIC_WEIGHTS.PRICE_VS_LOW);

  const scoreAboveLow = recommendationScorer.scorePriceVsLow(10); // 10% above low
  assert.strictEqual(scoreAboveLow, 0);
});

// ----------------------------------------------------
// C. High Current Price -> WAIT Evidence
// ----------------------------------------------------
console.log('\n--- C. Elevated Current Price vs Average ---');
runTest('Current price 10% above average produces WAIT recommendation', () => {
  const features = {
    currentPrice: 80000,
    historicalAverage: 70000,
    historicalLow: 68000,
    historicalHigh: 80000,
    priceChange: 5000,
    priceChangePercent: 6.67,
    trend: 'INCREASING',
    standardDeviation: 2000,
    coefficientOfVariation: 2.85,
    observationCount: 10,
    latestInStock: true,
    discountFromAveragePercent: -14.28,
    premiumOverLowPercent: 17.65,
    platformSpreadPercent: 0,
  };

  const result = recommendationScorer.calculateScore(features);
  assert.strictEqual(result.action, RECOMMENDATION_ACTIONS.WAIT);
  assert.ok(result.score <= RECOMMENDATION_THRESHOLDS.WAIT_MAX_SCORE, `Score was ${result.score}`);
});

// ----------------------------------------------------
// D. Decreasing Trend Momentum
// ----------------------------------------------------
console.log('\n--- D. Decreasing Trend Momentum ---');
runTest('Decreasing trend pulls score lower reflecting price drop momentum', () => {
  const trendScoreDec = recommendationScorer.scoreTrendMomentum('DECREASING', 0);
  const trendScoreStable = recommendationScorer.scoreTrendMomentum('STABLE', 0);
  assert.ok(trendScoreDec < trendScoreStable, 'Decreasing trend score should be lower than stable');
});

// ----------------------------------------------------
// E. Conflicting Signals Handling
// ----------------------------------------------------
console.log('\n--- E. Conflicting Signals Explanation ---');
runTest('Decreasing trend with below-average price produces explainable conflict bullet', () => {
  const features = {
    currentPrice: 69000,
    historicalAverage: 72000,
    historicalLow: 68000,
    historicalHigh: 74000,
    priceChange: -2000,
    priceChangePercent: -2.8,
    trend: 'DECREASING',
    discountFromAveragePercent: 4.17,
    premiumOverLowPercent: 1.47,
    coefficientOfVariation: 2.1,
    observationCount: 8,
    latestInStock: true,
    bestPlatform: 'Flipkart',
    bestPrice: 69000,
    priceSpread: 2000,
    platformSpreadPercent: 2.9,
  };

  const scoreResult = recommendationScorer.calculateScore(features);
  const reasons = recommendationReasonGenerator.generateReasons(features, scoreResult);

  const hasConflictExplanation = reasons.some((r) => r.includes('suggesting prices may drop further'));
  assert.ok(hasConflictExplanation, 'Must generate explicit conflicting signal explanation for falling price');
});

// ----------------------------------------------------
// F. Stable Trend + Attractive Price -> BUY_NOW
// ----------------------------------------------------
console.log('\n--- F. Stable Trend + Attractive Price ---');
runTest('Stable trend with low price qualifies for BUY_NOW', () => {
  const features = {
    currentPrice: 20000,
    historicalAverage: 24000,
    historicalLow: 20000,
    historicalHigh: 25000,
    priceChange: 0,
    priceChangePercent: 0,
    trend: 'STABLE',
    standardDeviation: 500,
    coefficientOfVariation: 2.08,
    observationCount: 15,
    latestInStock: true,
    discountFromAveragePercent: 16.67,
    premiumOverLowPercent: 0,
    platformSpreadPercent: 4.0,
  };

  const result = recommendationScorer.calculateScore(features);
  assert.strictEqual(result.action, RECOMMENDATION_ACTIONS.BUY_NOW);
});

// ----------------------------------------------------
// G. Stable Trend + Average Price -> NEUTRAL
// ----------------------------------------------------
console.log('\n--- G. Stable Trend + Average Price ---');
runTest('Stable trend at historical average results in NEUTRAL action', () => {
  const features = {
    currentPrice: 50000,
    historicalAverage: 50000,
    historicalLow: 48000,
    historicalHigh: 52000,
    priceChange: 0,
    priceChangePercent: 0,
    trend: 'STABLE',
    standardDeviation: 800,
    coefficientOfVariation: 1.6,
    observationCount: 12,
    latestInStock: true,
    discountFromAveragePercent: 0,
    premiumOverLowPercent: 4.17,
    platformSpreadPercent: 1.0,
  };

  const result = recommendationScorer.calculateScore(features);
  assert.strictEqual(result.action, RECOMMENDATION_ACTIONS.NEUTRAL);
  assert.ok(result.score > RECOMMENDATION_THRESHOLDS.WAIT_MAX_SCORE && result.score < RECOMMENDATION_THRESHOLDS.BUY_NOW_MIN_SCORE);
});

// ----------------------------------------------------
// H. High Volatility Damping
// ----------------------------------------------------
console.log('\n--- H. High Volatility Damping ---');
runTest('High CV (> 8%) dampens extreme scores towards 50', () => {
  const lowVolFeatures = {
    discountFromAveragePercent: 8,
    premiumOverLowPercent: 1,
    trend: 'INCREASING',
    platformSpreadPercent: 6,
    coefficientOfVariation: 2.0, // Low CV
    observationCount: 10,
    latestInStock: true,
  };

  const highVolFeatures = {
    ...lowVolFeatures,
    coefficientOfVariation: 12.0, // High CV
  };

  const lowVolScore = recommendationScorer.calculateScore(lowVolFeatures).score;
  const highVolScore = recommendationScorer.calculateScore(highVolFeatures).score;

  assert.ok(highVolScore < lowVolScore, 'High volatility must dampen high conviction score');
  assert.ok(highVolScore >= 50, 'Damped score remains reasonable');
});

// ----------------------------------------------------
// I. Low Observation Count (< 3) -> NEUTRAL
// ----------------------------------------------------
console.log('\n--- I. Insufficient Observation Count ---');
runTest('Observation count < 3 returns NEUTRAL action', () => {
  const features = {
    currentPrice: 10000,
    historicalAverage: 20000,
    observationCount: 2,
    trend: 'INSUFFICIENT_DATA',
    latestInStock: true,
  };

  const result = recommendationScorer.calculateScore(features);
  assert.strictEqual(result.action, RECOMMENDATION_ACTIONS.NEUTRAL);
  assert.strictEqual(result.score, 50);
  assert.strictEqual(result.overriddenBy, 'INSUFFICIENT_OBSERVATIONS');
});

// ----------------------------------------------------
// J. Out of Stock -> Never BUY_NOW
// ----------------------------------------------------
console.log('\n--- J. Out-of-Stock Constraints ---');
runTest('Out-of-stock product is capped and never receives BUY_NOW', () => {
  const features = {
    currentPrice: 50000,
    historicalAverage: 80000,
    historicalLow: 50000,
    historicalHigh: 90000,
    priceChange: 0,
    priceChangePercent: 0,
    trend: 'STABLE',
    standardDeviation: 1000,
    coefficientOfVariation: 1.5,
    observationCount: 20,
    latestInStock: false, // OUT OF STOCK
    discountFromAveragePercent: 37.5,
    premiumOverLowPercent: 0,
    platformSpreadPercent: 10,
  };

  const result = recommendationScorer.calculateScore(features);
  assert.notStrictEqual(result.action, RECOMMENDATION_ACTIONS.BUY_NOW);
  assert.ok(result.score <= 35, `Score was ${result.score}`);
  assert.strictEqual(result.overriddenBy, 'OUT_OF_STOCK');
});

// ----------------------------------------------------
// K. Zero Observations (NO_DATA) -> NEUTRAL
// ----------------------------------------------------
console.log('\n--- K. Zero Observations Handling ---');
runTest('Zero observations returns NEUTRAL with explicit reason', () => {
  const features = {
    observationCount: 0,
    trend: 'NO_DATA',
    latestInStock: null,
  };

  const scoreResult = recommendationScorer.calculateScore(features);
  assert.strictEqual(scoreResult.action, RECOMMENDATION_ACTIONS.NEUTRAL);
  assert.strictEqual(scoreResult.score, 50);

  const reasons = recommendationReasonGenerator.generateReasons(features, scoreResult);
  assert.ok(reasons.some((r) => r.includes('No historical price observations')));
});

// ----------------------------------------------------
// L. Date Range Validation (from > to)
// ----------------------------------------------------
console.log('\n--- L. Date Range Validation ---');
runTest('Validator rejects invalid date order (from > to)', () => {
  const val = recommendationValidator.validateDateRange('2026-09-20', '2026-09-10');
  assert.strictEqual(val.valid, false);
  assert.ok(val.error.includes('cannot be later than'));
});

// ----------------------------------------------------
// M. Nonexistent Product ID Validation
// ----------------------------------------------------
console.log('\n--- M. Empty Product ID Validation ---');
runTest('Validator rejects empty or whitespace product ID', () => {
  const val1 = recommendationValidator.validateProductId('');
  const val2 = recommendationValidator.validateProductId('   ');
  assert.strictEqual(val1.valid, false);
  assert.strictEqual(val2.valid, false);
});

// ----------------------------------------------------
// N. Cross-Platform Price Difference Extraction
// ----------------------------------------------------
console.log('\n--- N. Cross-Platform Deal Extraction ---');
runTest('Feature extractor accurately computes best platform and price spread', () => {
  const trendReport = {
    currentPrice: 70000,
    averagePrice: 72000,
    lowestPrice: 68000,
    highestPrice: 74000,
    observationCount: 10,
    latestInStock: true,
  };

  const platformSnapshot = [
    { platform: 'Amazon', effectivePrice: 70000 },
    { platform: 'Flipkart', effectivePrice: 68000 },
    { platform: 'Croma', effectivePrice: 73000 },
  ];

  const features = recommendationFeatureExtractor.extractFeatures(trendReport, platformSnapshot);
  assert.strictEqual(features.bestPlatform, 'Flipkart');
  assert.strictEqual(features.bestPrice, 68000);
  assert.strictEqual(features.worstPrice, 73000);
  assert.strictEqual(features.priceSpread, 5000);
  assert.strictEqual(features.platformSpreadPercent, 7.35);
});

// ----------------------------------------------------
// O. Determinism: Same Input Produces Same Output
// ----------------------------------------------------
console.log('\n--- O. Engine Determinism ---');
runTest('Same feature input produces identical score and reasons across multiple invocations', () => {
  const features = {
    currentPrice: 70999,
    historicalAverage: 72032,
    historicalLow: 68999,
    historicalHigh: 74039,
    priceChange: -3040,
    priceChangePercent: -4.11,
    trend: 'DECREASING',
    standardDeviation: 1718.27,
    coefficientOfVariation: 2.39,
    observationCount: 18,
    latestInStock: true,
    discountFromAveragePercent: 1.43,
    premiumOverLowPercent: 2.9,
    platformSpreadPercent: 7.3,
  };

  const res1 = recommendationScorer.calculateScore(features);
  const res2 = recommendationScorer.calculateScore(features);
  assert.strictEqual(res1.score, res2.score);
  assert.strictEqual(res1.action, res2.action);
});

// ----------------------------------------------------
// P. Score Invariant Check (0 <= score <= 100)
// ----------------------------------------------------
console.log('\n--- P. Score Boundary Invariants ---');
runTest('Scores remain bounded in [0, 100] even with extreme input discounts or premiums', () => {
  const extremeLow = {
    discountFromAveragePercent: 100, // 100% discount
    premiumOverLowPercent: 0,
    trend: 'INCREASING',
    platformSpreadPercent: 50,
    coefficientOfVariation: 0,
    observationCount: 100,
    latestInStock: true,
  };

  const extremeHigh = {
    discountFromAveragePercent: -200, // 200% premium
    premiumOverLowPercent: 200,
    trend: 'DECREASING',
    platformSpreadPercent: 0,
    coefficientOfVariation: 20,
    observationCount: 100,
    latestInStock: false,
  };

  const scoreLow = recommendationScorer.calculateScore(extremeLow).score;
  const scoreHigh = recommendationScorer.calculateScore(extremeHigh).score;

  assert.ok(scoreLow <= 100 && scoreLow >= 0, `Extreme low score was ${scoreLow}`);
  assert.ok(scoreHigh <= 100 && scoreHigh >= 0, `Extreme high score was ${scoreHigh}`);
});

// ----------------------------------------------------
// Q. Anti-Hardcoding Check
// ----------------------------------------------------
console.log('\n--- Q. Anti-Hardcoding Verification ---');
runTest('No hardcoded product names exist inside recommendation logic code', () => {
  const scorerCode = recommendationScorer.calculateScore.toString();
  const reasonCode = recommendationReasonGenerator.generateReasons.toString();

  assert.ok(!scorerCode.includes('iphone'), 'Scorer must not contain "iphone"');
  assert.ok(!scorerCode.includes('sony'), 'Scorer must not contain "sony"');
  assert.ok(!reasonCode.includes('iphone'), 'Reasons must not contain "iphone"');
  assert.ok(!reasonCode.includes('sony'), 'Reasons must not contain "sony"');
});

// ----------------------------------------------------
// Real MongoDB Database Integration Tests
// ----------------------------------------------------
console.log('\n--- Real MongoDB Database Integration Tests ---');

await runAsyncTest('Real MongoDB recommendation query for iPhone 16', async () => {
  await database.connect();
  const report = await recommendationService.getRecommendation('apple-iphone-16-128gb-black');

  assert.ok(report, 'Report should be defined');
  assert.strictEqual(report.product.productId, 'apple-iphone-16-128gb-black');
  assert.ok(['BUY_NOW', 'WAIT', 'NEUTRAL'].includes(report.recommendation.action));
  assert.strictEqual(report.recommendation.type, 'HEURISTIC');
  assert.ok(typeof report.recommendation.score === 'number');
  assert.ok(Array.isArray(report.reasons) && report.reasons.length > 0);
  assert.ok(report.evidence.observations > 0);
  assert.ok(Array.isArray(report.limitations) && report.limitations.length > 0);
});

await runAsyncTest('Real MongoDB recommendation query for Sony Headphones', async () => {
  const report = await recommendationService.getRecommendation('sony-wh-1000xm5-silver');

  assert.ok(report, 'Report should be defined');
  assert.strictEqual(report.product.productId, 'sony-wh-1000xm5-silver');
  assert.ok(typeof report.recommendation.score === 'number');
  assert.ok(report.reasons.length > 0);
});

await runAsyncTest('Non-existent product properly throws 404 PRODUCT_NOT_FOUND', async () => {
  let thrown = null;
  try {
    await recommendationService.getRecommendation('fake-non-existent-product-id');
  } catch (err) {
    thrown = err;
  }
  assert.ok(thrown, 'Should have thrown error');
  assert.strictEqual(thrown.code, 'PRODUCT_NOT_FOUND');
  assert.strictEqual(thrown.statusCode, 404);
});

await database.close();

// ----------------------------------------------------
// Final Test Summary
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`PHASE 7.1 TEST SUMMARY: ${passed}/${passed + failed} Passed (${failed} Failed)`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
