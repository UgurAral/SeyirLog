import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTrips } from '@hooks/useTrips';
import { useFuel } from '@hooks/useFuel';
import { useExpenses } from '@hooks/useExpenses';
import { useIncome } from '@hooks/useIncome';
import { useVehicles } from '@hooks/useVehicles';
import { useCurrencyStore, type SupportedCurrency } from '@stores/currencyStore';
import { sumByCurrency } from '@utils/calculations';
import { formatKm, formatCurrency, formatTime } from '@utils/formatters';
import { TripCard } from '@components/TripCard';
import { CurrencyBreakdownValue } from '@components/ui/CurrencyBreakdownValue';
import { AdBanner } from '@components/AdBanner';

export default function DaySummaryScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { start, end } = useLocalSearchParams<{ start?: string; end?: string }>();
  const { activeVehicle } = useVehicles();
  const vehicleId = activeVehicle?.id;
  const activeCurrency = useCurrencyStore((s) => s.currency);

  const startTs = start ? parseInt(start, 10) : null;
  const endTs = end ? parseInt(end, 10) : null;
  const hasRange = startTs !== null && endTs !== null;
  // Aralık yoksa (beklenmedik doğrudan navigasyon) filtreler her zaman boş
  // sonuç dönsün diye ters çevrilmiş, boş bir aralık kullanılır.
  const rangeStart = startTs ?? 0;
  const rangeEnd = endTs ?? 0;

  const { trips } = useTrips(vehicleId, 'all');
  const { fuelEntries } = useFuel(vehicleId, 'all');
  const { expenses } = useExpenses(vehicleId, 'all');
  const { entries: incomeEntries } = useIncome(vehicleId, 'all');

  const rangeTrips = useMemo(
    () => trips.filter((tr) => tr.startTime >= rangeStart && tr.startTime < rangeEnd),
    [trips, rangeStart, rangeEnd],
  );
  const rangeCompletedTrips = useMemo(
    () => rangeTrips.filter((tr) => tr.status === 'completed'),
    [rangeTrips],
  );
  const periodEarningsByCurrency = useMemo(
    () => sumByCurrency(rangeCompletedTrips, (tr) => tr.earnings ?? 0),
    [rangeCompletedTrips],
  );
  const periodEarnings = periodEarningsByCurrency[activeCurrency] ?? 0;
  const periodKm = useMemo(
    () => rangeCompletedTrips.reduce((sum, tr) => sum + (tr.distanceKm ?? 0), 0),
    [rangeCompletedTrips],
  );
  const periodCount = rangeTrips.length;

  const rangeFuel = useMemo(
    () => fuelEntries.filter((f) => f.date >= rangeStart && f.date < rangeEnd),
    [fuelEntries, rangeStart, rangeEnd],
  );
  const fuelCostByCurrency = useMemo(() => sumByCurrency(rangeFuel, (f) => f.totalCost), [rangeFuel]);
  const fuelCost = fuelCostByCurrency[activeCurrency] ?? 0;

  const rangeExpenses = useMemo(
    () => expenses.filter((e) => e.date >= rangeStart && e.date < rangeEnd),
    [expenses, rangeStart, rangeEnd],
  );
  const expenseCostByCurrency = useMemo(() => sumByCurrency(rangeExpenses, (e) => e.amount), [rangeExpenses]);
  const expenseCost = expenseCostByCurrency[activeCurrency] ?? 0;

  const rangeIncome = useMemo(
    () => incomeEntries.filter((e) => e.date >= rangeStart && e.date < rangeEnd),
    [incomeEntries, rangeStart, rangeEnd],
  );
  const incomeTotalByCurrency = useMemo(() => sumByCurrency(rangeIncome, (e) => e.amount), [rangeIncome]);
  const incomeTotal = incomeTotalByCurrency[activeCurrency] ?? 0;

  const totalIn = periodEarnings + incomeTotal;
  const totalOut = fuelCost + expenseCost;
  const net = totalIn - totalOut;
  const perKm = periodKm > 0 ? periodEarnings / periodKm : 0;
  const hasData = periodCount > 0 || fuelCost > 0 || expenseCost > 0 || incomeTotal > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#F1F5F9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('daySummary.pageTitle')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <AdBanner position="top" />

      {!hasRange ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⏱️</Text>
          <Text style={styles.emptyText}>{t('daySummary.noRange')}</Text>
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Gün Aralığı ── */}
        <Text style={styles.rangeLabel}>
          {formatTime(rangeStart, i18n.language)} → {formatTime(rangeEnd, i18n.language)}
        </Text>

        {/* ── Net Kart ── */}
        <View style={[styles.netCard, { borderColor: net >= 0 ? '#22C55E40' : '#EF444440' }]}>
          <Text style={styles.netLabel}>{t('daySummary.netLabel')}</Text>
          <Text style={[styles.netValue, { color: net >= 0 ? '#22C55E' : '#EF4444' }]}>
            {formatCurrency(net, activeCurrency)}
          </Text>
        </View>

        {/* ── Hızlı istatistikler ── */}
        <View style={styles.statsRow}>
          <QuickStat icon="🚖" label={t('daySummary.statTrip')} value={String(periodCount)} />
          <QuickStat icon="🛣️" label={t('daySummary.statKm')} value={formatKm(periodKm)} />
          <QuickStat icon="📈" label={t('daySummary.statPerKm')} value={`${formatCurrency(perKm, activeCurrency)}/km`} />
        </View>

        {!hasData ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>{t('daySummary.noData')}</Text>
          </View>
        ) : (
          <>
            {/* ── Gelirler ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('daySummary.incomeSection')}</Text>
              <CompositionBar
                segments={[
                  { value: periodEarnings, color: '#22C55E' },
                  { value: incomeTotal, color: '#3B82F6' },
                ]}
              />
              <BreakdownRow icon="🚖" color="#22C55E" label={t('daySummary.tripEarningsLabel')} amounts={periodEarningsByCurrency} activeCurrency={activeCurrency} />
              <BreakdownRow icon="💰" color="#3B82F6" label={t('daySummary.extraIncomeLabel')} amounts={incomeTotalByCurrency} activeCurrency={activeCurrency} />
            </View>

            {/* ── Giderler ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('daySummary.outcomeSection')}</Text>
              <CompositionBar
                segments={[
                  { value: fuelCost, color: '#F59E0B' },
                  { value: expenseCost, color: '#EF4444' },
                ]}
              />
              <BreakdownRow icon="⛽" color="#F59E0B" label={t('daySummary.fuelLabel')} amounts={fuelCostByCurrency} activeCurrency={activeCurrency} />
              <BreakdownRow icon="💸" color="#EF4444" label={t('daySummary.expenseLabel')} amounts={expenseCostByCurrency} activeCurrency={activeCurrency} />
            </View>

            {/* ── Seferler ── */}
            {rangeTrips.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('daySummary.tripsSection')}</Text>
                <View style={{ gap: 10 }}>
                  {rangeTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

function QuickStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.quickStat}>
      <Text style={styles.quickStatIcon}>{icon}</Text>
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );
}

function CompositionBar({ segments }: { segments: { value: number; color: string }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  return (
    <View style={styles.barTrack}>
      {total > 0
        ? segments.map((s, i) =>
            s.value > 0 ? <View key={i} style={{ flex: s.value, backgroundColor: s.color }} /> : null,
          )
        : <View style={{ flex: 1, backgroundColor: '#334155' }} />}
    </View>
  );
}

function BreakdownRow({
  icon,
  color,
  label,
  amounts,
  activeCurrency,
}: {
  icon: string;
  color: string;
  label: string;
  amounts: Record<string, number>;
  activeCurrency: SupportedCurrency;
}) {
  return (
    <View style={styles.breakdownRow}>
      <View style={[styles.breakdownDot, { backgroundColor: color }]} />
      <Text style={styles.breakdownIcon}>{icon}</Text>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <CurrencyBreakdownValue amounts={amounts} activeCurrency={activeCurrency} color={color} textStyle={styles.breakdownValue} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: { color: '#F1F5F9', fontSize: 17, fontWeight: '700' },
  content: { padding: 16, gap: 16 },
  rangeLabel: { color: '#64748B', fontSize: 13, fontWeight: '600', textAlign: 'center' },

  netCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  netLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  netValue: { fontSize: 32, fontWeight: '800' },

  statsRow: { flexDirection: 'row', gap: 8 },
  quickStat: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  quickStatIcon: { fontSize: 18 },
  quickStatValue: { color: '#F1F5F9', fontSize: 13, fontWeight: '800' },
  quickStatLabel: { color: '#64748B', fontSize: 10, fontWeight: '500' },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyIcon: { fontSize: 42 },
  emptyText: { color: '#64748B', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },

  section: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  sectionTitle: { color: '#F1F5F9', fontSize: 15, fontWeight: '700' },

  barTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },

  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownIcon: { fontSize: 14 },
  breakdownLabel: { color: '#94A3B8', fontSize: 13, flex: 1 },
  breakdownValue: { fontSize: 13, fontWeight: '700' },
});
