# Smart Shopping — REST API Documentation (v1)

This document details the REST API specification for **Smart Shopping (Phase 2)**.

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

- **Request Headers**: None
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Smart Shopping API is running",
  "environment": "development",
  "timestamp": "2026-09-17T20:10:00.000Z"
}
```

---

### 2.2 Search API

#### `GET /api/v1/search`
Searches product catalog across model names, brands, variants, and categories.

- **Query Parameters**:
  - `q` (*string, required*): Search query (e.g. `iphone 16`, `sony`, `macbook`, `airpods`)
  - `category` (*string, optional*): Filter category (e.g. `smartphones`, `audio`, `laptops`)

- **Example Request**:
```http
GET /api/v1/search?q=iphone+16
```

- **Response (200 OK)**:
```json
{
  "success": true,
  "query": "iphone 16",
  "count": 1,
  "data": [
    {
      "id": "iphone-16",
      "name": "Apple iPhone 16",
      "shortTitle": "iPhone 16 128GB",
      "brand": "Apple",
      "variant": "128GB • Black",
      "color": "Black",
      "category": "Smartphones",
      "image": "https://images.unsplash.com/...",
      "lowestPrice": 68999,
      "originalPrice": 79900,
      "discountPercent": 14,
      "lowestStore": "Flipkart",
      "rating": 4.8,
      "reviewCount": "12,420"
    }
  ]
}
```

- **Possible Errors**:
  - `400 Bad Request` (`MISSING_SEARCH_QUERY`): Query parameter `q` was omitted or empty.

---

### 2.3 Product Catalog API

#### `GET /api/v1/products`
Retrieves all products currently tracked in the catalog.

- **Query Parameters**:
  - `category` (*string, optional*): Filter by category (`all`, `smartphones`, `audio`, `laptops`, `wearables`)

- **Response (200 OK)**:
```json
{
  "success": true,
  "count": 6,
  "category": "all",
  "data": [
    {
      "id": "iphone-16",
      "name": "Apple iPhone 16",
      "brand": "Apple",
      "currentLowestPrice": 68999,
      "originalPrice": 79900,
      "discountPercent": 14,
      "lowestStore": "Flipkart",
      "specs": { ... }
    }
  ]
}
```

---

#### `GET /api/v1/products/:id`
Retrieves detailed specifications and metadata for a single product.

- **URL Parameters**:
  - `id` (*string, required*): Product ID / slug (e.g. `iphone-16`, `sony-wh-1000xm5`)

- **Example Request**:
```http
GET /api/v1/products/iphone-16
```

- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "iphone-16",
    "name": "Apple iPhone 16",
    "brand": "Apple",
    "model": "iPhone 16",
    "variant": "128GB • Black",
    "color": "Black",
    "category": "Smartphones",
    "image": "https://images.unsplash.com/...",
    "currentLowestPrice": 68999,
    "originalPrice": 79900,
    "discountPercent": 14,
    "lowestStore": "Flipkart",
    "rating": 4.8,
    "reviewCount": "12,420",
    "specs": {
      "Brand": "Apple",
      "Model": "iPhone 16",
      "Storage": "128GB",
      "Color": "Black",
      "Display": "6.1-inch Super Retina XDR OLED",
      "Processor": "A18 Bionic Chip",
      "Camera": "48MP Main + 12MP Ultra Wide",
      "Battery": "Up to 22 hours",
      "Warranty": "1 Year Apple Official Warranty"
    }
  }
}
```

- **Possible Errors**:
  - `404 Not Found` (`PRODUCT_NOT_FOUND`): Product ID not recognized.

---

### 2.4 Multi-Store Price Comparison API

#### `GET /api/v1/products/:id/prices`
Fetches real-time price quotes across Amazon, Flipkart, Croma, Blinkit, Zepto, and Instamart.

- **Formula**:
  `effectivePrice = price - discountAmount + deliveryCharge`

- **URL Parameters**:
  - `id` (*string, required*): Product identifier

- **Example Request**:
```http
GET /api/v1/products/iphone-16/prices
```

- **Response (200 OK)**:
```json
{
  "success": true,
  "productId": "iphone-16",
  "productName": "Apple iPhone 16",
  "variant": "128GB • Black",
  "lowestPrice": 68999,
  "savingsMax": 5040,
  "totalStores": 6,
  "updatedAt": "2026-09-17T20:10:00.000Z",
  "data": [
    {
      "platform": "Flipkart",
      "storeId": "flipkart",
      "listingTitle": "Apple iPhone 16 (Black, 128 GB)",
      "price": 68999,
      "discount": 14,
      "deliveryCharge": 0,
      "effectivePrice": 68999,
      "inStock": true,
      "deliveryText": "Free Express Delivery (2 Days)",
      "badge": "Best Price",
      "sellerRating": 4.8,
      "url": "https://www.flipkart.com",
      "isLowest": true
    },
    {
      "platform": "Amazon",
      "storeId": "amazon",
      "listingTitle": "Apple iPhone 16 (128 GB) - Black",
      "price": 70999,
      "discount": 11,
      "deliveryCharge": 0,
      "effectivePrice": 70999,
      "inStock": true,
      "deliveryText": "Free One-Day Prime Delivery",
      "badge": "Prime Delivery",
      "sellerRating": 4.9,
      "url": "https://www.amazon.in",
      "isLowest": false
    },
    {
      "platform": "Croma",
      "storeId": "croma",
      "price": 71499,
      "discount": 10,
      "deliveryCharge": 99,
      "effectivePrice": 71598,
      "isLowest": false
    },
    {
      "platform": "Blinkit",
      "storeId": "blinkit",
      "price": 72999,
      "discount": 8,
      "deliveryCharge": 30,
      "effectivePrice": 73029,
      "isLowest": false
    },
    {
      "platform": "Zepto",
      "storeId": "zepto",
      "price": 73499,
      "discount": 7,
      "deliveryCharge": 29,
      "effectivePrice": 73528,
      "isLowest": false
    },
    {
      "platform": "Instamart",
      "storeId": "instamart",
      "price": 73999,
      "discount": 6,
      "deliveryCharge": 40,
      "effectivePrice": 74039,
      "isLowest": false
    }
  ]
}
```

---

### 2.5 Historical Price Trend API

#### `GET /api/v1/products/:id/trends`
Retrieves price history points and moving averages for `7D`, `30D`, `3M`, or `6M`.

- **Query Parameters**:
  - `period` (*string, optional*): Default `30D`. Supported: `7D`, `30D`, `3M`, `6M`.

- **Example Request**:
```http
GET /api/v1/products/iphone-16/trends?period=30D
```

- **Response (200 OK)**:
```json
{
  "success": true,
  "productId": "iphone-16",
  "period": "30D",
  "stats": {
    "currentPrice": 68999,
    "averagePrice": 71450,
    "lowestPrice": 67999,
    "highestPrice": 75999,
    "changePercent30D": -4.2,
    "trendDirection": "falling",
    "trendLabel": "Falling",
    "volatility": "Low"
  },
  "data": [
    { "date": "2026-08-19", "price": 74999, "avg": 74500 },
    { "date": "2026-08-23", "price": 73999, "avg": 74100 },
    { "date": "2026-08-27", "price": 72999, "avg": 73500 },
    { "date": "2026-08-31", "price": 72499, "avg": 72900 },
    { "date": "2026-09-04", "price": 71999, "avg": 72300 },
    { "date": "2026-09-08", "price": 70999, "avg": 71800 },
    { "date": "2026-09-12", "price": 70499, "avg": 71200 },
    { "date": "2026-09-15", "price": 69499, "avg": 70700 },
    { "date": "2026-09-17", "price": 68999, "avg": 70100 }
  ]
}
```

---

### 2.6 AI Buy Now / Wait Recommendation API

#### `GET /api/v1/products/:id/recommendation`
Returns purchase timing recommendation with confidence scores and market signals.

> **Note**: For Phase 2, this endpoint returns mock recommendation data structured for the future ML engine.

- **Example Request**:
```http
GET /api/v1/products/iphone-16/recommendation
```

- **Response (200 OK)**:
```json
{
  "success": true,
  "productId": "iphone-16",
  "data": {
    "productId": "iphone-16",
    "recommendation": "BUY_NOW",
    "verdict": "BUY NOW",
    "type": "positive",
    "confidence": 88,
    "headline": "Strong Buy Signal — Near Historical Low",
    "reason": "Today's price of ₹68,999 is 3.4% below the 30-day moving average (₹71,450) and within 1.5% of the all-time lowest price recorded on Flipkart.",
    "signals": {
      "currentPrice": 68999,
      "averagePrice": 71450,
      "historicalLow": 67999,
      "trend": "FALLING"
    },
    "signalsList": [
      { "label": "Current Price", "value": "₹68,999", "status": "optimal", "note": "Best across 6 stores" },
      { "label": "30-Day Average", "value": "₹71,450", "status": "neutral", "note": "Save ₹2,451 vs avg" },
      { "label": "Historical Low", "value": "₹67,999", "status": "neutral", "note": "Only ₹1,000 away" },
      { "label": "Price Velocity", "value": "↓ Falling", "status": "optimal", "note": "Down 4.2% this month" }
    ],
    "actionAdvice": "Flipkart currently offers the best deal with free express delivery. Further price drops are unlikely before major holiday sales."
  }
}
```

---

## 3. Error Codes Reference

| Error Code | HTTP Status | Description |
|---|---|---|
| `MISSING_SEARCH_QUERY` | `400` | Search query `q` parameter was not provided |
| `INVALID_PRODUCT_ID` | `400` | Provided product ID is invalid or empty |
| `PRODUCT_NOT_FOUND` | `404` | Product does not exist in catalog |
| `PRICES_NOT_FOUND` | `404` | No price quotes found for product |
| `TRENDS_NOT_FOUND` | `404` | No trend history found for product |
| `RECOMMENDATION_NOT_FOUND` | `404` | No recommendation model data found |
| `ENDPOINT_NOT_FOUND` | `404` | Route does not exist |
| `INTERNAL_SERVER_ERROR` | `500` | Unhandled server error |
