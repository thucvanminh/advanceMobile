import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { useAuth } from '../store/AuthContext';
import { usePrices } from '../store/PriceContext';
import type { Order, OrderSide, OrderType, TradingMode } from '../types/models';

interface CreateOrderInput {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price: number; // 0 for market
  mode: TradingMode;
}

export function useOrders() {
  const { user } = useAuth();
  const { getPrice } = usePrices();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch orders from Firestore
  useEffect(() => {
    if (!user) return;
    const unsubscribe = db
      .collection('orders')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot(snapshot => {
        const list: Order[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as Order);
        });
        setOrders(list);
      });
    return unsubscribe;
  }, [user]);

  // Create a paper order
  const createPaperOrder = useCallback(async (input: CreateOrderInput): Promise<Order | null> => {
    if (!user) return null;

    setLoading(true);
    try {
      const currentPrice = getPrice(input.symbol);
      if (input.type === 'market' && !currentPrice) {
        throw new Error('Không có giá hiện tại');
      }

      const filledPrice = input.type === 'market' ? currentPrice : input.price;
      const total = input.quantity * filledPrice;

      // Check user balance (simplified - check USDT balance for buys)
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      const usdtBalance = userData?.paperBalance?.USDT || 0;

      if (input.side === 'buy' && total > usdtBalance) {
        throw new Error('Số dư USDT không đủ');
      }

      // Create order in Firestore
      const orderRef = await db.collection('orders').add({
        userId: user.uid,
        symbol: input.symbol,
        side: input.side,
        type: input.type,
        quantity: input.quantity,
        price: filledPrice,
        status: 'filled', // market order fills instantly in paper
        mode: input.mode || 'paper',
        filledPrice,
        filledAt: Date.now(),
        createdAt: Date.now(),
        total,
      });

      // Update user balance
      const balanceUpdate: Record<string, number> = {};
      if (input.side === 'buy') {
        balanceUpdate[`paperBalance.USDT`] = usdtBalance - total;
        const currentHolding = userData?.paperBalance?.[input.symbol.replace('USDT', '')] || 0;
        await db.collection('users').doc(user.uid).update({
          [`paperBalance.USDT`]: usdtBalance - total,
          [`paperBalance.${input.symbol.replace('USDT', '')}`]: currentHolding + input.quantity,
        });
      } else {
        // Sell
        const baseAsset = input.symbol.replace('USDT', '');
        const currentHolding = userData?.paperBalance?.[baseAsset] || 0;
        if (input.quantity > currentHolding) {
          throw new Error(`Số dư ${baseAsset} không đủ`);
        }
        await db.collection('users').doc(user.uid).update({
          [`paperBalance.USDT`]: usdtBalance + total,
          [`paperBalance.${baseAsset}`]: currentHolding - input.quantity,
        });
      }

      setLoading(false);
      return { id: orderRef.id, ...input, status: 'filled', filledPrice, filledAt: Date.now(), createdAt: Date.now(), total, userId: user.uid } as Order;
    } catch (e) {
      setLoading(false);
      throw e;
    }
  }, [user, getPrice]);

  const cancelOrder = useCallback(async (orderId: string) => {
    if (!user) return;
    await db.collection('orders').doc(orderId).update({ status: 'cancelled' });
  }, [user]);

  return { orders, loading, createPaperOrder, cancelOrder };
}
