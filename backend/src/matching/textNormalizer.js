/**
 * Phase 4 Text Normalizer
 * Deterministic NLP text processing and standardisation for product titles and specifications.
 */

export const textNormalizer = {
  /**
   * Normalizes a raw product title or text snippet.
   * - Lowercases text
   * - Cleans punctuation and brackets
   * - Standardizes unit formats (e.g., "128 GB" -> "128gb", "12 GB RAM" -> "12gb ram")
   * - Unifies common product terms (e.g., "2nd generation" -> "2nd gen", "m4 chip" -> "m4")
   * - Removes noise punctuation while keeping alphanumeric tokens and key hyphenated units
   * - Collapses multi-spaces
   * 
   * @param {string} text Raw input string
   * @returns {string} Normalized string
   */
  normalize(text) {
    if (!text || typeof text !== 'string') return '';

    let cleaned = text.toLowerCase().trim();

    // 1. Replace brackets, separators, and quotes with single space
    cleaned = cleaned.replace(/[()[\]{},:;|\\/—–_+"]/g, ' ');

    // 2. Standardize standalone dashes/hyphens (keep intra-word hyphens like wh-1000xm5, usb-c)
    cleaned = cleaned.replace(/\s+-\s+/g, ' ');
    cleaned = cleaned.replace(/^-+\s*|\s*-+$/g, ' ');

    // 3. Standardize storage units: "128 gb", "128gb", "128 gigabytes" -> "128gb"
    cleaned = cleaned.replace(/\b(\d+)\s*(?:gb|gigabytes?|gigs?)\b(?:\s+(?:storage|rom|ssd)\b)?/gi, '$1gb');
    cleaned = cleaned.replace(/\b(\d+)\s*(?:tb|terabytes?)\b(?:\s+(?:storage|rom|ssd)\b)?/gi, '$1tb');
    cleaned = cleaned.replace(/\b(\d+)\s*(?:mb|megabytes?)\b(?:\s+(?:storage|rom|ssd)\b)?/gi, '$1mb');

    // 4. Standardize RAM notations: "12gb ram", "12 gb ram", "12 ram" -> "12gb ram"
    cleaned = cleaned.replace(/\b(\d+)\s*(?:gb|gigabytes?)\s+ram\b/gi, '$1gb ram');
    cleaned = cleaned.replace(/\b(\d+gb)\s*ram\b/gi, '$1 ram');

    // 5. Standardize screen size: "13.6-inch", "13.6 inch", "13.6inch" -> "13.6inch"
    cleaned = cleaned.replace(/\b(\d+(?:\.\d+)?)\s*(?:inch|inches)\b/gi, '$1inch');

    // 6. Standardize generations: "2nd generation", "2nd gen", "gen 2" -> "2nd gen"
    cleaned = cleaned.replace(/\b(?:2nd|second)\s*(?:gen|generation)\b/gi, '2nd gen');
    cleaned = cleaned.replace(/\b(?:3rd|third)\s*(?:gen|generation)\b/gi, '3rd gen');
    cleaned = cleaned.replace(/\b(?:4th|fourth)\s*(?:gen|generation)\b/gi, '4th gen');
    cleaned = cleaned.replace(/\b(?:1st|first)\s*(?:gen|generation)\b/gi, '1st gen');

    // 7. Standardize chip / processor tags: "m4 chip", "apple m4" -> "m4"
    cleaned = cleaned.replace(/\b(m[1-4]|m[1-4]\s*pro|m[1-4]\s*max)\s*chip\b/gi, '$1');

    // 8. Standardize connectivity / audio terms
    cleaned = cleaned.replace(/\bactive\s*noise\s*cancell(?:ing|ation)\b/gi, 'anc');
    cleaned = cleaned.replace(/\bnoise\s*cancell(?:ing|ation)\b/gi, 'anc');
    cleaned = cleaned.replace(/\btrue\s*wireless\s*stereo\b/gi, 'tws');
    cleaned = cleaned.replace(/\btrue\s*wireless\b/gi, 'tws');
    cleaned = cleaned.replace(/\btype[- ]c\b/gi, 'usb-c');
    cleaned = cleaned.replace(/\busb\s*c\b/gi, 'usb-c');

    // 9. Standardize duration / battery: "120 hrs", "120 hours", "120hr" -> "120hrs"
    cleaned = cleaned.replace(/\b(\d+)\s*(?:hrs|hours|hour|hr)\b/gi, '$1hrs');

    // 10. Standardize colors with multi-word qualifiers
    cleaned = cleaned.replace(/\bcharcoal\s+black\b/gi, 'black');
    cleaned = cleaned.replace(/\bblack\s+edition\b/gi, 'black');
    cleaned = cleaned.replace(/\btitanium\s+gray\b/gi, 'titanium gray');
    cleaned = cleaned.replace(/\bspace\s+gray\b/gi, 'space gray');

    // 11. Clean remaining non-alphanumeric characters (keep hyphens and decimals inside words)
    cleaned = cleaned.replace(/[^a-z0-9\s.-]/g, ' ');

    // 12. Normalize extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  },

  /**
   * Tokenizes normalized string into an array of distinct or sequential tokens.
   * 
   * @param {string} text 
   * @param {boolean} removeStopwords 
   * @returns {Array<string>} Array of word tokens
   */
  tokenize(text, removeStopwords = true) {
    const normalized = this.normalize(text);
    if (!normalized) return [];

    const stopwords = new Set([
      'with', 'and', 'for', 'the', 'in', 'of', 'at', 'by', 'on', 'a', 'an', 'to',
      'laptop', 'headset', 'headphones', 'earbuds', 'phone', 'smartphone',
      'edition', 'series', 'brand', 'new', 'liquid', 'retina', 'display', 'industry', 'leading'
    ]);

    const rawTokens = normalized.split(/\s+/).filter(Boolean);

    if (!removeStopwords) {
      return rawTokens;
    }

    return rawTokens.filter((token) => !stopwords.has(token) && token.length > 1);
  },

  /**
   * Returns a unique Set of tokens from text.
   * 
   * @param {string} text 
   * @returns {Set<string>}
   */
  tokenSet(text) {
    return new Set(this.tokenize(text));
  }
};
