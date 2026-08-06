import React, { useState, useMemo } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card } from '@components/ui/Card';
import { ExpenseCard } from '@components/ExpenseCard';
import { StatCard } from '@components/ui/StatCard';
import { PeriodFilter, type Period } from '@components/ui/PeriodFilter';
import { useIncome } from '@hooks/useIncome';
import { useExpenses } from '@hooks/useExpenses';
import { useVehicles } from '@hooks/useVehicles';
import { useIncomeStore } from '@stores/incomeStore';
import { useCurrencyStore } from '@stores/currencyStore';
import { isInPeriod } from '@utils/dateHelpers';
import { sumByCurrency } from '@utils/calculations';
import { formatCurrency, formatDate } from '@utils/formatters';
import { CurrencyBreakdownValue } from '@components/ui/CurrencyBreakdownValue';
import { AdBanner } from '@components/AdBanner';
import type { IncomeEntry, IncomeSource, Expense, ExpenseCategory } from '@/types';

type Mode = 'income' | 'expense';

const SOURCE_ICONS: Record<IncomeSource, string> = {
  trip: '🚖',
  bonus: '🎁',
  other: '💼',
};

export default function FinansScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('income');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdBanner position="top" />
      <View style={styles.header}>
        <Text style={styles.title}>{t('finans.title')}</Text>
        <TouchableOpacity
          style={[styles.addBtn, mode === 'expense' && styles.addBtnExpense]}
          onPress={() => router.push(mode === 'income' ? '/income/new' : '/expense/new')}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'income' && styles.modeTabActive]}
          onPress={() => setMode('income')}
          activeOpacity={0.75}
        >
          <Text style={[styles.modeTabText, mode === 'income' && styles.modeTabTextActive]}>
            {t('finans.income')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'expense' && styles.modeTabActiveExpense]}
          onPress={() => setMode('expense')}
          activeOpacity={0.75}
        >
          <Text style={[styles.modeTabText, mode === 'expense' && styles.modeTabTextActive]}>
            {t('finans.expense')}
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'income' ? <IncomeSection /> : <ExpenseSection />}
      <View style={styles.bottomBannerWrap}>
        <AdBanner position="bottom" />
      </View>
    </SafeAreaView>
  );
}

// ── Gelir ────────────────────────────────────────────────────────────────────

function IncomeCard({ entry }: { entry: IncomeEntry }) {
  const { t, i18n } = useTranslation();
  const { deleteEntry } = useIncomeStore();
  const source: IncomeSource = (entry.source as IncomeSource) ?? 'other';
  const sourceLabel = t(`incomeSources.${source}`);

  const handleDelete = () => {
    Alert.alert(
      t('finans.deleteConfirmTitle'),
      `${sourceLabel} ${t('finans.deleteIncomeConfirmBody', { amount: formatCurrency(entry.amount, entry.currency) })}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => deleteEntry(entry.id) },
      ],
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.iconWrapper}>
          <Text style={styles.cardIcon}>{SOURCE_ICONS[source] ?? '💵'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardSource}>{sourceLabel}</Text>
          {entry.description ? (
            <Text style={styles.cardDescription} numberOfLines={1}>
              {entry.description}
            </Text>
          ) : null}
          <Text style={styles.cardDate}>{formatDate(entry.date, i18n.language)}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.incomeAmount}>{formatCurrency(entry.amount, entry.currency)}</Text>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={15} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

function IncomeSection() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('all');
  const { activeVehicle } = useVehicles();
  const activeCurrency = useCurrencyStore((s) => s.currency);
  const { entries, isLoading } = useIncome(activeVehicle?.id);

  const totalAmountByCurrency = useMemo(() => sumByCurrency(entries, (e) => e.amount), [entries]);

  const filteredEntries = useMemo(() => {
    if (period === 'all') return entries;
    return entries.filter((e) => isInPeriod(e.date, period));
  }, [entries, period]);

  const periodTotalByCurrency = useMemo(
    () => sumByCurrency(filteredEntries, (e) => e.amount),
    [filteredEntries],
  );

  return (
    <FlatList
      data={filteredEntries}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <IncomeCard entry={item} />}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={
        <>
          <StatCard
            label={t('finans.totalIncome')}
            value={
              <CurrencyBreakdownValue
                amounts={totalAmountByCurrency}
                activeCurrency={activeCurrency}
                color="#22C55E"
                textStyle={styles.statCardValue}
              />
            }
            icon="💵"
            accentColor="#22C55E"
            style={styles.totalCard}
          />
          <PeriodFilter selected={period} onChange={setPeriod} />
          {period !== 'all' && (
            <View style={styles.periodSummary}>
              <Text style={styles.periodLabel}>{t('finans.periodTotal')}</Text>
              <CurrencyBreakdownValue
                amounts={periodTotalByCurrency}
                activeCurrency={activeCurrency}
                color="#22C55E"
                textStyle={styles.incomePeriodValue}
              />
            </View>
          )}
          <Text style={styles.sectionTitle}>{t('finans.incomeList')}</Text>
        </>
      }
      ListEmptyComponent={
        isLoading ? null : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💵</Text>
            <Text style={styles.emptyText}>{t('finans.emptyIncome')}</Text>
          </View>
        )
      }
    />
  );
}

// ── Gider ────────────────────────────────────────────────────────────────────

function ExpenseSection() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('all');
  const [showCategories, setShowCategories] = useState(false);
  const { activeVehicle } = useVehicles();
  const activeCurrency = useCurrencyStore((s) => s.currency);

  const {
    filteredExpenses,
    isLoading,
    totalAmountByCurrency,
    byCategory,
    periodTotalByCurrency,
    periodByCategory,
  } = useExpenses(activeVehicle?.id, period);

  const displayByCategory = period === 'all' ? byCategory : periodByCategory;

  const topCategory = Object.entries(displayByCategory).sort(
    ([, a], [, b]) => b - a,
  )[0];

  const categoryEntries = Object.entries(displayByCategory).filter(
    ([, v]) => v > 0,
  ) as [ExpenseCategory, number][];

  return (
    <FlatList
      data={filteredExpenses}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }: { item: Expense }) => <ExpenseCard expense={item} />}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={
        <>
          <View style={styles.statsRow}>
            <StatCard
              label={t('finans.totalExpense')}
              value={
                <CurrencyBreakdownValue
                  amounts={totalAmountByCurrency}
                  activeCurrency={activeCurrency}
                  color="#EF4444"
                  textStyle={styles.statCardValue}
                />
              }
              icon="💸"
              accentColor="#EF4444"
            />
            {topCategory && topCategory[1] > 0 ? (
              <StatCard
                label={t('finans.topCategory')}
                value={formatCurrency(topCategory[1], activeCurrency)}
                subValue={t(`expenseCategories.${topCategory[0]}`)}
                icon="📊"
                accentColor="#F59E0B"
              />
            ) : null}
          </View>

          <PeriodFilter selected={period} onChange={setPeriod} />

          {period !== 'all' && (
            <View style={styles.periodSummary}>
              <Text style={styles.periodLabel}>{t('finans.periodTotal')}</Text>
              <CurrencyBreakdownValue
                amounts={periodTotalByCurrency}
                activeCurrency={activeCurrency}
                color="#EF4444"
                textStyle={styles.expensePeriodValue}
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.categoryToggle}
            onPress={() => setShowCategories((v) => !v)}
            activeOpacity={0.8}
          >
            <Text style={styles.categoryToggleText}>
              {showCategories ? '▲' : '▼'} {t('finans.byCategory')}
            </Text>
          </TouchableOpacity>

          {showCategories && categoryEntries.length > 0 && (
            <View style={styles.categoryList}>
              {categoryEntries.map(([cat, amount]) => (
                <View key={cat} style={styles.categoryRow}>
                  <Text style={styles.categoryName}>{t(`expenseCategories.${cat}`)}</Text>
                  <Text style={styles.categoryAmount}>{formatCurrency(amount, activeCurrency)}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>{t('finans.expenseList')}</Text>
        </>
      }
      ListEmptyComponent={
        isLoading ? null : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💼</Text>
            <Text style={styles.emptyText}>{t('finans.emptyExpense')}</Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: { color: '#F1F5F9', fontSize: 26, fontWeight: '800' },
  addBtn: {
    backgroundColor: '#22C55E',
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnExpense: { backgroundColor: '#EF4444' },

  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  modeTab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  modeTabActive: { backgroundColor: '#22C55E' },
  modeTabActiveExpense: { backgroundColor: '#EF4444' },
  modeTabText: { color: '#64748B', fontSize: 13, fontWeight: '700' },
  modeTabTextActive: { color: '#FFFFFF' },

  list: { padding: 16, paddingBottom: 90 },
  bottomBannerWrap: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  statCardValue: { fontSize: 22, fontWeight: '700' },
  totalCard: { marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  periodSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  periodLabel: { color: '#64748B', fontSize: 13 },
  incomePeriodValue: { color: '#22C55E', fontWeight: '700', fontSize: 16 },
  expensePeriodValue: { color: '#EF4444', fontWeight: '700', fontSize: 16 },
  categoryToggle: { paddingVertical: 8, marginBottom: 4 },
  categoryToggleText: { color: '#3B82F6', fontSize: 13, fontWeight: '600' },
  categoryList: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 12,
  },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryName: { color: '#CBD5E1', fontSize: 13 },
  categoryAmount: { color: '#F1F5F9', fontWeight: '600', fontSize: 13 },
  sectionTitle: { color: '#F1F5F9', fontSize: 17, fontWeight: '700', marginBottom: 12 },
  separator: { height: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#64748B', fontSize: 15 },

  // IncomeCard
  card: {},
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: { fontSize: 20 },
  cardInfo: { flex: 1, gap: 2 },
  cardSource: { color: '#F1F5F9', fontWeight: '600', fontSize: 14 },
  cardDescription: { color: '#94A3B8', fontSize: 12 },
  cardDate: { color: '#64748B', fontSize: 11 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  incomeAmount: { color: '#22C55E', fontWeight: '700', fontSize: 16 },
  deleteBtn: { padding: 2 },
});
