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
import { ExpenseCard } from '@components/ExpenseCard';
import { StatCard } from '@components/ui/StatCard';
import { PeriodFilter, type Period } from '@components/ui/PeriodFilter';
import { useExpenses } from '@hooks/useExpenses';
import { useVehicles } from '@hooks/useVehicles';
import { formatCurrency } from '@utils/formatters';
import type { Expense, ExpenseCategory } from '@/types';

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  bridge: 'Köprü/Otoyol',
  parking: 'Otopark',
  maintenance: 'Bakım/Tamir',
  fine: 'Ceza',
  tire: 'Lastik',
  wash: 'Yıkama',
  other: 'Diğer',
};

export default function ExpensesScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('all');
  const [showCategories, setShowCategories] = useState(false);
  const { activeVehicle } = useVehicles();

  const {
    filteredExpenses,
    isLoading,
    totalAmount,
    byCategory,
    periodTotal,
    periodByCategory,
  } = useExpenses(activeVehicle?.id, period);

  const displayByCategory = period === 'all' ? byCategory : periodByCategory;

  const topCategory = Object.entries(displayByCategory).sort(
    ([, a], [, b]) => b - a,
  )[0];

  const categoryEntries = Object.entries(displayByCategory).filter(
    ([, v]) => v > 0,
  ) as [ExpenseCategory, number][];

  const renderItem = ({ item }: { item: Expense }) => (
    <ExpenseCard expense={item} />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Giderler</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => router.push('/expense/new')}
              >
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Genel İstatistikler */}
            <View style={styles.statsRow}>
              <StatCard
                label="Toplam Gider"
                value={formatCurrency(totalAmount)}
                icon="💸"
                accentColor="#EF4444"
              />
              {topCategory && topCategory[1] > 0 ? (
                <StatCard
                  label="En Çok Harcama"
                  value={formatCurrency(topCategory[1])}
                  subValue={CATEGORY_LABELS[topCategory[0] as ExpenseCategory] ?? topCategory[0]}
                  icon="📊"
                  accentColor="#F59E0B"
                />
              ) : null}
            </View>

            {/* Dönem Filtresi */}
            <PeriodFilter selected={period} onChange={setPeriod} />

            {/* Dönem Toplam */}
            {period !== 'all' && (
              <View style={styles.periodSummary}>
                <Text style={styles.periodLabel}>Dönem Toplam</Text>
                <Text style={styles.periodValue}>{formatCurrency(periodTotal)}</Text>
              </View>
            )}

            {/* Kategori Gruplandırma */}
            <TouchableOpacity
              style={styles.categoryToggle}
              onPress={() => setShowCategories((v) => !v)}
              activeOpacity={0.8}
            >
              <Text style={styles.categoryToggleText}>
                {showCategories ? '▲' : '▼'} Kategorilere Göre
              </Text>
            </TouchableOpacity>

            {showCategories && categoryEntries.length > 0 && (
              <View style={styles.categoryList}>
                {categoryEntries.map(([cat, amount]) => (
                  <View key={cat} style={styles.categoryRow}>
                    <Text style={styles.categoryName}>
                      {CATEGORY_LABELS[cat] ?? cat}
                    </Text>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(amount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>Gider Listesi</Text>
          </>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💼</Text>
              <Text style={styles.emptyText}>Bu dönemde gider kaydı yok</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
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
    backgroundColor: '#EF4444',
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  periodValue: { color: '#EF4444', fontWeight: '700', fontSize: 16 },
  categoryToggle: {
    paddingVertical: 8,
    marginBottom: 4,
  },
  categoryToggleText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryList: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: { color: '#CBD5E1', fontSize: 13 },
  categoryAmount: { color: '#F1F5F9', fontWeight: '600', fontSize: 13 },
  sectionTitle: {
    color: '#F1F5F9',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  separator: { height: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#64748B', fontSize: 15 },
});
