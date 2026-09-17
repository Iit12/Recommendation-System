import React, { useState } from 'react';
import { 
  ExternalLink, 
  Sparkles, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  ShieldCheck,
  Tag
} from 'lucide-react';
import { STORES } from '../../data/stores';
import { PlatformBadge } from '../common/PlatformBadge';

export const PriceComparisonTable = ({ listings = [], productName = '' }) => {
  const [filterType, setFilterType] = useState('all'); // 'all', 'ecommerce', 'quick'

  // Normalize listing items with safe fallbacks
  const normalizedListings = (listings || []).map((item) => {
    const listedPrice = Number(item.basePrice || item.price || 0);
    const deliveryCharge = Number(item.deliveryFee !== undefined ? item.deliveryFee : item.deliveryCharge || 0);
    const discountPercent = Number(item.discountPercent || item.discount || 0);
    const effectivePrice = Number(item.effectivePrice || (listedPrice + deliveryCharge));
    const storeName = item.storeName || item.platform || item.storeId || 'Store';
    const isAvailable = item.inStock !== false;

    return {
      ...item,
      listedPrice,
      deliveryCharge,
      discountPercent,
      effectivePrice,
      storeName,
      isAvailable,
    };
  });

  const filteredListings = normalizedListings
    .filter((item) => {
      const store = STORES[item.storeId?.toLowerCase()];
      if (filterType === 'quick') return store?.isQuickCommerce;
      if (filterType === 'ecommerce') return !store?.isQuickCommerce;
      return true;
    })
    .sort((a, b) => a.effectivePrice - b.effectivePrice);

  const minEffective = filteredListings.length > 0 
    ? Math.min(...filteredListings.map((l) => l.effectivePrice)) 
    : 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
      
      {/* Table Header Section with Filters */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Live Store Price Comparison
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {filteredListings.length} Stores Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compare the effective price (Listed Price + Delivery) of the same product across verified stores.
          </p>
        </div>

        {/* Store Type Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-subtle font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              All Stores ({normalizedListings.length})
            </button>
            <button
              onClick={() => setFilterType('ecommerce')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterType === 'ecommerce'
                  ? 'bg-white text-slate-900 shadow-subtle font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              E-Commerce
            </button>
            <button
              onClick={() => setFilterType('quick')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                filterType === 'quick'
                  ? 'bg-white text-purple-700 shadow-subtle font-bold'
                  : 'hover:text-purple-700'
              }`}
            >
              <Zap className="w-3 h-3 text-purple-600" />
              10-Min Quick
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Comparison Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">Store</th>
              <th className="py-3.5 px-4">Listed Price</th>
              <th className="py-3.5 px-4">Discount</th>
              <th className="py-3.5 px-4">Delivery</th>
              <th className="py-3.5 px-4">Effective Price</th>
              <th className="py-3.5 px-4">Availability</th>
              <th className="py-3.5 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredListings.map((item) => {
              const isBest = item.effectivePrice === minEffective;

              return (
                <tr
                  key={item.storeId || item.storeName}
                  className={`transition-colors group ${
                    isBest
                      ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Store Column */}
                  <td className="py-4 px-6 align-middle">
                    <div className="flex items-center gap-2.5">
                      <PlatformBadge storeId={item.storeId} showType={false} size="small" />
                      {isBest && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-sm">
                          <Sparkles className="w-2.5 h-2.5" />
                          BEST PRICE
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Listed Price */}
                  <td className="py-4 px-4 align-middle">
                    <span className="font-semibold text-slate-700">
                      ₹{item.listedPrice.toLocaleString('en-IN')}
                    </span>
                  </td>

                  {/* Discount */}
                  <td className="py-4 px-4 align-middle">
                    {item.discountPercent > 0 ? (
                      <span className="inline-block px-2 py-0.5 rounded font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.discountPercent}% off
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  {/* Delivery */}
                  <td className="py-4 px-4 align-middle text-xs">
                    {item.deliveryCharge === 0 ? (
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        ₹0 (Free)
                      </span>
                    ) : (
                      <span className="font-medium text-slate-700">
                        +₹{item.deliveryCharge}
                      </span>
                    )}
                  </td>

                  {/* Effective Price */}
                  <td className="py-4 px-4 align-middle">
                    <div className="flex flex-col">
                      <span className={`text-base font-extrabold tracking-tight ${isBest ? 'text-emerald-700' : 'text-slate-900'}`}>
                        ₹{item.effectivePrice.toLocaleString('en-IN')}
                      </span>
                      {isBest && (
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                          Lowest Landed Cost
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Availability */}
                  <td className="py-4 px-4 align-middle">
                    {item.isAvailable ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        <CheckCircle2 className="w-3 h-3" />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                        <XCircle className="w-3 h-3" />
                        Out of Stock
                      </span>
                    )}
                  </td>

                  {/* Action Button */}
                  <td className="py-4 px-6 align-middle text-right">
                    <a
                      href={item.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-subtle ${
                        isBest
                          ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-md hover:shadow-lg'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>View Deal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden divide-y divide-slate-100">
        {filteredListings.map((item) => {
          const isBest = item.effectivePrice === minEffective;

          return (
            <div
              key={item.storeId || item.storeName}
              className={`p-4 transition-colors ${
                isBest ? 'bg-emerald-50/40' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PlatformBadge storeId={item.storeId} size="small" />
                  {isBest && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                      Best Price
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900">
                    ₹{item.effectivePrice.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-slate-400">Effective Landed Price</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl mb-3">
                <div>
                  <span className="block text-[10px] text-slate-400">Listed Price</span>
                  <span className="font-semibold text-slate-800">₹{item.listedPrice.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">Delivery</span>
                  <span className="font-semibold text-slate-700">
                    {item.deliveryCharge === 0 ? 'Free' : `+₹${item.deliveryCharge}`}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">Status</span>
                  <span className={`font-semibold ${item.isAvailable ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {item.isAvailable ? 'Available' : 'Out of Stock'}
                  </span>
                </div>
              </div>

              <a
                href={item.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isBest
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-slate-900 text-white'
                }`}
              >
                <span>View Deal on {item.storeName}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          );
        })}
      </div>

      {/* Footer Disclaimer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Effective landed price accurately combines base listed price, platform discounts, and delivery charges.</span>
        </div>
        <span className="text-[11px] text-slate-400">Updated: Real-time Phase 1 Mock</span>
      </div>

    </div>
  );
};
