import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ShieldCheck, 
  Cpu, 
  ArrowUpRight, 
  Mail, 
  Check, 
  ShoppingBag,
  Clock,
  Sparkles
} from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Col 1 & 2: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                  <path d="m8 16 3-3 2 2 3-3" stroke="#10b981" strokeWidth="2.5" />
                </svg>
              </div>
              <span className="font-bold text-xl text-white tracking-tight">Smart Shopping</span>
            </Link>
            
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              AI-driven shopping intelligence. We normalize product listings across e-commerce giants and 10-minute quick commerce apps, tracking historical price cycles so you never overpay.
            </p>

            <div className="flex items-center gap-2 pt-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Tracking 6 Major Platforms in Real-Time</span>
            </div>
          </div>

          {/* Col 3: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home Landing</Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-white transition-colors">Multi-Store Compare</Link>
              </li>
              <li>
                <Link to="/trends" className="hover:text-white transition-colors">Price Trend Radar</Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
              </li>
              <li>
                <Link to="/watchlist" className="hover:text-white transition-colors">Personal Watchlist</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Supported Channels */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Supported Stores</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Amazon India</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>Flipkart</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                <span>Croma Retail</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                <span>Blinkit (Quick)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span>Zepto (Quick)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                <span>Swiggy Instamart</span>
              </li>
            </ul>
          </div>

          {/* Col 5: Intelligence & Alert updates */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Price Drop Radar</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Get notified of sudden algorithmic flash discounts across tech & electronics.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Enter email..."
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 w-full"
                readOnly
                value="demo-user@smartshopping.ai"
              />
              <button 
                className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                onClick={() => alert('Demo Newsletter Subscribed!')}
              >
                Subscribed
              </button>
            </div>
            <span className="text-[11px] text-slate-500 block">No spam. Only deep discounts.</span>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Smart Shopping. All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-slate-400">Phase 1 Frontend Architecture</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Designed for Clean Intelligence</span>
            <span>•</span>
            <Link to="/how-it-works" className="hover:text-slate-300">Architecture Specs</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
