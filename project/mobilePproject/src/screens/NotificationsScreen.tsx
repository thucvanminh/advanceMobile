import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { db } from '../services/firebase';
import { useAuth } from '../store/AuthContext';
import vi from '../i18n/vi';
import { COLORS } from '../utils/constants';
import { formatTimestamp } from '../utils/format';
import type { AppNotification } from '../types/models';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<MainStackParamList, 'Notifications'>;

export default function NotificationsScreen({}: Props) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = db
      .collection('notifications')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot(snapshot => {
        const list: AppNotification[] = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as AppNotification));
        setNotifications(list);
      });
    return unsubscribe;
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{vi.notifications}</Text>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.row, !item.read && styles.unread]}>
            <View style={styles.rowTop}>
              <Text style={styles.notifTitle}>{item.title}</Text>
              <Text style={styles.notifType}>{item.type === 'price_alert' ? '🔔' : '📋'}</Text>
            </View>
            <Text style={styles.notifBody}>{item.body}</Text>
            <Text style={styles.notifTime}>{formatTimestamp(item.createdAt)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{vi.noNotifications}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  row: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  unread: { borderLeftWidth: 3, borderLeftColor: '#3b82f6' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { color: COLORS.text, fontWeight: '600', fontSize: 16, marginBottom: 4 },
  notifType: { fontSize: 16 },
  notifBody: { color: COLORS.textSecondary, fontSize: 14, marginTop: 2 },
  notifTime: { color: COLORS.textSecondary, fontSize: 11, marginTop: 6 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 60 },
});
