import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTrips } from '@hooks/useTrips';
import { useFuel } from '@hooks/useFuel';
import { useExpenses } from '@hooks/useExpenses';
import { useIncome } from '@hooks/useIncome';
import { useCurrencyStore, type SupportedCurrency } from '@stores/currencyStore';
import { useDistanceUnitStore, kmToDisplay } from '@stores/distanceUnitStore';
import { useDayTrackingStore } from '@stores/dayTrackingStore';
import { sumByCurrency, resolveTripDurationMinutes } from '@utils/calculations';
import { formatKm, formatCurrency, formatTime, formatDuration } from '@utils/formatters';
import { TripCard } from '@components/TripCard';
import { CurrencyBreakdownValue } from '@components/ui/CurrencyBreakdownValue';
import { OdometerRow } from '@components/ui/OdometerRow';
import { AdBanner } from '@components/AdBanner';
import { safeBack } from '@utils/navigation';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';
import type { DaySession } from '@/types';

export default function DaySummaryScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { session } = useLocalSearchParams<{ session?: string }>();
  const sessionId = session ? parseInt(session, 10) : null;
  const activeCurrency = useCurrencyStore((s) => s.currency);
  const distanceUnit = useDistanceUnitStore((s) => s.unit);
  const getSession = useDayTrackingStore((s) => s.getSession);
  const updateSessionOdometer = useDayTrackingStore((s) => s.updateSessionOdometer);

  const [sessionRow, setSessionRow] = useState<DaySession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    if (sessionId == null) {
      // Parametre eksikse (beklenmedik doğrudan navigasyon) önceki bir
      // oturuma ait veriyi asla göstermeyelim — sıfırla.
      setSessionRow(null);
      setSessionLoading(false);
      return;
    }
    let cancelled = false;
    setSessionLoading(true);
    setSessionRow(null);
    getSession(sessionId).then((row) => {
      if (!cancelled) {
        setSessionRow(row);
        setSessionLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId, getSession]);

  const handleSaveStartOdometer = async (km: number | null) => {
    if (sessionId == null) return;
    await updateSessionOdometer(sessionId, { startOdometerKm: km });
    setSessionRow((prev) => (prev ? { ...prev, startOdometerKm: km } : prev));
  };

  const handleSaveEndOdometer = async (km: number | null) => {
    if (sessionId == null) return;
    await updateSessionOdometer(sessionId, { endOdometerKm: km });
    setSessionRow((prev) => (prev ? { ...prev, endOdometerKm: km } : prev));
  };

  const hasRange = sessionRow != null && sessionRow.endTime != null;
  // Aralık yoksa (beklenmedik doğrudan navigasyon) filtreler her zaman boş
  // sonuç dönsün diye ters çevrilmiş, boş bir aralık kullanılır.
  const rangeStart = sessionRow?.startTime ?? 0;
  const rangeEnd = sessionRow?.endTime ?? 0;
  // O anki AKTİF araç değil, vardiyanın kendi kaydındaki araç kullanılır —
  // aksi halde ekranı görüntülerken başka bir araca geçilmişse, o vardiyayla
  // hiç ilgisi olmayan bir aracın kayıtları bu özete karışabilirdi.
  const sessionVehicleId = sessionRow?.vehicleId ?? undefined;

  const { trips } = useTrips(sessionVehicleId, 'all');
  const { fuelEntries } = useFuel(sessionVehicleId, 'all');
  const { expenses } = useExpenses(sessionVehicleId, 'all');
  const { entries: incomeEntries } = useIncome(sessionVehicleId, 'all');

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
  const periodDurationMinutes = useMemo(
    () => rangeTrips.reduce((sum, tr) => sum + (resolveTripDurationMinutes(tr) ?? 0), 0),
    [rangeTrips],
  );

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
  const perKm = periodKm > 0 ? periodEarnings / kmToDisplay(periodKm, distanceUnit) : 0;
  // Sefer kazancı + ek gelirlerin toplamını vardiyanın TAMAMINA (seferler
  // arası bekleme süresi dahil, başlangıç-bitiş arası geçen gerçek süreye)
  // böler — sadece aktif sefer süresine bölünseydi, boşta geçen süre
  // hesaba katılmadığı için olduğundan yüksek bir "saatlik kazanç" çıkardı.
  const shiftDurationMinutes = hasRange ? Math.max(0, Math.floor((rangeEnd - rangeStart) / 60)) : 0;
  // Bir saatten kısa vardiyalarda saatlik ortalamaya ekstrapolasyon (örn.
  // 10 dakikada kazanılan 100'ü saatte 600 gibi göstermek) yanıltıcı
  // olduğundan, o durumda ekstrapole edilmemiş toplam gelir gösterilir.
  const hasFullHour = shiftDurationMinutes >= 60;
  const incomePerDuration = hasFullHour
    ? (periodEarnings + incomeTotal) / (shiftDurationMinutes / 60)
    : periodEarnings + incomeTotal;
  const hasData = periodCount > 0 || fuelCost > 0 || expenseCost > 0 || incomeTotal > 0;

  // Araç sefer dışında da yol yapabildiği için gerçek toplam mesafe — ve onun
  // üzerinden hesaplanan km başına kazanç — sadece km sayacı girildiyse bilinir.
  const totalDistanceKm =
    sessionRow?.startOdometerKm != null && sessionRow?.endOdometerKm != null
      ? Math.max(0, sessionRow.endOdometerKm - sessionRow.startOdometerKm)
      : null;
  const totalPerKm =
    totalDistanceKm != null && totalDistanceKm > 0
      ? periodEarnings / kmToDisplay(totalDistanceKm, distanceUnit)
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack(router)} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('daySummary.pageTitle')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <AdBanner position="top" />

      {sessionLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : !hasRange ? (
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
        <View style={[styles.netCard, { borderColor: (net >= 0 ? colors.success : colors.danger) + '40' }]}>
          <Text style={styles.netLabel}>{t('daySummary.netLabel')}</Text>
          <Text style={[styles.netValue, { color: net >= 0 ? colors.success : colors.danger }]}>
            {formatCurrency(net, activeCurrency)}
          </Text>
        </View>

        {/* ── Hızlı istatistikler ── */}
        <View style={styles.statsRow}>
          <QuickStat icon="🚖" label={t('daySummary.statTrip')} value={String(periodCount)} />
          <QuickStat icon="🛣️" label={t('daySummary.statKm')} value={formatKm(periodKm, distanceUnit)} />
          <QuickStat icon="⏱️" label={t('daySummary.statDuration')} value={formatDuration(periodDurationMinutes, i18n.language)} />
          <QuickStat icon="📈" label={t('daySummary.statPerKm')} value={`${formatCurrency(perKm, activeCurrency)}/${distanceUnit}`} />
        </View>

        <View style={styles.statsRow}>
          <QuickStat
            icon="💵"
            label={hasFullHour ? t('daySummary.statIncomePerDuration') : t('daySummary.statIncomeTotalLabel')}
            value={
              hasFullHour
                ? `${formatCurrency(incomePerDuration, activeCurrency)}/${t('daySummary.perHourSuffix')}`
                : formatCurrency(incomePerDuration, activeCurrency)
            }
          />
        </View>

        {/* ── Araç Km Sayacı ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('daySummary.odometerSectionTitle')}</Text>
          <Text style={styles.odometerHint}>{t('daySummary.odometerHint')}</Text>
          <OdometerRow
            label={t('daySummary.startOdometerLabel')}
            valueKm={sessionRow?.startOdometerKm ?? null}
            distanceUnit={distanceUnit}
            onSave={handleSaveStartOdometer}
          />
          <OdometerRow
            label={t('daySummary.endOdometerLabel')}
            valueKm={sessionRow?.endOdometerKm ?? null}
            distanceUnit={distanceUnit}
            onSave={handleSaveEndOdometer}
          />
          {totalDistanceKm != null && (
            <View style={styles.statsRow}>
              <QuickStat icon="🛣️" label={t('daySummary.totalDistanceLabel')} value={formatKm(totalDistanceKm, distanceUnit)} />
              <QuickStat
                icon="📈"
                label={t('daySummary.totalPerKmLabel')}
                value={totalPerKm != null ? `${formatCurrency(totalPerKm, activeCurrency)}/${distanceUnit}` : '—'}
              />
            </View>
          )}
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
                  { value: periodEarnings, color: colors.success },
                  { value: incomeTotal, color: colors.success },
                ]}
              />
              <BreakdownRow icon="🚖" color={colors.success} label={t('daySummary.tripEarningsLabel')} amounts={periodEarningsByCurrency} activeCurrency={activeCurrency} />
              <BreakdownRow icon="💰" color={colors.success} label={t('daySummary.extraIncomeLabel')} amounts={incomeTotalByCurrency} activeCurrency={activeCurrency} />
            </View>

            {/* ── Giderler ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('daySummary.outcomeSection')}</Text>
              <CompositionBar
                segments={[
                  { value: fuelCost, color: colors.danger },
                  { value: expenseCost, color: colors.danger },
                ]}
              />
              <BreakdownRow icon="⛽" color={colors.danger} label={t('daySummary.fuelLabel')} amounts={fuelCostByCurrency} activeCurrency={activeCurrency} />
              <BreakdownRow icon="💸" color={colors.danger} label={t('daySummary.expenseLabel')} amounts={expenseCostByCurrency} activeCurrency={activeCurrency} />
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
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.quickStat}>
      <Text style={styles.quickStatIcon}>{icon}</Text>
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );
}

function CompositionBar({ segments }: { segments: { value: number; color: string }[] }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  return (
    <View style={styles.barTrack}>
      {total > 0
        ? segments.map((s, i) =>
            s.value > 0 ? <View key={i} style={{ flex: s.value, backgroundColor: s.color }} /> : null,
          )
        : <View style={{ flex: 1, backgroundColor: colors.border }} />}
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
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.breakdownRow}>
      <View style={[styles.breakdownDot, { backgroundColor: color }]} />
      <Text style={styles.breakdownIcon}>{icon}</Text>
      <Text style={styles.breakdownLabel} numberOfLines={1}>{label}</Text>
      <CurrencyBreakdownValue amounts={amounts} activeCurrency={activeCurrency} color={color} textStyle={styles.breakdownValue} />
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.surface,
    },
    headerTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
    content: { padding: 16, gap: 16 },
    rangeLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center' },

    netCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      padding: 20,
      alignItems: 'center',
      gap: 6,
    },
    netLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    netValue: { fontSize: 32, fontWeight: '800' },

    statsRow: { flexDirection: 'row', gap: 8 },
    quickStat: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      gap: 4,
    },
    quickStatIcon: { fontSize: 18 },
    quickStatValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
    quickStatLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '500' },

    emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
    emptyIcon: { fontSize: 42 },
    emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },

    section: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      gap: 12,
    },
    sectionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
    odometerHint: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },

    barTrack: {
      flexDirection: 'row',
      height: 12,
      borderRadius: 6,
      overflow: 'hidden',
      backgroundColor: colors.background,
    },

    breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    breakdownDot: { width: 8, height: 8, borderRadius: 4 },
    breakdownIcon: { fontSize: 14 },
    breakdownLabel: { color: colors.textSecondary, fontSize: 13, flex: 1 },
    breakdownValue: { fontSize: 13, fontWeight: '700' },
  });
}
