import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Info,
  Clock,
  Zap,
  Store,
  RefreshCw,
  HelpCircle,
  ShieldAlert,
  Layers,
  Activity,
  Sliders
} from 'lucide-react';

// Format INR currency
const formatCurrency = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

// Format percentage
const formatPercent = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  const num = Number(val);
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
};

export const RecommendationCard = ({
  recommendationData,
  loading = false,
  error = null,
  onRetry = null,
}) => {
  // 1. Loading State
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-700/60 bg-slate-900 p-6 sm:p-7 shadow-card text-white animate-pulse space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-800 rounded w-1/4"></div>
        </div>
        <div className="h-24 bg-slate-800/80 rounded-2xl"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-800/60 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Error State (No Mock Fallback)
  if (error || !recommendationData) {
    return (
      <div className="rounded-3xl border border-rose-800/50 bg-slate-950 p-6 sm:p-7 shadow-card text-white space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-900/60 border border-rose-700/60 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              Recommendation Engine
            </span>
            <h3 className="text-base font-bold text-white">
              Recommendation Unavailable
            </h3>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {error?.message || 'Unable to retrieve real-time recommendation data from the backend.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-subtle"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Recommendation</span>
          </button>
        )}
      </div>
    );
  }

  // Extract backend payload
  const {
    recommendation = {},
    reasons = [],
    evidence = {},
    platform = {},
    limitations = [],
    product = {}
  } = recommendationData;

  const action = (recommendation.action || 'NEUTRAL').toUpperCase();
  const score = typeof recommendation.score === 'number' ? recommendation.score : 50;
  const recommendationType = recommendation.type || 'HEURISTIC';
  const componentScores = recommendation.componentScores || {};

  const isBuyNow = action === 'BUY_NOW';
  const isWait = action === 'WAIT';
  const isNeutral = action === 'NEUTRAL';

  // Card themes based on deterministic action
  const cardConfig = {
    BUY_NOW: {
      gradient: 'from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/40',
      glow: 'bg-emerald-500/10',
      badgeBg: 'bg-emerald-500 text-slate-950 shadow-emerald-500/20',
      accentColor: 'text-emerald-400',
      scoreBarColor: 'bg-emerald-400',
      icon: CheckCircle2,
      headline: 'Optimal Buying Opportunity',
      subtitle: 'Current pricing evidence supports purchasing now',
    },
    WAIT: {
      gradient: 'from-amber-950 via-slate-900 to-slate-950 border-amber-500/40',
      glow: 'bg-amber-500/10',
      badgeBg: 'bg-amber-500 text-slate-950 shadow-amber-500/20',
      accentColor: 'text-amber-400',
      scoreBarColor: 'bg-amber-400',
      icon: Clock,
      headline: 'Wait for Favorable Movement',
      subtitle: 'Price is elevated or downward momentum may yield lower prices',
    },
    NEUTRAL: {
      gradient: 'from-slate-900 via-slate-900 to-slate-950 border-blue-500/30',
      glow: 'bg-blue-500/10',
      badgeBg: 'bg-blue-500 text-slate-950 shadow-blue-500/20',
      accentColor: 'text-blue-400',
      scoreBarColor: 'bg-blue-400',
      icon: Minus,
      headline: 'Neutral Market Signal',
      subtitle: 'Balanced market signals or limited historical observations',
    }
  };

  const theme = cardConfig[action] || cardConfig.NEUTRAL;
  const ActionIcon = theme.icon;

  // Check if any reason represents a conflicting signal
  const hasConflictReason = reasons.some(
    (r) => r.toLowerCase().includes('suggesting prices may drop further') ||
           r.toLowerCase().includes('volatility is elevated')
  );

  return (
    <div className={`relative rounded-3xl border p-6 sm:p-7 shadow-card overflow-hidden transition-all bg-gradient-to-br ${theme.gradient} text-white`}>
      
      {/* Background glow orb */}
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${theme.glow}`}></div>

      {/* 1. Header: Engine Type & Meta */}
      <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
            <Zap className={`w-4 h-4 ${theme.accentColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold tracking-wider uppercase ${theme.accentColor}`}>
                Phase 7.1 Recommendation
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300 border border-white/10">
                {recommendationType}
              </span>
            </div>
            <h3 className="text-base font-bold text-white leading-tight">
              Purchase Timing Verdict
            </h3>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          {evidence.observations ? `${evidence.observations} Obs Recorded` : 'Historical Engine'}
        </span>
      </div>

      {/* 2. Primary Action Hero & Heuristic Score Gauge */}
      <div className="my-5 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md relative z-10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Action Badge */}
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl font-black text-lg sm:text-xl tracking-wider shadow-lg flex items-center gap-2 ${theme.badgeBg}`}>
              <ActionIcon className="w-5 h-5" />
              <span>{action}</span>
            </div>
            
            <div>
              <h4 className="text-sm font-bold text-white">{theme.headline}</h4>
              <span className="text-xs text-slate-300">{theme.subtitle}</span>
            </div>
          </div>

          {/* Heuristic Score (0-100) */}
          <div className="flex flex-col sm:items-end min-w-[150px]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <span>Heuristic Score:</span>
              <span className="text-white font-black text-sm">{score} / 100</span>
            </div>
            
            <div className="w-full sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden mt-1.5 border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-700 ${theme.scoreBarColor}`}
                style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Deterministic Rule-Based</span>
          </div>

        </div>

        {/* Conflicting Signals Alert Callout */}
        {hasConflictReason && (
          <div className="p-3 rounded-xl bg-amber-900/40 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-300">Conflicting Market Signals Detected</span>
              <span className="text-[11px] text-amber-200/90 leading-relaxed">
                The engine detected mixed indicators (e.g. attractive baseline price alongside downward price momentum or elevated volatility).
              </span>
            </div>
          </div>
        )}

        {/* Component Scoring Breakdown Pills */}
        {componentScores && Object.keys(componentScores).length > 0 && (
          <div className="pt-2 border-t border-white/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Score Component Contributions
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 block truncate">Price vs Avg</span>
                <span className="font-bold text-white">{componentScores.priceVsAverage ?? '—'} <span className="text-[9px] text-slate-400">/35</span></span>
              </div>
              <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 block truncate">Price vs Low</span>
                <span className="font-bold text-white">{componentScores.priceVsLow ?? '—'} <span className="text-[9px] text-slate-400">/25</span></span>
              </div>
              <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 block truncate">Trend Momentum</span>
                <span className="font-bold text-white">{componentScores.trendMomentum ?? '—'} <span className="text-[9px] text-slate-400">/20</span></span>
              </div>
              <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 block truncate">Store Spread</span>
                <span className="font-bold text-white">{componentScores.platformAdvantage ?? '—'} <span className="text-[9px] text-slate-400">/10</span></span>
              </div>
              <div className="p-2 bg-white/5 rounded-lg border border-white/5 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block truncate">Volatility</span>
                <span className="font-bold text-white">{componentScores.volatility ?? '—'} <span className="text-[9px] text-slate-400">/10</span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Explainable Human-Readable Reasons */}
      <div className="space-y-2 relative z-10 mb-5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Evidence-Based Reasons
        </span>
        <div className="space-y-1.5">
          {reasons.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
              <p className="leading-relaxed">{reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Underlying Price Evidence Matrix */}
      <div className="space-y-2 relative z-10 mb-5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Measurable Price Evidence
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-medium block">Current Price</span>
            <span className="text-sm font-bold text-white mt-0.5 block">{formatCurrency(evidence.currentPrice)}</span>
            <span className={`text-[10px] block font-semibold ${evidence.latestInStock ? 'text-emerald-400' : 'text-rose-400'}`}>
              {evidence.latestInStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-medium block">Historical Average</span>
            <span className="text-sm font-bold text-white mt-0.5 block">{formatCurrency(evidence.historicalAverage)}</span>
            <span className="text-[10px] text-slate-400 block">Arithmetic Mean</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-medium block">Historical Floor</span>
            <span className="text-sm font-bold text-emerald-400 mt-0.5 block">{formatCurrency(evidence.historicalLow)}</span>
            <span className="text-[10px] text-slate-400 block">Peak: {formatCurrency(evidence.historicalHigh)}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-medium block">Trend & Volatility</span>
            <span className="text-xs font-bold text-white mt-0.5 block">{evidence.trend || 'STABLE'}</span>
            <span className="text-[10px] text-slate-400 block">CV: {evidence.coefficientOfVariation != null ? `${evidence.coefficientOfVariation}%` : '—'}</span>
          </div>
        </div>
      </div>

      {/* 5. Best Platform Arbitrage Callout */}
      {platform.bestPlatform && (
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs relative z-10 mb-4">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-brand-400" />
            <span>
              Best Current Offer: <strong className="text-white">{platform.bestPlatform}</strong> at <strong className="text-brand-300">{formatCurrency(platform.bestPrice)}</strong>
            </span>
          </div>
          {platform.priceSpread > 0 && (
            <span className="text-emerald-400 font-semibold text-[11px]">
              Save {formatCurrency(platform.priceSpread)} ({platform.platformSpreadPercent}%) vs other stores
            </span>
          )}
        </div>
      )}

      {/* 6. Disclaimers & Limitations */}
      <div className="pt-3 border-t border-white/10 text-[10px] text-slate-400 space-y-1 relative z-10">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Heuristic Transparency Notes:</span>
        </div>
        <ul className="list-disc list-inside space-y-0.5 text-slate-400 pl-1">
          {limitations.map((lim, idx) => (
            <li key={idx}>{lim}</li>
          ))}
        </ul>
      </div>

    </div>
  );
};
