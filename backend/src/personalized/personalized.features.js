/**
 * Phase 8.3 Preference Feature Extractor
 * Derives normalized candidate specification metrics and compares them against user preferences.
 */

import { parseStorageToGB, parseRamToGB, inferCategory } from '../alternatives/alternative.features.js';

export const personalizedFeatureExtractor = {
  /**
   * Extracts normalized candidate features for preference evaluation.
   * 
   * @param {Object} candidate Canonical product document
   * @param {number|null} effectivePrice Current lowest effective price
   * @param {number|null} dealScore Phase 8.1 deal score if available
   * @returns {Object} Normalized candidate feature vector
   */
  extractCandidateFeatures(candidate = {}, effectivePrice = null, dealScore = null) {
    const rawBrand = candidate.brand ? String(candidate.brand).toLowerCase().trim() : null;
    const rawModel = candidate.model ? String(candidate.model).toLowerCase().trim() : null;
    const rawVariant = candidate.variant ? String(candidate.variant).toLowerCase().trim() : null;

    const storageGB = parseStorageToGB(candidate.storage);
    const ramGB = parseRamToGB(candidate.ram);
    const category = inferCategory(candidate);

    const price = effectivePrice !== null && !isNaN(effectivePrice) && Number(effectivePrice) > 0
      ? Number(effectivePrice)
      : null;

    const dScore = dealScore !== null && !isNaN(dealScore) && Number(dealScore) >= 0
      ? Number(dealScore)
      : null;

    return {
      canonicalId: candidate.canonicalId || candidate.id,
      canonicalTitle: candidate.canonicalTitle || candidate.title || 'Untitled Product',
      brand: rawBrand,
      model: rawModel,
      storage: candidate.storage ? String(candidate.storage).toLowerCase().trim() : null,
      storageGB,
      ram: candidate.ram ? String(candidate.ram).toLowerCase().trim() : null,
      ramGB,
      color: candidate.color ? String(candidate.color).toLowerCase().trim() : null,
      variant: rawVariant,
      category,
      effectivePrice: price,
      dealScore: dScore,
    };
  },

  /**
   * Compares candidate features against explicit user preferences.
   * 
   * @param {Object} candidateFeatures 
   * @param {Object} preferences Validated user preferences
   * @param {Object} targetFeatures Target product features for context
   * @returns {Object} Metric alignment report
   */
  evaluatePreferences(candidateFeatures, preferences = {}, targetFeatures = {}) {
    const { maxBudget, preferredBrands, minStorage, minRam, priorities } = preferences;

    // 1. Budget Evaluation
    const budgetEval = this.evaluateBudget(candidateFeatures.effectivePrice, maxBudget);

    // 2. Storage Evaluation
    const storageEval = this.evaluateStorage(candidateFeatures.storageGB, minStorage);

    // 3. RAM Evaluation
    const ramEval = this.evaluateRam(candidateFeatures.ramGB, minRam);

    // 4. Brand Evaluation
    const brandEval = this.evaluateBrand(candidateFeatures.brand, preferredBrands);

    // 5. Priority Dimensions Evaluation
    const priorityEval = this.evaluatePriorities(
      candidateFeatures,
      priorities,
      maxBudget,
      targetFeatures
    );

    return {
      budget: budgetEval,
      storage: storageEval,
      ram: ramEval,
      brand: brandEval,
      priorities: priorityEval,
      dealScore: candidateFeatures.dealScore,
    };
  },

  evaluateBudget(effectivePrice, maxBudget) {
    if (maxBudget === undefined || maxBudget === null) {
      return { hasPreference: false, withinBudget: true, overBudgetPercent: 0, ratio: 0.5 };
    }

    if (effectivePrice === null || effectivePrice === undefined || effectivePrice <= 0 || isNaN(effectivePrice)) {
      return { hasPreference: true, withinBudget: false, overBudgetPercent: null, ratio: 0.5 };
    }

    if (effectivePrice <= maxBudget) {
      // Full points for being within budget; slight bonus for staying comfortably below budget
      const savingsRatio = (maxBudget - effectivePrice) / maxBudget;
      const ratio = Math.min(1.0, 0.85 + (savingsRatio * 0.15));
      return { hasPreference: true, withinBudget: true, overBudgetPercent: 0, ratio };
    }

    // Over budget: smooth linear drop-off
    // 0% over -> 0.85 ratio; 20% over budget -> 0.0 ratio
    const overBudgetPercent = ((effectivePrice - maxBudget) / maxBudget) * 100;
    const ratio = Math.max(0, 1.0 - (overBudgetPercent / 20.0));

    return {
      hasPreference: true,
      withinBudget: false,
      overBudgetPercent: Number(overBudgetPercent.toFixed(2)),
      ratio,
    };
  },

  evaluateStorage(storageGB, minStorage) {
    if (minStorage === undefined || minStorage === null) {
      return { hasPreference: false, meetsRequirement: true, ratio: 0.5 };
    }

    if (storageGB === null || storageGB === undefined) {
      return { hasPreference: true, meetsRequirement: false, ratio: 0.3 };
    }

    if (storageGB >= minStorage) {
      return { hasPreference: true, meetsRequirement: true, ratio: 1.0 };
    }

    // Proportional penalty for violating minStorage (e.g. 128GB vs 256GB min -> 0.5 ratio)
    const ratio = Math.max(0.1, storageGB / minStorage);
    return { hasPreference: true, meetsRequirement: false, ratio };
  },

  evaluateRam(ramGB, minRam) {
    if (minRam === undefined || minRam === null) {
      return { hasPreference: false, meetsRequirement: true, ratio: 0.5 };
    }

    if (ramGB === null || ramGB === undefined) {
      return { hasPreference: true, meetsRequirement: false, ratio: 0.3 };
    }

    if (ramGB >= minRam) {
      return { hasPreference: true, meetsRequirement: true, ratio: 1.0 };
    }

    const ratio = Math.max(0.1, ramGB / minRam);
    return { hasPreference: true, meetsRequirement: false, ratio };
  },

  evaluateBrand(brand, preferredBrands) {
    if (!preferredBrands || !Array.isArray(preferredBrands) || preferredBrands.length === 0) {
      return { hasPreference: false, isPreferred: false, ratio: 0.5 };
    }

    if (!brand) {
      return { hasPreference: true, isPreferred: false, ratio: 0.5 };
    }

    const isPreferred = preferredBrands.includes(brand.toLowerCase());
    return {
      hasPreference: true,
      isPreferred,
      ratio: isPreferred ? 1.0 : 0.5,
    };
  },

  evaluatePriorities(candidateFeatures, priorities, maxBudget, targetFeatures) {
    if (!priorities || typeof priorities !== 'object') {
      return { hasPreference: false, compositeRatio: 0.5 };
    }

    let weightedSum = 0;
    let activeWeight = 0;

    // Dimension 1: Price
    if (priorities.price !== undefined) {
      const w = priorities.price;
      const refPrice = maxBudget || targetFeatures.effectivePrice || 50000;
      const cPrice = candidateFeatures.effectivePrice || refPrice;
      const priceRatio = cPrice <= refPrice
        ? Math.min(1.0, 0.6 + ((refPrice - cPrice) / refPrice) * 0.4)
        : Math.max(0, 0.6 - ((cPrice - refPrice) / refPrice) * 0.6);

      weightedSum += w * priceRatio;
      activeWeight += w;
    }

    // Dimension 2: Storage
    if (priorities.storage !== undefined) {
      const w = priorities.storage;
      const s = candidateFeatures.storageGB || 64;
      // 128GB -> 0.6, 256GB -> 0.8, 512GB+ -> 1.0
      const storageRatio = s >= 512 ? 1.0 : s >= 256 ? 0.8 : s >= 128 ? 0.6 : 0.4;
      weightedSum += w * storageRatio;
      activeWeight += w;
    }

    // Dimension 3: Performance (RAM)
    if (priorities.performance !== undefined) {
      const w = priorities.performance;
      const r = candidateFeatures.ramGB || 6;
      // 16GB+ -> 1.0, 12GB -> 0.85, 8GB -> 0.7, <8GB -> 0.5
      const perfRatio = r >= 16 ? 1.0 : r >= 12 ? 0.85 : r >= 8 ? 0.7 : 0.5;
      weightedSum += w * perfRatio;
      activeWeight += w;
    }

    // Dimension 4: Brand
    if (priorities.brand !== undefined) {
      const w = priorities.brand;
      const brandRatio = candidateFeatures.brand ? 0.8 : 0.5;
      weightedSum += w * brandRatio;
      activeWeight += w;
    }

    const compositeRatio = activeWeight > 0 ? weightedSum / activeWeight : 0.5;
    return {
      hasPreference: true,
      compositeRatio: Math.max(0, Math.min(1.0, compositeRatio)),
    };
  }
};
