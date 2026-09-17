/**
 * Phase 5 Live REST API & Full Regression Test Verifier
 */

const BASE_URL = 'http://127.0.0.1:5000';

async function run() {
  console.log('====================================================');
  console.log('🌐 TESTING LIVE REST APIS (PHASE 2, 3, 4, AND 5)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function testReq(name, url, options, expectedStatus) {
    try {
      const res = await fetch(url, options);
      const data = await res.json();

      if (res.status === expectedStatus) {
        passed++;
        console.log(`  ✅ [${res.status}] ${name}`);
        return { ok: true, data };
      } else {
        failed++;
        console.error(`  ❌ [${res.status} != ${expectedStatus}] ${name}`);
        console.error(`     Response:`, JSON.stringify(data));
        return { ok: false, data };
      }
    } catch (err) {
      failed++;
      console.error(`  ❌ [ERROR] ${name}: ${err.message}`);
      return { ok: false, error: err };
    }
  }

  // 1. Health
  await testReq('Health Check', `${BASE_URL}/api/health`, { method: 'GET' }, 200);

  // 2. Phase 5 History Persistence
  const persistRes = await testReq(
    'Phase 5 History Collect & Persist (iPhone 16)',
    `${BASE_URL}/api/v1/history/collect`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'iphone 16' }),
    },
    200
  );
  if (persistRes.ok) {
    console.log(`     -> Saved ${persistRes.data.totalCanonicalProducts} products, ${persistRes.data.listingsUpserted} listings, ${persistRes.data.observationsSaved} observations`);
  }

  // Persist Sony
  await testReq(
    'Phase 5 History Collect & Persist (Sony)',
    `${BASE_URL}/api/v1/history/collect`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'sony', platforms: ['amazon', 'flipkart', 'croma'] }),
    },
    200
  );

  // 3. Phase 5 Historical Queries
  const histRes = await testReq(
    'Phase 5 Product History Timeline',
    `${BASE_URL}/api/v1/history/products/apple-iphone-16-128gb-black`,
    { method: 'GET' },
    200
  );
  if (histRes.ok) {
    console.log(`     -> Total Observations: ${histRes.data.totalObservations}`);
  }

  await testReq(
    'Phase 5 Product History with Date Range Filter',
    `${BASE_URL}/api/v1/history/products/apple-iphone-16-128gb-black?from=2026-01-01&to=2026-12-31`,
    { method: 'GET' },
    200
  );

  const latestRes = await testReq(
    'Phase 5 Latest Prices Per Platform',
    `${BASE_URL}/api/v1/history/products/apple-iphone-16-128gb-black/latest`,
    { method: 'GET' },
    200
  );
  if (latestRes.ok) {
    console.log(`     -> Platforms tracked: ${latestRes.data.platformsCount} | Cheapest: ₹${latestRes.data.data?.[0]?.effectivePrice} on ${latestRes.data.data?.[0]?.platform}`);
  }

  const summaryRes = await testReq(
    'Phase 5 Historical Summary Statistics',
    `${BASE_URL}/api/v1/history/products/apple-iphone-16-128gb-black/summary`,
    { method: 'GET' },
    200
  );
  if (summaryRes.ok) {
    console.log(`     -> Min Price: ₹${summaryRes.data.data?.lowestPrice}, Max: ₹${summaryRes.data.data?.highestPrice}, Avg: ₹${summaryRes.data.data?.averagePrice}, Obs: ${summaryRes.data.data?.observationCount}`);
  }

  // 4. Phase 5 Validation & Errors
  await testReq(
    'Phase 5 Missing Query in POST /history/collect',
    `${BASE_URL}/api/v1/history/collect`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '' }),
    },
    400
  );

  await testReq(
    'Phase 5 Invalid Date in GET /history/products/:id',
    `${BASE_URL}/api/v1/history/products/apple-iphone-16-128gb-black?from=not-a-date`,
    { method: 'GET' },
    400
  );

  await testReq(
    'Phase 5 Non-Existent Product (404)',
    `${BASE_URL}/api/v1/history/products/unknown-non-existent-product`,
    { method: 'GET' },
    404
  );

  // 5. Phase 4 Matching API
  await testReq(
    'Phase 4 Matching Search',
    `${BASE_URL}/api/v1/matching/search?q=iphone+16`,
    { method: 'GET' },
    200
  );

  // 6. Phase 3 Collection API
  await testReq(
    'Phase 3 Collection Search',
    `${BASE_URL}/api/v1/collect/search?q=iphone+16`,
    { method: 'GET' },
    200
  );

  // 7. Phase 2 Backend APIs Regression
  await testReq('Phase 2 Catalog Search', `${BASE_URL}/api/v1/search?q=iphone`, { method: 'GET' }, 200);
  await testReq('Phase 2 All Products', `${BASE_URL}/api/v1/products`, { method: 'GET' }, 200);
  await testReq('Phase 2 Single Product', `${BASE_URL}/api/v1/products/iphone-16`, { method: 'GET' }, 200);
  await testReq('Phase 2 Product Prices', `${BASE_URL}/api/v1/products/iphone-16/prices`, { method: 'GET' }, 200);
  await testReq('Phase 2 Product Trends', `${BASE_URL}/api/v1/products/iphone-16/trends`, { method: 'GET' }, 200);
  await testReq('Phase 2 Product Recommendation', `${BASE_URL}/api/v1/products/iphone-16/recommendation`, { method: 'GET' }, 200);

  console.log('\n====================================================');
  console.log(`LIVE REST API TEST SUMMARY: ${passed}/${passed + failed} Passed (${failed} Failed)`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

run();
