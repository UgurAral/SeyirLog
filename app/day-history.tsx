import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTrips } from '@hooks/useTrips';
import { useFuel } from '@hooks/useFuel';
import { useExpenses } from '@hooks/useExpenses';
import { useIncome } from '@hooks/useIncome';
import { useVehicles } from '@hooks/useVehicles';
import { useDayTrackingStore } from '@stores/dayTrackingStore';
import { useCurrencyStore } from '@stores/currencyStore';
import { sumByCurrency } from '@utils/calculations';
import { formatDate, formatTime, formatDuration, formatCurrency } from '@utils/formatters';
import { AdBanner } from '@components/AdBanner';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';
import type { DaySession } from '@/types';

interface SessionRowData {
  session: DaySession;
  net: number;
  vehicleName: string | null;
}

export default function DayHistoryScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const activeCurrency = useCurrencyStore((s) => s.currency);
  const listSessions = useDayTrackingStore((s) => s.listSessions);
  const { vehicles } = useVehicles();

  const [sessions, setSessions] = useState<DaySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listSessions().then((rows) => {
      if (!cancelled) {
        setSessions(rows);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [listSessions]);

  const { trips } = useTrips(undefined, 'all');
  const { fuelEntries } = useFuel(undefined, 'all');
  const { expenses } = useExpenses(undefined, 'all');
  const { entries: incomeEntries } = useIncome(undefined, 'all');

  const rows: SessionRowData[] = useMemo(() => {
    return sessions.map((session) => {
      const rangeStart = session.startTime;
      const rangeEnd = session.endTime ?? rangeStart;
      const inRange = (ts: number) => ts >= rangeStart && ts < rangeEnd;
      const sameVehicle = <T extends { vehicleId: number | null }>(row: T) =>
        session.vehicleId == null || row.vehicleId === session.vehicleId;

      const sessionTrips = trips.filter(
        (tr) => sameVehicle(tr) && tr.status === 'completed' && inRange(tr.startTime),
      );
      const sessionFuel = fuelEntries.filter((f) => sameVehicle(f) && inRange(f.date));
      const sessionExpenses = expenses.filter((e) => sameVehicle(e) && inRange(e.date));
      const sessionIncome = incomeEntries.filter((e) => sameVehicle(e) && inRange(e.date));

      const earnings = sumByCurrency(sessionTrips, (tr) => tr.earnings ?? 0)[activeCurrency] ?? 0;
      const income = sumByCurrency(sessionIncome, (e) => e.amount)[activeCurrency] ?? 0;
      const fuelCost = sumByCurrency(sessionFuel, (f) => f.totalCost)[activeCurrency] ?? 0;
      const expenseCost = sumByCurrency(sessionExpenses, (e) => e.amount)[activeCurrency] ?? 0;
      const net = earnings + income - fuelCost - expenseCost;

      const vehicle = vehicles.find((v) => v.id === session.vehicleId);
      const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}` : null;

      return { session, net, vehicleName };
    });
  }, [sessions, trips, fuelEntries, expenses, incomeEntries, vehicles, activeCurrency]);

  const showVehicleName = vehicles.length > 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('dayHistory.pageTitle')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <AdBanner position="top" />

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🗂️</Text>
          <Text style={styles.emptyText}>{t('dayHistory.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.session.id)}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.75}
              onPress={() =>
                router.push({ pathname: '/day-summary', params: { session: String(item.session.id) } })
              }
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowDate}>{formatDate(item.session.startTime, i18n.language)}</Text>
                <Text style={styles.rowTime}>
                  {formatTime(item.session.startTime, i18n.language)} → {formatTime(item.session.endTime!, i18n.language)}
                  {'  ·  '}
                  {formatDuration(Math.max(0, Math.round((item.session.endTime! - item.session.startTime) / 60)), i18n.language)}
                </Text>
                {showVehicleName && item.vehicleName && (
                  <Text style={styles.rowVehicle}>{item.vehicleName}</Text>
                )}
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowNet, { color: item.net >= 0 ? colors.success : colors.danger }]}>
                  {formatCurrency(item.net, activeCurrency)}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
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
    content: { padding: 16, gap: 10 },

    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
    emptyIcon: { fontSize: 42 },
    emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      gap: 10,
    },
    rowLeft: { flex: 1, gap: 2 },
    rowDate: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
    rowTime: { color: colors.textSecondary, fontSize: 13 },
    rowVehicle: { color: colors.textMuted, fontSize: 12 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rowNet: { fontSize: 15, fontWeight: '800' },
  });
}
