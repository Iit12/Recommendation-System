import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ComparePage } from './pages/ComparePage';
import { TrendsPage } from './pages/TrendsPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { ToastProvider } from './context/ToastContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { SearchBar } from './components/common/SearchBar';
import { X } from 'lucide-react';

// Global Quick Search Overlay Modal (triggered with Ctrl+K or search icon)
const SearchModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-elevated border border-slate-100 animate-slide-up relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Quick Cross-Store Price Search
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <SearchBar
          autoFocus={true}
          size="large"
          onSearchSubmit={(productId) => {
            onClose();
          }}
        />
      </div>
    </div>
  );
};

export function App() {
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  return (
    <ToastProvider>
      <WatchlistProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
            
            {/* Sticky Navigation Bar */}
            <Navbar onOpenSearch={() => setSearchModalOpen(true)} />

            {/* Global Search Modal Overlay */}
            <SearchModal
              isOpen={searchModalOpen}
              onClose={() => setSearchModalOpen(false)}
            />

            {/* Main Content Area */}
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/trends" element={<TrendsPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/watchlist" element={<WatchlistPage />} />
                <Route path="*" element={<HomePage />} />
              </Routes>
            </main>

            {/* Global Footer */}
            <Footer />

          </div>
        </Router>
      </WatchlistProvider>
    </ToastProvider>
  );
}

export default App;
