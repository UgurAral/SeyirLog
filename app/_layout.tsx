import './global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '@db/index';
import migrations from '@db/migrations';
import { BackupOnboardingModal } from '@components/BackupOnboardingModal';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { initAuthListener, useAuthStore } from '@stores/authStore';

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const router = useRouter();
  const { user, initialized } = useAuthStore();

  useEffect(() => {
    const unsub = initAuthListener();
    return unsub;
  }, []);

  useEffect(() => {
    if (!initialized) return;
    if (!user) router.replace('/auth');
  }, [user, initialized]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>DB Hatası: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#3B82F6" size="large" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <BackupOnboardingModal />
      <View style={styles.root}>
        <StatusBar style="light" backgroundColor="#0F172A" />
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
            options={{ title: 'Yeni Sefer', presentation: 'modal' }}
          />
          <Stack.Screen
            name="trip/[id]"
            options={{ title: 'Sefer Detayı' }}
          />
          <Stack.Screen
            name="fuel/new"
            options={{ title: 'Yakıt Girişi', presentation: 'modal' }}
          />
          <Stack.Screen
            name="expense/new"
            options={{ title: 'Yeni Gider', presentation: 'modal' }}
          />
          <Stack.Screen
            name="income/new"
            options={{ title: 'Gelir Ekle', presentation: 'modal' }}
          />
          <Stack.Screen
            name="vehicle/new"
            options={{ title: 'Araç Ekle', presentation: 'modal' }}
          />
          <Stack.Screen
            name="vehicle/[id]"
            options={{ title: 'Araç Düzenle' }}
          />
          <Stack.Screen
            name="quick-entry"
            options={{ title: 'Hızlı Giriş', presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="auth"
            options={{ headerShown: false }}
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
