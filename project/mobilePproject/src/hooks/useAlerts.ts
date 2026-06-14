import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { useAuth } from '../store/AuthContext';
import { usePrices } from '../store/PriceContext';
import { showPriceAlertNotification } from '../services/notifications';
import type { Alert, AlertType, AlertStatus } from '../types/models';

export function useAlerts() {
  const { user } = useAuth();
  const { getPrice } = usePrices();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Subscribe to alerts
  useEffect(() => {
    if (!user) return;
    const unsubscribe = db
      .collection('alerts')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const list: Alert[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as Alert);
        });
        setAlerts(list);
      });
    return unsubscribe;
  }, [user]);

  // Check alerts against current prices (run periodically)
  useEffect(() => {
    const interval = setInterval(async () => {
      const activeAlerts = alerts.filter(a => a.status === 'active');
      for (const alert of activeAlerts) {
        const currentPrice = getPrice(alert.symbol);
        if (!currentPrice) continue;

        let triggered = false;
        if (alert.type === 'above' && currentPrice >= alert.value) triggered = true;
        if (alert.type === 'below' && currentPrice <= alert.value) triggered = true;

        if (triggered) {
          await db.collection('alerts').doc(alert.id).update({
            status: 'triggered',
            triggeredAt: Date.now(),
          });
          // Add notification to Firestore
          await db.collection('notifications').add({
            userId: user?.uid,
            type: 'price_alert',
            title: alert.symbol,
            body: `${alert.symbol} ${alert.type === 'above' ? '>' : '<'} ${alert.value}`,
            read: false,
            createdAt: Date.now(),
          });
          // Local push notification
          showPriceAlertNotification(
            alert.symbol,
            `${alert.symbol} ${alert.type === 'above' ? 'vượt' : 'xuống dưới'} ${alert.value} USDT`
          );
        }
      }
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [alerts, getPrice, user]);

  const createAlert = useCallback(async (symbol: string, type: AlertType, value: number) => {
    if (!user) return;
    await db.collection('alerts').add({
      userId: user.uid,
      symbol,
      type,
      value,
      status: 'active' as AlertStatus,
      createdAt: Date.now(),
    });
  }, [user]);

  const deleteAlert = useCallback(async (alertId: string) => {
    await db.collection('alerts').doc(alertId).delete();
  }, []);

  return { alerts, createAlert, deleteAlert };
}
