import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatCard } from '@components/ui/StatCard';
import { TripCard } from '@components/TripCard';
import { VehiclePicker } from '@components/ui/VehiclePicker';
import { useTrips } from '@hooks/useTrips';
import { useFuel } from '@hooks/useFuel';
import { useExpenses } from '@hooks/useExpenses';
import { useVehicles } from '@hooks/useVehicles';
import { calculateNetEarnings } from '@utils/calculations';
import { formatCurrency, formatKm } from '@utils/formatters';

export default function DashboardScreen() {
  const router = useRouter();
  const { vehicles, activeVehicle } = useVehicles();

  const activeVehicleId = activeVehicle?.id;

  const { trips, completedTrips, totalEarnings, activeTrip } = useTrips(activeVehicleId);
  const { totalCost: totalFuelCost } = useFuel(activeVehicleId);
  const { totalAmount: totalExpenses } = useExpenses(activeVehicleId);

  const netEarnings = useMemo(
    () => calculateNetEarnings(totalEarnings, totalFuelCost, totalExpenses),
    [totalEarnings, totalFuelCost, totalExpenses],
  );

  const totalKm = useMemo(
    () => completedTrips.reduce((sum, t) => sum + (t.distanceKm ?? 0), 0),
    [completedTrips],
  );

  const recentTrips = trips.slice(0, 3);

  // Araç yoksa → CTA göster
  if (vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.noVehicleContainer}>
          <Text style={styles.noVehicleIcon}>🚗</Text>
          <Text style={styles.noVehicleTitle}>Araç bulunamadı</Text>
          <Text style={styles.noVehicleText}>
            Seyir, yakıt ve gider takibi yapabilmek için önce bir araç ekleyin.
          </Text>
          <TouchableOpacity
            style={styles.noVehicleBtn}
            onPress={() => router.push('/vehicle/new')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.noVehicleBtnText}>Araç Ekle</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hoş geldin 👋</Text>
            <Text style={styles.appName}>SeyirLog</Text>
          </View>
          {/* Araç seçici — birden fazla araç varsa dokunulabilir */}
          {vehicles.length > 1 ? (
            <VehiclePicker />
          ) : activeVehicle ? (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.8}
            >
              <View style={styles.vehicleTag}>
                <Text style={styles.vehicleTagText} numberOfLines={1}>
                  {activeVehicle.brand} {activeVehicle.model}
                  {activeVehicle.plate ? ` · ${activeVehicle.plate}` : ''}
                </Text>
                <Ionicons name="chevron-forward" size={12} color="#64748B" />
              </View>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Active Trip Banner */}
        {activeTrip ? (
          <TouchableOpacity
            style={styles.activeBanner}
            onPress={() => router.push(`/trip/${activeTrip.id}`)}
          >
            <View style={styles.activeDot} />
            <Text style={styles.activeBannerText}>
              Aktif Sefer: {activeTrip.origin} → {activeTrip.destination}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#22C55E" />
          </TouchableOpacity>
        ) : null}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Net Kazanç"
            value={formatCurrency(netEarnings)}
            icon="💰"
            accentColor={netEarnings >= 0 ? '#22C55E' : '#EF4444'}
          />
          <StatCard
            label="Toplam Kazanç"
            value={formatCurrency(totalEarnings)}
            icon="📈"
            accentColor="#3B82F6"
          />
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            label="Toplam KM"
            value={formatKm(totalKm)}
            icon="🛣️"
            accentColor="#F59E0B"
          />
          <StatCard
            label="Toplam Sefer"
            value={String(completedTrips.length)}
            icon="🚖"
            accentColor="#8B5CF6"
          />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Hızlı Eylemler</Text>
        <View style={styles.actions}>
          <ActionButton
            icon="navigate-circle"
            label="Yeni Sefer"
            color="#22C55E"
            onPress={() => router.push('/trip/new')}
          />
          <ActionButton
            icon="flame"
            label="Yakıt Gir"
            color="#F59E0B"
            onPress={() => router.push('/fuel/new')}
          />
          <ActionButton
            icon="wallet"
            label="Gider Ekle"
            color="#EF4444"
            onPress={() => router.push('/expense/new')}
          />
          <ActionButton
            icon="cash"
            label="Gelir Ekle"
            color="#22C55E"
            onPress={() => router.push('/income/new')}
          />
        </View>

        {/* Recent Trips */}
        {recentTrips.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Son Seferler</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/trips')}>
                <Text style={styles.seeAll}>Tümü →</Text>
              </TouchableOpacity>
            </View>
            {recentTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚖</Text>
            <Text style={styles.emptyText}>Henüz sefer kaydı yok.</Text>
            <Text style={styles.emptySubText}>
              İlk seferi eklemek için "Yeni Sefer" düğmesine bas.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },

  // Araç yoksa tam ekran CTA
  noVehicleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  noVehicleIcon: { fontSize: 64 },
  noVehicleTitle: { color: '#F1F5F9', fontSize: 22, fontWeight: '800' },
  noVehicleText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  noVehicleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 8,
  },
  noVehicleBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {},
  greeting: { color: '#94A3B8', fontSize: 14 },
  appName: { color: '#F1F5F9', fontSize: 26, fontWeight: '800' },

  vehicleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
    maxWidth: 180,
  },
  vehicleTagText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },

  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E20',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#22C55E40',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  activeBannerText: {
    flex: 1,
    color: '#22C55E',
    fontWeight: '600',
    fontSize: 13,
  },
  statsGrid: { flexDirection: 'row', gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sectionTitle: { color: '#F1F5F9', fontSize: 17, fontWeight: '700', marginTop: 8 },
  seeAll: { color: '#3B82F6', fontSize: 13 },
  actions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  actionBtn: { flex: 1, alignItems: 'center', gap: 8 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '500', textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#94A3B8', fontSize: 16, fontWeight: '600' },
  emptySubText: { color: '#64748B', fontSize: 13, textAlign: 'center' },
});
