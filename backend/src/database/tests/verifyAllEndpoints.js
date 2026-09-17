/**
 * Phase 6 Live REST API & Full Regression Test Verifier
 * Tests Phase 2, Phase 3, Phase 4, Phase 5, and Phase 6 endpoints.
 */

const BASE_URL = 'http://127.0.0.1:5000';

async function run() {
  console.log('====================================================');
  console.log('🌐 TESTING LIVE REST APIS (PHASES 2, 3, 4, 5, AND 6)');
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
  await testReq(
    'Phase 5 History Collect & Persist (iPhone 16)',
    `${BASE_URL}/api/v1/history/collect`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'iphone 16' }),
    },
    200
  );

  // 3. Phase 5 Historical Queries
  await testReq(
    'Phase 5 Product History Timeline',
    `${BASE_URL}/api/v1/history/products/apple-iphone-16-128gb-black`,
    { method: 'GET' },
    200
  );
  await testReq(
    'Phase 5 Latest Prices Per Platform',
    `${BASE_URL}/api/v1/history/products/apple-iphone-16-128gb-black/latest`,
    { method: 'GET' },
    200
  );
  await testReq(
    'Phase 5 Historical Summary',
    `${BASE_URL}/api/v1/history/products/apple-iphone-16-128gb-black/summary`,
    { method: 'GET' },
    200
  );

  // 4. Phase 6 Overall Historical Trend Analysis
  const trendRes = await testReq(
    'Phase 6 Product Trend Analysis (GET /api/v1/trends/products/:id)',
    `${BASE_URL}/api/v1/trends/products/apple-iphone-16-128gb-black`,
    { method: 'GET' },
    200
  );
  if (trendRes.ok) {
    const d = trendRes.data.data;
    console.log(`     -> Trend: ${d?.trend} | Change: ₹${d?.priceChange} (${d?.percentageChange}%) | Volatility CV: ${d?.volatility?.coefficientOfVariation}% | Obs: ${d?.observationCount}`);
  }

  // 5. Phase 6 Date-filtered Trend Analysis
  await testReq(
    'Phase 6 Date-Filtered Trend (GET /api/v1/trends/products/:id?from=...&to=...)',
    `${BASE_URL}/api/v1/trends/products/apple-iphone-16-128gb-black?from=2026-01-01&to=2026-12-31`,
    { method: 'GET' },
    200
  );

  // 6. Phase 6 Platform-Segmented Trend Analysis
  const platformTrendRes = await testReq(
    'Phase 6 Platform-Segmented Trend (GET /api/v1/trends/products/:id/platforms)',
    `${BASE_URL}/api/v1/trends/products/apple-iphone-16-128gb-black/platforms`,
    { method: 'GET' },
    200
  );
  if (platformTrendRes.ok) {
    console.log(`     -> Platforms segmented: ${platformTrendRes.data.platformsCount}`);
  }

  // 7. Phase 6 Validation & Error Handling
  await testReq(
    'Phase 6 Invalid Date Range (from > to) Error (400)',
    `${BASE_URL}/api/v1/trends/products/apple-iphone-16-128gb-black?from=2026-09-20&to=2026-09-10`,
    { method: 'GET' },
    400
  );

  await testReq(
    'Phase 6 Non-Existent Product (404)',
    `${BASE_URL}/api/v1/trends/products/fake-non-existent-product-id`,
    { method: 'GET' },
    404
  );

  // 8. Phase 4 Matching API
  await testReq('Phase 4 Matching Search', `${BASE_URL}/api/v1/matching/search?q=iphone+16`, { method: 'GET' }, 200);

  // 9. Phase 3 Collection API
  await testReq('Phase 3 Collection Search', `${BASE_URL}/api/v1/collect/search?q=iphone+16`, { method: 'GET' }, 200);

  // 10. Phase 7.1 Recommendation Engine APIs
  const recRes = await testReq(
    'Phase 7.1 Product Recommendation (GET /api/v1/recommendations/products/:id)',
    `${BASE_URL}/api/v1/recommendations/products/apple-iphone-16-128gb-black`,
    { method: 'GET' },
    200
  );
  if (recRes.ok) {
    const r = recRes.data.data;
    console.log(`     -> Action: ${r?.recommendation?.action} | Score: ${r?.recommendation?.score} (${r?.recommendation?.type}) | Best Platform: ${r?.platform?.bestPlatform} (₹${r?.platform?.bestPrice})`);
    console.log(`     -> Reasons (${r?.reasons?.length}): "${r?.reasons?.[0]}"`);
  }

  await testReq(
    'Phase 7.1 Date-Filtered Recommendation',
    `${BASE_URL}/api/v1/recommendations/products/apple-iphone-16-128gb-black?from=2026-01-01&to=2026-12-31`,
    { method: 'GET' },
    200
  );

  await testReq(
    'Phase 7.1 Invalid Date Range Error (400)',
    `${BASE_URL}/api/v1/recommendations/products/apple-iphone-16-128gb-black?from=2026-09-20&to=2026-09-10`,
    { method: 'GET' },
    400
  );

  await testReq(
    'Phase 7.1 Non-Existent Product Error (404)',
    `${BASE_URL}/api/v1/recommendations/products/fake-non-existent-product-id`,
    { method: 'GET' },
    404
  );

  // 11. Phase 2 Backend APIs Backward Compatibility
  await testReq('Phase 2 Catalog Search', `${BASE_URL}/api/v1/search?q=iphone`, { method: 'GET' }, 200);
  await testReq('Phase 2 All Products', `${BASE_URL}/api/v1/products`, { method: 'GET' }, 200);
  await testReq('Phase 2 Single Product', `${BASE_URL}/api/v1/products/iphone-16`, { method: 'GET' }, 200);
  await testReq('Phase 2 Product Prices', `${BASE_URL}/api/v1/products/iphone-16/prices`, { method: 'GET' }, 200);
  await testReq('Phase 2 All Trends (GET /api/v1/trends)', `${BASE_URL}/api/v1/trends`, { method: 'GET' }, 200);
  await testReq('Phase 2 Product Trends (GET /api/v1/trends/:id)', `${BASE_URL}/api/v1/trends/iphone-16`, { method: 'GET' }, 200);
  await testReq('Phase 2 Product Recommendation', `${BASE_URL}/api/v1/products/iphone-16/recommendation`, { method: 'GET' }, 200);

  console.log('\n====================================================');
  console.log(`LIVE REST API TEST SUMMARY: ${passed}/${passed + failed} Passed (${failed} Failed)`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

run();
