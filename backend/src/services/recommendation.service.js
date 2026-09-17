// Phase 2 mock recommendation.
// Will be replaced by the ML recommendation engine in a later phase.

import { RECOMMENDATIONS_DATA } from '../data/recommendations.data.js';

export const recommendationService = {
  /**
   * Get AI Buy Now / Wait recommendation for a product
   */
  async getRecommendation(productId) {
    if (!productId) return null;
    const cleanId = productId.toLowerCase().trim();

    const rec = RECOMMENDATIONS_DATA[cleanId];
    if (!rec) return null;

    return {
      productId: cleanId,
      recommendation: rec.verdict === 'BUY NOW' ? 'BUY_NOW' : 'WAIT',
      verdict: rec.verdict,
      type: rec.type,
      confidence: rec.confidence,
      headline: rec.headline,
      reason: rec.reason,
      signals: rec.signals,
      signalsList: rec.signalsList,
      confidenceBreakdown: rec.confidenceBreakdown,
      actionAdvice: rec.actionAdvice,
    };
  }
};
