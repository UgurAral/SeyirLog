import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signIn, signUp, resetPassword } from '@services/auth';

type Mode = 'login' | 'register' | 'reset';

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return Alert.alert('Hata', 'E-posta zorunlu.');
    if (mode !== 'reset' && !password) return Alert.alert('Hata', 'Şifre zorunlu.');

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        router.replace('/(tabs)');
      } else if (mode === 'register') {
        if (password.length < 6) return Alert.alert('Hata', 'Şifre en az 6 karakter olmalı.');
        await signUp(email.trim(), password);
        router.replace('/(tabs)');
      } else {
        await resetPassword(email.trim());
        Alert.alert('✅ Gönderildi', 'Şifre sıfırlama e-postası gönderildi.');
        setMode('login');
      }
    } catch (e: any) {
      const msg: Record<string, string> = {
        'auth/user-not-found': 'Bu e-posta ile kayıtlı kullanıcı yok.',
        'auth/wrong-password': 'Şifre hatalı.',
        'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı.',
        'auth/invalid-email': 'Geçersiz e-posta.',
        'auth/too-many-requests': 'Çok fazla deneme. Lütfen bekleyin.',
      };
      Alert.alert('Hata', msg[e.code] ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>🚖</Text>
        <Text style={styles.title}>SeyirLog</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Giriş Yap' : mode === 'register' ? 'Hesap Oluştur' : 'Şifre Sıfırla'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="E-posta"
          placeholderTextColor="#475569"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {mode !== 'reset' && (
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            placeholderTextColor="#475569"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        )}

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>
                {mode === 'login' ? 'Giriş Yap' : mode === 'register' ? 'Kayıt Ol' : 'Sıfırlama Gönder'}
              </Text>
          }
        </TouchableOpacity>

        <View style={styles.links}>
          {mode === 'login' && (
            <>
              <TouchableOpacity onPress={() => setMode('register')}>
                <Text style={styles.link}>Hesap oluştur →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('reset')}>
                <Text style={styles.link}>Şifremi unuttum</Text>
              </TouchableOpacity>
            </>
          )}
          {mode !== 'login' && (
            <TouchableOpacity onPress={() => setMode('login')}>
              <Text style={styles.link}>← Giriş yap</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center' },
  card: { margin: 24, backgroundColor: '#1E293B', borderRadius: 20, padding: 28, gap: 14 },
  logo: { fontSize: 48, textAlign: 'center' },
  title: { color: '#F1F5F9', fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#64748B', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  input: {
    backgroundColor: '#0F172A', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, color: '#F1F5F9', fontSize: 15, borderWidth: 1, borderColor: '#334155',
  },
  btn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  link: { color: '#3B82F6', fontSize: 13 },
});
