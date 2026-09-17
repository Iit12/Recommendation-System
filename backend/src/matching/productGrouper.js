/**
 * Phase 4 Product Grouper
 * Aggregates normalized listings across multiple retailers into canonical product groups.
 */

import { attributeExtractor } from './attributeExtractor.js';
import { matchScorer } from './matchScorer.js';

export const productGrouper = {
  /**
   * Builds canonical title from extracted attributes and raw title fallback.
   */
  generateCanonicalTitle(attrs, fallbackTitle = '') {
    const parts = [];
    if (attrs.brand) {
      parts.push(attrs.brand.charAt(0).toUpperCase() + attrs.brand.slice(1));
    }
    if (attrs.model) {
      // Capitalize model words
      const capModel = attrs.model
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      parts.push(capModel);
    }

    const specParts = [];
    if (attrs.ram) specParts.push(attrs.ram.toUpperCase());
    if (attrs.storage) specParts.push(attrs.storage.toUpperCase());
    if (attrs.color) {
      specParts.push(attrs.color.charAt(0).toUpperCase() + attrs.color.slice(1));
    }

    if (specParts.length > 0) {
      parts.push(`(${specParts.join(', ')})`);
    }

    if (parts.length > 0) {
      return parts.join(' ');
    }

    return fallbackTitle;
  },

  /**
   * Generates a stable URL-safe group identifier.
   */
  generateGroupId(attrs, index = 1) {
    const segments = [];
    if (attrs.brand) segments.push(attrs.brand);
    if (attrs.model) segments.push(attrs.model.replace(/\s+/g, '-'));
    if (attrs.storage) segments.push(attrs.storage);
    if (attrs.ram) segments.push(attrs.ram.replace(/\s+/g, '-'));
    if (attrs.color) segments.push(attrs.color.replace(/\s+/g, '-'));

    if (segments.length > 0) {
      return segments.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
    }

    return `group-product-${index}`;
  },

  /**
   * Calculates pricing metrics across all listings in a group.
   */
  calculatePriceSummary(listings = []) {
    if (!listings || listings.length === 0) {
      return {
        minEffectivePrice: 0,
        maxEffectivePrice: 0,
        bestPlatform: 'N/A',
        bestPrice: 0,
        priceSpread: 0,
        averagePrice: 0,
      };
    }

    let minEffectivePrice = Infinity;
    let maxEffectivePrice = -Infinity;
    let bestPlatform = listings[0].platform;
    let bestPrice = listings[0].effectivePrice;
    let totalPrice = 0;

    for (const item of listings) {
      const eff = item.effectivePrice || item.price || 0;
      totalPrice += eff;

      if (eff < minEffectivePrice) {
        minEffectivePrice = eff;
        bestPlatform = item.platform;
        bestPrice = eff;
      }
      if (eff > maxEffectivePrice) {
        maxEffectivePrice = eff;
      }
    }

    return {
      minEffectivePrice,
      maxEffectivePrice,
      bestPlatform,
      bestPrice,
      priceSpread: maxEffectivePrice - minEffectivePrice,
      averagePrice: Math.round(totalPrice / listings.length),
    };
  },

  /**
   * Groups an array of normalized listings into canonical product clusters.
   * 
   * @param {Array<Object>} normalizedListings Array of Phase 3 normalized listing objects
   * @returns {Array<Object>} Array of canonical product groups
   */
  groupListings(normalizedListings = []) {
    if (!Array.isArray(normalizedListings) || normalizedListings.length === 0) {
      return [];
    }

    // Enrich all listings with extracted attributes
    const enrichedListings = normalizedListings.map((listing) => {
      const attrs = attributeExtractor.extract(listing.listingTitle);
      return {
        ...listing,
        extractedAttributes: attrs,
      };
    });

    const groups = [];

    for (const listing of enrichedListings) {
      let matchedGroup = null;
      let highestScore = 0;
      let bestScoreBreakdown = null;

      // Try to match listing against existing groups
      for (const group of groups) {
        // Compare with the canonical representation and lead listing of the group
        const evaluation = matchScorer.score(listing, group.leadListing);

        if (evaluation.decision === 'MATCH' && evaluation.finalScore > highestScore) {
          highestScore = evaluation.finalScore;
          matchedGroup = group;
          bestScoreBreakdown = evaluation;
        }
      }

      if (matchedGroup) {
        // Add to existing group
        matchedGroup.listings.push(listing);
        matchedGroup.scores.push(highestScore);
      } else {
        // Create a new canonical product group
        const canonicalAttrs = { ...listing.extractedAttributes };
        const canonicalTitle = this.generateCanonicalTitle(canonicalAttrs, listing.listingTitle);
        const groupId = this.generateGroupId(canonicalAttrs, groups.length + 1);

        groups.push({
          groupId,
          leadListing: listing,
          canonicalProduct: {
            title: canonicalTitle,
            brand: canonicalAttrs.brand,
            model: canonicalAttrs.model,
            storage: canonicalAttrs.storage,
            ram: canonicalAttrs.ram,
            color: canonicalAttrs.color,
            variant: canonicalAttrs.variant,
          },
          scores: [1.0],
          listings: [listing],
        });
      }
    }

    // Finalize groups: compute average match scores and price summaries, clean up internal lead references
    return groups.map((group) => {
      const avgScore = Number(
        (group.scores.reduce((a, b) => a + b, 0) / group.scores.length).toFixed(2)
      );
      const priceSummary = this.calculatePriceSummary(group.listings);

      // Clean extractedAttributes from listings if we want strictly standard Phase 3 listing objects
      const cleanListings = group.listings.map((item) => {
        const { extractedAttributes, ...originalPhase3Fields } = item;
        return originalPhase3Fields;
      });

      return {
        groupId: group.groupId,
        canonicalProduct: group.canonicalProduct,
        matchScore: avgScore,
        totalListings: cleanListings.length,
        priceSummary,
        listings: cleanListings,
      };
    });
  }
};
