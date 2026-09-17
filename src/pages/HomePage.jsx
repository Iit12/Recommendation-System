import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  TrendingDown, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Clock, 
  Zap, 
  CheckCircle2, 
  LineChart, 
  Cpu, 
  ShoppingBag,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { SearchBar } from '../components/common/SearchBar';
import { PlatformStrip } from '../components/common/PlatformBadge';
import { ProductCard } from '../components/common/ProductCard';
import { productService } from '../services/productService';

export const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      productService.getTrendingProducts(),
      productService.getCategories()
    ]).then(([prodList, catList]) => {
      if (isMounted) {
        setProducts(prodList);
        setCategories(catList);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const features = [
    {
      icon: <Layers className="w-6 h-6 text-brand-600" />,
      title: 'Compare Prices',
      description: 'See normalized prices, hidden delivery fees, and discount codes from multiple platforms in one place.',
    },
    {
      icon: <LineChart className="w-6 h-6 text-emerald-600" />,
      title: 'Track Price History',
      description: 'Understand how the price has fluctuated across 7 days to 6 months before spending your hard-earned money.',
    },
    {
      icon: <Cpu className="w-6 h-6 text-indigo-600" />,
      title: 'Smart Product Matching',
      description: 'Identify the exact same variant across stores even when retailers use inconsistent titles or keywords.',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-amber-600" />,
      title: 'Buy or Wait Intelligence',
      description: 'Use price trend velocity and historical floors to know if today is the best time to purchase.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-8 overflow-hidden">
        {/* Ambient background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-200/40 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-bold mb-6 shadow-subtle animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>AI-Powered Shopping Price Intelligence</span>
          </div>

          {/* Main Hero Headings */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-5">
            Find the best price. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-800">
              Know when to buy.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Compare prices across shopping platforms and understand whether today's price is actually a good deal.
          </p>

          {/* Search Bar Container */}
          <div className="max-w-2xl mx-auto text-left">
            <SearchBar size="large" autoFocus={false} />
          </div>

        </div>
      </section>

      {/* Trust / Platform Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card">
          <PlatformStrip />
        </div>
      </section>

      {/* Feature Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How Smart Shopping Works
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Built to eliminate seller price manipulation and unfair marketplace markups.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card hover:shadow-card-hover hover:border-brand-200 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {feat.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-50 text-[11px] font-semibold text-brand-600 flex items-center gap-1 group-hover:gap-1.5 transition-all">
                <span>Explore feature</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Products / Trending Searches */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-rose-50 text-rose-600">
                <Flame className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                Trending Deals & Price Drops
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Popular Products Today
            </h2>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-subtle'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Bottom Explorer CTA */}
        <div className="mt-12 text-center">
          <Link
            to="/trends"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:border-brand-300 text-slate-800 hover:text-brand-600 font-bold text-sm shadow-card hover:shadow-card-hover transition-all"
          >
            <span>View Full Market Price Trends Radar</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </section>

      {/* Value Proposition Callout Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 p-8 sm:p-12 text-white shadow-elevated relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Never Overpay Again
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Ready to verify a product before purchasing?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Paste any product title or link to cross-examine prices across 6 Indian platforms with automatic discount normalization.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/compare')}
                className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm transition-all shadow-md active:scale-98"
              >
                Launch Price Comparison Tool
              </button>
              <Link
                to="/how-it-works"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/10"
              >
                Learn How We Track
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
