import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ArrowRight, TrendingDown, Store, Star, Zap } from 'lucide-react';
import { useWatchlist } from '../../context/WatchlistContext';
import { PlatformBadge } from './PlatformBadge';

export const ProductCard = ({ product }) => {
  const { isSaved, toggleWatchlist } = useWatchlist();
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const saved = isSaved(product.id);

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-card-hover hover:border-brand-200 transition-all duration-300 overflow-hidden">
      
      {/* Top badges & Favorite CTA */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {product.tags && product.tags[0] && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/90 backdrop-blur-md text-white shadow-sm">
              {product.tags[0]}
            </span>
          )}
          {product.discountPercent >= 15 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-700 text-white shadow-sm">
              {product.discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Heart Favorite button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWatchlist(product);
          }}
          className={`pointer-events-auto p-2 rounded-full backdrop-blur-md transition-all duration-200 shadow-sm ${
            saved
              ? 'bg-rose-50 text-rose-600 border border-rose-200 ring-2 ring-rose-200/50'
              : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white border border-slate-200'
          }`}
          title={saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
          aria-label={saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          <Heart className={`w-4 h-4 transition-transform active:scale-125 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Product Image Stage */}
      <Link 
        to={`/compare?id=${product.id}`}
        className="relative block w-full pt-[75%] bg-gradient-to-b from-slate-50 to-slate-100/50 overflow-hidden cursor-pointer"
      >
        {!imgError ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-slate-300">
            <Store className="w-16 h-16 stroke-1" />
          </div>
        )}
      </Link>

      {/* Product Details Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-brand-800 bg-brand-50 px-2 py-0.5 rounded">
              {product.category}
            </span>
            <div className="flex items-center gap-1 font-semibold text-slate-800">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating}</span>
              <span className="text-slate-500 font-normal">({product.reviewCount})</span>
            </div>
          </div>

          {/* Product Title */}
          <Link to={`/compare?id=${product.id}`}>
            <h3 className="font-bold text-base text-slate-900 line-clamp-1 group-hover:text-brand-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-slate-600 mt-0.5 mb-3 line-clamp-1">
            {product.variant || `${product.color} • ${product.brand}`}
          </p>

          {/* Pricing Row */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4">
            <div className="text-[11px] text-slate-600 font-semibold flex items-center justify-between">
              <span>Lowest Effective Price</span>
              <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" />
                Save ₹{product.savingsMax?.toLocaleString('en-IN') || '2,000'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                ₹{product.currentLowestPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-600">Available at:</span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-subtle text-[11px]">
                {product.lowestStore}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Link
          to={`/compare?id=${product.id}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-brand-600 text-white transition-all shadow-subtle group-hover:shadow-md"
        >
          <span>Compare 6 Stores</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

    </div>
  );
};
