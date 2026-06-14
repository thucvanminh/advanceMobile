import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { db } from '../services/firebase';
import { useAuth } from '../store/AuthContext';
import vi from '../i18n/vi';
import { COLORS } from '../utils/constants';
import { formatPrice, formatTimestamp, formatSignificant } from '../utils/format';
import type { Order } from '../types/models';
import type { Position } from '../types/models';

const PAGE_SIZE = 20;

type HistoryTab = 'spot' | 'futures';

export default function TransactionHistoryScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<HistoryTab>('spot');

  // Spot state
  const [spotOrders, setSpotOrders] = useState<Order[]>([]);
  const [spotLastDoc, setSpotLastDoc] = useState<any>(null);
  const [spotLoading, setSpotLoading] = useState(false);
  const [spotHasMore, setSpotHasMore] = useState(true);

  // Futures state
  const [futuresPositions, setFuturesPositions] = useState<Position[]>([]);
  const [futuresLastDoc, setFuturesLastDoc] = useState<any>(null);
  const [futuresLoading, setFuturesLoading] = useState(false);
  const [futuresHasMore, setFuturesHasMore] = useState(true);

  // Refs để guard concurrent calls — React state thì chậm hơn do batching
  const spotLoadingRef = useRef(false);
  const futuresLoadingRef = useRef(false);

  const loadSpot = useCallback(async (loadMore = false) => {
    if (!user || spotLoadingRef.current) return;
    spotLoadingRef.current = true;
    setSpotLoading(true);
    try {
      let query = db
        .collection('orders')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .limit(PAGE_SIZE);
      if (loadMore && spotLastDoc) {
        query = query.startAfter(spotLastDoc);
      }
      const snapshot = await query.get();
      const list: Order[] = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Order));
      if (loadMore) {
        // Dedup theo id đề phòng race condition
        setSpotOrders(prev => {
          const existingIds = new Set(prev.map(o => o.id));
          const newOrders = list.filter(o => !existingIds.has(o.id));
          return [...prev, ...newOrders];
        });
      } else {
        setSpotOrders(list);
      }
      if (snapshot.docs.length > 0) {
        setSpotLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setSpotHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (e) {
      console.warn('Error loading spot orders:', e);
    } finally {
      spotLoadingRef.current = false;
      setSpotLoading(false);
    }
  }, [user, spotLastDoc]);

  const loadFutures = useCallback(async (loadMore = false) => {
    if (!user || futuresLoadingRef.current) return;
    futuresLoadingRef.current = true;
    setFuturesLoading(true);
    try {
      let query = db
        .collection('positions')
        .where('userId', '==', user.uid)
        .where('status', '==', 'closed')
        .orderBy('closedAt', 'desc')
        .limit(PAGE_SIZE);
      if (loadMore && futuresLastDoc) {
        query = query.startAfter(futuresLastDoc);
      }
      const snapshot = await query.get();
      const list: Position[] = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Position));
      if (loadMore) {
        // Dedup theo id đề phòng race condition
        setFuturesPositions(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPositions = list.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPositions];
        });
      } else {
        setFuturesPositions(list);
      }
      if (snapshot.docs.length > 0) {
        setFuturesLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setFuturesHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (e) {
      console.warn('Error loading futures positions:', e);
    } finally {
      futuresLoadingRef.current = false;
      setFuturesLoading(false);
    }
  }, [user, futuresLastDoc]);

  // Load on mount and when tab changes
  useEffect(() => {
    if (tab === 'spot') {
      if (spotOrders.length === 0) loadSpot();
    } else {
      if (futuresPositions.length === 0) loadFutures();
    }
  }, [tab, user]);

  const renderSpotItem = ({ item }: { item: Order }) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.rowTop}>
          <Text style={[styles.type, { color: item.side === 'buy' ? COLORS.green : COLORS.red }]}>
            {item.side === 'buy' ? vi.buy : vi.sell}
          </Text>
          <Text style={[styles.statusBadge, {
            color: item.status === 'filled' ? COLORS.green :
                   item.status === 'cancelled' ? COLORS.textSecondary : '#f59e0b',
          }]}>
            {item.status === 'filled' ? vi.filled :
             item.status === 'cancelled' ? vi.cancelled : vi.pending}
          </Text>
        </View>
        <Text style={styles.symbol}>{item.symbol}</Text>
        <Text style={styles.time}>{formatTimestamp(item.createdAt)}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.qty}>{formatSignificant(item.quantity)} {item.symbol.replace('USDT', '')}</Text>
        <Text style={styles.price}>@ {formatPrice(item.filledPrice || item.price)}</Text>
        <Text style={styles.total}>{formatSignificant(item.total)} USDT</Text>
      </View>
    </View>
  );

  const renderFuturesItem = ({ item }: { item: Position }) => {
    const pnl = item.realizedPnl ?? 0;
    return (
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <View style={styles.rowTop}>
            <Text style={[styles.type, { color: item.side === 'long' ? COLORS.green : COLORS.red }]}>
              {item.side === 'long' ? vi.long : vi.short}
            </Text>
            <Text style={styles.leverageBadge}>{item.leverage}x</Text>
          </View>
          <Text style={styles.symbol}>{item.symbol}</Text>
          <Text style={styles.time}>
            {item.closedAt ? formatTimestamp(item.closedAt) : formatTimestamp(item.openedAt)}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.qty}>{formatSignificant(item.quantity)} {item.symbol.replace('USDT', '')}</Text>
          <Text style={styles.price}>
            {formatPrice(item.entryPrice)} → {item.closedPrice ? formatPrice(item.closedPrice) : '?'}
          </Text>
          <Text style={[styles.pnl, { color: pnl >= 0 ? COLORS.green : COLORS.red }]}>
            {pnl >= 0 ? '+' : ''}{formatSignificant(pnl)} USDT
          </Text>
        </View>
      </View>
    );
  };

  const isEmpty = tab === 'spot' ? spotOrders.length === 0 : futuresPositions.length === 0;
  const isLoading = tab === 'spot' ? spotLoading : futuresLoading;
  const hasMore = tab === 'spot' ? spotHasMore : futuresHasMore;
  const loadMore = tab === 'spot' ? () => loadSpot(true) : () => loadFutures(true);

  return (
    <View style={styles.container}>
      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'spot' && styles.tabActive]}
          onPress={() => setTab('spot')}>
          <Text style={[styles.tabText, tab === 'spot' && styles.tabTextActive]}>
            {vi.spotHistory}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'futures' && styles.tabActive]}
          onPress={() => setTab('futures')}>
          <Text style={[styles.tabText, tab === 'futures' && styles.tabTextActive]}>
            {vi.futuresHistory}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'spot' ? (
        <FlatList
          data={spotOrders}
          keyExtractor={item => item.id}
          renderItem={renderSpotItem}
          onEndReached={() => spotHasMore && !spotLoading && loadSpot(true)}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            spotLoading ? <Text style={styles.footer}>Đang tải...</Text> :
            spotHasMore ? <Text style={styles.footer}>{vi.loadMore}</Text> : null
          }
          ListEmptyComponent={<Text style={styles.empty}>{vi.noOrders}</Text>}
        />
      ) : (
        <FlatList
          data={futuresPositions}
          keyExtractor={item => item.id}
          renderItem={renderFuturesItem}
          onEndReached={() => futuresHasMore && !futuresLoading && loadFutures(true)}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            futuresLoading ? <Text style={styles.footer}>Đang tải...</Text> :
            futuresHasMore ? <Text style={styles.footer}>{vi.loadMore}</Text> : null
          }
          ListEmptyComponent={<Text style={styles.empty}>{vi.noOrders}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.surface },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { color: COLORS.textSecondary, fontSize: 12 },
  tabTextActive: { color: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLeft: {},
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  type: { fontSize: 14, fontWeight: '600' },
  statusBadge: { fontSize: 11, fontWeight: '500' },
  leverageBadge: { fontSize: 11, color: '#f59e0b', fontWeight: '600' },
  symbol: { fontSize: 16, color: COLORS.text, marginTop: 2 },
  time: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  rowRight: { alignItems: 'flex-end' },
  qty: { color: COLORS.text, fontSize: 14 },
  price: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  total: { color: COLORS.textSecondary, fontSize: 12, marginTop: 1 },
  pnl: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  footer: { color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 16 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
});
