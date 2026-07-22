import React, { useState } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TripCard } from '@components/TripCard';
import { PeriodFilter, type Period } from '@components/ui/PeriodFilter';
import { useTrips } from '@hooks/useTrips';
import { useVehicles } from '@hooks/useVehicles';
import { formatCurrency, formatKm } from '@utils/formatters';
import type { Trip } from '@types/index';

export default function TripsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('all');
  const { activeVehicle } = useVehicles();

  const {
    filteredTrips,
    isLoading,
    periodEarnings,
    periodKm,
    periodCount,
  } = useTrips(activeVehicle?.id, period);

  const renderItem = ({ item }: { item: Trip }) => (
    <TripCard trip={item} />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={filteredTrips}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>Seferler</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => router.push('/trip/new')}
              >
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Dönem Filtresi */}
            <PeriodFilter selected={period} onChange={setPeriod} />

            {/* Dönem Özeti */}
            {period !== 'all' && (
              <View style={styles.summaryBar}>
                <SummaryItem label="Sefer" value={String(periodCount)} />
                <View style={styles.summaryDivider} />
                <SummaryItem label="Kazanç" value={formatCurrency(periodEarnings)} color="#22C55E" />
                <View style={styles.summaryDivider} />
                <SummaryItem label="Mesafe" value={formatKm(periodKm)} color="#F59E0B" />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🚖</Text>
              <Text style={styles.emptyText}>Bu dönemde sefer kaydı yok</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function SummaryItem({
  label,
  value,
  color = '#F1F5F9',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  list: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { color: '#F1F5F9', fontSize: 26, fontWeight: '800' },
  addBtn: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: { alignItems: 'center', gap: 4, flex: 1 },
  summaryLabel: { color: '#64748B', fontSize: 11, fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '700' },
  summaryDivider: { width: 1, height: 32, backgroundColor: '#334155' },
  separator: { height: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#64748B', fontSize: 15 },
});
