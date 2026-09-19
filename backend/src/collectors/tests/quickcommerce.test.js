/**
 * QuickCommerce Live Adapter Unit & Integration Test Suite (Phase 8.5.2)
 * 
 * Uses realistic fixture responses to verify all behaviors deterministically
 * without burning live API credits or exposing real secrets.
 */

import { QuickCommerceLiveAdapter, QUICKCOMMERCE_SUPPORTED_PLATFORMS } from '../adapters/quickcommerce.liveAdapter.js';
import { SOURCE_STATUS, SOURCE_TYPES } from '../adapters/liveSource.adapter.js';
import { LiveSourceManager } from '../liveSourceManager.js';
import app from '../../app.js';
import http from 'http';

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

// Fixture 1: Realistic QuickCommerce /v1/groupsearch response
const QUICKCOMMERCE_GROUPSEARCH_FIXTURE = {
  status: 'success',
  request_id: 'req_test_abc123',
  credits_remaining: 50,
  data: {
    query: 'iphone 16',
    platforms: ['BlinkIt', 'Zepto', 'Swiggy', 'Flipkart'],
    lat: 12.9021,
    lon: 77.6639,
    results: {
      BlinkIt: [
        {
          name: 'Apple iPhone 16 (128GB, Black)',
          offer_price: 72999,
          mrp: 79900,
          in_stock: true,
          platform_sla: '10 mins',
          deeplink: 'https://blinkit.com/prn/apple-iphone-16-128gb-black/prid/598212',
          merchant: 'Blinkit Superstore',
          ratings: 4.8,
        },
      ],
      Zepto: [
        {
          name: 'iPhone 16 128 GB (Black)',
          offer_price: 73499,
          mrp: 79900,
          in_stock: true,
          platform_sla: '12 mins',
          deeplink: 'https://www.zeptonow.com/pn/iphone-16-128-gb-black-edition/pvid/791823',
          brand: 'Apple',
        },
      ],
      Swiggy: [
        {
          name: 'Apple iPhone 16 - 128GB Black',
          offer_price: 73999,
          mrp: 79900,
          in_stock: false,
          platform_sla: '15 mins',
          deeplink: 'https://www.swiggy.com/instamart/item/apple-iphone-16-black-128gb/iid/901284',
        },
      ],
      Flipkart: [
        {
          name: 'Apple iPhone 16 (Black, 128 GB)',
          offer_price: 68999,
          mrp: 79900,
          in_stock: true,
          deeplink: 'https://www.flipkart.com/apple-iphone-16-black-128-gb/p/itm16blk128',
        },
      ],
    },
  },
};

// Fixture 2: Realistic Single Platform /v1/search response
const QUICKCOMMERCE_SINGLE_SEARCH_FIXTURE = {
  status: 'success',
  data: {
    total_results: 1,
    products: [
      {
        name: 'Apple iPhone 16 (128GB) - Black',
        offer_price: 70999,
        mrp: 79900,
        in_stock: true,
        deeplink: 'https://www.amazon.in/dp/B0DGJ6SDF8',
        brand: 'Apple',
        ratings: 4.9,
      },
    ],
  },
};

async function runQuickCommerceTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 8.5.2 QUICKCOMMERCE LIVE ADAPTER TEST SUITE');
  console.log('====================================================\n');

  // --- 1. Contract & Configuration Tests ---
  console.log('--- 1. Contract & Configuration Tests ---');

  const unconfigured = new QuickCommerceLiveAdapter({ apiKey: null });
  assert(unconfigured.getSourceName() === 'quickcommerce', 'getSourceName() returns "quickcommerce"');
  assert(unconfigured.getSourceType() === SOURCE_TYPES.API, 'getSourceType() returns "API"');
  assert(unconfigured.isConfigured() === false, 'isConfigured() returns false when apiKey is null');

  const unconfiguredHealth = await unconfigured.healthCheck();
  assert(
    unconfiguredHealth.configured === false && unconfiguredHealth.status === SOURCE_STATUS.NOT_CONFIGURED,
    'healthCheck() returns NOT_CONFIGURED when unconfigured'
  );

  const unconfiguredSearch = await unconfigured.search('iphone 16', { lat: 12.9021, lon: 77.6639 });
  assert(
    unconfiguredSearch.status === SOURCE_STATUS.NOT_CONFIGURED && unconfiguredSearch.results.length === 0,
    'search() returns NOT_CONFIGURED without throwing when apiKey is missing'
  );

  const configured = new QuickCommerceLiveAdapter({
    apiKey: 'dummy_qc_key_1234567890',
  });
  assert(configured.isConfigured() === true, 'isConfigured() returns true when apiKey is present');

  const configuredHealth = await configured.healthCheck();
  assert(
    configuredHealth.configured === true && configuredHealth.status === SOURCE_STATUS.READY,
    'healthCheck() returns READY when configured'
  );

  // --- 2. Location Validation Tests ---
  console.log('\n--- 2. Location Validation Tests ---');

  const missingLoc = await configured.search('iphone 16');
  assert(
    missingLoc.status === SOURCE_STATUS.ERROR && missingLoc.error.includes('coordinates are required'),
    'search() rejects missing latitude and longitude with structured error'
  );

  const invalidLat = await configured.search('iphone 16', { lat: 150, lon: 77.6639 });
  assert(
    invalidLat.status === SOURCE_STATUS.ERROR && invalidLat.error.includes('latitude must be between'),
    'search() rejects latitude out of bounds (>90)'
  );

  const invalidLon = await configured.search('iphone 16', { lat: 12.9021, lon: -200 });
  assert(
    invalidLon.status === SOURCE_STATUS.ERROR && invalidLon.error.includes('longitude between -180 and 180'),
    'search() rejects longitude out of bounds (<-180)'
  );

  // --- 3. Normalization of Group Search Results ---
  console.log('\n--- 3. Normalization of Group Search Results ---');

  const normalizedGroup = configured.normalizeGroupResults(QUICKCOMMERCE_GROUPSEARCH_FIXTURE.data.results);
  assert(normalizedGroup.length === 4, `Normalized 4 listings from 4 platforms in group fixture (got: ${normalizedGroup.length})`);

  // Check BlinkIt item
  const blinkitItem = normalizedGroup.find((i) => i.platform === 'BlinkIt');
  assert(Boolean(blinkitItem), 'BlinkIt listing extracted successfully');
  assert(blinkitItem.listingTitle === 'Apple iPhone 16 (128GB, Black)', 'BlinkIt title extracted accurately');
  assert(blinkitItem.price === 72999, 'BlinkIt price normalized to numeric (72999)');
  assert(blinkitItem.originalPrice === 79900, 'BlinkIt MRP preserved (79900)');
  assert(blinkitItem.discount === 8.64, 'BlinkIt discount % calculated accurately (8.64%)');
  assert(blinkitItem.inStock === true, 'BlinkIt inStock parsed to true');
  assert(blinkitItem.deliveryText === '10 mins', 'BlinkIt SLA preserved in deliveryText');
  assert(blinkitItem.productUrl === 'https://blinkit.com/prn/apple-iphone-16-128gb-black/prid/598212', 'BlinkIt productUrl preserved');
  assert(blinkitItem.sellerRating === 4.8, 'BlinkIt rating preserved');
  assert(blinkitItem.currency === 'INR', 'Currency is explicit "INR"');
  assert(blinkitItem.sourceType === 'API', 'sourceType is "API"');

  // Check Swiggy out-of-stock item
  const swiggyItem = normalizedGroup.find((i) => i.platform === 'Swiggy');
  assert(Boolean(swiggyItem), 'Swiggy listing extracted successfully');
  assert(swiggyItem.inStock === false, 'Swiggy out-of-stock normalized to inStock: false');

  // Check Flipkart item with missing optional fields
  const flipkartItem = normalizedGroup.find((i) => i.platform === 'Flipkart');
  assert(Boolean(flipkartItem), 'Flipkart listing extracted');
  assert(flipkartItem.sellerRating === null, 'Never fabricates sellerRating when missing from provider');
  assert(flipkartItem.deliveryCharge === null, 'Never fabricates deliveryCharge when missing from provider');

  // --- 4. Normalization of Single Platform Search Results ---
  console.log('\n--- 4. Normalization of Single Platform Search Results ---');

  const normalizedSingle = configured.normalizeSinglePlatform(QUICKCOMMERCE_SINGLE_SEARCH_FIXTURE.data.products, 'Amazon');
  assert(normalizedSingle.length === 1, 'Normalized single platform product array');
  assert(normalizedSingle[0].platform === 'Amazon', 'Platform set to Amazon');
  assert(normalizedSingle[0].price === 70999, 'Price extracted accurately (70999)');

  // --- 5. Secret Redaction & Sanitization ---
  console.log('\n--- 5. Secret Redaction & Sanitization ---');

  const secretTestAdapter = new QuickCommerceLiveAdapter({ apiKey: 'SUPER_SECRET_QC_KEY_9999' });
  const rawErrorMessage = 'Fetch failed on https://api.quickcommerceapi.com/v1/groupsearch with X-API-Key: SUPER_SECRET_QC_KEY_9999';
  const sanitizedMsg = secretTestAdapter._sanitizeError(rawErrorMessage);

  assert(!sanitizedMsg.includes('SUPER_SECRET_QC_KEY_9999'), 'Sanitizer scrubs QuickCommerce API key from error');
  assert(sanitizedMsg.includes('[REDACTED_API_KEY]'), 'Sanitizer replaces API key with [REDACTED_API_KEY]');

  // --- 6. LiveSourceManager Integration ---
  console.log('\n--- 6. LiveSourceManager Integration ---');

  const manager = new LiveSourceManager({ mode: 'live' });
  assert(manager.getRegisteredSourceNames().includes('quickcommerce'), 'LiveSourceManager automatically registers QuickCommerce adapter');

  const managerHealth = await manager.healthCheckAll();
  assert(Boolean(managerHealth.sources.quickcommerce), 'LiveSourceManager health check includes QuickCommerce source');

  // --- 7. HTTP Endpoint Location & Validation Tests ---
  console.log('\n--- 7. HTTP Endpoint Location & Validation Tests ---');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const serverPort = server.address().port;
  const baseUrl = `http://127.0.0.1:${serverPort}`;

  try {
    // A. Missing lat/lon query parameters when calling live search
    const missingLocRes = await fetch(`${baseUrl}/api/v1/live-search?q=iphone%2016`);
    const missingLocBody = await missingLocRes.json();
    assert(missingLocRes.status === 200, 'Live search without lat/lon returns HTTP 200');
    assert(missingLocBody.location.provided === false, 'Response reflects location.provided = false');

    // B. Invalid lat/lon query parameters (400 validation)
    const invalidLocRes = await fetch(`${baseUrl}/api/v1/live-search?q=iphone%2016&lat=abc&lon=77`);
    assert(invalidLocRes.status === 400, 'Invalid non-numeric coordinates return HTTP 400');

    const outOfBoundsRes = await fetch(`${baseUrl}/api/v1/live-search?q=iphone%2016&lat=120&lon=77`);
    assert(outOfBoundsRes.status === 400, 'Out-of-bounds coordinates return HTTP 400');

    // C. Valid lat/lon query parameters
    const validLocRes = await fetch(`${baseUrl}/api/v1/live-search?q=iphone%2016&lat=12.9021&lon=77.6639`);
    const validLocBody = await validLocRes.json();
    assert(validLocRes.status === 200, 'Valid coordinates return HTTP 200');
    assert(validLocBody.location.provided === true, 'Response reflects location.provided = true');
    assert(validLocBody.location.lat === 12.9021, 'Response echoes lat');
    assert(validLocBody.location.lon === 77.6639, 'Response echoes lon');
    assert(Boolean(validLocBody.sources.quickcommerce), 'Response includes quickcommerce source summary');

  } finally {
    await new Promise((resolve) => {
      if (server.closeAllConnections) server.closeAllConnections();
      server.close(() => resolve());
    });
  }

  console.log('\n====================================================');
  console.log(`PHASE 8.5.2 TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

runQuickCommerceTests();
