// Phase 2 mock recommendation.
// Will be replaced by the ML recommendation engine in a later phase.

export const RECOMMENDATIONS_DATA = {
  'iphone-16': {
    verdict: 'BUY NOW',
    type: 'positive',
    confidence: 88,
    headline: 'Strong Buy Signal — Near Historical Low',
    reason: "Today's price of ₹68,999 is 3.4% below the 30-day moving average (₹71,450) and within 1.5% of the all-time lowest price recorded on Flipkart.",
    signals: {
      currentPrice: 68999,
      averagePrice: 71450,
      historicalLow: 67999,
      trend: 'FALLING',
    },
    signalsList: [
      { label: 'Current Price', value: '₹68,999', status: 'optimal', note: 'Best across 6 stores' },
      { label: '30-Day Average', value: '₹71,450', status: 'neutral', note: 'Save ₹2,451 vs avg' },
      { label: 'Historical Low', value: '₹67,999', status: 'neutral', note: 'Only ₹1,000 away' },
      { label: 'Price Velocity', value: '↓ Falling', status: 'optimal', note: 'Down 4.2% this month' },
    ],
    confidenceBreakdown: {
      marketSpread: 92,
      priceVersusHistory: 86,
      stockStability: 85,
    },
    actionAdvice: 'Flipkart currently offers the best deal with free express delivery. Further price drops are unlikely before major holiday sales.'
  },
  'sony-wh-1000xm5': {
    verdict: 'BUY NOW',
    type: 'positive',
    confidence: 94,
    headline: 'Huge Price Drop — Prime Opportunity',
    reason: 'Price dropped by 29% from MSRP down to ₹24,990 on Amazon, which is 7.1% below its 30-day average. This is one of the lowest price points in 2026.',
    signals: {
      currentPrice: 24990,
      averagePrice: 26900,
      historicalLow: 23990,
      trend: 'FALLING',
    },
    signalsList: [
      { label: 'Current Price', value: '₹24,990', status: 'optimal', note: 'Save ₹10,000 from MRP' },
      { label: '30-Day Average', value: '₹26,900', status: 'neutral', note: 'Save ₹1,910 vs avg' },
      { label: 'Historical Low', value: '₹23,990', status: 'neutral', note: 'Near record low' },
      { label: 'Price Velocity', value: '↓ Sharp Drop', status: 'optimal', note: 'Down 7.1% this month' },
    ],
    confidenceBreakdown: {
      marketSpread: 95,
      priceVersusHistory: 94,
      stockStability: 92,
    },
    actionAdvice: 'Amazon has an aggressive discount matching lightning deal pricing. Recommended to buy before flash stock runs out.'
  },
  'macbook-air-m4': {
    verdict: 'WAIT',
    type: 'warning',
    confidence: 76,
    headline: 'Price Trending Upwards — Better Deals Expected',
    reason: 'The current price of ₹94,990 is 2.3% higher than the 30-day average (₹92,800). Historical data suggests a periodic sale event drops this model to ~₹91,990.',
    signals: {
      currentPrice: 94990,
      averagePrice: 92800,
      historicalLow: 91990,
      trend: 'RISING',
    },
    signalsList: [
      { label: 'Current Price', value: '₹94,990', status: 'warning', note: '₹3,000 above lowest' },
      { label: '30-Day Average', value: '₹92,800', status: 'neutral', note: 'Above moving avg' },
      { label: 'Historical Low', value: '₹91,990', status: 'neutral', note: 'Target price alert' },
      { label: 'Price Velocity', value: '↑ Rising', status: 'warning', note: 'Up 2.3% this month' },
    ],
    confidenceBreakdown: {
      marketSpread: 70,
      priceVersusHistory: 78,
      stockStability: 80,
    },
    actionAdvice: 'Set a price target alert for ₹92,000. Price cycles indicate a likely correction during upcoming weekend offers.'
  },
  'samsung-galaxy-s25': {
    verdict: 'BUY NOW',
    type: 'positive',
    confidence: 82,
    headline: 'Favorable Price Cycle — Competitive Marketplace',
    reason: 'Price has steadily softened across Flipkart and Amazon down to ₹74,999. It represents a 12% discount off MRP with zero shipping fees.',
    signals: {
      currentPrice: 74999,
      averagePrice: 77200,
      historicalLow: 73999,
      trend: 'FALLING',
    },
    signalsList: [
      { label: 'Current Price', value: '₹74,999', status: 'optimal', note: '₹10,000 off MRP' },
      { label: '30-Day Average', value: '₹77,200', status: 'neutral', note: 'Save ₹2,201 vs avg' },
      { label: 'Historical Low', value: '₹73,999', status: 'neutral', note: '₹1,000 to floor' },
      { label: 'Price Velocity', value: '↓ Falling', status: 'optimal', note: 'Down 3.8% in 30D' },
    ],
    confidenceBreakdown: {
      marketSpread: 84,
      priceVersusHistory: 81,
      stockStability: 82,
    },
    actionAdvice: 'Flipkart is the price leader for this model right now, with reliable 2-day delivery and full warranty coverage.'
  },
  'airpods-pro-2': {
    verdict: 'BUY NOW',
    type: 'positive',
    confidence: 91,
    headline: 'Rare 24% Discount — Highly Recommended',
    reason: 'AirPods Pro 2 rarely dips below ₹19,000 outside major annual sales. Current ₹18,999 price on Amazon is 10.4% lower than the 30-day average.',
    signals: {
      currentPrice: 18999,
      averagePrice: 21200,
      historicalLow: 18499,
      trend: 'FALLING',
    },
    signalsList: [
      { label: 'Current Price', value: '₹18,999', status: 'optimal', note: 'Best price in 90 days' },
      { label: '30-Day Average', value: '₹21,200', status: 'neutral', note: 'Save ₹2,201 vs avg' },
      { label: 'Historical Low', value: '₹18,499', status: 'neutral', note: 'Near record low' },
      { label: 'Price Velocity', value: '↓ Historic Low', status: 'optimal', note: 'Down 10.4% in 30D' },
    ],
    confidenceBreakdown: {
      marketSpread: 92,
      priceVersusHistory: 90,
      stockStability: 90,
    },
    actionAdvice: 'Amazon Prime members get free next-day delivery. Highly recommended to lock in this price.'
  },
  'boat-nirvana-ion': {
    verdict: 'BUY NOW',
    type: 'positive',
    confidence: 85,
    headline: 'Budget Champion at Lowest Range',
    reason: 'At ₹1,699 with 78% discount, this product is in its sweet spot. Quick-commerce options are also stocked for instant 11-min delivery.',
    signals: {
      currentPrice: 1699,
      averagePrice: 1850,
      historicalLow: 1599,
      trend: 'FALLING',
    },
    signalsList: [
      { label: 'Current Price', value: '₹1,699', status: 'optimal', note: 'Save ₹6,291 from MRP' },
      { label: '30-Day Average', value: '₹1,850', status: 'neutral', note: 'Save ₹151 vs avg' },
      { label: 'Historical Low', value: '₹1,599', status: 'neutral', note: 'Within ₹100' },
      { label: 'Price Velocity', value: '↓ Falling', status: 'optimal', note: 'Down 8.1% in 30D' },
    ],
    confidenceBreakdown: {
      marketSpread: 88,
      priceVersusHistory: 83,
      stockStability: 85,
    },
    actionAdvice: 'Choose Amazon for free delivery or Blinkit/Zepto if you need it within 15 minutes.'
  }
};
