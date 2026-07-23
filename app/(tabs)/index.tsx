import React, { useState, useMemo } from 'react';
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
import { TripCard } from '@components/TripCard';
import { useTrips } from '@hooks/useTrips';
import { useFuel } from '@hooks/useFuel';
import { useExpenses } from '@hooks/useExpenses';
import { useVehicles } from '@hooks/useVehicles';
import { formatCurrency, formatKm } from '@utils/formatters';

type Period = 'today' | 'week' | 'month' | 'all';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Bugün' },
  { id: 'week', label: 'Hafta' },
  { id: 'month', label: 'Ay' },
  { id: 'all', label: 'Tümü' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('today');
  const { vehicles, activeVehicle } = useVehicles();
  const vehicleId = activeVehicle?.id;

  const {
    trips,
    activeTrip,
    periodEarnings,
    periodKm,
    periodCount,
  } = useTrips(vehicleId, period);

  const { periodCost: fuelCost } = useFuel(vehicleId, period);
  const { periodTotal: expenseCost } = useExpenses(vehicleId, period);

  const netEarnings = periodEarnings - fuelCost - expenseCost;
  const recentTrips = trips.slice(0, 5);

  // ── Araç yoksa CTA ────────────────────────────────────────────────────────
  if (vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚗</Text>
          <Text style={styles.emptyTitle}>Araç bulunamadı</Text>
          <Text style={styles.emptyText}>
            Takip başlatmak için önce bir araç ekle.
          </Text>
          <TouchableOpacity
            style={styles.addVehicleBtn}
            onPress={() => router.push('/vehicle/new')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.addVehicleBtnText}>Araç Ekle</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>SeyirLog</Text>
            {activeVehicle && (
              <Text style={styles.vehicleName} numberOfLines={1}>
                {activeVehicle.brand} {activeVehicle.model}
                {activeVehicle.plate ? ` · ${activeVehicle.plate}` : ''}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            hitSlop={8}
          >
            <View style={styles.profileBtn}>
              <Ionicons name="settings-outline" size={18} color="#64748B" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Period Filter ── */}
        <View style={styles.periodBar}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.periodChip, period === p.id && styles.periodChipActive]}
              onPress={() => setPeriod(p.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodChipText, period === p.id && styles.periodChipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Aktif Sefer Banner ── */}
          {activeTrip && (
            <TouchableOpacity
              style={styles.activeTripCard}
              onPress={() => router.push('/quick-entry')}
              activeOpacity={0.85}
            >
              <View style={styles.activeTripLeft}>
                <View style={styles.activeDot} />
                <View>
                  <Text style={styles.activeTripLabel}>Aktif Sefer</Text>
                  <Text style={styles.activeTripRoute} numberOfLines={1}>
                    {activeTrip.origin} → {activeTrip.destination}
                  </Text>
                </View>
              </View>
              <View style={styles.endTripBtn}>
                <Text style={styles.endTripBtnText}>Bitir →</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* ── Stats Grid ── */}
          <View style={styles.statsGrid}>
            <StatTile icon="🚖" label="Sefer" value={String(periodCount)} color="#8B5CF6" />
            <StatTile icon="🛣️" label="KM" value={formatKm(periodKm)} color="#F59E0B" />
            <StatTile icon="📈" label="Kazanç" value={formatCurrency(periodEarnings)} color="#22C55E" />
            <StatTile
              icon="💰"
              label="Net"
              value={formatCurrency(netEarnings)}
              color={netEarnings >= 0 ? '#22C55E' : '#EF4444'}
            />
          </View>

          {/* ── Alt Stats ── */}
          {(fuelCost > 0 || expenseCost > 0) && (
            <View style={styles.subStats}>
              {fuelCost > 0 && (
                <View style={styles.subStat}>
                  <Text style={styles.subStatIcon}>⛽</Text>
                  <Text style={styles.subStatLabel}>Yakıt</Text>
                  <Text style={styles.subStatValue}>{formatCurrency(fuelCost)}</Text>
                </View>
              )}
              {expenseCost > 0 && (
                <View style={styles.subStat}>
                  <Text style={styles.subStatIcon}>💸</Text>
                  <Text style={styles.subStatLabel}>Gider</Text>
                  <Text style={styles.subStatValue}>{formatCurrency(expenseCost)}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Son Seferler ── */}
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
            <View style={styles.noTrips}>
              <Text style={styles.noTripsIcon}>🚖</Text>
              <Text style={styles.noTripsText}>
                {period === 'today' ? 'Bugün henüz sefer yok.' : 'Bu dönemde sefer yok.'}
              </Text>
            </View>
          )}

          {/* FAB için boşluk */}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* ── FAB ── */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/quick-entry')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StatTile({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[styles.statTile, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={styles.statTileIcon}>{icon}</Text>
      <Text style={styles.statTileValue}>{value}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  root: { flex: 1 },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { color: '#F1F5F9', fontSize: 22, fontWeight: '800' },
  emptyText: { color: '#64748B', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  addVehicleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 8,
  },
  addVehicleBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  appName: { color: '#F1F5F9', fontSize: 24, fontWeight: '800' },
  vehicleName: { color: '#64748B', fontSize: 12, marginTop: 1 },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  periodBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  periodChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  periodChipText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  periodChipTextActive: { color: '#FFFFFF' },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12, paddingBottom: 16 },

  activeTripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#22C55E15',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#22C55E40',
  },
  activeTripLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' },
  activeTripLabel: { color: '#22C55E', fontSize: 11, fontWeight: '600' },
  activeTripRoute: { color: '#F1F5F9', fontWeight: '700', fontSize: 14, marginTop: 1 },
  endTripBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  endTripBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },

  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statTileIcon: { fontSize: 20 },
  statTileValue: { color: '#F1F5F9', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  statTileLabel: { color: '#64748B', fontSize: 10, fontWeight: '500' },

  subStats: {
    flexDirection: 'row',
    gap: 8,
  },
  subStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  subStatIcon: { fontSize: 14 },
  subStatLabel: { color: '#64748B', fontSize: 12, flex: 1 },
  subStatValue: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: '700' },
  seeAll: { color: '#3B82F6', fontSize: 13 },

  noTrips: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  noTripsIcon: { fontSize: 40 },
  noTripsText: { color: '#64748B', fontSize: 14 },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
