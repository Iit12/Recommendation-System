/**
 * Phase 6 Comprehensive Trend Analysis Test Suite
 * Validates deterministic trend calculations, volatility metrics, validator logic, and MongoDB integration.
 */

import { trendValidator } from '../trend.validator.js';
import { trendCalculator, TREND_CLASSIFICATIONS } from '../trend.calculator.js';
import { trendAnalysisService } from '../trend.service.js';
import { database } from '../../database/connection.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
    if (details) console.error(`     Details: ${details}`);
  }
}

async function runTrendTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 6 TREND ANALYSIS TEST SUITE');
  console.log('====================================================\n');

  // Scenario A: Increasing prices (50000 -> 52000 -> 55000)
  console.log('--- A. Increasing Prices ---');
  const obsA = [
    { price: 50000, collectedAt: '2026-09-01T10:00:00.000Z' },
    { price: 52000, collectedAt: '2026-09-02T10:00:00.000Z' },
    { price: 55000, collectedAt: '2026-09-03T10:00:00.000Z' },
  ];
  const resA = trendCalculator.calculate(obsA);
  assert(
    resA.trend === TREND_CLASSIFICATIONS.INCREASING && resA.priceChange === 5000 && resA.percentageChange === 10,
    `Trend classified as INCREASING (+10%, change: +₹5,000)`,
    JSON.stringify(resA)
  );

  // Scenario B: Decreasing prices (70000 -> 68000 -> 65000)
  console.log('\n--- B. Decreasing Prices ---');
  const obsB = [
    { price: 70000, collectedAt: '2026-09-01T10:00:00.000Z' },
    { price: 68000, collectedAt: '2026-09-02T10:00:00.000Z' },
    { price: 65000, collectedAt: '2026-09-03T10:00:00.000Z' },
  ];
  const resB = trendCalculator.calculate(obsB);
  assert(
    resB.trend === TREND_CLASSIFICATIONS.DECREASING && resB.priceChange === -5000 && resB.percentageChange === -7.1429,
    `Trend classified as DECREASING (-7.1429%, change: -₹5,000)`,
    JSON.stringify(resB)
  );

  // Scenario C: Stable prices (70000 -> 70050 -> 69950)
  console.log('\n--- C. Stable Prices ---');
  const obsC = [
    { price: 70000, collectedAt: '2026-09-01T10:00:00.000Z' },
    { price: 70050, collectedAt: '2026-09-02T10:00:00.000Z' },
    { price: 69950, collectedAt: '2026-09-03T10:00:00.000Z' },
  ];
  const resC = trendCalculator.calculate(obsC);
  assert(
    resC.trend === TREND_CLASSIFICATIONS.STABLE && Math.abs(resC.percentageChange) < 1.0,
    `Trend classified as STABLE (percentageChange: ${resC.percentageChange}%)`,
    JSON.stringify(resC)
  );

  // Scenario D: Exactly one observation
  console.log('\n--- D. Exactly One Observation ---');
  const obsD = [{ price: 70000, collectedAt: '2026-09-01T10:00:00.000Z', inStock: true }];
  const resD = trendCalculator.calculate(obsD);
  assert(
    resD.trend === TREND_CLASSIFICATIONS.INSUFFICIENT_DATA && resD.currentPrice === 70000 && resD.observationCount === 1,
    `Single observation classified as INSUFFICIENT_DATA with currentPrice=70000`,
    JSON.stringify(resD)
  );

  // Scenario E: Empty observations
  console.log('\n--- E. Empty Observations ---');
  const resE = trendCalculator.calculate([]);
  assert(
    resE.trend === TREND_CLASSIFICATIONS.NO_DATA && resE.currentPrice === null && resE.observationCount === 0,
    `Zero observations classified as NO_DATA`,
    JSON.stringify(resE)
  );

  // Scenario F: Percentage change calculation (70000 -> 68000)
  console.log('\n--- F. Percentage Change Accuracy ---');
  const obsF = [
    { price: 70000, collectedAt: '2026-09-01T10:00:00.000Z' },
    { price: 68000, collectedAt: '2026-09-02T10:00:00.000Z' },
  ];
  const resF = trendCalculator.calculate(obsF);
  const expectedPct = Number((((68000 - 70000) / 70000) * 100).toFixed(4));
  assert(
    resF.percentageChange === expectedPct && resF.percentageChange === -2.8571,
    `Percentage change matches expected formula: ${resF.percentageChange}% (expected: -2.8571%)`,
    JSON.stringify(resF)
  );

  // Scenario G: Known dataset verification (Lowest, Highest, Average, Volatility)
  console.log('\n--- G. Known Dataset Verification ---');
  const obsG = [
    { price: 100, collectedAt: '2026-09-01T10:00:00.000Z' },
    { price: 200, collectedAt: '2026-09-02T10:00:00.000Z' },
    { price: 300, collectedAt: '2026-09-03T10:00:00.000Z' },
    { price: 400, collectedAt: '2026-09-04T10:00:00.000Z' },
    { price: 500, collectedAt: '2026-09-05T10:00:00.000Z' },
  ];
  const resG = trendCalculator.calculate(obsG);
  assert(
    resG.lowestPrice === 100 &&
    resG.highestPrice === 500 &&
    resG.averagePrice === 300 &&
    resG.volatility.standardDeviation === 141.42 &&
    resG.volatility.coefficientOfVariation === 47.1405,
    `Dataset metrics exact: Min: ${resG.lowestPrice}, Max: ${resG.highestPrice}, Avg: ${resG.averagePrice}, StdDev: ${resG.volatility.standardDeviation}, CV: ${resG.volatility.coefficientOfVariation}%`,
    JSON.stringify(resG)
  );

  // Scenario H: Zero first price
  console.log('\n--- H. Zero First Price Protection ---');
  const obsH = [
    { price: 0, collectedAt: '2026-09-01T10:00:00.000Z' },
    { price: 500, collectedAt: '2026-09-02T10:00:00.000Z' },
  ];
  const resH = trendCalculator.calculate(obsH);
  assert(
    !isNaN(resH.percentageChange) && isFinite(resH.percentageChange) && resH.percentageChange === 0,
    `Zero initial price handled safely without NaN/Infinity (Got: ${resH.percentageChange})`
  );

  // Scenario I: Invalid price values
  console.log('\n--- I. Invalid Price Filtering ---');
  const rawI = [
    { price: 70000, collectedAt: '2026-09-01T10:00:00.000Z' },
    { price: -500, collectedAt: '2026-09-02T10:00:00.000Z' },
    { price: NaN, collectedAt: '2026-09-03T10:00:00.000Z' },
    { price: Infinity, collectedAt: '2026-09-04T10:00:00.000Z' },
    { price: 'abc', collectedAt: '2026-09-05T10:00:00.000Z' },
    { price: 68000, collectedAt: '2026-09-06T10:00:00.000Z' },
  ];
  const { validObservations: valI, invalidCount: invI } = trendValidator.filterObservations(rawI);
  const resI = trendCalculator.calculate(valI, invI);
  assert(
    valI.length === 2 && invI === 4 && resI.invalidObservationCount === 4 && resI.observationCount === 2,
    `Filtered 4 invalid price observations safely, calculated trend on remaining 2 valid points`,
    JSON.stringify(resI)
  );

  // Scenario J: Invalid collectedAt dates
  console.log('\n--- J. Invalid Date Filtering ---');
  const rawJ = [
    { price: 70000, collectedAt: 'invalid-date-string' },
    { price: 69000, collectedAt: null },
    { price: 68000, collectedAt: '2026-09-01T10:00:00.000Z' },
  ];
  const { validObservations: valJ, invalidCount: invJ } = trendValidator.filterObservations(rawJ);
  assert(
    valJ.length === 1 && invJ === 2,
    `Filtered 2 invalid date records safely (Valid: ${valJ.length}, Invalid: ${invJ})`
  );

  // Scenario K: Date Range Validation
  console.log('\n--- K. Date Range Validation (Normal) ---');
  const dateK = trendValidator.validateDateRange('2026-09-01', '2026-09-18');
  assert(
    dateK.valid === true && Boolean(dateK.fromIso) && Boolean(dateK.toIso),
    `Valid date range accepted: from ${dateK.fromIso} to ${dateK.toIso}`
  );

  // Scenario L: Date Range Error (from > to)
  console.log('\n--- L. Date Range Error (from > to) ---');
  const dateL = trendValidator.validateDateRange('2026-09-20', '2026-09-10');
  assert(
    dateL.valid === false && dateL.error.includes('cannot be later than'),
    `Rejected invalid date order (from > to) with clear message: "${dateL.error}"`
  );

  // Scenario M: Platform separation
  console.log('\n--- M. Platform Separation ---');
  const rawM = [
    { platform: 'Amazon', price: 70000, collectedAt: '2026-09-01T10:00:00.000Z' },
    { platform: 'Amazon', price: 72000, collectedAt: '2026-09-02T10:00:00.000Z' },
    { platform: 'Flipkart', price: 68000, collectedAt: '2026-09-01T10:00:00.000Z' },
    { platform: 'Flipkart', price: 65000, collectedAt: '2026-09-02T10:00:00.000Z' },
  ];
  const amazonObs = rawM.filter((o) => o.platform === 'Amazon');
  const flipkartObs = rawM.filter((o) => o.platform === 'Flipkart');
  const resAmazon = trendCalculator.calculate(amazonObs);
  const resFlipkart = trendCalculator.calculate(flipkartObs);
  assert(
    resAmazon.trend === TREND_CLASSIFICATIONS.INCREASING && resFlipkart.trend === TREND_CLASSIFICATIONS.DECREASING,
    `Amazon trend is INCREASING (+₹2,000) while Flipkart trend is DECREASING (-₹3,000) in isolated separation`
  );

  // Scenario N: Out-of-stock historical observations
  console.log('\n--- N. Out-of-Stock Handling ---');
  const obsN = [
    { price: 70000, collectedAt: '2026-09-01T10:00:00.000Z', inStock: true },
    { price: 68000, collectedAt: '2026-09-02T10:00:00.000Z', inStock: false },
    { price: 65000, collectedAt: '2026-09-03T10:00:00.000Z', inStock: false },
  ];
  const resN = trendCalculator.calculate(obsN);
  assert(
    resN.trend === TREND_CLASSIFICATIONS.DECREASING &&
    resN.lowestPrice === 65000 &&
    resN.latestInStock === false,
    `Historical prices computed accurately while latestInStock is reported as false`,
    JSON.stringify(resN)
  );

  // Scenario O: Constant prices
  console.log('\n--- O. Constant Prices ---');
  const obsO = [
    { price: 10000, collectedAt: '2026-09-01T10:00:00.000Z' },
    { price: 10000, collectedAt: '2026-09-02T10:00:00.000Z' },
    { price: 10000, collectedAt: '2026-09-03T10:00:00.000Z' },
  ];
  const resO = trendCalculator.calculate(obsO);
  assert(
    resO.trend === TREND_CLASSIFICATIONS.STABLE &&
    resO.percentageChange === 0 &&
    resO.volatility.standardDeviation === 0 &&
    resO.volatility.coefficientOfVariation === 0,
    `Constant prices result in STABLE, 0% change, 0 stdDev, 0 CV`,
    JSON.stringify(resO)
  );

  // MongoDB Integration Tests against real smart_shopping database
  console.log('\n--- Real MongoDB Database Integration Tests ---');
  try {
    await database.connect();

    // 1. Overall product trend
    const dbTrend = await trendAnalysisService.getHistoricalTrend('apple-iphone-16-128gb-black');
    assert(
      dbTrend.productId === 'apple-iphone-16-128gb-black' &&
      typeof dbTrend.currentPrice === 'number' &&
      dbTrend.observationCount >= 6,
      `Real MongoDB query for iPhone 16 returned trend: ${dbTrend.trend} (Obs count: ${dbTrend.observationCount}, Current Price: ₹${dbTrend.currentPrice})`
    );

    // 2. Platform-segmented trend
    const platformTrend = await trendAnalysisService.getPlatformTrends('apple-iphone-16-128gb-black');
    assert(
      platformTrend.platformsCount >= 4 &&
      Boolean(platformTrend.platforms?.Amazon) &&
      Boolean(platformTrend.platforms?.Flipkart),
      `Real MongoDB platform segmentation returned ${platformTrend.platformsCount} platforms (Amazon, Flipkart, Croma, etc.)`
    );

    // 3. Date-range filtered trend
    const filteredDbTrend = await trendAnalysisService.getHistoricalTrend('apple-iphone-16-128gb-black', {
      from: '2026-01-01',
      to: '2026-12-31',
    });
    assert(
      filteredDbTrend.observationCount >= 6 && filteredDbTrend.filter.from === '2026-01-01',
      `Date range query on MongoDB returned ${filteredDbTrend.observationCount} observations`
    );

    // 4. Non-existent product handling
    let nonExistentThrown = false;
    try {
      await trendAnalysisService.getHistoricalTrend('completely-fake-product-id');
    } catch (e) {
      nonExistentThrown = e.code === 'PRODUCT_NOT_FOUND' && e.statusCode === 404;
    }
    assert(
      nonExistentThrown,
      'Non-existent product properly throws 404 PRODUCT_NOT_FOUND'
    );

    await database.close();
  } catch (dbErr) {
    console.error('MongoDB integration test error:', dbErr);
    failedTests++;
  }

  console.log('\n====================================================');
  console.log(`PHASE 6 TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTrendTests();
