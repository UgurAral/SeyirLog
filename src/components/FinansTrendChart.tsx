import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useIncomeRows, useExpenseRows } from '@hooks/useFinansRows';
import { useVehicles } from '@hooks/useVehicles';
import { useCurrencyStore } from '@stores/currencyStore';
import { istanbulMidnightToTimestamp } from '@utils/dateHelpers';
import { toIntlLocale, formatCurrency } from '@utils/formatters';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

const MONTHS_SHOWN = 6;

/**
 * Son 6 aylık gelir/gider trendini basit bir çubuk grafikle gösterir.
 * Sadece aktif para birimindeki kayıtları sayar (dövizler karışık gösterilmez).
 * Harici bir grafik/SVG kütüphanesi eklememek için çubuklar düz View'lerle çizilir.
 */
export function FinansTrendChart() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [expanded, setExpanded] = useState(false);
  const { activeVehicle } = useVehicles();
  const activeCurrency = useCurrencyStore((s) => s.currency);
  const { rows: incomeRows } = useIncomeRows(activeVehicle?.id);
  const { rows: expenseRows } = useExpenseRows(activeVehicle?.id);

  const buckets = useMemo(() => {
    const now = new Date();
    const months: { label: string; start: number; end: number }[] = [];
    for (let i = MONTHS_SHOWN - 1; i >= 0; i--) {
      const y = now.getFullYear();
      const m = now.getMonth() - i;
      const start = istanbulMidnightToTimestamp(y, m, 1);
      const end = istanbulMidnightToTimestamp(y, m + 1, 1);
      const label = new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
        month: 'short',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(y, m, 1)));
      months.push({ label, start, end });
    }
    return months.map((mo) => {
      const income = incomeRows
        .filter((r) => r.currency === activeCurrency && r.date >= mo.start && r.date < mo.end)
        .reduce((s, r) => s + r.amount, 0);
      const expense = expenseRows
        .filter((r) => r.currency === activeCurrency && r.date >= mo.start && r.date < mo.end)
        .reduce((s, r) => s + r.amount, 0);
      return { ...mo, income, expense };
    });
  }, [incomeRows, expenseRows, activeCurrency, i18n.language]);

  const maxValue = Math.max(1, ...buckets.flatMap((b) => [b.income, b.expense]));
  const hasAnyData = buckets.some((b) => b.income > 0 || b.expense > 0);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.toggle} onPress={() => setExpanded((v) => !v)} activeOpacity={0.8}>
        <Text style={styles.toggleText}>
          {expanded ? '▲' : '▼'} {t('finans.trendTitle')}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.chartCard}>
          {!hasAnyData ? (
            <Text style={styles.emptyText}>{t('finans.trendEmpty')}</Text>
          ) : (
            <>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.legendText}>{t('finans.income')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                  <Text style={styles.legendText}>{t('finans.expense')}</Text>
                </View>
              </View>
              <View style={styles.barsRow}>
                {buckets.map((b, i) => (
                  <View key={i} style={styles.barGroup}>
                    <View style={styles.barPair}>
                      <View
                        style={[styles.bar, { height: `${(b.income / maxValue) * 100}%`, backgroundColor: colors.success }]}
                      />
                      <View
                        style={[styles.bar, { height: `${(b.expense / maxValue) * 100}%`, backgroundColor: colors.danger }]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{b.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.netRow}>
                <Text style={styles.netLabel}>{t('finans.trendNetLabel')}</Text>
                <Text
                  style={[
                    styles.netValue,
                    {
                      color:
                        buckets.reduce((s, b) => s + b.income - b.expense, 0) >= 0 ? colors.success : colors.danger,
                    },
                  ]}
                >
                  {formatCurrency(
                    buckets.reduce((s, b) => s + b.income - b.expense, 0),
                    activeCurrency,
                  )}
                </Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: { paddingHorizontal: 16, marginTop: 4 },
    toggle: { paddingVertical: 8 },
    toggleText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      gap: 12,
    },
    emptyText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
    legendRow: { flexDirection: 'row', gap: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    barsRow: {
      flexDirection: 'row',
      height: 130,
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    barGroup: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
    barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: '85%' },
    bar: { width: 9, borderRadius: 3, minHeight: 2 },
    barLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '600', marginTop: 6, textTransform: 'capitalize' },
    netRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    netLabel: { color: colors.textMuted, fontSize: 12 },
    netValue: { fontSize: 14, fontWeight: '800' },
  });
}
