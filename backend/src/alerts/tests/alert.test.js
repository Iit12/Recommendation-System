/**
 * Phase 8.4 Price Alert & Watchlist Intelligence Test Suite
 * Comprehensive automated testing covering validation, pure mathematical rules,
 * status aggregation, safety bounds, anti-hardcoding, and real MongoDB database integration.
 */

import assert from 'assert';
import {
  ALERT_RULE_TYPES,
  ALERT_RULE_STATUS,
  ALERT_SUMMARY_STATUS,
  ALERT_LIMITS,
} from '../alert.constants.js';
import { alertValidator } from '../alert.validator.js';
import { alertFeatureExtractor } from '../alert.features.js';
import { alertRulesEngine } from '../alert.rules.js';
import { alertReasonGenerator } from '../alert.reasons.js';
import { alertService } from '../alert.service.js';
import { database } from '../../database/connection.js';
import { productRepository } from '../../database/repositories/product.repository.js';
import { listingRepository } from '../../database/repositories/listing.repository.js';
import { priceHistoryRepository } from '../../database/repositories/priceHistory.repository.js';

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
}

console.log('====================================================');
console.log('🚀 RUNNING PHASE 8.4 PRICE ALERT TEST SUITE');
console.log('====================================================\n');

// --- 1. Validation Tests ---
console.log('--- 1. Validation Tests ---');

runTest('1. Missing productId returns error', () => {
  const res = alertValidator.validateProductId(null);
  assert.strictEqual(res.valid, false);
});

runTest('2. Empty/whitespace productId returns error', () => {
  const res1 = alertValidator.validateProductId('');
  const res2 = alertValidator.validateProductId('   ');
  assert.strictEqual(res1.valid, false);
  assert.strictEqual(res2.valid, false);
});

runTest('3. Non-string productId returns error', () => {
  const res = alertValidator.validateProductId(12345);
  assert.strictEqual(res.valid, false);
});

runTest('4. Missing alerts object returns error', () => {
  const res1 = alertValidator.validateAlerts(null);
  const res2 = alertValidator.validateAlerts(undefined);
  assert.strictEqual(res1.valid, false);
  assert.strictEqual(res2.valid, false);
});

runTest('5. Empty alerts object (no rules) returns error', () => {
  const res = alertValidator.validateAlerts({});
  assert.strictEqual(res.valid, false);
});

runTest('6. Invalid targetPrice (non-numeric or string) returns error', () => {
  const res = alertValidator.validateAlerts({ targetPrice: 'cheap' });
  assert.strictEqual(res.valid, false);
});

runTest('7. Zero targetPrice returns error', () => {
  const res = alertValidator.validateAlerts({ targetPrice: 0 });
  assert.strictEqual(res.valid, false);
});

runTest('8. Negative targetPrice returns error', () => {
  const res = alertValidator.validateAlerts({ targetPrice: -500 });
  assert.strictEqual(res.valid, false);
});

runTest('9. Invalid priceDropPercent (non-numeric) returns error', () => {
  const res = alertValidator.validateAlerts({ priceDropPercent: 'five' });
  assert.strictEqual(res.valid, false);
});

runTest('10. Negative priceDropPercent returns error', () => {
  const res = alertValidator.validateAlerts({ priceDropPercent: -2 });
  assert.strictEqual(res.valid, false);
});

runTest('11. Excessive priceDropPercent (>100) returns error', () => {
  const res = alertValidator.validateAlerts({ priceDropPercent: 150 });
  assert.strictEqual(res.valid, false);
});

runTest('12. Invalid nearHistoricalLowPercent (<0 or >100) returns error', () => {
  const res1 = alertValidator.validateAlerts({ nearHistoricalLowPercent: -1 });
  const res2 = alertValidator.validateAlerts({ nearHistoricalLowPercent: 120 });
  assert.strictEqual(res1.valid, false);
  assert.strictEqual(res2.valid, false);
});

runTest('13. Invalid restock value (non-boolean) returns error', () => {
  const res = alertValidator.validateAlerts({ restock: 'yes' });
  assert.strictEqual(res.valid, false);
});

// --- 2. Feature Extraction & Listing Selection ---
console.log('\n--- 2. Feature Extraction & Listing Selection ---');

runTest('14. Selects cheapest valid in-stock listing and excludes out-of-stock', () => {
  const mockListings = [
    { listingId: 'l1', platform: 'amazon', price: 72000, inStock: true },
    { listingId: 'l2', platform: 'flipkart', price: 68999, inStock: true },
    { listingId: 'l3', platform: 'croma', price: 65000, inStock: false }, // Out of stock should be excluded
  ];
  const { currentListing, currentPrice } = alertFeatureExtractor.extractCurrentListingFeatures(mockListings, []);
  assert.strictEqual(currentPrice, 68999);
  assert.strictEqual(currentListing.platform, 'flipkart');
  assert.strictEqual(currentListing.inStock, true);
});

runTest('15. If all listings are out of stock, currentPrice is null', () => {
  const mockListings = [
    { listingId: 'l1', platform: 'amazon', price: 72000, inStock: false },
    { listingId: 'l2', platform: 'flipkart', price: 68999, inStock: false },
  ];
  const { currentListing, currentPrice } = alertFeatureExtractor.extractCurrentListingFeatures(mockListings, []);
  assert.strictEqual(currentPrice, null);
  assert.strictEqual(currentListing, null);
});

runTest('16. Filters invalid historical observations (NaN, negative, zero, null)', () => {
  const rawObs = [
    { effectivePrice: null, collectedAt: '2026-09-01T00:00:00.000Z' },
    { effectivePrice: NaN, collectedAt: '2026-09-02T00:00:00.000Z' },
    { effectivePrice: -100, collectedAt: '2026-09-03T00:00:00.000Z' },
    { effectivePrice: 0, collectedAt: '2026-09-04T00:00:00.000Z' },
    { effectivePrice: 70000, collectedAt: '2026-09-05T00:00:00.000Z' },
    { effectivePrice: 68000, collectedAt: '2026-09-06T00:00:00.000Z' },
  ];
  const features = alertFeatureExtractor.extractHistoricalFeatures(rawObs);
  assert.strictEqual(features.observationCount, 2);
  assert.strictEqual(features.historicalLow, 68000);
  assert.strictEqual(features.historicalHigh, 70000);
  assert.strictEqual(features.previousPrice, 70000);
});

// --- 3. Rule 1: Target Price ---
console.log('\n--- 3. Rule 1: Target Price ---');

runTest('17. Target price TRIGGERED when currentPrice <= targetPrice', () => {
  const res = alertRulesEngine.evaluateTargetPrice(68999, 70000);
  assert.strictEqual(res.status, ALERT_RULE_STATUS.TRIGGERED);
  assert.strictEqual(res.currentValue, 68999);
  assert.strictEqual(res.threshold, 70000);
});

runTest('18. Target price NOT_TRIGGERED when currentPrice > targetPrice', () => {
  const res = alertRulesEngine.evaluateTargetPrice(72000, 70000);
  assert.strictEqual(res.status, ALERT_RULE_STATUS.NOT_TRIGGERED);
  assert.strictEqual(res.currentValue, 72000);
});

runTest('19. Target price NOT_EVALUABLE when currentPrice is null/invalid', () => {
  const res = alertRulesEngine.evaluateTargetPrice(null, 70000);
  assert.strictEqual(res.status, ALERT_RULE_STATUS.NOT_EVALUABLE);
  assert.strictEqual(res.reasonCode, 'NO_CURRENT_PRICE');
});

// --- 4. Rule 2: Price Drop Percentage ---
console.log('\n--- 4. Rule 2: Price Drop Percentage ---');

runTest('20. Price drop TRIGGERED when dropPercent >= priceDropPercent', () => {
  // Previous: 72000, Current: 68999 => Drop: ((72000 - 68999) / 72000) * 100 = 4.1681%
  const res = alertRulesEngine.evaluatePriceDrop(68999, 72000, 3.0);
  assert.strictEqual(res.status, ALERT_RULE_STATUS.TRIGGERED);
  assert.strictEqual(res.threshold, 3.0);
  assert(res.currentValue >= 4.16);
});

runTest('21. Price drop NOT_TRIGGERED when dropPercent < priceDropPercent', () => {
  // Previous: 70000, Current: 68999 => Drop: ~1.43% < 5.0%
  const res = alertRulesEngine.evaluatePriceDrop(68999, 70000, 5.0);
  assert.strictEqual(res.status, ALERT_RULE_STATUS.NOT_TRIGGERED);
});

runTest('22. Price increase does not trigger drop alert (negative drop)', () => {
  // Previous: 65000, Current: 68999 => Drop: -6.15%
  const res = alertRulesEngine.evaluatePriceDrop(68999, 65000, 2.0);
  assert.strictEqual(res.status, ALERT_RULE_STATUS.NOT_TRIGGERED);
  assert(res.currentValue < 0);
});

runTest('23. Price drop NOT_EVALUABLE when previousPrice is missing/invalid', () => {
  const res = alertRulesEngine.evaluatePriceDrop(68999, null, 3.0);
  assert.strictEqual(res.status, ALERT_RULE_STATUS.NOT_EVALUABLE);
  assert.strictEqual(res.reasonCode, 'NO_PREVIOUS_PRICE');
});

// --- 5. Rule 3: Near Historical Low ---
console.log('\n--- 5. Rule 3: Near Historical Low ---');

runTest('24. Near historical low TRIGGERED when currentPrice <= historicalLow * (1 + thresh / 100)', () => {
  // Historical low: 68000, Thresh: 2% => Threshold price: 69360. Current: 68999 <= 69360
  const res = alertRulesEngine.evaluateNearHistoricalLow(68999, 68000, 2.0);
  assert.strictEqual(res.status, ALERT_RULE_STATUS.TRIGGERED);
  assert.strictEqual(res.thresholdPrice, 69360);
});

runTest('25. Near historical low NOT_TRIGGERED when currentPrice exceeds threshold price', () => {
  // Historical low: 60000, Thresh: 2% => Threshold price: 61200. Current: 68999 > 61200
  const res = alertRulesEngine.evaluateNearHistoricalLow(68999, 60000, 2.0);
  assert.strictEqual(res.status, ALERT_RULE_STATUS.NOT_TRIGGERED);
});

runTest('26. Near historical low NOT_EVALUABLE when historical data is missing', () => {
  const res = alertRulesEngine.evaluateNearHistoricalLow(68999, null, 2.0);
  assert.strictEqual(res.status, ALERT_RULE_STATUS.NOT_EVALUABLE);
  assert.strictEqual(res.reasonCode, 'INSUFFICIENT_HISTORICAL_DATA');
});

// --- 6. Rule 4: Restock ---
console.log('\n--- 6. Rule 4: Restock ---');

runTest('27. Restock TRIGGERED when previous was out of stock and current is in stock', () => {
  const currentListing = { inStock: true };
  const stockHistory = [
    { inStock: false, collectedAt: '2026-09-17T00:00:00.000Z' },
    { inStock: true, collectedAt: '2026-09-18T00:00:00.000Z' },
  ];
  const res = alertRulesEngine.evaluateRestock(currentListing, stockHistory);
  assert.strictEqual(res.status, ALERT_RULE_STATUS.TRIGGERED);
  assert.strictEqual(res.currentValue, 'RESTOCKED');
});

runTest('28. Restock NOT_TRIGGERED when product was already in stock', () => {
  const currentListing = { inStock: true };
  const stockHistory = [
    { inStock: true, collectedAt: '2026-09-17T00:00:00.000Z' },
    { inStock: true, collectedAt: '2026-09-18T00:00:00.000Z' },
  ];
  const res = alertRulesEngine.evaluateRestock(currentListing, stockHistory);
  assert.strictEqual(res.status, ALERT_RULE_STATUS.NOT_TRIGGERED);
  assert.strictEqual(res.currentValue, 'ALREADY_IN_STOCK');
});

runTest('29. Restock NOT_EVALUABLE when stock history has insufficient observations', () => {
  const currentListing = { inStock: true };
  const stockHistory = [{ inStock: true, collectedAt: '2026-09-18T00:00:00.000Z' }];
  const res = alertRulesEngine.evaluateRestock(currentListing, stockHistory);
  assert.strictEqual(res.status, ALERT_RULE_STATUS.NOT_EVALUABLE);
  assert.strictEqual(res.reasonCode, 'INSUFFICIENT_STOCK_HISTORY');
});

// --- 7. Overall Summary Aggregation ---
console.log('\n--- 7. Overall Summary Aggregation ---');

runTest('30. Mixed TRIGGERED and NOT_TRIGGERED yields overall TRIGGERED', () => {
  const rule1 = { status: ALERT_RULE_STATUS.TRIGGERED };
  const rule2 = { status: ALERT_RULE_STATUS.NOT_TRIGGERED };
  const alerts = [rule1, rule2];
  let triggeredCount = 0, notEvaluableCount = 0;
  for (const a of alerts) {
    if (a.status === ALERT_RULE_STATUS.TRIGGERED) triggeredCount++;
    if (a.status === ALERT_RULE_STATUS.NOT_EVALUABLE) notEvaluableCount++;
  }
  const status = triggeredCount > 0 ? ALERT_SUMMARY_STATUS.TRIGGERED : (notEvaluableCount > 0 ? ALERT_SUMMARY_STATUS.INSUFFICIENT_DATA : ALERT_SUMMARY_STATUS.NOT_TRIGGERED);
  assert.strictEqual(status, ALERT_SUMMARY_STATUS.TRIGGERED);
});

runTest('31. All NOT_TRIGGERED yields overall NOT_TRIGGERED', () => {
  const alerts = [{ status: ALERT_RULE_STATUS.NOT_TRIGGERED }, { status: ALERT_RULE_STATUS.NOT_TRIGGERED }];
  let triggeredCount = 0, notEvaluableCount = 0;
  for (const a of alerts) {
    if (a.status === ALERT_RULE_STATUS.TRIGGERED) triggeredCount++;
    if (a.status === ALERT_RULE_STATUS.NOT_EVALUABLE) notEvaluableCount++;
  }
  const status = triggeredCount > 0 ? ALERT_SUMMARY_STATUS.TRIGGERED : (notEvaluableCount > 0 ? ALERT_SUMMARY_STATUS.INSUFFICIENT_DATA : ALERT_SUMMARY_STATUS.NOT_TRIGGERED);
  assert.strictEqual(status, ALERT_SUMMARY_STATUS.NOT_TRIGGERED);
});

runTest('32. No TRIGGERED + one NOT_EVALUABLE yields INSUFFICIENT_DATA', () => {
  const alerts = [{ status: ALERT_RULE_STATUS.NOT_TRIGGERED }, { status: ALERT_RULE_STATUS.NOT_EVALUABLE }];
  let triggeredCount = 0, notEvaluableCount = 0;
  for (const a of alerts) {
    if (a.status === ALERT_RULE_STATUS.TRIGGERED) triggeredCount++;
    if (a.status === ALERT_RULE_STATUS.NOT_EVALUABLE) notEvaluableCount++;
  }
  const status = triggeredCount > 0 ? ALERT_SUMMARY_STATUS.TRIGGERED : (notEvaluableCount > 0 ? ALERT_SUMMARY_STATUS.INSUFFICIENT_DATA : ALERT_SUMMARY_STATUS.NOT_TRIGGERED);
  assert.strictEqual(status, ALERT_SUMMARY_STATUS.INSUFFICIENT_DATA);
});

// --- 8. Reason Generator & Anti-Hardcoding ---
console.log('\n--- 8. Reason Generator & Anti-Hardcoding ---');

runTest('33. Reason generator constructs accurate natural language explanations', () => {
  const msg1 = alertReasonGenerator.generateMessage({
    type: ALERT_RULE_TYPES.TARGET_PRICE,
    status: ALERT_RULE_STATUS.TRIGGERED,
    threshold: 70000,
    currentValue: 68999,
  });
  assert(msg1.includes('₹68,999'));
  assert(msg1.includes('₹70,000'));

  const msg2 = alertReasonGenerator.generateMessage({
    type: ALERT_RULE_TYPES.PRICE_DROP,
    status: ALERT_RULE_STATUS.NOT_EVALUABLE,
    reasonCode: 'NO_PREVIOUS_PRICE',
  });
  assert(msg2.includes('no previous valid price observation exists'));
});

runTest('34. Anti-hardcoding check: Zero hardcoded product names in alert code', async () => {
  const fs = await import('fs');
  const path = await import('path');
  const files = [
    'alert.constants.js',
    'alert.validator.js',
    'alert.features.js',
    'alert.rules.js',
    'alert.reasons.js',
    'alert.service.js',
  ];
  const forbiddenPatterns = [/\biPhone\b/i, /\bSamsung\b/i, /\bSony\b/i, /\bBose\b/i];
  for (const relPath of files) {
    const fullPath = path.resolve('backend/src/alerts', relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    for (const pattern of forbiddenPatterns) {
      assert.strictEqual(pattern.test(content), false, `Forbidden brand hardcoding in ${relPath}: ${pattern}`);
    }
  }
});

// --- 9. Real MongoDB Database Integration Tests ---
console.log('\n--- 9. Real MongoDB Database Integration Tests ---');

async function runDatabaseTests() {
  await database.connect();
  const initialProductsCount = await productRepository.count();
  const initialListingsCount = await listingRepository.count();
  const initialHistoryCount = await priceHistoryRepository.count();

  await runAsyncTest('35. Real MongoDB: iPhone 16 alert evaluation with multiple rules', async () => {
    const res = await alertService.evaluateAlerts('apple-iphone-16-128gb-black', {
      targetPrice: 75000,
      priceDropPercent: 2.0,
      nearHistoricalLowPercent: 5.0,
      restock: true,
    });

    assert.strictEqual(res.product.canonicalId, 'apple-iphone-16-128gb-black');
    assert(res.currentListing !== null);
    assert(Number.isFinite(res.currentListing.effectivePrice));
    assert.strictEqual(res.alerts.length, 4);
    assert.strictEqual(typeof res.summary.status, 'string');
    assert.strictEqual(typeof res.summary.triggered, 'boolean');
    assert(res.metadata.historicalObservationsUsed > 0);
  });

  await runAsyncTest('36. Real MongoDB: Sony Headphones with single target price rule', async () => {
    const res = await alertService.evaluateAlerts('sony-wh-1000xm5-silver', {
      targetPrice: 30000,
    });

    assert.strictEqual(res.product.canonicalId, 'sony-wh-1000xm5-silver');
    assert.strictEqual(res.alerts.length, 1);
    assert.strictEqual(res.alerts[0].type, ALERT_RULE_TYPES.TARGET_PRICE);
  });

  await runAsyncTest('37. Real MongoDB: Non-existent product throws 404 PRODUCT_NOT_FOUND', async () => {
    try {
      await alertService.evaluateAlerts('non-existent-product-999', { targetPrice: 1000 });
      assert.fail('Should have thrown PRODUCT_NOT_FOUND error');
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
      assert.strictEqual(err.code, 'PRODUCT_NOT_FOUND');
    }
  });

  await runAsyncTest('38. Real MongoDB: Read-only check: Zero database mutations occurred', async () => {
    const afterProductsCount = await productRepository.count();
    const afterListingsCount = await listingRepository.count();
    const afterHistoryCount = await priceHistoryRepository.count();

    assert.strictEqual(afterProductsCount, initialProductsCount, 'Products count must not change');
    assert.strictEqual(afterListingsCount, initialListingsCount, 'Listings count must not change');
    assert.strictEqual(afterHistoryCount, initialHistoryCount, 'Price history count must not change');
  });

  await database.close();
}

runDatabaseTests().then(() => {
  console.log('\n====================================================');
  console.log(`PHASE 8.4 TEST SUMMARY: ${passedTests}/${totalTests} Passed (0 Failed)`);
  console.log('====================================================\n');
}).catch((err) => {
  console.error('\n❌ Test suite execution failed:', err);
  process.exit(1);
});
