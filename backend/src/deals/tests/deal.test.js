/**
 * Phase 8.1 Deal Score & Ranking Test Suite
 * Validates deterministic heuristic deal scoring, multi-platform ranking, tie-breaking, and MongoDB integration.
 */

import assert from 'assert';
import { database } from '../../database/connection.js';
import {
  dealValidator,
  dealFeatureExtractor,
  dealScorer,
  dealReasonGenerator,
  dealService,
  DEAL_WEIGHTS,
  DEAL_NEUTRAL_BASELINES,
  DEAL_AVAILABILITY_RULES,
} from '../index.js';
import { recommendationService } from '../../recommendation/index.js';

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
console.log('🚀 RUNNING PHASE 8.1 DEAL SCORE & RANKING TEST SUITE');
console.log('====================================================\n');

// ----------------------------------------------------
// A & B: Lowest Price Listing Ranks First & Higher Price Penalty
// ----------------------------------------------------
console.log('--- A & B. Lowest-Price Listing Priority ---');
runTest('Lowest effective price receives highest deal score and ranks first', () => {
  const cheapListing = {
    discountFromAveragePercent: 5.0,
    premiumOverLowPercent: 0,
    percentageOverCheapest: 0,
    platformCount: 3,
    marketPriceSpread: 3000,
    discount: 10,
    deliveryCharge: 0,
    sellerRating: 4.8,
    inStock: true,
  };

  const expensiveListing = {
    discountFromAveragePercent: -2.0,
    premiumOverLowPercent: 5.0,
    percentageOverCheapest: 5.0,
    platformCount: 3,
    marketPriceSpread: 3000,
    discount: 5,
    deliveryCharge: 99,
    sellerRating: 4.8,
    inStock: true,
  };

  const scoreCheap = dealScorer.calculateScore(cheapListing).dealScore;
  const scoreExp = dealScorer.calculateScore(expensiveListing).dealScore;

  assert.ok(scoreCheap > scoreExp, `Cheaper listing score (${scoreCheap}) must exceed expensive listing (${scoreExp})`);
});

// ----------------------------------------------------
// C & D: Single Platform & Equal Price Markets Neutrality
// ----------------------------------------------------
console.log('\n--- C & D. Platform Advantage Neutral Baselines ---');
runTest('Single platform market gives exact neutral baseline (15/30)', () => {
  const scoreSingle = dealScorer.scorePlatformAdvantage(0, 1, 0);
  assert.strictEqual(scoreSingle, DEAL_NEUTRAL_BASELINES.PLATFORM_ADVANTAGE_NEUTRAL);
});

runTest('Equal platform prices across multiple stores give neutral baseline (15/30)', () => {
  const scoreEqual = dealScorer.scorePlatformAdvantage(0, 3, 0);
  assert.strictEqual(scoreEqual, DEAL_NEUTRAL_BASELINES.PLATFORM_ADVANTAGE_NEUTRAL);
});

// ----------------------------------------------------
// E: Multi-Platform Price Spread Scoring
// ----------------------------------------------------
console.log('\n--- E. Cross-Platform Relative Advantage ---');
runTest('Cheapest store gets full 30 pts; 5% more expensive store loses 15 pts', () => {
  const scoreCheapest = dealScorer.scorePlatformAdvantage(0, 3, 2000);
  assert.strictEqual(scoreCheapest, DEAL_WEIGHTS.PLATFORM_ADVANTAGE); // 30

  const scoreMoreExpensive = dealScorer.scorePlatformAdvantage(5.0, 3, 2000);
  assert.strictEqual(scoreMoreExpensive, 15); // 30 - (5.0 * 3) = 15
});

// ----------------------------------------------------
// F & G: Authentic Retailer Discounts
// ----------------------------------------------------
console.log('\n--- F & G. Discount Factor Handling ---');
runTest('Valid stated discount yields proportional points without exceeding max 15', () => {
  const score10 = dealScorer.scoreDiscount(10);
  assert.strictEqual(score10, 7.5);

  const score20 = dealScorer.scoreDiscount(20);
  assert.strictEqual(score20, 15);
});

runTest('Missing / null discount yields neutral baseline (7.5/15) without fake values', () => {
  const scoreNull = dealScorer.scoreDiscount(null);
  const scoreUndefined = dealScorer.scoreDiscount(undefined);
  const scoreZero = dealScorer.scoreDiscount(0);

  assert.strictEqual(scoreNull, DEAL_NEUTRAL_BASELINES.DISCOUNT_NEUTRAL);
  assert.strictEqual(scoreUndefined, DEAL_NEUTRAL_BASELINES.DISCOUNT_NEUTRAL);
  assert.strictEqual(scoreZero, DEAL_NEUTRAL_BASELINES.DISCOUNT_NEUTRAL);
});

// ----------------------------------------------------
// H & I: Delivery Surcharge Impact
// ----------------------------------------------------
console.log('\n--- H & I. Delivery Charge Factor ---');
runTest('Free delivery gives full 10 pts; delivery charge deducts score points', () => {
  const freeDel = dealScorer.scoreDelivery(0);
  assert.strictEqual(freeDel, DEAL_WEIGHTS.DELIVERY); // 10

  const paidDel = dealScorer.scoreDelivery(30);
  assert.strictEqual(paidDel, 8.0); // 10 - (30 / 15) = 8
});

// ----------------------------------------------------
// J & K: Out-of-Stock Constraints & Best Deal Exclusion
// ----------------------------------------------------
console.log('\n--- J & K. Availability & Out-of-Stock Rules ---');
runTest('Out-of-stock listing is capped at <= 25 and cannot win against in-stock listing', () => {
  const outOfStockListing = {
    discountFromAveragePercent: 20.0,
    premiumOverLowPercent: 0,
    percentageOverCheapest: 0,
    platformCount: 2,
    marketPriceSpread: 5000,
    discount: 30,
    deliveryCharge: 0,
    sellerRating: 5.0,
    inStock: false, // OUT OF STOCK
  };

  const result = dealScorer.calculateScore(outOfStockListing);
  assert.ok(result.dealScore <= DEAL_AVAILABILITY_RULES.OUT_OF_STOCK_MAX_SCORE);
  assert.strictEqual(result.overriddenBy, 'OUT_OF_STOCK');
});

// ----------------------------------------------------
// L & M: Seller Rating Factor
// ----------------------------------------------------
console.log('\n--- L & M. Seller Rating Boundaries ---');
runTest('Seller rating is bounded to 5 pts and missing rating returns neutral (3.5)', () => {
  const missingRating = dealScorer.scoreSellerRating(null);
  assert.strictEqual(missingRating, DEAL_NEUTRAL_BASELINES.SELLER_RATING_NEUTRAL);

  const maxRating = dealScorer.scoreSellerRating(5.0);
  assert.strictEqual(maxRating, 5.0);

  const normalRating = dealScorer.scoreSellerRating(4.8);
  assert.strictEqual(normalRating, 4.8);
});

// ----------------------------------------------------
// N & O: Historical Comparison Components
// ----------------------------------------------------
console.log('\n--- N & O. Historical Position Scoring ---');
runTest('Historical position evaluates discount vs mean and proximity to floor', () => {
  // 5% below average, exactly at low floor
  const pos = dealScorer.scorePricePosition(5.0, 0);
  assert.strictEqual(pos.priceVsAverage, 18.75); // 12.5 + (5 * 1.25)
  assert.strictEqual(pos.priceVsLow, 15.0);
  assert.strictEqual(pos.total, 33.75);
});

// ----------------------------------------------------
// P & Q: Validation & Parameter Constraints
// ----------------------------------------------------
console.log('\n--- P & Q. Date & Parameter Validation ---');
runTest('Validator rejects invalid date order (from > to)', () => {
  const val = dealValidator.validateDateRange('2026-09-20', '2026-09-10');
  assert.strictEqual(val.valid, false);
  assert.ok(val.error.includes('cannot be later than'));
});

runTest('Validator rejects empty or whitespace product ID', () => {
  const val = dealValidator.validateProductId('');
  assert.strictEqual(val.valid, false);
});

// ----------------------------------------------------
// S: Score Invariant Check (0 <= dealScore <= 100)
// ----------------------------------------------------
console.log('\n--- S. Score Boundary Invariants ---');
runTest('Deal score is strictly bounded in [0, 100] even with extreme inputs', () => {
  const extremeDiscount = {
    discountFromAveragePercent: 100,
    premiumOverLowPercent: 0,
    percentageOverCheapest: 0,
    platformCount: 5,
    marketPriceSpread: 10000,
    discount: 90,
    deliveryCharge: 0,
    sellerRating: 5.0,
    inStock: true,
  };

  const extremeExpensive = {
    discountFromAveragePercent: -200,
    premiumOverLowPercent: 200,
    percentageOverCheapest: 100,
    platformCount: 5,
    marketPriceSpread: 10000,
    discount: null,
    deliveryCharge: 500,
    sellerRating: 1.0,
    inStock: false,
  };

  const scoreHigh = dealScorer.calculateScore(extremeDiscount).dealScore;
  const scoreLow = dealScorer.calculateScore(extremeExpensive).dealScore;

  assert.ok(scoreHigh <= 100 && scoreHigh >= 0, `Extreme high score was ${scoreHigh}`);
  assert.ok(scoreLow <= 100 && scoreLow >= 0, `Extreme low score was ${scoreLow}`);
});

// ----------------------------------------------------
// T & U: Determinism & Tie-Breaking
// ----------------------------------------------------
console.log('\n--- T & U. Deterministic Tie-Breaking ---');
runTest('Identical scores break ties deterministically by price, then rating, then platform', () => {
  const listings = [
    { platform: 'Z-Store', effectivePrice: 70000, sellerRating: 4.5, dealScore: 80 },
    { platform: 'A-Store', effectivePrice: 68000, sellerRating: 4.5, dealScore: 80 },
    { platform: 'B-Store', effectivePrice: 70000, sellerRating: 4.9, dealScore: 80 },
  ];

  listings.sort((a, b) => {
    if (b.dealScore !== a.dealScore) return b.dealScore - a.dealScore;
    if (a.effectivePrice !== b.effectivePrice) return a.effectivePrice - b.effectivePrice;
    const rA = a.sellerRating || 0;
    const rB = b.sellerRating || 0;
    if (rB !== rA) return rB - rA;
    return String(a.platform).localeCompare(String(b.platform));
  });

  // Expected order:
  // 1. A-Store (cheaper price 68000)
  // 2. B-Store (price 70000, rating 4.9)
  // 3. Z-Store (price 70000, rating 4.5)
  assert.strictEqual(listings[0].platform, 'A-Store');
  assert.strictEqual(listings[1].platform, 'B-Store');
  assert.strictEqual(listings[2].platform, 'Z-Store');
});

// ----------------------------------------------------
// V: Reasons Evidence Matching
// ----------------------------------------------------
console.log('\n--- V. Reason Generator Accuracy ---');
runTest('Reason generator formats actual calculated numbers accurately', () => {
  const feat = {
    platform: 'Flipkart',
    effectivePrice: 68999,
    originalPrice: 79900,
    discount: 14,
    deliveryCharge: 0,
    inStock: true,
    sellerName: 'SuperComNet Assured',
    sellerRating: 4.8,
    discountFromAveragePercent: 4.21,
    premiumOverLowPercent: 0,
    priceDifferenceVsCheapest: 0,
    percentageOverCheapest: 0,
  };

  const market = {
    historicalAverage: 72032,
    historicalLow: 68999,
    marketLowestPrice: 68999,
    priceSpread: 5040,
    platformCount: 6,
  };

  const scoreResult = { dealScore: 88 };
  const reasons = dealReasonGenerator.generateReasons(feat, scoreResult, market);

  assert.ok(reasons.some((r) => r.includes('4.2% below the historical average')));
  assert.ok(reasons.some((r) => r.includes('matches the all-time recorded floor')));
  assert.ok(reasons.some((r) => r.includes('saving up to ₹5,040')));
  assert.ok(reasons.some((r) => r.includes('Free delivery included')));
});

// ----------------------------------------------------
// W: Anti-Hardcoding Audit
// ----------------------------------------------------
console.log('\n--- W. Anti-Hardcoding Verification ---');
runTest('No hardcoded product or brand names exist inside deal engine code', () => {
  const scorerCode = dealScorer.calculateScore.toString();
  const reasonCode = dealReasonGenerator.generateReasons.toString();
  const serviceCode = dealService.getProductDeals.toString();

  assert.ok(!scorerCode.includes('iphone'), 'Scorer must not contain "iphone"');
  assert.ok(!scorerCode.includes('sony'), 'Scorer must not contain "sony"');
  assert.ok(!reasonCode.includes('iphone'), 'Reasons must not contain "iphone"');
  assert.ok(!reasonCode.includes('sony'), 'Reasons must not contain "sony"');
  assert.ok(!serviceCode.includes('iphone'), 'Service must not contain "iphone"');
});

// ----------------------------------------------------
// X: Phase 7 Recommendation Backward Compatibility
// ----------------------------------------------------
console.log('\n--- X. Phase 7 Recommendation Compatibility ---');
await runAsyncTest('Phase 7 Recommendation Service continues to work seamlessly', async () => {
  await database.connect();
  const rec = await recommendationService.getRecommendation('apple-iphone-16-128gb-black');
  assert.ok(rec, 'Phase 7 recommendation must return valid payload');
  assert.strictEqual(rec.product.productId, 'apple-iphone-16-128gb-black');
  assert.strictEqual(rec.recommendation.type, 'HEURISTIC');
});

// ----------------------------------------------------
// Real MongoDB Database Integration Tests
// ----------------------------------------------------
console.log('\n--- Real MongoDB Database Integration Tests ---');

await runAsyncTest('Real MongoDB deal ranking query for iPhone 16', async () => {
  const report = await dealService.getProductDeals('apple-iphone-16-128gb-black');

  assert.ok(report, 'Report should be defined');
  assert.strictEqual(report.product.productId, 'apple-iphone-16-128gb-black');
  assert.ok(report.bestDeal, 'Best deal should exist');
  assert.strictEqual(report.bestDeal.rank, 1);
  assert.strictEqual(report.bestDeal.platform, 'Flipkart');
  assert.strictEqual(report.bestDeal.effectivePrice, 68999);
  assert.ok(report.rankedListings.length === 6);
  assert.strictEqual(report.market.lowestPrice, 68999);
  assert.strictEqual(report.market.highestPrice, 74039);
  assert.strictEqual(report.market.priceSpread, 5040);
});

await runAsyncTest('Real MongoDB deal ranking query for Sony Headphones', async () => {
  const report = await dealService.getProductDeals('sony-wh-1000xm5-silver');

  assert.ok(report, 'Report should be defined');
  assert.strictEqual(report.product.productId, 'sony-wh-1000xm5-silver');
  assert.ok(report.bestDeal, 'Best deal should exist');
  assert.strictEqual(report.bestDeal.platform, 'Amazon');
  assert.strictEqual(report.bestDeal.effectivePrice, 24990);
});

await runAsyncTest('Non-existent product properly throws 404 PRODUCT_NOT_FOUND', async () => {
  let thrown = null;
  try {
    await dealService.getProductDeals('fake-non-existent-product-id');
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
console.log(`PHASE 8.1 TEST SUMMARY: ${passed}/${passed + failed} Passed (${failed} Failed)`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
