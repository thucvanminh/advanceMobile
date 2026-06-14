import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import vi from '../i18n/vi';
import { COLORS, SYMBOLS, SYMBOL_INFO } from '../utils/constants';
import { useAlerts } from '../hooks/useAlerts';
import { formatSignificant, formatTimestamp } from '../utils/format';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<MainStackParamList, 'Alerts'>;

export default function AlertsScreen({}: Props) {
  const { alerts, createAlert } = useAlerts();
  const [showForm, setShowForm] = useState(false);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [type, setType] = useState<'above' | 'below'>('above');
  const [value, setValue] = useState('');
  const [showCoinPicker, setShowCoinPicker] = useState(false);
  const [coinSearch, setCoinSearch] = useState('');

  const coinList = useMemo(
    () =>
      SYMBOLS.filter(s => {
        if (!coinSearch) return true;
        const q = coinSearch.toUpperCase();
        const info = SYMBOL_INFO[s];
        return (
          s.includes(q) ||
          (info?.base?.toUpperCase().includes(q)) ||
          (info?.name?.toUpperCase().includes(q))
        );
      }),
    [coinSearch],
  );

  const handleCreateAlert = async () => {
    if (!value || parseFloat(value) <= 0) {
      Alert.alert(vi.error, 'Giá cảnh báo không hợp lệ');
      return;
    }
    try {
      await createAlert(symbol, type, parseFloat(value));
      Alert.alert(vi.success || 'Thành công', vi.createAlert);
      setShowForm(false);
      setValue('');
    } catch (e: any) {
      Alert.alert(vi.error, e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{vi.alerts}</Text>

      <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
        <Text style={styles.addBtnText}>+ {vi.createAlert}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.form}>
          {/* Coin selector */}
          <TouchableOpacity style={styles.coinSelector} onPress={() => { setShowCoinPicker(!showCoinPicker); setCoinSearch(''); }}>
            <Text style={styles.coinSelectorText}>
              {SYMBOL_INFO[symbol]?.name ?? symbol} ({symbol})
            </Text>
            <Text style={styles.coinSelectorArrow}>{showCoinPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showCoinPicker && (
            <View style={styles.coinPickerContainer}>
              <TextInput
                style={styles.coinSearchInput}
                placeholder="Tìm coin..."
                placeholderTextColor={COLORS.textSecondary}
                value={coinSearch}
                onChangeText={setCoinSearch}
              />
              <FlatList
                data={coinList}
                keyExtractor={item => item}
                style={styles.coinList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.coinRow, item === symbol && styles.coinRowSelected]}
                    onPress={() => { setSymbol(item); setShowCoinPicker(false); setCoinSearch(''); }}
                  >
                    <Text style={[styles.coinRowSymbol, item === symbol && styles.coinRowSymbolSelected]}>
                      {SYMBOL_INFO[item]?.name ?? item} ({item})
                    </Text>
                    {item === symbol && <Text style={styles.coinCheck}>✓</Text>}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.empty}>Không tìm thấy coin</Text>}
              />
            </View>
          )}

          <View style={styles.typeRow}>
            <TouchableOpacity style={[styles.typeBtn, type === 'above' && styles.typeBtnActive]} onPress={() => setType('above')}>
              <Text style={[styles.typeBtnText, type === 'above' && styles.typeBtnTextActive]}>{vi.alertAbove}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeBtn, type === 'below' && styles.typeBtnActive]} onPress={() => setType('below')}>
              <Text style={[styles.typeBtnText, type === 'below' && styles.typeBtnTextActive]}>{vi.alertBelow}</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder={vi.alertPrice}
            placeholderTextColor={COLORS.textSecondary}
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleCreateAlert}>
            <Text style={styles.saveBtnText}>{vi.save}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={alerts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.alertRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertSymbol}>{item.symbol}</Text>
              <Text style={styles.alertTime}>{formatTimestamp(item.createdAt)}</Text>
            </View>
            <View style={styles.alertRight}>
              <Text style={[styles.alertType, { color: item.type === 'above' ? COLORS.green : COLORS.red }]}>
                {item.type === 'above' ? '> ' : '< '}{formatSignificant(item.value)}
              </Text>
              <Text style={[styles.alertStatus, { color: item.status === 'active' ? '#3b82f6' : COLORS.textSecondary }]}>
                {item.status === 'active' ? vi.activeAlerts : vi.triggeredAlerts}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{vi.noAlerts}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  addBtn: { backgroundColor: '#3b82f6', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  form: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  coinSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surfaceLight, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  coinSelectorText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  coinSelectorArrow: { color: COLORS.textSecondary, fontSize: 12 },
  coinPickerContainer: { backgroundColor: COLORS.surfaceLight, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, maxHeight: 220 },
  coinSearchInput: { backgroundColor: COLORS.surface, color: COLORS.text, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, fontSize: 13, margin: 6, borderWidth: 1, borderColor: COLORS.border },
  coinList: { maxHeight: 160 },
  coinRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12 },
  coinRowSelected: { backgroundColor: '#3b82f622' },
  coinRowSymbol: { color: COLORS.textSecondary, fontSize: 14 },
  coinRowSymbolSelected: { color: COLORS.text, fontWeight: '600' },
  coinCheck: { color: '#3b82f6', fontWeight: 'bold' },
  input: { backgroundColor: COLORS.surfaceLight, color: COLORS.text, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, fontSize: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.surfaceLight },
  typeBtnActive: { backgroundColor: '#3b82f6' },
  typeBtnText: { color: COLORS.textSecondary },
  typeBtnTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: COLORS.green, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  alertRight: { alignItems: 'flex-end' },
  alertSymbol: { color: COLORS.text, fontWeight: '600' },
  alertType: { color: COLORS.textSecondary },
  alertStatus: { fontWeight: '600' },
  alertTime: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
});
