/**
 * Phase 8.4 Alert Constants
 * Centralized rule types, evaluation statuses, and operational limits.
 */

export const ALERT_RULE_TYPES = Object.freeze({
  TARGET_PRICE: 'TARGET_PRICE',
  PRICE_DROP: 'PRICE_DROP',
  NEAR_HISTORICAL_LOW: 'NEAR_HISTORICAL_LOW',
  RESTOCK: 'RESTOCK',
});

export const ALERT_RULE_STATUS = Object.freeze({
  TRIGGERED: 'TRIGGERED',
  NOT_TRIGGERED: 'NOT_TRIGGERED',
  NOT_EVALUABLE: 'NOT_EVALUABLE',
});

export const ALERT_SUMMARY_STATUS = Object.freeze({
  TRIGGERED: 'TRIGGERED',
  NOT_TRIGGERED: 'NOT_TRIGGERED',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
});

export const ALERT_LIMITS = Object.freeze({
  MAX_PERCENT_THRESHOLD: 100,
  MIN_PERCENT_THRESHOLD: 0,
});
