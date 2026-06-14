import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { usePortfolio } from '../hooks/usePortfolio';
import { usePositions } from '../hooks/usePositions';
import { db } from '../services/firebase';
import TransactionHistoryScreen from './TransactionHistoryScreen';
import vi from '../i18n/vi';
import { COLORS } from '../utils/constants';
import { formatPrice, formatPercent, formatSignificant } from '../utils/format';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<MainStackParamList, 'Portfolio'>;

export default function PortfolioScreen({ navigation }: Props) {
  const { user, userData } = useAuth();
  const { portfolio, loading: portfolioLoading } = usePortfolio();
  const { openPositions, closePosition } = usePositions();
  const [tab, setTab] = useState<'holdings' | 'positions' | 'history'>('holdings');
  const [depositModal, setDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  const totalFuturesPnl = openPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const totalFuturesMargin = openPositions.reduce((sum, p) => sum + p.marginUsed, 0);
  const combinedValue = portfolio.totalValue + totalFuturesMargin + (totalFuturesPnl > 0 ? totalFuturesPnl : 0);

  const handleClosePosition = async (positionId: string) => {
    try {
      await closePosition(positionId);
      Alert.alert(vi.success, vi.closePosition);
    } catch (e: any) {
      Alert.alert(vi.error, e.message);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      Alert.alert(vi.error, vi.depositInvalid);
      return;
    }
    if (!user) return;
    try {
      const currentBalance = userData?.paperBalance?.USDT || 0;
      await db.collection('users').doc(user.uid).update({
        'paperBalance.USDT': currentBalance + amount,
      });
      setDepositModal(false);
      setDepositAmount('');
      Alert.alert(vi.success, vi.depositSuccess);
    } catch {
      Alert.alert(vi.error, vi.unknownError);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{vi.portfolio}</Text>

      {/* Summary Card */}
      <View style={styles.totalCard}>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>{vi.totalValue}</Text>
            <Text style={styles.totalValue}>{formatSignificant(portfolio.totalValue)} USDT</Text>
          </View>
          <View style={styles.pnlCol}>
            <Text style={styles.totalLabel}>{vi.pnl}</Text>
            <Text style={[styles.pnlValue, { color: portfolio.totalPnl >= 0 ? COLORS.green : COLORS.red }]}>
              {portfolio.totalPnl >= 0 ? '+' : ''}{formatSignificant(portfolio.totalPnl)} USDT
            </Text>
          </View>
        </View>
        <Text style={styles.available}>
          {vi.available}: {formatSignificant(portfolio.usdtBalance)} USDT
        </Text>
        <TouchableOpacity style={styles.depositBtn} onPress={() => setDepositModal(true)}>
          <Text style={styles.depositBtnText}>{vi.deposit}</Text>
        </TouchableOpacity>
        {openPositions.length > 0 && (
          <Text style={[styles.futuresPnl, { color: totalFuturesPnl >= 0 ? COLORS.green : COLORS.red }]}>
            Futures P&L: {totalFuturesPnl >= 0 ? '+' : ''}{formatSignificant(totalFuturesPnl)} USDT
          </Text>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'holdings' && styles.tabActive]} onPress={() => setTab('holdings')}>
          <Text style={[styles.tabText, tab === 'holdings' && styles.tabTextActive]}>{vi.holdings}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'positions' && styles.tabActive]} onPress={() => setTab('positions')}>
          <Text style={[styles.tabText, tab === 'positions' && styles.tabTextActive]}>{vi.positions} {openPositions.length > 0 ? `(${openPositions.length})` : ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'history' && styles.tabActive]} onPress={() => setTab('history')}>
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>{vi.orderHistory}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {tab === 'holdings' && (
        <FlatList
          data={portfolio.holdings}
          keyExtractor={item => item.asset}
          renderItem={({ item }) => (
            <View style={styles.holdingRow}>
              <View>
                <Text style={styles.assetName}>{item.asset}</Text>
                <Text style={styles.assetQty}>{item.amount.toFixed(6)}</Text>
              </View>
              <View style={styles.holdingRight}>
                <Text style={styles.assetValue}>{Math.round(item.value).toLocaleString()} USDT</Text>
                <Text style={styles.assetPrice}>@ {formatPrice(item.price)} USDT</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>{vi.noHoldings}</Text>}
        />
      )}

      {tab === 'positions' && (
        <FlatList
          data={openPositions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.posCard}>
              <View style={styles.posRow}>
                <TouchableOpacity style={styles.posLeft} onPress={() => navigation.navigate('Trade', { symbol: item.symbol })}>
                  <Text style={styles.posSymbol}>{item.symbol}</Text>
                  <Text style={[styles.posSide, { color: item.side === 'long' ? COLORS.green : COLORS.red }]}>
                    {item.side === 'long' ? 'Long' : 'Short'} {item.leverage}x
                  </Text>
                  <Text style={styles.posQty}>{formatSignificant(item.quantity)} {item.symbol.replace('USDT', '')}</Text>
                  <Text style={styles.posEntry}>Vào: {formatPrice(item.entryPrice)}</Text>
                </TouchableOpacity>
                <View style={styles.posRight}>
                  <Text style={styles.posMark}>Mark: {formatPrice(item.markPrice)}</Text>
                  <Text style={[styles.posPnl, { color: item.unrealizedPnl >= 0 ? COLORS.green : COLORS.red }]}>
                    {item.unrealizedPnl >= 0 ? '+' : ''}{formatSignificant(item.unrealizedPnl)} USDT
                  </Text>
                  <TouchableOpacity style={styles.closePosBtn} onPress={() => handleClosePosition(item.id)}>
                    <Text style={styles.closePosBtnText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>{vi.noPositions}</Text>}
        />
      )}

      {tab === 'history' && <TransactionHistoryScreen />}

      {/* Deposit Modal */}
      <Modal visible={depositModal} transparent animationType="fade" onRequestClose={() => setDepositModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{vi.deposit}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="1000"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="decimal-pad"
              value={depositAmount}
              onChangeText={setDepositAmount}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setDepositModal(false); setDepositAmount(''); }}>
                <Text style={styles.modalCancelText}>{vi.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleDeposit}>
                <Text style={styles.modalConfirmText}>{vi.deposit}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  totalCard: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  pnlCol: { alignItems: 'flex-end' },
  pnlValue: { fontSize: 18, fontWeight: '600' },
  available: { fontSize: 14, color: COLORS.textSecondary },
  depositBtn: { marginTop: 10, backgroundColor: '#3b82f6', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, alignSelf: 'flex-start' },
  depositBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  futuresPnl: { fontSize: 13, marginTop: 4 },
  tabRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.surface },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { color: COLORS.textSecondary, fontSize: 12 },
  tabTextActive: { color: '#fff' },
  holdingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  assetName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  assetQty: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  holdingRight: { alignItems: 'flex-end' },
  assetValue: { fontSize: 14, color: COLORS.text },
  assetPrice: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  posRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  posLeft: {},
  posSymbol: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  posSide: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  posQty: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  posRight: { alignItems: 'flex-end' },
  posEntry: { fontSize: 11, color: COLORS.textSecondary },
  posMark: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  posPnl: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  posCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  closePosBtn: { backgroundColor: COLORS.red, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, marginTop: 6, alignItems: 'center' },
  closePosBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 60 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: COLORS.surface, padding: 24, borderRadius: 16, width: '80%', borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  modalInput: { backgroundColor: COLORS.background, color: COLORS.text, fontSize: 24, padding: 12, borderRadius: 8, textAlign: 'center', marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: COLORS.background, alignItems: 'center' },
  modalCancelText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' },
  modalConfirm: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3b82f6', alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
