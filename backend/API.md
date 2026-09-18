# Smart Shopping — REST API Documentation (v1)

This document details the REST API specification for **Smart Shopping** across Phase 2 (Backend Foundation), Phase 3 (Data Collection Layer), Phase 4 (Explainable NLP Product Matching), Phase 5 (MongoDB Historical Price Persistence), and Phase 6 (Price Trend Analysis Engine).

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

### 2.2 Price Trend Analysis API (Phase 6)

Phase 6 implements a pure statistical price trend analysis engine built directly on the historical price observations stored in MongoDB (Phase 5).

> **Methodology & Mathematical Formulations**:
> - **Statistical Determinism**: Phase 6 uses transparent statistical and arithmetic formulations. It does **not** use machine learning models or black-box predictions.
> - **Price Change Formula**:
>   $$\Delta P = P_{\text{latest}} - P_{\text{first}}$$
>   $$\Delta P\% = \frac{P_{\text{latest}} - P_{\text{first}}}{P_{\text{first}}} \times 100$$
> - **Directional Trend Classification** (configurable baseline threshold $\pm 1.0\%$):
>   - $\Delta P\% < -1.0\% \implies$ `DECREASING`
>   - $\Delta P\% > +1.0\% \implies$ `INCREASING`
>   - $|\Delta P\%| \le 1.0\% \implies$ `STABLE`
>   - $0$ observations $\implies$ `NO_DATA`
>   - $1$ observation $\implies$ `INSUFFICIENT_DATA` (single observation cannot establish a directional trajectory)
> - **Price Volatility Metrics**:
>   - Population Standard Deviation: $\sigma = \sqrt{\frac{1}{N} \sum_{i=1}^N (P_i - \mu)^2}$
>   - Coefficient of Variation: $CV = \frac{\sigma}{\mu} \times 100$
> - **Out-of-Stock Policy**: Historical observations where `inStock: false` remain included in historical price movement calculations to maintain pricing continuity, while `latestInStock` accurately reports the current availability status of the latest observation.
> - **Malformed Record Handling**: Invalid price observations (e.g. negative numbers, `NaN`, non-parseable timestamps) are safely excluded from calculations and counted under `invalidObservationCount`.

#### `GET /api/v1/trends/products/:productId`
Calculates overall historical price trend, volatility, and summary metrics for a canonical product from MongoDB.

- **Query Parameters**:
  - `from` (*string, optional*): Start date filter (ISO format e.g. `2026-09-01`).
  - `to` (*string, optional*): End date filter (ISO format e.g. `2026-09-18`).

- **Example Request**:
```http
GET /api/v1/trends/products/apple-iphone-16-128gb-black?from=2026-09-01&to=2026-09-18
```

- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "productId": "apple-iphone-16-128gb-black",
    "canonicalTitle": "Apple Iphone 16 (128GB, Black)",
    "brand": "apple",
    "model": "iphone 16",
    "filter": {
      "from": "2026-09-01",
      "to": "2026-09-18"
    },
    "currentPrice": 70999,
    "firstPrice": 70999,
    "lowestPrice": 68999,
    "highestPrice": 74039,
    "averagePrice": 72032.67,
    "priceChange": 0,
    "percentageChange": 0,
    "trend": "STABLE",
    "volatility": {
      "standardDeviation": 1718.23,
      "coefficientOfVariation": 2.3854
    },
    "observationCount": 18,
    "invalidObservationCount": 0,
    "firstObservedAt": "2026-09-17T19:45:17.633Z",
    "lastObservedAt": "2026-09-17T20:06:28.192Z",
    "latestInStock": true
  }
}
```

#### `GET /api/v1/trends/products/:productId/platforms`
Calculates isolated trend and volatility statistics separately for each retailer platform (Amazon, Flipkart, Croma, Blinkit, Zepto, Instamart).

- **Query Parameters**:
  - `from` (*string, optional*): Start date filter.
  - `to` (*string, optional*): End date filter.

- **Example Request**:
```http
GET /api/v1/trends/products/apple-iphone-16-128gb-black/platforms
```

- **Response (200 OK)**:
```json
{
  "success": true,
  "productId": "apple-iphone-16-128gb-black",
  "canonicalTitle": "Apple Iphone 16 (128GB, Black)",
  "filter": {
    "from": null,
    "to": null
  },
  "platformsCount": 6,
  "data": {
    "Amazon": {
      "currentPrice": 70999,
      "firstPrice": 70999,
      "lowestPrice": 70999,
      "highestPrice": 70999,
      "averagePrice": 70999,
      "priceChange": 0,
      "percentageChange": 0,
      "trend": "STABLE",
      "volatility": {
        "standardDeviation": 0,
        "coefficientOfVariation": 0
      },
      "observationCount": 3,
      "invalidObservationCount": 0,
      "firstObservedAt": "2026-09-17T19:45:17.633Z",
      "lastObservedAt": "2026-09-17T20:06:28.192Z",
      "latestInStock": true
    },
    "Flipkart": {
      "currentPrice": 68999,
      "firstPrice": 68999,
      "lowestPrice": 68999,
      "highestPrice": 68999,
      "averagePrice": 68999,
      "priceChange": 0,
      "percentageChange": 0,
      "trend": "STABLE",
      "volatility": {
        "standardDeviation": 0,
        "coefficientOfVariation": 0
      },
      "observationCount": 3,
      "invalidObservationCount": 0,
      "firstObservedAt": "2026-09-17T19:45:17.633Z",
      "lastObservedAt": "2026-09-17T20:06:28.192Z",
      "latestInStock": true
    }
  }
}
```

- **Possible Errors**:
  - `400 Bad Request` (`INVALID_PRODUCT_ID`): Product ID is missing or empty.
  - `400 Bad Request` (`INVALID_DATE_RANGE`): Start date (`from`) is after end date (`to`) or date format is invalid.
  - `404 Not Found` (`PRODUCT_NOT_FOUND`): Canonical product does not exist in catalog.

---

### 2.3 Historical Price Persistence & Retrieval API (Phase 5)

Phase 5 establishes a real MongoDB persistence layer for immutable historical price observations across 3 normalized collections (`products`, `listings`, and `price_history`).

> **Database Architecture**:
> - **Database**: `smart_shopping` (MongoDB 8.x native driver, no Mongoose).
> - **Append-Only Principle**: Price observations are strictly append-only; historical prices are never overwritten.
> - **Collections**:
>   - `products`: Canonical products produced by Phase 4 matching with unique index on `canonicalId`.
>   - `listings`: Retailer-specific listings with compound unique index on `{ platform: 1, productUrl: 1 }` and foreign reference `productId`.
>   - `price_history`: Append-only time-series observations indexed on `{ productId: 1, collectedAt: -1 }`, `{ platform: 1, productId: 1, collectedAt: -1 }`, and `{ listingId: 1, collectedAt: -1 }`.

#### `POST /api/v1/history/collect`
Runs the Phase 3 Collection $\to$ Phase 4 Matching $\to$ Phase 5 MongoDB Persistence pipeline.

- **Request Body**:
```json
{
  "query": "iphone 16",
  "platforms": ["amazon", "flipkart", "croma", "blinkit", "zepto", "instamart"]
}
```

- **Response (200 OK)**:
```json
{
  "success": true,
  "query": "iphone 16",
  "collectedAt": "2026-09-17T19:45:17.633Z",
  "platformsRequested": ["amazon", "flipkart", "croma", "blinkit", "zepto", "instamart"],
  "platformsSuccessful": ["amazon", "flipkart", "croma", "blinkit", "zepto", "instamart"],
  "totalListings": 6,
  "totalCanonicalProducts": 1,
  "productsUpserted": 1,
  "listingsUpserted": 6,
  "observationsSaved": 6,
  "data": [
    {
      "canonicalId": "apple-iphone-16-128gb-black",
      "canonicalTitle": "Apple Iphone 16 (128GB, Black)",
      "listingsCount": 6,
      "observationsSaved": 6
    }
  ]
}
```

#### `GET /api/v1/history/products/:productId`
Retrieves chronological price observation timeline for a canonical product with optional date-range filtering.

- **Query Parameters**:
  - `from` (*string, optional*): Start date filter (ISO format e.g. `2026-09-01`).
  - `to` (*string, optional*): End date filter (ISO format e.g. `2026-09-18`).
  - `limit` (*number, optional*): Maximum observation records to return (default 200).

- **Example Request**:
```http
GET /api/v1/history/products/apple-iphone-16-128gb-black?from=2026-09-01&to=2026-09-18
```

- **Response (200 OK)**:
```json
{
  "success": true,
  "productId": "apple-iphone-16-128gb-black",
  "canonicalTitle": "Apple Iphone 16 (128GB, Black)",
  "brand": "apple",
  "model": "iphone 16",
  "totalObservations": 6,
  "filter": {
    "from": "2026-09-01",
    "to": "2026-09-18"
  },
  "data": [
    {
      "_id": "6aac434d64c9e1692b6908cc",
      "productId": "apple-iphone-16-128gb-black",
      "listingId": "amazon-7e7ba7e99312",
      "platform": "Amazon",
      "price": 70999,
      "originalPrice": 79900,
      "discount": 11,
      "deliveryCharge": 0,
      "effectivePrice": 70999,
      "currency": "INR",
      "inStock": true,
      "deliveryText": "Free One-Day Prime Delivery",
      "collectedAt": "2026-09-17T19:45:17.633Z"
    }
  ]
}
```

#### `GET /api/v1/history/products/:productId/latest`
Returns the latest recorded price observation per platform for a canonical product.

- **Response (200 OK)**:
```json
{
  "success": true,
  "productId": "apple-iphone-16-128gb-black",
  "canonicalTitle": "Apple Iphone 16 (128GB, Black)",
  "platformsCount": 6,
  "data": [
    {
      "platform": "Flipkart",
      "price": 68999,
      "effectivePrice": 68999,
      "collectedAt": "2026-09-17T19:45:17.633Z"
    },
    {
      "platform": "Amazon",
      "price": 70999,
      "effectivePrice": 70999,
      "collectedAt": "2026-09-17T19:45:17.633Z"
    }
  ]
}
```

#### `GET /api/v1/history/products/:productId/summary`
Returns basic historical price summary statistics needed for future trend analysis (Phase 6).

- **Response (200 OK)**:
```json
{
  "success": true,
  "productId": "apple-iphone-16-128gb-black",
  "canonicalTitle": "Apple Iphone 16 (128GB, Black)",
  "data": {
    "productId": "apple-iphone-16-128gb-black",
    "currentPrice": 68999,
    "lowestPrice": 68999,
    "highestPrice": 74039,
    "averagePrice": 72032,
    "observationCount": 6,
    "platformsTracked": ["Amazon", "Flipkart", "Croma", "Blinkit", "Zepto", "Instamart"],
    "firstObservedAt": "2026-09-17T19:45:17.633Z",
    "lastObservedAt": "2026-09-17T19:45:17.633Z"
  }
}
```

---

### 2.3 Explainable NLP Product Matching API (Phase 4)

#### `GET /api/v1/matching/search`
Executes an explainable, deterministic NLP matching and grouping pipeline. It retrieves multi-platform normalized listings from Phase 3, normalizes listing titles, extracts structured specification attributes, computes token similarity alongside attribute agreement, and clusters identical product variants into canonical groups.

> **Architecture & NLP Methodology**:
> - **Deterministic Text Normalizer**: Lowercases text, cleans noise punctuation and separators, unifies units (`128 GB` $\to$ `128gb`, `12 GB RAM` $\to$ `12gb ram`, `13.6-inch` $\to$ `13.6inch`), standardizes generations and processor tags (`2nd generation` $\to$ `2nd gen`, `M4 chip` $\to$ `m4`), and removes non-informative stopwords.
> - **Rule-Based Attribute Extractor**: Extracts `brand`, `model`, `storage`, `ram`, `color`, and `variant` using regex patterns and dictionary lookups.
> - **Interpretable Text Similarity**: Computes composite Dice ($70\%$) and Jaccard ($30\%$) token coefficients, producing a score in range $[0.0, 1.0]$.
> - **Attribute-Aware Match Scorer & Strict Vetoes**: Synthesizes token similarity with attribute agreement:
>   - Hard Veto: Conflicting brands, models, storage sizes, RAM, or colors trigger an immediate rejection (`decision: "NOT_MATCH"`, `finalScore: 0.0`).
>   - Weighted Formula: $\text{FinalScore} = 0.35 \times \text{TextSim} + 0.20 \times \text{BrandMatch} + 0.25 \times \text{ModelMatch} + 0.10 \times \text{StorageMatch} + 0.05 \times \text{RamMatch} + 0.05 \times \text{ColorMatch}$.
>   - Decision Threshold: `MATCH` if $\text{FinalScore} \ge 0.70$, else `NOT_MATCH`.
> - **Canonical Product Grouper**: Forms product clusters, synthesizes canonical specifications and title, computes live price summary (`minEffectivePrice`, `maxEffectivePrice`, `bestPlatform`, `bestPrice`, `priceSpread`), and preserves all 14 original Phase 3 listing metadata fields.
> - **Limitations**: This is an explainable, rule-based NLP system designed for determinism and interpretability, not a deep learning or statistical model.

- **Query Parameters**:
  - `q` (*string, required*): Search query (minimum 2 characters, e.g. `iphone 16`, `sony`, `macbook`).
  - `platforms` (*string, optional*): Comma-separated list of platform IDs to filter (e.g. `amazon,flipkart,croma`).

- **Example Request**:
```http
GET /api/v1/matching/search?q=iphone+16
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
    "croma",
    "blinkit",
    "zepto",
    "instamart"
  ],
  "platformsSuccessful": [
    "amazon",
    "flipkart",
    "croma",
    "blinkit",
    "zepto",
    "instamart"
  ],
  "totalListings": 6,
  "totalProductGroups": 1,
  "groups": [
    {
      "groupId": "apple-iphone-16-128gb-black",
      "canonicalProduct": {
        "title": "Apple Iphone 16 (128GB, Black)",
        "brand": "apple",
        "model": "iphone 16",
        "storage": "128gb",
        "ram": null,
        "color": "black",
        "variant": null
      },
      "matchScore": 1,
      "totalListings": 6,
      "priceSummary": {
        "minEffectivePrice": 68999,
        "maxEffectivePrice": 74039,
        "bestPlatform": "Flipkart",
        "bestPrice": 68999,
        "priceSpread": 5040,
        "averagePrice": 72108
      },
      "listings": [
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
        }
      ]
    }
  ]
}
```

- **Possible Errors**:
  - `400 Bad Request` (`MISSING_SEARCH_QUERY`): Query parameter `q` was not supplied or is empty.
  - `400 Bad Request` (`INVALID_QUERY`): Query string is less than 2 characters.
  - `400 Bad Request` (`UNSUPPORTED_PLATFORM`): One or more requested platforms in `platforms` filter is invalid.

---

### 2.3 Data Collection API (Phase 3)

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

### 2.3 Heuristic Recommendation Engine API (Phase 7.1)

Phase 7.1 implements an explainable, deterministic recommendation engine built on real MongoDB historical price data and Phase 6 trend statistics.

> **Methodology & Heuristic Architecture**:
> - **Deterministic Heuristic**: This engine is a deterministic rule-based heuristic system, **not a trained machine-learning model or black-box probability generator**.
> - **Scoring Scale (0–100)**:
>   - Score $\ge 65 \implies$ `BUY_NOW`
>   - Score $\le 40 \implies$ `WAIT`
>   - $41 \le \text{Score} < 65 \implies$ `NEUTRAL` (balanced or conflicting evidence)
> - **Component Weights (Sum = 100)**:
>   1. `PRICE_VS_AVERAGE` ($35\%$): Evaluates discount/premium relative to historical arithmetic mean.
>   2. `PRICE_VS_LOW` ($25\%$): Evaluates proximity to the all-time recorded floor.
>   3. `TREND_MOMENTUM` ($20\%$): Evaluates directional trajectory (falling prices suggest waiting; rising prices from a low base suggest buying).
>   4. `PLATFORM_ADVANTAGE` ($10\%$): Evaluates cross-retailer deal spread.
>   5. `VOLATILITY_FACTOR` ($10\%$): Evaluates price consistency and damps high volatility toward neutral.
> - **Explainable Conflict Exposing**: Transparently explains conflicting signals (e.g. current price is below average, but downward momentum suggests waiting for further drops).
> - **Out-of-Stock Constraints**: Out-of-stock items are capped ($\le 35$) and can never receive `BUY_NOW`.

#### `GET /api/v1/recommendations/products/:productId`
Computes explainable purchase recommendation, heuristic score, component breakdowns, and supporting evidence.

- **Query Parameters**:
  - `from` (*string, optional*): Start date filter (ISO format e.g. `2026-09-01`).
  - `to` (*string, optional*): End date filter (ISO format e.g. `2026-09-18`).

- **Example Request**:
  ```http
  GET /api/v1/recommendations/products/apple-iphone-16-128gb-black
  ```

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "product": {
        "productId": "apple-iphone-16-128gb-black",
        "canonicalTitle": "Apple Iphone 16 (128GB, Black)",
        "brand": "apple",
        "model": "iphone 16"
      },
      "recommendation": {
        "action": "NEUTRAL",
        "score": 63,
        "type": "HEURISTIC",
        "componentScores": {
          "priceVsAverage": 22.5,
          "priceVsLow": 17.75,
          "trendMomentum": 5.0,
          "platformAdvantage": 10.0,
          "volatility": 8.0
        }
      },
      "reasons": [
        "Current price of ₹70,999 is 1.4% below the historical average of ₹72,032.",
        "Current price is within 2.9% of the historical low (₹68,999).",
        "Recent price momentum is downward (-4.1%), suggesting prices may drop further if you wait.",
        "Flipkart currently offers the best price at ₹68,999 with a ₹5,040 (7.3%) cross-retailer advantage.",
        "Product is confirmed in stock across tracked retailers."
      ],
      "evidence": {
        "currentPrice": 70999,
        "historicalAverage": 72032,
        "historicalLow": 68999,
        "historicalHigh": 74039,
        "priceChange": -3040,
        "priceChangePercent": -4.1059,
        "trend": "DECREASING",
        "standardDeviation": 1718.27,
        "coefficientOfVariation": 2.3854,
        "observations": 36,
        "latestInStock": true
      },
      "platform": {
        "bestPlatform": "Flipkart",
        "bestPrice": 68999,
        "priceSpread": 5040,
        "platformSpreadPercent": 7.3
      },
      "filter": {
        "from": null,
        "to": null
      },
      "limitations": [
        "Recommendation is derived from a deterministic heuristic algorithm, not a trained machine-learning model.",
        "Historical observations reflect prices collected across tracked multi-platform listings in MongoDB.",
        "Marketplace prices, stock levels, and promotional discounts may fluctuate without prior notice."
      ]
    }
  }
  ```

- **Possible Errors**:
  - `400 Bad Request` (`INVALID_PRODUCT_ID`): Product ID is empty or invalid.
  - `400 Bad Request` (`INVALID_DATE_RANGE`): `from` date is after `to` date or date format is malformed.
  - `404 Not Found` (`PRODUCT_NOT_FOUND`): Canonical product ID not found in database.

---

### 2.4 Deal Score & Best Deal Ranking API (Phase 8.1)

Phase 8.1 implements a multi-attribute deal evaluation and ranking engine that evaluates every current retailer listing for a product on a normalized $[0, 100]$ score, ranks them deterministically, and identifies the `bestDeal`.

> **Methodology & Heuristic Architecture**:
> - **Deterministic Heuristic**: This engine uses transparent arithmetic calculations and rule-based weights. It is **not a machine-learning or predictive model**.
> - **Distinct from Phase 7**: Phase 7 evaluates purchase timing (`BUY_NOW`/`WAIT`/`NEUTRAL`), whereas Phase 8.1 evaluates listing quality across competing stores.
> - **Component Weights (Sum = 100)**:
>   1. `PRICE_POSITION` ($40\%$): Compares listing effective price against historical average and recorded low.
>   2. `PLATFORM_ADVANTAGE` ($30\%$): Evaluates price competitiveness against competing active retailer listings. Neutral baseline $15 / 30$ when only 1 listing exists.
>   3. `DISCOUNT_PERCENTAGE` ($15\%$): Evaluates listed promotional discount percentage against original MSRP.
>   4. `DELIVERY_FEE` ($10\%$): Full 10 points for free delivery; scaled penalty for shipping charges.
>   5. `SELLER_RATING` ($5\%$): Evaluates seller reputation score on a 5-star scale.
> - **Out-of-Stock Constraints**: Out-of-stock listings are capped at score $\le 25$ and strictly ineligible for `bestDeal` candidacy.
> - **Tie-Breaking Determinism**:
>   1. `dealScore` descending
>   2. `effectivePrice` ascending (lower price wins)
>   3. `sellerRating` descending
>   4. `platform` alphabetical
> - **Best Deal Selection**: The highest-ranked in-stock listing is selected as `bestDeal`. If all listings are out of stock, `bestDeal` is `null`.

#### `GET /api/v1/deals/products/:productId`
Calculates deal scores for all active retailer listings of a product, ranks them, identifies the `bestDeal`, and generates explainable deal reasons.

- **Query Parameters**:
  - `from` (*string, optional*): Start date filter for historical reference baseline (ISO format e.g. `2026-09-01`).
  - `to` (*string, optional*): End date filter for historical reference baseline (ISO format e.g. `2026-09-18`).

- **Example Request**:
  ```http
  GET /api/v1/deals/products/apple-iphone-16-128gb-black
  ```

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "product": {
        "productId": "apple-iphone-16-128gb-black",
        "canonicalTitle": "Apple Iphone 16 (128GB, Black)",
        "brand": "apple",
        "model": "iphone 16"
      },
      "bestDeal": {
        "rank": 1,
        "listingId": "flipkart-928ab01c",
        "platform": "Flipkart",
        "price": 68999,
        "deliveryCharge": 0,
        "effectivePrice": 68999,
        "dealScore": 88,
        "inStock": true,
        "sellerName": "SuperComNet Flipkart Assured",
        "sellerRating": 4.8,
        "reasons": [
          "Current price of ₹68,999 is 4.2% below the historical average of ₹72,032.",
          "Cheapest store price at ₹68,999 with a ₹5,040 (7.3%) advantage over the highest store.",
          "14% discount from original MSRP (₹79,900).",
          "Includes free delivery.",
          "High seller rating of 4.8★ (SuperComNet Flipkart Assured)."
        ]
      },
      "rankedListings": [
        {
          "rank": 1,
          "listingId": "flipkart-928ab01c",
          "platform": "Flipkart",
          "listingTitle": "Apple iPhone 16 (Black, 128 GB)",
          "productUrl": "https://www.flipkart.com/apple-iphone-16-black-128-gb/p/itm16blk128",
          "price": 68999,
          "originalPrice": 79900,
          "discount": 14,
          "deliveryCharge": 0,
          "effectivePrice": 68999,
          "sellerName": "SuperComNet Flipkart Assured",
          "sellerRating": 4.8,
          "inStock": true,
          "deliveryText": "Free Express Delivery (2 Days)",
          "dealScore": 88,
          "componentScores": {
            "pricePosition": 38.5,
            "platformAdvantage": 30.0,
            "discount": 10.5,
            "delivery": 10.0,
            "sellerRating": 4.8
          },
          "overriddenBy": null,
          "reasons": [
            "Current price of ₹68,999 is 4.2% below the historical average of ₹72,032.",
            "Cheapest store price at ₹68,999 with a ₹5,040 (7.3%) advantage over the highest store.",
            "14% discount from original MSRP (₹79,900).",
            "Includes free delivery.",
            "High seller rating of 4.8★ (SuperComNet Flipkart Assured)."
          ]
        },
        {
          "rank": 2,
          "listingId": "amazon-7e7ba7e9",
          "platform": "Amazon",
          "listingTitle": "Apple iPhone 16 (128 GB) - Black",
          "productUrl": "https://www.amazon.in/dp/B0DGJ6SDF8",
          "price": 70999,
          "originalPrice": 79900,
          "discount": 11,
          "deliveryCharge": 0,
          "effectivePrice": 70999,
          "sellerName": "Appario Retail Pvt Ltd",
          "sellerRating": 4.9,
          "inStock": true,
          "deliveryText": "Free One-Day Prime Delivery",
          "dealScore": 79,
          "componentScores": {
            "pricePosition": 35.0,
            "platformAdvantage": 21.3,
            "discount": 8.25,
            "delivery": 10.0,
            "sellerRating": 4.9
          },
          "overriddenBy": null,
          "reasons": [
            "Current price of ₹70,999 is 1.4% below the historical average of ₹72,032.",
            "Competitive price at ₹70,999 with ₹3,040 savings compared to the highest store.",
            "11% discount from original MSRP (₹79,900).",
            "Includes free delivery.",
            "High seller rating of 4.9★ (Appario Retail Pvt Ltd)."
          ]
        }
      ],
      "market": {
        "lowestPrice": 68999,
        "highestPrice": 74039,
        "priceSpread": 5040,
        "platformCount": 6,
        "inStockCount": 6
      },
      "scoring": {
        "type": "HEURISTIC",
        "weights": {
          "pricePosition": 40,
          "platformAdvantage": 30,
          "discount": 15,
          "delivery": 10,
          "sellerRating": 5
        }
      },
      "filter": {
        "from": null,
        "to": null
      },
      "limitations": [
        "Deal scores are computed via a deterministic multi-factor heuristic algorithm, not machine learning.",
        "Rankings are calculated based on currently tracked listings in MongoDB.",
        "Store pricing, delivery fees, and stock availability may change dynamically on retailer platforms."
      ]
    }
  }
  ```

- **Possible Errors**:
  - `400 Bad Request` (`INVALID_PRODUCT_ID`): Product ID is empty or invalid.
  - `400 Bad Request` (`INVALID_DATE_RANGE`): `from` date is after `to` date or date format is malformed.
  - `404 Not Found` (`PRODUCT_NOT_FOUND`): Canonical product ID not found in database.

---

### 2.5 Content-Based Alternative Product Recommendation API (Phase 8.2)

Phase 8.2 implements an explainable, deterministic content-based recommendation engine that identifies relevant alternative products from the catalog based on structured specification matching, category alignment, and price budget proximity.

> **Methodology & Heuristic Architecture**:
> - **Deterministic Content-Based Engine**: Pure specification and pricing compatibility comparison. **No user history, collaborative filtering, or black-box machine learning**.
> - **Component Weights (Sum = 100)**:
>   1. `FEATURE_SIMILARITY` ($50\%$): Evaluates structured attributes (Model Family $20\text{ pts}$, Storage $10\text{ pts}$, RAM $8\text{ pts}$, Variant $8\text{ pts}$, Color $4\text{ pts}$).
>   2. `PRICE_COMPATIBILITY` ($25\%$): Evaluates budget proximity ($\Delta P\% = \frac{|P_{\text{cand}} - P_{\text{target}}|}{P_{\text{target}}} \times 100$). Full 25 points at 0% delta; linearly drops to 0 at $\ge 50\%$ delta.
>   3. `CATEGORY_COMPATIBILITY` ($15\%$): 15 points for matching category; incompatible categories are filtered out.
>   4. `BRAND_VARIANT` ($10\%$): Same brand $= 10\text{ pts}$, valid cross-brand alternative $= 5\text{ pts}$.
> - **Candidate Filtering**: Prevents self-recommendation (target product excluded) and filters out conflicting categories.
> - **Deterministic Tie-Breaking**:
>   1. `recommendationScore` descending
>   2. `currentPrice` ascending (lower price among equal scores)
>   3. `canonicalId` alphabetical

#### `GET /api/v1/alternatives/products/:productId`
Calculates content-based alternative product recommendations for a target product.

- **Query Parameters**:
  - `limit` (*number, optional*): Maximum number of alternative products to return (default `5`, min `1`, max `50`).

- **Example Request**:
  ```http
  GET /api/v1/alternatives/products/apple-iphone-16-128gb-black?limit=5
  ```

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "targetProduct": {
        "canonicalId": "apple-iphone-16-128gb-black",
        "canonicalTitle": "Apple Iphone 16 (128GB, Black)",
        "brand": "apple",
        "model": "iphone 16",
        "category": "smartphones",
        "currentPrice": 68999
      },
      "recommendations": [
        {
          "rank": 1,
          "canonicalId": "samsung-galaxy-s25",
          "title": "Samsung Galaxy S25 5G (Titanium Gray, 256GB Storage)",
          "brand": "samsung",
          "model": "galaxy s25",
          "storage": "256gb",
          "ram": "12gb",
          "color": "titanium gray",
          "variant": "5g",
          "category": "smartphones",
          "currentPrice": 74999,
          "recommendationScore": 79,
          "breakdown": {
            "featureSimilarity": 38.0,
            "priceCompatibility": 21.0,
            "categoryCompatibility": 15.0,
            "brandVariantCompatibility": 5.0
          },
          "reasons": [
            "Same product category (Smartphones).",
            "Comparable current price (₹74,999, within 8.7% of target).",
            "Cross-brand alternative from Samsung.",
            "Higher storage capacity (256GB vs 128GB)."
          ]
        }
      ],
      "metadata": {
        "candidateCount": 5,
        "recommendationCount": 1,
        "limit": 5,
        "algorithm": "CONTENT_BASED_HEURISTIC",
        "weights": {
          "featureSimilarity": 50,
          "priceCompatibility": 25,
          "categoryCompatibility": 15,
          "brandVariantCompatibility": 10
        },
        "deterministic": true
      },
      "limitations": [
        "Alternative recommendations are calculated via a deterministic content-based heuristic algorithm, not machine learning or collaborative filtering.",
        "Recommendations reflect specification similarity and price proximity across canonical products currently in the database.",
        "Prices and product availability across retailers may change in real time."
      ]
    }
  }
  ```

- **Possible Errors**:
  - `400 Bad Request` (`INVALID_PRODUCT_ID`): Product ID is empty or invalid.
  - `400 Bad Request` (`INVALID_LIMIT`): Limit is not an integer or outside range $[1, 50]$.
  - `404 Not Found` (`PRODUCT_NOT_FOUND`): Canonical product ID not found in database.

---

### 2.4 Search API

#### `GET /api/v1/search`
Searches product catalog across model names, brands, variants, and categories.

- **Query Parameters**:
  - `q` (*string, required*): Search query (e.g. `iphone 16`, `sony`, `macbook`, `airpods`)
  - `category` (*string, optional*): Filter category (e.g. `smartphones`, `audio`, `laptops`)

---

### 2.5 Product Catalog API

#### `GET /api/v1/products`
Retrieves all products currently tracked in the catalog.

#### `GET /api/v1/products/:id`
Retrieves detailed specifications and metadata for a single product.

---

### 2.6 Multi-Store Price Comparison API

#### `GET /api/v1/products/:id/prices`
Fetches normalized price quotes across Amazon, Flipkart, Croma, Blinkit, Zepto, and Instamart.

- **Formula**: `effectivePrice = price - discountAmount + deliveryCharge`

---

### 2.7 Historical Price Trend API

#### `GET /api/v1/products/:id/trends`
Retrieves price history points and moving averages for `7D`, `30D`, `3M`, or `6M`.

---

### 2.8 Legacy Product Recommendation API (Phase 2)

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
| `INVALID_DATE_RANGE` | `400` | Start date is later than end date or malformed date string |
| `PRODUCT_NOT_FOUND` | `404` | Product does not exist in catalog |
| `PRICES_NOT_FOUND` | `404` | No price quotes found for product |
| `TRENDS_NOT_FOUND` | `404` | No trend history found for product |
| `RECOMMENDATION_NOT_FOUND` | `404` | No recommendation model data found |
| `ENDPOINT_NOT_FOUND` | `404` | Route does not exist |
| `INTERNAL_SERVER_ERROR` | `500` | Unhandled server error |
