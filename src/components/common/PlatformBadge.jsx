import React from 'react';
import { STORES } from '../../data/stores';
import { Zap, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export const PlatformBadge = ({ storeId, showType = true, size = 'medium' }) => {
  const store = STORES[storeId?.toLowerCase()] || {
    id: storeId,
    name: storeId,
    type: 'E-Commerce',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    accentColor: '#64748b'
  };

  const isQuick = store.isQuickCommerce;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium border transition-colors ${store.badgeColor} ${
        size === 'small' 
          ? 'px-2 py-0.5 text-[11px]' 
          : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: store.accentColor }}
      />
      <span className="font-semibold text-slate-900">{store.name}</span>
      {showType && (
        <span className="text-[10px] opacity-75 font-normal">
          {isQuick ? '⚡ 10-15m' : '📦 1-2d'}
        </span>
      )}
    </div>
  );
};

export const PlatformStrip = () => {
  const stores = Object.values(STORES);

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <p className="text-xs uppercase tracking-widest text-slate-600 font-bold">
          Cross-Platform Price Intelligence Across Your Favorite Stores
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stores.map((store) => (
          <div
            key={store.id}
            className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-subtle hover:border-brand-300 hover:shadow-card transition-all group"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: store.accentColor }}
              />
              <span className="font-bold text-sm text-slate-800 group-hover:text-brand-700 transition-colors">
                {store.name}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-600">
              {store.isQuickCommerce ? (
                <span className="flex items-center gap-1 text-purple-700 font-semibold bg-purple-100 px-1.5 py-0.5 rounded">
                  <Zap className="w-3 h-3" />
                  Quick Commerce
                </span>
              ) : (
                <span className="text-slate-600 font-medium">
                  {store.type}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">
              Avg: {store.deliveryTime.split('/')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
