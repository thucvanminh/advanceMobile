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
import vi from '../i18n/vi';
import { isValidEmail, isValidPassword } from '../utils/validation';
import { COLORS } from '../utils/constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!isValidEmail(email)) {
      Alert.alert(vi.error, 'Email không hợp lệ');
      return;
    }
    const pwCheck = isValidPassword(password);
    if (!pwCheck.valid) {
      Alert.alert(vi.error, pwCheck.message || '');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(vi.error, vi.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
    } catch (e: any) {
      Alert.alert(vi.error, e.message || vi.signUpError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.content}>
        <Text style={styles.title}>{vi.signUp}</Text>
        <Text style={styles.subtitle}>{vi.signUp}</Text>

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
        <TextInput
          style={styles.input}
          placeholder={vi.confirmPassword}
          placeholderTextColor={COLORS.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{vi.signUp}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.link}>{vi.hasAccount} {vi.login}</Text>
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
