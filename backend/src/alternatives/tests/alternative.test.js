/**
 * Phase 8.2 Alternative Product Recommendation Test Suite
 * Exhaustive unit, mathematical, and MongoDB integration tests.
 */

import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { database } from '../../database/connection.js';
import { alternativeValidator } from '../alternative.validator.js';
import { alternativeFeatureExtractor, parseStorageToGB, parseRamToGB, inferCategory } from '../alternative.features.js';
import { alternativeScorer } from '../alternative.scorer.js';
import { alternativeReasonGenerator } from '../alternative.reasons.js';
import { alternativeService } from '../alternative.service.js';
import {
  ALTERNATIVE_WEIGHTS,
  ALTERNATIVE_NEUTRAL_BASELINES,
  ALTERNATIVE_SCORE_BOUNDS,
  ATTRIBUTE_COMPARISON_STATES,
} from '../alternative.constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 8.2 ALTERNATIVE RECOMMENDATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      passed++;
      console.log(`  ✅ PASS: ${name}`);
    } catch (err) {
      failed++;
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      passed++;
      console.log(`  ✅ PASS: ${name}`);
    } catch (err) {
      failed++;
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  // --- 1. Category Inference & Parsing Helpers ---
  console.log('--- 1. Category Inference & Parsing ---');
  test('Storage parser parses GB and TB accurately', () => {
    assert.strictEqual(parseStorageToGB('128gb'), 128);
    assert.strictEqual(parseStorageToGB('256 GB'), 256);
    assert.strictEqual(parseStorageToGB('1tb'), 1024);
    assert.strictEqual(parseStorageToGB(null), null);
    assert.strictEqual(parseStorageToGB('invalid'), null);
  });

  test('RAM parser parses gigabytes accurately', () => {
    assert.strictEqual(parseRamToGB('16gb'), 16);
    assert.strictEqual(parseRamToGB('12gb ram'), 12);
    assert.strictEqual(parseRamToGB(null), null);
  });

  test('Category inference derives category from title/model/explicit', () => {
    assert.strictEqual(inferCategory({ category: 'Smartphones' }), 'smartphones');
    assert.strictEqual(inferCategory({ canonicalTitle: 'Apple iPhone 16 (128GB, Black)' }), 'smartphones');
    assert.strictEqual(inferCategory({ canonicalTitle: 'Sony WH-1000XM5 ANC Headphones' }), 'audio');
    assert.strictEqual(inferCategory({ canonicalTitle: 'Apple MacBook Air M4 Laptop' }), 'laptops');
    assert.strictEqual(inferCategory({ canonicalTitle: 'Generic Random Item' }), null);
  });

  // --- 2. Feature Similarity Scoring ---
  console.log('\n--- 2. Feature Similarity Scoring ---');
  test('Exact model match gets full model score (20 pts)', () => {
    const target = { model: 'iphone 16', storageGB: 128, ramGB: null, color: 'black', variant: null };
    const cand = { model: 'iphone 16', storageGB: 128, ramGB: null, color: 'black', variant: null };
    const comp = alternativeFeatureExtractor.compareFeatures(target, cand);
    const score = alternativeScorer.scoreFeatureSimilarity(comp);
    assert.strictEqual(comp.model.state, ATTRIBUTE_COMPARISON_STATES.MATCH);
    assert.strictEqual(score.model, 20);
  });

  test('Same model family receives partial score (e.g. iPhone 16 vs iPhone 15)', () => {
    const target = { model: 'iphone 16', storageGB: 128, ramGB: null, color: 'black', variant: null };
    const cand = { model: 'iphone 15', storageGB: 128, ramGB: null, color: 'black', variant: null };
    const comp = alternativeFeatureExtractor.compareFeatures(target, cand);
    const score = alternativeScorer.scoreFeatureSimilarity(comp);
    assert.strictEqual(comp.model.state, ATTRIBUTE_COMPARISON_STATES.PARTIAL);
    assert.ok(score.model >= 10 && score.model <= 18, `Expected 10-18, got ${score.model}`);
  });

  test('Storage matching vs adjacent storage step scoring', () => {
    const target = { storageGB: 128 };
    const candMatch = { storageGB: 128 };
    const candAdjacent = { storageGB: 256 };
    const candFar = { storageGB: 1024 };

    const compMatch = alternativeFeatureExtractor.compareStorage(target, candMatch);
    const compAdjacent = alternativeFeatureExtractor.compareStorage(target, candAdjacent);
    const compFar = alternativeFeatureExtractor.compareStorage(target, candFar);

    assert.strictEqual(compMatch.state, ATTRIBUTE_COMPARISON_STATES.MATCH);
    assert.strictEqual(compAdjacent.state, ATTRIBUTE_COMPARISON_STATES.PARTIAL);
    assert.ok(compMatch.ratio > compAdjacent.ratio);
    assert.ok(compAdjacent.ratio > compFar.ratio);
  });

  test('Missing specifications default to neutral ratios without full match', () => {
    const target = { storageGB: null, ramGB: null, color: null, variant: null };
    const cand = { storageGB: 128, ramGB: 16, color: 'black', variant: 'anc' };
    const comp = alternativeFeatureExtractor.compareFeatures(target, cand);
    assert.strictEqual(comp.storage.state, ATTRIBUTE_COMPARISON_STATES.MISSING_ONE);
    assert.strictEqual(comp.ram.state, ATTRIBUTE_COMPARISON_STATES.MISSING_ONE);
    assert.strictEqual(comp.color.state, ATTRIBUTE_COMPARISON_STATES.MISSING_ONE);
    assert.strictEqual(comp.variant.state, ATTRIBUTE_COMPARISON_STATES.MISSING_ONE);
    assert.strictEqual(comp.storage.ratio, 0.5);
  });

  // --- 3. Price Compatibility Scoring ---
  console.log('\n--- 3. Price Compatibility Scoring ---');
  test('Identical price gets full 25 points', () => {
    const target = { effectivePrice: 70000 };
    const cand = { effectivePrice: 70000 };
    const comp = alternativeFeatureExtractor.comparePrice(target, cand);
    const score = alternativeScorer.scorePriceCompatibility(comp);
    assert.strictEqual(score, 25);
  });

  test('Price within 10% difference gets ~20 points', () => {
    const target = { effectivePrice: 70000 };
    const cand = { effectivePrice: 77000 }; // +10%
    const comp = alternativeFeatureExtractor.comparePrice(target, cand);
    const score = alternativeScorer.scorePriceCompatibility(comp);
    assert.strictEqual(score, 20);
  });

  test('Large price difference (>=50%) yields 0 price compatibility points', () => {
    const target = { effectivePrice: 70000 };
    const cand = { effectivePrice: 20000 }; // -71.4%
    const comp = alternativeFeatureExtractor.comparePrice(target, cand);
    const score = alternativeScorer.scorePriceCompatibility(comp);
    assert.strictEqual(score, 0);
  });

  test('Missing, invalid, zero, or NaN price returns neutral baseline (12.5 pts)', () => {
    const compNull = alternativeFeatureExtractor.comparePrice({ effectivePrice: null }, { effectivePrice: 70000 });
    const compNaN = alternativeFeatureExtractor.comparePrice({ effectivePrice: NaN }, { effectivePrice: 70000 });
    const compZero = alternativeFeatureExtractor.comparePrice({ effectivePrice: 0 }, { effectivePrice: 70000 });

    assert.strictEqual(alternativeScorer.scorePriceCompatibility(compNull), 12.5);
    assert.strictEqual(alternativeScorer.scorePriceCompatibility(compNaN), 12.5);
    assert.strictEqual(alternativeScorer.scorePriceCompatibility(compZero), 12.5);
  });

  // --- 4. Critical Design Rule: Cheaper item does NOT automatically win ---
  console.log('\n--- 4. Critical Design Rule (Budget Similarity vs Cheapness) ---');
  test('Closer-priced similar alternative outranks a much cheaper dissimilar item', () => {
    // Target: ₹70,000 Smartphone (iPhone 16)
    const target = alternativeFeatureExtractor.extractProductFeatures(
      { canonicalId: 'iphone-16', brand: 'apple', model: 'iphone 16', storage: '128gb', category: 'smartphones' },
      70000
    );

    // Candidate A: ₹69,000 Smartphone (Samsung Galaxy S25 - closely matching specs & price)
    const candA = alternativeFeatureExtractor.extractProductFeatures(
      { canonicalId: 'galaxy-s25', brand: 'samsung', model: 'galaxy s25', storage: '128gb', category: 'smartphones' },
      69000
    );

    // Candidate B: ₹1,800 Earbuds (boAt Nirvana - vastly cheaper, dissimilar category)
    const candB = alternativeFeatureExtractor.extractProductFeatures(
      { canonicalId: 'boat-nirvana', brand: 'boat', model: 'nirvana ion', storage: null, category: 'audio' },
      1800
    );

    const compA = alternativeFeatureExtractor.compareFeatures(target, candA);
    const compB = alternativeFeatureExtractor.compareFeatures(target, candB);

    const scoreA = alternativeScorer.calculateScore(compA);
    const scoreB = alternativeScorer.calculateScore(compB);

    assert.ok(scoreA.recommendationScore > scoreB.recommendationScore, `Expected A (${scoreA.recommendationScore}) > B (${scoreB.recommendationScore})`);
    assert.strictEqual(compB.category.compatible, false); // Incompatible category
  });

  // --- 5. Category Compatibility ---
  console.log('\n--- 5. Category Compatibility ---');
  test('Same category yields full 15 points; different category yields 0 points', () => {
    const compSame = alternativeFeatureExtractor.compareCategory({ category: 'smartphones' }, { category: 'smartphones' });
    const compDiff = alternativeFeatureExtractor.compareCategory({ category: 'smartphones' }, { category: 'audio' });
    const compMissing = alternativeFeatureExtractor.compareCategory({ category: null }, { category: 'smartphones' });

    assert.strictEqual(alternativeScorer.scoreCategoryCompatibility(compSame), 15);
    assert.strictEqual(alternativeScorer.scoreCategoryCompatibility(compDiff), 0);
    assert.strictEqual(alternativeScorer.scoreCategoryCompatibility(compMissing), 7.5);
  });

  // --- 6. Brand / Variant Compatibility ---
  console.log('\n--- 6. Brand / Variant Compatibility ---');
  test('Same brand gives 10 pts; cross-brand gives 5 pts (does NOT reject)', () => {
    const compSame = alternativeFeatureExtractor.compareBrand({ brand: 'apple' }, { brand: 'apple' });
    const compCross = alternativeFeatureExtractor.compareBrand({ brand: 'apple' }, { brand: 'samsung' });
    const compMissing = alternativeFeatureExtractor.compareBrand({ brand: null }, { brand: 'apple' });

    assert.strictEqual(alternativeScorer.scoreBrandVariant(compSame), 10);
    assert.strictEqual(alternativeScorer.scoreBrandVariant(compCross), 5);
    assert.strictEqual(alternativeScorer.scoreBrandVariant(compMissing), 5);
  });

  // --- 7. Bounded Scoring Invariants [0, 100] ---
  console.log('\n--- 7. Bounded Scoring Invariants ---');
  test('Overall recommendation score is strictly bounded in [0, 100]', () => {
    const target = { model: 'm', storageGB: 128, ramGB: 16, color: 'black', variant: 'v', category: 'c', brand: 'b', effectivePrice: 1000 };
    const candPerfect = { model: 'm', storageGB: 128, ramGB: 16, color: 'black', variant: 'v', category: 'c', brand: 'b', effectivePrice: 1000 };
    const candOpposite = { model: 'x', storageGB: 2, ramGB: 1, color: 'white', variant: 'y', category: 'd', brand: 'z', effectivePrice: 100000 };

    const compPerfect = alternativeFeatureExtractor.compareFeatures(target, candPerfect);
    const compOpposite = alternativeFeatureExtractor.compareFeatures(target, candOpposite);

    const scorePerfect = alternativeScorer.calculateScore(compPerfect);
    const scoreOpposite = alternativeScorer.calculateScore(compOpposite);

    assert.strictEqual(scorePerfect.recommendationScore, 100);
    assert.ok(scoreOpposite.recommendationScore >= 0 && scoreOpposite.recommendationScore <= 100);
  });

  // --- 8. Parameter Validation ---
  console.log('\n--- 8. Parameter Validation ---');
  test('Validator validates product ID and rejects empty strings', () => {
    assert.strictEqual(alternativeValidator.validateProductId('valid-id').valid, true);
    assert.strictEqual(alternativeValidator.validateProductId('').valid, false);
    assert.strictEqual(alternativeValidator.validateProductId(null).valid, false);
  });

  test('Validator validates limit parameter (1 to 50)', () => {
    assert.strictEqual(alternativeValidator.validateLimit(undefined).limit, 5);
    assert.strictEqual(alternativeValidator.validateLimit(10).limit, 10);
    assert.strictEqual(alternativeValidator.validateLimit('3').limit, 3);
    assert.strictEqual(alternativeValidator.validateLimit(0).valid, false);
    assert.strictEqual(alternativeValidator.validateLimit(-5).valid, false);
    assert.strictEqual(alternativeValidator.validateLimit(100).valid, false);
    assert.strictEqual(alternativeValidator.validateLimit('invalid').valid, false);
  });

  // --- 9. Explainable Reason Generator ---
  console.log('\n--- 9. Explainable Reason Generator ---');
  test('Reason generator generates accurate explanations matching evidence', () => {
    const target = { canonicalTitle: 'iPhone 16', brand: 'apple', category: 'smartphones', storage: '128gb', storageGB: 128, effectivePrice: 70000 };
    const cand = { canonicalTitle: 'Galaxy S25', brand: 'samsung', category: 'smartphones', storage: '256gb', storageGB: 256, effectivePrice: 72000 };
    const comp = alternativeFeatureExtractor.compareFeatures(target, cand);
    const reasons = alternativeReasonGenerator.generateReasons(target, cand, comp);

    assert.ok(reasons.some((r) => r.includes('Same product category (Smartphones)')));
    assert.ok(reasons.some((r) => r.includes('Comparable current price')));
    assert.ok(reasons.some((r) => r.includes('Cross-brand alternative from Samsung')));
    assert.ok(reasons.some((r) => r.includes('Higher storage capacity (256GB vs 128GB)')));
  });

  // --- 10. Anti-Hardcoding Verification ---
  console.log('\n--- 10. Anti-Hardcoding Verification ---');
  test('No product-specific names are hardcoded in core logic files', () => {
    const scorerCode = readFileSync(join(__dirname, '../alternative.scorer.js'), 'utf8');
    const serviceCode = readFileSync(join(__dirname, '../alternative.service.js'), 'utf8');
    const constantsCode = readFileSync(join(__dirname, '../alternative.constants.js'), 'utf8');

    const productPattern = /\b(iphone|galaxy|macbook|sony|airpods|pixel)\b/i;
    assert.strictEqual(productPattern.test(scorerCode), false, 'Scorer contains hardcoded product names');
    assert.strictEqual(productPattern.test(serviceCode), false, 'Service contains hardcoded product names');
    assert.strictEqual(productPattern.test(constantsCode), false, 'Constants contains hardcoded product names');
  });

  // --- 11. Real MongoDB Integration Tests ---
  console.log('\n--- 11. Real MongoDB Database Integration Tests ---');
  await asyncTest('Real MongoDB alternative product query for iPhone 16', async () => {
    await database.connect();
    const res = await alternativeService.getAlternativeProducts('apple-iphone-16-128gb-black', { limit: 5 });

    assert.ok(res);
    assert.strictEqual(res.targetProduct.canonicalId, 'apple-iphone-16-128gb-black');
    assert.ok(Array.isArray(res.recommendations));
    // Verify target product is not in recommendations (self-recommendation prevention)
    assert.ok(!res.recommendations.some((r) => r.canonicalId === 'apple-iphone-16-128gb-black'));
    assert.ok(res.metadata.deterministic === true);
    assert.strictEqual(res.metadata.algorithm, 'CONTENT_BASED_HEURISTIC');
  });

  await asyncTest('Real MongoDB query for non-existent product throws 404', async () => {
    try {
      await alternativeService.getAlternativeProducts('fake-non-existent-product-id');
      assert.fail('Should have thrown PRODUCT_NOT_FOUND error');
    } catch (err) {
      assert.strictEqual(err.code, 'PRODUCT_NOT_FOUND');
      assert.strictEqual(err.statusCode, 404);
    }
  });

  await asyncTest('Real MongoDB limit parameter restricts recommendation count', async () => {
    const res = await alternativeService.getAlternativeProducts('apple-iphone-16-128gb-black', { limit: 1 });
    assert.ok(res.recommendations.length <= 1);
  });

  await database.close();

  console.log('\n====================================================');
  console.log(`PHASE 8.2 TEST SUMMARY: ${passed}/${passed + failed} Passed (${failed} Failed)`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
