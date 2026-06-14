import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import binanceWs from '../services/binanceWebSocket';
import { SYMBOLS } from '../utils/constants';

interface PriceData {
  price: number;
  change24h: number;
}

interface PriceContextValue {
  prices: Record<string, PriceData>;
  getPrice: (symbol: string) => number;
  getChange24h: (symbol: string) => number;
}

const PriceContext = createContext<PriceContextValue>({
  prices: {},
  getPrice: () => 0,
  getChange24h: () => 0,
});

export function PriceProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const pricesRef = useRef(prices);
  pricesRef.current = prices;

  useEffect(() => {
    const unsubPrice = binanceWs.onPriceUpdate((symbol, price) => {
      setPrices(prev => ({
        ...prev,
        [symbol]: { ...prev[symbol], price },
      }));
    });
    const unsubTicker = binanceWs.onTickerUpdate((symbol, data) => {
      setPrices(prev => ({
        ...prev,
        [symbol]: { price: data.price, change24h: data.change24h },
      }));
    });

    binanceWs.connect();

    // Handle app lifecycle: disconnect when background, reconnect when foreground
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        binanceWs.connect();
      } else if (nextState === 'background') {
        binanceWs.disconnect();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppState);

    return () => {
      unsubPrice();
      unsubTicker();
      binanceWs.disconnect();
      subscription.remove();
    };
  }, []);

  const value = useMemo(() => ({
    prices,
    getPrice: (symbol: string) => pricesRef.current[symbol]?.price || 0,
    getChange24h: (symbol: string) => pricesRef.current[symbol]?.change24h || 0,
  }), [prices]);

  return (
    <PriceContext.Provider value={value}>
      {children}
    </PriceContext.Provider>
  );
}

export function usePrices() {
  return useContext(PriceContext);
}

export default PriceContext;
