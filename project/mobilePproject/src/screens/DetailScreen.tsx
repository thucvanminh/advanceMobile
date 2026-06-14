import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import CryptoChart from '../components/CryptoChart';
import { usePrices } from '../store/PriceContext';
import { SYMBOL_INFO, COLORS, BINANCE_API_BASE } from '../utils/constants';
import { formatPrice, formatPercent, formatSignificant } from '../utils/format';
import vi from '../i18n/vi';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<MainStackParamList, 'Detail'>;

const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1D'];

interface TickerData {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export default function DetailScreen({ route, navigation }: Props) {
  const { symbol } = route.params;
  const info = SYMBOL_INFO[symbol];
  const { getPrice, getChange24h } = usePrices();
  const [selectedInterval, setSelectedInterval] = useState('1m');
  const [ticker, setTicker] = useState<TickerData>({
    price: 0, change24h: 0, high24h: 0, low24h: 0, volume24h: 0,
  });
  const [bids, setBids] = useState<[string, string][]>([]);
  const [asks, setAsks] = useState<[string, string][]>([]);

  // Fetch 24hr ticker
  useEffect(() => {
    fetch(`${BINANCE_API_BASE}/api/v3/ticker/24hr?symbol=${symbol}`)
      .then(r => r.json())
      .then((d: any) => {
        setTicker({
          price: parseFloat(d.lastPrice || d.c),
          change24h: parseFloat(d.priceChangePercent || d.P),
          high24h: parseFloat(d.highPrice || d.h),
          low24h: parseFloat(d.lowPrice || d.l),
          volume24h: parseFloat(d.volume || d.v),
        });
      })
      .catch(() => {});
  }, [symbol]);

  // Fetch order book
  useEffect(() => {
    fetch(`${BINANCE_API_BASE}/api/v3/depth?symbol=${symbol}&limit=10`)
      .then(r => r.json())
      .then(d => {
        setBids(d.bids?.slice(0, 5) || []);
        setAsks(d.asks?.slice(0, 5) || []);
      })
      .catch(() => {});
  }, [symbol]);

  const currentPrice = getPrice(symbol) || ticker.price;
  const change24h = getChange24h(symbol) || ticker.change24h;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.symbol}>{symbol}</Text>
          {info && <Text style={styles.name}>{info.name}</Text>}
        </View>
        <TouchableOpacity
          style={[styles.tradeBtn, { backgroundColor: change24h >= 0 ? COLORS.green : COLORS.red }]}
          onPress={() => navigation.navigate('Trade', { symbol })}>
          <Text style={styles.tradeBtnText}>Trade</Text>
        </TouchableOpacity>
      </View>

      {/* Price */}
      <View style={styles.priceSection}>
        <Text style={styles.price}>{formatPrice(currentPrice)}</Text>
        <Text style={[styles.change, { color: change24h >= 0 ? COLORS.green : COLORS.red }]}>
          {formatPercent(change24h)}
        </Text>
      </View>

      {/* Interval selector */}
      <View style={styles.intervalRow}>
        {INTERVALS.map(i => (
          <TouchableOpacity
            key={i}
            style={[styles.intervalBtn, selectedInterval === i && styles.intervalBtnActive]}
            onPress={() => setSelectedInterval(i)}>
            <Text style={[styles.intervalText, selectedInterval === i && styles.intervalTextActive]}>{i}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Real-time Chart */}
      <CryptoChart symbol={symbol} interval={selectedInterval} height={320} />

      {/* 24h Stats */}
      <Text style={styles.sectionTitle}>24h {vi.stats || 'Thống kê'}</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{vi.high}</Text>
          <Text style={styles.statValue}>{formatPrice(ticker.high24h)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{vi.low}</Text>
          <Text style={styles.statValue}>{formatPrice(ticker.low24h)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{vi.volume}</Text>
          <Text style={styles.statValue}>{formatSignificant(ticker.volume24h)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{vi.change24h}</Text>
          <Text style={[styles.statValue, { color: change24h >= 0 ? COLORS.green : COLORS.red }]}>
            {formatPercent(change24h)}
          </Text>
        </View>
      </View>

      {/* Order Book */}
      <Text style={styles.sectionTitle}>Order Book</Text>
      <View style={styles.orderBook}>
        <View style={styles.obHeader}>
          <Text style={styles.obLabel}>Price (USDT)</Text>
          <Text style={styles.obLabel}>Amount</Text>
          <Text style={styles.obLabel}>Total</Text>
        </View>
        {/* Asks (sell orders) - reversed to show best ask first */}
        {[...asks].reverse().map((ask, i) => {
          const price = parseFloat(ask[0]);
          const amount = parseFloat(ask[1]);
          return (
            <View key={`a-${i}`} style={styles.obRow}>
              <Text style={[styles.obPrice, { color: COLORS.red }]}>{formatPrice(price)}</Text>
              <Text style={styles.obAmount}>{amount.toFixed(4)}</Text>
              <Text style={styles.obTotal}>{formatSignificant(price * amount)}</Text>
            </View>
          );
        })}
        {/* Spread */}
        {asks.length > 0 && bids.length > 0 && (
          <View style={styles.spreadRow}>
            <Text style={styles.spreadText}>
              Spread: {formatPrice(parseFloat(asks[asks.length-1]?.[0] || '0') - parseFloat(bids[0]?.[0] || '0'))}
            </Text>
          </View>
        )}
        {/* Bids (buy orders) */}
        {bids.map((bid, i) => {
          const price = parseFloat(bid[0]);
          const amount = parseFloat(bid[1]);
          return (
            <View key={`b-${i}`} style={styles.obRow}>
              <Text style={[styles.obPrice, { color: COLORS.green }]}>{formatPrice(price)}</Text>
              <Text style={styles.obAmount}>{amount.toFixed(4)}</Text>
              <Text style={styles.obTotal}>{formatSignificant(price * amount)}</Text>
            </View>
          );
        })}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, marginBottom: 8 },
  symbol: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  name: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  tradeBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  tradeBtnText: { color: '#fff', fontWeight: '600' },
  priceSection: { flexDirection: 'row', alignItems: 'baseline', gap: 12, marginBottom: 16 },
  price: { fontSize: 32, fontWeight: 'bold', color: COLORS.text },
  change: { fontSize: 18, fontWeight: '600' },
  intervalRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  intervalBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.surface },
  intervalBtnActive: { backgroundColor: '#3b82f6' },
  intervalText: { color: COLORS.textSecondary, fontSize: 12 },
  intervalTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 20, marginBottom: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statItem: { width: '48%', backgroundColor: COLORS.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
  orderBook: { backgroundColor: COLORS.surface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  obHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  obLabel: { color: COLORS.textSecondary, fontSize: 11, flex: 1, textAlign: 'right' },
  obRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  obPrice: { fontSize: 13, fontWeight: '500', flex: 1 },
  obAmount: { color: COLORS.textSecondary, fontSize: 12, flex: 1, textAlign: 'right' },
  obTotal: { color: COLORS.textSecondary, fontSize: 12, flex: 1, textAlign: 'right' },
  spreadRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 6, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, marginVertical: 4 },
  spreadText: { color: COLORS.textSecondary, fontSize: 12 },
});
