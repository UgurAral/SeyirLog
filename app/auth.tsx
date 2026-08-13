import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signIn, signUp, resetPassword, signInWithGoogle, signInWithApple, firebaseAuth } from '@services/auth';
import { onLoginSync } from '@services/sync';
import { LanguagePicker } from '@components/LanguagePicker';
import { ThemeToggle } from '@components/ThemeToggle';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

type Mode = 'login' | 'register' | 'reset';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  // disabled prop bir sonraki render'a kadar devreye girmiyor — hızlı çift
  // dokunuşta iki istek birden gidip örn. doğrulama e-postasının iki kez
  // gönderilmesine yol açabiliyor. Senkron ref kilidi bunu render'ı
  // beklemeden anında engelliyor.
  const submitInFlight = useRef(false);
  const googleInFlight = useRef(false);
  const appleInFlight = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    if (googleInFlight.current) return;
    googleInFlight.current = true;
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      // Google hesapları Firebase'e her zaman emailVerified: true olarak gelir,
      // ayrıca doğrulama adımına gerek yok. Farklı bir hesaba geçilmiş olabilir —
      // yönlendirmeden önce sync'in (ve gerekiyorsa lokal veri temizliğinin)
      // bitmesini bekliyoruz ki önceki kullanıcının verisi asla görünmesin.
      await onLoginSync(result.user.uid);
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e.code !== 'SIGN_IN_CANCELLED' && e.code !== '12501') {
        Alert.alert(t('common.error'), e.message);
      }
    } finally {
      googleInFlight.current = false;
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (appleInFlight.current) return;
    appleInFlight.current = true;
    setAppleLoading(true);
    try {
      const result = await signInWithApple();
      // Apple hesapları da Firebase'e emailVerified: true olarak gelir.
      await onLoginSync(result.user.uid);
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert(t('common.error'), e.message);
      }
    } finally {
      appleInFlight.current = false;
      setAppleLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (submitInFlight.current) return;
    if (!email.trim()) return Alert.alert(t('common.error'), t('auth.emailRequired'));
    if (mode !== 'reset' && !password) return Alert.alert(t('common.error'), t('auth.passwordRequired'));

    submitInFlight.current = true;
    setLoading(true);
    try {
      if (mode === 'login') {
        const result = await signIn(email.trim(), password);
        if (!firebaseAuth.currentUser?.emailVerified) {
          router.replace('/verify-email');
        } else {
          // Farklı bir hesaba geçilmiş olabilir — yönlendirmeden önce sync'in
          // bitmesini bekliyoruz ki önceki kullanıcının verisi görünmesin.
          await onLoginSync(result.user.uid);
          router.replace('/(tabs)');
        }
      } else if (mode === 'register') {
        if (password.length < 6) return Alert.alert(t('common.error'), t('auth.passwordMinLength'));
        await signUp(email.trim(), password);
        router.replace('/verify-email');
      } else {
        await resetPassword(email.trim());
        Alert.alert(t('auth.resetSentTitle'), t('auth.resetSentBody'));
        setMode('login');
      }
    } catch (e: any) {
      const msg: Record<string, string> = {
        'auth/user-not-found': t('auth.errors.userNotFound'),
        'auth/wrong-password': t('auth.errors.wrongPassword'),
        'auth/email-already-in-use': t('auth.errors.emailAlreadyInUse'),
        'auth/invalid-email': t('auth.errors.invalidEmail'),
        'auth/too-many-requests': t('auth.errors.tooManyRequests'),
      };
      Alert.alert(t('common.error'), msg[e.code] ?? e.message);
    } finally {
      submitInFlight.current = false;
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemeToggle style={[styles.themeToggle, { top: insets.top + 12 }]} />
      <LanguagePicker compact style={[styles.languagePicker, { top: insets.top + 12 }]} />
      <View style={styles.card}>
        <Text style={styles.logo}>🚖</Text>
        <Text style={styles.title}>{t('auth.appName')}</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? t('auth.login') : mode === 'register' ? t('auth.register') : t('auth.reset')}
        </Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.email')}
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {mode !== 'reset' && (
          <View style={styles.passwordWrap}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('auth.password')}
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
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
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={colors.onAccent} />
            : <Text style={styles.btnText}>
                {mode === 'login' ? t('auth.loginButton') : mode === 'register' ? t('auth.registerButton') : t('auth.resetButton')}
              </Text>
          }
        </TouchableOpacity>

        <View style={styles.links}>
          {mode === 'login' && (
            <>
              <TouchableOpacity onPress={() => setMode('register')}>
                <Text style={styles.link}>{t('auth.createAccount')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('reset')}>
                <Text style={styles.link}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>
            </>
          )}
          {mode !== 'login' && (
            <TouchableOpacity onPress={() => setMode('login')}>
              <Text style={styles.link}>{t('auth.backToLogin')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {mode !== 'reset' && (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.orDivider')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleBtn, googleLoading && { opacity: 0.6 }]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading || loading}
              activeOpacity={0.85}
            >
              {googleLoading
                ? <ActivityIndicator color="#1E293B" />
                : <Text style={styles.googleBtnText}>{t('auth.googleButton')}</Text>
              }
            </TouchableOpacity>

            {appleAvailable && (
              appleLoading ? (
                <View style={[styles.appleBtn, styles.appleBtnLoading]}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={12}
                  style={styles.appleBtn}
                  onPress={handleAppleSignIn}
                />
              )
            )}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
    languagePicker: { position: 'absolute', right: 16, zIndex: 10 },
    themeToggle: { position: 'absolute', left: 16, zIndex: 10 },
    card: { margin: 24, backgroundColor: colors.surface, borderRadius: 20, padding: 28, gap: 14 },
    logo: { fontSize: 48, textAlign: 'center' },
    title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800', textAlign: 'center' },
    subtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 8 },
    input: {
      backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 14,
      paddingVertical: 12, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border,
    },
    passwordWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingRight: 6,
    },
    passwordInput: {
      flex: 1, paddingHorizontal: 14, paddingVertical: 12, color: colors.textPrimary, fontSize: 15,
    },
    passwordToggle: { padding: 8 },
    btn: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    btnText: { color: colors.onAccent, fontWeight: '700', fontSize: 16 },
    links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    link: { color: colors.accent, fontSize: 13 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { color: colors.textMuted, fontSize: 12 },
    // Google/Apple butonları marka kurallarına göre sabit renkli — temaya göre değişmez.
    googleBtn: {
      backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    },
    googleBtnText: { color: '#1E293B', fontWeight: '700', fontSize: 16 },
    appleBtn: { height: 48, width: '100%' },
    appleBtnLoading: { backgroundColor: '#000', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  });
}
