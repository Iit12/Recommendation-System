/**
 * Phase 4 Text Similarity Calculator
 * Deterministic, explainable token-based similarity computation.
 */

import { textNormalizer } from './textNormalizer.js';

export const similarity = {
  /**
   * Computes Jaccard similarity coefficient between two sets of tokens.
   * Jaccard = |A ∩ B| / |A ∪ B|
   * 
   * @param {Set<string>} setA 
   * @param {Set<string>} setB 
   * @returns {number} Score in range [0.0, 1.0]
   */
  jaccard(setA, setB) {
    if (!setA || !setB || setA.size === 0 || setB.size === 0) return 0.0;

    let intersectionCount = 0;
    for (const item of setA) {
      if (setB.has(item)) {
        intersectionCount++;
      }
    }

    const unionCount = setA.size + setB.size - intersectionCount;
    return unionCount > 0 ? intersectionCount / unionCount : 0.0;
  },

  /**
   * Computes Sørensen–Dice coefficient between two sets of tokens.
   * Dice = 2 * |A ∩ B| / (|A| + |B|)
   * 
   * @param {Set<string>} setA 
   * @param {Set<string>} setB 
   * @returns {number} Score in range [0.0, 1.0]
   */
  dice(setA, setB) {
    if (!setA || !setB || setA.size === 0 || setB.size === 0) return 0.0;

    let intersectionCount = 0;
    for (const item of setA) {
      if (setB.has(item)) {
        intersectionCount++;
      }
    }

    return (2.0 * intersectionCount) / (setA.size + setB.size);
  },

  /**
   * Calculates overall deterministic text similarity between two strings.
   * Uses tokenized representations with stopwords removed to measure content affinity.
   * 
   * @param {string} textA 
   * @param {string} textB 
   * @returns {number} Interpretable similarity score rounded to 2 decimal places [0.0 - 1.0]
   */
  calculate(textA, textB) {
    if (!textA || !textB) return 0.0;

    const normA = textNormalizer.normalize(textA);
    const normB = textNormalizer.normalize(textB);

    if (normA === normB) return 1.0;

    const tokensA = textNormalizer.tokenSet(normA);
    const tokensB = textNormalizer.tokenSet(normB);

    if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

    // We blend Dice (sensitive to shared key tokens) and Jaccard (sensitive to vocabulary breadth)
    const diceScore = this.dice(tokensA, tokensB);
    const jaccardScore = this.jaccard(tokensA, tokensB);

    const composite = (diceScore * 0.7) + (jaccardScore * 0.3);

    return Number(composite.toFixed(2));
  }
};
