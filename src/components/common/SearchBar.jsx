import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { PRODUCTS, POPULAR_SEARCHES } from '../../data/products';

export const SearchBar = ({ 
  initialValue = '', 
  placeholder = 'Search for iPhone 16, Sony WH-1000XM5, Samsung Galaxy...', 
  size = 'large', // 'large' | 'compact'
  onSearchSubmit,
  autoFocus = false,
  showPopularChips = true
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  // Sync initial query
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (/) to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim().length > 0) {
      const filtered = PRODUCTS.filter((p) =>
        p.name.toLowerCase().includes(value.toLowerCase()) ||
        p.brand.toLowerCase().includes(value.toLowerCase()) ||
        p.category.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelectProduct = (productId) => {
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(productId);
    } else {
      navigate(`/compare?id=${productId}`);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    // Check if direct match
    const exact = PRODUCTS.find((p) => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.id.toLowerCase() === query.toLowerCase().replace(/\s+/g, '-')
    );

    const targetId = exact ? exact.id : PRODUCTS[0].id;
    setIsOpen(false);

    if (onSearchSubmit) {
      onSearchSubmit(targetId, query);
    } else {
      navigate(`/compare?id=${targetId}`);
    }
  };

  return (
    <div ref={wrapperRef} className="w-full relative">
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div 
          className={`flex items-center bg-white rounded-2xl border transition-all duration-200 ${
            size === 'large' 
              ? 'p-2 sm:p-2.5 shadow-card hover:shadow-card-hover focus-within:shadow-glow focus-within:border-brand-500 border-slate-200' 
              : 'p-1.5 shadow-subtle border-slate-200 focus-within:border-brand-500'
          }`}
        >
          <div className="pl-3 sm:pl-4 pr-2 flex items-center text-slate-400">
            <Search className={size === 'large' ? 'w-5 h-5 sm:w-6 sm:h-6 text-brand-600' : 'w-4 h-4 text-brand-600'} />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`w-full bg-transparent text-slate-800 placeholder-slate-400 font-medium focus:outline-none ${
              size === 'large' ? 'text-base sm:text-lg py-2' : 'text-sm py-1.5'
            }`}
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 mr-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Keyboard shortcut hint */}
          <div className="hidden sm:flex items-center mr-2">
            <kbd className="px-2 py-1 text-[11px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-md shadow-subtle">
              /
            </kbd>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className={`flex items-center justify-center gap-1.5 rounded-xl font-semibold text-white bg-slate-900 hover:bg-brand-600 active:scale-[0.98] transition-all shadow-md ${
              size === 'large' 
                ? 'px-5 sm:px-7 py-3 text-sm sm:text-base' 
                : 'px-4 py-2 text-xs sm:text-sm'
            }`}
          >
            <span>Compare</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Auto-suggest dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-elevated border border-slate-100 overflow-hidden z-50 animate-slide-up">
          <div className="p-2 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 px-3">
            <span>Matching Intelligence Listings</span>
            <span>{suggestions.length} Results</span>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectProduct(item.id)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-brand-50/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {item.category} • Lowest on <span className="font-medium text-slate-700">{item.lowestStore}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900">
                    ₹{item.currentLowestPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[11px] text-emerald-600 font-medium">
                    {item.discountPercent}% off
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Search Chips (When configured for hero) */}
      {showPopularChips && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-medium flex items-center gap-1 text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            Popular searches:
          </span>
          {POPULAR_SEARCHES.map((term) => {
            const match = PRODUCTS.find((p) => p.name.toLowerCase().includes(term.toLowerCase()) || p.shortTitle.toLowerCase().includes(term.toLowerCase()));
            const id = match ? match.id : 'iphone-16';
            return (
              <button
                key={term}
                type="button"
                onClick={() => handleSelectProduct(id)}
                className="px-3 py-1 rounded-full bg-white hover:bg-brand-50 hover:text-brand-700 border border-slate-200 hover:border-brand-200 text-slate-600 transition-all font-medium shadow-subtle"
              >
                {term}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
