import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { deleteAccount } from '@services/accountDeletion';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = () => {
    if (!password) {
      return Alert.alert(t('deleteAccount.passwordRequiredTitle'), t('deleteAccount.passwordRequiredBody'));
    }

    Alert.alert(
      t('deleteAccount.confirmTitle'),
      t('deleteAccount.confirmBody'),
      [
        { text: t('deleteAccount.cancelLink'), style: 'cancel' },
        {
          text: t('deleteAccount.confirmButton'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteAccount(password);
              // Firebase auth durumu değişince app/_layout.tsx otomatik
              // olarak /auth ekranına yönlendirir.
            } catch (e: any) {
              const msg: Record<string, string> = {
                'auth/wrong-password': t('deleteAccount.wrongPassword'),
                'auth/invalid-credential': t('deleteAccount.wrongPassword'),
                'auth/too-many-requests': t('deleteAccount.tooManyRequests'),
              };
              Alert.alert(t('common.error'), msg[e.code] ?? e.message ?? t('deleteAccount.genericError'));
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>{t('deleteAccount.title')}</Text>
        <Text style={styles.warning}>{t('deleteAccount.warning')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('deleteAccount.passwordPlaceholder')}
          placeholderTextColor="#475569"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.deleteBtn, loading && { opacity: 0.6 }]}
          onPress={handleDelete}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.deleteBtnText}>{t('deleteAccount.deleteButton')}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Text style={styles.cancelLink}>{t('deleteAccount.cancelLink')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center' },
  card: { margin: 24, backgroundColor: '#1E293B', borderRadius: 20, padding: 28, gap: 14 },
  icon: { fontSize: 40, textAlign: 'center' },
  title: { color: '#F1F5F9', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  warning: { color: '#FCA5A5', fontSize: 13.5, lineHeight: 20, textAlign: 'center' },
  input: {
    backgroundColor: '#0F172A', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, color: '#F1F5F9', fontSize: 15, borderWidth: 1, borderColor: '#334155',
  },
  deleteBtn: { backgroundColor: '#EF4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  deleteBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelLink: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 2 },
});
