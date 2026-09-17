/**
 * Phase 4 Deterministic Matching Test Suite Runner
 * Runs all mandatory test scenarios (A through H) and validates expected matching decisions.
 */

import { textNormalizer } from '../textNormalizer.js';
import { attributeExtractor } from '../attributeExtractor.js';
import { similarity } from '../similarity.js';
import { matchScorer } from '../matchScorer.js';
import { productGrouper } from '../productGrouper.js';
import { matchingService } from '../matching.service.js';
import { MATCHING_TEST_CASES } from '../testData/matching.testData.js';

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

console.log('====================================================');
console.log('🚀 RUNNING PHASE 4 DETERMINISTIC MATCHING TEST SUITE');
console.log('====================================================\n');

// 1. Text Normalization Unit Tests
console.log('--- 1. Text Normalization Tests ---');
const norm1 = textNormalizer.normalize('Apple iPhone 16 (128 GB) - Black');
assert(
  norm1.includes('128gb') && norm1.includes('iphone 16') && norm1.includes('black'),
  'Normalizes "128 GB" to "128gb" and cleans punctuation',
  `Result: "${norm1}"`
);

const norm2 = textNormalizer.normalize('Apple iPhone 16 128GB Black');
assert(
  norm1 === norm2,
  'Ensures identical normalized strings for "128 GB" and "128GB"',
  `norm1: "${norm1}" vs norm2: "${norm2}"`
);

assert(
  textNormalizer.normalize('') === '',
  'Handles empty string gracefully'
);

assert(
  textNormalizer.normalize(null) === '',
  'Handles null input gracefully'
);

// 2. Attribute Extraction Unit Tests
console.log('\n--- 2. Attribute Extraction Tests ---');
const extracted = attributeExtractor.extract('Apple iPhone 16 (128 GB) - Black');
assert(
  extracted.brand === 'apple' &&
  extracted.model === 'iphone 16' &&
  extracted.storage === '128gb' &&
  extracted.color === 'black',
  'Extracts brand, model, storage, and color from iPhone 16 listing',
  JSON.stringify(extracted)
);

const extractedMac = attributeExtractor.extract(
  'Apple 2025 MacBook Air Laptop with M4 chip: 13.6-inch Liquid Retina Display, 16GB, 256GB SSD, Midnight'
);
assert(
  extractedMac.brand === 'apple' &&
  extractedMac.model === 'macbook air m4' &&
  extractedMac.storage === '256gb' &&
  extractedMac.ram === '16gb' &&
  extractedMac.color === 'midnight',
  'Extracts MacBook Air specifications (M4 chip, 16GB RAM, 256GB SSD, Midnight)',
  JSON.stringify(extractedMac)
);

const extractedSony = attributeExtractor.extract(
  'Sony WH-1000XM5 Wireless Industry Leading ANC Headphones - Silver'
);
assert(
  extractedSony.brand === 'sony' &&
  extractedSony.model === 'wh-1000xm5' &&
  extractedSony.color === 'silver' &&
  extractedSony.variant?.includes('anc'),
  'Extracts Sony WH-1000XM5 attributes (brand, model, color, ANC variant)',
  JSON.stringify(extractedSony)
);

// 3. Text Similarity Unit Tests
console.log('\n--- 3. Text Similarity Tests ---');
const simHigh = similarity.calculate(
  'apple iphone 16 128gb black',
  'apple iphone 16 black 128gb'
);
assert(
  simHigh >= 0.90,
  'High similarity for reordered tokens (~1.0)',
  `Score: ${simHigh}`
);

const simLow = similarity.calculate(
  'apple iphone 16 128gb black',
  'apple iphone 16 pro 256gb black'
);
assert(
  simLow < simHigh,
  'Similarity for iPhone 16 128GB vs iPhone 16 Pro 256GB is substantially lower',
  `Score: ${simLow} vs ${simHigh}`
);

// 4. Scenario A: Same product, different title ordering
console.log('\n--- Scenario A: Same product, different title ordering ---');
const scoreA = matchScorer.score(MATCHING_TEST_CASES.caseA.titleA, MATCHING_TEST_CASES.caseA.titleB);
assert(
  scoreA.decision === 'MATCH',
  `Decision: ${scoreA.decision} (finalScore: ${scoreA.finalScore})`,
  JSON.stringify(scoreA)
);

// 5. Scenario B: Same product, formatting difference
console.log('\n--- Scenario B: Same product, formatting difference ---');
const scoreB = matchScorer.score(MATCHING_TEST_CASES.caseB.titleA, MATCHING_TEST_CASES.caseB.titleB);
assert(
  scoreB.decision === 'MATCH',
  `Decision: ${scoreB.decision} (finalScore: ${scoreB.finalScore})`,
  JSON.stringify(scoreB)
);

// 6. Scenario C: Different storage
console.log('\n--- Scenario C: Different storage (128GB vs 256GB) ---');
const scoreC = matchScorer.score(MATCHING_TEST_CASES.caseC.titleA, MATCHING_TEST_CASES.caseC.titleB);
assert(
  scoreC.decision === 'NOT_MATCH',
  `Decision: ${scoreC.decision} (Reason: ${scoreC.reason})`,
  JSON.stringify(scoreC)
);

// 7. Scenario D: Different model (iPhone 16 vs iPhone 16 Pro)
console.log('\n--- Scenario D: Different model (iPhone 16 vs iPhone 16 Pro) ---');
const scoreD = matchScorer.score(MATCHING_TEST_CASES.caseD.titleA, MATCHING_TEST_CASES.caseD.titleB);
assert(
  scoreD.decision === 'NOT_MATCH',
  `Decision: ${scoreD.decision} (Reason: ${scoreD.reason})`,
  JSON.stringify(scoreD)
);

// 8. Scenario E: Different color (Black vs Pink)
console.log('\n--- Scenario E: Different color (Black vs Pink) ---');
const scoreE = matchScorer.score(MATCHING_TEST_CASES.caseE.titleA, MATCHING_TEST_CASES.caseE.titleB);
assert(
  scoreE.decision === 'NOT_MATCH',
  `Decision: ${scoreE.decision} (Reason: ${scoreE.reason})`,
  JSON.stringify(scoreE)
);

// 9. Scenario F: Sony WH-1000XM5 cross-retailer titles
console.log('\n--- Scenario F: Sony WH-1000XM5 cross-retailer titles ---');
const scoreF = matchScorer.score(MATCHING_TEST_CASES.caseF.titleA, MATCHING_TEST_CASES.caseF.titleB);
assert(
  scoreF.decision === 'MATCH',
  `Decision: ${scoreF.decision} (finalScore: ${scoreF.finalScore})`,
  JSON.stringify(scoreF)
);

// 10. Scenario G: Multi-platform grouping
console.log('\n--- Scenario G: Multi-platform grouping ---');
const groupsG = productGrouper.groupListings(MATCHING_TEST_CASES.caseG.listings);
assert(
  groupsG.length === 1,
  `Group count is exactly 1 (got: ${groupsG.length})`,
  `Groups: ${JSON.stringify(groupsG.map(g => g.groupId))}`
);
assert(
  groupsG[0].totalListings === 6,
  `Group contains all 6 multi-platform listings (got: ${groupsG[0]?.totalListings})`,
  `Listings: ${groupsG[0]?.listings?.map(l => l.platform).join(', ')}`
);
assert(
  groupsG[0].priceSummary.bestPlatform === 'Flipkart' && groupsG[0].priceSummary.bestPrice === 68999,
  `Best price identified correctly as Flipkart @ ₹68,999 (got: ${groupsG[0]?.priceSummary?.bestPlatform} @ ₹${groupsG[0]?.priceSummary?.bestPrice})`
);
assert(
  groupsG[0].listings[0].productUrl && groupsG[0].listings[0].platform && groupsG[0].listings[0].sellerName,
  'Preserves all original Phase 3 listing metadata fields'
);

// 11. Multi-product heterogeneous grouping test
console.log('\n--- Multi-product heterogeneous grouping test ---');
const heterogeneousListings = [
  ...MATCHING_TEST_CASES.caseG.listings, // 6 iphone 16 128gb black
  {
    platform: 'Amazon',
    storeId: 'amazon',
    listingTitle: 'Apple iPhone 16 Pro 256GB Black',
    productUrl: 'https://amazon.in/dp/pro',
    price: 119900,
    deliveryCharge: 0,
    effectivePrice: 119900,
  },
  {
    platform: 'Amazon',
    storeId: 'amazon',
    listingTitle: 'Sony WH-1000XM5 Wireless Industry Leading ANC Headphones - Silver',
    productUrl: 'https://amazon.in/dp/sony',
    price: 24990,
    deliveryCharge: 0,
    effectivePrice: 24990,
  }
];

const hetGroups = productGrouper.groupListings(heterogeneousListings);
assert(
  hetGroups.length === 3,
  `Separates 3 distinct products into 3 canonical groups (got: ${hetGroups.length})`,
  `Groups: ${JSON.stringify(hetGroups.map(g => g.groupId))}`
);

// 12. End-to-End matching service pipeline test
console.log('\n--- 12. Matching Service Pipeline E2E Test ---');
const pipelineResult = await matchingService.searchAndGroup('iphone 16');
assert(
  pipelineResult.totalListings === 6 && pipelineResult.totalProductGroups === 1,
  `Pipeline groups 6 Phase 3 listings of iPhone 16 into 1 canonical group`,
  `Total listings: ${pipelineResult.totalListings}, Groups: ${pipelineResult.totalProductGroups}`
);

const sonyResult = await matchingService.searchAndGroup('sony');
assert(
  sonyResult.totalListings >= 4 && sonyResult.totalProductGroups >= 1,
  `Pipeline groups Sony headphone listings successfully`,
  `Total listings: ${sonyResult.totalListings}, Groups: ${sonyResult.totalProductGroups}`
);

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('====================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
