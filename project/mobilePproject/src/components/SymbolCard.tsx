import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../utils/constants';
import { formatPrice, formatPercent } from '../utils/format';

interface SymbolCardProps {
  symbol: string;
  price: number;
  change24h: number;
  onPress?: () => void;
}

export default function SymbolCard({ symbol, price, change24h, onPress }: SymbolCardProps) {
  const isPositive = change24h >= 0;
  const changeColor = isPositive ? COLORS.green : COLORS.red;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.left}>
        <Text style={styles.symbol}>{symbol.replace('USDT', '')}</Text>
        <Text style={styles.base}>/USDT</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>{formatPrice(price)}</Text>
        <Text style={[styles.change, { color: changeColor }]}>{formatPercent(change24h)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  left: { flexDirection: 'row', alignItems: 'baseline' },
  symbol: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  base: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 },
  right: { alignItems: 'flex-end' },
  price: { fontSize: 16, color: COLORS.text, fontVariant: ['tabular-nums'] },
  change: { fontSize: 13, marginTop: 2, fontWeight: '500' },
});
