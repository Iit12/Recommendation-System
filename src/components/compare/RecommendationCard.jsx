// Phase 1 demo recommendation.
// Will be replaced by the ML recommendation engine in a later phase.

import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  ShieldCheck, 
  Info,
  Clock,
  Zap,
  Bot
} from 'lucide-react';

export const RecommendationCard = ({ recommendation, product }) => {
  // Phase 1 default demo recommendation
  const rec = recommendation || {
    verdict: 'BUY NOW',
    type: 'positive',
    confidence: 88,
    headline: 'Strong Buy Signal — Near Historical Low',
    reason: "Today's price of ₹68,999 is 3.4% below the 30-day moving average (₹71,450) and within 1.5% of the all-time lowest price recorded on Flipkart.",
    signals: {
      currentPrice: 68999,
      averagePrice: 71450,
      historicalLow: 67999,
      trend: 'Falling',
    },
    signalsList: [
      { label: 'Current Price', value: '₹68,999', status: 'optimal', note: 'Best across 6 stores' },
      { label: '30-Day Average', value: '₹71,450', status: 'neutral', note: 'Save ₹2,451 vs avg' },
      { label: '30D Low', value: '₹67,999', status: 'neutral', note: 'Only ₹1,000 away' },
      { label: 'Trend', value: '↓ Falling', status: 'optimal', note: 'Down 4.2% this month' },
    ],
    actionAdvice: 'Flipkart currently offers the best deal with free express delivery. Further price drops are unlikely before major holiday sales.'
  };

  const isBuyNow = rec.verdict === 'BUY NOW';
  const confidence = rec.confidence || 88;

  const signalsToRender = rec.signalsList || [
    { label: 'Current Price', value: `₹${(rec.signals?.currentPrice || 68999).toLocaleString('en-IN')}`, status: 'optimal', note: 'Best across 6 stores' },
    { label: '30D Average', value: `₹${(rec.signals?.averagePrice || 71450).toLocaleString('en-IN')}`, status: 'neutral', note: 'Below avg' },
    { label: '30D Low', value: `₹${(rec.signals?.historicalLow || 67999).toLocaleString('en-IN')}`, status: 'neutral', note: 'Near floor' },
    { label: 'Trend', value: rec.signals?.trend ? `↓ ${rec.signals.trend}` : '↓ Falling', status: 'optimal', note: 'Softening' },
  ];

  return (
    <div className={`relative rounded-3xl border p-6 sm:p-7 shadow-card overflow-hidden transition-all ${
      isBuyNow
        ? 'bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white border-emerald-500/30'
        : 'bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 text-white border-amber-500/30'
    }`}>
      
      {/* Background glow orb */}
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
        isBuyNow ? 'bg-emerald-500/10' : 'bg-amber-500/10'
      }`}></div>

      {/* Card Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
            <Bot className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
              AI Price Intelligence
            </span>
            <h3 className="text-base font-bold text-white leading-tight">
              Smart Recommendation
            </h3>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300 border border-white/10">
          Phase 1 Demo
        </span>
      </div>

      {/* Primary Verdict Hero Badge */}
      <div className="my-5 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className={`px-4 py-1.5 rounded-xl font-black text-xl tracking-wider shadow-lg flex items-center gap-2 ${
              isBuyNow 
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' 
                : 'bg-amber-500 text-slate-950 shadow-amber-500/20'
            }`}>
              {isBuyNow ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span>{rec.verdict}</span>
            </div>
            
            <div>
              <h4 className="text-sm font-bold text-white">{rec.headline || 'Optimal Buying Window'}</h4>
              <span className="text-xs text-slate-300">Algorithmic buy-timing signal</span>
            </div>
          </div>

          {/* Recommendation Confidence Gauge */}
          <div className="flex flex-col sm:items-end min-w-[140px]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <span>Recommendation Confidence:</span>
              <span className="text-white font-black">{confidence}%</span>
            </div>
            
            <div className="w-full sm:w-32 h-2.5 bg-slate-800 rounded-full overflow-hidden mt-1.5 border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isBuyNow ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

        </div>

        {/* Supporting Explanation */}
        <p className="text-sm text-slate-300 mt-4 leading-relaxed font-normal">
          {rec.reason || rec.reasoning || "Today's price is below the recent 30-day average and is close to the historical low."}
        </p>
      </div>

      {/* Market Supporting Signals Grid */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Key Market Signals
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {signalsToRender.map((signal, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between"
            >
              <span className="text-[10px] text-slate-400 font-medium block">
                {signal.label}
              </span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                {signal.value}
              </span>
              <span className="text-[10px] text-emerald-400 mt-0.5 truncate block font-medium">
                {signal.note}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Advice Footnote */}
      {rec.actionAdvice && (
        <div className="mt-4 pt-3 border-t border-white/10 flex items-start gap-2 text-xs text-slate-400">
          <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed text-slate-300">{rec.actionAdvice}</p>
        </div>
      )}

    </div>
  );
};
