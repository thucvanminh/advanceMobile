import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Modal, FlatList } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { usePrices } from '../store/PriceContext';
import { useOrders } from '../hooks/useOrders';
import { usePositions } from '../hooks/usePositions';
import vi from '../i18n/vi';
import { COLORS, SYMBOL_INFO, SYMBOLS } from '../utils/constants';
import { formatPrice, formatSignificant } from '../utils/format';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<MainStackParamList, 'Trade'>;

const LEVERAGES = [1, 2, 5, 10, 20, 50, 100];

export default function TradeScreen({ route, navigation }: Props) {
  const { symbol } = route.params;
  const { userData } = useAuth();
  const { getPrice } = usePrices();
  const { createPaperOrder } = useOrders();
  const { openPositions, openPosition, closePosition } = usePositions();
  const [tradeMode, setTradeMode] = useState<'spot' | 'futures'>('spot');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [inputMode, setInputMode] = useState<'quantity' | 'usdt'>('quantity');
  const [inputValue, setInputValue] = useState('');
  const [leverage, setLeverage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [symbolPickerVisible, setSymbolPickerVisible] = useState(false);
  const [coinSearch, setCoinSearch] = useState('');

  const currentPrice = getPrice(symbol);
  const info = SYMBOL_INFO[symbol];
  const baseAsset = symbol.replace('USDT', '');
  const inputNum = parseFloat(inputValue || '0');

  // Spot derived
  const spotQuantity = inputMode === 'usdt' ? (inputNum / (currentPrice || 1)) : inputNum;
  const spotUsdt = inputMode === 'usdt' ? inputNum : spotQuantity * (currentPrice || 0);

  // Futures derived — input là MARGIN (USDT), nhân leverage ra position value
  const marginUsdt = inputNum;
  const futuresPositionValue = marginUsdt * leverage;
  const futuresQuantity = currentPrice && currentPrice > 0 ? futuresPositionValue / currentPrice : 0;
  const isLong = side === 'buy';
  const direction = isLong ? 1 : -1;
  const futuresLiqPrice = currentPrice && currentPrice > 0
    ? (isLong
        ? currentPrice * (1 - 1 / Math.max(leverage, 1) * 0.95)
        : currentPrice * (1 + 1 / Math.max(leverage, 1) * 0.95))
    : 0;

  // Existing open position for this symbol (futures)
  const existingPos = openPositions.find(p => p.symbol === symbol);

  // Filtered symbol list for picker
  const filteredSymbols = useMemo(() => {
    if (!coinSearch) return SYMBOLS as unknown as string[];
    const q = coinSearch.toUpperCase();
    return (SYMBOLS as unknown as string[]).filter(s => {
      const info = SYMBOL_INFO[s];
      return s.includes(q) || (info?.name?.toUpperCase().includes(q));
    });
  }, [coinSearch]);

  const handlePlaceOrder = async () => {
    const qty = tradeMode === 'futures' ? futuresQuantity : spotQuantity;
    if (!qty || qty <= 0) {
      Alert.alert(vi.error, 'Số lượng không hợp lệ');
      return;
    }
    setLoading(true);
    try {
      if (tradeMode === 'spot') {
        await createPaperOrder({
          symbol, side, type: 'market',
          quantity: qty, price: 0, mode: 'paper',
        });
        Alert.alert(vi.success, vi.orderPlaced);
      } else {
        const posSide = isLong ? 'long' : 'short';
        await openPosition(symbol, posSide, qty, leverage);
        Alert.alert(vi.success, vi.openPosition);
      }
      setInputValue('');
    } catch (e: any) {
      Alert.alert(vi.error, e.message || 'Đặt lệnh thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePosition = async () => {
    if (!existingPos) return;
    setLoading(true);
    try {
      await closePosition(existingPos.id);
      Alert.alert(vi.success, vi.closePosition);
    } catch (e: any) {
      Alert.alert(vi.error, e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header — touchable để chọn coin */}
      <TouchableOpacity style={styles.header} onPress={() => setSymbolPickerVisible(true)}>
        <Text style={styles.symbol}>{symbol}</Text>
        {info && <Text style={styles.name}>{info.name} ▼</Text>}
      </TouchableOpacity>

      {/* Spot / Futures toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, tradeMode === 'spot' && styles.modeBtnActive]}
          onPress={() => setTradeMode('spot')}>
          <Text style={[styles.modeText, tradeMode === 'spot' && styles.modeTextActive]}>{vi.spot}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, tradeMode === 'futures' && styles.modeBtnActive]}
          onPress={() => setTradeMode('futures')}>
          <Text style={[styles.modeText, tradeMode === 'futures' && styles.modeTextActive]}>{vi.futures}</Text>
        </TouchableOpacity>
      </View>

      {/* Current Price */}
      <View style={styles.priceBar}>
        <Text style={styles.priceLabel}>Giá hiện tại</Text>
        <Text style={styles.currentPrice}>{formatPrice(currentPrice)} USDT</Text>
      </View>

      {/* Side buttons: Spot → Mua/Bán, Futures → Long/Short */}
      <View style={styles.sideRow}>
        <TouchableOpacity
          style={[styles.sideBtn, side === 'buy' && { backgroundColor: COLORS.green }]}
          onPress={() => setSide('buy')}>
          <Text style={[styles.sideText, side === 'buy' && { color: '#fff' }]}>
            {tradeMode === 'futures' ? vi.long : vi.buy}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sideBtn, side === 'sell' && { backgroundColor: COLORS.red }]}
          onPress={() => setSide('sell')}>
          <Text style={[styles.sideText, side === 'sell' && { color: '#fff' }]}>
            {tradeMode === 'futures' ? vi.short : vi.sell}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Futures: Leverage selector */}
      {tradeMode === 'futures' && (
        <View style={styles.levRow}>
          <Text style={styles.levLabel}>{vi.leverage}:</Text>
          {LEVERAGES.map(lev => (
            <TouchableOpacity
              key={lev}
              style={[styles.levBtn, leverage === lev && styles.levBtnActive]}
              onPress={() => setLeverage(lev)}>
              <Text style={[styles.levText, leverage === lev && styles.levTextActive]}>{lev}x</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input mode: Quantity / USDT (Spot only) */}
      {tradeMode === 'spot' && (
        <View style={styles.inputModeRow}>
          <TouchableOpacity
            style={[styles.inputModeBtn, inputMode === 'quantity' && styles.inputModeBtnActive]}
            onPress={() => setInputMode('quantity')}>
            <Text style={[styles.inputModeText, inputMode === 'quantity' && styles.inputModeTextActive]}>{baseAsset}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.inputModeBtn, inputMode === 'usdt' && styles.inputModeBtnActive]}
            onPress={() => setInputMode('usdt')}>
            <Text style={[styles.inputModeText, inputMode === 'usdt' && styles.inputModeTextActive]}>USDT</Text>
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder={tradeMode === 'futures' ? `Ký quỹ (USDT)` : inputMode === 'usdt' ? `Số tiền (USDT)` : `Số lượng (${baseAsset})`}
        placeholderTextColor={COLORS.textSecondary}
        value={inputValue}
        onChangeText={setInputValue}
        keyboardType="decimal-pad"
      />

      {/* Preview */}
      {inputNum > 0 && tradeMode === 'spot' && (
        <View style={styles.previewBox}>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Khối lượng:</Text>
            <Text style={styles.previewValue}>{formatSignificant(spotQuantity)} {baseAsset}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Trị giá:</Text>
            <Text style={styles.previewValue}>{formatSignificant(spotUsdt)} USDT</Text>
          </View>
        </View>
      )}

      {inputNum > 0 && tradeMode === 'futures' && (
        <View style={styles.previewBox}>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Ký quỹ:</Text>
            <Text style={styles.previewValue}>{formatSignificant(marginUsdt)} USDT</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Đòn bẩy:</Text>
            <Text style={styles.previewValue}>{leverage}x</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Trị giá vị thế:</Text>
            <Text style={styles.previewValue}>{formatSignificant(futuresPositionValue)} USDT</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Khối lượng:</Text>
            <Text style={styles.previewValue}>{formatSignificant(futuresQuantity)} {baseAsset}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>{vi.liquidationPrice}:</Text>
            <Text style={[styles.previewValue, { color: COLORS.red }]}>{formatPrice(futuresLiqPrice)} USDT</Text>
          </View>
        </View>
      )}

      {/* Existing position close button */}
      {existingPos && (
        <TouchableOpacity style={styles.closePosBtn} onPress={handleClosePosition} disabled={loading}>
          <Text style={styles.closePosBtnText}>
            Đóng {existingPos.side === 'long' ? 'Long' : 'Short'} {existingPos.symbol}
            (P&L: {formatSignificant(existingPos.unrealizedPnl)} USDT)
          </Text>
        </TouchableOpacity>
      )}

      {/* Place button */}
      <TouchableOpacity
        style={[styles.placeBtn, { backgroundColor: isLong ? COLORS.green : COLORS.red }]}
        onPress={handlePlaceOrder}
        disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : (
          <Text style={styles.placeBtnText}>
            {tradeMode === 'futures'
              ? `Mở ${isLong ? 'Long' : 'Short'} ${baseAsset}`
              : `${isLong ? vi.buy : vi.sell} ${baseAsset}`}
          </Text>
        )}
      </TouchableOpacity>

      {/* Balance */}
      <View style={styles.balanceInfo}>
        <Text style={styles.balanceLabel}>{vi.available}:</Text>
        <View style={styles.balanceCol}>
          <Text style={styles.balanceValue}>{formatSignificant(userData?.paperBalance?.USDT || 0)} USDT</Text>
          {tradeMode === 'spot' && (
            <Text style={styles.balanceValue}>{formatSignificant(userData?.paperBalance?.[baseAsset] || 0)} {baseAsset}</Text>
          )}
        </View>
      </View>

      {/* Symbol Picker Modal */}
      <Modal visible={symbolPickerVisible} transparent animationType="slide" onRequestClose={() => setSymbolPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn cặp tiền</Text>
            <TextInput
              style={styles.modalSearch}
              placeholder="Tìm coin..."
              placeholderTextColor={COLORS.textSecondary}
              value={coinSearch}
              onChangeText={setCoinSearch}
              autoCapitalize="characters"
            />
            <FlatList
              data={filteredSymbols}
              keyExtractor={item => item}
              renderItem={({ item }) => {
                const symInfo = SYMBOL_INFO[item];
                const price = getPrice(item);
                return (
                  <TouchableOpacity
                    style={[styles.symbolOption, item === symbol && styles.symbolOptionActive]}
                    onPress={() => {
                      setSymbolPickerVisible(false);
                      setCoinSearch('');
                      navigation.replace('Trade', { symbol: item });
                    }}>
                    <View style={styles.symbolOptionLeft}>
                      <Text style={[styles.symbolOptionText, item === symbol && { color: '#fff' }]}>{item}</Text>
                      <Text style={styles.symbolOptionName}>{symInfo?.name || ''}</Text>
                    </View>
                    <Text style={[styles.symbolOptionPrice, item === symbol && { color: '#fff' }]}>
                      {formatPrice(price)} USDT
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyList}>Không tìm thấy coin</Text>}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => { setSymbolPickerVisible(false); setCoinSearch(''); }}>
              <Text style={styles.modalCloseBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 20 },
  header: { marginBottom: 16 },
  symbol: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  name: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  modeRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  modeBtn: { paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.surface },
  modeBtnActive: { backgroundColor: '#3b82f6' },
  modeText: { color: COLORS.textSecondary, fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  priceBar: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surface, padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  priceLabel: { color: COLORS.textSecondary },
  currentPrice: { color: COLORS.text, fontWeight: '600' },
  sideRow: { flexDirection: 'row', marginBottom: 12, gap: 12 },
  sideBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.surface },
  sideText: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  levRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12, alignItems: 'center' },
  levLabel: { color: COLORS.textSecondary, fontSize: 13, marginRight: 4 },
  levBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: COLORS.surface },
  levBtnActive: { backgroundColor: '#f59e0b' },
  levText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  levTextActive: { color: '#fff' },
  inputModeRow: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  inputModeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 7 },
  inputModeBtnActive: { backgroundColor: '#3b82f6' },
  inputModeText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  inputModeTextActive: { color: '#fff' },
  input: { backgroundColor: COLORS.surface, color: COLORS.text, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  previewBox: { backgroundColor: COLORS.surface, padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  previewLabel: { color: COLORS.textSecondary, fontSize: 13 },
  previewValue: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  closePosBtn: { backgroundColor: COLORS.surface, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#f59e0b' },
  closePosBtnText: { color: '#f59e0b', fontSize: 14, fontWeight: '600' },
  placeBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  placeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  balanceInfo: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 40 },
  balanceLabel: { color: COLORS.textSecondary, fontSize: 14 },
  balanceCol: { alignItems: 'flex-end' },
  balanceValue: { color: COLORS.text, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12, textAlign: 'center' },
  modalSearch: { backgroundColor: COLORS.surfaceLight, color: COLORS.text, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, fontSize: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  symbolOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4 },
  symbolOptionActive: { backgroundColor: '#3b82f6' },
  symbolOptionLeft: {},
  symbolOptionText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  symbolOptionName: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  symbolOptionPrice: { fontSize: 14, color: COLORS.textSecondary },
  modalCloseBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8, backgroundColor: COLORS.surfaceLight, borderRadius: 10 },
  modalCloseBtnText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' },
  emptyList: { color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 20, fontSize: 14 },
});
