import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAuth } from '../store/AuthContext';
import { usePrices } from '../store/PriceContext';
import SymbolCard from '../components/SymbolCard';
import vi from '../i18n/vi';
import { COLORS, SYMBOLS, SYMBOL_INFO } from '../utils/constants';
import { formatSignificant } from '../utils/format';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<MainStackParamList, 'Dashboard'>;

const NAV_ITEMS = [
  { key: 'Dashboard', label: vi.dashboard },
  { key: 'Trade', label: vi.trade },
  { key: 'Portfolio', label: vi.portfolio },
  { key: 'Alerts', label: vi.alerts },
  { key: 'Settings', label: vi.settings },
];

export default function DashboardScreen({ navigation }: Props) {
  const { userData, signOut } = useAuth();
  const { prices, getPrice, getChange24h } = usePrices();
  const [search, setSearch] = useState('');

  const filteredSymbols = useMemo(() => {
    if (!search) return SYMBOLS as unknown as string[];
    const q = search.toLowerCase();
    return (SYMBOLS as unknown as string[]).filter(
      s => s.toLowerCase().includes(q) || (SYMBOL_INFO[s]?.name || '').toLowerCase().includes(q),
    );
  }, [search]);

  const totalPortfolio = userData?.paperBalance?.USDT || 10000;
  // Add current BTC value if user holds any
  const btcHolding = userData?.paperBalance?.BTC || 0;
  const totalValue = totalPortfolio + btcHolding * getPrice('BTCUSDT');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào, {userData?.displayName || userData?.email?.split('@')[0] || 'User'}</Text>
          <Text style={styles.balanceLabel}>{vi.totalValue}</Text>
          <Text style={styles.balanceValue}>{formatSignificant(totalValue)} USDT</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconBtn}>
          <Text style={styles.icon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <TextInput
        style={styles.search}
        placeholder={vi.searchSymbol}
        placeholderTextColor={COLORS.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      {/* Symbol List */}
      <FlatList
        data={filteredSymbols}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <SymbolCard
            symbol={item}
            price={getPrice(item) || 0}
            change24h={getChange24h(item) || 0}
            onPress={() => navigation.navigate('Detail', { symbol: item })}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Không tìm thấy cặp tiền nào</Text>
        }
        style={styles.list}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {NAV_ITEMS.map(item => (
          <TouchableOpacity
            key={item.key}
            style={styles.navItem}
            onPress={() => {
              if (item.key === 'Dashboard') return;
              if (item.key === 'Trade') navigation.navigate('Trade', { symbol: 'BTCUSDT' });
              else if (item.key === 'Portfolio') navigation.navigate('Portfolio');
              else if (item.key === 'Alerts') navigation.navigate('Alerts');
              else if (item.key === 'Settings') navigation.navigate('Settings');
            }}>
            <Text style={styles.navIcon}>{getNavIcon(item.key)}</Text>
            <Text style={[styles.navLabel, item.key === 'Dashboard' && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function getNavIcon(key: string): string {
  switch (key) {
    case 'Dashboard': return '📊';
    case 'Trade': return '💱';
    case 'Portfolio': return '💰';
    case 'Alerts': return '🔔';
    case 'Settings': return '⚙️';
    default: return '•';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  greeting: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  balanceLabel: { fontSize: 12, color: COLORS.textSecondary },
  balanceValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
  iconBtn: { padding: 8 },
  icon: { fontSize: 24 },
  search: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  list: { flex: 1, paddingHorizontal: 8 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
    paddingBottom: 16,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 20, marginBottom: 2 },
  navLabel: { fontSize: 10, color: COLORS.textSecondary },
  navLabelActive: { color: '#3b82f6', fontWeight: '600' },
});
