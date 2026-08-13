import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TripCard } from '@components/TripCard';
import { useTrips } from '@hooks/useTrips';
import { useFuel } from '@hooks/useFuel';
import { useExpenses } from '@hooks/useExpenses';
import { useIncome } from '@hooks/useIncome';
import { useVehicles } from '@hooks/useVehicles';
import { useCurrencyStore } from '@stores/currencyStore';
import { useDayTrackingStore } from '@stores/dayTrackingStore';
import { formatKm, formatTime } from '@utils/formatters';
import { AdBanner } from '@components/AdBanner';
import { CurrencyBreakdownValue } from '@components/ui/CurrencyBreakdownValue';
import { showRewardedAd } from '@utils/ads';
import { useTabTitle } from '@hooks/useTabTitle';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

type Period = 'today' | 'week' | 'month' | 'all';

export default function DashboardScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  useTabTitle(t('tabs.home'));
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [period, setPeriod] = useState<Period>('today');
  const [endDayLoading, setEndDayLoading] = useState(false);
  const { vehicles, activeVehicle } = useVehicles();
  const vehicleId = activeVehicle?.id;
  const { dayStartedAt, startDay, endDay } = useDayTrackingStore();

  const handleStartDay = async () => {
    await startDay();
  };

  const handleEndDay = async () => {
    if (dayStartedAt === null) return;
    setEndDayLoading(true);
    const rangeStart = dayStartedAt;
    const rangeEnd = Math.floor(Date.now() / 1000);
    // Gün özeti, ödüllü reklam karşılığında açılan bir içerik — reklam ağı
    // NO_FILL/hata dönse bile showRewardedAd her zaman devam etmeye izin verir.
    await showRewardedAd();
    await endDay();
    setEndDayLoading(false);
    router.push({ pathname: '/day-summary', params: { start: String(rangeStart), end: String(rangeEnd) } });
  };

  const PERIODS: { id: Period; label: string }[] = [
    { id: 'today', label: t('periods.today') },
    { id: 'week', label: t('periods.week') },
    { id: 'month', label: t('periods.month') },
    { id: 'all', label: t('periods.all') },
  ];

  const activeCurrency = useCurrencyStore((s) => s.currency);

  const {
    filteredTrips,
    activeTrip,
    periodEarnings,
    periodEarningsByCurrency,
    periodKm,
    periodCount,
  } = useTrips(vehicleId, period);

  // Aktif sefer varsa (uygulama yeni açıldığında ya da bir sefer başlatıldığında)
  // otomatik olarak sefer ekranına geç — ama kullanıcı manuel olarak Dashboard'a
  // dönerse tekrar zorla yönlendirme yapma.
  const prevActiveTripIdRef = useRef<number | null>(null);
  useEffect(() => {
    const currentId = activeTrip?.id ?? null;
    if (currentId !== null && prevActiveTripIdRef.current === null) {
      router.push('/quick-entry');
    }
    prevActiveTripIdRef.current = currentId;
  }, [activeTrip, router]);

  const { periodCost: fuelCost, periodCostByCurrency: fuelCostByCurrency } = useFuel(vehicleId, period);
  const { periodTotal: expenseCost, periodTotalByCurrency: expenseCostByCurrency } = useExpenses(vehicleId, period);
  const { periodTotal: incomeTotal, periodTotalByCurrency: incomeTotalByCurrency } = useIncome(vehicleId, period);

  const netEarnings = periodEarnings + incomeTotal - fuelCost - expenseCost;
  const netByCurrency = useMemo(() => {
    const currencies = new Set([
      ...Object.keys(periodEarningsByCurrency),
      ...Object.keys(incomeTotalByCurrency),
      ...Object.keys(fuelCostByCurrency),
      ...Object.keys(expenseCostByCurrency),
    ]);
    const result: Record<string, number> = {};
    for (const c of currencies) {
      result[c] =
        (periodEarningsByCurrency[c] ?? 0) +
        (incomeTotalByCurrency[c] ?? 0) -
        (fuelCostByCurrency[c] ?? 0) -
        (expenseCostByCurrency[c] ?? 0);
    }
    return result;
  }, [periodEarningsByCurrency, incomeTotalByCurrency, fuelCostByCurrency, expenseCostByCurrency]);

  const recentTrips = filteredTrips;

  // ── Araç yoksa CTA ────────────────────────────────────────────────────────
  if (vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚗</Text>
          <Text style={styles.emptyTitle}>{t('dashboard.noVehicleTitle')}</Text>
          <Text style={styles.emptyText}>
            {t('dashboard.noVehicleText')}
          </Text>
          <TouchableOpacity
            style={styles.addVehicleBtn}
            onPress={() => router.push('/vehicle/new')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={18} color={colors.onAccent} />
            <Text style={styles.addVehicleBtnText}>{t('dashboard.addVehicleButton')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>
        <AdBanner position="top" />
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.appNameRow}>
            <Image source={require('../../assets/icon.png')} style={styles.appLogo} />
            <View>
              <Text style={styles.appName}>SeyirLog</Text>
              {activeVehicle && (
                <Text style={styles.vehicleName} numberOfLines={1}>
                  {activeVehicle.brand} {activeVehicle.model}
                  {activeVehicle.plate ? ` · ${activeVehicle.plate}` : ''}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            hitSlop={8}
          >
            <View style={styles.profileBtn}>
              <Ionicons name="settings-outline" size={18} color={colors.textMuted} />
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
          {/* ── Günü Başlat / Bitir ── */}
          {dayStartedAt === null ? (
            <TouchableOpacity
              style={styles.daySummaryBtn}
              onPress={handleStartDay}
              activeOpacity={0.85}
            >
              <Text style={styles.daySummaryBtnText}>{t('dashboard.startDayButton')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.dayActiveCard}>
              <View style={styles.dayActiveLeft}>
                <View style={styles.activeDot} />
                <View>
                  <Text style={styles.activeTripLabel}>{t('dashboard.dayActiveLabel')}</Text>
                  <Text style={styles.dayActiveSince}>
                    {t('dashboard.dayStartedAt', { time: formatTime(dayStartedAt, i18n.language) })}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.endDayBtn, endDayLoading && { opacity: 0.7 }]}
                onPress={handleEndDay}
                disabled={endDayLoading}
                activeOpacity={0.85}
              >
                {endDayLoading
                  ? <ActivityIndicator color={colors.onAccent} size="small" />
                  : <Text style={styles.endTripBtnText}>{t('dashboard.endDayButton')}</Text>
                }
              </TouchableOpacity>
            </View>
          )}

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
                  <Text style={styles.activeTripLabel}>{t('dashboard.activeTripLabel')}</Text>
                  <Text style={styles.activeTripRoute} numberOfLines={1}>
                    {activeTrip.origin} → {activeTrip.destination}
                  </Text>
                </View>
              </View>
              <View style={styles.endTripBtn}>
                <Text style={styles.endTripBtnText}>{t('dashboard.endTripButton')}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* ── Stats Grid ── */}
          <View style={styles.statsGrid}>
            <StatTile icon="🚖" label={t('dashboard.statTrip')} value={String(periodCount)} color={colors.accentTertiary} />
            <StatTile icon="🛣️" label={t('dashboard.statKm')} value={formatKm(periodKm)} color={colors.warning} />
            <StatTile
              icon="📈"
              label={t('dashboard.statEarnings')}
              value={
                <CurrencyBreakdownValue
                  amounts={periodEarningsByCurrency}
                  activeCurrency={activeCurrency}
                  color={colors.success}
                  textStyle={styles.statTileValue}
                />
              }
              color={colors.success}
            />
            <StatTile
              icon="💰"
              label={t('dashboard.statNet')}
              value={
                <CurrencyBreakdownValue
                  amounts={netByCurrency}
                  activeCurrency={activeCurrency}
                  colorFor={(amount) => (amount >= 0 ? colors.success : colors.danger)}
                  textStyle={styles.statTileValue}
                />
              }
              color={netEarnings >= 0 ? colors.success : colors.danger}
            />
          </View>

          {/* ── Alt Stats ── */}
          {(fuelCost > 0 || expenseCost > 0) && (
            <View style={styles.subStats}>
              {fuelCost > 0 && (
                <View style={styles.subStat}>
                  <Text style={styles.subStatIcon}>⛽</Text>
                  <Text style={styles.subStatLabel}>{t('dashboard.fuelLabel')}</Text>
                  <CurrencyBreakdownValue
                    amounts={fuelCostByCurrency}
                    activeCurrency={activeCurrency}
                    textStyle={styles.subStatValue}
                  />
                </View>
              )}
              {expenseCost > 0 && (
                <View style={styles.subStat}>
                  <Text style={styles.subStatIcon}>💸</Text>
                  <Text style={styles.subStatLabel}>{t('dashboard.expenseLabel')}</Text>
                  <CurrencyBreakdownValue
                    amounts={expenseCostByCurrency}
                    activeCurrency={activeCurrency}
                    textStyle={styles.subStatValue}
                  />
                </View>
              )}
            </View>
          )}

          {/* ── Son Seferler ── */}
          {recentTrips.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('dashboard.recentTrips')}</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/trips')}>
                  <Text style={styles.seeAll}>{t('dashboard.seeAll')}</Text>
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
                {period === 'today' ? t('dashboard.noTripsToday') : t('dashboard.noTripsPeriod')}
              </Text>
            </View>
          )}

          {/* FAB için boşluk */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Alt Banner ── */}
        <View style={styles.bottomBannerWrap}>
          <AdBanner position="bottom" />
        </View>

        {/* ── FAB ── */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/quick-entry')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={30} color={colors.onAccent} />
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
  value: React.ReactNode;
  color: string;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={[styles.statTile, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={styles.statTileIcon}>{icon}</Text>
      {typeof value === 'string' ? <Text style={styles.statTileValue}>{value}</Text> : value}
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    root: { flex: 1 },

    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 16,
    },
    emptyIcon: { fontSize: 64 },
    emptyTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
    emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
    addVehicleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 14,
      marginTop: 8,
    },
    addVehicleBtnText: { color: colors.onAccent, fontWeight: '700', fontSize: 15 },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    appNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    appLogo: { width: 36, height: 36, borderRadius: 10 },
    appName: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
    vehicleName: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
    profileBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },

    periodBar: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    periodChip: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    periodChipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
    periodChipTextActive: { color: colors.onAccent },

    scroll: { flex: 1 },
    content: { paddingHorizontal: 16, gap: 12, paddingBottom: 16 },

    daySummaryBtn: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    daySummaryBtnText: { color: colors.onAccent, fontWeight: '700', fontSize: 15 },

    dayActiveCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.accent + '15',
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.accent + '40',
    },
    dayActiveLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    dayActiveSince: { color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginTop: 1 },
    endDayBtn: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
      minWidth: 64,
      alignItems: 'center',
    },

    activeTripCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.success + '15',
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.success + '40',
    },
    activeTripLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
    activeTripLabel: { color: colors.success, fontSize: 11, fontWeight: '600' },
    activeTripRoute: { color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginTop: 1 },
    endTripBtn: {
      backgroundColor: colors.success,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    endTripBtnText: { color: colors.onAccent, fontWeight: '700', fontSize: 12 },

    statsGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    statTile: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      gap: 4,
    },
    statTileIcon: { fontSize: 20 },
    statTileValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '800', textAlign: 'center' },
    statTileLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '500' },

    subStats: {
      flexDirection: 'row',
      gap: 8,
    },
    subStat: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 6,
    },
    subStatIcon: { fontSize: 14 },
    subStatLabel: { color: colors.textMuted, fontSize: 12, flex: 1 },
    subStatValue: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
    seeAll: { color: colors.accent, fontSize: 13 },

    noTrips: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    noTripsIcon: { fontSize: 40 },
    noTripsText: { color: colors.textMuted, fontSize: 14 },

    bottomBannerWrap: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    fab: {
      position: 'absolute',
      bottom: 100,
      right: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 20,
    },
  });
}
