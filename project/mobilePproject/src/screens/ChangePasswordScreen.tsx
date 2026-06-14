import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { auth } from '../services/firebase';
import firebase from '@react-native-firebase/auth';
import vi from '../i18n/vi';
import { COLORS } from '../utils/constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<MainStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen({ navigation }: Props) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert(vi.error, 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(vi.error, 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(vi.error, vi.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const user = auth().currentUser;
      if (!user || !user.email) throw new Error('Không tìm thấy người dùng');

      // Re-authenticate với mật khẩu cũ
      const credential = firebase.EmailAuthProvider.credential(user.email, oldPassword);
      await user.reauthenticateWithCredential(credential);

      // Đổi mật khẩu mới
      await user.updatePassword(newPassword);

      Alert.alert(vi.success, 'Mật khẩu đã được đổi thành công');
      navigation.goBack();
    } catch (e: any) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        Alert.alert(vi.error, 'Mật khẩu cũ không đúng');
      } else {
        Alert.alert(vi.error, e.message || 'Đổi mật khẩu thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đổi mật khẩu</Text>

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu hiện tại"
        placeholderTextColor={COLORS.textSecondary}
        value={oldPassword}
        onChangeText={setOldPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu mới"
        placeholderTextColor={COLORS.textSecondary}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Xác nhận mật khẩu mới"
        placeholderTextColor={COLORS.textSecondary}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.btn} onPress={handleChange} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Lưu mật khẩu</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 24 },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btn: { backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
