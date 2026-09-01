import React, { useState, useMemo } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card } from '@components/ui/Card';
import { ExpenseCard } from '@components/ExpenseCard';
import { StatCard } from '@components/ui/StatCard';
import {
  FinansFilterModal,
  EMPTY_FINANS_FILTERS,
  hasActiveFinansFilters,
  type FinansFilters,
} from '@components/FinansFilterModal';
import { useIncomeRows, useExpenseRows, type IncomeRow, type ExpenseRow } from '@hooks/useFinansRows';
import { useVehicles } from '@hooks/useVehicles';
import { useIncomeStore } from '@stores/incomeStore';
import { useCurrencyStore } from '@stores/currencyStore';
import { sumByCurrency } from '@utils/calculations';
import { formatCurrency, formatDate } from '@utils/formatters';
import { CurrencyBreakdownValue } from '@components/ui/CurrencyBreakdownValue';
import { FinansGoalCard } from '@components/FinansGoalCard';
import { FinansTrendChart } from '@components/FinansTrendChart';
import { AdBanner } from '@components/AdBanner';
import { useTabTitle } from '@hooks/useTabTitle';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';
import type { IncomeEntry, IncomeSource, Trip, FuelEntry, ExpenseCategory } from '@/types';

type Mode = 'income' | 'expense';

const SOURCE_ICONS: Record<IncomeSource, string> = {
  trip: '🚖',
  bonus: '🎁',
  other: '💼',
};

function applyFinansFilters<T extends { kind: string; date: number; amount: number }>(
  rows: T[],
  filters: FinansFilters,
): T[] {
  return rows.filter((r) => {
    if (filters.types.length > 0 && !filters.types.includes(r.kind)) return false;
    if (filters.startDate != null && r.date < filters.startDate) return false;
    // endDate seçili günün TAMAMINI kapsar — bir sonraki günün başına kadar dahil
    if (filters.endDate != null && r.date >= filters.endDate + 86400) return false;
    if (filters.amountMin != null && r.amount < filters.amountMin) return false;
    if (filters.amountMax != null && r.amount > filters.amountMax) return false;
    return true;
  });
}

function SearchBar({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search" size={16} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.searchInput}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function FilterBar({
  active,
  onPress,
  onClear,
}: {
  active: boolean;
  onPress: () => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.filterBar}>
      <TouchableOpacity
        style={[styles.filterBtn, active && styles.filterBtnActive]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <Ionicons name="filter" size={14} color={active ? colors.onAccent : colors.textSecondary} />
        <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>
          {t('finans.filterButton')}
        </Text>
      </TouchableOpacity>
      {active && (
        <TouchableOpacity onPress={onClear} hitSlop={8}>
          <Text style={styles.filterClearText}>{t('finans.filterReset')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function FinansScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  useTabTitle(t('tabs.finans'));
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
          <Ionicons name="add" size={22} color={colors.onAccent} />
        </TouchableOpacity>
      </View>

      <FinansGoalCard />
      <FinansTrendChart />

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
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

function TripIncomeCard({ trip }: { trip: Trip }) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const dateValue = trip.endTime ?? trip.startTime;

  return (
    <TouchableOpacity onPress={() => router.push(`/trip/${trip.id}`)} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.iconWrapper}>
            <Text style={styles.cardIcon}>🚖</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardSource}>{t('finans.tripIncomeLabel')}</Text>
            <Text style={styles.cardDescription} numberOfLines={1}>
              {trip.origin} → {trip.destination}
            </Text>
            <Text style={styles.cardDate}>{formatDate(dateValue, i18n.language)}</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.incomeAmount}>{formatCurrency(trip.earnings ?? 0, trip.currency)}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const INCOME_TYPE_OPTIONS = [
  { value: 'trip', icon: '🚖' },
  { value: 'income', icon: '💰' },
];

function incomeRowSearchText(row: IncomeRow): string {
  return row.kind === 'trip'
    ? `${row.trip.origin} ${row.trip.destination}`
    : row.entry.description ?? '';
}

function expenseRowSearchText(row: ExpenseRow): string {
  return row.kind === 'fuel' ? row.entry.stationName ?? '' : row.entry.description ?? '';
}

function IncomeSection() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [filters, setFilters] = useState<FinansFilters>(EMPTY_FINANS_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const { activeVehicle } = useVehicles();
  const activeCurrency = useCurrencyStore((s) => s.currency);
  const { rows: allRows, isLoading } = useIncomeRows(activeVehicle?.id);
  const filtersActive = hasActiveFinansFilters(filters);

  const totalAmountByCurrency = useMemo(() => sumByCurrency(allRows, (r) => r.amount), [allRows]);

  const filteredRows = useMemo(() => {
    const byFilter = applyFinansFilters(allRows, filters);
    if (!search.trim()) return byFilter;
    const q = search.trim().toLowerCase();
    return byFilter.filter((r) => incomeRowSearchText(r).toLowerCase().includes(q));
  }, [allRows, filters, search]);

  const periodTotalByCurrency = useMemo(
    () => sumByCurrency(filteredRows, (r) => r.amount),
    [filteredRows],
  );

  const typeOptions = useMemo(
    () => INCOME_TYPE_OPTIONS.map((o) => ({ ...o, label: o.value === 'trip' ? t('finans.tripIncomeLabel') : t('finans.extraIncomeLabel') })),
    [t],
  );

  return (
    <>
      <FlatList
        data={filteredRows}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        renderItem={({ item }) =>
          item.kind === 'trip' ? <TripIncomeCard trip={item.trip} /> : <IncomeCard entry={item.entry} />
        }
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
                  color={colors.success}
                  textStyle={styles.statCardValue}
                />
              }
              icon="💵"
              accentColor={colors.success}
              style={styles.totalCard}
            />
            <SearchBar value={search} onChangeText={setSearch} placeholder={t('finans.searchPlaceholder')} />
            <FilterBar
              active={filtersActive}
              onPress={() => setFilterModalVisible(true)}
              onClear={() => setFilters(EMPTY_FINANS_FILTERS)}
            />
            {filtersActive && (
              <View style={styles.periodSummary}>
                <Text style={styles.periodLabel}>{t('finans.periodTotal')}</Text>
                <CurrencyBreakdownValue
                  amounts={periodTotalByCurrency}
                  activeCurrency={activeCurrency}
                  color={colors.success}
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
      <FinansFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        typeOptions={typeOptions}
        filters={filters}
        onApply={setFilters}
      />
    </>
  );
}

// ── Gider ────────────────────────────────────────────────────────────────────

function FuelExpenseCard({ entry }: { entry: FuelEntry }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.iconWrapper}>
          <Text style={styles.cardIcon}>⛽</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardSource}>{t('finans.fuelLabel')}</Text>
          {entry.stationName ? (
            <Text style={styles.cardDescription} numberOfLines={1}>
              {entry.stationName}
            </Text>
          ) : null}
          <Text style={styles.cardDate}>{formatDate(entry.date, i18n.language)}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.expenseAmount}>{formatCurrency(entry.totalCost, entry.currency)}</Text>
        </View>
      </View>
    </Card>
  );
}

const EXPENSE_TYPE_OPTIONS = [
  { value: 'fuel', icon: '⛽' },
  { value: 'expense', icon: '💸' },
];

function ExpenseSection() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [filters, setFilters] = useState<FinansFilters>(EMPTY_FINANS_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const { activeVehicle } = useVehicles();
  const activeCurrency = useCurrencyStore((s) => s.currency);
  const filtersActive = hasActiveFinansFilters(filters);

  const [search, setSearch] = useState('');
  const { rows: allRows, isLoading } = useExpenseRows(activeVehicle?.id);

  const totalAmountByCurrency = useMemo(() => sumByCurrency(allRows, (r) => r.amount), [allRows]);

  const filteredRows = useMemo(() => {
    const byFilter = applyFinansFilters(allRows, filters);
    if (!search.trim()) return byFilter;
    const q = search.trim().toLowerCase();
    return byFilter.filter((r) => expenseRowSearchText(r).toLowerCase().includes(q));
  }, [allRows, filters, search]);

  const periodTotalByCurrency = useMemo(
    () => sumByCurrency(filteredRows, (r) => r.amount),
    [filteredRows],
  );

  // Kategori kırılımı sadece gerçek "gider" kayıtlarına ait (yakıtın kendi
  // kategorisi yok — miktar/litre yapısı farklı) ve seçili filtrelere göre hesaplanır.
  const displayByCategory = useMemo(() => {
    const initial: Record<ExpenseCategory, number> = {
      bridge: 0,
      parking: 0,
      maintenance: 0,
      fine: 0,
      tire: 0,
      wash: 0,
      other: 0,
    };
    return filteredRows
      .filter((r): r is Extract<ExpenseRow, { kind: 'expense' }> => r.kind === 'expense' && r.currency === activeCurrency)
      .reduce((acc, r) => {
        acc[r.entry.category] = (acc[r.entry.category] ?? 0) + r.amount;
        return acc;
      }, initial);
  }, [filteredRows, activeCurrency]);

  const topCategory = Object.entries(displayByCategory).sort(
    ([, a], [, b]) => b - a,
  )[0];

  const categoryEntries = Object.entries(displayByCategory).filter(
    ([, v]) => v > 0,
  ) as [ExpenseCategory, number][];

  const typeOptions = useMemo(
    () => EXPENSE_TYPE_OPTIONS.map((o) => ({ ...o, label: o.value === 'fuel' ? t('finans.fuelLabel') : t('finans.expense') })),
    [t],
  );

  return (
    <>
      <FlatList
        data={filteredRows}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        renderItem={({ item }) =>
          item.kind === 'fuel' ? <FuelExpenseCard entry={item.entry} /> : <ExpenseCard expense={item.entry} />
        }
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
                    color={colors.danger}
                    textStyle={styles.statCardValue}
                  />
                }
                icon="💸"
                accentColor={colors.danger}
              />
              {topCategory && topCategory[1] > 0 ? (
                <StatCard
                  label={t('finans.topCategory')}
                  value={formatCurrency(topCategory[1], activeCurrency)}
                  subValue={t(`expenseCategories.${topCategory[0]}`)}
                  icon="📊"
                  accentColor={colors.warning}
                />
              ) : null}
            </View>

            <SearchBar value={search} onChangeText={setSearch} placeholder={t('finans.searchPlaceholder')} />

            <FilterBar
              active={filtersActive}
              onPress={() => setFilterModalVisible(true)}
              onClear={() => setFilters(EMPTY_FINANS_FILTERS)}
            />

            {filtersActive && (
              <View style={styles.periodSummary}>
                <Text style={styles.periodLabel}>{t('finans.periodTotal')}</Text>
                <CurrencyBreakdownValue
                  amounts={periodTotalByCurrency}
                  activeCurrency={activeCurrency}
                  color={colors.danger}
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
      <FinansFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        typeOptions={typeOptions}
        filters={filters}
        onApply={setFilters}
      />
    </>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
    addBtn: {
      backgroundColor: colors.success,
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBtnExpense: { backgroundColor: colors.danger },

    modeToggle: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
    },
    modeTab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
    modeTabActive: { backgroundColor: colors.success },
    modeTabActiveExpense: { backgroundColor: colors.danger },
    modeTabText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
    modeTabTextActive: { color: colors.onAccent },

    list: { padding: 16, paddingBottom: 90 },
    bottomBannerWrap: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    statCardValue: { fontSize: 22, fontWeight: '700' },
    totalCard: { marginBottom: 12 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    periodSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      marginBottom: 12,
      height: 42,
    },
    searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14, height: '100%' },
    filterBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    filterBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    filterBtnText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    filterBtnTextActive: { color: colors.onAccent },
    filterClearText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
    periodLabel: { color: colors.textMuted, fontSize: 13 },
    incomePeriodValue: { color: colors.success, fontWeight: '700', fontSize: 16 },
    expensePeriodValue: { color: colors.danger, fontWeight: '700', fontSize: 16 },
    categoryToggle: { paddingVertical: 8, marginBottom: 4 },
    categoryToggleText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
    categoryList: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      gap: 10,
      marginBottom: 12,
    },
    categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    categoryName: { color: colors.textPrimary, fontSize: 13 },
    categoryAmount: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
    sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 12 },
    separator: { height: 12 },
    empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyIcon: { fontSize: 48 },
    emptyText: { color: colors.textMuted, fontSize: 15 },

    // IncomeCard
    card: {},
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardIcon: { fontSize: 20 },
    cardInfo: { flex: 1, gap: 2 },
    cardSource: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
    cardDescription: { color: colors.textSecondary, fontSize: 12 },
    cardDate: { color: colors.textMuted, fontSize: 11 },
    cardRight: { alignItems: 'flex-end', gap: 6 },
    incomeAmount: { color: colors.success, fontWeight: '700', fontSize: 16 },
    expenseAmount: { color: colors.danger, fontWeight: '700', fontSize: 16 },
    deleteBtn: { padding: 2 },
  });
}
