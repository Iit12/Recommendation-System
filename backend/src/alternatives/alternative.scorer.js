/**
 * Phase 8.2 Alternative Recommendation Scorer
 * Pure mathematical heuristic scoring algorithm evaluating alternative product compatibility (0–100).
 */

import {
  ALTERNATIVE_WEIGHTS,
  ALTERNATIVE_NEUTRAL_BASELINES,
  ALTERNATIVE_SCORE_BOUNDS,
} from './alternative.constants.js';

export const alternativeScorer = {
  /**
   * Scores feature / specification similarity (Weight: 50).
   * 
   * @param {Object} comparisons 
   * @returns {Object} { total: number, model: number, storage: number, ram: number, variant: number, color: number }
   */
  scoreFeatureSimilarity(comparisons) {
    const subweights = ALTERNATIVE_WEIGHTS.FEATURE_SUBWEIGHTS;

    const modelScore = subweights.MODEL_FAMILY * (comparisons.model?.ratio ?? 0.4);
    const storageScore = subweights.STORAGE * (comparisons.storage?.ratio ?? 0.5);
    const ramScore = subweights.RAM * (comparisons.ram?.ratio ?? 0.5);
    const variantScore = subweights.VARIANT * (comparisons.variant?.ratio ?? 0.5);
    const colorScore = subweights.COLOR * (comparisons.color?.ratio ?? 0.5);

    const total = Math.max(
      0,
      Math.min(
        ALTERNATIVE_WEIGHTS.FEATURE_SIMILARITY,
        modelScore + storageScore + ramScore + variantScore + colorScore
      )
    );

    return {
      total: Number(total.toFixed(2)),
      model: Number(modelScore.toFixed(2)),
      storage: Number(storageScore.toFixed(2)),
      ram: Number(ramScore.toFixed(2)),
      variant: Number(variantScore.toFixed(2)),
      color: Number(colorScore.toFixed(2)),
    };
  },

  /**
   * Scores price compatibility / budget proximity (Weight: 25).
   * 
   * @param {Object} priceComparison 
   * @returns {number} Score component in [0, 25]
   */
  scorePriceCompatibility(priceComparison) {
    const maxWeight = ALTERNATIVE_WEIGHTS.PRICE_COMPATIBILITY;

    if (!priceComparison || !priceComparison.hasPrice) {
      return ALTERNATIVE_NEUTRAL_BASELINES.PRICE_COMPATIBILITY_NEUTRAL;
    }

    const raw = maxWeight * (priceComparison.ratio ?? 0.5);
    const score = Math.max(0, Math.min(maxWeight, raw));
    return Number(score.toFixed(2));
  },

  /**
   * Scores category compatibility (Weight: 15).
   * 
   * @param {Object} categoryComparison 
   * @returns {number} Score component in [0, 15]
   */
  scoreCategoryCompatibility(categoryComparison) {
    const maxWeight = ALTERNATIVE_WEIGHTS.CATEGORY_COMPATIBILITY;

    if (!categoryComparison) {
      return ALTERNATIVE_NEUTRAL_BASELINES.CATEGORY_COMPATIBILITY_NEUTRAL;
    }

    const raw = maxWeight * (categoryComparison.ratio ?? 0.5);
    const score = Math.max(0, Math.min(maxWeight, raw));
    return Number(score.toFixed(2));
  },

  /**
   * Scores brand / variant compatibility (Weight: 10).
   * 
   * @param {Object} brandComparison 
   * @returns {number} Score component in [0, 10]
   */
  scoreBrandVariant(brandComparison) {
    const maxWeight = ALTERNATIVE_WEIGHTS.BRAND_VARIANT;

    if (!brandComparison) {
      return ALTERNATIVE_NEUTRAL_BASELINES.BRAND_MISSING;
    }

    const raw = maxWeight * (brandComparison.ratio ?? 0.5);
    const score = Math.max(0, Math.min(maxWeight, raw));
    return Number(score.toFixed(2));
  },

  /**
   * Computes the overall recommendation score (0–100) for a candidate alternative.
   * 
   * @param {Object} comparisons Specification and metric comparison report
   * @returns {Object} { recommendationScore, breakdown }
   */
  calculateScore(comparisons) {
    const feat = this.scoreFeatureSimilarity(comparisons);
    const price = this.scorePriceCompatibility(comparisons.price);
    const cat = this.scoreCategoryCompatibility(comparisons.category);
    const brand = this.scoreBrandVariant(comparisons.brand);

    const rawTotal = feat.total + price + cat + brand;
    const finalScore = Math.max(
      ALTERNATIVE_SCORE_BOUNDS.MIN,
      Math.min(ALTERNATIVE_SCORE_BOUNDS.MAX, Math.round(rawTotal))
    );

    return {
      recommendationScore: finalScore,
      breakdown: {
        featureSimilarity: feat.total,
        priceCompatibility: price,
        categoryCompatibility: cat,
        brandVariantCompatibility: brand,
        featureDetails: {
          model: feat.model,
          storage: feat.storage,
          ram: feat.ram,
          variant: feat.variant,
          color: feat.color,
        },
      },
    };
  }
};
