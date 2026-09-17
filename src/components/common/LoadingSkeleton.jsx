import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export const LoadingSkeleton = ({ message = 'Finding the best prices across 6 stores...' }) => {
  return (
    <div className="w-full space-y-6 animate-pulse py-4">
      
      {/* Loading banner */}
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
          <div>
            <h4 className="text-sm font-semibold text-brand-900">{message}</h4>
            <p className="text-xs text-brand-600">Querying Amazon, Flipkart, Croma, Blinkit, Zepto, and Instamart...</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-brand-700 font-medium">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <span>Normalizing Listings</span>
        </div>
      </div>

      {/* Top Product Summary Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 h-56 bg-slate-100 rounded-xl"></div>
          <div className="lg:col-span-8 space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
              <div className="h-20 bg-slate-100 rounded-xl"></div>
              <div className="h-20 bg-slate-100 rounded-xl"></div>
              <div className="h-20 bg-slate-100 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Compare Table + Recommendation Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/2"></div>
            <div className="h-24 bg-slate-100 rounded-xl"></div>
            <div className="h-10 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-3">
            <div className="h-5 bg-slate-200 rounded w-1/3"></div>
            <div className="h-32 bg-slate-100 rounded-xl"></div>
          </div>
        </div>
      </div>

    </div>
  );
};
