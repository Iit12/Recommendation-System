/**
 * Phase 4 Attribute Extractor
 * Explainable, rule-based extraction of key product specifications and variant attributes.
 */

import { textNormalizer } from './textNormalizer.js';

// Predefined known dictionary sets
const KNOWN_BRANDS = [
  'apple',
  'sony',
  'samsung',
  'boat',
  'oneplus',
  'google',
  'xiaomi',
  'realme',
  'asus',
  'dell',
  'hp',
  'lenovo',
  'bose',
  'jbl',
  'sennheiser',
  'noise',
  'fire-boltt'
];

// Model patterns sorted from most specific to least specific
const KNOWN_MODELS = [
  // Apple iPhones
  { brand: 'apple', regex: /\biphone\s*16\s*pro\s*max\b/i, model: 'iphone 16 pro max' },
  { brand: 'apple', regex: /\biphone\s*16\s*pro\b/i, model: 'iphone 16 pro' },
  { brand: 'apple', regex: /\biphone\s*16\s*plus\b/i, model: 'iphone 16 plus' },
  { brand: 'apple', regex: /\biphone\s*16\b/i, model: 'iphone 16' },
  { brand: 'apple', regex: /\biphone\s*15\s*pro\s*max\b/i, model: 'iphone 15 pro max' },
  { brand: 'apple', regex: /\biphone\s*15\s*pro\b/i, model: 'iphone 15 pro' },
  { brand: 'apple', regex: /\biphone\s*15\b/i, model: 'iphone 15' },

  // Apple MacBooks
  { brand: 'apple', regex: /\bmacbook\s*air(?:\s+laptop)?(?:\s+with)?\s*m4\b/i, model: 'macbook air m4' },
  { brand: 'apple', regex: /\bmacbook\s*air(?:\s+laptop)?(?:\s+with)?\s*m3\b/i, model: 'macbook air m3' },
  { brand: 'apple', regex: /\bmacbook\s*air(?:\s+laptop)?(?:\s+with)?\s*m2\b/i, model: 'macbook air m2' },
  { brand: 'apple', regex: /\bmacbook\s*pro(?:\s+laptop)?(?:\s+with)?\s*m4\b/i, model: 'macbook pro m4' },
  { brand: 'apple', regex: /\bmacbook\s*air\b/i, model: 'macbook air' },
  { brand: 'apple', regex: /\bmacbook\s*pro\b/i, model: 'macbook pro' },

  // Apple AirPods
  { brand: 'apple', regex: /\bairpods\s*pro\s*(?:2|2nd\s*gen(?:eration)?)\b/i, model: 'airpods pro 2' },
  { brand: 'apple', regex: /\bairpods\s*pro\b/i, model: 'airpods pro' },
  { brand: 'apple', regex: /\bairpods\s*4\b/i, model: 'airpods 4' },
  { brand: 'apple', regex: /\bairpods\s*3\b/i, model: 'airpods 3' },

  // Sony Audio
  { brand: 'sony', regex: /\bwh[- ]?1000xm5\b/i, model: 'wh-1000xm5' },
  { brand: 'sony', regex: /\bwh[- ]?1000xm4\b/i, model: 'wh-1000xm4' },
  { brand: 'sony', regex: /\bwf[- ]?1000xm5\b/i, model: 'wf-1000xm5' },
  { brand: 'sony', regex: /\bch[- ]?720n\b/i, model: 'ch-720n' },

  // Samsung Galaxy
  { brand: 'samsung', regex: /\bgalaxy\s*s25\s*ultra\b/i, model: 'galaxy s25 ultra' },
  { brand: 'samsung', regex: /\bgalaxy\s*s25\s*plus\b/i, model: 'galaxy s25 plus' },
  { brand: 'samsung', regex: /\bgalaxy\s*s25\b/i, model: 'galaxy s25' },
  { brand: 'samsung', regex: /\bgalaxy\s*s24\s*ultra\b/i, model: 'galaxy s24 ultra' },
  { brand: 'samsung', regex: /\bgalaxy\s*s24\b/i, model: 'galaxy s24' },

  // boAt Audio
  { brand: 'boat', regex: /\bnirvana\s*ion\b/i, model: 'nirvana ion' },
  { brand: 'boat', regex: /\bairdopes\s*141\b/i, model: 'airdopes 141' },
  { brand: 'boat', regex: /\brockerz\s*450\b/i, model: 'rockerz 450' },
  { brand: 'boat', regex: /\brockerz\s*550\b/i, model: 'rockerz 550' }
];

const KNOWN_COLORS = [
  'black',
  'silver',
  'midnight',
  'titanium gray',
  'titanium',
  'white',
  'pink',
  'blue',
  'yellow',
  'green',
  'purple',
  'starlight',
  'space gray',
  'gold',
  'cream',
  'graphite',
  'red'
];

export const attributeExtractor = {
  /**
   * Extracts structured specifications from listing title.
   * 
   * @param {string} rawTitle 
   * @returns {Object} Extracted attributes dictionary
   */
  extract(rawTitle) {
    if (!rawTitle || typeof rawTitle !== 'string') {
      return {
        brand: null,
        model: null,
        storage: null,
        ram: null,
        color: null,
        variant: null,
        normalizedTitle: '',
      };
    }

    const normalized = textNormalizer.normalize(rawTitle);

    // 1. Extract Brand and Model
    let extractedBrand = null;
    let extractedModel = null;

    // Check against model registry first for precise composite matching
    for (const entry of KNOWN_MODELS) {
      if (entry.regex.test(normalized)) {
        extractedModel = entry.model;
        extractedBrand = entry.brand;
        break;
      }
    }

    // If brand wasn't inferred via model pattern, check brand dictionary
    if (!extractedBrand) {
      for (const brand of KNOWN_BRANDS) {
        const brandRegex = new RegExp(`\\b${brand}\\b`, 'i');
        if (brandRegex.test(normalized)) {
          extractedBrand = brand;
          break;
        }
      }
    }

    // 2. Extract RAM (e.g. "12gb ram", "16gb")
    let extractedRam = null;
    const explicitRamMatch = normalized.match(/\b(\d+gb)\s*ram\b/i);
    if (explicitRamMatch) {
      extractedRam = explicitRamMatch[1];
    }

    // 3. Extract Storage (e.g. "128gb", "256gb", "512gb", "1tb")
    let extractedStorage = null;
    // Look for explicit storage mentions or standalone sizes not already captured by RAM
    const storageMatches = normalized.match(/\b(16gb|32gb|64gb|128gb|256gb|512gb|1tb|2tb)\b/gi) || [];

    for (const match of storageMatches) {
      const lowerMatch = match.toLowerCase();
      // If we found a RAM match that is identical, don't double count unless multiple sizes exist
      if (extractedRam && lowerMatch === extractedRam) {
        continue;
      }
      extractedStorage = lowerMatch;
      break;
    }

    // If no explicit RAM was flagged with "ram", but we have 2 sizes e.g. "16gb 256gb", first is RAM for computers
    if (!extractedRam && storageMatches.length >= 2) {
      if (storageMatches[0] !== storageMatches[1]) {
        extractedRam = storageMatches[0].toLowerCase();
        extractedStorage = storageMatches[1].toLowerCase();
      }
    }

    // 4. Extract Color
    let extractedColor = null;
    for (const color of KNOWN_COLORS) {
      const colorRegex = new RegExp(`\\b${color}\\b`, 'i');
      if (colorRegex.test(normalized)) {
        extractedColor = color;
        break;
      }
    }

    // 5. Extract Variants / Specification tags
    const variantTags = [];
    if (/\btws\b/i.test(normalized)) variantTags.push('tws');
    if (/\banc\b/i.test(normalized)) variantTags.push('anc');
    if (/\bover[- ]ear\b/i.test(normalized)) variantTags.push('over-ear');
    if (/\b5g\b/i.test(normalized)) variantTags.push('5g');
    if (/\busb-c\b/i.test(normalized)) variantTags.push('usb-c');
    if (/\bm4\b/i.test(normalized)) variantTags.push('m4');
    if (/\b2nd gen\b/i.test(normalized)) variantTags.push('2nd gen');

    return {
      brand: extractedBrand,
      model: extractedModel,
      storage: extractedStorage,
      ram: extractedRam,
      color: extractedColor,
      variant: variantTags.length > 0 ? variantTags.join(', ') : null,
      normalizedTitle: normalized,
    };
  }
};
