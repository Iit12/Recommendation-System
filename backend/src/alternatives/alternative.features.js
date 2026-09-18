/**
 * Phase 8.2 Alternative Feature Extractor & Specification Comparator
 * Extracts structured product features and computes specification agreement states.
 */

import { ATTRIBUTE_COMPARISON_STATES } from './alternative.constants.js';

// Parse storage string e.g. "128gb", "1tb" into numeric gigabytes
export function parseStorageToGB(str) {
  if (!str || typeof str !== 'string') return null;
  const match = str.trim().toLowerCase().match(/^(\d+)\s*(gb|tb)$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  return unit === 'tb' ? num * 1024 : num;
}

// Parse RAM string e.g. "16gb", "12gb ram" into numeric gigabytes
export function parseRamToGB(str) {
  if (!str || typeof str !== 'string') return null;
  const match = str.trim().toLowerCase().match(/^(\d+)\s*gb/i);
  return match ? parseInt(match[1], 10) : null;
}

// Category Taxonomy Helper
export function inferCategory(product = {}) {
  if (product.category && typeof product.category === 'string' && product.category.trim()) {
    return product.category.trim().toLowerCase();
  }

  const text = `${product.canonicalTitle || product.title || ''} ${product.model || ''} ${product.brand || ''}`.toLowerCase();

  if (/\b(iphone|galaxy\s*s\d+|pixel\s*\d+|smartphone|mobile\s*phone)\b/i.test(text)) {
    return 'smartphones';
  }
  if (/\b(macbook|laptop|thinkpad|zenbook|notebook)\b/i.test(text)) {
    return 'laptops';
  }
  if (/\b(wh[- ]?1000xm\w*|wf[- ]?1000xm\w*|airpods\w*|headphone\w*|earbud\w*|earphones\w*|headset\w*|tws|anc|ch[- ]?720n\w*|nirvana\w*|airdopes\w*|rockerz\w*|audio)\b/i.test(text)) {
    return 'audio';
  }

  return null;
}

export const alternativeFeatureExtractor = {
  /**
   * Builds normalized feature vectors for target and candidate products.
   * 
   * @param {Object} product MongoDB canonical product document
   * @param {number|null} effectivePrice Current lowest effective price
   * @returns {Object} Normalized feature vector
   */
  extractProductFeatures(product = {}, effectivePrice = null) {
    const rawBrand = product.brand ? String(product.brand).toLowerCase().trim() : null;
    const rawModel = product.model ? String(product.model).toLowerCase().trim() : null;
    const rawColor = product.color ? String(product.color).toLowerCase().trim() : null;
    const rawVariant = product.variant ? String(product.variant).toLowerCase().trim() : null;

    const storageGB = parseStorageToGB(product.storage);
    const ramGB = parseRamToGB(product.ram);
    const category = inferCategory(product);

    const price = effectivePrice !== null && !isNaN(effectivePrice) && Number(effectivePrice) > 0
      ? Number(effectivePrice)
      : null;

    return {
      canonicalId: product.canonicalId || product.id,
      canonicalTitle: product.canonicalTitle || product.title || 'Untitled Product',
      brand: rawBrand,
      model: rawModel,
      storage: product.storage ? String(product.storage).toLowerCase().trim() : null,
      storageGB,
      ram: product.ram ? String(product.ram).toLowerCase().trim() : null,
      ramGB,
      color: rawColor,
      variant: rawVariant,
      category,
      effectivePrice: price,
    };
  },

  /**
   * Compares structured specifications between target and candidate product.
   * 
   * @param {Object} targetFeatures 
   * @param {Object} candidateFeatures 
   * @returns {Object} Comparison report with states and ratios
   */
  compareFeatures(targetFeatures, candidateFeatures) {
    // 1. Model / Product Series Comparison
    const modelComparison = this.compareModel(targetFeatures, candidateFeatures);

    // 2. Storage Comparison
    const storageComparison = this.compareStorage(targetFeatures, candidateFeatures);

    // 3. RAM Comparison
    const ramComparison = this.compareRam(targetFeatures, candidateFeatures);

    // 4. Color Comparison
    const colorComparison = this.compareColor(targetFeatures, candidateFeatures);

    // 5. Variant / Form-factor Comparison
    const variantComparison = this.compareVariant(targetFeatures, candidateFeatures);

    // 6. Category Comparison
    const categoryComparison = this.compareCategory(targetFeatures, candidateFeatures);

    // 7. Brand Comparison
    const brandComparison = this.compareBrand(targetFeatures, candidateFeatures);

    // 8. Price Comparison
    const priceComparison = this.comparePrice(targetFeatures, candidateFeatures);

    return {
      model: modelComparison,
      storage: storageComparison,
      ram: ramComparison,
      color: colorComparison,
      variant: variantComparison,
      category: categoryComparison,
      brand: brandComparison,
      price: priceComparison,
    };
  },

  compareModel(target, cand) {
    if (!target.model && !cand.model) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MISSING_BOTH, ratio: 0.5 };
    }
    if (!target.model || !cand.model) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MISSING_ONE, ratio: 0.4 };
    }

    const tModel = target.model.toLowerCase();
    const cModel = cand.model.toLowerCase();

    if (tModel === cModel) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MATCH, ratio: 1.0 };
    }

    // Check same model family (e.g. "iphone 16" vs "iphone 15", or "galaxy s25" vs "galaxy s24")
    const tTokens = tModel.split(/\s+/);
    const cTokens = cModel.split(/\s+/);
    const commonTokens = tTokens.filter((tok) => cTokens.includes(tok));

    if (commonTokens.length > 0 && commonTokens.some((t) => isNaN(t))) {
      const jaccard = commonTokens.length / (new Set([...tTokens, ...cTokens]).size);
      return {
        state: ATTRIBUTE_COMPARISON_STATES.PARTIAL,
        ratio: Math.min(0.85, 0.4 + (jaccard * 0.5)),
      };
    }

    return { state: ATTRIBUTE_COMPARISON_STATES.MISMATCH, ratio: 0.2 };
  },

  compareStorage(target, cand) {
    if (target.storageGB === null && cand.storageGB === null) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MISSING_BOTH, ratio: 0.5 };
    }
    if (target.storageGB === null || cand.storageGB === null) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MISSING_ONE, ratio: 0.5 };
    }

    if (target.storageGB === cand.storageGB) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MATCH, ratio: 1.0 };
    }

    // Ratio of difference for storage steps (e.g. 128 vs 256 is 1 step away -> 0.7)
    const ratioDiff = Math.min(target.storageGB, cand.storageGB) / Math.max(target.storageGB, cand.storageGB);
    return {
      state: ATTRIBUTE_COMPARISON_STATES.PARTIAL,
      ratio: Math.max(0.3, ratioDiff * 0.8),
    };
  },

  compareRam(target, cand) {
    if (target.ramGB === null && cand.ramGB === null) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MISSING_BOTH, ratio: 0.5 };
    }
    if (target.ramGB === null || cand.ramGB === null) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MISSING_ONE, ratio: 0.5 };
    }

    if (target.ramGB === cand.ramGB) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MATCH, ratio: 1.0 };
    }

    const ratioDiff = Math.min(target.ramGB, cand.ramGB) / Math.max(target.ramGB, cand.ramGB);
    return {
      state: ATTRIBUTE_COMPARISON_STATES.PARTIAL,
      ratio: Math.max(0.3, ratioDiff * 0.7),
    };
  },

  compareColor(target, cand) {
    if (!target.color && !cand.color) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MISSING_BOTH, ratio: 0.5 };
    }
    if (!target.color || !cand.color) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MISSING_ONE, ratio: 0.5 };
    }

    if (target.color.toLowerCase() === cand.color.toLowerCase()) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MATCH, ratio: 1.0 };
    }

    return { state: ATTRIBUTE_COMPARISON_STATES.MISMATCH, ratio: 0.25 };
  },

  compareVariant(target, cand) {
    if (!target.variant && !cand.variant) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MISSING_BOTH, ratio: 0.5 };
    }
    if (!target.variant || !cand.variant) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MISSING_ONE, ratio: 0.5 };
    }

    const tTags = target.variant.toLowerCase().split(/[,\s]+/).filter(Boolean);
    const cTags = cand.variant.toLowerCase().split(/[,\s]+/).filter(Boolean);
    const common = tTags.filter((tag) => cTags.includes(tag));

    if (common.length === tTags.length && tTags.length === cTags.length) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MATCH, ratio: 1.0 };
    }
    if (common.length > 0) {
      return { state: ATTRIBUTE_COMPARISON_STATES.PARTIAL, ratio: 0.7 };
    }

    return { state: ATTRIBUTE_COMPARISON_STATES.MISMATCH, ratio: 0.25 };
  },

  compareCategory(target, cand) {
    if (!target.category && !cand.category) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MISSING_BOTH, compatible: true, ratio: 0.5 };
    }
    if (!target.category || !cand.category) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MISSING_ONE, compatible: true, ratio: 0.5 };
    }

    if (target.category === cand.category) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MATCH, compatible: true, ratio: 1.0 };
    }

    return { state: ATTRIBUTE_COMPARISON_STATES.MISMATCH, compatible: false, ratio: 0.0 };
  },

  compareBrand(target, cand) {
    if (!target.brand && !cand.brand) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MISSING_BOTH, ratio: 0.5, sameBrand: false };
    }
    if (!target.brand || !cand.brand) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MISSING_ONE, ratio: 0.5, sameBrand: false };
    }

    if (target.brand.toLowerCase() === cand.brand.toLowerCase()) {
      return { state: ATTRIBUTE_COMPARISON_STATES.MATCH, ratio: 1.0, sameBrand: true };
    }

    // Cross-brand alternative (valid comparison, 0.5 ratio = 5/10 pts)
    return { state: ATTRIBUTE_COMPARISON_STATES.MISMATCH, ratio: 0.5, sameBrand: false };
  },

  comparePrice(target, cand) {
    const pTarget = target?.effectivePrice;
    const pCand = cand?.effectivePrice;

    if (
      pTarget === null ||
      pTarget === undefined ||
      pCand === null ||
      pCand === undefined ||
      isNaN(Number(pTarget)) ||
      isNaN(Number(pCand)) ||
      Number(pTarget) <= 0 ||
      Number(pCand) <= 0
    ) {
      return {
        hasPrice: false,
        deltaAmount: null,
        percentageDifference: null,
        ratio: 0.5, // Neutral baseline (12.5 / 25 pts)
      };
    }

    const numTarget = Number(pTarget);
    const numCand = Number(pCand);
    const deltaAmount = numCand - numTarget;
    const absDelta = Math.abs(deltaAmount);
    const percentageDifference = Number(((absDelta / numTarget) * 100).toFixed(2));

    // Linear price compatibility: 0% diff -> 1.0; 50% diff -> 0.0
    // Score = max(0, 1 - (diff% / 50%))
    const ratio = Math.max(0, Math.min(1.0, 1.0 - (percentageDifference / 50.0)));

    return {
      hasPrice: true,
      deltaAmount,
      percentageDifference,
      ratio,
    };
  }
};
