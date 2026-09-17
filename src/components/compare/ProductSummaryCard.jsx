import React from 'react';
import { 
  Heart, 
  ExternalLink, 
  TrendingDown, 
  ShieldCheck, 
  Bell, 
  Share2, 
  Star,
  CheckCircle2,
  Sparkles,
  Zap
} from 'lucide-react';
import { useWatchlist } from '../../context/WatchlistContext';
import { useToast } from '../../context/ToastContext';

export const ProductSummaryCard = ({ product, onOpenAlertModal }) => {
  const { isSaved, toggleWatchlist } = useWatchlist();
  const { addToast } = useToast();
  
  if (!product) return null;

  const saved = isSaved(product.id);
  const bestListing = product.listings?.find((l) => l.isLowest) || product.listings?.[0];

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast({
        title: 'Comparison Link Copied',
        message: 'Share this price comparison with friends.',
        type: 'info',
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-card relative overflow-hidden">
      
      {/* Decorative background accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-50/50 rounded-full blur-3xl -z-0 pointer-events-none"></div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Product Image Stage */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[280px] aspect-square rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 p-6 border border-slate-200 flex items-center justify-center group">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-md"
            />
            {product.discountPercent > 10 && (
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-700 text-white shadow-sm">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 font-semibold">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-700" />
              Verified Listings
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-purple-700" />
              Quick Delivery Options
            </span>
          </div>
        </div>

        {/* Product Information & Key Highlights */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          
          <div>
            {/* Category & Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200">
                {product.category}
              </span>
              <span className="text-xs text-slate-600 font-semibold">Brand: {product.brand}</span>
              <span className="text-slate-400">•</span>
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{product.rating}</span>
                <span className="text-slate-500 font-normal">({product.reviewCount} reviews)</span>
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              {product.variant || `${product.color} • Official Indian Retail Edition`}
            </p>
          </div>

          {/* Pricing Highlight Bento Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 sm:p-5 rounded-2xl bg-slate-900 text-white shadow-lg">
            
            <div className="space-y-1 sm:border-r border-slate-800 pr-3">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Lowest Effective Price
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ₹{product.currentLowestPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-xs text-slate-400 line-through">
                MRP ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-1 sm:border-r border-slate-800 sm:px-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Lowest Available At
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
                  {product.lowestStore}
                </span>
              </div>
              <span className="text-xs text-emerald-400 font-medium">
                Free Express Delivery
              </span>
            </div>

            <div className="space-y-1 sm:pl-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Maximum Price Spread
              </span>
              <div className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                Save up to ₹{product.savingsMax?.toLocaleString('en-IN') || '3,000'}
              </div>
              <span className="text-xs text-slate-400">
                vs highest marketplace listing
              </span>
            </div>

          </div>

          {/* Action Button Strip */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            
            {/* View Best Deal CTA */}
            <a
              href={bestListing?.url || 'https://www.flipkart.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm bg-brand-600 hover:bg-brand-700 text-white transition-all shadow-md active:scale-[0.98]"
            >
              <span>View Best Deal on {product.lowestStore}</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Watchlist Toggle Button */}
            <button
              type="button"
              onClick={() => toggleWatchlist(product)}
              className={`flex items-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm transition-all border ${
                saved
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${saved ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
              <span>{saved ? 'In Watchlist' : 'Add to Watchlist'}</span>
            </button>

            {/* Set Price Alert Button */}
            <button
              type="button"
              onClick={onOpenAlertModal}
              className="flex items-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Set a custom price drop target"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Set Alert</span>
            </button>

            {/* Share link button */}
            <button
              type="button"
              onClick={handleShare}
              className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Share comparison"
            >
              <Share2 className="w-4 h-4" />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};
