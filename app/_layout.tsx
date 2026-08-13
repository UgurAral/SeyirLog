import './global.css';
import { Stack } from 'expo-router';
import { View, StyleSheet, ActivityIndicator, Text, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '@db/index';
import migrations from '@db/migrations';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { initAuthListener, useAuthStore } from '@stores/authStore';
import { useCurrencyStore } from '@stores/currencyStore';
import { useDistanceUnitStore } from '@stores/distanceUnitStore';
import { useDayTrackingStore } from '@stores/dayTrackingStore';
import { useOnboardingStore } from '@stores/onboardingStore';
import { useThemeStore } from '@stores/themeStore';
import { startRealtimeSync, stopRealtimeSync } from '@services/realtime';
import { requestLocationPermissionOnce } from '@utils/location';
import { initAds } from '@utils/ads';
import { useTheme } from '@/theme/useTheme';
import { initI18n } from '@/i18n';

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const [i18nReady, setI18nReady] = useState(false);
  const { initCurrency, initialized: currencyReady } = useCurrencyStore();
  const { initDistanceUnit, initialized: distanceUnitReady } = useDistanceUnitStore();
  const { initDayTracking, initialized: dayTrackingReady } = useDayTrackingStore();
  const { seen: onboardingSeen, initialized: onboardingReady, initOnboarding } = useOnboardingStore();
  const { initialized: themeReady, initTheme } = useThemeStore();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    initTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    initCurrency();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    initDistanceUnit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // day_sessions tablosunun var olması migration'ın bitmesine bağlı —
    // erken çağrılırsa tablo henüz oluşmamış olabilir.
    if (!success) return;
    initDayTracking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  useEffect(() => {
    initOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    initAds();
  }, []);

  useEffect(() => {
    const unsub = initAuthListener();
    return unsub;
  }, []);

  useEffect(() => {
    if (!initialized || !success || !onboardingReady || !themeReady) return;
    if (!user) {
      stopRealtimeSync();
      router.replace('/auth');
    } else if (!user.emailVerified) {
      stopRealtimeSync();
      router.replace('/verify-email');
    } else if (!onboardingSeen) {
      startRealtimeSync();
      router.replace('/onboarding');
    } else {
      startRealtimeSync();
      requestLocationPermissionOnce({
        title: t('locationPermission.title'),
        message: t('locationPermission.message'),
        allow: t('locationPermission.allow'),
        later: t('locationPermission.later'),
      });
    }
  }, [user, initialized, success, onboardingReady, onboardingSeen, themeReady, t]);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>DB Hatası: {error.message}</Text>
      </View>
    );
  }

  if (!success || !i18nReady || !currencyReady || !distanceUnitReady || !dayTrackingReady || !onboardingReady || !themeReady) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{i18nReady ? t('common.loading') : ''}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: t('tabs.home') }} />
          <Stack.Screen
            name="trip/new"
            options={{ title: t('tripNew.pageTitle'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="trip/[id]"
            options={{ title: t('tripDetail.pageTitle') }}
          />
          <Stack.Screen
            name="fuel/new"
            options={{ title: t('fuelNew.pageTitle'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="expense/new"
            options={{ title: t('expenseNew.pageTitle'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="income/new"
            options={{ title: t('incomeNew.pageTitle'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="vehicle/new"
            options={{ title: t('vehicleNew.pageTitle'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="vehicle/[id]"
            options={{ title: t('vehicleDetail.pageTitle') }}
          />
          <Stack.Screen
            name="quick-entry"
            options={{ title: t('quickEntry.title'), presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="day-summary"
            options={{ title: t('daySummary.pageTitle'), presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="day-history"
            options={{ title: t('dayHistory.pageTitle'), headerShown: false }}
          />
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="auth"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="verify-email"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="delete-account"
            options={{ title: t('deleteAccount.headerTitle'), presentation: 'modal' }}
          />
        </Stack>
      </View>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: { fontSize: 14 },
  loadingText: { fontSize: 14 },
});
