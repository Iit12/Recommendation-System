import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Search, 
  Heart, 
  User, 
  Menu, 
  X, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { useWatchlist } from '../../context/WatchlistContext';

export const Navbar = ({ onOpenSearch }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { count } = useWatchlist();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Compare', path: '/compare' },
    { name: 'Price Trends', path: '/trends' },
    { name: 'How It Works', path: '/how-it-works' },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-header border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md group-hover:bg-brand-600 transition-colors">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
                <path d="m8 16 3-3 2 2 3-3" stroke="#10b981" strokeWidth="2.5" />
              </svg>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                Smart Shopping
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">AI</span>
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:block -mt-0.5">Compare smarter. Buy at the right time.</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'text-brand-700 bg-brand-50/80 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Search Trigger */}
            <button
              onClick={() => {
                if (onOpenSearch) onOpenSearch();
                else navigate('/compare');
              }}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 group"
              title="Search Products (Ctrl+K)"
            >
              <Search className="w-4 h-4 text-slate-500 group-hover:text-brand-600 transition-colors" />
              <span className="hidden lg:inline text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                ⌘K
              </span>
            </button>

            {/* Watchlist Icon with badge */}
            <Link
              to="/watchlist"
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="My Watchlist"
            >
              <Heart className={`w-5 h-5 ${count > 0 ? 'text-slate-700 fill-slate-100' : 'text-slate-500'}`} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-fade-in shadow-sm">
                  {count}
                </span>
              )}
            </Link>

            {/* User Profile Demo Icon */}
            <div className="hidden sm:flex items-center pl-2 border-l border-slate-200">
              <button
                onClick={() => navigate('/watchlist')}
                className="flex items-center gap-2 p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-xs font-medium"
              >
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <span className="hidden xl:inline">My Alerts</span>
              </button>
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 animate-slide-up shadow-lg">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-base font-medium ${
                    active
                      ? 'text-brand-700 bg-brand-50 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <Link
              to="/watchlist"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
            >
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-brand-600" />
                <span>My Watchlist</span>
              </div>
              {count > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-700">
                  {count} saved
                </span>
              )}
            </Link>
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/compare');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white font-medium text-sm shadow hover:bg-slate-800 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Search & Compare Products</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
