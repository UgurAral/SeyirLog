import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { useVehicles } from '@hooks/useVehicles';
import type { Vehicle } from '@types/index';

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
  const { vehicles, activeVehicle, isLoading, error, setActiveVehicle } =
    useVehicles();

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
