import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';
import { 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Info,
  Maximize2,
  Sparkles
} from 'lucide-react';
import { productService } from '../../services/productService';

export const PriceTrendChart = ({ productId = 'iphone-16', initialTimeframe = '30D' }) => {
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    productService.getPriceHistory(productId, timeframe).then((res) => {
      if (isMounted) {
        setTrendData(res);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [productId, timeframe]);

  const stats = trendData?.stats || {
    currentPrice: 68999,
    average30D: 71450,
    lowestRecorded: 67999,
    highestRecorded: 75999,
    changePercent30D: -4.2,
    trendDirection: 'falling',
  };

  const chartPoints = trendData?.data || [];

  // Custom chart tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const price = payload[0].value;
      const avg = payload[1]?.value;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-elevated border border-slate-700 text-xs backdrop-blur-md">
          <p className="font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-brand-400" />
            {label}, 2026
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">Recorded Price:</span>
              <span className="font-extrabold text-white text-sm">
                ₹{price.toLocaleString('en-IN')}
              </span>
            </div>
            {avg && (
              <div className="flex items-center justify-between gap-4 text-slate-400">
                <span>Moving Avg:</span>
                <span className="font-semibold">₹{avg.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8">
      
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Price History & Trends
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
              Interactive
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            How the lowest market price has fluctuated across verified retailers
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 self-start sm:self-auto">
          {['7D', '30D', '3M', '6M'].map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setTimeframe(period)}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                timeframe === period
                  ? 'bg-white text-slate-900 shadow-subtle'
                  : 'hover:text-slate-900'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Key Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        
        {/* Current Price */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
            Current Best
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 block">
            ₹{stats.currentPrice.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <TrendingDown className="w-3 h-3" />
            {stats.changePercent30D}% in 30D
          </span>
        </div>

        {/* 30-Day Average */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
            30-Day Average
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-slate-800 mt-0.5 block">
            ₹{stats.average30D.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Mean benchmark
          </span>
        </div>

        {/* Lowest Recorded */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
          <span className="text-[11px] font-semibold text-emerald-800 block uppercase tracking-wider">
            Lowest Recorded
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-emerald-700 mt-0.5 block">
            ₹{stats.lowestRecorded.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
            All-time floor
          </span>
        </div>

        {/* Highest Recorded */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
            Highest Recorded
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-slate-800 mt-0.5 block">
            ₹{stats.highestRecorded.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Launch/Peak MSRP
          </span>
        </div>

      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0e8ce6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0e8ce6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis 
              domain={['dataMin - 1000', 'dataMax + 1000']}
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={stats.average30D} 
              stroke="#94a3b8" 
              strokeDasharray="4 4" 
              label={{ 
                value: '30D Avg', 
                fill: '#64748b', 
                fontSize: 10, 
                position: 'insideBottomRight' 
              }} 
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#0e8ce6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#priceGradient)"
              activeDot={{ r: 6, fill: '#026fc5', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-brand-500 rounded"></span>
            <span>Recorded Price</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 border-t border-dashed border-slate-400"></span>
            <span>30-Day Moving Average</span>
          </span>
        </div>
        <span>Timeframe: {timeframe} history</span>
      </div>

    </div>
  );
};
