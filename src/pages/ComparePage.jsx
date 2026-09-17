import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  Store, 
  Clock, 
  ShieldCheck, 
  Bell, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Filter
} from 'lucide-react';
import { SearchBar } from '../components/common/SearchBar';
import { ProductSummaryCard } from '../components/compare/ProductSummaryCard';
import { PriceComparisonTable } from '../components/compare/PriceComparisonTable';
import { PriceInsightCard } from '../components/compare/PriceInsightCard';
import { PriceTrendChart } from '../components/compare/PriceTrendChart';
import { RecommendationCard } from '../components/compare/RecommendationCard';
import { ProductSpecs } from '../components/compare/ProductSpecs';
import { PriceAlertModal } from '../components/common/PriceAlertModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { recommendationService } from '../services/recommendationService';
import { PRODUCTS } from '../data/products';
import { PRICE_TRENDS } from '../data/trends';

// Canonical ID resolution mapping for Phase 5/6/7 MongoDB backend
const CANONICAL_ID_MAP = {
  'iphone-16': 'apple-iphone-16-128gb-black',
  'apple-iphone-16': 'apple-iphone-16-128gb-black',
  'apple-iphone-16-128gb-black': 'apple-iphone-16-128gb-black',
  'sony-wh-1000xm5': 'sony-wh-1000xm5-silver',
  'sony-wh-1000xm5-silver': 'sony-wh-1000xm5-silver',
};

const resolveCanonicalId = (id) => {
  if (!id) return 'apple-iphone-16-128gb-black';
  const clean = String(id).toLowerCase().trim();
  return CANONICAL_ID_MAP[clean] || clean;
};

export const ComparePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get product ID or default cleanly to 'iphone-16'
  const idParam = searchParams.get('id') || searchParams.get('q') || 'iphone-16';
  const fromParam = searchParams.get('from') || '';
  const toParam = searchParams.get('to') || '';

  const [currentProduct, setCurrentProduct] = useState(() => {
    return PRODUCTS.find((p) => p.id === 'iphone-16') || PRODUCTS[0];
  });

  const [trendStats, setTrendStats] = useState(() => {
    return PRICE_TRENDS['iphone-16']?.stats || null;
  });

  // Phase 7.1 Recommendation API State (Strictly from backend, no mock fallback)
  const [recommendationData, setRecommendationData] = useState(null);
  const [recLoading, setRecLoading] = useState(true);
  const [recError, setRecError] = useState(null);

  const [alertModalOpen, setAlertModalOpen] = useState(false);

  // Fetch real recommendation from Phase 7.1 REST API
  const fetchRecommendation = useCallback(async (productId, filters) => {
    setRecLoading(true);
    setRecError(null);

    const canonicalId = resolveCanonicalId(productId);

    try {
      const data = await recommendationService.getProductRecommendation(canonicalId, filters);
      setRecommendationData(data);
    } catch (err) {
      console.warn(`[ComparePage] Recommendation fetch failed for ${canonicalId}:`, err);
      let userMessage = 'Unable to retrieve price recommendation from backend.';
      if (err.code === 'PRODUCT_NOT_FOUND' || err.status === 404) {
        userMessage = `Recommendation unavailable for this product (${canonicalId}).`;
      } else if (err.code === 'INVALID_DATE_RANGE' || err.status === 400) {
        userMessage = err.message || 'Invalid date range specified for recommendation.';
      } else if (err.code === 'NETWORK_ERROR') {
        userMessage = 'Could not connect to the Smart Shopping API server at http://127.0.0.1:5000.';
      }

      setRecError({
        message: userMessage,
        code: err.code || 'API_ERROR',
        details: err.details
      });
      setRecommendationData(null);
    } finally {
      setRecLoading(false);
    }
  }, []);

  // Sync state & fetch recommendation whenever product or date filters change
  useEffect(() => {
    let isMounted = true;
    const targetId = idParam.toLowerCase().trim();

    // Find in local products data
    const matched = PRODUCTS.find((p) => 
      p.id.toLowerCase() === targetId ||
      p.name.toLowerCase().includes(targetId) ||
      p.shortTitle.toLowerCase().includes(targetId)
    ) || PRODUCTS[0];

    if (isMounted) {
      setCurrentProduct(matched);
      setTrendStats(PRICE_TRENDS[matched.id]?.stats || PRICE_TRENDS['iphone-16']?.stats);
      
      // Fetch fresh recommendation from real backend
      fetchRecommendation(targetId, { from: fromParam, to: toParam });
    }

    return () => {
      isMounted = false;
    };
  }, [idParam, fromParam, toParam, fetchRecommendation]);

  const handleSearchSubmit = (productId) => {
    if (productId) {
      setSearchParams({ id: productId });
    }
  };

  // Safe fallback if product is somehow missing
  const product = currentProduct || PRODUCTS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      
      {/* 1. Header & Breadcrumbs */}
      <div className="space-y-4">
        
        {/* Breadcrumbs: Home / Compare */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-brand-700 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">Compare</span>
          {product && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-700 font-medium truncate max-w-xs">{product.shortTitle || product.name}</span>
            </>
          )}
        </nav>

        {/* Page Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Price Comparison
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Compare effective store prices and review deterministic purchase timing recommendations.
            </p>
          </div>

          <button
            onClick={() => setAlertModalOpen(true)}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-brand-50 hover:text-brand-700 text-slate-700 border border-slate-200 hover:border-brand-300 transition-all flex items-center gap-1.5 shadow-subtle"
          >
            <Bell className="w-3.5 h-3.5 text-brand-600" />
            <span>Set Price Alert</span>
          </button>
        </div>

        {/* Search Bar at Top */}
        <div className="max-w-3xl pt-2">
          <SearchBar 
            initialValue={product.shortTitle || product.name}
            size="compact"
            showPopularChips={false}
            onSearchSubmit={handleSearchSubmit}
          />
        </div>

      </div>

      {/* 2. Product Summary Card */}
      <ProductSummaryCard 
        product={product} 
        onOpenAlertModal={() => setAlertModalOpen(true)} 
      />

      {/* 3. Live Multi-Store Comparison Table */}
      <PriceComparisonTable 
        listings={product.listings || []} 
        productName={product.name} 
      />

      {/* 4. Grid: Price Insight & Recommendation (Left) + Price History Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Price Insight & Phase 7.1 Recommendation Card */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Phase 7.1 Deterministic Heuristic Recommendation Card */}
          <RecommendationCard 
            recommendationData={recommendationData}
            loading={recLoading}
            error={recError}
            onRetry={() => fetchRecommendation(idParam, { from: fromParam, to: toParam })}
          />

          {/* Compact Price Insight Card */}
          <PriceInsightCard 
            product={product} 
            stats={trendStats} 
          />

          {/* Want a better price callout */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Want a better price?</h4>
                <p className="text-xs text-slate-500">Track price drops 24/7</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Set a price target for <strong>{product.shortTitle || product.name}</strong> to receive an alert the moment a store matches your target.
            </p>
            <button
              onClick={() => setAlertModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-brand-600 text-white transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Configure Price Alert</span>
            </button>
          </div>

        </div>

        {/* Right Column: Price History Chart */}
        <div className="lg:col-span-6">
          <PriceTrendChart 
            productId={product.id} 
            initialTimeframe="30D" 
          />
        </div>

      </div>

      {/* 5. Product Technical Specifications Grid */}
      <ProductSpecs 
        specs={product.specs || {}} 
        brand={product.brand || 'Brand'} 
        category={product.category || 'Category'} 
      />

      {/* Price Alert Modal */}
      <PriceAlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        product={product}
      />

    </div>
  );
};
