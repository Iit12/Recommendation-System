import React, { useState } from 'react';
import { Bell, X, ShieldAlert, Sparkles, Check, ArrowRight, Info } from 'lucide-react';
import { useWatchlist } from '../../context/WatchlistContext';

export const PriceAlertModal = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) return null;

  const { setPriceAlert, getWatchlistItem } = useWatchlist();
  const existing = getWatchlistItem(product.id);

  const currentPrice = product.currentLowestPrice;
  const [targetPrice, setTargetPrice] = useState(
    existing ? existing.targetPrice : Math.round(currentPrice * 0.93 / 100) * 100
  );
  const [email, setEmail] = useState('user@example.com');
  const [submitted, setSubmitted] = useState(false);

  const savings = currentPrice - targetPrice;
  const savingsPercent = Math.round((savings / currentPrice) * 100);

  const handleQuickSelect = (percent) => {
    const calc = Math.round((currentPrice * (1 - percent / 100)) / 100) * 100;
    setTargetPrice(calc);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setPriceAlert(product.id, Number(targetPrice));
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-elevated border border-slate-100 overflow-hidden animate-slide-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center shadow-subtle">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Set Price Target Alert</h3>
              <p className="text-xs text-slate-500">Get notified the exact moment price drops</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Alert Activated!</h4>
            <p className="text-sm text-slate-600">
              Tracking <span className="font-semibold text-slate-800">{product.shortTitle || product.name}</span> for targets below ₹{Number(targetPrice).toLocaleString('en-IN')}.
            </p>
            <p className="text-xs text-slate-400 italic">Phase 1 Demo alert has been added to your local watchlist.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-6">
            
            {/* Product mini summary */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <img src={product.image} alt={product.name} className="w-12 h-12 object-contain rounded-lg bg-white p-1 border border-slate-200" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{product.shortTitle || product.name}</h4>
                  <span className="text-xs text-slate-500">{product.variant || product.category}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Current Best</span>
                <span className="text-base font-extrabold text-slate-900">
                  ₹{currentPrice.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Target Price Configuration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Notify me when price falls below:
              </label>
              
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  min="500"
                  max={currentPrice}
                  step="100"
                  required
                  className="w-full pl-9 pr-24 py-3 bg-white border-2 border-brand-500 rounded-xl text-xl font-extrabold text-slate-900 focus:outline-none focus:ring-4 focus:ring-brand-100 shadow-subtle"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  {savings > 0 ? `-${savingsPercent}% DROP` : 'MATCH'}
                </span>
              </div>

              {/* Quick preset step buttons */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-slate-500 font-medium">Quick presets:</span>
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickSelect(pct)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 transition-colors border border-slate-200"
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery Channel selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Alert Destination
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Phase 1 disclaimer notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs text-amber-800">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Phase 1 Mock Alert:</strong> In this demo, your target price will be tracked in your browser's local watchlist. Live email and push notifications will activate when the backend pipeline connects.
              </p>
            </div>

            {/* CTA Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.98] transition-all shadow-md flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>Create Alert</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
