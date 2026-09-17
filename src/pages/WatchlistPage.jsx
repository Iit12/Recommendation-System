import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Trash2, 
  ExternalLink, 
  TrendingDown, 
  TrendingUp, 
  Bell, 
  ShoppingBag, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  Edit2
} from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { PRODUCTS } from '../data/products';
import { PRICE_TRENDS } from '../data/trends';
import { PriceAlertModal } from '../components/common/PriceAlertModal';

export const WatchlistPage = () => {
  const { watchlist, removeFromWatchlist, count } = useWatchlist();
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const navigate = useNavigate();

  // Hydrate watchlist entries with full product details
  const hydratedItems = watchlist.map((item) => {
    const product = PRODUCTS.find((p) => p.id === item.productId) || PRODUCTS[0];
    const trend = PRICE_TRENDS[item.productId] || PRICE_TRENDS['iphone-16'];
    return {
      ...item,
      product,
      trendStats: trend.stats,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold mb-2">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>Price Drop Radar</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            My Watchlist
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking price fluctuations and custom target alerts across verified stores
          </p>
        </div>

        {count > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              {count} {count === 1 ? 'Product Tracked' : 'Products Tracked'}
            </span>
          </div>
        )}
      </div>

      {/* Main Watchlist Container */}
      {count === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-card space-y-4 my-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
            <Heart className="w-8 h-8 stroke-1" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Your watchlist is empty</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Save products to keep an eye on their prices and receive alerts when retailers drop discounts.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Start Shopping</span>
            </Link>
          </div>
        </div>
      ) : (
        /* List of Saved Items */
        <div className="space-y-4">
          {hydratedItems.map(({ productId, targetPrice, addedAt, product, trendStats }) => {
            return (
              <div
                key={productId}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left: Product Media & Identity */}
                <div className="flex items-center gap-4 min-w-[260px]">
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 p-2 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="max-h-full object-contain"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded uppercase">
                      {product.category}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Lowest on <strong className="text-slate-800">{product.lowestStore}</strong>
                    </p>
                  </div>
                </div>

                {/* Middle: Live Price vs Target Price vs Trend */}
                <div className="grid grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100/90 flex-1 text-center">
                  
                  {/* Current Price */}
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                      Current Price
                    </span>
                    <span className="text-sm sm:text-base font-black text-slate-900 block mt-0.5">
                      ₹{product.currentLowestPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold block">
                      {product.discountPercent}% off MRP
                    </span>
                  </div>

                  {/* Target Price */}
                  <div className="border-x border-slate-200 px-2">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                      Target Alert
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-brand-600 block mt-0.5">
                      ₹{targetPrice?.toLocaleString('en-IN') || '—'}
                    </span>
                    <button
                      onClick={() => setSelectedProductForModal(product)}
                      className="text-[10px] text-slate-500 hover:text-brand-600 font-medium inline-flex items-center gap-0.5 mt-0.5"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                      <span>Edit target</span>
                    </button>
                  </div>

                  {/* Price Trend Velocity */}
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                      30D Trend
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5 flex items-center justify-center gap-0.5">
                      {trendStats.trendDirection === 'falling' ? (
                        <span className="text-emerald-600 flex items-center gap-0.5">
                          <TrendingDown className="w-3.5 h-3.5" />
                          {trendStats.changePercent30D}%
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-0.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          +{trendStats.changePercent30D}%
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {trendStats.volatility} volatility
                    </span>
                  </div>

                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  
                  {/* View Comparison Button */}
                  <Link
                    to={`/compare?id=${product.id}`}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-brand-600 text-white transition-all shadow-subtle flex items-center gap-1.5"
                  >
                    <span>Compare Stores</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWatchlist(product.id)}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-slate-200"
                    title="Remove from Watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Target Price Edit Modal */}
      {selectedProductForModal && (
        <PriceAlertModal
          isOpen={true}
          onClose={() => setSelectedProductForModal(null)}
          product={selectedProductForModal}
        />
      )}

    </div>
  );
};
