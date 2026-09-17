/**
 * Phase 4 Deterministic Matching Test Data
 * Provides standardized test fixtures for matching validation scenarios A through G.
 */

export const MATCHING_TEST_CASES = {
  // Test Case A: Same product, different title ordering
  caseA: {
    name: 'Same product, different title ordering',
    titleA: 'Apple iPhone 16 (128 GB) - Black',
    titleB: 'Apple iPhone 16 (Black, 128 GB)',
    expectedDecision: 'MATCH',
  },

  // Test Case B: Same product, formatting difference
  caseB: {
    name: 'Same product, formatting difference',
    titleA: 'Apple iPhone 16 128GB Black',
    titleB: 'apple iphone 16 128 gb black',
    expectedDecision: 'MATCH',
  },

  // Test Case C: Different storage capacity
  caseC: {
    name: 'Different storage capacity',
    titleA: 'Apple iPhone 16 128GB Black',
    titleB: 'Apple iPhone 16 256GB Black',
    expectedDecision: 'NOT_MATCH',
  },

  // Test Case D: Different model / tier
  caseD: {
    name: 'Different model tier',
    titleA: 'Apple iPhone 16 128GB Black',
    titleB: 'Apple iPhone 16 Pro 128GB Black',
    expectedDecision: 'NOT_MATCH',
  },

  // Test Case E: Different color variant
  caseE: {
    name: 'Different color variant',
    titleA: 'Apple iPhone 16 128GB Black',
    titleB: 'Apple iPhone 16 128GB Pink',
    expectedDecision: 'NOT_MATCH',
  },

  // Test Case F: Sony WH-1000XM5 cross-retailer titles
  caseF: {
    name: 'Sony WH-1000XM5 headphone cross-retailer titles',
    titleA: 'Sony WH-1000XM5 Wireless Industry Leading ANC Headphones - Silver',
    titleB: 'SONY WH-1000XM5 Over-Ear Noise Cancelling Headphones (Silver, Bluetooth 5.2)',
    expectedDecision: 'MATCH',
  },

  // Test Case G: Multi-platform normalized listings (iPhone 16 128GB Black across 6 platforms)
  caseG: {
    name: 'Multi-platform iPhone 16 128GB Black grouping',
    listings: [
      {
        platform: 'Amazon',
        storeId: 'amazon',
        listingTitle: 'Apple iPhone 16 (128 GB) - Black',
        productUrl: 'https://www.amazon.in/dp/B0DGJ6SDF8',
        price: 70999,
        originalPrice: 79900,
        discount: 11,
        deliveryCharge: 0,
        effectivePrice: 70999,
        currency: 'INR',
        inStock: true,
        deliveryText: 'Free One-Day Prime Delivery',
        sellerName: 'Appario Retail Pvt Ltd',
        sellerRating: 4.9,
      },
      {
        platform: 'Flipkart',
        storeId: 'flipkart',
        listingTitle: 'Apple iPhone 16 (Black, 128 GB)',
        productUrl: 'https://www.flipkart.com/apple-iphone-16-black-128-gb/p/itm16blk128',
        price: 68999,
        originalPrice: 79900,
        discount: 14,
        deliveryCharge: 0,
        effectivePrice: 68999,
        currency: 'INR',
        inStock: true,
        deliveryText: 'Free Express Delivery (2 Days)',
        sellerName: 'SuperComNet Flipkart Assured',
        sellerRating: 4.8,
      },
      {
        platform: 'Croma',
        storeId: 'croma',
        listingTitle: 'Apple iPhone 16 (128GB Storage, Black)',
        productUrl: 'https://www.croma.com/apple-iphone-16-128gb-black/p/274812',
        price: 71499,
        originalPrice: 79900,
        discount: 10,
        deliveryCharge: 99,
        effectivePrice: 71598,
        currency: 'INR',
        inStock: true,
        deliveryText: 'Same Day Store Pickup / ₹99 Home Delivery',
        sellerName: 'Croma Retail Electronics',
        sellerRating: 4.7,
      },
      {
        platform: 'Blinkit',
        storeId: 'blinkit',
        listingTitle: 'Apple iPhone 16 128GB Black',
        productUrl: 'https://blinkit.com/prn/apple-iphone-16-128gb-black/prid/598212',
        price: 72999,
        originalPrice: 79900,
        discount: 8,
        deliveryCharge: 30,
        effectivePrice: 73029,
        currency: 'INR',
        inStock: true,
        deliveryText: '12-Minute Instant Delivery',
        sellerName: 'Blinkit DarkStore Hub',
        sellerRating: 4.9,
      },
      {
        platform: 'Zepto',
        storeId: 'zepto',
        listingTitle: 'iPhone 16 128 GB (Black Edition)',
        productUrl: 'https://www.zeptonow.com/pn/iphone-16-128-gb-black-edition/pvid/791823',
        price: 73499,
        originalPrice: 79900,
        discount: 7,
        deliveryCharge: 29,
        effectivePrice: 73528,
        currency: 'INR',
        inStock: true,
        deliveryText: '10-Minute Superfast Delivery',
        sellerName: 'Zepto Express DarkStore',
        sellerRating: 4.8,
      },
      {
        platform: 'Instamart',
        storeId: 'instamart',
        listingTitle: 'Apple iPhone 16 - 128GB Black',
        productUrl: 'https://www.swiggy.com/instamart/item/apple-iphone-16-black-128gb/iid/901284',
        price: 73999,
        originalPrice: 79900,
        discount: 6,
        deliveryCharge: 40,
        effectivePrice: 74039,
        currency: 'INR',
        inStock: true,
        deliveryText: '15-Minute Instant Handover',
        sellerName: 'Instamart Tech Superstore',
        sellerRating: 4.7,
      },
    ],
    expectedGroupCount: 1,
    expectedTotalListings: 6,
  }
};
