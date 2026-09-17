# Smart Shopping — REST API Documentation (v1)

This document details the REST API specification for **Smart Shopping** across Phase 2 (Backend Foundation) and Phase 3 (Data Collection Layer).

- **Base URL**: `http://127.0.0.1:5000`
- **API Prefix**: `/api/v1`
- **Content-Type**: `application/json`

---

## 1. Response Standard

### Standard Success Format
```json
{
  "success": true,
  "data": { ... }
}
```

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

---

## 2. API Endpoints

### 2.1 Health Check

#### `GET /api/health`
Checks whether the Express server is active and healthy.

- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Smart Shopping API is running",
  "environment": "development",
  "timestamp": "2026-09-17T23:00:00.000Z"
}
```

---

### 2.2 Data Collection API (Phase 3)

#### `GET /api/v1/collect/search`
Collects and normalizes product listings across 6 supported e-commerce and quick-commerce platform adapters in parallel.

> **Architecture Note**: In Phase 3, this endpoint utilizes controlled platform adapters with mock datasets simulating real-world title discrepancies across retailers. The adapters are architected for plug-and-play replacement with live APIs or web connectors in future phases without altering downstream consumers.

- **Query Parameters**:
  - `q` (*string, required*): Search query (minimum 2 characters, e.g. `iphone 16`, `sony wh-1000xm5`, `macbook`).
  - `platforms` (*string, optional*): Comma-separated list of platform IDs to query.
    - Supported Platform IDs: `amazon`, `flipkart`, `croma`, `blinkit`, `zepto`, `instamart`.
    - If omitted, queries all 6 platforms.

- **Example Request**:
```http
GET /api/v1/collect/search?q=iphone+16&platforms=amazon,flipkart,croma
```

- **Response (200 OK)**:
```json
{
  "success": true,
  "query": "iphone 16",
  "collectedAt": "2026-09-17T23:05:00.000Z",
  "platformsRequested": [
    "amazon",
    "flipkart",
    "croma"
  ],
  "platformsSuccessful": [
    "amazon",
    "flipkart",
    "croma"
  ],
  "totalListings": 3,
  "data": [
    {
      "platform": "Amazon",
      "storeId": "amazon",
      "listingTitle": "Apple iPhone 16 (128 GB) - Black",
      "productUrl": "https://www.amazon.in/dp/B0DGJ6SDF8",
      "price": 70999,
      "originalPrice": 79900,
      "discount": 11,
      "deliveryCharge": 0,
      "effectivePrice": 70999,
      "currency": "INR",
      "inStock": true,
      "deliveryText": "Free One-Day Prime Delivery",
      "sellerName": "Appario Retail Pvt Ltd",
      "sellerRating": 4.9,
      "collectedAt": "2026-09-17T23:05:00.000Z"
    },
    {
      "platform": "Flipkart",
      "storeId": "flipkart",
      "listingTitle": "Apple iPhone 16 (Black, 128 GB)",
      "productUrl": "https://www.flipkart.com/apple-iphone-16-black-128-gb/p/itm16blk128",
      "price": 68999,
      "originalPrice": 79900,
      "discount": 14,
      "deliveryCharge": 0,
      "effectivePrice": 68999,
      "currency": "INR",
      "inStock": true,
      "deliveryText": "Free Express Delivery (2 Days)",
      "sellerName": "SuperComNet Flipkart Assured",
      "sellerRating": 4.8,
      "collectedAt": "2026-09-17T23:05:00.000Z"
    },
    {
      "platform": "Croma",
      "storeId": "croma",
      "listingTitle": "Apple iPhone 16 (128GB Storage, Black)",
      "productUrl": "https://www.croma.com/apple-iphone-16-128gb-black/p/274812",
      "price": 71499,
      "originalPrice": 79900,
      "discount": 10,
      "deliveryCharge": 99,
      "effectivePrice": 71598,
      "currency": "INR",
      "inStock": true,
      "deliveryText": "Same Day Store Pickup / ₹99 Home Delivery",
      "sellerName": "Croma Retail Electronics",
      "sellerRating": 4.7,
      "collectedAt": "2026-09-17T23:05:00.000Z"
    }
  ]
}
```

- **Possible Errors**:
  - `400 Bad Request` (`MISSING_SEARCH_QUERY`): Query parameter `q` was not supplied or is empty.
  - `400 Bad Request` (`INVALID_QUERY`): Query string is less than 2 characters.
  - `400 Bad Request` (`UNSUPPORTED_PLATFORM`): One or more requested platforms in `platforms` parameter is unrecognized.

---

### 2.3 Search API

#### `GET /api/v1/search`
Searches product catalog across model names, brands, variants, and categories.

- **Query Parameters**:
  - `q` (*string, required*): Search query (e.g. `iphone 16`, `sony`, `macbook`, `airpods`)
  - `category` (*string, optional*): Filter category (e.g. `smartphones`, `audio`, `laptops`)

---

### 2.4 Product Catalog API

#### `GET /api/v1/products`
Retrieves all products currently tracked in the catalog.

#### `GET /api/v1/products/:id`
Retrieves detailed specifications and metadata for a single product.

---

### 2.5 Multi-Store Price Comparison API

#### `GET /api/v1/products/:id/prices`
Fetches normalized price quotes across Amazon, Flipkart, Croma, Blinkit, Zepto, and Instamart.

- **Formula**: `effectivePrice = price - discountAmount + deliveryCharge`

---

### 2.6 Historical Price Trend API

#### `GET /api/v1/products/:id/trends`
Retrieves price history points and moving averages for `7D`, `30D`, `3M`, or `6M`.

---

### 2.7 AI Buy Now / Wait Recommendation API

#### `GET /api/v1/products/:id/recommendation`
Returns purchase timing recommendation with confidence scores and market signals.

---

## 3. Error Codes Reference

| Error Code | HTTP Status | Description |
|---|---|---|
| `MISSING_SEARCH_QUERY` | `400` | Search query `q` parameter was not provided or is empty |
| `INVALID_QUERY` | `400` | Search query is less than 2 characters |
| `UNSUPPORTED_PLATFORM` | `400` | One or more requested platforms in `platforms` filter is invalid |
| `INVALID_PRODUCT_ID` | `400` | Provided product ID is invalid or empty |
| `PRODUCT_NOT_FOUND` | `404` | Product does not exist in catalog |
| `PRICES_NOT_FOUND` | `404` | No price quotes found for product |
| `TRENDS_NOT_FOUND` | `404` | No trend history found for product |
| `RECOMMENDATION_NOT_FOUND` | `404` | No recommendation model data found |
| `ENDPOINT_NOT_FOUND` | `404` | Route does not exist |
| `INTERNAL_SERVER_ERROR` | `500` | Unhandled server error |
