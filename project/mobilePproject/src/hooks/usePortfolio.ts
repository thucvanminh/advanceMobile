import { useState, useEffect, useMemo } from 'react';
import { db } from '../services/firebase';
import { useAuth } from '../store/AuthContext';
import { usePrices } from '../store/PriceContext';

interface Holding {
  asset: string;
  amount: number;
  price: number;
  value: number;
}

interface PortfolioData {
  totalValue: number;
  usdtBalance: number;
  holdings: Holding[];
  totalPnl: number;
}

export function usePortfolio() {
  const { user, userData } = useAuth();
  const { getPrice } = usePrices();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [usdtBalance, setUsdtBalance] = useState(10000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = db
      .collection('users')
      .doc(user.uid)
      .onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data();
          const balance = data?.paperBalance || { USDT: 10000 };
          setUsdtBalance(balance.USDT || 0);

          const h: Holding[] = [];
          for (const [asset, amount] of Object.entries(balance)) {
            if (asset === 'USDT') continue;
            if ((amount as number) > 0) {
              const symbol = `${asset}USDT`;
              const price = getPrice(symbol);
              h.push({
                asset,
                amount: amount as number,
                price,
                value: (amount as number) * price,
              });
            }
          }
          setHoldings(h);
        }
        setLoading(false);
      });
    return unsubscribe;
  }, [user, getPrice]);

  const portfolio = useMemo((): PortfolioData => {
    const holdingsValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const totalValue = usdtBalance + holdingsValue;
    // PnL tính đơn giản: totalValue - initial (10000)
    const totalPnl = totalValue - 10000;

    return { totalValue, usdtBalance, holdings, totalPnl };
  }, [holdings, usdtBalance]);

  return { portfolio, loading };
}
