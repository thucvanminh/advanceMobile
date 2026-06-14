import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { db } from '../services/firebase';
import { useAuth } from '../store/AuthContext';
import vi from '../i18n/vi';
import { COLORS } from '../utils/constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<MainStackParamList, 'AdminPanel'>;

export default function AdminPanelScreen({}: Props) {
  const { userData } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (userData?.role === 'admin') {
      const unsubscribe = db.collection('users').onSnapshot(snapshot => {
        const list: any[] = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setUsers(list);
      });
      return unsubscribe;
    }
  }, [userData]);

  if (userData?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{vi.userManagement}</Text>
        <Text style={styles.error}>Bạn không có quyền truy cập</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{vi.userManagement}</Text>
      <Text style={styles.count}>Tổng số: {users.length} người dùng</Text>
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.email}>{item.email}</Text>
            <Text style={styles.role}>{item.role}</Text>
            <Text style={styles.balance}>{(item.paperBalance?.USDT || 0).toLocaleString()} USDT</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{vi.noUsers}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  count: { color: COLORS.textSecondary, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  email: { color: COLORS.text, flex: 2 },
  role: { color: COLORS.textSecondary, flex: 1, textAlign: 'center' },
  balance: { color: COLORS.text, flex: 1.5, textAlign: 'right' },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
  error: { color: COLORS.red, textAlign: 'center', marginTop: 40, fontSize: 16 },
});
