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
import { useTranslation } from 'react-i18next';
import { FuelCard } from '@components/FuelCard';
import { StatCard } from '@components/ui/StatCard';
import { PeriodFilter, type Period } from '@components/ui/PeriodFilter';
import { useFuel } from '@hooks/useFuel';
import { useVehicles } from '@hooks/useVehicles';
import { useCurrencyStore } from '@stores/currencyStore';
import { formatLiters } from '@utils/formatters';
import { CurrencyBreakdownValue } from '@components/ui/CurrencyBreakdownValue';
import { AdBanner } from '@components/AdBanner';
import { useTabTitle } from '@hooks/useTabTitle';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';
import type { FuelEntry } from '@/types';

export default function FuelScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  useTabTitle(t('tabs.fuel'));
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [period, setPeriod] = useState<Period>('all');
  const { activeVehicle } = useVehicles();
  const activeCurrency = useCurrencyStore((s) => s.currency);

  const {
    filteredEntries,
    isLoading,
    totalLiters,
    totalCostByCurrency,
    avgPricePerLiterByCurrency,
    periodLiters,
    periodCostByCurrency,
  } = useFuel(activeVehicle?.id, period);

  const renderItem = ({ item }: { item: FuelEntry }) => (
    <FuelCard entry={item} />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdBanner position="top" />
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>{t('fuel.title')}</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => router.push('/fuel/new')}
              >
                <Ionicons name="add" size={22} color={colors.onAccent} />
              </TouchableOpacity>
            </View>

            {/* Genel İstatistikler */}
            <View style={styles.statsRow}>
              <StatCard
                label={t('fuel.totalCost')}
                value={
                  <CurrencyBreakdownValue
                    amounts={totalCostByCurrency}
                    activeCurrency={activeCurrency}
                    color={colors.danger}
                    textStyle={styles.statCardValue}
                  />
                }
                icon="💸"
                accentColor={colors.danger}
              />
              <StatCard
                label={t('fuel.totalLiters')}
                value={formatLiters(totalLiters)}
                icon="⛽"
                accentColor={colors.warning}
              />
            </View>
            <StatCard
              label={t('fuel.avgPrice')}
              value={
                <CurrencyBreakdownValue
                  amounts={avgPricePerLiterByCurrency}
                  activeCurrency={activeCurrency}
                  color={colors.accent}
                  textStyle={styles.statCardValue}
                />
              }
              icon="📊"
              accentColor={colors.accent}
              style={styles.singleStat}
            />

            {/* Dönem Filtresi */}
            <PeriodFilter selected={period} onChange={setPeriod} />

            {/* Dönem Özeti */}
            {period !== 'all' && (
              <View style={styles.periodSummary}>
                <View style={styles.periodItem}>
                  <Text style={styles.periodLabel}>{t('fuel.periodTotal')}</Text>
                  <CurrencyBreakdownValue
                    amounts={periodCostByCurrency}
                    activeCurrency={activeCurrency}
                    color={colors.danger}
                    textStyle={styles.periodValue}
                  />
                </View>
                <View style={styles.periodDivider} />
                <View style={styles.periodItem}>
                  <Text style={styles.periodLabel}>{t('fuel.periodLiters')}</Text>
                  <Text style={[styles.periodValue, { color: colors.warning }]}>
                    {formatLiters(periodLiters)}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>{t('fuel.history')}</Text>
          </>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⛽</Text>
              <Text style={styles.emptyText}>{t('fuel.emptyText')}</Text>
            </View>
          )
        }
      />
      <View style={styles.bottomBannerWrap}>
        <AdBanner position="bottom" />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    list: { padding: 16, paddingBottom: 90 },
    bottomBannerWrap: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
    addBtn: {
      backgroundColor: colors.warning,
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    singleStat: { marginBottom: 12 },
    statCardValue: { fontSize: 22, fontWeight: '700' },
    periodSummary: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    periodItem: { alignItems: 'center', gap: 4, flex: 1 },
    periodLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
    periodValue: { fontSize: 15, fontWeight: '700' },
    periodDivider: { width: 1, height: 32, backgroundColor: colors.border },
    sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 12 },
    separator: { height: 12 },
    empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyIcon: { fontSize: 48 },
    emptyText: { color: colors.textMuted, fontSize: 15 },
  });
}
