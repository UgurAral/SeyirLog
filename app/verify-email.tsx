import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { sendVerificationEmail, reloadCurrentUser, signOut } from '@services/auth';
import { useAuthStore } from '@stores/authStore';
import { onLoginSync } from '@services/sync';
import { startRealtimeSync } from '@services/realtime';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const resendInFlight = useRef(false);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const updatedUser = await reloadCurrentUser();
      if (updatedUser?.emailVerified) {
        setUser(updatedUser);
        startRealtimeSync();
        await onLoginSync(updatedUser.uid);
        router.replace('/(tabs)');
      } else {
        Alert.alert(t('verifyEmail.notVerifiedTitle'), t('verifyEmail.notVerifiedBody'));
      }
    } catch (e) {
      Alert.alert(t('common.error'), String(e));
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (resendInFlight.current) return;
    resendInFlight.current = true;
    setResending(true);
    try {
      await sendVerificationEmail();
      Alert.alert(t('verifyEmail.resentTitle'), t('verifyEmail.resentBody'));
    } catch (e: any) {
      const msg = e.code === 'auth/too-many-requests'
        ? t('verifyEmail.tooManyRequests')
        : String(e.message ?? e);
      Alert.alert(t('common.error'), msg);
    } finally {
      resendInFlight.current = false;
      setResending(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.logo}>📧</Text>
        <Text style={styles.title}>{t('verifyEmail.title')}</Text>
        <Text style={styles.body}>
          {t('verifyEmail.body', { email: user?.email ?? '' })}
        </Text>

        <TouchableOpacity
          style={[styles.btn, checking && styles.btnDisabled]}
          onPress={handleCheck}
          disabled={checking}
          activeOpacity={0.85}
        >
          {checking
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>{t('verifyEmail.checkButton')}</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={handleResend}
          disabled={resending}
        >
          <Text style={styles.link}>
            {resending ? t('verifyEmail.resending') : t('verifyEmail.resendButton')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkBtn} onPress={() => signOut()}>
          <Text style={styles.linkMuted}>{t('verifyEmail.differentAccount')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center' },
  card: { margin: 24, backgroundColor: '#1E293B', borderRadius: 20, padding: 28, gap: 14 },
  logo: { fontSize: 48, textAlign: 'center' },
  title: { color: '#F1F5F9', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  body: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 21 },
  btn: {
    backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkBtn: { alignItems: 'center', paddingVertical: 6 },
  link: { color: '#3B82F6', fontSize: 13, fontWeight: '600' },
  linkMuted: { color: '#64748B', fontSize: 13 },
});
