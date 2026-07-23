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
import { Card } from '@components/ui/Card';
import { StatCard } from '@components/ui/StatCard';
import { PeriodFilter, type Period } from '@components/ui/PeriodFilter';
import { useIncome } from '@hooks/useIncome';
import { useVehicles } from '@hooks/useVehicles';
import { useIncomeStore } from '@stores/incomeStore';
import { isInPeriod } from '@utils/dateHelpers';
import { formatCurrency, formatDate } from '@utils/formatters';
import type { IncomeEntry, IncomeSource } from '@/types';

const SOURCE_ICONS: Record<IncomeSource, string> = {
  trip: '🚖',
  bonus: '🎁',
  other: '💼',
};

const SOURCE_LABELS: Record<IncomeSource, string> = {
  trip: 'Sefer',
  bonus: 'Bonus',
  other: 'Diğer',
};

function IncomeCard({ entry }: { entry: IncomeEntry }) {
  const { deleteEntry } = useIncomeStore();
  const source: IncomeSource = (entry.source as IncomeSource) ?? 'other';

  const handleDelete = () => {
    Alert.alert(
      'Kaydı Sil',
      `${SOURCE_LABELS[source]} gelirini (${formatCurrency(entry.amount)}) silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => deleteEntry(entry.id),
        },
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
          <Text style={styles.cardSource}>{SOURCE_LABELS[source] ?? source}</Text>
          {entry.description ? (
            <Text style={styles.cardDescription} numberOfLines={1}>
              {entry.description}
            </Text>
          ) : null}
          <Text style={styles.cardDate}>{formatDate(entry.date)}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardAmount}>{formatCurrency(entry.amount)}</Text>
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

export default function IncomeScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('all');
  const { activeVehicle } = useVehicles();

  const { entries, totalAmount, isLoading } = useIncome(activeVehicle?.id);

  // Dönem filtresi
  const filteredEntries = useMemo(() => {
    if (period === 'all') return entries;
    return entries.filter((e) => isInPeriod(e.date, period));
  }, [entries, period]);

  const periodTotal = useMemo(
    () => filteredEntries.reduce((sum, e) => sum + e.amount, 0),
    [filteredEntries],
  );

  const renderItem = ({ item }: { item: IncomeEntry }) => (
    <IncomeCard entry={item} />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Gelirler</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => router.push('/income/new')}
              >
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Genel İstatistikler */}
            <StatCard
              label="Toplam Gelir"
              value={formatCurrency(totalAmount)}
              icon="💵"
              accentColor="#22C55E"
              style={styles.totalCard}
            />

            {/* Dönem Filtresi */}
            <PeriodFilter selected={period} onChange={setPeriod} />

            {/* Dönem Toplam */}
            {period !== 'all' && (
              <View style={styles.periodSummary}>
                <Text style={styles.periodLabel}>Dönem Toplam</Text>
                <Text style={styles.periodValue}>{formatCurrency(periodTotal)}</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Gelir Listesi</Text>
          </>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💵</Text>
              <Text style={styles.emptyText}>Bu dönemde gelir kaydı yok</Text>
              <TouchableOpacity
                style={styles.addFirstBtn}
                onPress={() => router.push('/income/new')}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={16} color="#22C55E" />
                <Text style={styles.addFirstBtnText}>İlk Geliri Ekle</Text>
              </TouchableOpacity>
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
    backgroundColor: '#22C55E',
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalCard: { marginBottom: 12 },
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
  periodValue: { color: '#22C55E', fontWeight: '700', fontSize: 16 },
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
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#22C55E20',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#22C55E40',
  },
  addFirstBtnText: { color: '#22C55E', fontSize: 14, fontWeight: '600' },

  // IncomeCard styles
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
  cardAmount: { color: '#22C55E', fontWeight: '700', fontSize: 16 },
  deleteBtn: { padding: 2 },
});
