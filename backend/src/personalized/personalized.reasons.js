/**
 * Phase 8.3 Preference Reason Generator
 * Generates transparent, human-readable explanations based on computed user preference matches.
 */

const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

export const personalizedReasonGenerator = {
  /**
   * Generates explainable reason bullets for a candidate product.
   * 
   * @param {Object} candidateFeatures 
   * @param {Object} preferences Validated user preferences
   * @param {Object} evaluation Metric evaluation output
   * @param {Object} scoreResult Scorer output
   * @returns {Array<string>} List of human-readable justification strings
   */
  generateReasons(candidateFeatures, preferences = {}, evaluation = {}, scoreResult = {}) {
    const reasons = [];
    const { maxBudget, preferredBrands, minStorage, minRam, priorities } = preferences;
    const { budget, storage, ram, brand } = evaluation;

    // 1. Budget Fit
    if (maxBudget !== undefined && maxBudget !== null && candidateFeatures.effectivePrice) {
      if (budget?.withinBudget) {
        reasons.push(`Within your budget of ${formatINR(maxBudget)} (Price: ${formatINR(candidateFeatures.effectivePrice)}).`);
      } else if (budget?.overBudgetPercent !== null && budget?.overBudgetPercent > 0) {
        reasons.push(
          `Slightly exceeds budget at ${formatINR(candidateFeatures.effectivePrice)} (+${budget.overBudgetPercent}% over ${formatINR(maxBudget)}).`
        );
      }
    }

    // 2. Storage Requirement
    if (minStorage !== undefined && minStorage !== null) {
      if (storage?.meetsRequirement && candidateFeatures.storageGB) {
        reasons.push(
          `Offers ${candidateFeatures.storageGB}GB storage, fulfilling your minimum requirement (${minStorage}GB).`
        );
      } else if (!storage?.meetsRequirement && candidateFeatures.storageGB) {
        reasons.push(
          `Below preferred storage (${candidateFeatures.storageGB}GB vs ${minStorage}GB requested).`
        );
      }
    }

    // 3. RAM Requirement
    if (minRam !== undefined && minRam !== null) {
      if (ram?.meetsRequirement && candidateFeatures.ramGB) {
        reasons.push(
          `Provides ${candidateFeatures.ramGB}GB RAM, fulfilling your minimum requirement (${minRam}GB).`
        );
      } else if (!ram?.meetsRequirement && candidateFeatures.ramGB) {
        reasons.push(
          `Below preferred RAM (${candidateFeatures.ramGB}GB vs ${minRam}GB requested).`
        );
      }
    }

    // 4. Brand Match / Cross-Brand Rationale
    if (preferredBrands && preferredBrands.length > 0 && candidateFeatures.brand) {
      const bUpper = candidateFeatures.brand.charAt(0).toUpperCase() + candidateFeatures.brand.slice(1);
      if (brand?.isPreferred) {
        reasons.push(`Matches your preferred brand list (${bUpper}).`);
      } else {
        reasons.push(`Cross-brand alternative (${bUpper}) evaluated based on specification and budget compatibility.`);
      }
    }

    // 5. Priorities Alignment
    if (priorities && typeof priorities === 'object') {
      if (priorities.price && priorities.price >= 0.3 && candidateFeatures.effectivePrice) {
        reasons.push(`Competitive pricing aligns with your high price priority.`);
      }
      if (priorities.storage && priorities.storage >= 0.3 && candidateFeatures.storageGB && candidateFeatures.storageGB >= 256) {
        reasons.push(`High capacity storage (${candidateFeatures.storageGB}GB) matches your storage priority.`);
      }
    }

    // 6. Marketplace Deal Quality
    const dScore = candidateFeatures.dealScore ?? evaluation.dealScore;
    if (dScore !== null && dScore !== undefined && Number(dScore) >= 75) {
      reasons.push(`Strong marketplace deal quality score (${Number(dScore)}/100).`);
    }

    // 7. General Spec Highlight Fallback if reasons are sparse
    if (reasons.length === 0) {
      reasons.push(`Strong specification profile for ${candidateFeatures.canonicalTitle}.`);
    }

    return reasons;
  }
};
