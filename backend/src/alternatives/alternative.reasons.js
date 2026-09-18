/**
 * Phase 8.2 Alternative Reason Generator
 * Generates transparent, human-readable reasons from actual computed feature comparisons.
 */

const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

export const alternativeReasonGenerator = {
  /**
   * Generates explainable reason bullets for a candidate alternative.
   * 
   * @param {Object} targetFeatures 
   * @param {Object} candidateFeatures 
   * @param {Object} comparisons 
   * @returns {Array<string>} List of human-readable justification reasons
   */
  generateReasons(targetFeatures, candidateFeatures, comparisons) {
    const reasons = [];

    // 1. Category Alignment
    if (comparisons.category?.state === 'MATCH' && targetFeatures.category) {
      const catName = targetFeatures.category.charAt(0).toUpperCase() + targetFeatures.category.slice(1);
      reasons.push(`Same product category (${catName}).`);
    }

    // 2. Price Proximity & Comparison
    const priceComp = comparisons.price;
    if (priceComp && priceComp.hasPrice) {
      const diffPct = priceComp.percentageDifference;
      const deltaAmt = priceComp.deltaAmount;

      if (diffPct <= 5.0) {
        reasons.push(`Comparable current price (${formatINR(candidateFeatures.effectivePrice)}, within ${diffPct.toFixed(1)}% of target).`);
      } else if (deltaAmt < 0) {
        reasons.push(`Budget-friendly alternative at ${formatINR(candidateFeatures.effectivePrice)}, saving ${formatINR(Math.abs(deltaAmt))} (${diffPct.toFixed(1)}% lower).`);
      } else {
        reasons.push(`Higher-tier alternative at ${formatINR(candidateFeatures.effectivePrice)} (+${diffPct.toFixed(1)}%).`);
      }
    }

    // 3. Brand Compatibility
    if (comparisons.brand?.state === 'MATCH' && candidateFeatures.brand) {
      const brandName = candidateFeatures.brand.charAt(0).toUpperCase() + candidateFeatures.brand.slice(1);
      reasons.push(`Same brand ecosystem (${brandName}).`);
    } else if (candidateFeatures.brand && targetFeatures.brand) {
      const cBrand = candidateFeatures.brand.charAt(0).toUpperCase() + candidateFeatures.brand.slice(1);
      reasons.push(`Cross-brand alternative from ${cBrand}.`);
    }

    // 4. Model Lineage
    if (comparisons.model?.state === 'MATCH') {
      reasons.push(`Matching model variant.`);
    } else if (comparisons.model?.state === 'PARTIAL') {
      reasons.push(`Similar product lineage / device family.`);
    }

    // 5. Storage Comparison
    if (comparisons.storage?.state === 'MATCH' && candidateFeatures.storage) {
      reasons.push(`Matching ${candidateFeatures.storage.toUpperCase()} storage capacity.`);
    } else if (
      targetFeatures.storageGB &&
      candidateFeatures.storageGB &&
      candidateFeatures.storageGB > targetFeatures.storageGB
    ) {
      reasons.push(
        `Higher storage capacity (${candidateFeatures.storage.toUpperCase()} vs ${targetFeatures.storage.toUpperCase()}).`
      );
    }

    // 6. RAM Comparison
    if (comparisons.ram?.state === 'MATCH' && candidateFeatures.ram) {
      reasons.push(`Matching ${candidateFeatures.ram.toUpperCase()} memory.`);
    }

    // 7. Variant / Feature Highlights
    if (candidateFeatures.variant && comparisons.variant?.state === 'MATCH') {
      reasons.push(`Matching specification profile (${candidateFeatures.variant.toUpperCase()}).`);
    } else if (candidateFeatures.variant) {
      reasons.push(`Feature highlights: ${candidateFeatures.variant.toUpperCase()}.`);
    }

    return reasons;
  }
};
