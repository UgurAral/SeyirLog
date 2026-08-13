import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { deleteAccountWithPassword, deleteAccountWithGoogle, deleteAccountWithApple } from '@services/accountDeletion';
import { firebaseAuth } from '@services/auth';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

type ReauthProvider = 'password' | 'google' | 'apple';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Google/Apple ile giriş yapmış kullanıcıların şifresi yok — sağlayıcıya
  // göre farklı bir yeniden doğrulama akışı gerekiyor.
  const providerIds = firebaseAuth.currentUser?.providerData.map((p) => p.providerId) ?? ['password'];
  const provider: ReauthProvider = providerIds.includes('password')
    ? 'password'
    : providerIds.includes('apple.com')
      ? 'apple'
      : 'google';

  const runDelete = (deleteFn: () => Promise<void>) => {
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
              await deleteFn();
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

  const handleDelete = () => {
    if (!password) {
      return Alert.alert(t('deleteAccount.passwordRequiredTitle'), t('deleteAccount.passwordRequiredBody'));
    }
    runDelete(() => deleteAccountWithPassword(password));
  };

  const handleProviderDelete = () =>
    runDelete(provider === 'apple' ? deleteAccountWithApple : deleteAccountWithGoogle);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>{t('deleteAccount.title')}</Text>
        <Text style={styles.warning}>{t('deleteAccount.warning')}</Text>

        {provider === 'password' && (
          <View style={styles.passwordWrap}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('deleteAccount.passwordPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
              style={styles.passwordToggle}
            >
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.deleteBtn, loading && { opacity: 0.6 }]}
          onPress={provider === 'password' ? handleDelete : handleProviderDelete}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={colors.onAccent} />
            : <Text style={styles.deleteBtnText}>
                {provider === 'password'
                  ? t('deleteAccount.deleteButton')
                  : provider === 'apple'
                    ? t('deleteAccount.deleteButtonApple')
                    : t('deleteAccount.deleteButtonGoogle')}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Text style={styles.cancelLink}>{t('deleteAccount.cancelLink')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
    card: { margin: 24, backgroundColor: colors.surface, borderRadius: 20, padding: 28, gap: 14 },
    icon: { fontSize: 40, textAlign: 'center' },
    title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center' },
    warning: { color: colors.dangerSoftText, fontSize: 13.5, lineHeight: 20, textAlign: 'center' },
    passwordWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingRight: 6,
    },
    passwordInput: {
      flex: 1, paddingHorizontal: 14, paddingVertical: 12, color: colors.textPrimary, fontSize: 15,
    },
    passwordToggle: { padding: 8 },
    deleteBtn: { backgroundColor: colors.danger, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    deleteBtnText: { color: colors.onAccent, fontWeight: '700', fontSize: 15 },
    cancelLink: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 2 },
  });
}
