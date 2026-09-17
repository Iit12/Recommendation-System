/**
 * Phase 5 Comprehensive MongoDB Persistence Test Suite
 * Validates real MongoDB operations (Scenarios A through P) against `smart_shopping`.
 */

import { database, initDatabase, productRepository, listingRepository, priceHistoryRepository } from '../index.js';
import { pricePersistenceService } from '../../services/pricePersistence.service.js';

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

async function runPhase5Tests() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 5 MONGODB PERSISTENCE TEST SUITE');
  console.log('====================================================\n');

  try {
    // Scenario A: MongoDB Connection
    console.log('--- A. MongoDB Connection ---');
    const db = await database.connect();
    const isPing = await database.ping();
    assert(Boolean(db) && isPing, 'Successfully connected to MongoDB server and pinged DB');

    // Scenario B: Database Initialization & Indexes
    console.log('\n--- B. Database Initialization & Indexes ---');
    await initDatabase();
    const productIndexes = await db.collection('products').indexes();
    const listingIndexes = await db.collection('listings').indexes();
    const priceIndexes = await db.collection('price_history').indexes();

    assert(
      productIndexes.some((i) => i.name === 'idx_products_canonicalId_unique'),
      'Product unique canonicalId index exists'
    );
    assert(
      listingIndexes.some((i) => i.name === 'idx_listings_platform_url_unique'),
      'Listing unique (platform, productUrl) compound index exists'
    );
    assert(
      priceIndexes.some((i) => i.name === 'idx_price_history_productId_collectedAt'),
      'Price history (productId, collectedAt) compound index exists'
    );

    // Scenario C: Product Creation
    console.log('\n--- C. Product Creation ---');
    const testCanonicalId = 'test-product-iphone-16-128gb-black';
    // Clean up test document if existed
    await db.collection('products').deleteOne({ canonicalId: testCanonicalId });

    const createdProduct = await productRepository.upsertProduct({
      canonicalId: testCanonicalId,
      canonicalTitle: 'Apple iPhone 16 (128GB, Black)',
      brand: 'apple',
      model: 'iphone 16',
      storage: '128gb',
      ram: null,
      color: 'black',
      variant: null,
    });
    assert(
      createdProduct && createdProduct.canonicalId === testCanonicalId && createdProduct.brand === 'apple',
      'Canonical product created successfully in MongoDB',
      JSON.stringify(createdProduct)
    );

    // Scenario D: Product Upsert / Duplicate Prevention
    console.log('\n--- D. Product Upsert / Duplicate Prevention ---');
    const initialProductCount = await productRepository.count();
    await productRepository.upsertProduct({
      canonicalId: testCanonicalId,
      canonicalTitle: 'Apple iPhone 16 (128GB, Black) - Updated Edition',
      brand: 'apple',
      model: 'iphone 16',
      storage: '128gb',
      color: 'black',
    });
    const updatedProduct = await productRepository.findByCanonicalId(testCanonicalId);
    const postUpsertCount = await productRepository.count();

    assert(
      postUpsertCount === initialProductCount,
      'Upserting same canonicalId does NOT create duplicate product documents'
    );
    assert(
      updatedProduct.canonicalTitle.includes('Updated Edition') && Boolean(updatedProduct.updatedAt),
      'Product updated fields and updatedAt timestamp properly'
    );

    // Scenario E: Listing Creation
    console.log('\n--- E. Listing Creation ---');
    const testUrl = 'https://www.amazon.in/dp/B0DGJ6TEST16';
    await db.collection('listings').deleteOne({ platform: 'Amazon', productUrl: testUrl });

    const createdListing = await listingRepository.upsertListing({
      productId: testCanonicalId,
      platform: 'Amazon',
      storeId: 'amazon',
      listingTitle: 'Apple iPhone 16 (128 GB) - Black',
      productUrl: testUrl,
      sellerName: 'Appario Retail Pvt Ltd',
      sellerRating: 4.9,
    });
    assert(
      createdListing && createdListing.listingId && createdListing.productId === testCanonicalId,
      'Listing record created with deterministic listingId and product reference',
      JSON.stringify(createdListing)
    );

    // Scenario F: Listing Duplicate Prevention
    console.log('\n--- F. Listing Duplicate Prevention ---');
    const initialListingCount = await listingRepository.count();
    await listingRepository.upsertListing({
      productId: testCanonicalId,
      platform: 'Amazon',
      storeId: 'amazon',
      listingTitle: 'Apple iPhone 16 (128 GB) - Black (Revised Title)',
      productUrl: testUrl,
      sellerName: 'Appario Retail Pvt Ltd',
      sellerRating: 4.9,
    });
    const postListingCount = await listingRepository.count();
    assert(
      postListingCount === initialListingCount,
      'Duplicate (platform, productUrl) upsert does NOT create duplicate listing documents'
    );

    // Scenario G: Price Observation Insertion
    console.log('\n--- G. Price Observation Insertion ---');
    const obsDay1 = {
      productId: testCanonicalId,
      listingId: createdListing.listingId,
      platform: 'Amazon',
      price: 70999,
      originalPrice: 79900,
      discount: 11,
      deliveryCharge: 0,
      effectivePrice: 70999,
      currency: 'INR',
      inStock: true,
      deliveryText: 'Free One-Day Prime Delivery',
      collectedAt: '2026-09-15T10:00:00.000Z',
    };
    const savedObs1 = await priceHistoryRepository.insertObservation(obsDay1);
    assert(Boolean(savedObs1?._id), 'Price observation document inserted successfully with _id');

    // Scenario H: Multiple Historical Observations (Append-Only Principle)
    console.log('\n--- H. Multiple Historical Observations (Append-Only Preservation) ---');
    const obsDay2 = {
      ...obsDay1,
      price: 69499,
      effectivePrice: 69499,
      collectedAt: '2026-09-16T10:00:00.000Z',
    };
    const obsDay3 = {
      ...obsDay1,
      price: 68999,
      effectivePrice: 68999,
      collectedAt: '2026-09-17T10:00:00.000Z',
    };
    await priceHistoryRepository.insertObservation(obsDay2);
    await priceHistoryRepository.insertObservation(obsDay3);

    const historyTimeline = await priceHistoryRepository.findByProductId(testCanonicalId, { sort: 'asc' });
    assert(
      historyTimeline.length >= 3,
      `All 3 historical price observations preserved (Got: ${historyTimeline.length})`
    );
    assert(
      historyTimeline[0].price === 70999 &&
      historyTimeline[1].price === 69499 &&
      historyTimeline[2].price === 68999,
      'Historical price progression intact: Day 1 ₹70,999 -> Day 2 ₹69,499 -> Day 3 ₹68,999 (Append-Only confirmed)'
    );

    // Scenario I: Latest Price Retrieval
    console.log('\n--- I. Latest Price Retrieval ---');
    // Add flipkart observation
    const flipkartListing = await listingRepository.upsertListing({
      productId: testCanonicalId,
      platform: 'Flipkart',
      productUrl: 'https://flipkart.com/itm16test',
    });
    await priceHistoryRepository.insertObservation({
      productId: testCanonicalId,
      listingId: flipkartListing.listingId,
      platform: 'Flipkart',
      price: 67999,
      effectivePrice: 67999,
      collectedAt: '2026-09-17T11:00:00.000Z',
    });

    const latestPrices = await priceHistoryRepository.getLatestPricesByProductId(testCanonicalId);
    assert(
      latestPrices.length === 2,
      `Latest price retrieved for both Amazon and Flipkart (Count: ${latestPrices.length})`
    );
    const amazonLatest = latestPrices.find((p) => p.platform === 'Amazon');
    assert(
      amazonLatest?.price === 68999,
      `Amazon latest price is ₹68,999 (Day 3 observation)`
    );

    // Scenario J: Date-Range Retrieval
    console.log('\n--- J. Date-Range Retrieval ---');
    const rangeResult = await priceHistoryRepository.findByProductId(testCanonicalId, {
      fromDate: '2026-09-15',
      toDate: '2026-09-16',
    });
    assert(
      rangeResult.length === 2,
      `Date range query (Sept 15-16) returned exactly 2 observations (Got: ${rangeResult.length})`
    );

    // Scenario K: Historical Summary
    console.log('\n--- K. Historical Summary ---');
    const summary = await priceHistoryRepository.getProductSummary(testCanonicalId);
    assert(
      summary.lowestPrice === 67999 && summary.highestPrice === 70999 && summary.observationCount >= 4,
      `Summary statistics calculated correctly: Lowest ₹${summary?.lowestPrice}, Highest ₹${summary?.highestPrice}, Observations: ${summary?.observationCount}`
    );

    // Scenario L: Duplicate Collection Event Deduplication
    console.log('\n--- L. Duplicate Collection Event Deduplication ---');
    const countBeforeDup = await priceHistoryRepository.count();
    // Insert exact same observation again
    const dupResult = await priceHistoryRepository.insertObservation(obsDay1);
    const countAfterDup = await priceHistoryRepository.count();
    assert(
      dupResult === null && countAfterDup === countBeforeDup,
      'Duplicate observation during identical collection event is safely deduplicated'
    );

    // Scenario M: Invalid Price Validation
    console.log('\n--- M. Invalid Price Validation Rejection ---');
    let rejectedPrice = false;
    try {
      priceHistoryRepository.validateObservation({
        productId: testCanonicalId,
        platform: 'Amazon',
        price: -500,
        collectedAt: '2026-09-17T10:00:00.000Z',
      });
    } catch (e) {
      rejectedPrice = true;
    }
    assert(rejectedPrice, 'Negative price successfully rejected by data validator');

    // Scenario N: Invalid Date Validation
    console.log('\n--- N. Invalid Date Validation Rejection ---');
    let rejectedDate = false;
    try {
      priceHistoryRepository.validateObservation({
        productId: testCanonicalId,
        platform: 'Amazon',
        price: 70999,
        collectedAt: 'not-a-date',
      });
    } catch (e) {
      rejectedDate = true;
    }
    assert(rejectedDate, 'Malformed date string successfully rejected by data validator');

    // Scenario O: Non-Existent Product Handling
    console.log('\n--- O. Non-Existent Product Handling ---');
    const nonExistent = await productRepository.findByCanonicalId('non-existent-product-id-12345');
    const nonExistentSummary = await priceHistoryRepository.getProductSummary('non-existent-product-id-12345');
    assert(
      nonExistent === null && nonExistentSummary === null,
      'Non-existent product queries return null safely without throwing'
    );

    // Scenario P: Full Phase 3 -> Phase 4 -> Phase 5 Persistence Pipeline
    console.log('\n--- P. Full Phase 3 -> Phase 4 -> Phase 5 Persistence Pipeline ---');
    const pipelineResult = await pricePersistenceService.collectAndPersist('iphone 16');
    assert(
      pipelineResult.totalCanonicalProducts >= 1 &&
      pipelineResult.productsUpserted >= 1 &&
      pipelineResult.observationsSaved >= 1,
      `Full pipeline executed: ${pipelineResult.productsUpserted} products, ${pipelineResult.listingsUpserted} listings, ${pipelineResult.observationsSaved} observations saved`
    );

    // Clean up test records
    await db.collection('products').deleteOne({ canonicalId: testCanonicalId });
    await db.collection('listings').deleteMany({ productId: testCanonicalId });
    await db.collection('price_history').deleteMany({ productId: testCanonicalId });

  } catch (error) {
    console.error('Test execution error:', error);
    failedTests++;
  }

  console.log('\n====================================================');
  console.log(`PHASE 5 TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('====================================================\n');

  await database.close();

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase5Tests();
