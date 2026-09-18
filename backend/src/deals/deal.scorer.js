/**
 * Phase 8.1 Deal Scorer Engine
 * Pure mathematical heuristic scoring algorithm evaluating the deal quality of a listing on a 0–100 scale.
 */

import {
  DEAL_WEIGHTS,
  DEAL_NEUTRAL_BASELINES,
  DEAL_AVAILABILITY_RULES,
  DEAL_SCORE_BOUNDS,
} from './deal.constants.js';

export const dealScorer = {
  /**
   * Computes Price Position score vs historical average & low (Weight: 40).
   * 
   * @param {number} discountFromAveragePercent ((Avg - EffectivePrice) / Avg) * 100
   * @param {number} premiumOverLowPercent ((EffectivePrice - Low) / Low) * 100
   * @returns {Object} { total: number, priceVsAverage: number, priceVsLow: number }
   */
  scorePricePosition(discountFromAveragePercent, premiumOverLowPercent) {
    // 1. Price vs Average (Max 25 pts, neutral baseline is 12.5 pts)
    const rawVsAvg = DEAL_WEIGHTS.PRICE_VS_AVERAGE / 2 + (discountFromAveragePercent * 1.25);
    const scoreVsAvg = Math.max(0, Math.min(DEAL_WEIGHTS.PRICE_VS_AVERAGE, rawVsAvg));

    // 2. Price vs Low Floor (Max 15 pts, full 15 pts when at or below floor)
    const rawVsLow = DEAL_WEIGHTS.PRICE_VS_LOW - (premiumOverLowPercent * 1.5);
    const scoreVsLow = Math.max(0, Math.min(DEAL_WEIGHTS.PRICE_VS_LOW, rawVsLow));

    const total = Number((scoreVsAvg + scoreVsLow).toFixed(2));
    return {
      total,
      priceVsAverage: Number(scoreVsAvg.toFixed(2)),
      priceVsLow: Number(scoreVsLow.toFixed(2)),
    };
  },

  /**
   * Computes Platform Price Advantage score vs rival stores for same product (Weight: 30).
   * 
   * @param {number} percentageOverCheapest ((Price - MinMarketPrice) / MinMarketPrice) * 100
   * @param {number} platformCount Total stores tracking product
   * @param {number} priceSpread Price difference between highest and lowest store
   * @returns {number} Score component in [0, 30]
   */
  scorePlatformAdvantage(percentageOverCheapest, platformCount, priceSpread) {
    const maxWeight = DEAL_WEIGHTS.PLATFORM_ADVANTAGE;

    // Requirement: If single platform or identical prices across stores, return neutral baseline (15/30)
    if (platformCount <= 1 || priceSpread <= 0) {
      return DEAL_NEUTRAL_BASELINES.PLATFORM_ADVANTAGE_NEUTRAL;
    }

    // Lowest priced listing gets full 30 points
    // More expensive listings lose 3.0 points per 1% premium over the cheapest store
    const rawScore = maxWeight - (percentageOverCheapest * 3.0);
    const score = Math.max(0, Math.min(maxWeight, rawScore));
    return Number(score.toFixed(2));
  },

  /**
   * Computes Retailer Discount score off authentic MRP (Weight: 15).
   * 
   * @param {number|null} discount Stated discount percentage
   * @returns {number} Score component in [0, 15]
   */
  scoreDiscount(discount) {
    const maxWeight = DEAL_WEIGHTS.DISCOUNT;

    // Requirement: If discount data is unavailable, award neutral baseline (7.5/15) without inventing discounts
    if (discount === null || discount === undefined || isNaN(discount) || discount <= 0) {
      return DEAL_NEUTRAL_BASELINES.DISCOUNT_NEUTRAL;
    }

    // Up to 15 points (e.g. 20% discount gives full 15 points)
    const rawScore = discount * 0.75;
    const score = Math.max(0, Math.min(maxWeight, rawScore));
    return Number(score.toFixed(2));
  },

  /**
   * Computes Delivery Charge score (Weight: 10).
   * 
   * @param {number} deliveryCharge Shipping fee in INR
   * @returns {number} Score component in [0, 10]
   */
  scoreDelivery(deliveryCharge) {
    const maxWeight = DEAL_WEIGHTS.DELIVERY;

    if (deliveryCharge <= 0) {
      return maxWeight; // Full 10 points for free delivery
    }

    // Deduct points for delivery fees (e.g. ₹30 -> 8 pts, ₹99 -> 3.4 pts)
    const rawScore = maxWeight - (deliveryCharge / 15);
    const score = Math.max(0, Math.min(maxWeight, rawScore));
    return Number(score.toFixed(2));
  },

  /**
   * Computes Merchant / Seller Rating score (Weight: 5).
   * 
   * @param {number|null} sellerRating Rating out of 5.0
   * @returns {number} Score component in [0, 5]
   */
  scoreSellerRating(sellerRating) {
    const maxWeight = DEAL_WEIGHTS.SELLER_RATING;

    if (sellerRating === null || sellerRating === undefined || isNaN(sellerRating)) {
      return DEAL_NEUTRAL_BASELINES.SELLER_RATING_NEUTRAL; // 3.5 / 5 default
    }

    const clampedRating = Math.max(0, Math.min(5.0, sellerRating));
    const score = (clampedRating / 5.0) * maxWeight;
    return Number(score.toFixed(2));
  },

  /**
   * Calculates the comprehensive Deal Score (0–100) for an individual listing.
   * 
   * @param {Object} listingFeatures Normalized feature object for a single listing
   * @returns {Object} { dealScore, componentScores, overriddenBy }
   */
  calculateScore(listingFeatures) {
    const {
      discountFromAveragePercent,
      premiumOverLowPercent,
      percentageOverCheapest,
      platformCount,
      marketPriceSpread,
      discount,
      deliveryCharge,
      sellerRating,
      inStock,
    } = listingFeatures;

    const pos = this.scorePricePosition(discountFromAveragePercent, premiumOverLowPercent);
    const plat = this.scorePlatformAdvantage(percentageOverCheapest, platformCount, marketPriceSpread);
    const disc = this.scoreDiscount(discount);
    const del = this.scoreDelivery(deliveryCharge);
    const sel = this.scoreSellerRating(sellerRating);

    let rawScore = pos.total + plat + disc + del + sel;
    let overriddenBy = null;

    // Out-of-Stock Constraint: Cap score at 25 if item is unavailable
    if (inStock === false) {
      if (rawScore > DEAL_AVAILABILITY_RULES.OUT_OF_STOCK_MAX_SCORE) {
        rawScore = DEAL_AVAILABILITY_RULES.OUT_OF_STOCK_MAX_SCORE;
        overriddenBy = 'OUT_OF_STOCK';
      }
    }

    const finalScore = Math.max(
      DEAL_SCORE_BOUNDS.MIN,
      Math.min(DEAL_SCORE_BOUNDS.MAX, Math.round(rawScore))
    );

    return {
      dealScore: finalScore,
      componentScores: {
        pricePosition: pos.total,
        priceVsAverage: pos.priceVsAverage,
        priceVsLow: pos.priceVsLow,
        platformAdvantage: plat,
        discount: disc,
        delivery: del,
        sellerRating: sel,
      },
      overriddenBy,
    };
  }
};
