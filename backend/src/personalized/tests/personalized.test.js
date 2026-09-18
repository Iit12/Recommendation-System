/**
 * Phase 8.3 Preference-Aware Recommendation Test Suite
 * Exhaustive unit, mathematical, and MongoDB integration tests.
 */

import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { database } from '../../database/connection.js';
import { personalizedValidator } from '../personalized.validator.js';
import { personalizedFeatureExtractor } from '../personalized.features.js';
import { personalizedScorer } from '../personalized.scorer.js';
import { personalizedReasonGenerator } from '../personalized.reasons.js';
import { personalizedService } from '../personalized.service.js';
import {
  PERSONALIZED_WEIGHTS,
  PERSONALIZED_NEUTRAL_BASELINES,
  PERSONALIZED_SCORE_BOUNDS,
} from '../personalized.constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 8.3 PREFERENCE-AWARE TEST SUITE');
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

  // --- 1. Parameter & Preference Validation ---
  console.log('--- 1. Validation Tests ---');
  test('Validates product ID (must be non-empty string)', () => {
    assert.strictEqual(personalizedValidator.validateProductId('valid-id').valid, true);
    assert.strictEqual(personalizedValidator.validateProductId('').valid, false);
    assert.strictEqual(personalizedValidator.validateProductId(null).valid, false);
  });

  test('Validates preferences object (handles empty preferences safely)', () => {
    assert.strictEqual(personalizedValidator.validatePreferences({}).valid, true);
    assert.strictEqual(personalizedValidator.validatePreferences(null).valid, true);
    assert.strictEqual(personalizedValidator.validatePreferences(undefined).valid, true);
    assert.strictEqual(personalizedValidator.validatePreferences('invalid').valid, false);
    assert.strictEqual(personalizedValidator.validatePreferences([]).valid, false);
  });

  test('Validates budget (must be positive finite number)', () => {
    assert.strictEqual(personalizedValidator.validatePreferences({ maxBudget: 75000 }).valid, true);
    assert.strictEqual(personalizedValidator.validatePreferences({ maxBudget: -500 }).valid, false);
    assert.strictEqual(personalizedValidator.validatePreferences({ maxBudget: 0 }).valid, false);
    assert.strictEqual(personalizedValidator.validatePreferences({ maxBudget: NaN }).valid, false);
    assert.strictEqual(personalizedValidator.validatePreferences({ maxBudget: Infinity }).valid, false);
  });

  test('Validates minStorage and minRam (must be non-negative numbers)', () => {
    assert.strictEqual(personalizedValidator.validatePreferences({ minStorage: 256, minRam: 8 }).valid, true);
    assert.strictEqual(personalizedValidator.validatePreferences({ minStorage: -1 }).valid, false);
    assert.strictEqual(personalizedValidator.validatePreferences({ minRam: -1 }).valid, false);
  });

  test('Validates preferredBrands (must be an array of strings)', () => {
    const res = personalizedValidator.validatePreferences({ preferredBrands: ['Apple', ' Samsung '] });
    assert.strictEqual(res.valid, true);
    assert.deepStrictEqual(res.normalizedPreferences.preferredBrands, ['apple', 'samsung']);
    assert.strictEqual(personalizedValidator.validatePreferences({ preferredBrands: 'apple' }).valid, false);
  });

  test('Normalizes non-normalized priority weights', () => {
    const res = personalizedValidator.validatePreferences({
      priorities: { price: 40, storage: 25, performance: 20, brand: 15 },
    });
    assert.strictEqual(res.valid, true);
    const p = res.normalizedPreferences.priorities;
    assert.strictEqual(p.price, 0.4);
    assert.strictEqual(p.storage, 0.25);
    assert.strictEqual(p.performance, 0.2);
    assert.strictEqual(p.brand, 0.15);
  });

  test('Rejects negative or invalid priority weights', () => {
    assert.strictEqual(personalizedValidator.validatePreferences({ priorities: { price: -0.5 } }).valid, false);
    assert.strictEqual(personalizedValidator.validatePreferences({ priorities: { price: NaN } }).valid, false);
  });

  // --- 2. Budget Compatibility Scoring ---
  console.log('\n--- 2. Budget Compatibility Scoring ---');
  test('Candidate within budget receives high score (25-30 pts)', () => {
    const evalWithin = personalizedFeatureExtractor.evaluateBudget(70000, 75000);
    const score = personalizedScorer.scoreBudget(evalWithin);
    assert.strictEqual(evalWithin.withinBudget, true);
    assert.ok(score >= 25 && score <= 30, `Expected 25-30, got ${score}`);
  });

  test('Candidate slightly above budget receives smooth penalty', () => {
    const evalSlightlyAbove = personalizedFeatureExtractor.evaluateBudget(78000, 75000); // 4% over
    const score = personalizedScorer.scoreBudget(evalSlightlyAbove);
    assert.strictEqual(evalSlightlyAbove.withinBudget, false);
    assert.ok(score >= 15 && score <= 25, `Expected 15-25, got ${score}`);
  });

  test('Candidate far above budget (>=20% over) approaches 0 budget points', () => {
    const evalFarAbove = personalizedFeatureExtractor.evaluateBudget(95000, 75000); // 26.7% over
    const score = personalizedScorer.scoreBudget(evalFarAbove);
    assert.strictEqual(score, 0);
  });

  test('Missing maxBudget returns neutral baseline (15 / 30 pts)', () => {
    const evalOmitted = personalizedFeatureExtractor.evaluateBudget(70000, undefined);
    const score = personalizedScorer.scoreBudget(evalOmitted);
    assert.strictEqual(score, PERSONALIZED_NEUTRAL_BASELINES.BUDGET_NEUTRAL);
  });

  test('Missing/invalid candidate price returns neutral baseline (15 / 30 pts)', () => {
    const evalNull = personalizedFeatureExtractor.evaluateBudget(null, 75000);
    const evalNaN = personalizedFeatureExtractor.evaluateBudget(NaN, 75000);
    assert.strictEqual(personalizedScorer.scoreBudget(evalNull), 15);
    assert.strictEqual(personalizedScorer.scoreBudget(evalNaN), 15);
  });

  // --- 3. Specification Match Scoring ---
  console.log('\n--- 3. Specification Match Scoring ---');
  test('Candidate meeting or exceeding minStorage and minRam gets full spec points (30 pts)', () => {
    const evalStorage = personalizedFeatureExtractor.evaluateStorage(256, 128);
    const evalRam = personalizedFeatureExtractor.evaluateRam(16, 8);
    const specScore = personalizedScorer.scoreSpecifications(evalStorage, evalRam);
    assert.strictEqual(specScore.storage, 18);
    assert.strictEqual(specScore.ram, 12);
    assert.strictEqual(specScore.total, 30);
  });

  test('Candidate violating minStorage receives proportional penalty', () => {
    const evalStorage = personalizedFeatureExtractor.evaluateStorage(128, 256); // 50% fulfillment
    const specScore = personalizedScorer.scoreSpecifications(evalStorage, { hasPreference: false });
    assert.strictEqual(specScore.storage, 9); // 18 * 0.5 = 9 pts
  });

  test('Candidate violating minRam receives proportional penalty', () => {
    const evalRam = personalizedFeatureExtractor.evaluateRam(8, 16); // 50% fulfillment
    const specScore = personalizedScorer.scoreSpecifications({ hasPreference: false }, evalRam);
    assert.strictEqual(specScore.ram, 6); // 12 * 0.5 = 6 pts
  });

  test('Missing candidate specs default to safe neutral baselines', () => {
    const evalStorage = personalizedFeatureExtractor.evaluateStorage(null, 256);
    const evalRam = personalizedFeatureExtractor.evaluateRam(null, 8);
    const specScore = personalizedScorer.scoreSpecifications(evalStorage, evalRam);
    assert.ok(specScore.storage < 18 && specScore.storage > 0);
    assert.ok(specScore.ram < 12 && specScore.ram > 0);
  });

  test('Omitted minStorage and minRam default to neutral baseline (15 / 30 pts)', () => {
    const evalStorage = personalizedFeatureExtractor.evaluateStorage(128, undefined);
    const evalRam = personalizedFeatureExtractor.evaluateRam(8, undefined);
    const specScore = personalizedScorer.scoreSpecifications(evalStorage, evalRam);
    assert.strictEqual(specScore.storage, 9);
    assert.strictEqual(specScore.ram, 6);
    assert.strictEqual(specScore.total, 15);
  });

  // --- 4. Brand Preference Scoring ---
  console.log('\n--- 4. Brand Preference Scoring ---');
  test('Preferred brand receives 10 pts; non-preferred receives 5 pts (soft preference)', () => {
    const evalPreferred = personalizedFeatureExtractor.evaluateBrand('samsung', ['samsung', 'apple']);
    const evalOther = personalizedFeatureExtractor.evaluateBrand('oneplus', ['samsung', 'apple']);
    const evalOmitted = personalizedFeatureExtractor.evaluateBrand('samsung', undefined);

    assert.strictEqual(personalizedScorer.scoreBrand(evalPreferred), 10);
    assert.strictEqual(personalizedScorer.scoreBrand(evalOther), 5);
    assert.strictEqual(personalizedScorer.scoreBrand(evalOmitted), 5);
  });

  // --- 5. Feature Priority & Deal Quality Scoring ---
  console.log('\n--- 5. Priorities & Deal Quality Scoring ---');
  test('Missing priorities return neutral baseline (10 / 20 pts)', () => {
    const evalOmitted = personalizedFeatureExtractor.evaluatePriorities({ effectivePrice: 70000 }, null, 75000, {});
    assert.strictEqual(personalizedScorer.scoreFeaturePriority(evalOmitted), 10);
  });

  test('Deal quality scales Phase 8.1 Deal Score (0-100 to 0-10 pts)', () => {
    assert.strictEqual(personalizedScorer.scoreDealQuality(90), 9);
    assert.strictEqual(personalizedScorer.scoreDealQuality(60), 6);
    assert.strictEqual(personalizedScorer.scoreDealQuality(null), 5); // Neutral 5/10
  });

  // --- 6. Critical Anti-Bias Invariant ---
  console.log('\n--- 6. Critical Anti-Bias (Specification/Budget Match vs Cheapness) ---');
  test('High-spec compatible alternative outranks vastly cheaper low-spec item', () => {
    const target = { effectivePrice: 70000, storageGB: 128, ramGB: 8, brand: 'apple' };
    const preferences = { maxBudget: 80000, minStorage: 256, minRam: 12, preferredBrands: ['samsung'] };

    // Candidate A: ₹74,999 Samsung (256GB, 12GB RAM) -> Matches budget, exceeds specs, matches brand
    const candA = personalizedFeatureExtractor.extractCandidateFeatures(
      { canonicalId: 'galaxy-s25', brand: 'samsung', storage: '256gb', ram: '12gb' },
      74999,
      88
    );
    const evalA = personalizedFeatureExtractor.evaluatePreferences(candA, preferences, target);
    const scoreA = personalizedScorer.calculateScore(evalA);

    // Candidate B: ₹15,000 Budget Phone (64GB, 4GB RAM) -> Cheap, but violates minStorage & minRam
    const candB = personalizedFeatureExtractor.extractCandidateFeatures(
      { canonicalId: 'cheap-phone', brand: 'generic', storage: '64gb', ram: '4gb' },
      15000,
      50
    );
    const evalB = personalizedFeatureExtractor.evaluatePreferences(candB, preferences, target);
    const scoreB = personalizedScorer.calculateScore(evalB);

    assert.ok(
      scoreA.personalizedScore > scoreB.personalizedScore,
      `Expected Candidate A (${scoreA.personalizedScore}) > Candidate B (${scoreB.personalizedScore})`
    );
  });

  // --- 7. Overall Score Boundaries & Determinism ---
  console.log('\n--- 7. Score Boundaries & Determinism ---');
  test('Personalized score is strictly bounded in [0, 100] across arbitrary extremes', () => {
    const maxEval = {
      budget: { hasPreference: true, ratio: 1.0 },
      storage: { hasPreference: true, ratio: 1.0 },
      ram: { hasPreference: true, ratio: 1.0 },
      priorities: { hasPreference: true, compositeRatio: 1.0 },
      brand: { hasPreference: true, ratio: 1.0 },
      dealScore: 100,
    };
    const minEval = {
      budget: { hasPreference: true, ratio: 0.0 },
      storage: { hasPreference: true, ratio: 0.0 },
      ram: { hasPreference: true, ratio: 0.0 },
      priorities: { hasPreference: true, compositeRatio: 0.0 },
      brand: { hasPreference: true, ratio: 0.0 },
      dealScore: 0,
    };

    const maxScore = personalizedScorer.calculateScore(maxEval);
    const minScore = personalizedScorer.calculateScore(minEval);

    assert.strictEqual(maxScore.personalizedScore, 100);
    assert.strictEqual(minScore.personalizedScore, 0);
  });

  // --- 8. Reason Generator Accuracy ---
  console.log('\n--- 8. Reason Generator Accuracy ---');
  test('Generates truthful natural language explanations from actual evaluation facts', () => {
    const cand = { canonicalTitle: 'Galaxy S25', brand: 'samsung', storageGB: 256, ramGB: 12, effectivePrice: 74999, dealScore: 88 };
    const preferences = { maxBudget: 80000, minStorage: 128, minRam: 8, preferredBrands: ['samsung'] };
    const evalData = personalizedFeatureExtractor.evaluatePreferences(cand, preferences, {});
    const scoreResult = personalizedScorer.calculateScore(evalData);
    const reasons = personalizedReasonGenerator.generateReasons(cand, preferences, evalData, scoreResult);

    assert.ok(reasons.some((r) => r.includes('Within your budget of ₹80,000')));
    assert.ok(reasons.some((r) => r.includes('Offers 256GB storage, fulfilling your minimum requirement')));
    assert.ok(reasons.some((r) => r.includes('Matches your preferred brand list (Samsung)')));
    assert.ok(reasons.some((r) => r.includes('Strong marketplace deal quality score (88/100)')));
  });

  // --- 9. Anti-Hardcoding Audit ---
  console.log('\n--- 9. Anti-Hardcoding Verification ---');
  test('No product-specific names are hardcoded in production personalization files', () => {
    const scorerCode = readFileSync(join(__dirname, '../personalized.scorer.js'), 'utf8');
    const serviceCode = readFileSync(join(__dirname, '../personalized.service.js'), 'utf8');
    const constantsCode = readFileSync(join(__dirname, '../personalized.constants.js'), 'utf8');

    const productPattern = /\b(iphone|galaxy|macbook|sony|airpods|pixel)\b/i;
    assert.strictEqual(productPattern.test(scorerCode), false, 'Scorer contains hardcoded product names');
    assert.strictEqual(productPattern.test(serviceCode), false, 'Service contains hardcoded product names');
    assert.strictEqual(productPattern.test(constantsCode), false, 'Constants contains hardcoded product names');
  });

  // --- 10. Real MongoDB Database Integration Tests ---
  console.log('\n--- 10. Real MongoDB Integration Tests ---');
  await asyncTest('Real MongoDB query with full user preferences', async () => {
    await database.connect();
    const res = await personalizedService.getPersonalizedRecommendations('apple-iphone-16-128gb-black', {
      maxBudget: 80000,
      minStorage: 128,
      minRam: 8,
      preferredBrands: ['samsung', 'apple'],
      priorities: { price: 0.4, storage: 0.3, performance: 0.2, brand: 0.1 },
    });

    assert.ok(res);
    assert.strictEqual(res.targetProduct.canonicalId, 'apple-iphone-16-128gb-black');
    assert.ok(Array.isArray(res.recommendations));
    // Verify target product is not in recommendations (self-recommendation prevention)
    assert.ok(!res.recommendations.some((r) => r.canonicalId === 'apple-iphone-16-128gb-black'));
    assert.strictEqual(res.metadata.deterministic, true);
    assert.strictEqual(res.metadata.algorithm, 'preference-aware-content-ranking');
  });

  await asyncTest('Real MongoDB query with empty preferences ({})', async () => {
    const res = await personalizedService.getPersonalizedRecommendations('apple-iphone-16-128gb-black', {});
    assert.ok(res);
    assert.ok(Array.isArray(res.recommendations));
  });

  await asyncTest('Real MongoDB query for non-existent product throws 404', async () => {
    try {
      await personalizedService.getPersonalizedRecommendations('fake-non-existent-product-id');
      assert.fail('Should have thrown PRODUCT_NOT_FOUND error');
    } catch (err) {
      assert.strictEqual(err.code, 'PRODUCT_NOT_FOUND');
      assert.strictEqual(err.statusCode, 404);
    }
  });

  await database.close();

  console.log('\n====================================================');
  console.log(`PHASE 8.3 TEST SUMMARY: ${passed}/${passed + failed} Passed (${failed} Failed)`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
