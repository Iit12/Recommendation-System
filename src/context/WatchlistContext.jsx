import React, { createContext, useContext, useState, useEffect } from 'react';
import { PRODUCTS } from '../data/products';
import { useToast } from './ToastContext';

const WatchlistContext = createContext(null);

const STORAGE_KEY = 'smart_shopping_watchlist_v1';

// Seed with default initial items for realistic demonstration
const INITIAL_WATCHLIST = [
  {
    productId: 'iphone-16',
    targetPrice: 65000,
    addedAt: '2026-09-10',
    notifyEnabled: true,
  },
  {
    productId: 'sony-wh-1000xm5',
    targetPrice: 23500,
    addedAt: '2026-09-14',
    notifyEnabled: true,
  }
];

export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_WATCHLIST;
    } catch {
      return INITIAL_WATCHLIST;
    }
  });

  const { addToast } = useToast();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }, [watchlist]);

  const isSaved = (productId) => {
    return watchlist.some((item) => item.productId === productId);
  };

  const getWatchlistItem = (productId) => {
    return watchlist.find((item) => item.productId === productId);
  };

  const toggleWatchlist = (product, customTargetPrice) => {
    const exists = isSaved(product.id);
    if (exists) {
      setWatchlist((prev) => prev.filter((item) => item.productId !== product.id));
      addToast({
        title: 'Removed from Watchlist',
        message: `${product.shortTitle || product.name} has been removed.`,
        type: 'info',
      });
    } else {
      const defaultTarget = customTargetPrice || Math.round(product.currentLowestPrice * 0.95 / 100) * 100;
      setWatchlist((prev) => [
        ...prev,
        {
          productId: product.id,
          targetPrice: defaultTarget,
          addedAt: new Date().toISOString().split('T')[0],
          notifyEnabled: true,
        }
      ]);
      addToast({
        title: 'Added to Watchlist',
        message: `Tracking price changes for ${product.shortTitle || product.name}.`,
        type: 'success',
      });
    }
  };

  const setPriceAlert = (productId, targetPrice) => {
    setWatchlist((prev) => {
      const exists = prev.some((item) => item.productId === productId);
      if (exists) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, targetPrice, notifyEnabled: true }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId,
            targetPrice,
            addedAt: new Date().toISOString().split('T')[0],
            notifyEnabled: true,
          }
        ];
      }
    });

    addToast({
      title: 'Price Target Alert Configured',
      message: `We'll notify you when price drops below ₹${targetPrice.toLocaleString('en-IN')}. (Demo active)`,
      type: 'success',
    });
  };

  const removeFromWatchlist = (productId) => {
    setWatchlist((prev) => prev.filter((item) => item.productId !== productId));
    addToast({
      title: 'Item Removed',
      message: 'Product removed from your tracked watchlist.',
      type: 'info',
    });
  };

  const count = watchlist.length;

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        count,
        isSaved,
        getWatchlistItem,
        toggleWatchlist,
        setPriceAlert,
        removeFromWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
