import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { db } from '../services/firebase';
import { useAuth } from '../store/AuthContext';
import vi from '../i18n/vi';
import { COLORS } from '../utils/constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<MainStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { signOut, userData } = useAuth();
  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [saving, setSaving] = useState(false);
  const isAdmin = userData?.role === 'admin';

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      Alert.alert(vi.error, 'Tên hiển thị không được để trống');
      return;
    }
    setSaving(true);
    try {
      await db.collection('users').doc(userData?.id).update({
        displayName: displayName.trim(),
      });
      Alert.alert(vi.success, 'Đã cập nhật tên hiển thị');
    } catch (e: any) {
      Alert.alert(vi.error, e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{vi.settings}</Text>

      {/* Display Name */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tên hiển thị</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập tên của bạn"
          placeholderTextColor={COLORS.textSecondary}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Lưu tên'}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Điều hướng nhanh</Text>
        {isAdmin && (
          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('AdminPanel')}>
            <Text style={styles.linkText}>{vi.admin}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Help')}>
          <Text style={styles.linkText}>{vi.help}</Text>
        </TouchableOpacity>
      </View>

      {/* App info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{vi.about}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{vi.email || 'Email'}</Text>
          <Text style={styles.infoValue}>{userData?.email || ''}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{vi.role || 'Vai trò'}</Text>
          <Text style={styles.infoValue}>{userData?.role || 'user'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{vi.version}</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
      </View>

      {/* Đổi mật khẩu */}
      <TouchableOpacity style={styles.changePwdBtn} onPress={handleChangePassword}>
        <Text style={styles.changePwdBtnText}>Đổi mật khẩu</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <Text style={styles.logoutText}>{vi.logout}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveBtn: { backgroundColor: COLORS.green, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  linkRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  linkText: { color: '#3b82f6', fontSize: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { color: COLORS.textSecondary, fontSize: 14 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: '500' },
  changePwdBtn: { backgroundColor: COLORS.surface, paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#3b82f6' },
  changePwdBtnText: { color: '#3b82f6', fontWeight: '600', fontSize: 14 },
  logoutBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  logoutText: { color: COLORS.red, fontSize: 16, fontWeight: '600' },
});
