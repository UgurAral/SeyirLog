import './global.css';
import { Stack } from 'expo-router';
import { View, StyleSheet, ActivityIndicator, Text, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '@db/index';
import migrations from '@db/migrations';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { initAuthListener, useAuthStore } from '@stores/authStore';
import { useCurrencyStore } from '@stores/currencyStore';
import { startRealtimeSync, stopRealtimeSync } from '@services/realtime';
import { initI18n } from '@/i18n';

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const [i18nReady, setI18nReady] = useState(false);
  const { initCurrency, initialized: currencyReady } = useCurrencyStore();
  const { t } = useTranslation();

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    initCurrency();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsub = initAuthListener();
    return unsub;
  }, []);

  useEffect(() => {
    if (!initialized || !success) return;
    if (!user) {
      stopRealtimeSync();
      router.replace('/auth');
    } else if (!user.emailVerified) {
      stopRealtimeSync();
      router.replace('/verify-email');
    } else {
      startRealtimeSync();
    }
  }, [user, initialized, success]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>DB Hatası: {error.message}</Text>
      </View>
    );
  }

  if (!success || !i18nReady || !currencyReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#3B82F6" size="large" />
        <Text style={styles.loadingText}>{i18nReady ? t('common.loading') : ''}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#1a1a2e' },
            headerTintColor: '#F1F5F9',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: '#0F172A' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A' },
  center: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: { color: '#EF4444', fontSize: 14 },
  loadingText: { color: '#94A3B8', fontSize: 14 },
});
