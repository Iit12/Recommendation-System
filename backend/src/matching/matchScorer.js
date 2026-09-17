/**
 * Phase 4 Attribute-Aware Match Scorer
 * Deterministic scoring engine that synthesizes text similarity with attribute-level validation.
 */

import { similarity } from './similarity.js';
import { attributeExtractor } from './attributeExtractor.js';

/**
 * Evaluates an individual attribute comparison between two listings.
 * 
 * @param {string|null} valA Value from listing A
 * @param {string|null} valB Value from listing B
 * @param {boolean} isCoreIdentity Whether this attribute is core identity (brand, model)
 * @returns {Object} { status: 'MATCH'|'MISMATCH'|'MISSING_ONE'|'MISSING_BOTH', score: number }
 */
function evaluateAttribute(valA, valB, isCoreIdentity = false) {
  if (valA && valB) {
    if (valA === valB) {
      return { status: 'MATCH', score: 1.0 };
    }
    return { status: 'MISMATCH', score: 0.0 };
  }
  if (valA || valB) {
    return { status: 'MISSING_ONE', score: 0.0 };
  }
  // Both null: missing information is NOT positive match evidence
  return {
    status: 'MISSING_BOTH',
    score: isCoreIdentity ? 0.0 : 1.0, // Non-applicable specs (storage/ram for headphones) are neutral
  };
}

export const matchScorer = {
  /**
   * Compares two product listings or titles and generates an explainable match evaluation.
   * 
   * @param {string|Object} itemA Listing title or listing object
   * @param {string|Object} itemB Listing title or listing object
   * @returns {Object} Comprehensive match evaluation report
   */
  score(itemA, itemB) {
    const titleA = typeof itemA === 'string' ? itemA : (itemA.listingTitle || itemA.title || '');
    const titleB = typeof itemB === 'string' ? itemB : (itemB.listingTitle || itemB.title || '');

    const attrsA = typeof itemA === 'object' && itemA.extractedAttributes
      ? itemA.extractedAttributes
      : attributeExtractor.extract(titleA);

    const attrsB = typeof itemB === 'object' && itemB.extractedAttributes
      ? itemB.extractedAttributes
      : attributeExtractor.extract(titleB);

    const textSim = similarity.calculate(titleA, titleB);

    // Evaluate all attribute statuses
    const brandEval = evaluateAttribute(attrsA.brand, attrsB.brand, true);
    const modelEval = evaluateAttribute(attrsA.model, attrsB.model, true);
    const storageEval = evaluateAttribute(attrsA.storage, attrsB.storage, false);
    const ramEval = evaluateAttribute(attrsA.ram, attrsB.ram, false);
    const colorEval = evaluateAttribute(attrsA.color, attrsB.color, false);

    // 1. Check Hard Vetoes on explicit attribute conflicts
    if (brandEval.status === 'MISMATCH') {
      return {
        textSimilarity: textSim,
        brandMatch: 0.0,
        modelMatch: 0.0,
        storageMatch: 0.0,
        ramMatch: 0.0,
        colorMatch: 0.0,
        attributeStatuses: { brand: 'MISMATCH', model: modelEval.status, storage: storageEval.status, ram: ramEval.status, color: colorEval.status },
        finalScore: 0.0,
        decision: 'NOT_MATCH',
        reason: `Brand conflict: "${attrsA.brand}" vs "${attrsB.brand}"`,
      };
    }

    if (modelEval.status === 'MISMATCH') {
      return {
        textSimilarity: textSim,
        brandMatch: brandEval.score,
        modelMatch: 0.0,
        storageMatch: 0.0,
        ramMatch: 0.0,
        colorMatch: 0.0,
        attributeStatuses: { brand: brandEval.status, model: 'MISMATCH', storage: storageEval.status, ram: ramEval.status, color: colorEval.status },
        finalScore: 0.0,
        decision: 'NOT_MATCH',
        reason: `Model conflict: "${attrsA.model}" vs "${attrsB.model}"`,
      };
    }

    if (storageEval.status === 'MISMATCH') {
      return {
        textSimilarity: textSim,
        brandMatch: brandEval.score,
        modelMatch: modelEval.score,
        storageMatch: 0.0,
        ramMatch: 0.0,
        colorMatch: 0.0,
        attributeStatuses: { brand: brandEval.status, model: modelEval.status, storage: 'MISMATCH', ram: ramEval.status, color: colorEval.status },
        finalScore: 0.0,
        decision: 'NOT_MATCH',
        reason: `Storage capacity mismatch: "${attrsA.storage}" vs "${attrsB.storage}"`,
      };
    }

    if (ramEval.status === 'MISMATCH') {
      return {
        textSimilarity: textSim,
        brandMatch: brandEval.score,
        modelMatch: modelEval.score,
        storageMatch: storageEval.score,
        ramMatch: 0.0,
        colorMatch: 0.0,
        attributeStatuses: { brand: brandEval.status, model: modelEval.status, storage: storageEval.status, ram: 'MISMATCH', color: colorEval.status },
        finalScore: 0.0,
        decision: 'NOT_MATCH',
        reason: `RAM specification mismatch: "${attrsA.ram}" vs "${attrsB.ram}"`,
      };
    }

    if (colorEval.status === 'MISMATCH') {
      return {
        textSimilarity: textSim,
        brandMatch: brandEval.score,
        modelMatch: modelEval.score,
        storageMatch: storageEval.score,
        ramMatch: ramEval.score,
        colorMatch: 0.0,
        attributeStatuses: { brand: brandEval.status, model: modelEval.status, storage: storageEval.status, ram: ramEval.status, color: 'MISMATCH' },
        finalScore: 0.0,
        decision: 'NOT_MATCH',
        reason: `Color variant mismatch: "${attrsA.color}" vs "${attrsB.color}"`,
      };
    }

    // Missing-attribute adjustments (cautious handling)
    const storageScore = storageEval.status === 'MISSING_ONE' ? 0.0 : storageEval.score;
    const ramScore = ramEval.status === 'MISSING_ONE' ? 0.0 : ramEval.score;
    const colorScore = colorEval.status === 'MISSING_ONE' ? 0.5 : colorEval.score;

    // 2. Weighted Score Computation
    const weightedScore =
      (textSim * 0.35) +
      (brandEval.score * 0.20) +
      (modelEval.score * 0.25) +
      (storageScore * 0.10) +
      (ramScore * 0.05) +
      (colorScore * 0.05);

    const finalScore = Number(weightedScore.toFixed(2));

    // 3. Conservative Decision Rules
    let decision = 'NOT_MATCH';
    let reason = 'Insufficient title and attribute similarity score';

    if (brandEval.status === 'MISSING_BOTH' && modelEval.status === 'MISSING_BOTH') {
      decision = 'UNKNOWN';
      reason = 'Unrecognized brand and model; insufficient identity evidence to establish canonical match';
    } else if (modelEval.status === 'MISSING_ONE') {
      decision = 'NOT_MATCH';
      reason = 'Generic listing with missing model cannot match a specific model variant';
    } else if (finalScore >= 0.70) {
      decision = 'MATCH';
      reason = 'High token similarity with matching product model and variant specifications';
    }

    return {
      textSimilarity: textSim,
      brandMatch: brandEval.score,
      modelMatch: modelEval.score,
      storageMatch: storageScore,
      ramMatch: ramScore,
      colorMatch: colorScore,
      attributeStatuses: {
        brand: brandEval.status,
        model: modelEval.status,
        storage: storageEval.status,
        ram: ramEval.status,
        color: colorEval.status,
      },
      finalScore,
      decision,
      reason,
    };
  }
};
