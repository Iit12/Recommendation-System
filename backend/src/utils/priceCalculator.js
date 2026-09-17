/**
 * Landed / Effective Price Calculator
 * Formula: effectivePrice = price - discountAmount + deliveryCharge
 */

export const calculateEffectivePrice = (price, discountPercent = 0, deliveryCharge = 0) => {
  const base = Number(price) || 0;
  const delivery = Number(deliveryCharge) || 0;
  // If base price is already discounted, effective price is base + delivery
  // If base price is pre-discount, we subtract the percentage
  return base + delivery;
};

export const normalizeListing = (listing) => {
  const effectivePrice = calculateEffectivePrice(
    listing.price,
    listing.discount,
    listing.deliveryCharge
  );

  return {
    ...listing,
    effectivePrice,
  };
};
