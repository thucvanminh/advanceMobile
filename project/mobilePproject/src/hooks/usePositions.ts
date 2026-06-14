import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { useAuth } from '../store/AuthContext';
import { usePrices } from '../store/PriceContext';
import type { Position, PositionSide } from '../types/models';
import firestore from '@react-native-firebase/firestore';

interface OpenPositionData {
  id: string;
  symbol: string;
  side: PositionSide;
  quantity: number;
  entryPrice: number;
  leverage: number;
  liquidationPrice: number;
  marginUsed: number;
  openedAt: number;
  // Computed
  markPrice: number;
  unrealizedPnl: number;
  pnlPercent: number;
}

export function usePositions() {
  const { user } = useAuth();
  const { getPrice } = usePrices();
  const [positions, setPositions] = useState<Position[]>([]);
  const [openPositions, setOpenPositions] = useState<OpenPositionData[]>([]);

  // Listen for position changes in Firestore
  useEffect(() => {
    if (!user) return;
    const unsubscribe = db
      .collection('positions')
      .where('userId', '==', user.uid)
      .orderBy('openedAt', 'desc')
      .onSnapshot(
        snapshot => {
          if (!snapshot) return;
          const list: Position[] = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Position));
          setPositions(list);
        },
        error => {
          console.warn('Positions snapshot error:', error.message);
        }
      );
    return unsubscribe;
  }, [user]);

  // Recalculate P&L when prices change
  useEffect(() => {
    const open = positions.filter(p => p.status === 'open');
    const enriched: OpenPositionData[] = open.map(p => {
      const markPrice = getPrice(p.symbol) || p.entryPrice;
      const direction = p.side === 'long' ? 1 : -1;
      const pnl = (markPrice - p.entryPrice) * p.quantity * direction * p.leverage;
      const pnlPercent = ((markPrice - p.entryPrice) / p.entryPrice) * 100 * p.leverage * direction;
      return {
        ...p,
        markPrice,
        unrealizedPnl: pnl,
        pnlPercent,
      };
    });
    setOpenPositions(enriched);
  }, [positions, getPrice]);

  // Open a futures position (paper)
  const openPosition = useCallback(async (
    symbol: string,
    side: PositionSide,
    quantity: number,
    leverage: number,
  ) => {
    if (!user) throw new Error('Not logged in');

    const currentPrice = getPrice(symbol);
    if (!currentPrice || currentPrice <= 0) throw new Error('Không có giá hiện tại');

    const marginUsed = (currentPrice * quantity) / leverage;
    const direction = side === 'long' ? 1 : -1;
    // Simplified liquidation price (cross margin style)
    const liquidationPrice = side === 'long'
      ? currentPrice * (1 - 1 / leverage * 0.95)
      : currentPrice * (1 + 1 / leverage * 0.95);

    // Check available balance
    const userDoc = await db.collection('users').doc(user.uid).get();
    const usdtBalance = userDoc.data()?.paperBalance?.USDT || 0;
    if (marginUsed > usdtBalance) {
      throw new Error(`Không đủ ký quỹ. Cần ${marginUsed.toFixed(2)} USDT, khả dụng ${usdtBalance.toFixed(2)} USDT`);
    }

    // Deduct margin from balance
    await db.collection('users').doc(user.uid).update({
      'paperBalance.USDT': usdtBalance - marginUsed,
    });

    // Create position
    const ref = await db.collection('positions').add({
      userId: user.uid,
      symbol,
      side,
      quantity,
      entryPrice: currentPrice,
      leverage,
      liquidationPrice,
      marginUsed,
      openedAt: Date.now(),
      status: 'open',
    });

    return ref.id;
  }, [user, getPrice]);

  // Close a position (paper)
  const closePosition = useCallback(async (positionId: string) => {
    if (!user) return;

    const doc = await db.collection('positions').doc(positionId).get();
    if (!doc.exists) throw new Error('Position not found');

    const pos = doc.data() as any;
    const currentPrice = getPrice(pos.symbol);
    if (!currentPrice) throw new Error('Không có giá hiện tại');

    const direction = pos.side === 'long' ? 1 : -1;
    const pnl = (currentPrice - pos.entryPrice) * pos.quantity * direction * pos.leverage;
    const returnMargin = pos.marginUsed + pnl;

    // Close position
    await db.collection('positions').doc(positionId).update({
      status: 'closed',
      closedAt: Date.now(),
      closedPrice: currentPrice,
      realizedPnl: pnl,
    });

    // Return margin + P&L to balance
    await db.collection('users').doc(user.uid).update({
      'paperBalance.USDT': firestore.FieldValue.increment(returnMargin),
    });
  }, [user, getPrice]);

  return { positions, openPositions, openPosition, closePosition };
}
