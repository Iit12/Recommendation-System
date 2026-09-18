/**
 * Phase 8.3 Preference-Aware Recommendation Scorer
 * Pure mathematical heuristic scoring algorithm evaluating preference compatibility on a 0–100 scale.
 */

import {
  PERSONALIZED_WEIGHTS,
  PERSONALIZED_NEUTRAL_BASELINES,
  PERSONALIZED_SCORE_BOUNDS,
} from './personalized.constants.js';

export const personalizedScorer = {
  /**
   * Scores Budget Compatibility (Weight: 30).
   * 
   * @param {Object} budgetEval 
   * @returns {number} Score in [0, 30]
   */
  scoreBudget(budgetEval) {
    const maxWeight = PERSONALIZED_WEIGHTS.BUDGET_COMPATIBILITY;

    if (!budgetEval || !budgetEval.hasPreference) {
      return PERSONALIZED_NEUTRAL_BASELINES.BUDGET_NEUTRAL; // 15 / 30 pts
    }

    const raw = maxWeight * (budgetEval.ratio ?? 0.5);
    const score = Math.max(0, Math.min(maxWeight, raw));
    return Number(score.toFixed(2));
  },

  /**
   * Scores Specification Match (Weight: 30).
   * Subdivided into Storage (18 pts) and RAM (12 pts).
   * 
   * @param {Object} storageEval 
   * @param {Object} ramEval 
   * @returns {Object} { total: number, storage: number, ram: number }
   */
  scoreSpecifications(storageEval, ramEval) {
    const subweights = PERSONALIZED_WEIGHTS.SPEC_SUBWEIGHTS;

    const storageScore = storageEval?.hasPreference
      ? subweights.STORAGE * (storageEval.ratio ?? 0.5)
      : PERSONALIZED_NEUTRAL_BASELINES.STORAGE_NEUTRAL;

    const ramScore = ramEval?.hasPreference
      ? subweights.RAM * (ramEval.ratio ?? 0.5)
      : PERSONALIZED_NEUTRAL_BASELINES.RAM_NEUTRAL;

    const clampedStorage = Math.max(0, Math.min(subweights.STORAGE, storageScore));
    const clampedRam = Math.max(0, Math.min(subweights.RAM, ramScore));
    const total = clampedStorage + clampedRam;

    return {
      total: Number(total.toFixed(2)),
      storage: Number(clampedStorage.toFixed(2)),
      ram: Number(clampedRam.toFixed(2)),
    };
  },

  /**
   * Scores Feature Priority Match (Weight: 20).
   * 
   * @param {Object} priorityEval 
   * @returns {number} Score in [0, 20]
   */
  scoreFeaturePriority(priorityEval) {
    const maxWeight = PERSONALIZED_WEIGHTS.FEATURE_PRIORITY_MATCH;

    if (!priorityEval || !priorityEval.hasPreference) {
      return PERSONALIZED_NEUTRAL_BASELINES.PRIORITY_NEUTRAL; // 10 / 20 pts
    }

    const raw = maxWeight * (priorityEval.compositeRatio ?? 0.5);
    const score = Math.max(0, Math.min(maxWeight, raw));
    return Number(score.toFixed(2));
  },

  /**
   * Scores Brand Preference (Weight: 10).
   * 
   * @param {Object} brandEval 
   * @returns {number} Score in [0, 10]
   */
  scoreBrand(brandEval) {
    const maxWeight = PERSONALIZED_WEIGHTS.BRAND_PREFERENCE;

    if (!brandEval || !brandEval.hasPreference) {
      return PERSONALIZED_NEUTRAL_BASELINES.BRAND_NEUTRAL; // 5 / 10 pts
    }

    const raw = maxWeight * (brandEval.ratio ?? 0.5);
    const score = Math.max(0, Math.min(maxWeight, raw));
    return Number(score.toFixed(2));
  },

  /**
   * Scores Marketplace Deal Quality (Weight: 10).
   * Scales Phase 8.1 Deal Score (0–100) -> (0–10).
   * 
   * @param {number|null} dealScore 
   * @returns {number} Score in [0, 10]
   */
  scoreDealQuality(dealScore) {
    const maxWeight = PERSONALIZED_WEIGHTS.DEAL_QUALITY;

    if (dealScore === null || dealScore === undefined || isNaN(dealScore)) {
      return PERSONALIZED_NEUTRAL_BASELINES.DEAL_QUALITY_NEUTRAL; // 5 / 10 pts
    }

    const clampedDealScore = Math.max(0, Math.min(100, dealScore));
    const score = (clampedDealScore / 100.0) * maxWeight;
    return Number(score.toFixed(2));
  },

  /**
   * Calculates the final personalizedScore (0–100) and breakdown for a candidate.
   * 
   * @param {Object} preferenceEvaluation Output from evaluatePreferences
   * @returns {Object} { personalizedScore, breakdown }
   */
  calculateScore(preferenceEvaluation = {}) {
    const { budget, storage, ram, brand, priorities, dealScore } = preferenceEvaluation;

    const budgetScore = this.scoreBudget(budget);
    const specScore = this.scoreSpecifications(storage, ram);
    const priorityScore = this.scoreFeaturePriority(priorities);
    const brandScore = this.scoreBrand(brand);
    const dealQualityScore = this.scoreDealQuality(dealScore);

    const rawTotal = budgetScore + specScore.total + priorityScore + brandScore + dealQualityScore;
    const finalScore = Math.max(
      PERSONALIZED_SCORE_BOUNDS.MIN,
      Math.min(PERSONALIZED_SCORE_BOUNDS.MAX, Math.round(rawTotal))
    );

    return {
      personalizedScore: finalScore,
      breakdown: {
        budgetCompatibility: budgetScore,
        specificationMatch: specScore.total,
        featurePriorityMatch: priorityScore,
        brandPreference: brandScore,
        dealQuality: dealQualityScore,
        specificationDetails: {
          storage: specScore.storage,
          ram: specScore.ram,
        },
      },
    };
  }
};
