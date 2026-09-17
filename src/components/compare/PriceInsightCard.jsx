import React from 'react';
import { TrendingDown, Sparkles, Award, ArrowDownRight } from 'lucide-react';

export const PriceInsightCard = ({ product, stats }) => {
  if (!product) return null;

  const currentLowest = product.currentLowestPrice || 68999;
  const lowestStore = product.lowestStore || 'Flipkart';

  // Calculate next best effective price
  const listings = product.listings || [];
  const sortedListings = [...listings].sort((a, b) => {
    const effA = a.effectivePrice || (a.basePrice + (a.deliveryFee || 0));
    const effB = b.effectivePrice || (b.basePrice + (b.deliveryFee || 0));
    return effA - effB;
  });

  const nextBest = sortedListings.length > 1 
    ? (sortedListings[1].effectivePrice || (sortedListings[1].basePrice + (sortedListings[1].deliveryFee || 0)))
    : (currentLowest + 2000);

  const diffNextBest = nextBest - currentLowest;

  const lowestRecorded = stats?.lowestRecorded || (currentLowest - 1000);
  const averagePrice = stats?.average30D || (currentLowest + 2450);
  const highestRecorded = stats?.highestRecorded || (currentLowest + 7000);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Price Insight
              </span>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Best Current Price
              </h3>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {lowestStore}
          </span>
        </div>

        {/* Current Lowest Price */}
        <div className="my-3">
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            ₹{currentLowest.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Save ₹{diffNextBest > 0 ? diffNextBest.toLocaleString('en-IN') : '2,000'} compared with the next best effective price.
          </p>
        </div>
      </div>

      {/* Triplet stats: Lowest / Average / Highest */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center mt-3">
        <div>
          <span className="text-[10px] text-emerald-800 font-bold block uppercase">Lowest</span>
          <span className="text-xs font-extrabold text-emerald-700 block mt-0.5">
            ₹{lowestRecorded.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="border-x border-slate-200 px-1">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Average</span>
          <span className="text-xs font-bold text-slate-700 block mt-0.5">
            ₹{averagePrice.toLocaleString('en-IN')}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Highest</span>
          <span className="text-xs font-bold text-slate-700 block mt-0.5">
            ₹{highestRecorded.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
};
