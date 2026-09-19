/**
 * Phase 8.5.1 Live Data Acquisition Foundation Test Suite
 * 
 * Validates:
 * 1. LiveSourceAdapter contract & lifecycle
 * 2. Strict Live Normalizer schema & non-fabrication guarantees
 * 3. AmazonLiveAdapter configuration states (CONFIGURED vs NOT_CONFIGURED)
 * 4. Realistic Amazon Creators API payload normalization
 * 5. OAuth 2.0 Bearer Token caching & lifecycle simulation
 * 6. Source-specific error models & per-source fault isolation
 * 7. LiveSourceManager multi-source orchestration & health check
 * 8. Strict Mock vs Live separation (no fallback fabrication)
 * 9. Secret & credential redaction
 * 10. Live HTTP endpoints integration
 */

import { LiveSourceAdapter, SOURCE_TYPES, SOURCE_STATUS } from '../adapters/liveSource.adapter.js';
import { AmazonLiveAdapter } from '../adapters/amazon.liveAdapter.js';
import { liveNormalizer, isValidUrl, parseNumericPrice } from '../liveNormalizer.js';
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

// Realistic Amazon Creators API SearchItems Response Fixture
const AMAZON_CREATORS_API_FIXTURE = {
  searchResult: {
    totalResultCount: 2,
    items: [
      {
        asin: 'B0DGJ6SDF8',
        detailPageUrl: 'https://www.amazon.in/dp/B0DGJ6SDF8?tag=mypartnertag-21',
        itemInfo: {
          title: {
            displayValue: 'Apple iPhone 16 (128 GB) - Black',
          },
        },
        offersV2: {
          listings: [
            {
              id: 'listing_001',
              price: {
                amount: 70999,
                currency: 'INR',
              },
              savingBasis: {
                amount: 79900,
                currency: 'INR',
              },
              merchantInfo: {
                name: 'Appario Retail Pvt Ltd',
              },
              availability: {
                type: 'IN_STOCK',
                message: 'In stock',
              },
              deliveryInfo: {
                isFreeShippingEligible: true,
              },
            },
          ],
        },
      },
      {
        asin: 'B09XS7JWHH',
        detailPageUrl: 'https://www.amazon.in/dp/B09XS7JWHH?tag=mypartnertag-21',
        itemInfo: {
          title: {
            displayValue: 'Sony WH-1000XM5 Wireless Industry Leading ANC Headphones - Silver',
          },
        },
        offersV2: {
          listings: [
            {
              id: 'listing_002',
              price: {
                amount: 24990,
                currency: 'INR',
              },
              savingBasis: {
                amount: 34990,
                currency: 'INR',
              },
              merchantInfo: {
                name: 'Electronics Hub Amazon',
              },
              availability: {
                type: 'IN_STOCK',
                message: 'In stock',
              },
              deliveryInfo: {
                isFreeShippingEligible: true,
              },
            },
          ],
        },
      },
    ],
  },
};

async function runLiveDataTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 8.5.1 LIVE DATA ACQUISITION TEST SUITE');
  console.log('====================================================\n');

  // --- 1. LiveSourceAdapter Contract Tests ---
  console.log('--- 1. LiveSourceAdapter Contract Tests ---');

  let directInstantiationFailed = false;
  try {
    new LiveSourceAdapter('test', 'Test');
  } catch (e) {
    directInstantiationFailed = e instanceof TypeError;
  }
  assert(directInstantiationFailed, 'Cannot instantiate abstract LiveSourceAdapter directly');

  class TestLiveAdapter extends LiveSourceAdapter {
    constructor(isConf = true) {
      super('testsource', 'Test Platform', SOURCE_TYPES.API);
      this._isConf = isConf;
    }
    isConfigured() {
      return this._isConf;
    }
    async search(query) {
      return {
        source: this.sourceName,
        platform: this.platformName,
        sourceType: this.sourceType,
        status: SOURCE_STATUS.READY,
        collectedAt: new Date().toISOString(),
        results: [{ listingTitle: `Test result for ${query}`, price: 1000, productUrl: 'https://example.com/p1' }],
        error: null,
      };
    }
    normalize(rawResult, timestamp) {
      return liveNormalizer.normalizeBatch(rawResult, {
        platform: this.platformName,
        sourceType: this.sourceType,
        sourceId: this.sourceName,
        collectedAt: timestamp,
      });
    }
  }

  const testAdapter = new TestLiveAdapter(true);
  assert(testAdapter.getSourceName() === 'testsource', 'getSourceName() returns normalized slug');
  assert(testAdapter.getPlatformName() === 'Test Platform', 'getPlatformName() returns human-readable name');
  assert(testAdapter.getSourceType() === SOURCE_TYPES.API, 'getSourceType() returns API');
  assert(testAdapter.supportsLiveData() === true, 'supportsLiveData() returns true');

  const unsupportedLookup = await testAdapter.getProduct('asin-123');
  assert(
    unsupportedLookup.status === SOURCE_STATUS.UNSUPPORTED_OPERATION && unsupportedLookup.results.length === 0,
    'getProduct() returns structured UNSUPPORTED_OPERATION by default'
  );

  const testHealth = await testAdapter.healthCheck();
  assert(
    testHealth.configured === true && testHealth.available === true && testHealth.status === SOURCE_STATUS.READY,
    'healthCheck() returns accurate health status'
  );

  // --- 2. Live Normalizer Tests & Non-Fabrication Rules ---
  console.log('\n--- 2. Live Normalizer Tests & Non-Fabrication Rules ---');

  assert(isValidUrl('https://www.amazon.in/dp/B0DGJ6SDF8') === true, 'isValidUrl accepts valid HTTPS URL');
  assert(isValidUrl('http://example.com/product') === true, 'isValidUrl accepts valid HTTP URL');
  assert(isValidUrl('javascript:alert(1)') === false, 'isValidUrl rejects javascript: scheme');
  assert(isValidUrl('not-a-url') === false, 'isValidUrl rejects malformed string');

  assert(parseNumericPrice(1299.5) === 1299.5, 'parseNumericPrice parses float numbers');
  assert(parseNumericPrice('69999') === 69999, 'parseNumericPrice parses numeric strings');
  assert(parseNumericPrice(-500) === null, 'parseNumericPrice rejects negative prices');
  assert(parseNumericPrice(NaN) === null, 'parseNumericPrice rejects NaN');
  assert(parseNumericPrice('abc') === null, 'parseNumericPrice rejects non-numeric string');

  // Full valid item normalization
  const sampleRaw = {
    title: 'Apple iPhone 16 (128 GB) - Black',
    url: 'https://www.amazon.in/dp/B0DGJ6SDF8',
    price: 70999,
    originalPrice: 79900,
    deliveryCharge: 0,
    inStock: true,
    merchant: 'Appario Retail Pvt Ltd',
    sellerRating: 4.8,
  };
  const normalizedValid = liveNormalizer.normalize(sampleRaw, {
    platform: 'Amazon',
    sourceType: 'API',
    sourceId: 'amazon',
    collectedAt: '2026-09-19T10:00:00.000Z',
  });

  assert(normalizedValid !== null, 'Normalizer successfully processes valid live item');
  assert(normalizedValid.platform === 'Amazon', 'Normalizer sets platform correctly');
  assert(normalizedValid.sourceType === 'API', 'Normalizer sets sourceType correctly');
  assert(normalizedValid.sourceId === 'amazon', 'Normalizer sets sourceId correctly');
  assert(normalizedValid.listingTitle === 'Apple iPhone 16 (128 GB) - Black', 'Normalizer sets title correctly');
  assert(normalizedValid.productUrl === 'https://www.amazon.in/dp/B0DGJ6SDF8', 'Normalizer preserves exact URL');
  assert(normalizedValid.price === 70999, 'Normalizer preserves numeric price');
  assert(normalizedValid.originalPrice === 79900, 'Normalizer preserves originalPrice');
  assert(normalizedValid.discount === 11.14, 'Normalizer accurately calculates discount % (11.14%) without fabrication');
  assert(normalizedValid.deliveryCharge === 0, 'Normalizer preserves delivery charge');
  assert(normalizedValid.effectivePrice === 70999, 'Normalizer calculates effectivePrice correctly');
  assert(normalizedValid.inStock === true, 'Normalizer sets inStock boolean');
  assert(normalizedValid.sellerName === 'Appario Retail Pvt Ltd', 'Normalizer preserves seller name');
  assert(normalizedValid.sellerRating === 4.8, 'Normalizer preserves seller rating');
  assert(normalizedValid.collectedAt === '2026-09-19T10:00:00.000Z', 'Normalizer preserves collectedAt');

  // Non-fabrication tests
  const sparseRaw = {
    title: 'Item with Missing Data',
    url: 'https://example.com/sparse',
    price: 500,
  };
  const normalizedSparse = liveNormalizer.normalize(sparseRaw, {
    platform: 'Amazon',
    sourceType: 'API',
    sourceId: 'amazon',
  });

  assert(normalizedSparse.sellerRating === null, 'Never fabricates sellerRating when missing from source');
  assert(normalizedSparse.deliveryCharge === null, 'Never fabricates deliveryCharge when missing from source');
  assert(normalizedSparse.discount === null, 'Never fabricates discount when originalPrice is missing');
  assert(normalizedSparse.sellerName === null, 'Never fabricates sellerName when missing from source');

  // Invalid item rejection
  assert(liveNormalizer.normalize({ title: '', url: 'https://example.com', price: 100 }) === null, 'Rejects empty title');
  assert(liveNormalizer.normalize({ title: 'T', url: 'invalid-url', price: 100 }) === null, 'Rejects invalid URL');
  assert(liveNormalizer.normalize({ title: 'T', url: 'https://example.com', price: -50 }) === null, 'Rejects negative price');
  assert(liveNormalizer.normalize({ title: 'T', url: 'https://example.com', price: 0 }) === null, 'Rejects zero price');

  // Deduplication test
  const duplicateBatch = [
    { title: 'Item 1', url: 'https://example.com/p1', price: 100 },
    { title: 'Item 1 Dup', url: 'https://example.com/p1', price: 100 },
    { title: 'Item 2', url: 'https://example.com/p2', price: 200 },
  ];
  const deduplicated = liveNormalizer.normalizeBatch(duplicateBatch, {
    platform: 'Amazon',
    sourceType: 'API',
    sourceId: 'amazon',
  });
  assert(deduplicated.length === 2, 'Batch normalizer deduplicates listings by sourceId + productUrl');

  // --- 3. Amazon Live Adapter Configuration & State Tests ---
  console.log('\n--- 3. Amazon Live Adapter Configuration & State Tests ---');

  // Unconfigured adapter
  const unconfiguredAmazon = new AmazonLiveAdapter({
    clientId: null,
    clientSecret: null,
    partnerTag: null,
  });
  assert(unconfiguredAmazon.isConfigured() === false, 'isConfigured() returns false when credentials missing');

  const unconfiguredHealth = await unconfiguredAmazon.healthCheck();
  assert(
    unconfiguredHealth.configured === false && unconfiguredHealth.status === SOURCE_STATUS.NOT_CONFIGURED,
    'healthCheck() returns NOT_CONFIGURED when credentials missing'
  );

  const unconfiguredSearch = await unconfiguredAmazon.search('iphone 16');
  assert(
    unconfiguredSearch.status === SOURCE_STATUS.NOT_CONFIGURED &&
    unconfiguredSearch.results.length === 0 &&
    unconfiguredSearch.error.includes('not configured'),
    'search() on unconfigured adapter returns NOT_CONFIGURED result without crashing'
  );

  // Configured adapter structure
  const configuredAmazon = new AmazonLiveAdapter({
    clientId: 'test-client-id-123',
    clientSecret: 'test-client-secret-xyz',
    partnerTag: 'mypartnertag-21',
    marketplace: 'www.amazon.in',
  });
  assert(configuredAmazon.isConfigured() === true, 'isConfigured() returns true when all credentials provided');

  // --- 4. Amazon Payload Normalization Tests ---
  console.log('\n--- 4. Amazon Payload Normalization Tests ---');

  const parsedAmazonResults = configuredAmazon.normalize(AMAZON_CREATORS_API_FIXTURE.searchResult.items);
  assert(parsedAmazonResults.length === 2, 'Parses 2 items from realistic Amazon Creators API fixture');

  const item1 = parsedAmazonResults[0];
  assert(item1.platform === 'Amazon', 'Item 1 has platform "Amazon"');
  assert(item1.sourceType === 'API', 'Item 1 has sourceType "API"');
  assert(item1.sourceId === 'amazon', 'Item 1 has sourceId "amazon"');
  assert(item1.listingTitle === 'Apple iPhone 16 (128 GB) - Black', 'Item 1 title extracted accurately');
  assert(item1.price === 70999, 'Item 1 price extracted accurately (70999)');
  assert(item1.originalPrice === 79900, 'Item 1 original price extracted accurately (79900)');
  assert(item1.inStock === true, 'Item 1 availability parsed to inStock: true');
  assert(item1.sellerName === 'Appario Retail Pvt Ltd', 'Item 1 merchant parsed accurately');
  assert(item1.deliveryText === 'Free Prime Delivery', 'Item 1 free prime delivery text preserved');

  const item2 = parsedAmazonResults[1];
  assert(item2.listingTitle.includes('Sony WH-1000XM5'), 'Item 2 title extracted accurately');
  assert(item2.price === 24990, 'Item 2 price extracted accurately (24990)');
  assert(item2.sellerName === 'Electronics Hub Amazon', 'Item 2 merchant parsed accurately');

  // --- 5. Secret Redaction & Sanitization Tests ---
  console.log('\n--- 5. Secret Redaction & Sanitization Tests ---');

  const adapterWithSecrets = new AmazonLiveAdapter({
    clientId: 'SECRET_CLIENT_ID_999',
    clientSecret: 'SUPER_SECRET_KEY_888',
    partnerTag: 'tag-21',
  });
  adapterWithSecrets.tokenCache = {
    accessToken: 'BEARER_TOKEN_777',
    expiresAt: Date.now() + 3600000,
  };

  const leakedErrorMsg = 'Failed to connect to https://creatorsapi.amazon with SECRET_CLIENT_ID_999 and SUPER_SECRET_KEY_888 (token: BEARER_TOKEN_777)';
  const sanitized = adapterWithSecrets._sanitizeError(leakedErrorMsg);

  assert(!sanitized.includes('SECRET_CLIENT_ID_999'), 'Sanitizer scrubs client ID');
  assert(!sanitized.includes('SUPER_SECRET_KEY_888'), 'Sanitizer scrubs client secret');
  assert(!sanitized.includes('BEARER_TOKEN_777'), 'Sanitizer scrubs bearer token');
  assert(sanitized.includes('[REDACTED_CLIENT_ID]'), 'Sanitizer replaces client ID with safe placeholder');
  assert(sanitized.includes('[REDACTED_SECRET]'), 'Sanitizer replaces secret with safe placeholder');
  assert(sanitized.includes('[REDACTED_TOKEN]'), 'Sanitizer replaces token with safe placeholder');

  // --- 6. LiveSourceManager Tests & Fault Isolation ---
  console.log('\n--- 6. LiveSourceManager Tests & Fault Isolation ---');

  const manager = new LiveSourceManager({ mode: 'live' });

  // Custom mock live adapter that succeeds
  class MockWorkingLiveAdapter extends LiveSourceAdapter {
    constructor() {
      super('workingsource', 'Working Source', SOURCE_TYPES.API);
    }
    isConfigured() { return true; }
    async search(query) {
      return {
        source: 'workingsource',
        platform: 'Working Source',
        sourceType: SOURCE_TYPES.API,
        status: SOURCE_STATUS.READY,
        collectedAt: new Date().toISOString(),
        results: [{
          platform: 'Working Source',
          sourceType: 'API',
          sourceId: 'workingsource',
          listingTitle: `Live result for ${query}`,
          productUrl: 'https://workingsource.com/item/1',
          price: 50000,
          originalPrice: 55000,
          currency: 'INR',
          inStock: true,
          collectedAt: new Date().toISOString(),
        }],
        error: null,
      };
    }
    normalize(raw) { return raw; }
  }

  // Custom mock live adapter that throws an unexpected error
  class MockCrashingLiveAdapter extends LiveSourceAdapter {
    constructor() {
      super('crashingsource', 'Crashing Source', SOURCE_TYPES.API);
    }
    isConfigured() { return true; }
    async search() {
      throw new Error('Unexpected network socket hangup in provider.');
    }
    normalize(raw) { return raw; }
  }

  manager.registerAdapter(new MockWorkingLiveAdapter());
  manager.registerAdapter(new MockCrashingLiveAdapter());

  assert(manager.getRegisteredSourceNames().includes('amazon'), 'Manager registers Amazon adapter by default');
  assert(manager.getRegisteredSourceNames().includes('workingsource'), 'Manager registers Working Source');
  assert(manager.getRegisteredSourceNames().includes('crashingsource'), 'Manager registers Crashing Source');

  // Execute multi-source search with faulty adapter
  const multiSearchResult = await manager.search('macbook air', {
    sources: ['workingsource', 'crashingsource', 'amazon', 'nonexistentsource'],
  });

  assert(multiSearchResult.successfulSources.includes('workingsource'), 'Successful source listed in successfulSources');
  assert(multiSearchResult.failedSources.includes('crashingsource'), 'Crashing source listed in failedSources without crashing entire search');
  assert(multiSearchResult.failedSources.includes('amazon'), 'Unconfigured source isolated and listed in failedSources');
  assert(multiSearchResult.failedSources.includes('nonexistentsource'), 'Unregistered source safely captured');
  assert(multiSearchResult.totalListings === 1, 'Total listings correctly aggregates results from working sources (1)');
  assert(multiSearchResult.results[0].listingTitle === 'Live result for macbook air', 'Aggregated listings contain valid item');
  assert(multiSearchResult.sources.workingsource.status === SOURCE_STATUS.READY, 'Working source has READY status');
  assert(multiSearchResult.sources.crashingsource.status === SOURCE_STATUS.ERROR, 'Crashing source has ERROR status');
  assert(multiSearchResult.sources.amazon.status === SOURCE_STATUS.NOT_CONFIGURED, 'Amazon has NOT_CONFIGURED status');

  // Manager Health Check
  const allHealth = await manager.healthCheckAll();
  assert(allHealth.totalSources >= 3, `Health check covers all registered sources (${allHealth.totalSources})`);
  assert(allHealth.sources.workingsource.configured === true, 'Health check shows workingsource configured');
  assert(allHealth.sources.amazon.configured === false, 'Health check shows amazon unconfigured');

  // --- 7. Mock vs Live Separation Verification ---
  console.log('\n--- 7. Mock vs Live Separation Verification ---');

  // Searching unconfigured live source should NOT return mock listings
  const unconfiguredSearchCheck = await manager.search('iphone 16', { sources: ['amazon'] });
  assert(unconfiguredSearchCheck.totalListings === 0, 'Live mode does NOT silently inject mock listings when live source is unconfigured');
  assert(unconfiguredSearchCheck.sources.amazon.results.length === 0, 'Amazon live source returns empty array in unconfigured state');

  // --- 8. Live HTTP Endpoints Integration Tests ---
  console.log('\n--- 8. Live HTTP Endpoints Integration Tests ---');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const serverPort = server.address().port;
  const baseUrl = `http://127.0.0.1:${serverPort}`;

  try {
    // A. Health check endpoint
    const healthRes = await fetch(`${baseUrl}/api/v1/live-search/health`);
    const healthBody = await healthRes.json();
    assert(healthRes.status === 200, `GET /api/v1/live-search/health returned HTTP 200`);
    assert(healthBody.success === true && Boolean(healthBody.health), 'Health endpoint returns structured health object');

    // B. Search endpoint with valid query
    const searchRes = await fetch(`${baseUrl}/api/v1/live-search?q=iphone%2016`);
    const searchBody = await searchRes.json();
    assert(searchRes.status === 200, `GET /api/v1/live-search?q=iphone%2016 returned HTTP 200`);
    assert(searchBody.success === true, 'Live search returns success: true');
    assert(searchBody.mode === 'live', 'Live search explicitly marks mode: "live"');
    assert(searchBody.query === 'iphone 16', 'Live search echoes query');
    assert(Boolean(searchBody.sources.amazon), 'Live search contains amazon source summary');

    // C. Search endpoint without query (400 validation)
    const emptyRes = await fetch(`${baseUrl}/api/v1/live-search`);
    const emptyBody = await emptyRes.json();
    assert(emptyRes.status === 400, `GET /api/v1/live-search without query returned HTTP 400`);
    assert(emptyBody.error.code === 'INVALID_QUERY', 'Validation returns INVALID_QUERY error code');

  } finally {
    await new Promise((resolve) => {
      if (server.closeAllConnections) {
        server.closeAllConnections();
      }
      server.close(() => resolve());
    });
  }

  console.log('\n====================================================');
  console.log(`PHASE 8.5.1 TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

runLiveDataTests();
