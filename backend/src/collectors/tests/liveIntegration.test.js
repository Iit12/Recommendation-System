/**
 * Phase 8.5.2 Real Live Integration Test
 * 
 * Executes an actual network request against QuickCommerce API (api.quickcommerceapi.com)
 * using the configured environment credentials.
 * 
 * STRICT COMPLIANCE:
 * - Never prints or exposes the API key.
 * - Prints only `configured: true/false` and `length: <number>`.
 * - Performs real HTTP request without mock fetch / fixtures.
 * - Reports safe operational metrics.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from backend/.env and root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

import { QuickCommerceLiveAdapter } from '../adapters/quickcommerce.liveAdapter.js';

async function runLiveVerification() {
  console.log('====================================================');
  console.log('🌐 PHASE 8.5.2 REAL QUICKCOMMERCE API VERIFICATION');
  console.log('====================================================\n');

  // STEP 1 — Verify Environment Loading
  const rawKey = process.env.QUICKCOMMERCE_API_KEY;
  const isKeyConfigured = Boolean(rawKey && String(rawKey).trim().length > 0);
  const keyLength = isKeyConfigured ? String(rawKey).trim().length : 0;

  console.log('--- STEP 1 & 2: Environment & Adapter Configuration ---');
  console.log(`QUICKCOMMERCE_API_KEY configured: ${isKeyConfigured}`);
  console.log(`QUICKCOMMERCE_API_KEY length:     ${keyLength}`);

  const adapter = new QuickCommerceLiveAdapter();
  const adapterConfigured = adapter.isConfigured();
  console.log(`QuickCommerceLiveAdapter isConfigured(): ${adapterConfigured}`);

  if (!adapterConfigured) {
    console.log('\n❌ Result: QuickCommerce API is NOT_CONFIGURED.');
    console.log('Please ensure QUICKCOMMERCE_API_KEY is placed in backend/.env');
    return;
  }

  // STEP 3 & 4 — Real Network Request (No Mocks/No Fixtures)
  console.log('\n--- STEP 3 & 4: Executing Real Network Request ---');
  const testQuery = 'iphone 16';
  const testLat = 12.9021;
  const testLon = 77.6639;
  const targetPlatforms = ['Amazon', 'Flipkart'];

  console.log(`Provider Endpoint:  GET https://api.quickcommerceapi.com/v1/groupsearch`);
  console.log(`Query:              q="${testQuery}"`);
  console.log(`Coordinates:        lat=${testLat}, lon=${testLon}`);
  console.log(`Target Platforms:   ${targetPlatforms.join(', ')}`);
  console.log(`Auth Mechanism:     X-API-Key Header (Redacted)\n`);

  const startTime = Date.now();
  const liveResult = await adapter.search(testQuery, {
    lat: testLat,
    lon: testLon,
    platforms: targetPlatforms,
  });
  const duration = Date.now() - startTime;

  // STEP 5 — Report Safe Information
  console.log('--- STEP 5: Live Network Response Summary ---');
  console.log(`Request Duration:     ${duration}ms`);
  console.log(`Adapter Status:       ${liveResult.status}`);
  console.log(`Error:                ${liveResult.error || 'None'}`);
  console.log(`Number of Results:    ${liveResult.results.length}`);
  console.log(`Collection Timestamp: ${liveResult.collectedAt}`);

  if (liveResult.status !== 'READY') {
    console.log(`\n❌ Real Connection Failure: Status=${liveResult.status}, Message=${liveResult.error}`);
    return;
  }

  const platformsReturned = Array.from(new Set(liveResult.results.map((r) => r.platform)));
  console.log(`Platforms Returned:   ${platformsReturned.length > 0 ? platformsReturned.join(', ') : 'None'}`);

  // STEP 6 — Verify Normalization on Real Returned Listings
  console.log('\n--- STEP 6: Real Normalized Listings Verification ---');
  if (liveResult.results.length > 0) {
    liveResult.results.slice(0, 3).forEach((item, idx) => {
      console.log(`[Listing ${idx + 1}]`);
      console.log(`  platform:      ${item.platform}`);
      console.log(`  sourceType:    ${item.sourceType}`);
      console.log(`  listingTitle:  ${item.listingTitle}`);
      console.log(`  price:         ₹${item.price} (Type: ${typeof item.price})`);
      console.log(`  originalPrice: ${item.originalPrice ? '₹' + item.originalPrice : 'null'}`);
      console.log(`  discount:      ${item.discount !== null ? item.discount + '%' : 'null'}`);
      console.log(`  inStock:       ${item.inStock} (Type: ${typeof item.inStock})`);
      console.log(`  currency:      ${item.currency}`);
      console.log(`  productUrl:    ${item.productUrl ? 'Present (' + item.productUrl.substring(0, 45) + '...)' : 'null'}`);
      console.log(`  collectedAt:   ${item.collectedAt}`);
      console.log('--------------------------------------------------');
    });

    console.log('\n✅ REAL LIVE SUCCESS: Real current commerce data successfully acquired and normalized.');
  } else {
    console.log('⚠️  Provider returned 0 listings for the requested platforms at coordinates.');
  }
}

runLiveVerification();
