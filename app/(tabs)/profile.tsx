import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { useVehicles } from '@hooks/useVehicles';
import { exportBackup, importBackup } from '@utils/backup';
import { signOut } from '@services/auth';
import type { Vehicle } from '@/types';

const VEHICLE_TYPE_LABEL: Record<string, string> = {
  car: '🚗 Araba',
  motorcycle: '🏍️ Motosiklet',
  truck: '🚚 Kamyon',
  van: '🚐 Van',
};

const FUEL_TYPE_LABEL: Record<string, string> = {
  gasoline: 'Benzin',
  diesel: 'Dizel',
  electric: 'Elektrik',
  lpg: 'LPG',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { vehicles, activeVehicle, isLoading, error, setActiveVehicle, fetchVehicles } =
    useVehicles();
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const handleExport = async () => {
    setBackupLoading(true);
    const result = await exportBackup();
    setBackupLoading(false);
    if (!result.success) Alert.alert('Hata', result.message);
  };

  const handleImport = async () => {
    Alert.alert(
      'Veri Geri Yükle',
      'Mevcut tüm veriler silinecek ve yedeğiniz yüklenecek. Devam etmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Geri Yükle',
          style: 'destructive',
          onPress: async () => {
            setRestoreLoading(true);
            const result = await importBackup();
            setRestoreLoading(false);
            if (result.success) {
              fetchVehicles();
              Alert.alert(
                '✅ Tamamlandı',
                `Araç: ${result.counts?.vehicles ?? 0}\n` +
                `Sefer: ${result.counts?.trips ?? 0}\n` +
                `Yakıt: ${result.counts?.fuelEntries ?? 0}\n` +
                `Gider: ${result.counts?.expenses ?? 0}\n` +
                `Gelir: ${result.counts?.incomeEntries ?? 0}`,
              );
            } else {
              Alert.alert('Hata', result.message);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Başlık */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Araçlarım</Text>
          <Button
            label="+ Araç Ekle"
            onPress={() => router.push('/vehicle/new')}
            size="sm"
          />
        </View>

        {/* Yükleniyor */}
        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color="#3B82F6" />
            <Text style={styles.loadingText}>Araçlar yükleniyor...</Text>
          </View>
        )}

        {/* Hata */}
        {error && !isLoading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Boş Liste */}
        {!isLoading && !error && vehicles.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Henüz araç eklenmedi</Text>
            <Text style={styles.emptySubtitle}>
              Seferlerinizi ve giderlerinizi takip etmek için bir araç ekleyin.
            </Text>
            <Button
              label="🚗 İlk Aracı Ekle"
              onPress={() => router.push('/vehicle/new')}
            />
          </Card>
        )}

        {/* Araç Listesi */}
        {vehicles.length > 0 && (
          <View style={styles.vehicleList}>
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isActive={activeVehicle?.id === vehicle.id}
                onPress={() => router.push(`/vehicle/${vehicle.id}`)}
                onSetActive={() => setActiveVehicle(vehicle)}
              />
            ))}
          </View>
        )}

        {/* Yedekleme */}
        <View style={styles.backupSection}>
          <Text style={styles.sectionTitle}>Veri Yedekleme</Text>
          <Text style={styles.sectionDesc}>
            Verilerinizi JSON dosyası olarak dışa aktarın. Uygulama silinse bile yedeğinizden geri yükleyebilirsiniz.
          </Text>
          <View style={styles.backupButtons}>
            <TouchableOpacity
              style={[styles.backupBtn, styles.exportBtn, backupLoading && styles.btnDisabled]}
              onPress={handleExport}
              disabled={backupLoading || restoreLoading}
              activeOpacity={0.85}
            >
              {backupLoading
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.backupBtnIcon}>📤</Text>
              }
              <Text style={styles.backupBtnText}>
                {backupLoading ? 'Hazırlanıyor…' : 'Yedekle'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.backupBtn, styles.importBtn, restoreLoading && styles.btnDisabled]}
              onPress={handleImport}
              disabled={backupLoading || restoreLoading}
              activeOpacity={0.85}
            >
              {restoreLoading
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.backupBtnIcon}>📥</Text>
              }
              <Text style={styles.backupBtnText}>
                {restoreLoading ? 'Yükleniyor…' : 'Geri Yükle'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Çıkış */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => signOut()}
          activeOpacity={0.85}
        >
          <Text style={styles.signOutText}>Oturumu Kapat</Text>
        </TouchableOpacity>

        {/* Uygulama Bilgisi */}
        <Card style={styles.appInfoCard}>
          <Text style={styles.appInfoTitle}>SeyirLog</Text>
          <Text style={styles.appInfoVersion}>v1.0.0 — FAZ 2</Text>
          <Text style={styles.appInfoDesc}>
            Sürücüler için seyir defteri, yakıt ve gider takip uygulaması.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function VehicleCard({
  vehicle,
  isActive,
  onPress,
  onSetActive,
}: {
  vehicle: Vehicle;
  isActive: boolean;
  onPress: () => void;
  onSetActive: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card
        style={[
          styles.vehicleCard,
          isActive && styles.vehicleCardActive,
        ]}
      >
        <View style={styles.vehicleCardHeader}>
          <View style={styles.vehicleCardInfo}>
            <Text style={styles.vehicleName}>
              {VEHICLE_TYPE_LABEL[vehicle.type] ?? '🚗'} {vehicle.brand}{' '}
              {vehicle.model}
            </Text>
            <Text style={styles.vehicleMeta}>
              {vehicle.year ?? '—'} • {FUEL_TYPE_LABEL[vehicle.fuelType] ?? vehicle.fuelType}
            </Text>
            {vehicle.plate && (
              <View style={styles.plateBadge}>
                <Text style={styles.plateText}>{vehicle.plate}</Text>
              </View>
            )}
          </View>
          <View style={styles.vehicleCardActions}>
            {isActive ? (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>✓ Aktif</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onSetActive();
                }}
                style={styles.setActiveBtn}
              >
                <Text style={styles.setActiveBtnText}>Aktif Yap</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.chevron}>›</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#F1F5F9', fontSize: 26, fontWeight: '800' },

  center: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  loadingText: { color: '#94A3B8', fontSize: 14 },

  errorBox: {
    backgroundColor: '#1C1917',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: { color: '#EF4444', fontSize: 13 },

  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  emptyTitle: { color: '#F1F5F9', fontSize: 17, fontWeight: '700' },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  vehicleList: { gap: 10 },
  vehicleCard: { gap: 0 },
  vehicleCardActive: {
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  vehicleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleCardInfo: { flex: 1, gap: 4 },
  vehicleName: { color: '#F1F5F9', fontSize: 16, fontWeight: '700' },
  vehicleMeta: { color: '#94A3B8', fontSize: 13 },
  plateBadge: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 4,
  },
  plateText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  vehicleCardActions: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 12,
  },
  activeBadge: {
    backgroundColor: '#15803D',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeText: { color: '#DCFCE7', fontSize: 12, fontWeight: '600' },
  setActiveBtn: {
    backgroundColor: '#1E3A5F',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  setActiveBtnText: { color: '#93C5FD', fontSize: 12, fontWeight: '600' },
  chevron: { color: '#64748B', fontSize: 20 },

  backupSection: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: '700' },
  sectionDesc: { color: '#94A3B8', fontSize: 13, lineHeight: 19 },
  backupButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  backupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 11,
    paddingVertical: 13,
  },
  exportBtn: { backgroundColor: '#3B82F6' },
  importBtn: { backgroundColor: '#6366F1' },
  btnDisabled: { opacity: 0.55 },
  backupBtnIcon: { fontSize: 16 },
  backupBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  signOutBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  signOutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
  appInfoCard: { alignItems: 'center', gap: 4, paddingVertical: 16, marginTop: 8 },
  appInfoTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: '800' },
  appInfoVersion: { color: '#3B82F6', fontSize: 12 },
  appInfoDesc: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
});
