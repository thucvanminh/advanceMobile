import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useAuth } from '../store/AuthContext';
import { auth } from '../services/firebase';
import vi from '../i18n/vi';
import { isValidEmail } from '../utils/validation';
import { COLORS } from '../utils/constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!isValidEmail(email)) {
      Alert.alert(vi.error, 'Email không hợp lệ');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert(vi.error, 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      Alert.alert(vi.error, e.message || vi.loginError);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!isValidEmail(email)) {
      Alert.alert(vi.error, 'Vui lòng nhập email trước');
      return;
    }
    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert(vi.success, `Email đặt lại mật khẩu đã gửi đến ${email}`);
    } catch (e: any) {
      Alert.alert(vi.error, e.message || 'Gửi email thất bại');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.content}>
        <Text style={styles.title}>Crypto Trade</Text>
        <Text style={styles.subtitle}>{vi.login}</Text>

        <TextInput
          style={styles.input}
          placeholder={vi.email}
          placeholderTextColor={COLORS.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder={vi.password}
          placeholderTextColor={COLORS.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
          <Text style={styles.forgotText}>Quên mật khẩu?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{vi.login}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace('SignUp')}>
          <Text style={styles.link}>{vi.noAccount} {vi.signUp}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 18, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 32 },
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
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotText: { color: '#3b82f6', fontSize: 14 },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 16, fontSize: 14 },
});
