import './global.css';
import { Stack } from 'expo-router';
import { View, StyleSheet, ActivityIndicator, Text, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '@db/index';
import migrations from '@db/migrations';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import { initAuthListener, useAuthStore } from '@stores/authStore';
import { useCurrencyStore } from '@stores/currencyStore';
import { useDistanceUnitStore } from '@stores/distanceUnitStore';
import { useDayTrackingStore } from '@stores/dayTrackingStore';
import { useTripStore } from '@stores/tripStore';
import { useOnboardingStore } from '@stores/onboardingStore';
import { useThemeStore } from '@stores/themeStore';
import { startRealtimeSync, stopRealtimeSync } from '@services/realtime';
import { requestLocationPermissionOnce } from '@utils/location';
import { initAds } from '@utils/ads';
import { useActiveStatusNotificationSync } from '@hooks/useActiveStatusNotificationSync';
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
  const appReadyRef = useRef(false);
  const pendingNotificationRouteRef = useRef<string | null>(null);
  const autoOpenedActiveTripRef = useRef(false);

  useActiveStatusNotificationSync();

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
    // tripStore.activeTrip normalde Dashboard mount olup vehicleId'yi
    // çözünce (useTrips → fetchActiveTrip) doldurulur — bu, initDayTracking
    // gibi anında değil, birkaç render/async adım sonra gerçekleşir. O
    // pencerede aktif durum bildirimi (useActiveStatusNotificationSync)
    // gerçekte aktif bir sefer varken "aktif gün" içeriğiyle gösterilebilir.
    // Araçtan bağımsız erken bir sorgu bu boşluğu kapatır.
    if (!success) return;
    useTripStore.getState().fetchActiveTripGlobal();
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

  // Aktif durum bildirimine dokununca uygulamayı ilgili ekrana götürür.
  // Stack henüz mount olmadan router.push çağırmak (i18nReady bug'ında
  // olduğu gibi) navigasyonu bozar — bu yüzden hedef rota, app hazır
  // olana kadar pendingNotificationRouteRef'te bekletilir.
  //
  // router.push yerine router.navigate kullanılıyor: soğuk açılışta uygulama
  // yavaş açılırken kullanıcı bildirime tekrar dokunursa (2 kere tıklama),
  // ikinci dokunuş appReadyRef zaten true olduğu için buraya düşer — push
  // aynı ekranı ikinci kez yığına eklerdi, navigate zaten o rotadaysak
  // hiçbir şey yapmaz.
  useEffect(() => {
    const goToRoute = async (route: string | undefined) => {
      if (!route) return;
      if (appReadyRef.current) {
        if (route === '/quick-entry') await useTripStore.getState().fetchActiveTripGlobal();
        router.navigate(route as never);
      } else {
        pendingNotificationRouteRef.current = route;
      }
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      goToRoute(response?.notification.request.content.data?.route as string | undefined);
    });

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      goToRoute(response.notification.request.content.data?.route as string | undefined);
    });
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (!initialized || !success || !onboardingReady || !themeReady || !i18nReady) return;
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
      appReadyRef.current = true;
      const pendingRoute = pendingNotificationRouteRef.current;
      if (pendingRoute) {
        pendingNotificationRouteRef.current = null;
        (async () => {
          // quick-entry, aktif seferi Dashboard'un mount olup vehicleId'yi
          // çözmesine (fetchActiveTrip) bağlı olmadan doğrudan store'dan
          // okur — soğuk açılışta bu henüz gerçekleşmemiş olabileceğinden,
          // yönlendirmeden önce aktif seferi araçtan bağımsız tazeliyoruz.
          if (pendingRoute === '/quick-entry') await useTripStore.getState().fetchActiveTripGlobal();
          // Bu, uygulama açıldıktan sonraki İLK navigasyon çağrısı olabilir
          // (soğuk açılış + bildirim) — doğrudan quick-entry'ye navigate
          // edersek Stack'in altında (tabs) hiç kurulmamış oluyor ve
          // modal'daki "kapat" (router.back) hiçbir yere gidemiyor. Önce
          // (tabs)'ı temele oturtup quick-entry'yi onun üstüne itiyoruz.
          if (pendingRoute !== '/(tabs)') router.replace('/(tabs)');
          router.push(pendingRoute as never);
        })();
      } else if (!autoOpenedActiveTripRef.current) {
        // Bildirim yoluyla değil, düz launcher tıklamasıyla açılışta bile
        // aktif bir sefer varsa kullanıcı onu görsün. Tek seferlik bir ref
        // ile korunuyor ki her app-ready re-render'ında (dil değişimi vb.)
        // tekrar tekrar açılmasın; navigate (push değil) kullanılıyor ki
        // Dashboard'daki manuel quick-entry açmalarıyla çakışıp ekranda
        // sefer sayfası birikmesin.
        autoOpenedActiveTripRef.current = true;
        (async () => {
          await useTripStore.getState().fetchActiveTripGlobal();
          if (useTripStore.getState().activeTrip) {
            router.navigate('/quick-entry');
          }
        })();
      }
    }
  }, [user, initialized, success, onboardingReady, onboardingSeen, themeReady, i18nReady, t, router]);

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
