import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  LineChart, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Search, 
  ArrowRight, 
  Filter,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  Clock,
  Calendar,
  Layers,
  ShoppingBag,
  Store,
  RefreshCw,
  Info,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { trendService } from '../services/trendService';

// Known canonical products available in MongoDB catalog for quick switching
const CATALOG_PRODUCTS = [
  { id: 'apple-iphone-16-128gb-black', label: 'Apple iPhone 16 (128GB, Black)', brand: 'Apple' },
  { id: 'sony-wh-1000xm5-silver', label: 'Sony WH-1000XM5 (Silver)', brand: 'Sony' }
];

// Helper: Format INR currency
const formatCurrency = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  return `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

// Helper: Format percentage
const formatPercent = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  const num = Number(val);
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
};

// Helper: Format date & time
const formatDateTime = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper: Format short chart timestamp
const formatChartDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Component: Trend Badge matching backend exact 5 classifications
const TrendBadge = ({ trend, size = 'default' }) => {
  const normalized = (trend || 'NO_DATA').toUpperCase();

  const config = {
    INCREASING: {
      label: 'INCREASING',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: TrendingUp,
      accent: '#ef4444'
    },
    DECREASING: {
      label: 'DECREASING',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: TrendingDown,
      accent: '#10b981'
    },
    STABLE: {
      label: 'STABLE',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Minus,
      accent: '#3b82f6'
    },
    INSUFFICIENT_DATA: {
      label: 'INSUFFICIENT DATA',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertTriangle,
      accent: '#f59e0b'
    },
    NO_DATA: {
      label: 'NO DATA',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: HelpCircle,
      accent: '#64748b'
    }
  };

  const current = config[normalized] || config.NO_DATA;
  const Icon = current.icon;
  const isSmall = size === 'small';

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-lg border ${current.color} ${
        isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      }`}
    >
      <Icon className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{current.label}</span>
    </span>
  );
};

// Custom Chart Tooltip
const CustomChartTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-elevated border border-slate-700 text-xs backdrop-blur-md min-w-[200px]">
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800">
          <span className="font-bold text-slate-300">{data.platform || 'Recorded Price'}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
            data.inStock ? 'bg-emerald-900/80 text-emerald-300' : 'bg-rose-900/80 text-rose-300'
          }`}>
            {data.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Effective Price:</span>
            <span className="font-black text-white text-sm text-brand-400">
              {formatCurrency(data.price)}
            </span>
          </div>
          {data.originalPrice && data.originalPrice > data.price && (
            <div className="flex items-center justify-between gap-4 text-slate-400 text-[11px]">
              <span>MRP / List:</span>
              <span className="line-through">{formatCurrency(data.originalPrice)}</span>
            </div>
          )}
          {data.discount > 0 && (
            <div className="flex items-center justify-between gap-4 text-emerald-400 text-[11px]">
              <span>Discount:</span>
              <span>{data.discount}% OFF</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 text-slate-500 text-[10px] pt-1 border-t border-slate-800 mt-1">
            <span>Observed:</span>
            <span>{formatDateTime(data.collectedAt)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const TrendsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Product state: initialize from URL param (?id= or ?productId=) or default to apple-iphone-16-128gb-black
  const initialProductId = searchParams.get('productId') || searchParams.get('id') || 'apple-iphone-16-128gb-black';
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [customInputId, setCustomInputId] = useState(initialProductId);

  // Date filters
  const [fromDate, setFromDate] = useState(searchParams.get('from') || '');
  const [toDate, setToDate] = useState(searchParams.get('to') || '');
  const [appliedFilters, setAppliedFilters] = useState({
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || ''
  });
  const [validationError, setValidationError] = useState('');

  // API Data States
  const [trendData, setTrendData] = useState(null);
  const [platformData, setPlatformData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronize URL query params
  const updateUrlParams = (productId, from, to) => {
    const params = new URLSearchParams();
    if (productId) params.set('id', productId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    setSearchParams(params, { replace: true });
  };

  // Main data fetcher: queries Phase 6 Trend API, Platform API, and Phase 5 History API
  const fetchData = useCallback(async (productId, filters) => {
    setLoading(true);
    setError(null);

    try {
      const [trendRes, platformRes, historyRes] = await Promise.all([
        trendService.getProductTrend(productId, filters),
        trendService.getPlatformTrends(productId, filters),
        trendService.getProductHistory(productId, filters)
      ]);

      setTrendData(trendRes);
      setPlatformData(platformRes);
      setHistoryData(historyRes);
    } catch (err) {
      console.error('[TrendsPage] API Fetch Error:', err);
      let userFriendlyMessage = 'Unable to load price trend data. Please make sure the backend server is running.';
      
      if (err.code === 'PRODUCT_NOT_FOUND' || err.status === 404) {
        userFriendlyMessage = `Product "${productId}" was not found in the historical catalog.`;
      } else if (err.code === 'INVALID_DATE_RANGE' || err.status === 400) {
        userFriendlyMessage = err.message || 'Invalid date range filter specified.';
      } else if (err.code === 'NETWORK_ERROR') {
        userFriendlyMessage = 'Could not connect to the backend server at http://127.0.0.1:5000. Please verify the backend service is running.';
      }
      
      setError({
        message: userFriendlyMessage,
        code: err.code || 'UNKNOWN_ERROR',
        details: err.details
      });
      setTrendData(null);
      setPlatformData(null);
      setHistoryData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when selected product or applied filters change
  useEffect(() => {
    fetchData(selectedProductId, appliedFilters);
  }, [selectedProductId, appliedFilters, fetchData]);

  // Handle Product Switch
  const handleProductSelect = (productId) => {
    setSelectedProductId(productId);
    setCustomInputId(productId);
    updateUrlParams(productId, appliedFilters.from, appliedFilters.to);
  };

  // Handle Manual Product ID Submission
  const handleCustomIdSubmit = (e) => {
    e.preventDefault();
    if (customInputId && customInputId.trim()) {
      handleProductSelect(customInputId.trim());
    }
  };

  // Handle Date Filter Apply
  const handleFilterApply = (e) => {
    e.preventDefault();
    setValidationError('');

    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setValidationError('Start date ("From") cannot be after end date ("To").');
      return;
    }

    const newFilters = { from: fromDate, to: toDate };
    setAppliedFilters(newFilters);
    updateUrlParams(selectedProductId, fromDate, toDate);
  };

  // Handle Filter Reset
  const handleFilterReset = () => {
    setFromDate('');
    setToDate('');
    setValidationError('');
    const newFilters = { from: '', to: '' };
    setAppliedFilters(newFilters);
    updateUrlParams(selectedProductId, '', '');
  };

  // Prepare chart observations
  const chartObservations = (historyData?.observations || []).map((obs) => ({
    id: obs._id || obs.listingId,
    timestamp: obs.collectedAt,
    date: formatChartDate(obs.collectedAt),
    price: obs.effectivePrice ?? obs.price,
    originalPrice: obs.originalPrice,
    discount: obs.discount,
    platform: obs.platform,
    inStock: obs.inStock,
    deliveryText: obs.deliveryText
  }));

  // Determine chart trend color
  const trendColor = trendData?.trend === 'DECREASING' 
    ? '#10b981' 
    : trendData?.trend === 'INCREASING' 
    ? '#ef4444' 
    : '#0284c7';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold mb-3">
            <LineChart className="w-3.5 h-3.5" />
            <span>Phase 6 Statistical Trend Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Historical Price Trends
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Live deterministic price trend analysis calculated from real MongoDB historical price observations across multi-platform retailers.
          </p>
        </div>

        {/* Product ID Direct Input */}
        <form onSubmit={handleCustomIdSubmit} className="w-full md:w-96 relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Product ID (e.g. apple-iphone-16-128gb-black)"
              value={customInputId}
              onChange={(e) => setCustomInputId(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-subtle"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-900 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-colors shadow-subtle flex-shrink-0"
          >
            Load
          </button>
        </form>
      </div>

      {/* 2. Canonical Product Selector Chips */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
          Select Catalog Product:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATALOG_PRODUCTS.map((prod) => (
            <button
              key={prod.id}
              onClick={() => handleProductSelect(prod.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedProductId === prod.id
                  ? 'bg-slate-900 text-white shadow-subtle'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 opacity-70" />
              <span>{prod.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Date Range Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-subtle">
        <form onSubmit={handleFilterApply} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                From Date (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                To Date (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors shadow-subtle flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Apply Filter</span>
              </button>
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={handleFilterReset}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-600 font-medium block">Active Product ID:</span>
            <code className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              {selectedProductId}
            </code>
          </div>
        </form>

        {validationError && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* 4. Main Loading State */}
      {loading && (
        <div className="space-y-6 animate-pulse py-6">
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-brand-600 animate-spin" />
            <div>
              <h4 className="text-sm font-bold text-brand-900">Loading Price Trend Data...</h4>
              <p className="text-xs text-brand-700">Connecting to MongoDB historical price pipeline at /api/v1/trends/products/{selectedProductId}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-24 bg-slate-200/80 rounded-2xl"></div>
            ))}
          </div>
          <div className="h-80 bg-slate-200/80 rounded-3xl"></div>
        </div>
      )}

      {/* 5. Error State (NO mock fallback) */}
      {!loading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-4 shadow-card">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900">Price Trend Error</h3>
            <p className="text-sm text-rose-700 font-medium">{error.message}</p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => fetchData(selectedProductId, appliedFilters)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-subtle flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Request</span>
            </button>
            <button
              onClick={() => handleProductSelect('apple-iphone-16-128gb-black')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Load Default Product
            </button>
          </div>
        </div>
      )}

      {/* 6. Active Real Trend Content */}
      {!loading && !error && trendData && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Canonical Product Summary Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  {trendData.brand || 'Product'} • {trendData.model || 'Canonical'}
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  trendData.latestInStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {trendData.latestInStock ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{trendData.latestInStock ? 'In Stock' : 'Out of Stock'}</span>
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {trendData.canonicalTitle || selectedProductId}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Last Observed: <strong>{formatDateTime(trendData.lastObservedAt)}</strong></span>
                </span>
                <span>•</span>
                <span>First Observed: <strong>{formatDateTime(trendData.firstObservedAt)}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <Link
                to={`/compare?id=${selectedProductId}`}
                className="px-4 py-2.5 bg-slate-900 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-colors shadow-subtle flex items-center gap-1.5"
              >
                <span>View Store Comparison</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Real Trend Metrics Cards (Grid of 8 Phase 6 Statistical Metrics) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Current Price */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                Current Price
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
                {formatCurrency(trendData.currentPrice)}
              </span>
              <span className="text-[11px] text-slate-600 mt-1 block">
                From {formatCurrency(trendData.firstPrice)} launch
              </span>
            </div>

            {/* Lowest Recorded */}
            <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200/80 p-4 shadow-subtle">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Lowest Recorded
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 block">
                {formatCurrency(trendData.lowestPrice)}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                Historical Floor
              </span>
            </div>

            {/* Highest Recorded */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                Highest Recorded
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-800 mt-1 block">
                {formatCurrency(trendData.highestPrice)}
              </span>
              <span className="text-[11px] text-slate-600 mt-1 block">
                Historical Peak
              </span>
            </div>

            {/* Average Price */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                Average Price
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-800 mt-1 block">
                {formatCurrency(trendData.averagePrice)}
              </span>
              <span className="text-[11px] text-slate-600 mt-1 block">
                Arithmetic Mean
              </span>
            </div>

            {/* Price Change (₹ & %) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                Net Price Change
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-lg sm:text-xl font-black text-slate-900">
                  {formatCurrency(trendData.priceChange)}
                </span>
              </div>
              <span className={`text-[11px] font-bold mt-1 block ${
                trendData.percentageChange < 0 ? 'text-emerald-600' : trendData.percentageChange > 0 ? 'text-rose-600' : 'text-slate-600'
              }`}>
                {formatPercent(trendData.percentageChange)} overall
              </span>
            </div>

            {/* Trend Classification */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                Trend Classification
              </span>
              <div className="mt-2">
                <TrendBadge trend={trendData.trend} />
              </div>
              <span className="text-[10px] text-slate-600 mt-1.5 block">
                Source: Phase 6 Engine
              </span>
            </div>

            {/* Total Observations */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                Observations
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
                {trendData.observationCount ?? 0}
              </span>
              <span className="text-[11px] text-slate-600 mt-1 block">
                {trendData.invalidObservationCount ? `${trendData.invalidObservationCount} filtered` : '0 filtered observations'}
              </span>
            </div>

            {/* Statistical Volatility */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                Price Volatility (σ / CV)
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 mt-1 block">
                {formatCurrency(trendData.volatility?.standardDeviation)}
              </span>
              <span className="text-[11px] text-slate-600 mt-1 block">
                CV: {trendData.volatility?.coefficientOfVariation != null ? `${trendData.volatility.coefficientOfVariation}%` : '—'}
              </span>
            </div>

          </div>

          {/* 7. Historical Price Chart Section (MongoDB Observations) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Chronological Price Timeline
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                    MongoDB History
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real price observations recorded across platforms over time
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Activity className="w-3.5 h-3.5 text-brand-600" />
                <span>{chartObservations.length} Chronological Observations</span>
              </div>
            </div>

            {chartObservations.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <HelpCircle className="w-8 h-8 text-slate-400 mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No Historical Observations Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  No historical price observations were returned for this product within the selected date filter.
                </p>
              </div>
            ) : (
              <div className="w-full h-80 sm:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartObservations} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={trendColor} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={trendColor} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis 
                      domain={['dataMin - 1000', 'dataMax + 1000']}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    {trendData.averagePrice && (
                      <ReferenceLine 
                        y={trendData.averagePrice} 
                        stroke="#94a3b8" 
                        strokeDasharray="4 4" 
                        label={{ 
                          value: `Mean ₹${Number(trendData.averagePrice).toFixed(0)}`, 
                          fill: '#64748b', 
                          fontSize: 10, 
                          position: 'insideBottomRight' 
                        }} 
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={trendColor}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#trendGradient)"
                      activeDot={{ r: 6, fill: trendColor, stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1 rounded" style={{ backgroundColor: trendColor }}></span>
                  <span>Effective Price Timeline</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t border-dashed border-slate-400"></span>
                  <span>Mean Benchmark (₹{Number(trendData.averagePrice || 0).toLocaleString('en-IN')})</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Range: {trendData.filter?.from || 'All'} → {trendData.filter?.to || 'Present'}
              </span>
            </div>
          </div>

          {/* 8. Platform Breakdown Section (GET /api/v1/trends/products/:productId/platforms) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Platform-Wise Price Fluctuations
                </h3>
                <p className="text-xs text-slate-500">
                  Segmented statistical trend breakdown for each store
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600">
                {Object.keys(platformData?.platforms || {}).length} Verified Retailers
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Object.entries(platformData?.platforms || {}).map(([platformName, pStats]) => {
                return (
                  <div
                    key={platformName}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Platform header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-slate-600" />
                          <h4 className="font-bold text-slate-900 text-sm">
                            {platformName}
                          </h4>
                        </div>
                        <TrendBadge trend={pStats.trend} size="small" />
                      </div>

                      {/* Platform stats triplet */}
                      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center my-3">
                        <div>
                          <span className="text-[9px] text-slate-600 font-bold uppercase block">Current</span>
                          <span className="text-xs font-black text-slate-900 block mt-0.5">
                            {formatCurrency(pStats.currentPrice)}
                          </span>
                        </div>
                        <div className="border-x border-slate-200/80 px-1">
                          <span className="text-[9px] text-slate-600 font-bold uppercase block">Average</span>
                          <span className="text-xs font-bold text-slate-700 block mt-0.5">
                            {formatCurrency(pStats.averagePrice)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-emerald-800 font-bold uppercase block">Lowest</span>
                          <span className="text-xs font-black text-emerald-700 block mt-0.5">
                            {formatCurrency(pStats.lowestPrice)}
                          </span>
                        </div>
                      </div>

                      {/* Metadata rows */}
                      <div className="space-y-1.5 text-xs pt-1">
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>Observations:</span>
                          <span className="font-bold text-slate-700">{pStats.observationCount} samples</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>Net Change:</span>
                          <span className={`font-bold ${
                            pStats.priceChange < 0 ? 'text-emerald-600' : pStats.priceChange > 0 ? 'text-rose-600' : 'text-slate-600'
                          }`}>
                            {formatCurrency(pStats.priceChange)} ({formatPercent(pStats.percentageChange)})
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>Stock Status:</span>
                          <span className={`font-bold ${
                            pStats.latestInStock ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {pStats.latestInStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 text-[10px] text-slate-600 flex items-center justify-between">
                      <span>Highest: {formatCurrency(pStats.highestPrice)}</span>
                      <span>σ: {formatCurrency(pStats.volatility?.standardDeviation)}</span>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
