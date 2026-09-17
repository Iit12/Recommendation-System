/**
 * Phase 4 Live API Endpoint & Backward Compatibility Verifier
 */

const BASE_URL = 'http://127.0.0.1:5000';

const endpoints = [
  // Health
  { name: 'Health Check', url: `${BASE_URL}/api/health`, expectedStatus: 200 },

  // Phase 3 Data Collection
  { name: 'Phase 3 Collect Search', url: `${BASE_URL}/api/v1/collect/search?q=iphone+16`, expectedStatus: 200 },

  // Phase 4 NLP Matching
  { name: 'Phase 4 Matching Search (iPhone 16)', url: `${BASE_URL}/api/v1/matching/search?q=iphone+16`, expectedStatus: 200 },
  { name: 'Phase 4 Matching with Platform Filter', url: `${BASE_URL}/api/v1/matching/search?q=iphone+16&platforms=amazon,flipkart`, expectedStatus: 200 },
  { name: 'Phase 4 Matching (Sony WH-1000XM5)', url: `${BASE_URL}/api/v1/matching/search?q=sony`, expectedStatus: 200 },
  { name: 'Phase 4 Missing Query Validation', url: `${BASE_URL}/api/v1/matching/search`, expectedStatus: 400 },
  { name: 'Phase 4 Short Query Validation', url: `${BASE_URL}/api/v1/matching/search?q=a`, expectedStatus: 400 },
  { name: 'Phase 4 Unsupported Platform Validation', url: `${BASE_URL}/api/v1/matching/search?q=iphone&platforms=nonexistent_store`, expectedStatus: 400 },

  // Phase 2 Backward Compatibility
  { name: 'Phase 2 Catalog Search', url: `${BASE_URL}/api/v1/search?q=iphone`, expectedStatus: 200 },
  { name: 'Phase 2 All Products', url: `${BASE_URL}/api/v1/products`, expectedStatus: 200 },
  { name: 'Phase 2 Single Product', url: `${BASE_URL}/api/v1/products/iphone-16`, expectedStatus: 200 },
  { name: 'Phase 2 Price Lookup (/prices/:id)', url: `${BASE_URL}/api/v1/prices/iphone-16`, expectedStatus: 200 },
  { name: 'Phase 2 Price Lookup (/products/:id/prices)', url: `${BASE_URL}/api/v1/products/iphone-16/prices`, expectedStatus: 200 },
  { name: 'Phase 2 All Trends', url: `${BASE_URL}/api/v1/trends`, expectedStatus: 200 },
  { name: 'Phase 2 Product Trends', url: `${BASE_URL}/api/v1/products/iphone-16/trends`, expectedStatus: 200 },
  { name: 'Phase 2 Recommendation (/recommendations/:id)', url: `${BASE_URL}/api/v1/recommendations/iphone-16`, expectedStatus: 200 },
  { name: 'Phase 2 Recommendation (/products/:id/recommendation)', url: `${BASE_URL}/api/v1/products/iphone-16/recommendation`, expectedStatus: 200 },
];

async function run() {
  console.log('====================================================');
  console.log('🌐 TESTING LIVE REST API ENDPOINTS & BACKWARD COMPATIBILITY');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url);
      const data = await res.json();

      if (res.status === ep.expectedStatus) {
        passed++;
        console.log(`  ✅ [${res.status}] ${ep.name}`);
        if (ep.name.includes('Phase 4 Matching Search (iPhone 16)')) {
          console.log(`     -> Total Listings: ${data.totalListings} | Groups: ${data.totalProductGroups} | Group Title: "${data.groups[0]?.canonicalProduct?.title}" | Match Score: ${data.groups[0]?.matchScore}`);
        }
      } else {
        failed++;
        console.error(`  ❌ [${res.status} != ${ep.expectedStatus}] ${ep.name}`);
        console.error(`     Response: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      failed++;
      console.error(`  ❌ [ERROR] ${ep.name}: ${err.message}`);
    }
  }

  console.log('\n====================================================');
  console.log(`API TEST SUMMARY: ${passed}/${endpoints.length} Passed (${failed} Failed)`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

run();
