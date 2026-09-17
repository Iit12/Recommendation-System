import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LineChart, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Search, 
  ArrowRight, 
  Filter,
  Sparkles,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts';
import { productService } from '../services/productService';

export const TrendsPage = () => {
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      productService.getAllTrends(),
      productService.getCategories()
    ]).then(([trendList, catList]) => {
      if (isMounted) {
        setTrends(trendList);
        setCategories(catList);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const filtered = trends.filter((item) => {
    const matchesCat = selectedCat === 'all' || item.category.toLowerCase().includes(selectedCat.toLowerCase());
    const matchesQuery = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold mb-3">
            <LineChart className="w-3.5 h-3.5" />
            <span>Market Fluctuation Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Price Trends Radar
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Discover how products move in price over time across e-commerce and quick commerce platforms to time your purchases perfectly.
          </p>
        </div>

        {/* Search bar inside Trends */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter trend radar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-subtle"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCat === cat.id
                ? 'bg-slate-900 text-white shadow-subtle'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => {
          const stats = item.trendStats;
          const isDrop = stats.trendDirection === 'falling';
          const isRise = stats.trendDirection === 'rising';
          const sparkColor = isDrop ? '#10b981' : isRise ? '#ef4444' : '#64748b';

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all p-6 flex flex-col justify-between group"
            >
              <div>
                
                {/* Card Top: Brand, Category, Trend Badge */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 p-2 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                      <img src={item.image} alt={item.name} className="max-h-full object-contain" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      <span className="text-[11px] text-slate-600 font-semibold">{item.category} • {item.brand}</span>
                    </div>
                  </div>

                  {/* Trend Indicator Badge */}
                  <div className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1 flex-shrink-0 ${
                    isDrop 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : isRise
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {isDrop && <TrendingDown className="w-3.5 h-3.5" />}
                    {isRise && <TrendingUp className="w-3.5 h-3.5" />}
                    <span>{stats.changePercent30D > 0 ? `+${stats.changePercent30D}%` : `${stats.changePercent30D}%`}</span>
                  </div>
                </div>

                {/* 7-Day Mini Sparkline Chart */}
                <div className="h-20 w-full my-2 bg-slate-50/50 rounded-xl p-2 border border-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={item.miniHistory}>
                      <defs>
                        <linearGradient id={`trendGrad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={sparkColor} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={sparkColor} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={sparkColor}
                        strokeWidth={2.5}
                        fill={`url(#trendGrad-${item.id})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Price Metrics Triplets */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center my-4">
                  <div>
                    <span className="text-[10px] text-slate-600 font-semibold block uppercase">Current</span>
                    <span className="text-xs font-extrabold text-slate-900 block mt-0.5">
                      ₹{stats.currentPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="border-x border-slate-200/80 px-1">
                    <span className="text-[10px] text-slate-600 font-semibold block uppercase">30D Avg</span>
                    <span className="text-xs font-bold text-slate-700 block mt-0.5">
                      ₹{stats.average30D.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-800 font-bold block uppercase">30D Low</span>
                    <span className="text-xs font-extrabold text-emerald-700 block mt-0.5">
                      ₹{stats.lowestRecorded.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* ML Verdict snippet */}
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-600 font-semibold">AI Recommendation:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    item.recommendationVerdict === 'BUY NOW' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.recommendationVerdict}
                  </span>
                </div>

              </div>

              {/* Compare Action Button */}
              <Link
                to={`/compare?id=${item.id}`}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-brand-600 text-white transition-all shadow-subtle"
              >
                <span>View Full Comparison & History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

            </div>
          );
        })}
      </div>

    </div>
  );
};
